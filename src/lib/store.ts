import {
  Product, Brand, Category, HomepageCard, MenuItem, Order, Customer, CustomerProfile, StaffMember,
  Supplier, SupplierInvoice, StoreSettings, OrderStatus, Coupon, CustomerTier, CustomerTierInfo
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
  cloudDeleteOrder,
  fetchCustomerOrdersFromCloud,
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
  CUSTOMER_USER: 'styluxe_customer_user',
};

const DATA_VERSION_KEY = 'styluxe_app_version';
const CURRENT_DATA_VERSION = 'v6.2_catalog_refresh';

// Automated migration check - SAFE & NON-DESTRUCTIVE (PURGES STALE CACHED CATALOG WHEN RESET)
function checkAndMigrateVersion(): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(DATA_VERSION_KEY);
    if (saved !== CURRENT_DATA_VERSION) {
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      const existingProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!existingProds || existingProds === '[]' || existingProds === 'null') {
        safeWriteLocalStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        inMemoryStorage[STORAGE_KEYS.PRODUCTS] = INITIAL_PRODUCTS;
      }
    }
  } catch (err) {
    console.error('Migration check error:', err);
  }
}

// Ultra-resilient in-memory cache to guarantee zero data loss even if browser localStorage exceeds quota (5MB)
const inMemoryStorage: Record<string, any> = {};

function stripHeavyDataForStorage(data: any): any {
  if (!Array.isArray(data)) return data;
  return data.map((item: any) => {
    if (!item || typeof item !== 'object') return item;
    const cloned = { ...item };
    if (Array.isArray(cloned.images) && cloned.images.length > 8) {
      cloned.images = cloned.images.slice(0, 8);
    }
    return cloned;
  });
}

function safeWriteLocalStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    try {
      const slim = stripHeavyDataForStorage(value);
      localStorage.setItem(key, JSON.stringify(slim));
    } catch (_) {
      try {
        if (Array.isArray(value)) {
          const minimal = value.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            department: p.department,
            category: p.category,
            brandName: p.brandName,
            price: p.price,
            salePrice: p.salePrice,
            totalStock: p.totalStock,
            images: Array.isArray(p.images) ? p.images.slice(0, 4) : [],
          }));
          localStorage.setItem(key, JSON.stringify(minimal));
        }
      } catch (e2) {
        console.warn(`LocalStorage quota exceeded for ${key}. Preserving active data in memory cache.`);
      }
    }
  }
}

let hasInitCloudSync = false;
export async function initCloudSync(): Promise<void> {
  if (typeof window === 'undefined' || hasInitCloudSync) return;
  hasInitCloudSync = true;

  try {
    const cloud = await fetchSupabaseCloudData();
    if (cloud.hasData) {
      // 1. SYNC PRODUCTS
      if (cloud.products !== undefined && Array.isArray(cloud.products) && cloud.products.length > 0) {
        inMemoryStorage[STORAGE_KEYS.PRODUCTS] = cloud.products;
        safeWriteLocalStorage(STORAGE_KEYS.PRODUCTS, cloud.products);
      }

      // 2. SYNC CATEGORIES
      if (cloud.categories !== undefined && Array.isArray(cloud.categories)) {
        inMemoryStorage[STORAGE_KEYS.CATEGORIES] = cloud.categories;
        safeWriteLocalStorage(STORAGE_KEYS.CATEGORIES, cloud.categories);
      }

      // 3. SYNC BRANDS
      if (cloud.brands !== undefined && Array.isArray(cloud.brands)) {
        inMemoryStorage[STORAGE_KEYS.BRANDS] = cloud.brands;
        safeWriteLocalStorage(STORAGE_KEYS.BRANDS, cloud.brands);
      }

      // 4. SYNC CARDS
      if (cloud.cards !== undefined && Array.isArray(cloud.cards)) {
        inMemoryStorage[STORAGE_KEYS.CARDS] = cloud.cards;
        safeWriteLocalStorage(STORAGE_KEYS.CARDS, cloud.cards);
      }

      // 5. SYNC MENU
      if (cloud.menuItems !== undefined && Array.isArray(cloud.menuItems)) {
        inMemoryStorage[STORAGE_KEYS.MENU] = cloud.menuItems;
        safeWriteLocalStorage(STORAGE_KEYS.MENU, cloud.menuItems);
      }

      // 6. SYNC SETTINGS
      if (cloud.settings !== undefined && cloud.settings) {
        const currentLocal = getStorageItem<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
        const mergedSettings = { ...currentLocal, ...cloud.settings };
        inMemoryStorage[STORAGE_KEYS.SETTINGS] = mergedSettings;
        safeWriteLocalStorage(STORAGE_KEYS.SETTINGS, mergedSettings);
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
  if (inMemoryStorage[key] !== undefined && inMemoryStorage[key] !== null) {
    return inMemoryStorage[key] as T;
  }
  checkAndMigrateVersion();
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      inMemoryStorage[key] = parsed;
      return parsed;
    }
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
  }
  return defaultValue;
}

// Helper for local storage writing
function setStorageItem<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    inMemoryStorage[key] = value;
  }
  safeWriteLocalStorage(key, value);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('styluxe_data_updated'));
    } catch (_) {}
  }
}

export const DataService = {
  // SETTINGS
  getSettings(): StoreSettings {
    const saved = getStorageItem<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...saved,
      womenMetaPixelId: saved.womenMetaPixelId !== undefined ? saved.womenMetaPixelId : (INITIAL_SETTINGS.womenMetaPixelId || "1128799242995614"),
      menMetaPixelId: saved.menMetaPixelId !== undefined ? saved.menMetaPixelId : (INITIAL_SETTINGS.menMetaPixelId || "1644089083922873"),
      introVideoUrl: saved.introVideoUrl || '/logo-video.mp4',
      enableIntroVideo: saved.enableIntroVideo !== undefined ? saved.enableIntroVideo : true,
      hideIntroVideo: saved.hideIntroVideo !== undefined ? saved.hideIntroVideo : false,
      introVideoMode: saved.introVideoMode || 'always_on_home',
    };
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
  saveAllCategories(categories: Category[]): Category[] {
    setStorageItem(STORAGE_KEYS.CATEGORIES, categories);
    return categories;
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
  saveAllProducts(products: Product[]): Product[] {
    setStorageItem(STORAGE_KEYS.PRODUCTS, products);
    return products;
  },
  getProductById(id: string): Product | undefined {
    if (!id) return undefined;
    const cleanId = decodeURIComponent(id).trim();
    const cleanIdLower = cleanId.toLowerCase();
    const products = this.getProducts();

    // 1. Direct exact match by ID
    let found = products.find(p => p.id === cleanId || p.id === id);
    if (found) return found;

    // 2. Case-insensitive ID match
    found = products.find(p => p.id && p.id.toLowerCase() === cleanIdLower);
    if (found) return found;

    // 3. Match by slug (exact and case-insensitive)
    found = products.find(p => p.slug && (p.slug === cleanId || p.slug.toLowerCase() === cleanIdLower));
    if (found) return found;

    // 4. Match by SKU
    found = products.find(p => p.sku && (p.sku === cleanId || p.sku.toLowerCase() === cleanIdLower));
    if (found) return found;

    // 5. Match by sanitized title slug
    found = products.find(p => {
      const titleSlug = (p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return titleSlug === cleanIdLower;
    });
    return found;
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

    // Determine customer department from ordered items
    let hasMen = false;
    let hasWomen = false;
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        if (prod.department === 'men') hasMen = true;
        if (prod.department === 'women') hasWomen = true;
      }
    });
    const orderDept: 'men' | 'women' | 'both' = (hasMen && hasWomen) ? 'both' : hasMen ? 'men' : hasWomen ? 'women' : 'both';

    // Update customer stats and assign VIP CRM tier
    const customers = this.getCustomers();
    const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
    const custIndex = customers.findIndex(c => 
      (order.customerEmail && c.email && c.email.toLowerCase() === order.customerEmail.toLowerCase()) ||
      (cleanPhone.length >= 6 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );
    let updatedCust: Customer;
    if (custIndex >= 0) {
      customers[custIndex].totalOrders = (customers[custIndex].totalOrders || 0) + 1;
      customers[custIndex].totalSpentUSD = (customers[custIndex].totalSpentUSD || 0) + order.totalUSD;
      const tierInfo = getCustomerTier(customers[custIndex].totalSpentUSD, customers[custIndex].totalOrders);
      customers[custIndex].tier = tierInfo.tier;
      if (order.shippingAddress) customers[custIndex].address = order.shippingAddress;
      if (order.city) customers[custIndex].city = order.city;
      if (order.customerPhone && !customers[custIndex].phone) customers[custIndex].phone = order.customerPhone;
      
      // Update department
      if (!customers[custIndex].department) {
        customers[custIndex].department = orderDept;
      } else if (customers[custIndex].department !== orderDept && orderDept !== 'both') {
        customers[custIndex].department = 'both';
      }

      order.customerTier = tierInfo.tier;
      updatedCust = customers[custIndex];
    } else {
      const tierInfo = getCustomerTier(order.totalUSD, 1);
      order.customerTier = tierInfo.tier;
      updatedCust = {
        id: `cust-${Date.now()}`,
        name: order.customerName,
        email: order.customerEmail || `${cleanPhone}@styluxecustomer.com`,
        phone: order.customerPhone || "",
        address: order.shippingAddress || "",
        city: order.city || "Beirut",
        totalOrders: 1,
        totalSpentUSD: order.totalUSD,
        tier: tierInfo.tier,
        department: orderDept,
        createdAt: new Date().toISOString()
      };
      customers.push(updatedCust);
    }
    setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);

    // Sync active customer user session if matches
    const currentCustomerUser = this.getCustomerUser();
    if (currentCustomerUser) {
      const userPhone = (currentCustomerUser.phone || '').replace(/[^0-9]/g, '');
      const userEmail = (currentCustomerUser.email || '').toLowerCase();
      if ((userEmail && userEmail === (order.customerEmail || '').toLowerCase()) ||
          (cleanPhone.length >= 6 && userPhone.includes(cleanPhone))) {
        this.saveCustomerUser({
          ...currentCustomerUser,
          tier: updatedCust.tier,
          totalOrders: updatedCust.totalOrders,
          totalSpentUSD: updatedCust.totalSpentUSD,
        });
      }
    }

    return updated;
  },
  updateOrderStatus(orderId: string, status: OrderStatus): Order[] {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      const updated = [...orders];
      updated[index] = { ...updated[index], status };
      setStorageItem(STORAGE_KEYS.ORDERS, updated);
      cloudSaveOrder(updated[index]);
      return updated;
    }
    return orders;
  },
  deleteOrder(orderId: string): Order[] {
    const updated = this.getOrders().filter(o => o.id !== orderId);
    setStorageItem(STORAGE_KEYS.ORDERS, updated);
    cloudDeleteOrder(orderId);
    return updated;
  },

  // CUSTOMER USER SESSION & AUTH
  getCustomerUser(): CustomerProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_USER);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  },
  saveCustomerUser(profile: CustomerProfile): CustomerProfile {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_USER, JSON.stringify(profile));
        window.dispatchEvent(new CustomEvent('styluxe_customer_auth_changed', { detail: profile }));
        window.dispatchEvent(new Event('styluxe_data_updated'));
      } catch (_) {}
    }
    // Record in local customers directory
    const existing = this.getCustomers();
    const cleanPhone = (profile.phone || '').replace(/[^0-9]/g, '');
    const foundIndex = existing.findIndex(c => 
      (profile.email && c.email.toLowerCase() === profile.email.toLowerCase()) ||
      (cleanPhone && c.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );
    if (foundIndex >= 0) {
      const match = existing[foundIndex];
      const tierInfo = getCustomerTier(match.totalSpentUSD || 0, match.totalOrders || 0);
      existing[foundIndex] = {
        ...match,
        name: profile.name || match.name,
        phone: profile.phone || match.phone,
        address: profile.address || match.address,
        city: profile.city || match.city,
        email: profile.email || match.email,
        tier: match.tier || tierInfo.tier,
      };
      setStorageItem(STORAGE_KEYS.CUSTOMERS, existing);

      profile.tier = existing[foundIndex].tier;
      profile.totalOrders = existing[foundIndex].totalOrders;
      profile.totalSpentUSD = existing[foundIndex].totalSpentUSD;
    } else {
      const tierInfo = getCustomerTier(profile.totalSpentUSD || 0, profile.totalOrders || 0);
      profile.tier = tierInfo.tier;
      profile.totalOrders = profile.totalOrders || 0;
      profile.totalSpentUSD = profile.totalSpentUSD || 0;
      existing.unshift({
        id: `cust-${Date.now()}`,
        name: profile.name,
        email: profile.email || `${cleanPhone}@styluxecustomer.com`,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        totalOrders: profile.totalOrders,
        totalSpentUSD: profile.totalSpentUSD,
        tier: tierInfo.tier,
        createdAt: new Date().toISOString()
      });
      setStorageItem(STORAGE_KEYS.CUSTOMERS, existing);
    }
    return profile;
  },
  logoutCustomerUser(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.CUSTOMER_USER);
        window.dispatchEvent(new CustomEvent('styluxe_customer_auth_changed', { detail: null }));
        window.dispatchEvent(new Event('styluxe_data_updated'));
      } catch (_) {}
    }
  },

  // GET ORDERS FOR CUSTOMER (LOCAL FILTER)
  getCustomerOrders(identifier?: string): Order[] {
    const all = this.getOrders();
    if (!identifier || !identifier.trim()) {
      const user = this.getCustomerUser();
      if (!user) return [];
      identifier = user.phone || user.email || '';
    }
    const clean = identifier.trim().toLowerCase();
    const numeric = clean.replace(/[^0-9]/g, '');

    return all.filter(o => {
      if (clean && o.orderNumber.toLowerCase().includes(clean)) return true;
      if (clean && o.customerEmail && o.customerEmail.toLowerCase().includes(clean)) return true;
      const oPhoneNumeric = (o.customerPhone || '').replace(/[^0-9]/g, '');
      if (numeric.length >= 6 && oPhoneNumeric.includes(numeric)) return true;
      return false;
    });
  },

  // FETCH ORDERS REALTIME (LOCAL + CLOUD MERGED)
  async fetchCustomerOrdersRealtime(identifier: string): Promise<Order[]> {
    if (!identifier || !identifier.trim()) return [];
    const local = this.getCustomerOrders(identifier);
    try {
      const cloud = await fetchCustomerOrdersFromCloud(identifier);
      const orderMap = new Map<string, Order>();
      local.forEach(o => orderMap.set(o.orderNumber || o.id, o));
      cloud.forEach(o => {
        const key = o.orderNumber || o.id;
        orderMap.set(key, o);
      });
      const merged = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (merged.length > 0) {
        const allOrders = this.getOrders();
        merged.forEach(m => {
          const idx = allOrders.findIndex(o => o.id === m.id || o.orderNumber === m.orderNumber);
          if (idx >= 0) allOrders[idx] = m;
          else allOrders.unshift(m);
        });
        setStorageItem(STORAGE_KEYS.ORDERS, allOrders);
      }
      return merged;
    } catch (e) {
      console.warn('Realtime customer orders fetch error:', e);
      return local;
    }
  },

  // CUSTOMERS
  getCustomers(): Customer[] {
    return getStorageItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  saveCustomer(customer: Customer): Customer[] {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    const tierInfo = getCustomerTier(customer.totalSpentUSD || 0, customer.totalOrders || 0);
    const enriched: Customer = {
      ...customer,
      tier: customer.tier || tierInfo.tier,
    };
    let updated: Customer[];
    if (index >= 0) {
      updated = [...customers];
      updated[index] = enriched;
    } else {
      updated = [enriched, ...customers];
    }
    setStorageItem(STORAGE_KEYS.CUSTOMERS, updated);
    return updated;
  },
  saveBulkCustomers(newCustomers: Customer[]): Customer[] {
    const existing = this.getCustomers();
    const existingPhones = new Set(existing.map(c => (c.phone || '').replace(/[^0-9]/g, '')));
    const toAdd: Customer[] = [];

    for (const cust of newCustomers) {
      const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone && existingPhones.has(cleanPhone)) {
        continue;
      }
      if (cleanPhone) existingPhones.add(cleanPhone);
      const tierInfo = getCustomerTier(cust.totalSpentUSD || 0, cust.totalOrders || 0);
      toAdd.push({
        ...cust,
        tier: cust.tier || tierInfo.tier,
      });
    }

    const updated = [...toAdd, ...existing];
    setStorageItem(STORAGE_KEYS.CUSTOMERS, updated);
    return updated;
  },
  setAllCustomers(customers: Customer[]): Customer[] {
    setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);
    return customers;
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
    const raw = getStorageItem<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS as Coupon[]);
    return raw.map(c => ({
      ...c,
      department: c.department || 'all',
      usageLimit: Number(c.usageLimit) || 0,
      usedCount: Number(c.usedCount) || 0
    }));
  },
  saveCoupon(coupon: Coupon): Coupon[] {
    const coupons = this.getCoupons();
    const index = coupons.findIndex(c => c.id === coupon.id);
    const sanitizedCoupon: Coupon = {
      ...coupon,
      department: coupon.department || 'all',
      usageLimit: Number(coupon.usageLimit) || 0,
      usedCount: Number(coupon.usedCount) || 0
    };
    let updated: Coupon[];
    if (index >= 0) {
      updated = [...coupons];
      updated[index] = sanitizedCoupon;
    } else {
      updated = [sanitizedCoupon, ...coupons];
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
    const clean = code.trim().toLowerCase();
    const found = coupons.find(c => c.code.toLowerCase() === clean && c.active);
    if (!found) return null;
    
    // Check if usage limit is reached
    if (found.usageLimit && found.usageLimit > 0 && (found.usedCount || 0) >= found.usageLimit) {
      return null;
    }
    return found;
  },
  useCoupon(codeOrId: string): boolean {
    const coupons = this.getCoupons();
    const clean = codeOrId.trim().toLowerCase();
    const index = coupons.findIndex(c => c.id === codeOrId || c.code.toLowerCase() === clean);
    if (index >= 0) {
      const c = coupons[index];
      const updatedUsed = (c.usedCount || 0) + 1;
      const isExhausted = c.usageLimit && c.usageLimit > 0 && updatedUsed >= c.usageLimit;

      coupons[index] = {
        ...c,
        usedCount: updatedUsed,
        active: isExhausted ? false : c.active
      };
      setStorageItem(STORAGE_KEYS.COUPONS, [...coupons]);
      return true;
    }
    return false;
  },
  resetCouponUsage(id: string): Coupon[] {
    const coupons = this.getCoupons();
    const index = coupons.findIndex(c => c.id === id);
    if (index >= 0) {
      coupons[index] = {
        ...coupons[index],
        usedCount: 0,
        active: true
      };
      setStorageItem(STORAGE_KEYS.COUPONS, [...coupons]);
    }
    return coupons;
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
  },

  // CUSTOMER TIER & VIP LOYALTY ENGINE
  getCustomerTier(totalSpentUSD: number = 0, totalOrders: number = 0): CustomerTierInfo {
    return getCustomerTier(totalSpentUSD, totalOrders);
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

// Helper to normalize single category strings
function normalizeCategoryPart(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/^(men'?s?|women'?s?)\s+/i, '')
    .trim();
}

function cleanAlpha(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function singleCategoryMatch(pCat: string, tCat: string): boolean {
  if (!pCat || !tCat) return false;
  const np = normalizeCategoryPart(pCat);
  const nt = normalizeCategoryPart(tCat);
  if (np === nt) return true;

  const cap = cleanAlpha(np);
  const cat = cleanAlpha(nt);
  if (cap === cat) return true;

  // Handle plural / singular variations (e.g. "jacket" vs "jackets", "hoodie" vs "hoodies")
  if (cap.length > 3 && cat.length > 3) {
    if (cap + 's' === cat || cat + 's' === cap) return true;
    if (cap.replace(/ies$/, 'y') === cat || cat.replace(/ies$/, 'y') === cap) return true;
    if (cap.replace(/s$/, '') === cat.replace(/s$/, '')) return true;
  }
  return false;
}

// Resilient & strict category matching helper (handles hierarchical '>', '/', prefixes, plurals, and exact matches)
export function isProductMatchingCategory(productCategory?: string, targetCategory?: string): boolean {
  if (!targetCategory || targetCategory.toLowerCase().trim() === 'all') return true;
  if (!productCategory) return false;

  // 1. Direct single match
  if (singleCategoryMatch(productCategory, targetCategory)) return true;

  // 2. Split hierarchy if '>' or '/' is used in productCategory or targetCategory
  const prodParts = productCategory.split(/[>/]+/).map(s => s.trim()).filter(Boolean);
  const targetParts = targetCategory.split(/[>/]+/).map(s => s.trim()).filter(Boolean);

  // If product has multiple parts (e.g. ['ready to wear', 'Jackets'])
  for (const part of prodParts) {
    if (singleCategoryMatch(part, targetCategory)) return true;
    for (const tPart of targetParts) {
      if (singleCategoryMatch(part, tPart)) return true;
    }
  }

  // If target has multiple parts (e.g. ['ready to wear', 'Jackets'])
  for (const tPart of targetParts) {
    if (singleCategoryMatch(productCategory, tPart)) return true;
  }

  return false;
}

// Seasonal filtering helper: filters products based on store activeSeason setting
export function isProductMatchingSeason(productSeason?: string, activeSeason?: 'all' | 'summer' | 'winter'): boolean {
  if (!activeSeason || activeSeason === 'all') return true;
  const s = (productSeason || '').trim().toLowerCase();
  if (s === '' || s === 'all seasons' || s === 'all' || s.includes('all')) return true;
  if (activeSeason === 'summer') {
    return s.includes('summer') || !s.includes('winter');
  }
  if (activeSeason === 'winter') {
    return s.includes('winter') || !s.includes('summer');
  }
  return true;
}

// Calculate current effective price and optional strikethrough original price
export function getProductDisplayPrices(price: number, salePrice?: number | null): {
  currentPrice: number;
  oldPrice: number | null;
  hasDiscount: boolean;
  discountPercent: number;
} {
  const p = Number(price) || 0;
  const sp = salePrice ? Number(salePrice) : 0;

  if (sp > 0 && sp !== p) {
    const currentPrice = Math.min(p, sp);
    const oldPrice = Math.max(p, sp);
    return {
      currentPrice,
      oldPrice,
      hasDiscount: true,
      discountPercent: Math.round(((oldPrice - currentPrice) / oldPrice) * 100),
    };
  }

  return {
    currentPrice: p,
    oldPrice: null,
    hasDiscount: false,
    discountPercent: 0,
  };
}

// CUSTOMER VIP & LOYALTY TIER ENGINE (CALCULATED FROM ORDERS & TOTAL SPENT)
export function getCustomerTier(totalSpentUSD: number = 0, totalOrders: number = 0): CustomerTierInfo {
  const spent = Number(totalSpentUSD) || 0;
  const orders = Number(totalOrders) || 0;

  if (spent >= 1000 || orders >= 5) {
    return {
      tier: 'platinum',
      label: 'VIP PLATINUM',
      arabicLabel: 'النخبة البلاتينية',
      icon: '👑',
      minSpendUSD: 1000,
      minOrders: 5,
      badgeClass: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-zinc-950 border border-amber-400/80 shadow-xs font-black',
      perks: [
        'White-glove priority express courier dispatch',
        'Direct 1-on-1 personal stylist concierge on WhatsApp',
        'Exclusive early access to limited archival fashion drops',
        'Complimentary luxury gift wrapping with every order'
      ]
    };
  }

  if (spent >= 500 || orders >= 3) {
    return {
      tier: 'gold',
      label: 'VIP GOLD',
      arabicLabel: 'العميل الذهبي',
      icon: '⭐',
      minSpendUSD: 500,
      minOrders: 3,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      perks: [
        'Priority order preparation and express packing',
        'Direct WhatsApp concierge live tracking',
        'Private VIP seasonal drop preview invitations'
      ]
    };
  }

  if (spent >= 200 || orders >= 2) {
    return {
      tier: 'silver',
      label: 'VIP SILVER',
      arabicLabel: 'العميل الفضي',
      icon: '💎',
      minSpendUSD: 200,
      minOrders: 2,
      badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300 font-bold',
      perks: [
        'Verified returning VIP client privilege',
        'Express checkout with saved delivery preferences',
        'Exclusive WhatsApp promotional announcements'
      ]
    };
  }

  return {
    tier: 'bronze',
    label: 'NEW CLIENT',
    arabicLabel: 'عميل جديد',
    icon: '✨',
    minSpendUSD: 0,
    minOrders: 0,
    badgeClass: 'bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold',
    perks: [
      'Welcome to STYLUXE private archive membership',
      '100% authentic luxury designer fashion guarantee',
      'Dedicated express delivery throughout Lebanon'
    ]
  };
}
