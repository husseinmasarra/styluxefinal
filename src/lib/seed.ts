import { Product, Brand, Category, HomepageCard, MenuItem, Order, Customer, Staff, Supplier, SupplierInvoice, StoreSettings } from './types';

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: "STYLUXE",
  tagline: "Redefining Luxury International Brands",
  logoUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80",
  phone: "+961 70 123 456",
  email: "vip@styluxelb.com",
  address: "Downtown Beirut, Allenby Street, Luxury Quarter",
  activeCurrency: "USD",
  lbpRate: 89500,
  eurRate: 0.92,
  taxRatePercent: 0,
  freeShippingThresholdUSD: 500,
  defaultShippingFeeUSD: 25,
  supabaseUrl: "",
  supabaseAnonKey: "",
  adminPin: "1234",
  receiptHeader: "STYLUXE LUXURY BOUTIQUE\nBeirut - Lebanon | Tel: +961 70 123 456\n100% Authentic Luxury Brands Guaranteed",
  receiptFooter: "Thank you for shopping at STYLUXE.\nItems can be exchanged within 7 days with original receipt.",
  enablePosBarcodeScanner: true,
};

export const INITIAL_BRANDS: Brand[] = [
  {
    id: "brand-prada",
    name: "PRADA",
    slug: "prada",
    logoUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80",
    description: "Italian luxury fashion house specializing in leather handbags, ready-to-wear, and accessories.",
    isFeatured: true
  },
  {
    id: "brand-gucci",
    name: "GUCCI",
    slug: "gucci",
    logoUrl: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop&q=80",
    description: "High-end luxury fashion house famous for handbags, apparel, and footwear.",
    isFeatured: true
  },
  {
    id: "brand-balenciaga",
    name: "BALENCIAGA",
    slug: "balenciaga",
    logoUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop&q=80",
    description: "Avant-garde luxury fashion house based in Paris.",
    isFeatured: true
  },
  {
    id: "brand-amiri",
    name: "AMIRI",
    slug: "amiri",
    logoUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80",
    description: "High-end American streetwear and rock-and-roll luxury apparel.",
    isFeatured: true
  },
  {
    id: "brand-offwhite",
    name: "OFF-WHITE",
    slug: "off-white",
    logoUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&auto=format&fit=crop&q=80",
    description: "Italian luxury fashion label founded by Virgil Abloh.",
    isFeatured: true
  },
  {
    id: "brand-dior",
    name: "DIOR",
    slug: "dior",
    logoUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=1200&auto=format&fit=crop&q=80",
    description: "Iconic French luxury fashion house.",
    isFeatured: true
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  // WOMEN
  { id: "cat-w-bags", name: "Women's Bags", slug: "womens-bags", department: "women", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600", isFeatured: true, displayOrder: 1 },
  { id: "cat-w-rtw", name: "Women's Ready To Wear", slug: "womens-ready-to-wear", department: "women", imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600", isFeatured: true, displayOrder: 2 },
  { id: "cat-w-shoes", name: "Women's Shoes", slug: "womens-shoes", department: "women", imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600", isFeatured: true, displayOrder: 3 },
  { id: "cat-w-acc", name: "Women's Accessories", slug: "womens-accessories", department: "women", imageUrl: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600", isFeatured: true, displayOrder: 4 },

  // MEN
  { id: "cat-m-bags", name: "Men's Bags", slug: "mens-bags", department: "men", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", isFeatured: true, displayOrder: 1 },
  { id: "cat-m-rtw", name: "Men's Ready To Wear", slug: "mens-ready-to-wear", department: "men", imageUrl: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600", isFeatured: true, displayOrder: 2 },
  { id: "cat-m-shoes", name: "Men's Shoes", slug: "mens-shoes", department: "men", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", isFeatured: true, displayOrder: 3 },
  { id: "cat-m-acc", name: "Men's Accessories", slug: "mens-accessories", department: "men", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", isFeatured: true, displayOrder: 4 }
];

export const INITIAL_HOMEPAGE_CARDS: HomepageCard[] = [
  {
    id: "card-redefining-luxury",
    title: "REDEFINING LUXURY",
    subtitle: "Discover effortless, curated looks, and permanent fabrications designed to elevate your daily wardrobe.",
    department: "all",
    ctaText: "SHOP COLLECTION",
    linkUrl: "/shop",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&auto=format&fit=crop&q=80",
    active: true,
    displayOrder: 1
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: "m-1", title: "WOMEN", url: "/shop?department=women", department: "women", displayOrder: 1 },
  { id: "m-2", title: "MEN", url: "/shop?department=men", department: "men", displayOrder: 2 },
  { id: "m-4", title: "SALE", url: "/shop?sale=true", displayOrder: 4 },
];

export const INITIAL_PRODUCTS: Product[] = [
  // WOMEN
  {
    id: "prod-prada-bag-women",
    title: "Prada Cleo Brushed Leather Handbag",
    slug: "prada-cleo-brushed-leather-handbag",
    department: "women",
    category: "Women's Bags",
    brandId: "brand-prada",
    brandName: "PRADA",
    price: 3100,
    salePrice: 2750,
    sku: "PRD-W-BAG-001",
    stockPerSize: { OneSize: 5 },
    totalStock: 5,
    colors: ["Black", "Nude"],
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Sleek curved silhouette handbag reinterpreting an iconic 1990s Prada design.",
    isFeatured: true,
    isNewArrival: true,
    createdAt: "2026-08-22T16:00:00Z"
  },
  {
    id: "prod-dior-coat-women",
    title: "Dior Double-Breasted Wool & Silk Coat",
    slug: "dior-double-breasted-wool-silk-coat",
    department: "women",
    category: "Women's Ready To Wear",
    brandId: "brand-dior",
    brandName: "DIOR",
    price: 4500,
    sku: "DIR-W-COT-002",
    stockPerSize: { S: 3, M: 5, L: 2 },
    totalStock: 10,
    colors: ["Black", "Off-White"],
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Structured double-breasted coat in black wool and silk blend.",
    isFeatured: true,
    isNewArrival: true,
    createdAt: "2026-08-20T14:00:00Z"
  },
  {
    id: "prod-gucci-loafers-women",
    title: "Gucci Black Leather Horsebit Loafers",
    slug: "gucci-black-leather-horsebit-loafers",
    department: "women",
    category: "Women's Shoes",
    brandId: "brand-gucci",
    brandName: "GUCCI",
    price: 920,
    salePrice: 780,
    sku: "GUC-W-LFR-003",
    stockPerSize: { "37": 4, "38": 6, "39": 5 },
    totalStock: 15,
    colors: ["Black Leather"],
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Iconic Gucci horsebit loafer in black polished leather.",
    isFeatured: true,
    isNewArrival: false,
    createdAt: "2026-08-10T10:00:00Z"
  },
  {
    id: "prod-prada-sunglasses-women",
    title: "Prada Symbole Geometric Sunglasses",
    slug: "prada-symbole-geometric-sunglasses",
    department: "women",
    category: "Women's Accessories",
    brandId: "brand-prada",
    brandName: "PRADA",
    price: 520,
    sku: "PRD-W-SUN-004",
    stockPerSize: { OneSize: 8 },
    totalStock: 8,
    colors: ["Black Acetate"],
    images: [
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Bold faceted acetate sunglasses with metal Prada triangle logo.",
    isFeatured: true,
    isNewArrival: true,
    createdAt: "2026-08-15T12:00:00Z"
  },

  // MEN
  {
    id: "prod-prada-jacket-men",
    title: "Prada Re-Nylon Padded Bomber Jacket",
    slug: "prada-re-nylon-padded-bomber-jacket",
    department: "men",
    category: "Men's Ready To Wear",
    brandId: "brand-prada",
    brandName: "PRADA",
    price: 2850,
    salePrice: 2600,
    sku: "PRD-M-JKT-005",
    stockPerSize: { M: 6, L: 8, XL: 4 },
    totalStock: 18,
    colors: ["Black"],
    images: [
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Iconic Prada triangle logo bomber jacket crafted from regenerated nylon.",
    isFeatured: true,
    isNewArrival: true,
    createdAt: "2026-08-15T10:00:00Z"
  },
  {
    id: "prod-balenciaga-backpack-men",
    title: "Balenciaga Explorer Leather Backpack",
    slug: "balenciaga-explorer-leather-backpack",
    department: "men",
    category: "Men's Bags",
    brandId: "brand-balenciaga",
    brandName: "BALENCIAGA",
    price: 1650,
    sku: "BAL-M-BAG-006",
    stockPerSize: { OneSize: 4 },
    totalStock: 4,
    colors: ["Black Leather"],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Minimalist grainy calfskin backpack with front zip pocket and tone-on-tone logo.",
    isFeatured: true,
    isNewArrival: true,
    createdAt: "2026-08-18T12:00:00Z"
  },
  {
    id: "prod-balenciaga-sneakers-men",
    title: "Balenciaga Track Chunky Sneakers",
    slug: "balenciaga-track-chunky-sneakers",
    department: "men",
    category: "Men's Shoes",
    brandId: "brand-balenciaga",
    brandName: "BALENCIAGA",
    price: 1050,
    sku: "BAL-M-SNK-007",
    stockPerSize: { "41": 3, "42": 5, "43": 4 },
    totalStock: 12,
    colors: ["Black/Orange"],
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Multi-panel high-tech layered sneakers with dynamic sole.",
    isFeatured: true,
    isNewArrival: false,
    createdAt: "2026-08-12T14:00:00Z"
  },
  {
    id: "prod-amiri-watch-men",
    title: "Amiri Chronograph Black Steel Watch",
    slug: "amiri-chronograph-black-steel-watch",
    department: "men",
    category: "Men's Accessories",
    brandId: "brand-amiri",
    brandName: "AMIRI",
    price: 1200,
    sku: "AMR-M-WCH-008",
    stockPerSize: { OneSize: 6 },
    totalStock: 6,
    colors: ["Matte Black"],
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Matte black stainless steel timepiece with Swiss movement.",
    isFeatured: true,
    isNewArrival: true,
    createdAt: "2026-08-25T11:00:00Z"
  },

];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Sami Al-Khoury",
    email: "sami.khoury@gmail.com",
    phone: "+961 03 456 789",
    address: "Achrafieh, Sursock Street, Beirut",
    totalOrders: 3,
    totalSpentUSD: 5440,
    notes: "VIP Client.",
    createdAt: "2026-05-10T10:00:00Z"
  }
];

export const INITIAL_STAFF: any[] = [
  {
    id: "staff-1",
    name: "Hussein (Owner / Admin)",
    username: "hussein",
    password: "123",
    role: "STORE MANAGER",
    permissions: "FULL ACCESS",
    status: "ACTIVE"
  },
  {
    id: "staff-2",
    name: "System Admin",
    username: "admin",
    password: "123",
    role: "STORE MANAGER",
    permissions: "FULL ACCESS",
    status: "ACTIVE"
  },
  {
    id: "staff-3",
    name: "Boutique Cashier",
    username: "cashier",
    password: "123",
    role: "POS CASHIER",
    permissions: "POS TERMINAL ONLY",
    status: "ACTIVE"
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "supp-1",
    companyName: "Milan Luxury Wholesale S.r.l.",
    contactPerson: "Marco Rossi",
    email: "orders@milanluxurywholesale.it",
    phone: "+39 02 8847 2901",
    address: "Via Montenapoleone 18, 20121 Milano, Italy",
    createdAt: "2026-02-01T10:00:00Z"
  }
];

export const INITIAL_INVOICES: SupplierInvoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-0881",
    supplierId: "supp-1",
    supplierName: "Milan Luxury Wholesale S.r.l.",
    date: "2026-08-01",
    items: [
      { description: "Prada Cleo Handbags (Qty: 5)", quantity: 5, unitCostUSD: 2100, totalUSD: 10500 }
    ],
    totalAmountUSD: 10500,
    status: "paid",
    createdAt: "2026-08-01T12:00:00Z"
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "STX-88201",
    customerName: "Sami Al-Khoury",
    customerEmail: "sami.khoury@gmail.com",
    customerPhone: "+961 03 456 789",
    shippingAddress: "Achrafieh, Sursock Street, Beirut",
    city: "Beirut",
    country: "Lebanon",
    items: [
      {
        productId: "prod-prada-bag-women",
        productTitle: "Prada Cleo Brushed Leather Handbag",
        brandName: "PRADA",
        size: "OneSize",
        color: "Black",
        priceUSD: 2750,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80"
      }
    ],
    subtotalUSD: 2750,
    discountUSD: 0,
    shippingFeeUSD: 0,
    totalUSD: 2750,
    currency: "USD",
    exchangeRate: 1,
    totalInCurrency: 2750,
    status: "delivered",
    paymentMethod: "cod",
    createdAt: "2026-08-28T14:22:00Z"
  }
];

export const INITIAL_COUPONS = [
  { id: 'c-1', code: 'STYLUXE10', discountPercent: 10, active: true, createdAt: new Date().toISOString() },
  { id: 'c-2', code: 'VIP20', discountPercent: 20, active: true, createdAt: new Date().toISOString() },
  { id: 'c-3', code: 'WELCOME15', discountPercent: 15, active: true, createdAt: new Date().toISOString() }
];
