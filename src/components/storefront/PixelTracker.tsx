'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import {
  TrackAddToCartPayload,
  TrackViewContentPayload,
  TrackInitiateCheckoutPayload,
  TrackPurchasePayload,
} from '@/lib/pixelEvents';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    ttq?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    snaptr?: (...args: any[]) => void;
  }
}

export function PixelTracker() {
  const { settings } = useCart();
  const pathname = usePathname();

  const metaInitializedRef = useRef<string | null>(null);
  const tiktokInitializedRef = useRef<string | null>(null);
  const gaInitializedRef = useRef<string | null>(null);
  const snapchatInitializedRef = useRef<string | null>(null);
  const isFirstMountRef = useRef(true);

  // 1. Initialize Meta (Facebook & Instagram) Pixel
  useEffect(() => {
    const pixelId = settings?.metaPixelId?.trim();
    if (!pixelId) return;
    if (metaInitializedRef.current === pixelId) return;

    try {
      if ((window as any)._fbqLoadedFromLayout && (pixelId === '1128799242995614' || pixelId === '1644089083922873')) {
        metaInitializedRef.current = pixelId;
        console.log(`[PixelTracker] Meta Pixel layout instance confirmed: ${pixelId}`);
        return;
      }

      if (!window.fbq) {
        const n: any = function (...args: any[]) {
          if (n.callMethod) {
            n.callMethod.apply(n, args);
          } else {
            n.queue.push(args);
          }
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        window.fbq = n;

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(script);
      }

      window.fbq?.('init', pixelId);
      window.fbq?.('track', 'PageView');
      metaInitializedRef.current = pixelId;
      console.log(`[PixelTracker] Meta Pixel initialized: ${pixelId}`);
    } catch (e) {
      console.error('[PixelTracker] Error initializing Meta Pixel:', e);
    }
  }, [settings?.metaPixelId]);

  // 2. Initialize TikTok Pixel
  useEffect(() => {
    const pixelId = settings?.tiktokPixelId?.trim();
    if (!pixelId) return;
    if (tiktokInitializedRef.current === pixelId) return;

    try {
      if (!window.ttq) {
        const w: any = window;
        const d = document;
        const t = 'ttq';
        w.TiktokAnalyticsObject = t;
        const ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page', 'track', 'identify', 'instances', 'debug', 'on', 'off',
          'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'
        ];
        ttq.setAndDefer = function (target: any, method: string) {
          target[method] = function () {
            target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (let i = 0; i < ttq.methods.length; i++) {
          ttq.setAndDefer(ttq, ttq.methods[i]);
        }
        ttq.instance = function (instanceId: string) {
          const instance = (ttq._i = ttq._i || {})[instanceId] || [];
          for (let i = 0; i < ttq.methods.length; i++) {
            ttq.setAndDefer(instance, ttq.methods[i]);
          }
          return instance;
        };
        ttq.load = function (e: string) {
          const i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          (ttq._i = ttq._i || {})[e] = [];
          (ttq._i[e] as any)._u = i;
          const s = d.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = `${i}?sdkid=${e}&lib=${t}`;
          document.head.appendChild(s);
        };
      }

      window.ttq?.load(pixelId);
      window.ttq?.page();
      tiktokInitializedRef.current = pixelId;
      console.log(`[PixelTracker] TikTok Pixel initialized: ${pixelId}`);
    } catch (e) {
      console.error('[PixelTracker] Error initializing TikTok Pixel:', e);
    }
  }, [settings?.tiktokPixelId]);

  // 3. Initialize Google Analytics / Tag (GA4)
  useEffect(() => {
    const gaId = settings?.googleAnalyticsId?.trim();
    if (!gaId) return;
    if (gaInitializedRef.current === gaId) return;

    try {
      if (!document.getElementById('ga-gtag-script')) {
        const script = document.createElement('script');
        script.id = 'ga-gtag-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
          window.dataLayer?.push(arguments);
        };
        window.gtag('js', new Date());
      }

      window.gtag?.('config', gaId, { page_path: window.location.pathname });
      gaInitializedRef.current = gaId;
      console.log(`[PixelTracker] Google Analytics initialized: ${gaId}`);
    } catch (e) {
      console.error('[PixelTracker] Error initializing Google Analytics:', e);
    }
  }, [settings?.googleAnalyticsId]);

  // 4. Initialize Snapchat Pixel
  useEffect(() => {
    const snapId = settings?.snapchatPixelId?.trim();
    if (!snapId) return;
    if (snapchatInitializedRef.current === snapId) return;

    try {
      if (!window.snaptr) {
        const a: any = function (...args: any[]) {
          if (a.handleRequest) {
            a.handleRequest.apply(a, args);
          } else {
            a.queue.push(args);
          }
        };
        a.queue = [];
        window.snaptr = a;

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://sc-static.net/scevent.min.js';
        document.head.appendChild(script);
      }

      window.snaptr?.('init', snapId);
      window.snaptr?.('track', 'PAGE_VIEW');
      snapchatInitializedRef.current = snapId;
      console.log(`[PixelTracker] Snapchat Pixel initialized: ${snapId}`);
    } catch (e) {
      console.error('[PixelTracker] Error initializing Snapchat Pixel:', e);
    }
  }, [settings?.snapchatPixelId]);

  // 5. Track PageView on route changes
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (metaInitializedRef.current && window.fbq) {
      window.fbq('track', 'PageView');
    }
    if (tiktokInitializedRef.current && window.ttq) {
      window.ttq.page();
    }
    if (gaInitializedRef.current && window.gtag) {
      window.gtag('event', 'page_view', { page_path: pathname });
    }
    if (snapchatInitializedRef.current && window.snaptr) {
      window.snaptr('track', 'PAGE_VIEW');
    }
  }, [pathname]);

  // 6. Listen to custom e-commerce tracking events
  useEffect(() => {
    const handleAddToCart = (e: Event) => {
      const d = (e as CustomEvent<TrackAddToCartPayload>).detail;
      if (!d) return;

      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_name: d.title,
          content_ids: [d.id],
          content_type: 'product',
          value: d.price,
          currency: d.currency || 'USD',
        });
      }
      if (window.ttq) {
        window.ttq.track('AddToCart', {
          content_name: d.title,
          content_id: d.id,
          content_type: 'product',
          value: d.price,
          currency: d.currency || 'USD',
        });
      }
      if (window.gtag) {
        window.gtag('event', 'add_to_cart', {
          currency: d.currency || 'USD',
          value: d.price,
          items: [{ item_id: d.id, item_name: d.title, price: d.price, quantity: d.quantity || 1 }],
        });
      }
      if (window.snaptr) {
        window.snaptr('track', 'ADD_CART', {
          item_ids: [d.id],
          price: d.price,
          currency: d.currency || 'USD',
        });
      }
    };

    const handleViewContent = (e: Event) => {
      const d = (e as CustomEvent<TrackViewContentPayload>).detail;
      if (!d) return;

      if (window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_name: d.title,
          content_ids: [d.id],
          content_type: 'product',
          value: d.price,
          currency: d.currency || 'USD',
        });
      }
      if (window.ttq) {
        window.ttq.track('ViewContent', {
          content_name: d.title,
          content_id: d.id,
          content_type: 'product',
          value: d.price,
          currency: d.currency || 'USD',
        });
      }
      if (window.gtag) {
        window.gtag('event', 'view_item', {
          currency: d.currency || 'USD',
          value: d.price,
          items: [{ item_id: d.id, item_name: d.title, price: d.price }],
        });
      }
    };

    const handleInitiateCheckout = (e: Event) => {
      const d = (e as CustomEvent<TrackInitiateCheckoutPayload>).detail;
      if (!d) return;

      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          num_items: d.numItems,
          value: d.value,
          currency: d.currency || 'USD',
        });
      }
      if (window.ttq) {
        window.ttq.track('InitiateCheckout', {
          value: d.value,
          currency: d.currency || 'USD',
        });
      }
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          value: d.value,
          currency: d.currency || 'USD',
        });
      }
      if (window.snaptr) {
        window.snaptr('track', 'START_CHECKOUT', {
          price: d.value,
          currency: d.currency || 'USD',
        });
      }
    };

    const handlePurchase = (e: Event) => {
      const d = (e as CustomEvent<TrackPurchasePayload>).detail;
      if (!d) return;

      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: d.value,
          currency: d.currency || 'USD',
          content_type: 'product',
          content_ids: d.items.map((i) => i.id),
          num_items: d.items.length,
        });
      }
      if (window.ttq) {
        window.ttq.track('CompletePayment', {
          value: d.value,
          currency: d.currency || 'USD',
          content_type: 'product',
          content_ids: d.items.map((i) => i.id),
        });
      }
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: d.orderNumber,
          value: d.value,
          currency: d.currency || 'USD',
          items: d.items.map((i) => ({
            item_id: i.id,
            item_name: i.title || i.id,
            price: i.price,
            quantity: i.quantity,
          })),
        });
      }
      if (window.snaptr) {
        window.snaptr('track', 'PURCHASE', {
          transaction_id: d.orderNumber,
          price: d.value,
          currency: d.currency || 'USD',
          item_ids: d.items.map((i) => i.id),
        });
      }
    };

    window.addEventListener('styluxe_pixel_add_to_cart', handleAddToCart);
    window.addEventListener('styluxe_pixel_view_content', handleViewContent);
    window.addEventListener('styluxe_pixel_initiate_checkout', handleInitiateCheckout);
    window.addEventListener('styluxe_pixel_purchase', handlePurchase);

    return () => {
      window.removeEventListener('styluxe_pixel_add_to_cart', handleAddToCart);
      window.removeEventListener('styluxe_pixel_view_content', handleViewContent);
      window.removeEventListener('styluxe_pixel_initiate_checkout', handleInitiateCheckout);
      window.removeEventListener('styluxe_pixel_purchase', handlePurchase);
    };
  }, []);

  return null;
}
