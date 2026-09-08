export type Department = 'men' | 'women' | 'all';

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
  colorImages?: Record<string, string>; // e.g. { "Black": "data:image...", "Red": "data:image..." }
  images: string[];
  description: string;
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

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'card' | 'pos_cash' | 'pos_card';

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
  createdAt: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpentUSD: number;
  notes?: string;
  createdAt: string;
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
  minSpendUSD?: number;
  createdAt: string;
}
