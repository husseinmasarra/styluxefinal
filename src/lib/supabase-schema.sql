-- STYLUXE LUXURY STORE - SUPABASE DATABASE SCHEMA

-- 1. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'STYLUXE',
  tagline TEXT DEFAULT 'High-Fashion International Designer Brands',
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  active_currency TEXT DEFAULT 'USD',
  lbp_rate NUMERIC DEFAULT 89500,
  eur_rate NUMERIC DEFAULT 0.92,
  tax_rate_percent NUMERIC DEFAULT 0,
  free_shipping_threshold_usd NUMERIC DEFAULT 500,
  default_shipping_fee_usd NUMERIC DEFAULT 25,
  admin_pin TEXT DEFAULT '1234',
  receipt_header TEXT,
  receipt_footer TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. BRANDS
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('men', 'women', 'kids', 'all')),
  image_url TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT true,
  display_order INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. HOMEPAGE CARDS
CREATE TABLE IF NOT EXISTS public.homepage_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  department TEXT DEFAULT 'all',
  cta_text TEXT DEFAULT 'DISCOVER',
  link_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  department TEXT,
  parent_id TEXT,
  display_order INT DEFAULT 1
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('men', 'women', 'kids')),
  category TEXT NOT NULL,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL,
  brand_name TEXT,
  price NUMERIC NOT NULL,
  sale_price NUMERIC,
  sku TEXT UNIQUE NOT NULL,
  stock_per_size JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_stock INT DEFAULT 0,
  colors TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  total_orders INT DEFAULT 0,
  total_spent_usd NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  city TEXT,
  country TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_usd NUMERIC NOT NULL,
  discount_usd NUMERIC DEFAULT 0,
  shipping_fee_usd NUMERIC DEFAULT 0,
  total_usd NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchange_rate NUMERIC DEFAULT 1,
  total_in_currency NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cod',
  is_pos_sale BOOLEAN DEFAULT false,
  cashier_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  notes TEXT
);

-- 9. STAFF
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'cashier',
  status TEXT DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. INVOICES
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount_usd NUMERIC NOT NULL,
  status TEXT DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
