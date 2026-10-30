import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Category, Brand, HomepageCard, MenuItem, StoreSettings, Order, OrderStatus } from './types';

export const SUPABASE_CONFIG = {
  url: 'https://vhwhwoctbkyglbzslazq.supabase.co',
  anonKey: 'sb_publishable_8Ijs548ZthKlut9oi-D7Ww_MhOsaaQo',
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient {
  // Clean up any stale/expired tokens or corrupted keys in browser localStorage
  if (typeof window !== 'undefined') {
    try {
      const savedKey = localStorage.getItem('styluxe_supabase_key');
      const savedUrl = localStorage.getItem('styluxe_supabase_url');
      if (savedUrl && !savedUrl.includes('vhwhwoctbkyglbzslazq')) {
        localStorage.removeItem('styluxe_supabase_url');
      }
      if (savedKey && savedKey !== SUPABASE_CONFIG.anonKey) {
        localStorage.removeItem('styluxe_supabase_key');
      }
      // Remove any stale auth tokens that cause PostgREST 401 JWT errors
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
          localStorage.removeItem(k);
        }
      }
    } catch (_) {}
  }

  const url =
    customUrl ||
    (typeof window !== 'undefined' ? localStorage.getItem('styluxe_supabase_url') : null) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    SUPABASE_CONFIG.url;

  const key =
    customKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('styluxe_supabase_key') : null) ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    SUPABASE_CONFIG.anonKey;

  const resolvedUrl = (url && url.trim().length > 10) ? url.trim() : SUPABASE_CONFIG.url;
  const resolvedKey = (key && key.trim().length > 15) ? key.trim() : SUPABASE_CONFIG.anonKey;

  if (!supabaseInstance || customUrl || customKey) {
    supabaseInstance = createClient(resolvedUrl, resolvedKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { error } = await client.from('products').select('id').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected and verified Supabase cloud database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed.' };
  }
}

// -------------------------------------------------------------
// PULL / FETCH ALL DATA FROM SUPABASE CLOUD (WITH CACHING & DEDUPLICATION)
// -------------------------------------------------------------
export interface FetchCloudDataResult {
  hasData: boolean;
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
  cards?: HomepageCard[];
  menuItems?: MenuItem[];
  settings?: StoreSettings;
}

let cachedCloudData: FetchCloudDataResult | null = null;
let lastCloudFetchTime = 0;
const CLOUD_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL for blazing-fast navigation
let inFlightCloudFetchPromise: Promise<FetchCloudDataResult> | null = null;

export function invalidateSupabaseCache(): void {
  cachedCloudData = null;
  lastCloudFetchTime = 0;
}

export async function fetchSupabaseCloudData(forceRefresh = false): Promise<FetchCloudDataResult> {
  const now = Date.now();
  if (!forceRefresh && cachedCloudData && (now - lastCloudFetchTime < CLOUD_CACHE_TTL_MS)) {
    return cachedCloudData;
  }

  if (!forceRefresh && inFlightCloudFetchPromise) {
    return inFlightCloudFetchPromise;
  }

  inFlightCloudFetchPromise = (async () => {
    try {
      const client = getSupabaseClient();
      const PRODUCT_COLUMNS = 'id, title, slug, department, category, brand_id, brand_name, price, sale_price, sku, stock_per_size, total_stock, colors, images, description, is_featured, is_new_arrival, updated_at, data';
      const PRODUCT_COLUMNS_LIGHT = 'id, title, slug, department, category, brand_id, brand_name, price, sale_price, sku, stock_per_size, total_stock, colors, images, is_featured, is_new_arrival, updated_at, data';

      const [productsRes, categoriesRes, brandsRes, cardsRes, menuRes, settingsRes] = await Promise.all([
        client.from('products').select(PRODUCT_COLUMNS),
        client.from('categories').select('*').order('display_order', { ascending: true }),
        client.from('brands').select('*'),
        client.from('homepage_cards').select('*').order('display_order', { ascending: true }),
        client.from('menu_items').select('*').order('display_order', { ascending: true }),
        client.from('store_settings').select('*').eq('id', 'primary').maybeSingle(),
      ]);

      let rawProductData: any[] | null = (productsRes.data as any[] | null);
      let productsFetchError = !!productsRes.error;
      if ((productsRes.error || !rawProductData) && !categoriesRes.error) {
        console.warn('Primary products fetch failed, attempting lightweight fetch:', productsRes.error?.message);
        const retry = await client.from('products').select(PRODUCT_COLUMNS_LIGHT);
        if (retry.data && retry.data.length > 0) {
          rawProductData = retry.data as any[];
          productsFetchError = false;
        }
      }

      // Check if cloud query succeeded
      if (productsFetchError && categoriesRes.error) return { hasData: false };

      const products: Product[] | undefined = (!productsFetchError && rawProductData) ? rawProductData.map((row: any) => ({
        ...(row.data || {}),
        id: row.id,
        title: row.title || row.data?.title || 'Product',
        slug: row.slug || row.id,
        department: (row.department || row.data?.department || row.data?.gender || 'women').toLowerCase(),
        category: row.category || row.data?.category || 'General',
        brandId: row.brand_id || row.data?.brandId || '',
        brandName: row.brand_name || row.data?.brandName || '',
        price: Number(row.price ?? row.data?.price) || 0,
        salePrice: row.sale_price ? Number(row.sale_price) : (row.data?.salePrice ? Number(row.data?.salePrice) : undefined),
        sku: row.sku || row.id,
        stockPerSize: row.stock_per_size || row.data?.stockPerSize || {},
        totalStock: Number(row.total_stock ?? row.data?.totalStock) || 0,
        colors: row.colors || row.data?.colors || [],
        images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (row.data?.images || []),
        description: row.description || row.data?.description || '',
        shortDescription: row.short_description || row.data?.shortDescription || undefined,
        season: row.season || row.data?.season || 'All Seasons',
        isFeatured: !!(row.is_featured ?? row.data?.isFeatured),
        isNewArrival: !!(row.is_new_arrival ?? row.data?.isNewArrival ?? true),
        createdAt: row.created_at || row.updated_at || row.data?.createdAt || new Date().toISOString(),
      })) : undefined;

      const categories: Category[] = (categoriesRes.data || []).map((row: any) => {
        const rawSubs = row.sub_categories || row.data?.subCategories || (row.data && row.data.sub_categories) || (row.data && row.data.subcategories) || [];
        const parentDept = (row.department || row.data?.department || 'all').toLowerCase();
        const normalizedSubs = rawSubs.map((sub: any) => ({
          ...sub,
          department: sub.department || parentDept
        }));

        return {
          ...(row.data || {}),
          id: row.id,
          name: row.name || row.data?.name || 'Category',
          slug: row.slug || row.data?.slug || row.id,
          department: parentDept,
          imageUrl: row.image_url || row.data?.imageUrl,
          description: row.description || row.data?.description,
          isFeatured: row.is_featured !== false && row.data?.isFeatured !== false,
          displayOrder: Number(row.display_order ?? row.data?.displayOrder) || 1,
          subCategories: normalizedSubs,
        };
      });

      const brands: Brand[] = (brandsRes.data || []).map((row: any) => ({
        ...(row.data || {}),
        id: row.id,
        name: row.name,
        slug: row.slug || row.id,
        logoUrl: row.logo_url || '',
        bannerUrl: row.banner_url,
        description: row.description,
        isFeatured: row.is_featured !== false,
      }));

      const cards: HomepageCard[] = (cardsRes.data || []).map((row: any) => ({
        ...(row.data || {}),
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        department: row.department || 'all',
        ctaText: row.cta_text || 'DISCOVER',
        linkUrl: row.link_url || '',
        imageUrl: row.image_url || '',
        active: row.active !== false,
        displayOrder: Number(row.display_order) || 1,
      }));

      const menuItems: MenuItem[] = (menuRes.data || []).map((row: any) => ({
        ...(row.data || {}),
        id: row.id,
        title: row.title,
        url: row.url,
        department: row.department,
        parentId: row.parent_id,
        displayOrder: Number(row.display_order) || 1,
      }));

      const settings: StoreSettings | undefined = settingsRes.data?.settings;

      const result: FetchCloudDataResult = {
        hasData: true,
        products,
        categories,
        brands,
        cards,
        menuItems,
        settings,
      };

      cachedCloudData = result;
      lastCloudFetchTime = Date.now();
      return result;
    } catch (err) {
      console.warn('Supabase fetch error:', err);
      return { hasData: false };
    } finally {
      inFlightCloudFetchPromise = null;
    }
  })();

  return inFlightCloudFetchPromise;
}

// -------------------------------------------------------------
// CLOUD MUTATIONS (ASYNC BACKGROUND SYNC)
// -------------------------------------------------------------
export async function cloudSaveProduct(p: Product) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    const { images: _unusedImages, colorImages: _unusedColor, ...cleanData } = p;
    await client.from('products').upsert({
      id: p.id,
      title: p.title,
      slug: p.slug || p.id,
      department: p.department || 'women',
      category: p.category,
      brand_id: p.brandId || null,
      brand_name: p.brandName || null,
      price: Number(p.price) || 0,
      sale_price: p.salePrice ? Number(p.salePrice) : null,
      sku: p.sku || p.id,
      stock_per_size: p.stockPerSize || {},
      total_stock: Number(p.totalStock) || 0,
      colors: p.colors || [],
      images: p.images || [],
      description: p.description || '',
      is_featured: !!p.isFeatured,
      is_new_arrival: !!p.isNewArrival,
      data: cleanData,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Cloud save product error:', err);
  }
}

export async function cloudDeleteProduct(id: string) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('products').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete product error:', err);
  }
}

export async function cloudSaveCategory(c: Category) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('categories').upsert({
      id: c.id,
      name: c.name,
      slug: c.slug || c.id,
      department: c.department || 'all',
      image_url: c.imageUrl || null,
      description: c.description || null,
      is_featured: c.isFeatured !== false,
      display_order: Number(c.displayOrder) || 1,
      data: c,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Cloud save category error:', err);
  }
}

export async function cloudDeleteCategory(id: string) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('categories').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete category error:', err);
  }
}

export async function cloudSaveCard(card: HomepageCard) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('homepage_cards').upsert({
      id: card.id,
      title: card.title,
      subtitle: card.subtitle || null,
      department: card.department || 'all',
      cta_text: card.ctaText || 'DISCOVER',
      link_url: card.linkUrl || '',
      image_url: card.imageUrl || '',
      active: card.active !== false,
      display_order: Number(card.displayOrder) || 1,
      data: card,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Cloud save card error:', err);
  }
}

export async function cloudDeleteCard(id: string) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('homepage_cards').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete card error:', err);
  }
}

export async function cloudSaveBrand(b: Brand) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('brands').upsert({
      id: b.id,
      name: b.name,
      slug: b.slug || b.id,
      logo_url: b.logoUrl || null,
      banner_url: b.bannerUrl || null,
      description: b.description || null,
      is_featured: b.isFeatured !== false,
      data: b,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Cloud save brand error:', err);
  }
}

export async function cloudDeleteBrand(id: string) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('brands').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete brand error:', err);
  }
}

export async function cloudSaveSettings(s: StoreSettings) {
  invalidateSupabaseCache();
  try {
    const client = getSupabaseClient();
    await client.from('store_settings').upsert({
      id: 'primary',
      settings: s,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Cloud save settings error:', err);
  }
}

export async function cloudSaveOrder(order: Order) {
  try {
    const client = getSupabaseClient();
    await client.from('orders').upsert({
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      total_usd: Number(order.totalUSD) || 0,
      status: order.status || 'pending',
      data: order,
    });
  } catch (err) {
    console.warn('Cloud save order error:', err);
  }
}

export async function cloudDeleteOrder(orderId: string) {
  try {
    const client = getSupabaseClient();
    await client.from('orders').delete().eq('id', orderId);
  } catch (err) {
    console.warn('Cloud delete order error:', err);
  }
}

export async function fetchCustomerOrdersFromCloud(identifier: string): Promise<Order[]> {
  if (!identifier || !identifier.trim()) return [];
  try {
    const client = getSupabaseClient();
    const clean = identifier.trim();
    const numericOnly = clean.replace(/[^0-9]/g, '');

    let query = client.from('orders').select('*');
    if (numericOnly.length >= 6) {
      query = query.or(`customer_phone.ilike.%${numericOnly}%,order_number.ilike.%${clean}%`);
    } else {
      query = query.or(`order_number.ilike.%${clean}%,customer_name.ilike.%${clean}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) {
      console.warn('Cloud fetch customer orders error:', error);
      return [];
    }

    return data.map((row: any) => {
      const orderData = row.data || {};
      return {
        id: row.id,
        orderNumber: row.order_number || orderData.orderNumber || 'STX-00000',
        customerName: row.customer_name || orderData.customerName || 'Customer',
        customerEmail: orderData.customerEmail || '',
        customerPhone: row.customer_phone || orderData.customerPhone || '',
        shippingAddress: orderData.shippingAddress || '',
        city: orderData.city || 'Beirut',
        country: orderData.country || 'Lebanon',
        items: orderData.items || [],
        subtotalUSD: Number(orderData.subtotalUSD ?? row.total_usd) || 0,
        discountUSD: Number(orderData.discountUSD) || 0,
        shippingFeeUSD: Number(orderData.shippingFeeUSD) || 0,
        totalUSD: Number(row.total_usd ?? orderData.totalUSD) || 0,
        currency: orderData.currency || 'USD',
        exchangeRate: Number(orderData.exchangeRate) || 1,
        totalInCurrency: Number(orderData.totalInCurrency ?? row.total_usd) || 0,
        status: (row.status || orderData.status || 'pending') as OrderStatus,
        paymentMethod: orderData.paymentMethod || 'cod',
        customerTier: orderData.customerTier,
        createdAt: orderData.createdAt || row.created_at || new Date().toISOString(),
        notes: orderData.notes || '',
      };
    });
  } catch (err) {
    console.warn('fetchCustomerOrdersFromCloud exception:', err);
    return [];
  }
}

// -------------------------------------------------------------
// BULK FULL SYNC
// -------------------------------------------------------------
export async function syncLocalDataToSupabase(
  data: {
    products: Product[];
    categories: Category[];
    brands: Brand[];
    orders: Order[];
    cards?: HomepageCard[];
    settings: StoreSettings;
  },
  client: SupabaseClient = getSupabaseClient()
): Promise<{ success: boolean; count: number; error?: string }> {
  invalidateSupabaseCache();
  try {
    let synced = 0;

    // Categories
    if (data.categories.length > 0) {
      await client.from('categories').upsert(
        data.categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.id,
          department: c.department || 'all',
          image_url: c.imageUrl || null,
          description: c.description || null,
          is_featured: c.isFeatured !== false,
          display_order: Number(c.displayOrder) || 1,
          data: c,
        }))
      );
      synced += data.categories.length;
    }

    // Brands
    if (data.brands.length > 0) {
      await client.from('brands').upsert(
        data.brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug || b.id,
          logo_url: b.logoUrl || null,
          banner_url: b.bannerUrl || null,
          description: b.description || null,
          is_featured: b.isFeatured !== false,
          data: b,
        }))
      );
      synced += data.brands.length;
    }

    // Products
    if (data.products.length > 0) {
      await client.from('products').upsert(
        data.products.map((p) => {
          const { images: _unused, colorImages: _unusedColor, ...cleanData } = p;
          return {
            id: p.id,
            title: p.title,
            slug: p.slug || p.id,
            department: p.department || 'women',
            category: p.category,
            brand_id: p.brandId || null,
            brand_name: p.brandName || null,
            price: Number(p.price) || 0,
            sale_price: p.salePrice ? Number(p.salePrice) : null,
            sku: p.sku || p.id,
            stock_per_size: p.stockPerSize || {},
            total_stock: Number(p.totalStock) || 0,
            colors: p.colors || [],
            images: p.images || [],
            description: p.description || '',
            is_featured: !!p.isFeatured,
            is_new_arrival: !!p.isNewArrival,
            data: cleanData,
          };
        })
      );
      synced += data.products.length;
    }

    // Cards
    if (data.cards && data.cards.length > 0) {
      await client.from('homepage_cards').upsert(
        data.cards.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle || null,
          department: c.department || 'all',
          cta_text: c.ctaText || 'DISCOVER',
          link_url: c.linkUrl || '',
          image_url: c.imageUrl || '',
          active: c.active !== false,
          display_order: Number(c.displayOrder) || 1,
          data: c,
        }))
      );
      synced += data.cards.length;
    }

    // Settings
    if (data.settings) {
      await client.from('store_settings').upsert({
        id: 'primary',
        settings: data.settings,
        updated_at: new Date().toISOString(),
      });
      synced += 1;
    }

    return { success: true, count: synced };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync failed' };
  }
}
