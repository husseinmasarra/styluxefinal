import {
  Product, Brand, Category, HomepageCard, MenuItem, Order, Customer, StaffMember,
  Supplier, SupplierInvoice, StoreSettings, OrderStatus, Coupon
} from './types';
import {
  INITIAL_SETTINGS, INITIAL_BRANDS, INITIAL_CATEGORIES, INITIAL_HOMEPAGE_CARDS,
  INITIAL_MENU_ITEMS, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_STAFF,
  INITIAL_SUPPLIERS, INITIAL_INVOICES, INITIAL_ORDERS, INITIAL_COUPONS
} from './seed';
import {
  fetchSupabaseCloudData,
  cloudSaveProduct,
  cloudDeleteProduct,
  cloudSaveCategory,
  cloudDeleteCategory,
  cloudSaveCard,
  cloudDeleteCard,
  cloudSaveBrand,
  cloudDeleteBrand,
  cloudSaveSettings,
  cloudSaveOrder,
  getSupabaseClient
} from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'styluxe_settings_v1',
  BRANDS: 'styluxe_brands_v1',
  CATEGORIES: 'styluxe_categories_v1',
  CARDS: 'styluxe_cards_v1',
  MENU: 'styluxe_menu_v1',
  PRODUCTS: 'styluxe_products_v1',
  CUSTOMERS: 'styluxe_customers_v1',
  STAFF: 'styluxe_staff_v1',
  SUPPLIERS: 'styluxe_suppliers_v1',
  INVOICES: 'styluxe_invoices_v1',
  ORDERS: 'styluxe_orders_v1',
  COUPONS: 'styluxe_coupons_v1',
  CART: 'styluxe_cart_v1',
  WISHLIST: 'styluxe_wishlist_v1',
};

const DATA_VERSION_KEY = 'styluxe_app_version';
const CURRENT_DATA_VERSION = 'v5.0_clean_database_sync';

// Automated migration check - SAFE & NON-DESTRUCTIVE (NEVER WIPES USER DATA)
function checkAndMigrateVersion(): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(DATA_VERSION_KEY);
    if (saved !== CURRENT_DATA_VERSION) {
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    }
  } catch (err) {
    console.error('Migration check error:', err);
  }
}

let hasInitCloudSync = false;
export async function initCloudSync(): Promise<void> {
  if (typeof window === 'undefined' || hasInitCloudSync) return;
  hasInitCloudSync = true;

  try {
    const cloud = await fetchSupabaseCloudData();
    if (cloud.hasData) {
      // STRICT DATA PROTECTION: Only seed from cloud if local storage has NO saved data yet!
      // This guarantees that the user's manual edits are 100% sacred and never overwritten!
      const localProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (cloud.products !== undefined && (!localProducts || localProducts === '[]')) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cloud.products));
      }

      const localCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (cloud.categories !== undefined && (!localCategories || localCategories === '[]')) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloud.categories));
      }

      const localBrands = localStorage.getItem(STORAGE_KEYS.BRANDS);
      if (cloud.brands !== undefined && (!localBrands || localBrands === '[]')) {
        localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(cloud.brands));
      }

      const localCards = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (cloud.cards !== undefined && (!localCards || localCards === '[]')) {
        localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cloud.cards));
      }

      const localMenu = localStorage.getItem(STORAGE_KEYS.MENU);
      if (cloud.menuItems !== undefined && (!localMenu || localMenu === '[]')) {
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(cloud.menuItems));
      }

      const localSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (cloud.settings !== undefined && !localSettings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloud.settings));
      }

      window.dispatchEvent(new Event('styluxe_data_updated'));
    }
  } catch (err) {
    console.warn('Cloud sync error:', err);
  }
}

// Helper for local storage reading
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  checkAndMigrateVersion();
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

// Helper for local storage writing
function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('styluxe_data_updated'));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export const DataService = {
  // SETTINGS
  getSettings(): StoreSettings {
    return getStorageItem<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  updateSettings(settings: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    setStorageItem(STORAGE_KEYS.SETTINGS, updated);
    cloudSaveSettings(updated);
    return updated;
  },

  // BRANDS
  getBrands(): Brand[] {
    return getStorageItem<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
  },
  saveBrand(brand: Brand): Brand[] {
    const brands = this.getBrands();
    const index = brands.findIndex(b => b.id === brand.id);
    let updated: Brand[];
    if (index >= 0) {
      updated = [...brands];
      updated[index] = brand;
    } else {
      updated = [brand, ...brands];
    }
    setStorageItem(STORAGE_KEYS.BRANDS, updated);
    cloudSaveBrand(brand);
    return updated;
  },
  deleteBrand(id: string): Brand[] {
    const updated = this.getBrands().filter(b => b.id !== id);
    setStorageItem(STORAGE_KEYS.BRANDS, updated);
    cloudDeleteBrand(id);
    return updated;
  },

  // CATEGORIES
  getCategories(): Category[] {
    return getStorageItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategory(cat: Category): Category[] {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === cat.id);
    let updated: Category[];
    if (index >= 0) {
      updated = [...categories];
      updated[index] = cat;
    } else {
      updated = [...categories, cat];
    }
    setStorageItem(STORAGE_KEYS.CATEGORIES, updated);
    cloudSaveCategory(cat);
    return updated;
  },
  deleteCategory(id: string): Category[] {
    const updated = this.getCategories().filter(c => c.id !== id);
    setStorageItem(STORAGE_KEYS.CATEGORIES, updated);
    cloudDeleteCategory(id);
    return updated;
  },

  // HOMEPAGE CARDS
  getCards(): HomepageCard[] {
    return getStorageItem<HomepageCard[]>(STORAGE_KEYS.CARDS, INITIAL_HOMEPAGE_CARDS);
  },
  saveCard(card: HomepageCard): HomepageCard[] {
    const cards = this.getCards();
    const index = cards.findIndex(c => c.id === card.id);
    let updated: HomepageCard[];
    if (index >= 0) {
      updated = [...cards];
      updated[index] = card;
    } else {
      updated = [...cards, card];
    }
    setStorageItem(STORAGE_KEYS.CARDS, updated);
    cloudSaveCard(card);
    return updated;
  },
  deleteCard(id: string): HomepageCard[] {
    const updated = this.getCards().filter(c => c.id !== id);
    setStorageItem(STORAGE_KEYS.CARDS, updated);
    cloudDeleteCard(id);
    return updated;
  },

  // MENU ITEMS
  getMenuItems(): MenuItem[] {
    return getStorageItem<MenuItem[]>(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS);
  },
  saveMenuItems(items: MenuItem[]): MenuItem[] {
    setStorageItem(STORAGE_KEYS.MENU, items);
    return items;
  },

  // PRODUCTS
  getProducts(): Product[] {
    return getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  },
  saveProduct(product: Product): Product[] {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...products];
      updated[index] = product;
    } else {
      updated = [product, ...products];
    }
    setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
    cloudSaveProduct(product);
    return updated;
  },
  deleteProduct(id: string): Product[] {
    const updated = this.getProducts().filter(p => p.id !== id);
    setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
    cloudDeleteProduct(id);
    return updated;
  },

  // ORDERS
  getOrders(): Order[] {
    return getStorageItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },
  saveOrder(order: Order): Order[] {
    const orders = this.getOrders();
    const updated = [order, ...orders];
    setStorageItem(STORAGE_KEYS.ORDERS, updated);
    cloudSaveOrder(order);

    // Deduct stock for ordered items
    const products = this.getProducts();
    order.items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.productId);
      if (prodIndex >= 0) {
        const prod = { ...products[prodIndex] };
        if (prod.stockPerSize && prod.stockPerSize[item.size] !== undefined) {
          prod.stockPerSize[item.size] = Math.max(0, prod.stockPerSize[item.size] - item.quantity);
          prod.totalStock = Object.values(prod.stockPerSize).reduce((acc, qty) => acc + qty, 0);
          products[prodIndex] = prod;
        }
      }
    });
    setStorageItem(STORAGE_KEYS.PRODUCTS, products);

    // Update customer stats
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.email.toLowerCase() === order.customerEmail.toLowerCase());
    if (custIndex >= 0) {
      customers[custIndex].totalOrders += 1;
      customers[custIndex].totalSpentUSD += order.totalUSD;
    } else if (order.customerEmail) {
      customers.push({
        id: `cust-${Date.now()}`,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone || "",
        address: order.shippingAddress || "",
        totalOrders: 1,
        totalSpentUSD: order.totalUSD,
        createdAt: new Date().toISOString()
      });
    }
    setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);

    return updated;
  },
  updateOrderStatus(orderId: string, status: OrderStatus): Order[] {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      const updated = [...orders];
      updated[index] = { ...updated[index], status };
      setStorageItem(STORAGE_KEYS.ORDERS, updated);
      return updated;
    }
    return orders;
  },
  deleteOrder(orderId: string): Order[] {
    const updated = this.getOrders().filter(o => o.id !== orderId);
    setStorageItem(STORAGE_KEYS.ORDERS, updated);
    return updated;
  },

  // CUSTOMERS
  getCustomers(): Customer[] {
    return getStorageItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  saveCustomer(customer: Customer): Customer[] {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    let updated: Customer[];
    if (index >= 0) {
      updated = [...customers];
      updated[index] = customer;
    } else {
      updated = [customer, ...customers];
    }
    setStorageItem(STORAGE_KEYS.CUSTOMERS, updated);
    return updated;
  },
  deleteCustomer(id: string): Customer[] {
    const updated = this.getCustomers().filter(c => c.id !== id);
    setStorageItem(STORAGE_KEYS.CUSTOMERS, updated);
    return updated;
  },

  // STAFF
  getStaff(): StaffMember[] {
    return getStorageItem<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  },
  saveStaff(staff: StaffMember): StaffMember[] {
    const staffList = this.getStaff();
    const index = staffList.findIndex(s => s.id === staff.id);
    let updated: StaffMember[];
    if (index >= 0) {
      updated = [...staffList];
      updated[index] = staff;
    } else {
      updated = [staff, ...staffList];
    }
    setStorageItem(STORAGE_KEYS.STAFF, updated);
    return updated;
  },
  deleteStaff(id: string): StaffMember[] {
    const updated = this.getStaff().filter(s => s.id !== id);
    setStorageItem(STORAGE_KEYS.STAFF, updated);
    return updated;
  },

  // SUPPLIERS
  getSuppliers(): Supplier[] {
    return getStorageItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },
  saveSupplier(supplier: Supplier): Supplier[] {
    const list = this.getSuppliers();
    const index = list.findIndex(s => s.id === supplier.id);
    let updated: Supplier[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = supplier;
    } else {
      updated = [supplier, ...list];
    }
    setStorageItem(STORAGE_KEYS.SUPPLIERS, updated);
    return updated;
  },
  deleteSupplier(id: string): Supplier[] {
    const updated = this.getSuppliers().filter(s => s.id !== id);
    setStorageItem(STORAGE_KEYS.SUPPLIERS, updated);
    return updated;
  },

  // INVOICES
  getInvoices(): SupplierInvoice[] {
    return getStorageItem<SupplierInvoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },
  saveInvoice(invoice: SupplierInvoice): SupplierInvoice[] {
    const list = this.getInvoices();
    const index = list.findIndex(i => i.id === invoice.id);
    let updated: SupplierInvoice[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = invoice;
    } else {
      updated = [invoice, ...list];
    }
    setStorageItem(STORAGE_KEYS.INVOICES, updated);
    return updated;
  },
  deleteInvoice(id: string): SupplierInvoice[] {
    const updated = this.getInvoices().filter(i => i.id !== id);
    setStorageItem(STORAGE_KEYS.INVOICES, updated);
    return updated;
  },

  // COUPONS
  getCoupons(): Coupon[] {
    return getStorageItem<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS as Coupon[]);
  },
  saveCoupon(coupon: Coupon): Coupon[] {
    const coupons = this.getCoupons();
    const index = coupons.findIndex(c => c.id === coupon.id);
    let updated: Coupon[];
    if (index >= 0) {
      updated = [...coupons];
      updated[index] = coupon;
    } else {
      updated = [coupon, ...coupons];
    }
    setStorageItem(STORAGE_KEYS.COUPONS, updated);
    return updated;
  },
  deleteCoupon(id: string): Coupon[] {
    const updated = this.getCoupons().filter(c => c.id !== id);
    setStorageItem(STORAGE_KEYS.COUPONS, updated);
    return updated;
  },
  getCouponByCode(code: string): Coupon | null {
    const coupons = this.getCoupons();
    return coupons.find(c => c.code.toLowerCase() === code.trim().toLowerCase() && c.active) || null;
  },

  // RESET ALL DATA TO DEMO DEFAULT
  resetToDemo(): void {
    setStorageItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setStorageItem(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
    setStorageItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setStorageItem(STORAGE_KEYS.CARDS, INITIAL_HOMEPAGE_CARDS);
    setStorageItem(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS);
    setStorageItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStorageItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStorageItem(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    setStorageItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    setStorageItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    setStorageItem(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  // DATABASE BACKUP & RESTORE (100% NON-DESTRUCTIVE DATA PRESERVATION)
  exportDatabaseJSON(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings: this.getSettings(),
      brands: this.getBrands(),
      categories: this.getCategories(),
      cards: this.getCards(),
      menuItems: this.getMenuItems(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      staff: this.getStaff(),
      suppliers: this.getSuppliers(),
      invoices: this.getInvoices(),
      orders: this.getOrders(),
      coupons: this.getCoupons()
    };
    return JSON.stringify(backup, null, 2);
  },

  importDatabaseJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) setStorageItem(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.brands) setStorageItem(STORAGE_KEYS.BRANDS, data.brands);
      if (data.categories) setStorageItem(STORAGE_KEYS.CATEGORIES, data.categories);
      if (data.cards) setStorageItem(STORAGE_KEYS.CARDS, data.cards);
      if (data.menuItems) setStorageItem(STORAGE_KEYS.MENU, data.menuItems);
      if (data.products) setStorageItem(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.customers) setStorageItem(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.staff) setStorageItem(STORAGE_KEYS.STAFF, data.staff);
      if (data.suppliers) setStorageItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
      if (data.invoices) setStorageItem(STORAGE_KEYS.INVOICES, data.invoices);
      if (data.orders) setStorageItem(STORAGE_KEYS.ORDERS, data.orders);
      if (data.coupons) setStorageItem(STORAGE_KEYS.COUPONS, data.coupons);
      return true;
    } catch (err) {
      console.error('Database import error:', err);
      return false;
    }
  }
};

// Formatting helpers
export function formatCurrency(amountUSD: number, currency: 'USD' | 'LBP' | 'EUR' = 'USD', lbpRate = 89500, eurRate = 0.92): string {
  if (currency === 'LBP') {
    const val = Math.round(amountUSD * lbpRate);
    return `${val.toLocaleString()} LBP`;
  }
  if (currency === 'EUR') {
    const val = amountUSD * eurRate;
    return `€${val.toFixed(2)}`;
  }
  return `$${amountUSD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Resilient & strict category matching helper (prevents cross-category leakage while handling case/prefix variations)
export function isProductMatchingCategory(productCategory?: string, targetCategory?: string): boolean {
  if (!targetCategory || targetCategory.toLowerCase().trim() === 'all') return true;
  if (!productCategory) return false;
  
  const normProd = productCategory.toLowerCase().trim();
  const normTarget = targetCategory.toLowerCase().trim();
  if (normProd === normTarget) return true;

  // Strip department prefixes like "men's ", "mens ", "women's ", "womens "
  const stripPrefix = (str: string) => str.replace(/^(men'?s?|women'?s?)\s+/i, '').trim();
  const spProd = stripPrefix(normProd);
  const spTarget = stripPrefix(normTarget);
  if (spProd && spTarget && spProd === spTarget) return true;

  // Normalized alphanumeric comparison (e.g. "T-Shirts" vs "tshirts")
  const cleanAlpha = (str: string) => str.replace(/[^a-z0-9]/g, '');
  const caProd = cleanAlpha(normProd);
  const caTarget = cleanAlpha(normTarget);
  if (caProd && caTarget && caProd === caTarget) return true;

  const caSpProd = cleanAlpha(spProd);
  const caSpTarget = cleanAlpha(spTarget);
  if (caSpProd && caSpTarget && caSpProd === caSpTarget) return true;

  return false;
}
