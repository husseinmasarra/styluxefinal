export type Department = 'men' | 'women' | 'all' | 'kids';

export interface Product {
  id: string;
  title: string;
  slug: string;
  department: Department;
  category: string; // e.g. "Ready to Wear", "Bags", "Shoes", "Accessories", "Hoodies", "Jackets"
  brandId: string;
  brandName?: string;
  price: number; // in USD
  salePrice?: number; // in USD
  sku: string;
  stockPerSize: {
    [size: string]: number; // e.g. { "S": 10, "M": 15, "L": 8, "XL": 4 }
  };
  totalStock: number;
  colors: string[];
  colorHexes?: Record<string, string>; // e.g. { "Black": "#000000", "Charcoal": "#36454F", "Grey": "#808080" }
  colorImages?: Record<string, string | string[]>; // e.g. { "Black": ["data:image...", "data:image..."], "Red": "data:image..." }
  images: string[];
  description: string;
  shortDescription?: string;
  season?: string; // e.g. "Summer", "Winter", "All Seasons"
  isFeatured: boolean;
  isNewArrival: boolean;
  isPreOrder?: boolean;
  preOrderNote?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl?: string;
  description?: string;
  isFeatured: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  department: Department;
  imageUrl?: string;
  description?: string;
  isFeatured: boolean;
  displayOrder: number;
  subCategories?: Category[];
}

export interface HomepageCard {
  id: string;
  title: string;
  subtitle?: string;
  department: Department;
  ctaText: string;
  linkUrl: string;
  imageUrl: string;
  active: boolean;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  department?: Department;
  parentId?: string | null;
  displayOrder: number;
  isExternal?: boolean;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  brandName?: string;
  size: string;
  color: string;
  priceUSD: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cod' | 'card' | 'cash' | 'pos_cash' | 'pos_card';

export type CustomerTier = 'platinum' | 'gold' | 'silver' | 'bronze';

export interface CustomerTierInfo {
  tier: CustomerTier;
  label: string;
  arabicLabel: string;
  icon: string;
  minSpendUSD: number;
  minOrders: number;
  badgeClass: string;
  perks: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city?: string;
  country?: string;
  items: OrderItem[];
  subtotalUSD: number;
  discountUSD: number;
  shippingFeeUSD: number;
  totalUSD: number;
  currency: 'USD' | 'LBP' | 'EUR';
  exchangeRate: number;
  totalInCurrency: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  isPosSale?: boolean;
  cashierName?: string;
  customerTier?: CustomerTier;
  createdAt: string;
  notes?: string;
}

export type CustomerDepartment = 'men' | 'women' | 'both';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  totalOrders: number;
  totalSpentUSD: number;
  tier?: CustomerTier;
  department?: CustomerDepartment;
  notes?: string;
  createdAt: string;
}

export interface CustomerProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  tier?: CustomerTier;
  department?: CustomerDepartment;
  totalOrders?: number;
  totalSpentUSD?: number;
  notes?: string;
  createdAt?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory';
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitCostUSD: number;
  totalUSD: number;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  totalAmountUSD: number;
  status: 'paid' | 'unpaid' | 'partial';
  notes?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl: string;
  logoVideoUrl?: string; // Animated video logo (MP4/WebM/data URI)
  hideVideoLogo?: boolean; // When true, fallback to static logo or text
  introVideoUrl?: string; // Luxury intro splash screen video (MP4/WebM/data URI/URL)
  hideIntroVideo?: boolean; // When true, disable intro splash video
  enableIntroVideo?: boolean; // Explicit toggle for intro splash video
  introVideoMode?: 'always_on_home' | 'once_per_session'; // Frequency of intro video display
  phone: string;
  email: string;
  address: string;
  activeCurrency: 'USD' | 'LBP' | 'EUR';
  lbpRate: number; // e.g. 89500
  eurRate: number; // e.g. 0.92
  taxRatePercent: number;
  freeShippingThresholdUSD: number;
  defaultShippingFeeUSD: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  adminPin: string;
  receiptHeader: string;
  receiptFooter: string;
  enablePosBarcodeScanner: boolean;
  posPasscode?: string;
  whatsappNumber?: string;
  womenWhatsappNumber?: string;
  menWhatsappNumber?: string;
  kidsWhatsappNumber?: string;

  instagramUrl?: string;
  womenInstagramUrl?: string;
  menInstagramUrl?: string;
  kidsInstagramUrl?: string;

  facebookUrl?: string;
  tiktokUrl?: string;
  heroSubtitle?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImages?: string[];
  hideHeroBanner?: boolean;
  activeSeason?: 'all' | 'summer' | 'winter';

  // Tracking Pixels & Marketing Analytics
  metaPixelId?: string; // Master / General Meta Pixel ID (Store-wide)
  womenMetaPixelId?: string; // Women Meta Pixel ID (Women department & Instagram campaigns)
  menMetaPixelId?: string; // Men Meta Pixel ID (Men department & Instagram campaigns)
  tiktokPixelId?: string; // TikTok Pixel ID
  googleAnalyticsId?: string; // Google Analytics / Tag ID (e.g. G-XXXXX)
  snapchatPixelId?: string; // Snapchat Pixel ID

  // Meta Conversions API (CAPI) Server-Side Settings
  metaCapiEnabled?: boolean; // Enable/Disable server-side CAPI
  metaCapiAccessToken?: string; // Meta System User Access Token for Conversions API
  womenMetaCapiAccessToken?: string; // Optional dedicated token for Women pixel
  menMetaCapiAccessToken?: string; // Optional dedicated token for Men pixel
  metaCapiTestEventCode?: string; // Optional Meta Test Events code (e.g. TEST12345)
}

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'manager' | 'cashier' | string;
  permissions: string[] | string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  department?: 'all' | 'men' | 'women';
  minSpendUSD?: number;
  usageLimit?: number;
  usedCount?: number;
  createdAt: string;
}
