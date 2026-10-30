'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, X, Search, ShoppingBag, Heart, User, ChevronRight, ChevronLeft, ArrowRight, MessageCircle, Lock, Award, Ruler, Settings, Instagram
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { DataService, formatCurrency, getProductDisplayPrices } from '@/lib/store';
import { Product, Category, Brand, MenuItem } from '@/lib/types';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';
import { useActiveDepartment } from '@/lib/departmentContext';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { cart, currency, settings, wishlist, setIsCartOpen } = useCart();
  const deptContext = useActiveDepartment(settings);

  const [isPradaDrawerOpen, setIsPradaDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const [activeL1, setActiveL1] = useState<MenuItem | null>(null);
  const [activeL2, setActiveL2] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerUser, setCustomerUser] = useState<any>(null);
  const panelsContainerRef = React.useRef<HTMLDivElement>(null);

  // Logo Click handler: Guaranteed return to homepage, scroll-to-top, and secret 5-clicks to /admin
  const logoClicksRef = React.useRef<number>(0);
  const logoTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSecretLogoClick = (e: React.MouseEvent) => {
    logoClicksRef.current += 1;
    if (logoClicksRef.current >= 5) {
      e.preventDefault();
      router.push('/admin');
      logoClicksRef.current = 0;
      return;
    }
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    logoTimerRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 1500);

    // Close any open flyout navigation or search modals
    setIsPradaDrawerOpen(false);
    setIsSearchOpen(false);

    // If already on homepage, smoothly scroll right to top
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      e.preventDefault();
      router.push('/');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    setCategories(DataService.getCategories());
    setMenuItems(DataService.getMenuItems());
    setBrands(DataService.getBrands());
    setProducts(DataService.getProducts());
    setCustomerUser(DataService.getCustomerUser());

    const handleUpdate = () => {
      setCategories(DataService.getCategories());
      setMenuItems(DataService.getMenuItems());
      setBrands(DataService.getBrands());
      setProducts(DataService.getProducts());
      setCustomerUser(DataService.getCustomerUser());
    };

    const handleAuth = () => {
      setCustomerUser(DataService.getCustomerUser());
    };

    // Secret shortcut: Ctrl + Shift + A to secretly navigate to Admin panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        router.push('/admin');
      }
    };

    window.addEventListener('styluxe_data_updated', handleUpdate);
    window.addEventListener('styluxe_customer_auth_changed', handleAuth);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('styluxe_data_updated', handleUpdate);
      window.removeEventListener('styluxe_customer_auth_changed', handleAuth);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K to open search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsPradaDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track scroll position to enhance sticky navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search logic
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const all = DataService.getProducts();
      const results = all.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.brandName && p.brandName.toLowerCase().includes(q)) ||
        p.department.toLowerCase().includes(q) ||
        (q === 'sale' && p.salePrice)
      ).slice(0, 8);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Check if a menu item represents sale / discounts
  const isSaleMenuItem = React.useCallback((item: MenuItem): boolean => {
    const t = (item.title || '').toLowerCase();
    const u = (item.url || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    return id === 'sale' ||
           t.includes('sale') ||
           
           
           
           
           u.includes('sale=true') ||
           u.includes('sale=1');
  }, []);

  // Check if there are active discounted products in store for a menu item
  const hasDiscountedProducts = React.useCallback((item: MenuItem): boolean => {
    const clean = (item.title || '').toLowerCase();
    const dept = item.department ||
      (clean.includes('women') ? 'women' :
       clean.includes('men') ? 'men' :
       clean.includes('kids') ? 'kids' : null);

    if (dept) {
      return products.some(p => 
        p.department === dept && 
        Boolean(p.salePrice && p.salePrice > 0 && p.salePrice < p.price)
      );
    }

    // Global check across all products in store
    return products.some(p => 
      Boolean(p.salePrice && p.salePrice > 0 && p.salePrice < p.price)
    );
  }, [products]);

  // Level 1 Root Items from MenuBuilder (filtered so sale items only show if there are active discounts)
  const rootMenuItems = React.useMemo(() => {
    const roots = menuItems
      .filter(item => !item.parentId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    const baseRoots = roots.length > 0 ? roots : [
      { id: 'women', title: 'WOMEN', url: '/shop?department=women', displayOrder: 1 },
      { id: 'men', title: 'MEN', url: '/shop?department=men', displayOrder: 2 },
      { id: 'sale', title: 'SALE', url: '/shop?sale=true', displayOrder: 3 },
    ] as MenuItem[];

    return baseRoots.filter(item => {
      if (isSaleMenuItem(item)) {
        return hasDiscountedProducts(item);
      }
      return true;
    });
  }, [menuItems, isSaleMenuItem, hasDiscountedProducts]);

  // Helper to get Level 2 items for a given Level 1 item
  const getLevel2Items = React.useCallback((l1: MenuItem): MenuItem[] => {
    const directChildren = menuItems
      .filter(m => m.parentId === l1.id)
      .filter(m => !isSaleMenuItem(m) || hasDiscountedProducts(m))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    if (directChildren.length > 0) {
      return directChildren;
    }

    const clean = l1.title.trim().toLowerCase();
    const dept = l1.department || 
      (clean === 'women' ? 'women' :
       clean === 'men' ? 'men' :
       clean === 'kids' ? 'kids' : null);

    if (dept) {
      const deptChildren = menuItems
        .filter(m => m.parentId === dept)
        .filter(m => !isSaleMenuItem(m) || hasDiscountedProducts(m));
      if (deptChildren.length > 0) {
        return deptChildren;
      }

      const deptCats = categories.filter(c => c.department === dept || c.department === 'all');
      return deptCats.map(c => ({
        id: c.id,
        title: c.name,
        url: `/category/${c.slug}?department=${dept}`,
        parentId: l1.id,
        displayOrder: c.displayOrder || 1,
      }));
    }

    return [];
  }, [menuItems, categories, isSaleMenuItem, hasDiscountedProducts]);

  // Helper to get Level 3 items for a given Level 2 item
  const getLevel3Items = React.useCallback((l2: MenuItem): MenuItem[] => {
    const directChildren = menuItems
      .filter(m => m.parentId === l2.id)
      .filter(m => !isSaleMenuItem(m) || hasDiscountedProducts(m))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    if (directChildren.length > 0) {
      return directChildren;
    }

    const matchedCat = categories.find(c => c.id === l2.id || c.name.toLowerCase() === l2.title.toLowerCase());
    if (matchedCat?.subCategories && matchedCat.subCategories.length > 0) {
      return matchedCat.subCategories.map(sub => ({
        id: sub.id,
        title: sub.name,
        url: `/category/${sub.slug}?department=${matchedCat.department}`,
        parentId: l2.id,
        displayOrder: sub.displayOrder || 1,
      }));
    }

    return [];
  }, [menuItems, categories, isSaleMenuItem, hasDiscountedProducts]);

  // Smart URL resolver
  const resolveItemUrl = (item: MenuItem, parent?: MenuItem | null): string => {
    if (item.url && !item.url.includes('category=') && !item.url.includes('department=')) {
      return item.url;
    }

    const clean = item.title.trim().toLowerCase();
    if (clean === 'women') return '/shop?department=women';
    if (clean === 'men') return '/shop?department=men';
    if (clean === 'kids') return '/shop?department=kids';
    if (clean === 'sale') return '/shop?sale=true';
    if (clean === 'new arrivals') return '/shop?new=true';

    if (parent) {
      const pClean = parent.title.trim().toLowerCase();
      let parentDept = '';
      if (pClean === 'women') parentDept = 'women';
      else if (pClean === 'men') parentDept = 'men';
      else if (pClean === 'kids') parentDept = 'kids';

      if (parentDept) {
        return `/shop?department=${parentDept}&category=${encodeURIComponent(item.title.trim())}`;
      }
    }

    return item.url || `/shop?category=${encodeURIComponent(item.title.trim())}`;
  };

  const handleNavigateItem = (item: MenuItem, parent?: MenuItem | null) => {
    setIsPradaDrawerOpen(false);
    const url = resolveItemUrl(item, parent);
    router.push(url);
  };

  const handleSelectL1 = (item: MenuItem) => {
    if (activeL1?.id === item.id) {
      setActiveL1(null);
      setActiveL2(null);
      return;
    }
    setActiveL1(item);
    setActiveL2(null); // Keep Column 3 hidden until user clicks an item in Column 2!
    if (typeof window !== 'undefined' && window.innerWidth < 768 && panelsContainerRef.current) {
      setTimeout(() => {
        panelsContainerRef.current?.scrollTo({ left: 300, behavior: 'smooth' });
      }, 60);
    }
  };

  const handleSelectL2 = (item: MenuItem) => {
    if (activeL2?.id === item.id) {
      setActiveL2(null);
      return;
    }
    setActiveL2(item);
    if (typeof window !== 'undefined' && window.innerWidth < 768 && panelsContainerRef.current) {
      setTimeout(() => {
        panelsContainerRef.current?.scrollTo({ left: 620, behavior: 'smooth' });
      }, 60);
    }
  };

  const handleBackToL1 = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && panelsContainerRef.current) {
      panelsContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleBackToL2 = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && panelsContainerRef.current) {
      panelsContainerRef.current?.scrollTo({ left: 300, behavior: 'smooth' });
    }
  };

  // Hide storefront consumer header inside private /admin control panel
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* 1. Promo Announcement Bar */}
      <div className="promo-bar">
        <div className="promo-text-container">
          <div className="promo-text">
            <span>✦ 100% AUTHENTIC GUARANTEED</span>
            <span>•</span>
            <span>FREE EXPRESS SHIPPING ON ORDERS OVER {formatCurrency(settings.freeShippingThresholdUSD || 149, currency, settings.lbpRate, settings.eurRate)}</span>
            <span>•</span>
            <span>CASH ON DELIVERY & INSTANT POS AVAILABLE</span>
            <span>•</span>
            <span>WORLDWIDE EXPRESS SHIPPING</span>
            <span>✦ 100% AUTHENTIC GUARANTEED</span>
            <span>•</span>
            <span>FREE EXPRESS SHIPPING ON ORDERS OVER {formatCurrency(settings.freeShippingThresholdUSD || 149, currency, settings.lbpRate, settings.eurRate)}</span>
            <span>•</span>
            <span>CASH ON DELIVERY & INSTANT POS AVAILABLE</span>
            <span>•</span>
            <span>WORLDWIDE EXPRESS SHIPPING</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header className={`navbar ${isScrolled ? 'is-scrolled shadow-xs' : ''}`}>
        <div className="nav-container">
          
          {/* Left Action: Menu and Search Triggers Side-by-Side */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => {
                const items = DataService.getMenuItems();
                const prods = DataService.getProducts();
                setProducts(prods);
                setMenuItems(items);
                setCategories(DataService.getCategories());

                const checkItemHasDiscount = (item: MenuItem): boolean => {
                  const clean = (item.title || '').toLowerCase();
                  const dept = item.department ||
                    (clean.includes('women') ? 'women' :
                     clean.includes('men') ? 'men' :
                     clean.includes('kids') ? 'kids' : null);

                  if (dept) {
                    return prods.some(p => p.department === dept && Boolean(p.salePrice && p.salePrice > 0 && p.salePrice < p.price));
                  }
                  return prods.some(p => Boolean(p.salePrice && p.salePrice > 0 && p.salePrice < p.price));
                };

                const checkIsSale = (item: MenuItem): boolean => {
                  const t = (item.title || '').toLowerCase();
                  const u = (item.url || '').toLowerCase();
                  const id = (item.id || '').toLowerCase();
                  return id === 'sale' || t.includes('sale') ||    u.includes('sale=true');
                };

                const rawRoots = items.filter(i => !i.parentId && i.id !== 'kids' && i.department !== 'kids' && (i.title || '').toLowerCase() !== 'kids');
                const baseRoots = rawRoots.length > 0 ? rawRoots : [
                  { id: 'women', title: 'WOMEN', url: '/shop?department=women', displayOrder: 1 },
                  { id: 'men', title: 'MEN', url: '/shop?department=men', displayOrder: 2 },
                  { id: 'sale', title: 'SALE', url: '/shop?sale=true', displayOrder: 3 },
                ] as MenuItem[];

                const roots = baseRoots.filter(i => !checkIsSale(i) || checkItemHasDiscount(i));
                // Sub-menus only appear when user explicitly clicks a category!
                setActiveL1(null);
                setActiveL2(null);
                setIsPradaDrawerOpen(true);
              }}
              className="flex items-center text-zinc-900 hover:text-black transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu size={19} strokeWidth={1.8} />
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-900 hover:text-black transition-colors cursor-pointer uppercase tracking-[0.1em]"
              title="Search Catalog"
            >
              <Search size={15} strokeWidth={1.8} />
              <span className="tracking-[0.1em] hidden xs:inline-block sm:inline-block">SEARCH</span>
            </button>
          </div>

          {/* Center Brand Logo: STYLUXE Video Logo / Image Logo / Text (Secret 5-click access to /admin) */}
          <div className="brand-logo flex items-center justify-center">
            <Link 
              href="/" 
              onClick={handleSecretLogoClick}
              className="flex items-center justify-center py-0.5 group cursor-pointer" 
              title={settings.storeName || 'STYLUXE'}
            >
              {settings.logoVideoUrl && !settings.hideVideoLogo ? (
                <div className="relative flex items-center justify-center h-8 sm:h-10 max-h-[44px] overflow-hidden">
                  <video 
                    src={settings.logoVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="h-full w-auto max-w-[170px] sm:max-w-[220px] object-contain pointer-events-none select-none group-hover:opacity-90 transition-opacity"
                  />
                </div>
              ) : settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.storeName || 'STYLUXE'} 
                  className="h-7 sm:h-9 max-h-[40px] w-auto max-w-[160px] sm:max-w-[200px] object-contain pointer-events-none select-none group-hover:opacity-85 transition-opacity" 
                />
              ) : (
                <span className="font-serif text-[17px] sm:text-[19px] font-semibold tracking-[0.25em] text-zinc-950 uppercase group-hover:opacity-80 transition-opacity select-none">
                  {settings.storeName || 'STYLUXE'}
                </span>
              )}
            </Link>
          </div>

          {/* Right Utilities: CONTACT US, Account, Cart Bag */}
          <div className="nav-utilities flex items-center gap-3.5 sm:gap-5 md:gap-6">
            
            {/* Contact Us Link matching active department WhatsApp */}
            <a 
              href={deptContext.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block text-[12px] font-semibold text-zinc-900 hover:text-black uppercase tracking-[0.1em] transition-colors"
            >
              CONTACT US
            </a>

            {/* Direct Instagram Link for Active Department */}
            <a 
              href={deptContext.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center text-zinc-900 hover:text-pink-600 transition-colors cursor-pointer"
              title={`Instagram (${deptContext.department === 'women' ? '@styluxe.womenn' : '@styluxe.men_lb'})`}
              aria-label="Instagram Profile"
            >
              <Instagram size={18} strokeWidth={1.8} />
            </a>

            {/* User Account Link / Trigger */}
            <Link 
              href="/account" 
              className="relative flex items-center text-zinc-900 hover:text-black transition-colors"
              title={customerUser ? `My Account (${customerUser.name})` : "My Account & Orders"}
              aria-label="My Account & Orders"
            >
              <User size={19} strokeWidth={1.8} />
              {customerUser && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
              )}
            </Link>

            {/* Shopping Bag Trigger with slide-out Cart Drawer */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center text-zinc-900 hover:text-black transition-colors cursor-pointer"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-zinc-950 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cart.reduce((a, c) => a + c.quantity, 0)}
                </span>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* 3. MULTI-COLUMN FLYOUT NAVIGATION DRAWER */}
      {isPradaDrawerOpen && (
        <div className="fixed inset-0 z-[99999] flex animate-fadeIn">
          
          {/* Dark Blurred Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsPradaDrawerOpen(false)}
          />

          {/* Multi-Column Panels Container */}
          <div 
            ref={panelsContainerRef}
            className="relative h-full flex flex-row overflow-x-auto overflow-y-hidden shadow-2xl z-10 bg-white border-r border-zinc-200/80 scroll-smooth snap-x snap-mandatory"
          >
            
            {/* ==================== COLUMN 1: MAIN NAVIGATION (LEVEL 1) ==================== */}
            <div className="w-[85vw] max-w-[310px] sm:w-72 md:w-80 shrink-0 bg-white h-full border-r border-zinc-200/80 flex flex-col justify-between overflow-y-auto snap-start">
              
              <div className="flex-shrink-0">
                {/* Top Header Row: ✕ Close and 🔍 Search side by side */}
                <div className="px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between bg-white border-b border-zinc-100">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setIsPradaDrawerOpen(false)}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-900 hover:text-black transition-colors cursor-pointer"
                    >
                      <X size={16} strokeWidth={2} />
                      <span>CLOSE</span>
                    </button>

                    <button 
                      onClick={() => {
                        setIsPradaDrawerOpen(false);
                        setIsSearchOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      <Search size={15} strokeWidth={2} />
                      <span>SEARCH</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">MENU</span>
                </div>

                {/* Level 1 Menu Items */}
                <div className="py-3 px-2 space-y-1">
                  {rootMenuItems.map(item => {
                    const l2 = getLevel2Items(item);
                    const hasChildren = l2.length > 0;
                    const isActive = activeL1?.id === item.id;
                    const isPreOrder = item.title.toLowerCase().includes('pre-order') || item.url?.includes('pre-order');
                    const isSale = item.title.toLowerCase().includes('sale') || item.url?.includes('sale');

                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          if (hasChildren) {
                            handleSelectL1(item);
                          } else {
                            handleNavigateItem(item);
                          }
                        }}
                        className={`group flex items-center justify-between px-5 py-3.5 rounded-xs cursor-pointer select-none transition-all duration-200 ${
                          isActive 
                            ? 'bg-zinc-950 text-white font-bold shadow-xs' 
                            : 'hover:bg-zinc-100/80 text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[14px] sm:text-[15px] tracking-wide">
                            {item.title}
                          </span>
                          {isPreOrder && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                              isActive ? 'bg-amber-400 text-black' : 'bg-amber-100 text-amber-900'
                            }`}>
                              2026
                            </span>
                          )}
                          {isSale && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                              isActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                            }`}>
                              SALE
                            </span>
                          )}
                        </div>

                        {hasChildren && (
                          <ChevronRight 
                            size={16} 
                            strokeWidth={isActive ? 2.5 : 1.5}
                            className={`transition-all duration-200 ${
                              isActive 
                                ? 'text-amber-400 translate-x-1' 
                                : 'text-zinc-400 group-hover:translate-x-1 group-hover:text-zinc-700'
                            }`} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Footer Section: WhatsApp VIP Concierge & Official Instagram */}
              <div className="p-4 sm:p-5 border-t border-zinc-100 bg-zinc-50/70 flex-shrink-0 space-y-2.5">
                <a 
                  href={activeL1?.id === 'men' ? deptContext.menWhatsappUrl : activeL1?.id === 'women' ? deptContext.womenWhatsappUrl : deptContext.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsPradaDrawerOpen(false)}
                  className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 transition-colors uppercase tracking-wider cursor-pointer"
                  title="VIP WhatsApp Concierge"
                >
                  <MessageCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>VIP CONCIERGE ASSISTANCE</span>
                </a>

                <a 
                  href={activeL1?.id === 'men' ? deptContext.menInstagramUrl : activeL1?.id === 'women' ? deptContext.womenInstagramUrl : deptContext.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsPradaDrawerOpen(false)}
                  className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 transition-colors uppercase tracking-wider cursor-pointer"
                  title="Official Instagram"
                >
                  <Instagram size={16} className={activeL1?.id === 'men' ? "text-sky-500 shrink-0" : "text-pink-500 shrink-0"} />
                  <span>FOLLOW ON INSTAGRAM</span>
                </a>

                <Link
                  href="/account"
                  onClick={() => setIsPradaDrawerOpen(false)}
                  className="flex items-center gap-2.5 text-xs font-bold text-zinc-900 hover:text-black transition-colors uppercase tracking-wider cursor-pointer pt-1 border-t border-zinc-200"
                  title="My Account & Orders"
                >
                  <User size={16} className="text-zinc-950 shrink-0" />
                  <span className="font-black text-zinc-950">
                    {customerUser ? `MY ACCOUNT (${customerUser.name})` : 'MY ACCOUNT & ORDERS'}
                  </span>
                </Link>
              </div>

            </div>

            {/* ==================== COLUMN 2: LEVEL 2 SUB-ITEMS ==================== */}
            {activeL1 && (() => {
              const l2Items = getLevel2Items(activeL1);
              if (l2Items.length === 0) return null;

              return (
                <div className="w-[85vw] max-w-[310px] sm:w-72 md:w-80 shrink-0 bg-zinc-50/50 backdrop-blur-xs h-full border-r border-zinc-200/80 flex flex-col justify-between overflow-y-auto animate-menu-column snap-start">
                  
                  <div className="flex-shrink-0">
                    {/* Column 2 Header */}
                    <div className="px-6 py-5 sm:py-6 bg-white border-b border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleBackToL1}
                          className="sm:hidden flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-black cursor-pointer p-1"
                          title="Back"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">DEPARTMENT</span>
                          <h2 className="font-sans text-sm font-bold text-zinc-950 uppercase tracking-wide">
                            {activeL1.title}
                          </h2>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveL1(null);
                          setActiveL2(null);
                        }} 
                        className="hidden sm:block text-[11px] font-bold text-zinc-400 hover:text-zinc-950 cursor-pointer uppercase tracking-wider"
                      >
                        CLOSE ✕
                      </button>
                    </div>

                    {/* View All Option */}
                    <div 
                      onClick={() => handleNavigateItem(activeL1)}
                      className="px-6 py-3.5 cursor-pointer select-none transition-all duration-200 bg-white hover:bg-zinc-100 border-b border-zinc-100 flex items-center justify-between group"
                    >
                      <span className="font-sans text-[12px] font-black text-amber-700 uppercase tracking-wider">
                        EXPLORE ALL {activeL1.title}
                      </span>
                      <ArrowRight size={14} className="text-amber-600 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Level 2 Items List */}
                    <div className="py-2 px-2 space-y-0.5">
                      {l2Items.map(item => {
                        const l3 = getLevel3Items(item);
                        const hasChildren = l3.length > 0;
                        const isSelected = activeL2?.id === item.id;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (hasChildren) {
                                handleSelectL2(item);
                              } else {
                                handleNavigateItem(item, activeL1);
                              }
                            }}
                            className={`group flex items-center justify-between px-5 py-3 rounded-xs cursor-pointer select-none transition-all duration-200 ${
                              isSelected 
                                ? 'bg-zinc-950 text-white font-bold shadow-xs' 
                                : 'hover:bg-zinc-200/60 text-zinc-800'
                            }`}
                          >
                            <span className="font-sans text-[14px]">
                              {item.title}
                            </span>
                            
                            {hasChildren && (
                              <ChevronRight 
                                size={15} 
                                strokeWidth={isSelected ? 2.5 : 1.5}
                                className={`transition-all duration-200 ${
                                  isSelected 
                                    ? 'text-amber-400 translate-x-1' 
                                    : 'text-zinc-400 group-hover:translate-x-1 group-hover:text-zinc-700'
                                }`} 
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>
              );
            })()}

            {/* ==================== COLUMN 3: LEVEL 3 LEAF ITEMS ==================== */}
            {activeL1 && activeL2 && (() => {
              const l3Items = getLevel3Items(activeL2);
              if (l3Items.length === 0) return null;

              return (
                <div className="w-[85vw] max-w-[310px] sm:w-72 md:w-80 shrink-0 bg-white h-full border-r border-zinc-200/80 flex flex-col justify-between overflow-y-auto animate-menu-column snap-start">
                  
                  <div className="flex-shrink-0">
                    {/* Column 3 Header */}
                    <div className="px-6 py-5 sm:py-6 bg-white border-b border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleBackToL2}
                          className="sm:hidden flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-black cursor-pointer p-1"
                          title="Back"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">CATEGORY</span>
                          <h2 className="font-sans text-sm font-bold text-zinc-950 uppercase tracking-wide">
                            {activeL2.title}
                          </h2>
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveL2(null)} 
                        className="hidden sm:block text-[11px] font-bold text-zinc-400 hover:text-zinc-950 cursor-pointer uppercase tracking-wider"
                      >
                        CLOSE ✕
                      </button>
                    </div>

                    {/* View All Option */}
                    <div 
                      onClick={() => handleNavigateItem(activeL2, activeL1)}
                      className="px-6 py-3.5 cursor-pointer select-none transition-all duration-200 bg-zinc-50 hover:bg-zinc-100 border-b border-zinc-100 flex items-center justify-between group"
                    >
                      <span className="font-sans text-[12px] font-black text-zinc-900 uppercase tracking-wider">
                        ALL {activeL2.title}
                      </span>
                      <ArrowRight size={14} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Level 3 Leaf Items */}
                    <div className="py-2 px-2 space-y-0.5">
                      {l3Items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleNavigateItem(item, activeL1)}
                          className="group px-5 py-2.5 rounded-xs font-sans text-[13.5px] text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/70 transition-all duration-200 cursor-pointer select-none flex items-center justify-between"
                        >
                          <span>{item.title}</span>
                          <span className="text-zinc-300 group-hover:text-zinc-950 group-hover:translate-x-1 transition-all text-xs font-bold">
                            →
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>

                </div>
              );
            })()}

          </div>

        </div>
      )}

      {/* Full-Screen Predictive Search Overlay Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-[99999] bg-zinc-950/80 backdrop-blur-md flex flex-col items-center pt-10 sm:pt-20 px-4 overflow-y-auto"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="w-full max-w-3xl bg-white rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-zinc-950" />
                <h3 className="text-xs font-black tracking-[0.25em] text-zinc-950 uppercase">
                  LIVE CATALOG SEARCH
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono bg-zinc-100 text-zinc-600 rounded border border-zinc-200">
                  ESC to close
                </kbd>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="text-zinc-400 hover:text-zinc-950 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={22} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Prada, Gucci, Amiri, Bags, Shoes, Jackets, Jeans..."
                className="w-full pl-12 pr-12 py-4 text-sm sm:text-base border-2 border-zinc-200 focus:border-zinc-950 rounded-xl focus:outline-none placeholder:text-zinc-400 font-bold uppercase transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-zinc-400 hover:text-zinc-950 uppercase"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Trending Searches Pills (When query is empty) */}
            {!searchQuery.trim() && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase block">
                  TRENDING DESIGNERS & COLLECTIONS
                </span>
                <div className="flex flex-wrap gap-2">
                  {['PRADA', 'GUCCI', 'AMIRI', 'JEANS', 'SHOES', 'JACKETS', 'BAGS', 'SALE'].map(term => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-950 hover:text-white transition-all rounded-full text-xs font-bold uppercase tracking-wider text-zinc-800 cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    {searchResults.length} PRODUCTS FOUND
                  </span>
                  <Link
                    href={`/shop`}
                    onClick={() => setIsSearchOpen(false)}
                    className="text-[11px] font-bold text-zinc-900 hover:underline uppercase"
                  >
                    View All in Catalog →
                  </Link>
                </div>

                {searchResults.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      NO LUXURY PIECES MATCHED &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Try searching for broader terms like &quot;Prada&quot;, &quot;Jeans&quot;, or &quot;Shoes&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResults.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/product/${product.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3.5 p-3 border border-zinc-100 hover:border-zinc-950 rounded-xl hover:bg-zinc-50 transition-all group"
                      >
                        <img 
                          src={product.images[0]} 
                          alt={product.title} 
                          className="w-16 h-16 object-cover rounded-lg bg-zinc-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase block truncate">
                            {product.brandName || 'STYLUXE'}
                          </span>
                          <h4 className="text-xs font-bold text-zinc-950 group-hover:underline truncate uppercase">
                            {product.title}
                          </h4>
                          <span className="text-xs font-black text-zinc-950">
                            {formatCurrency(getProductDisplayPrices(product.price, product.salePrice).currentPrice, currency, settings.lbpRate, settings.eurRate)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
