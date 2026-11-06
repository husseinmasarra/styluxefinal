import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Meta Conversions API (CAPI) Server-Side Route for STYLUXE
 * Dispatches server-to-server tracking events directly to Meta Graph API v19.0 / v20.0
 * Supports strict Women & Men Pixel routing, SHA-256 data normalization, and Deduplication with browser pixel.
 */

// Helper: SHA-256 Hash generator for normalized PII
function hashSha256(val?: string | null): string | undefined {
  if (!val || typeof val !== 'string') return undefined;
  const clean = val.trim().toLowerCase();
  if (!clean) return undefined;
  // If already a 64-char hex string (already hashed), don't re-hash
  if (/^[a-f0-9]{64}$/.test(clean)) return clean;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

// Helper: Normalize Phone Number for Meta CAPI
function normalizeAndHashPhone(phoneStr?: string | null): string | undefined {
  if (!phoneStr) return undefined;
  let digits = String(phoneStr).replace(/[^0-9]/g, '');
  if (!digits) return undefined;

  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // Prepend Lebanon country code 961 if missing
  if (digits.startsWith('961')) {
    // Already has 961
  } else if (digits.startsWith('0') && (digits.length === 8 || digits.length === 7)) {
    digits = '961' + digits.substring(1);
  } else if (digits.length === 7 && digits.startsWith('3')) {
    digits = '961' + digits;
  } else if (digits.length === 8) {
    digits = '961' + digits;
  } else if (digits.length <= 8) {
    digits = '961' + digits;
  }

  return hashSha256(digits);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      eventName,
      eventId,
      department = 'both',
      eventSourceUrl,
      userData = {},
      customData = {},
      testEventCode,
      accessToken: customToken,
      pixelId: customPixelId,
    } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'Missing eventName' }, { status: 400 });
    }

    // Determine Pixel ID(s)
    const womenPixelId = body.womenMetaPixelId || process.env.WOMEN_META_PIXEL_ID || '1128799242995614';
    const menPixelId = body.menMetaPixelId || process.env.MEN_META_PIXEL_ID || '1644089083922873';
    const masterPixelId = body.masterMetaPixelId || process.env.META_PIXEL_ID;

    const targetPixelIds: string[] = [];
    if (customPixelId) {
      targetPixelIds.push(customPixelId);
    } else if (department === 'women') {
      if (womenPixelId) targetPixelIds.push(womenPixelId);
      else if (masterPixelId) targetPixelIds.push(masterPixelId);
    } else if (department === 'men') {
      if (menPixelId) targetPixelIds.push(menPixelId);
      else if (masterPixelId) targetPixelIds.push(masterPixelId);
    } else {
      // 'both' or store-wide
      if (womenPixelId) targetPixelIds.push(womenPixelId);
      if (menPixelId && menPixelId !== womenPixelId) targetPixelIds.push(menPixelId);
      if (masterPixelId && !targetPixelIds.includes(masterPixelId)) targetPixelIds.push(masterPixelId);
    }

    // Access Token resolution
    const token =
      customToken ||
      body.metaCapiAccessToken ||
      (department === 'women' ? (body.womenMetaCapiAccessToken || process.env.WOMEN_META_CAPI_TOKEN) : undefined) ||
      (department === 'men' ? (body.menMetaCapiAccessToken || process.env.MEN_META_CAPI_TOKEN) : undefined) ||
      process.env.META_CAPI_ACCESS_TOKEN ||
      process.env.FACEBOOK_CONVERSIONS_API_TOKEN;

    if (!token) {
      console.warn('[Meta CAPI] No Access Token configured. Event queued but skipped dispatch.');
      return NextResponse.json({
        success: false,
        warning: 'Meta CAPI Access Token is not set. Please configure it in Admin Settings > Tracking Pixels.',
        eventName,
        eventId,
      }, { status: 200 });
    }

    // Extract client IP and User Agent from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = userData.clientIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || undefined;
    const clientUserAgent = userData.clientUserAgent || req.headers.get('user-agent') || undefined;

    // Cookie values (_fbp and _fbc)
    const fbp = userData.fbp || req.cookies.get('_fbp')?.value;
    const fbc = userData.fbc || req.cookies.get('_fbc')?.value;

    // Construct Meta normalized User Data object
    const metaUserData: Record<string, any> = {};
    if (userData.email) metaUserData.em = [hashSha256(userData.email)];
    if (userData.phone) metaUserData.ph = [normalizeAndHashPhone(userData.phone)];
    if (userData.firstName) metaUserData.fn = [hashSha256(userData.firstName)];
    if (userData.lastName) metaUserData.ln = [hashSha256(userData.lastName)];
    if (userData.city) metaUserData.ct = [hashSha256(userData.city)];
    if (userData.country) metaUserData.country = [hashSha256(userData.country || 'lb')];
    if (clientIp) metaUserData.client_ip_address = clientIp;
    if (clientUserAgent) metaUserData.client_user_agent = clientUserAgent;
    if (fbp) metaUserData.fbp = fbp;
    if (fbc) metaUserData.fbc = fbc;

    const eventTime = Math.floor(Date.now() / 1000);
    const resolvedEventId = eventId || `capi-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const effectiveTestCode = testEventCode || body.metaCapiTestEventCode || process.env.META_CAPI_TEST_CODE;

    // Build event payload
    const eventPayload: Record<string, any> = {
      event_name: eventName,
      event_time: eventTime,
      event_id: resolvedEventId,
      event_source_url: eventSourceUrl || req.headers.get('referer') || 'https://www.styluxelb.com',
      action_source: 'website',
      user_data: metaUserData,
      custom_data: {
        currency: customData.currency || 'USD',
        value: typeof customData.value === 'number' ? customData.value : undefined,
        content_name: customData.content_name || customData.title,
        content_type: customData.content_type || 'product',
        content_ids: customData.content_ids || (customData.id ? [String(customData.id)] : undefined),
        contents: customData.contents,
        order_id: customData.order_id || customData.orderNumber,
        num_items: customData.num_items || customData.numItems,
      },
    };

    // Clean undefined values
    Object.keys(eventPayload.custom_data).forEach(
      key => eventPayload.custom_data[key] === undefined && delete eventPayload.custom_data[key]
    );

    const results = [];

    // Dispatch to each target pixel
    for (const pixelId of targetPixelIds) {
      try {
        const metaApiUrl = `https://graph.facebook.com/v19.0/${pixelId}/events`;
        const postData: Record<string, any> = {
          data: [eventPayload],
          access_token: token,
        };

        if (effectiveTestCode) {
          postData.test_event_code = effectiveTestCode;
        }

        const metaResponse = await fetch(metaApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        const metaJson = await metaResponse.json();

        results.push({
          pixelId,
          status: metaResponse.status,
          success: metaResponse.ok,
          metaResponse: metaJson,
        });

        if (!metaResponse.ok) {
          console.error(`[Meta CAPI Error] Pixel ${pixelId}:`, metaJson);
        } else {
          console.log(`[Meta CAPI Success] Event ${eventName} (${resolvedEventId}) sent to Pixel ${pixelId}:`, metaJson);
        }
      } catch (err: any) {
        console.error(`[Meta CAPI Exception] Failed to send to Pixel ${pixelId}:`, err.message);
        results.push({
          pixelId,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: results.some(r => r.success),
      eventName,
      eventId: resolvedEventId,
      results,
    });
  } catch (error: any) {
    console.error('[Meta CAPI Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET method for testing connection from Admin Settings or Browser
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || process.env.META_CAPI_ACCESS_TOKEN;
  const pixelId = searchParams.get('pixelId') || '1128799242995614';
  const testCode = searchParams.get('testCode') || undefined;

  if (!token) {
    return NextResponse.json({
      status: 'unconfigured',
      message: 'No Meta Conversions API Access Token provided. Please provide a token in query or configure in Admin Settings.',
    });
  }

  try {
    const testPayload: Record<string, any> = {
      data: [
        {
          event_name: 'TestConnection',
          event_time: Math.floor(Date.now() / 1000),
          event_id: `test-conn-${Date.now()}`,
          event_source_url: 'https://www.styluxelb.com/admin',
          action_source: 'website',
          user_data: {
            client_user_agent: req.headers.get('user-agent') || 'STYLUXE CAPI Tester',
            country: [crypto.createHash('sha256').update('lb').digest('hex')],
          },
          custom_data: {
            currency: 'USD',
            value: 1.0,
          },
        },
      ],
      access_token: token,
    };

    if (testCode) {
      testPayload.test_event_code = testCode;
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    const data = await res.json();
    return NextResponse.json({
      success: res.ok,
      status: res.status,
      pixelId,
      metaResponse: data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
