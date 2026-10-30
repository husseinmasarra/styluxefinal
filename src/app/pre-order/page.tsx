'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  SlidersHorizontal, 
  Package, 
  Check, 
  ArrowUpDown, 
  Tag, 
  AlertCircle,
  Truck,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
import { DataService, formatCurrency } from '@/lib/store';
import { Product, Brand } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/lib/CartContext';

function PreOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, settings } = useCart();

  const deptParam = searchParams.get('department') || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(deptParam);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadData = () => {
    setProducts(DataService.getProducts());
    setBrands(DataService.getBrands());
  };

  useEffect(() => {
    if (deptParam) {
      setSelectedDept(deptParam);
    }
  }, [deptParam]);

  // Filter ONLY products where isPreOrder is true
  const preOrderProducts = useMemo(() => {
    return products.filter(p => p.isPreOrder === true);
  }, [products]);

  // Apply department filter
  const deptFiltered = useMemo(() => {
    if (selectedDept === 'all') return preOrderProducts;
    return preOrderProducts.filter(p => {
      const pDept = (p.department || 'all').toLowerCase();
      return pDept === selectedDept.toLowerCase() || pDept === 'all';
    });
  }, [preOrderProducts, selectedDept]);

  // Available brands in the pre-order catalog
  const availableBrands = useMemo(() => {
    return brands.filter(b => 
      deptFiltered.some(p => p.brandId === b.id || p.brandName?.toLowerCase() === b.name.toLowerCase())
    );
  }, [brands, deptFiltered]);

  // Apply brand filter & sort
  const filteredAndSorted = useMemo(() => {
    let list = deptFiltered.filter(p => {
      if (selectedBrand !== 'all') {
        const b = brands.find(brand => brand.slug === selectedBrand || brand.id === selectedBrand || brand.name.toLowerCase() === selectedBrand.toLowerCase());
        if (b && p.brandId !== b.id && p.brandName?.toLowerCase() !== b.name.toLowerCase()) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [deptFiltered, selectedBrand, sortBy, brands]);

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    setSelectedBrand('all');
    router.push(`/pre-order?department=${dept}`);
  };

  const whatsappNumber = settings.whatsappNumber || settings.phone || '96181713408';

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900 pb-20">
      
      {/* LUXURY EDITORIAL RUNWAY HERO */}
      <section className="relative bg-zinc-950 text-white overflow-hidden border-b border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative z-10 text-center">
          
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-[0.2em] uppercase text-white mb-8">
            PRE-ORDER
          </h1>

          {/* LUXURY SERVICE PILLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto text-left pt-4">
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xs flex items-center gap-3">
              <Clock className="text-amber-400 shrink-0" size={20} />
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-wider text-white">Estimated Delivery</h2>
                <p className="text-[10px] text-zinc-400">14 – 21 Business Days from Paris & Milan</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xs flex items-center gap-3">
              <ShieldCheck className="text-amber-400 shrink-0" size={20} />
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-wider text-white">Authenticity Verified</h2>
                <p className="text-[10px] text-zinc-400">Directly sourced with original certificate & tags</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xs flex items-center gap-3">
              <Truck className="text-amber-400 shrink-0" size={20} />
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-wider text-white">Complimentary Concierge</h2>
                <p className="text-[10px] text-zinc-400">Boutique packaging & express delivery</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STICKY / CONTROLS NAVIGATION */}
      <section className="bg-white border-b border-zinc-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* DEPARTMENT TABS */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => handleDeptChange('all')}
                className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap cursor-pointer rounded-xs ${
                  selectedDept === 'all'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                ALL PIECES ({preOrderProducts.length})
              </button>

              <button
                type="button"
                onClick={() => handleDeptChange('women')}
                className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap cursor-pointer rounded-xs ${
                  selectedDept === 'women'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                WOMEN'S RUNWAY ({preOrderProducts.filter(p => (p.department || 'all').toLowerCase() === 'women' || (p.department || 'all').toLowerCase() === 'all').length})
              </button>

              <button
                type="button"
                onClick={() => handleDeptChange('men')}
                className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap cursor-pointer rounded-xs ${
                  selectedDept === 'men'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                MEN'S RUNWAY ({preOrderProducts.filter(p => (p.department || 'all').toLowerCase() === 'men' || (p.department || 'all').toLowerCase() === 'all').length})
              </button>
            </div>

            {/* BRAND FILTER & SORT CONTROLS */}
            <div className="flex items-center gap-2.5 shrink-0">
              {availableBrands.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="p-2 pr-8 border border-zinc-300 text-xs font-bold uppercase rounded-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 cursor-pointer"
                  >
                    <option value="all">ALL DESIGNERS ({availableBrands.length})</option>
                    {availableBrands.map(b => (
                      <option key={b.id} value={b.slug || b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="p-2 pr-8 border border-zinc-300 text-xs font-bold uppercase rounded-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 cursor-pointer"
                >
                  <option value="featured">FEATURED CURATION</option>
                  <option value="price-asc">PRICE: LOW TO HIGH</option>
                  <option value="price-desc">PRICE: HIGH TO LOW</option>
                  <option value="newest">NEWEST RELEASES</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MAIN PRODUCTS SHOWCASE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Results Counter Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600">
              {filteredAndSorted.length} PRE-ORDER {filteredAndSorted.length === 1 ? 'PIECE' : 'PIECES'} AVAILABLE FOR RESERVATION
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-zinc-600 hover:text-zinc-950 uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <span>View In-Stock Boutique</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {filteredAndSorted.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white border border-zinc-200 p-12 sm:p-20 text-center max-w-2xl mx-auto rounded-xs shadow-xs space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Clock size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold uppercase tracking-widest text-zinc-950">
                CURRENT RUNWAY DROP RESERVED
              </h2>
              <p className="text-xs text-zinc-500 tracking-wider uppercase">
                There are currently no items available for pre-order in this department. The upcoming collection will be released soon.
              </p>
              <p className="text-xs text-zinc-600 max-w-md mx-auto">
                Our luxury stylists are currently sourcing upcoming runway collections. Browse our in-stock boutique or connect with our VIP concierge for bespoke requests.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-6 py-3.5 bg-zinc-950 hover:bg-black text-white text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingBag size={14} />
                BROWSE IN-STOCK COLLECTION
              </Link>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello STYLUXE, I would like to inquire about pre-ordering runway pieces.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle size={14} />
                VIP WHATSAPP REQUEST
              </a>
            </div>
          </div>
        ) : (
          /* PRODUCTS GRID */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </main>

      {/* HOW PRE-ORDERS WORK EXPLAINER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white border-2 border-zinc-950 p-8 sm:p-12 shadow-sm">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-amber-600 text-xs font-black tracking-[0.25em] uppercase block mb-1">
              THE CONCIERGE PROCESS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-widest text-zinc-950">
              HOW PRE-ORDERS WORK AT STYLUXE
            </h2>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
              HOW PRE-ORDER WORKS FOR EXCLUSIVE RUNWAY PIECES
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
            
            {/* STEP 1 */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-950 text-white font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                RESERVE YOUR SIZE & PIECE
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Select your preferred size and proceed through our standard secure checkout. Your reservation is immediately locked with priority status.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                DIRECT EUROPEAN SOURCING
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Our fashion team directly procures and inspects your item from verified brand houses in Milan and Paris, certifying 100% authenticity.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-950 text-white font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                COMPLIMENTARY BOUTIQUE DELIVERY
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Your piece arrives within 14–21 business days in luxury boutique packaging with doorstep white-glove delivery and order tracking.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

export default function PreOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Loading Runway Pre-Orders...</p>
        </div>
      </div>
    }>
      <PreOrderContent />
    </Suspense>
  );
}
