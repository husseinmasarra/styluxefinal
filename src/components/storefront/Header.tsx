'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Menu, X, Search, ShoppingBag, Heart, User, ChevronRight, MessageCircle, Lock, Award, Ruler, Settings
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { DataService, formatCurrency } from '@/lib/store';
import { Product, Category, Brand, MenuItem } from '@/lib/types';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';

export function Header() {
  const router = useRouter();
  const { cart, currency, settings, wishlist, setIsCartOpen } = useCart();

  const [isPradaDrawerOpen, setIsPradaDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const [activeL1, setActiveL1] = useState<MenuItem | null>(null);
  const [activeL2, setActiveL2] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    setCategories(DataService.getCategories());
    setMenuItems(DataService.getMenuItems());
    setBrands(DataService.getBrands());
    const handleUpdate = () => {
      setCategories(DataService.getCategories());
      setMenuItems(DataService.getMenuItems());
      setBrands(DataService.getBrands());
    };

    // Secret shortcut: Ctrl + Shift + A to secretly navigate to Admin panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        router.push('/admin');
      }
    };

    window.addEventListener('styluxe_data_updated', handleUpdate);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('styluxe_data_updated', handleUpdate);
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Level 1 Root Items from MenuBuilder
  const rootMenuItems = React.useMemo(() => {
    const roots = menuItems
      .filter(item => !item.parentId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    if (roots.length > 0) return roots;

    return [
      { id: 'women', title: 'WOMEN', url: '/shop?department=women', displayOrder: 1 },
      { id: 'men', title: 'MEN', url: '/shop?department=men', displayOrder: 2 },
      { id: 'sale', title: 'SALE', url: '/shop?sale=true', displayOrder: 3 },
    ] as MenuItem[];
  }, [menuItems]);

  // Helper to get Level 2 items for a given Level 1 item
  const getLevel2Items = React.useCallback((l1: MenuItem): MenuItem[] => {
    const directChildren = menuItems
      .filter(m => m.parentId === l1.id)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    if (directChildren.length > 0) {
      return directChildren;
    }

    const clean = l1.title.trim().toLowerCase();
    const dept = l1.department || 
      (clean === 'women' || clean === 'النساء' || clean === 'نساء' ? 'women' :
       clean === 'men' || clean === 'الرجال' || clean === 'رجال' ? 'men' :
       clean === 'kids' || clean === 'الأطفال' || clean === 'اطفال' ? 'kids' : null);

    if (dept) {
      const deptChildren = menuItems.filter(m => m.parentId === dept);
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
  }, [menuItems, categories]);

  // Helper to get Level 3 items for a given Level 2 item
  const getLevel3Items = React.useCallback((l2: MenuItem): MenuItem[] => {
    const directChildren = menuItems
      .filter(m => m.parentId === l2.id)
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
  }, [menuItems, categories]);

  // Smart URL resolver
  const resolveItemUrl = (item: MenuItem, parent?: MenuItem | null): string => {
    if (item.url && !item.url.includes('category=') && !item.url.includes('department=')) {
      return item.url;
    }

    const clean = item.title.trim().toLowerCase();
    if (clean === 'women' || clean === 'النساء' || clean === 'نساء') return '/shop?department=women';
    if (clean === 'men' || clean === 'الرجال' || clean === 'رجال') return '/shop?department=men';
    if (clean === 'kids' || clean === 'الأطفال' || clean === 'اطفال') return '/shop?department=kids';
    if (clean === 'sale' || clean === 'البيع' || clean === 'تخفيضات' || clean === 'تنزيلات') return '/shop?sale=true';
    if (clean === 'new arrivals' || clean === 'الوافدون الجدد' || clean === 'جديد') return '/shop?new=true';

    if (parent) {
      const pClean = parent.title.trim().toLowerCase();
      let parentDept = '';
      if (pClean === 'women' || pClean === 'النساء' || pClean === 'نساء') parentDept = 'women';
      else if (pClean === 'men' || pClean === 'الرجال' || pClean === 'رجال') parentDept = 'men';
      else if (pClean === 'kids' || pClean === 'الأطفال') parentDept = 'kids';

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

  return (
    <>
      {/* 1. Promo Announcement Bar */}
      <div className="promo-bar">
        <div className="promo-text-container">
          <div className="promo-text">
            <span>✦ 100% AUTHENTIC GUARANTEED</span>
            <span>•</span>
            <span>WORLDWIDE EXPRESS SHIPPING</span>
            <span>•</span>
            <span>CASH ON DELIVERY & INSTANT POS AVAILABLE</span>
            <span>✦ 100% AUTHENTIC GUARANTEED</span>
            <span>•</span>
            <span>WORLDWIDE EXPRESS SHIPPING</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header className="navbar">
        <div className="nav-container">
          
          {/* Left Action: Menu and Search Triggers Side-by-Side */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => {
                setMenuItems(DataService.getMenuItems());
                setCategories(DataService.getCategories());
                setActiveL1(null);
                setActiveL2(null);
                setIsPradaDrawerOpen(true);
              }}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-900 hover:text-black transition-colors cursor-pointer uppercase tracking-[0.1em]"
              title="Open Navigation Menu"
            >
              <Menu size={16} strokeWidth={1.8} />
              <span className="tracking-[0.1em]">MENU</span>
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

          {/* Center Brand Logo: STYLUXE */}
          <div className="brand-logo flex items-center justify-center">
            <Link href="/" className="flex items-center justify-center py-1 group" title="STYLUXE">
              <span className="font-serif text-[22px] sm:text-[24px] font-semibold tracking-[0.25em] text-zinc-950 uppercase group-hover:opacity-80 transition-opacity select-none">
                STYLUXE
              </span>
            </Link>
          </div>

          {/* Right Utilities: CONTACT US, Settings, Account, Cart Bag */}
          <div className="nav-utilities flex items-center gap-3.5 sm:gap-5 md:gap-6">
            
            {/* Contact Us Link matching reference screenshot */}
            <a 
              href={`https://wa.me/${(settings.whatsappNumber || '96170123456').replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block text-[12px] font-semibold text-zinc-900 hover:text-black uppercase tracking-[0.1em] transition-colors"
            >
              CONTACT US
            </a>

            {/* Admin / Settings Trigger */}
            <Link 
              href="/admin" 
              className="text-zinc-900 hover:text-black transition-colors"
              title="Admin Control Panel"
            >
              <Settings size={18} strokeWidth={1.8} />
            </Link>

            {/* User Account Link / Trigger */}
            <Link 
              href="/checkout" 
              className="text-zinc-900 hover:text-black transition-colors"
              title="My Account"
            >
              <User size={19} strokeWidth={1.8} />
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

      {/* 3. MULTI-COLUMN FLYOUT NAVIGATION DRAWER (100% EXACT MATCH TO PRADA REFERENCE SCREENSHOT) */}
      {isPradaDrawerOpen && (
        <div className="fixed inset-0 z-[99999] flex animate-fadeIn">
          
          {/* Dark Blurred Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsPradaDrawerOpen(false)}
          />
          {/* Multi-Column Panels Container */}
          <div className="relative h-full flex flex-row overflow-x-auto overflow-y-hidden shadow-2xl z-10 bg-white">
            
            {/* ==================== COLUMN 1: MAIN NAVIGATION (LEVEL 1) ==================== */}
            <div className={`w-[85vw] max-w-[320px] sm:w-80 shrink-0 bg-white h-full border-r border-zinc-200/80 flex flex-col justify-between overflow-y-auto animate-slideRight ${activeL1 ? 'hidden sm:flex' : 'flex'}`}>
              
              <div className="flex-shrink-0">
                {/* Top Header Row: ✕ Close and 🔍 Search side by side */}
                <div className="px-6 sm:px-8 py-6 sm:py-7 flex items-center gap-7 bg-white border-b border-zinc-100">
                  <button 
                    onClick={() => setIsPradaDrawerOpen(false)}
                    className="flex items-center gap-2 text-sm font-normal text-zinc-900 hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    <X size={17} strokeWidth={1.75} />
                    <span>Close</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsPradaDrawerOpen(false);
                      setIsSearchOpen(true);
                    }}
                    className="flex items-center gap-2 text-sm font-normal text-zinc-900 hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    <Search size={16} strokeWidth={1.75} />
                    <span>Search</span>
                  </button>
                </div>

                {/* Level 1 Menu Items directly from MenuBuilder */}
                <div className="py-4 space-y-0.5">
                  {rootMenuItems.map(item => {
                    const l2 = getLevel2Items(item);
                    const hasChildren = l2.length > 0;
                    const isActive = activeL1?.id === item.id;

                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          if (hasChildren) {
                            setActiveL1(isActive ? null : item);
                            setActiveL2(null);
                          } else {
                            handleNavigateItem(item);
                          }
                        }}
                        className={`flex items-center justify-between px-6 sm:px-8 py-3.5 cursor-pointer select-none transition-colors ${
                          isActive ? 'bg-zinc-50 text-zinc-950 font-medium' : 'hover:bg-zinc-50 text-zinc-900'
                        }`}
                      >
                        <span className="font-sans text-[15px] font-normal">
                          {item.title}
                        </span>
                        {hasChildren && (
                          <ChevronRight 
                            size={16} 
                            strokeWidth={1.5}
                            className={`transition-all duration-200 ${
                              isActive ? 'text-zinc-950 translate-x-0.5' : 'text-zinc-400'
                            }`} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Footer Section: Contact us */}
              <div className="p-6 sm:p-8 border-t border-zinc-100 bg-white flex-shrink-0">
                <a 
                  href={`https://wa.me/${settings.whatsappNumber || '96170123456'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsPradaDrawerOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-normal text-zinc-700 hover:text-zinc-950 transition-colors"
                >
                  <MessageCircle size={16} strokeWidth={1.5} />
                  <span>Contact us</span>
                </a>
              </div>

            </div>

            {/* ==================== COLUMN 2: LEVEL 2 SUB-ITEMS ==================== */}
            {(() => {
              if (!activeL1) return null;
              const l2Items = getLevel2Items(activeL1);
              if (l2Items.length === 0) return null;

              return (
                <div className={`w-[85vw] max-w-[320px] sm:w-80 shrink-0 bg-white h-full border-r border-zinc-200/80 flex flex-col justify-between overflow-y-auto animate-slideRight ${activeL2 ? 'hidden sm:flex' : 'flex'}`}>
                  
                  <div className="flex-shrink-0">
                    {/* Column 2 Header */}
                    <div className="px-8 py-7 bg-white border-b border-zinc-100 flex items-center justify-between">
                      <h2 className="font-sans text-sm font-medium text-zinc-950">
                        {activeL1.title}
                      </h2>
                      <button 
                        onClick={() => {
                          setActiveL1(null);
                          setActiveL2(null);
                        }} 
                        className="text-xs font-normal text-zinc-500 hover:text-zinc-950 cursor-pointer"
                      >
                        ← Back
                      </button>
                    </div>

                    {/* View All Option */}
                    <div 
                      onClick={() => handleNavigateItem(activeL1)}
                      className="px-8 py-3 cursor-pointer select-none transition-colors hover:bg-zinc-50 border-b border-zinc-100"
                    >
                      <span className="font-sans text-[13px] font-bold text-zinc-600 uppercase tracking-wider">
                        All {activeL1.title}
                      </span>
                    </div>

                    {/* Level 2 Items List */}
                    <div className="py-3 space-y-0.5">
                      {l2Items.map(item => {
                        const l3 = getLevel3Items(item);
                        const hasChildren = l3.length > 0;
                        const isSelected = activeL2?.id === item.id;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (hasChildren) {
                                setActiveL2(isSelected ? null : item);
                              } else {
                                handleNavigateItem(item, activeL1);
                              }
                            }}
                            className={`flex items-center justify-between px-8 py-3 cursor-pointer select-none transition-colors ${
                              isSelected ? 'bg-zinc-50 text-zinc-950 font-medium' : 'hover:bg-zinc-50 text-zinc-800'
                            }`}
                          >
                            <span className="font-sans text-[14px] font-normal">
                              {item.title}
                            </span>
                            
                            {hasChildren && (
                              <ChevronRight 
                                size={15} 
                                strokeWidth={1.5}
                                className={`transition-all duration-200 ${
                                  isSelected ? 'text-zinc-950 translate-x-0.5' : 'text-zinc-400'
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
            {(() => {
              if (!activeL1 || !activeL2) return null;
              const l3Items = getLevel3Items(activeL2);
              if (l3Items.length === 0) return null;

              return (
                <div className="w-[85vw] max-w-[320px] sm:w-80 shrink-0 bg-white h-full border-r border-zinc-200/80 flex flex-col justify-between overflow-y-auto animate-slideRight">
                  
                  <div className="flex-shrink-0">
                    {/* Column 3 Header */}
                    <div className="px-8 py-7 bg-white border-b border-zinc-100 flex items-center justify-between">
                      <h2 className="font-sans text-sm font-medium text-zinc-950">
                        {activeL2.title}
                      </h2>
                      <button 
                        onClick={() => setActiveL2(null)} 
                        className="text-xs font-normal text-zinc-500 hover:text-zinc-950 cursor-pointer"
                      >
                        ← Back
                      </button>
                    </div>

                    {/* View All Option */}
                    <div 
                      onClick={() => handleNavigateItem(activeL2, activeL1)}
                      className="px-8 py-3 cursor-pointer select-none transition-colors hover:bg-zinc-50 border-b border-zinc-100"
                    >
                      <span className="font-sans text-[13px] font-bold text-zinc-600 uppercase tracking-wider">
                        All {activeL2.title}
                      </span>
                    </div>

                    {/* Level 3 Leaf Items */}
                    <div className="py-3 space-y-0.5">
                      {l3Items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleNavigateItem(item, activeL1)}
                          className="px-8 py-3 font-sans text-[14px] font-normal text-zinc-800 hover:text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer select-none block"
                        >
                          {item.title}
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
                            {formatCurrency(product.salePrice || product.price, currency, settings.lbpRate, settings.eurRate)}
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
