import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Category, Brand, HomepageCard, MenuItem, StoreSettings, Order } from './types';

export const SUPABASE_CONFIG = {
  url: 'https://vhwhwoctbkyglbzslazq.supabase.co',
  anonKey: 'sb_publishable_8Ijs548ZthKlut9oi-D7Ww_MhOsaaQo',
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient {
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

  if (!supabaseInstance || customUrl || customKey) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
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
// PULL / FETCH ALL DATA FROM SUPABASE CLOUD
// -------------------------------------------------------------
export async function fetchSupabaseCloudData(): Promise<{
  hasData: boolean;
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
  cards?: HomepageCard[];
  menuItems?: MenuItem[];
  settings?: StoreSettings;
}> {
  try {
    const client = getSupabaseClient();
    const [productsRes, categoriesRes, brandsRes, cardsRes, menuRes, settingsRes] = await Promise.all([
      client.from('products').select('*'),
      client.from('categories').select('*').order('display_order', { ascending: true }),
      client.from('brands').select('*'),
      client.from('homepage_cards').select('*').order('display_order', { ascending: true }),
      client.from('menu_items').select('*').order('display_order', { ascending: true }),
      client.from('store_settings').select('*').eq('id', 'primary').maybeSingle(),
    ]);

    // Check if cloud has been initialized
    const hasAnyTable = !productsRes.error && !categoriesRes.error;
    if (!hasAnyTable) return { hasData: false };

    const products: Product[] = (productsRes.data || []).map((row: any) => ({
      ...(row.data || {}),
      id: row.id,
      title: row.title,
      slug: row.slug || row.id,
      department: row.department || 'women',
      category: row.category,
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: Number(row.price) || 0,
      salePrice: row.sale_price ? Number(row.sale_price) : undefined,
      sku: row.sku || row.id,
      stockPerSize: row.stock_per_size || {},
      totalStock: Number(row.total_stock) || 0,
      colors: row.colors || [],
      images: row.images || [],
      description: row.description || '',
      isFeatured: !!row.is_featured,
      isNewArrival: !!row.is_new_arrival,
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const categories: Category[] = (categoriesRes.data || []).map((row: any) => ({
      ...(row.data || {}),
      id: row.id,
      name: row.name,
      slug: row.slug || row.id,
      department: row.department || 'all',
      imageUrl: row.image_url,
      description: row.description,
      isFeatured: row.is_featured !== false,
      displayOrder: Number(row.display_order) || 1,
    }));

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

    return {
      hasData: true,
      products,
      categories,
      brands,
      cards,
      menuItems,
      settings,
    };
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return { hasData: false };
  }
}

// -------------------------------------------------------------
// CLOUD MUTATIONS (ASYNC BACKGROUND SYNC)
// -------------------------------------------------------------
export async function cloudSaveProduct(p: Product) {
  try {
    const client = getSupabaseClient();
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
      data: p,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Cloud save product error:', err);
  }
}

export async function cloudDeleteProduct(id: string) {
  try {
    const client = getSupabaseClient();
    await client.from('products').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete product error:', err);
  }
}

export async function cloudSaveCategory(c: Category) {
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
  try {
    const client = getSupabaseClient();
    await client.from('categories').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete category error:', err);
  }
}

export async function cloudSaveCard(card: HomepageCard) {
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
  try {
    const client = getSupabaseClient();
    await client.from('homepage_cards').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete card error:', err);
  }
}

export async function cloudSaveBrand(b: Brand) {
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
  try {
    const client = getSupabaseClient();
    await client.from('brands').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete brand error:', err);
  }
}

export async function cloudSaveSettings(s: StoreSettings) {
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
        data.products.map((p) => ({
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
          data: p,
        }))
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
