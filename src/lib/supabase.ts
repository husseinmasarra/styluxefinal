import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  // 1. Check custom credentials from parameter or admin settings
  let url = customUrl || (typeof window !== 'undefined' ? localStorage.getItem('styluxe_supabase_url') : null);
  let key = customKey || (typeof window !== 'undefined' ? localStorage.getItem('styluxe_supabase_key') : null);

  // 2. Fallback to process.env if available
  if (!url) url = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  if (!key) key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;

  if (!url || !key) return null;

  try {
    if (!supabaseInstance || customUrl || customKey) {
      supabaseInstance = createClient(url, key);
    }
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    // Simple ping query on store_settings or auth
    const { error } = await client.from('store_settings').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, but connection authenticated
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: run supabase-schema.sql in your Supabase SQL editor to create tables)',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected and verified Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Please check your URL and API Key.' };
  }
}

// Sync local store data to Supabase
export async function syncLocalDataToSupabase(
  data: {
    products: any[];
    categories: any[];
    brands: any[];
    orders: any[];
    settings: any;
  },
  client: SupabaseClient
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let synced = 0;

    // 1. Sync Categories
    if (data.categories.length > 0) {
      const { error } = await client.from('categories').upsert(
        data.categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.id,
          department: c.department || 'all',
          image_url: c.imageUrl,
          description: c.description,
        }))
      );
      if (!error) synced += data.categories.length;
    }

    // 2. Sync Brands
    if (data.brands.length > 0) {
      const { error } = await client.from('brands').upsert(
        data.brands.map(b => ({
          id: b.id,
          name: b.name,
          slug: b.slug || b.id,
          logo_url: b.logoUrl,
          banner_url: b.bannerUrl,
          description: b.description,
        }))
      );
      if (!error) synced += data.brands.length;
    }

    // 3. Sync Products
    if (data.products.length > 0) {
      const { error } = await client.from('products').upsert(
        data.products.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          sale_price: p.salePrice,
          category_id: p.category,
          brand_id: p.brandId,
          department: p.department,
          images: p.images,
          colors: p.colors,
          stock_per_size: p.stockPerSize,
          is_new_arrival: p.isNewArrival,
          is_pre_order: p.isPreOrder,
          pre_order_note: p.preOrderNote,
        }))
      );
      if (!error) synced += data.products.length;
    }

    // 4. Sync Orders
    if (data.orders.length > 0) {
      const { error } = await client.from('orders').upsert(
        data.orders.map(o => ({
          id: o.id,
          order_number: o.orderNumber,
          customer_name: o.customerName,
          customer_email: o.customerEmail,
          customer_phone: o.customerPhone,
          shipping_address: o.shippingAddress,
          city: o.city,
          items: o.items,
          subtotal_usd: o.subtotalUSD,
          discount_usd: o.discountUSD,
          shipping_usd: o.shippingUSD,
          total_usd: o.totalUSD,
          status: o.status,
          payment_method: o.paymentMethod || 'cod',
          notes: o.notes,
        }))
      );
      if (!error) synced += data.orders.length;
    }

    return { success: true, count: synced };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync failed' };
  }
}
