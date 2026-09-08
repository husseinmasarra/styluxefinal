'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, SlidersHorizontal, ArrowUpDown, Grid3X3, 
  LayoutGrid, Ruler, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { DataService, formatCurrency, isProductMatchingCategory } from '@/lib/store';
import { Product, Category, Brand } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/lib/CartContext';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';

function CategoryPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const slugParam = (params?.slug as string) || '';
  const initialDept = (searchParams.get('department') as 'women' | 'men' | 'all') || 'all';

  const { currency, settings } = useCart();

  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filter States
  const [selectedDept, setSelectedDept] = useState<'women' | 'men' | 'all'>(initialDept);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');
  const [gridCols, setGridCols] = useState<2 | 4>(4);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, [slugParam]);

  const loadData = () => {
    const loadedCats = DataService.getCategories();
    const loadedProds = DataService.getProducts();
    const loadedBrands = DataService.getBrands();

    setAllCategories(loadedCats);
    setAllProducts(loadedProds);
    setBrands(loadedBrands);

    // Find category by slug, name, or id
    const decodedSlug = decodeURIComponent(slugParam).toLowerCase().trim();
    const matched = loadedCats.find(c => {
      const cSlug = (c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
      const cName = c.name.toLowerCase().trim();
      return cSlug === decodedSlug || 
             cName === decodedSlug || 
             c.id.toLowerCase() === decodedSlug ||
             isProductMatchingCategory(c.name, decodedSlug);
    });

    if (matched) {
      setCategory(matched);
      if (initialDept === 'all' && matched.department !== 'all') {
        setSelectedDept(matched.department);
      }
    } else {
      // Create a virtual category if products have this category name
      const titleName = decodedSlug.replace(/-/g, ' ').toUpperCase();
      setCategory({
        id: `virtual-${decodedSlug}`,
        name: titleName,
        slug: decodedSlug,
        department: initialDept,
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1600&auto=format&fit=crop&q=80',
        isFeatured: true,
        displayOrder: 1
      });
    }
  };

  const categoryName = category?.name || decodeURIComponent(slugParam).replace(/-/g, ' ').toUpperCase();
  const categoryImage = category?.imageUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1600&auto=format&fit=crop&q=80';

  // 1. FILTER STRICTLY FOR THIS CATEGORY (INCLUDING ITS SUB-CATEGORIES)
  const subCatNames = (category?.subCategories || []).map(sc => sc.name.toLowerCase().trim());
  const categoryProducts = allProducts.filter(p => {
    if (isProductMatchingCategory(p.category, categoryName)) return true;
    if (subCatNames.includes(p.category.toLowerCase().trim())) return true;
    if (p.category.toLowerCase().startsWith(categoryName.toLowerCase())) return true;
    return false;
  });

  // 2. FILTER BY DEPARTMENT (IF SELECTED)
  const deptFiltered = categoryProducts.filter(p => {
    if (selectedDept === 'all') return true;
    return p.department === selectedDept || p.department === 'all';
  });

  // 3. FILTER BY SUB-CATEGORY (IF SELECTED)
  const subCatFiltered = deptFiltered.filter(p => {
    if (selectedSubCategory === 'all') return true;
    return isProductMatchingCategory(p.category, selectedSubCategory);
  });

  // 4. AVAILABLE BRANDS IN THIS SPECIFIC CATEGORY
  const availableBrandsInCategory = brands.filter(b => 
    subCatFiltered.some(p => p.brandId === b.id || p.brandName?.toLowerCase() === b.name.toLowerCase())
  );

  // 5. FILTER BY BRAND
  let finalProducts = subCatFiltered.filter(p => {
    if (selectedBrand === 'all') return true;
    const b = brands.find(brand => brand.slug === selectedBrand || brand.id === selectedBrand || brand.name.toLowerCase() === selectedBrand.toLowerCase());
    if (b && p.brandId !== b.id && p.brandName?.toLowerCase() !== b.name.toLowerCase()) return false;
    return true;
  });

  // 5. SORTING
  if (sortBy === 'price-asc') {
    finalProducts.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  } else if (sortBy === 'price-desc') {
    finalProducts.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
  } else if (sortBy === 'newest') {
    finalProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Related Categories
  const otherCategories = allCategories
    .filter(c => c.name.toLowerCase().trim() !== categoryName.toLowerCase().trim())
    .slice(0, 4);

  const currentWhatsapp = selectedDept === 'women'
    ? (settings.womenWhatsappNumber || settings.whatsappNumber || '96170123456')
    : (settings.menWhatsappNumber || settings.whatsappNumber || '96170987654');

  return (
    <div className="bg-white min-h-screen pb-24 text-zinc-950">
      
      {/* 1. EDITORIAL LUXURY HERO BANNER MATCHING INTERNATIONAL HOUSES (PRADA / VOGUE) */}
      <section className="relative w-full min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] max-w-[1400px] mx-auto overflow-hidden bg-zinc-950 flex items-end justify-start border-b border-zinc-200">
        
        {/* Background Image with Slow Smooth Scaling */}
        <img
          src={categoryImage}
          alt={categoryName}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
        />

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-radial from-transparent to-black/60" />

        {/* Content Box */}
        <div className="relative z-10 w-full max-w-4xl px-6 sm:px-12 lg:px-16 pb-12 pt-24 text-white space-y-4">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-300">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              HOME
            </Link>
            <ChevronRight size={12} className="text-zinc-500" />
            <Link href={`/shop?department=${selectedDept !== 'all' ? selectedDept : 'women'}`} className="hover:text-amber-400 transition-colors">
              {selectedDept !== 'all' ? (selectedDept === 'women' ? 'WOMEN' : 'MEN') : 'BOUTIQUE'}
            </Link>
            <ChevronRight size={12} className="text-zinc-500" />
            <span className="text-amber-400">{categoryName}</span>
          </div>

          {/* Huge Prada Bodoni Serif Title */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[0.08em] uppercase text-white leading-tight drop-shadow-xl">
            {categoryName}
          </h1>

          {/* Luxury Excerpt / Tagline */}
          <p className="text-xs sm:text-sm font-medium text-zinc-200 max-w-2xl leading-relaxed tracking-wider uppercase drop-shadow-md">
            {category?.description || `Explore our permanent curated collection of authentic designer ${categoryName.toLowerCase()}, crafted by premier international luxury houses.`}
          </p>

          {/* Live Badge Status */}
          <div className="pt-2 flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-widest border border-white/20">
              <Sparkles size={13} className="text-amber-400" />
              <span>{finalProducts.length} {finalProducts.length === 1 ? 'PIECE' : 'PIECES'} AVAILABLE</span>
            </span>

            <button
              onClick={() => openSizeGuide(categoryName, selectedDept !== 'all' ? selectedDept : undefined)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-all text-[11px] font-black uppercase tracking-widest shadow-md cursor-pointer"
            >
              <Ruler size={14} />
              <span>SIZE GUIDE</span>
            </button>
          </div>

        </div>

      </section>

      {/* 2. INTERACTIVE CONTROLS BAR (DEPARTMENT TABS + BRANDS + SORT + GRID) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        
        {/* Top Department Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          
          {/* Department Filter Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: `ALL ${categoryName.toUpperCase()}` },
              { id: 'women', label: 'FOR HER' },
              { id: 'men', label: 'FOR HIM' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedDept(tab.id as any);
                  setSelectedBrand('all');
                }}
                className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all ${
                  selectedDept === tab.id
                    ? 'bg-zinc-950 text-white shadow-sm scale-105'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Back to Boutique link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>BACK TO HOME</span>
          </Link>

        </div>

        {/* Sub-Categories Luxury Showcase Cards with custom images */}
        {category?.subCategories && category.subCategories.length > 0 && (
          <div className="space-y-3 pt-1">
            <span className="text-[10px] font-black tracking-[0.25em] text-zinc-400 uppercase block">
              SUB-COLLECTIONS / SECTIONS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div
                onClick={() => setSelectedSubCategory('all')}
                className={`group cursor-pointer rounded-lg overflow-hidden border-2 transition-all select-none ${
                  selectedSubCategory === 'all'
                    ? 'border-zinc-950 shadow-md ring-1 ring-zinc-950 scale-102'
                    : 'border-zinc-200 hover:border-zinc-400 opacity-90 hover:opacity-100'
                }`}
              >
                <div className="h-24 sm:h-28 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={categoryImage}
                    alt="All"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="relative z-10 text-white text-xs font-black uppercase tracking-wider text-center px-2 drop-shadow-md">
                    ALL {categoryName}
                  </span>
                </div>
              </div>

              {category.subCategories.map(sub => {
                const isSel = selectedSubCategory === sub.name;
                const subProdsCount = deptFiltered.filter(p => isProductMatchingCategory(p.category, sub.name)).length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(isSel ? 'all' : sub.name)}
                    className={`group cursor-pointer rounded-lg overflow-hidden border-2 transition-all select-none ${
                      isSel
                        ? 'border-zinc-950 shadow-md ring-1 ring-zinc-950 scale-102'
                        : 'border-zinc-200 hover:border-zinc-400 opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="h-24 sm:h-28 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                      <img
                        src={sub.imageUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}
                        alt={sub.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />
                      <div className="relative z-10 text-center px-2 drop-shadow-md space-y-0.5">
                        <span className="text-white text-xs font-black uppercase tracking-wider block">
                          {sub.name}
                        </span>
                        <span className="text-[10px] text-zinc-200 font-extrabold tracking-wider block">
                          {subProdsCount} PIECES
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Brand Swatches Bar (If available in this category) */}
        {availableBrandsInCategory.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-black tracking-[0.25em] text-zinc-400 uppercase block">
              FILTER BY DESIGNER HOUSE
            </span>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shrink-0 transition-all border ${
                  selectedBrand === 'all'
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-950'
                }`}
              >
                ALL HOUSES
              </button>
              {availableBrandsInCategory.map(brand => {
                const isSel = selectedBrand === brand.slug || selectedBrand === brand.id;
                const bCount = deptFiltered.filter(p => p.brandId === brand.id || p.brandName?.toLowerCase() === brand.name.toLowerCase()).length;

                return (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(isSel ? 'all' : (brand.slug || brand.id))}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shrink-0 transition-all border flex items-center gap-2 ${
                      isSel
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-950'
                    }`}
                  >
                    {brand.logoUrl && (
                      <img src={brand.logoUrl} alt={brand.name} className="w-4 h-4 object-contain rounded-full bg-white" />
                    )}
                    <span>{brand.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter & View Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-950">
              SHOWING:
            </span>
            <span className="text-xs font-bold text-zinc-500 font-mono">
              {finalProducts.length} PRODUCTS IN {categoryName}
            </span>
            {selectedBrand !== 'all' && (
              <button
                onClick={() => setSelectedBrand('all')}
                className="text-[11px] font-bold text-red-600 hover:underline ml-2"
              >
                (Clear Brand Filter)
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            
            {/* Grid Columns Switcher (2 or 4) */}
            <div className="hidden sm:flex items-center gap-1 border border-zinc-200 rounded p-1">
              <button
                onClick={() => setGridCols(2)}
                className={`p-1.5 rounded transition-colors ${
                  gridCols === 2 ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-950'
                }`}
                title="Large View (2 Columns)"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-1.5 rounded transition-colors ${
                  gridCols === 4 ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-950'
                }`}
                title="Compact Boutique View (4 Columns)"
              >
                <Grid3X3 size={16} />
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 border border-zinc-200 rounded px-3 py-1.5 bg-white">
              <ArrowUpDown size={14} className="text-zinc-500" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs font-extrabold uppercase tracking-wider bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="featured">SORT: FEATURED</option>
                <option value="newest">SORT: NEWEST</option>
                <option value="price-asc">PRICE: LOW TO HIGH</option>
                <option value="price-desc">PRICE: HIGH TO LOW</option>
              </select>
            </div>

          </div>

        </div>

        {/* 3. PRODUCTS GRID - 100% STRICT ISOLATION & ALL ITEMS COMPLETE */}
        {finalProducts.length === 0 ? (
          <div className="py-24 text-center space-y-5 bg-zinc-50 border border-zinc-200 rounded-2xl p-8">
            <h3 className="font-serif text-2xl font-bold uppercase tracking-wider text-zinc-950">
              NO PRODUCTS FOUND IN THIS SELECTION
            </h3>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-md mx-auto">
              There are currently no products matching your specific filters for {categoryName}.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedDept('all');
                  setSelectedBrand('all');
                }}
                className="px-6 py-2.5 bg-zinc-950 text-white text-xs font-black uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors shadow-sm"
              >
                SHOW ALL IN {categoryName}
              </button>
              <Link
                href="/shop"
                className="px-6 py-2.5 border border-zinc-300 text-zinc-950 text-xs font-black uppercase tracking-widest rounded hover:border-zinc-950 transition-colors"
              >
                EXPLORE ALL COLLECTIONS
              </Link>
            </div>
          </div>
        ) : (
          <div className={`grid gap-x-6 gap-y-12 ${
            gridCols === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}>
            {finalProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* 4. EXPLORE OTHER CATEGORIES CAROUSEL */}
        {otherCategories.length > 0 && (
          <div className="pt-16 border-t border-zinc-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-[0.25em] text-zinc-400 uppercase block">
                  CONTINUE BROWSING
                </span>
                <h3 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                  OTHER EXCLUSIVE CATEGORIES
                </h3>
              </div>
              <Link 
                href="/shop"
                className="text-xs font-black uppercase tracking-widest text-zinc-950 hover:underline flex items-center gap-1"
              >
                <span>VIEW ALL IN BOUTIQUE</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {otherCategories.map(c => {
                const cSlug = c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const cImg = c.imageUrl || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600';

                return (
                  <Link
                    key={c.id}
                    href={`/category/${encodeURIComponent(cSlug)}?department=${c.department !== 'all' ? c.department : selectedDept}`}
                    className="group flex flex-col items-center cursor-pointer transition-all"
                  >
                    <div className="w-full aspect-[3/4] bg-[#f4f4f4] overflow-hidden rounded relative group-hover:bg-[#ebebeb] transition-all">
                      <img
                        src={cImg}
                        alt={c.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider pt-3 text-center text-zinc-900 group-hover:text-zinc-950 group-hover:underline truncate max-w-full">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm font-bold tracking-[0.25em] text-zinc-950 uppercase">
            LOADING CATEGORY COLLECTION...
          </p>
        </div>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}
