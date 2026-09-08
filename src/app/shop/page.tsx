'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, RotateCcw, X, Check, Filter, ArrowUpDown, Ruler } from 'lucide-react';
import { DataService, formatCurrency, isProductMatchingCategory } from '@/lib/store';
import { Product, Brand, Category } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/lib/CartContext';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const departmentParam = searchParams.get('department') || 'women';
  const categoryParam = searchParams.get('category') || 'all';
  const brandParam = searchParams.get('brand') || 'all';
  const saleParam = searchParams.get('sale') === 'true';
  const newParam = searchParams.get('new') === 'true';

  const { currency, settings } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter states
  const [selectedDept, setSelectedDept] = useState<string>(departmentParam);
  const [selectedBrand, setSelectedBrand] = useState<string>(brandParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    setProducts(DataService.getProducts());
    setBrands(DataService.getBrands());
    setCategories(DataService.getCategories());
  }, []);

  useEffect(() => {
    setSelectedDept(departmentParam || 'women');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [departmentParam, categoryParam, brandParam]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSelectedBrand(brandParam);
  }, [brandParam]);

  // 1. SEPARATE DEPARTMENTS STRICTLY (ONLY SHOW PRODUCTS OF SELECTED DEPARTMENT OR BOTH!)
  const deptProducts = products.filter(p => {
    if (selectedDept !== 'all') {
      return p.department === selectedDept || p.department === 'all';
    }
    return true;
  });

  // BRANDS THAT ACTUALLY HAVE PRODUCTS IN SELECTED DEPARTMENT (HIDE EMPTY BRANDS!)
  const availableBrandsInDept = brands.filter(b => {
    return deptProducts.some(p => p.brandId === b.id || p.brandName?.toLowerCase() === b.name.toLowerCase());
  });

  // 2. APPLY BRAND, CATEGORY, SIZE, PRICE & SALE FILTERS
  let filtered = deptProducts.filter(p => {
    if (selectedBrand !== 'all') {
      const b = brands.find(brand => brand.slug === selectedBrand || brand.id === selectedBrand || brand.name.toLowerCase() === selectedBrand.toLowerCase());
      if (b && p.brandId !== b.id && p.brandName?.toLowerCase() !== b.name.toLowerCase()) return false;
    }

    if (selectedCategory !== 'all') {
      if (!isProductMatchingCategory(p.category, selectedCategory)) {
        return false;
      }
    }

    if (selectedSize !== 'all' && (!p.stockPerSize || !p.stockPerSize[selectedSize])) return false;
    if (p.price > maxPrice && (p.salePrice || p.price) > maxPrice) return false;
    if (saleParam && (!p.salePrice || p.salePrice >= p.price)) return false;
    if (newParam && !p.isNewArrival) return false;

    return true;
  });

  // Sorting
  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 3. GROUP PRODUCTS INTO CATEGORY CARDS WITH PRODUCTS INSIDE
  const categoriesMap: Record<string, Product[]> = {};
  filtered.forEach(p => {
    const catName = p.category || 'General Collection';
    if (!categoriesMap[catName]) {
      categoriesMap[catName] = [];
    }
    categoriesMap[catName].push(p);
  });

  const categoryNames = Object.keys(categoriesMap);

  const resetFilters = () => {
    setSelectedBrand('all');
    setSelectedCategory('all');
    setSelectedSize('all');
    setMaxPrice(1000);
    setSortBy('featured');
  };

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    setSelectedCategory('all');
    setSelectedBrand('all');
    router.push(`/shop?department=${dept}`);
  };

  const handleCategorySelect = (catName: string) => {
    const isSelected = selectedCategory.toLowerCase().trim() === catName.toLowerCase().trim();
    const nextCat = isSelected ? 'all' : catName;
    setSelectedCategory(nextCat);
    if (nextCat === 'all') {
      router.push(`/shop?department=${selectedDept}`);
    } else {
      router.push(`/shop?department=${selectedDept}&category=${encodeURIComponent(nextCat)}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-white min-h-[80vh]">
      
      {/* 1. DEPARTMENT & CATEGORY HEADER */}
      <div className="text-center space-y-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[0.3em] text-zinc-950 uppercase">
          {selectedCategory !== 'all' 
            ? `${selectedCategory.toUpperCase()} COLLECTION`
            : `${selectedDept.toUpperCase()}'S LUXURY BOUTIQUE`}
        </h1>
        <div className="w-12 h-0.5 bg-zinc-950 mx-auto" />

        {/* Department Switcher Tabs & Back Button */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
          {selectedCategory !== 'all' && (
            <button
              onClick={() => handleCategorySelect('all')}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-extrabold tracking-widest uppercase rounded-full border-2 border-zinc-950 bg-white text-zinc-950 hover:bg-zinc-950 hover:text-white transition-all shadow-sm"
            >
              <span>←</span>
              <span>ALL CATEGORIES</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {['women', 'men'].map(dept => (
              <button
                key={dept}
                onClick={() => handleDeptChange(dept)}
                className={`px-6 py-2.5 text-xs font-extrabold tracking-[0.2em] uppercase rounded-full transition-all ${
                  selectedDept === dept
                    ? 'bg-zinc-950 text-white shadow-md scale-105'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                FOR {dept === 'women' ? 'HER' : 'HIM'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. DESIGNER BRANDS FILTER (CIRCULAR SWATCHES GRID - 5 PER ROW - HIDES EMPTY BRANDS) */}
      {availableBrandsInDept.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-zinc-100">
          {selectedBrand !== 'all' && (
            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedBrand('all')}
                className="text-[11px] font-bold text-red-600 hover:underline uppercase"
              >
                Reset Brand Filter
              </button>
            </div>
          )}

          {/* CIRCULAR BRANDS GRID: 5 BRANDS PER ROW */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 gap-4 sm:gap-6 justify-items-center max-w-4xl mx-auto py-2">
            
            {/* ALL BRANDS CIRCLE */}
            <button
              onClick={() => setSelectedBrand('all')}
              className="flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center text-center p-2 transition-all shadow-sm ${
                selectedBrand === 'all'
                  ? 'border-zinc-950 bg-zinc-950 text-white ring-4 ring-zinc-950/20 scale-110 shadow-md'
                  : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-950 hover:scale-105'
              }`}>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider leading-tight">
                  ALL BRANDS
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider group-hover:text-zinc-950">
                Show All
              </span>
            </button>

            {/* BRAND CIRCLES (DYNAMICALLY FILTERED & HIDES EMPTY BRANDS) */}
            {availableBrandsInDept.map(brand => {
              const isSelected = selectedBrand === brand.slug || selectedBrand === brand.id;
              const productCount = deptProducts.filter(p => p.brandId === brand.id || p.brandName?.toLowerCase() === brand.name.toLowerCase()).length;

              return (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(isSelected ? 'all' : brand.slug)}
                  className="flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                  title={`${brand.name} (${productCount} Products)`}
                >
                  <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center p-2.5 bg-white transition-all shadow-sm ${
                    isSelected
                      ? 'border-zinc-950 ring-4 ring-amber-500/40 scale-110 shadow-md'
                      : 'border-zinc-200 hover:border-zinc-950 hover:scale-105'
                  }`}>
                    {brand.logoUrl ? (
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.name} 
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[10px] font-black uppercase text-zinc-950 text-center leading-tight">
                        {brand.name}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-black uppercase tracking-wider text-center max-w-[90px] truncate ${
                    isSelected ? 'text-amber-600 font-bold' : 'text-zinc-700 group-hover:text-zinc-950'
                  }`}>
                    {brand.name}
                  </span>
                </button>
              );
            })}

          </div>
        </div>
      )}

      {/* 3. VISUAL CATEGORY CARDS GRID - SHOWN ONLY WHEN NO CATEGORY IS SELECTED */}
      {selectedCategory === 'all' && categories.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-zinc-100 max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black tracking-[0.25em] text-zinc-950 uppercase">
              CATEGORIES
            </h2>
          </div>

          {/* 4 TALL PORTRAIT CATEGORY CARDS SIDE BY SIDE MATCHING REFERENCE SCREENSHOT */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 py-2">
            {categories
              .filter(c => c.department === selectedDept || c.department === 'all')
              .map(cat => {
                const catImage = cat.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80";
                const catSlug = cat.slug || encodeURIComponent(cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

                return (
                  <Link
                    key={cat.id}
                    href={`/category/${catSlug}?department=${selectedDept}`}
                    className="group flex flex-col items-center cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {/* TALL PORTRAIT STUDIO IMAGE CONTAINER MATCHING SCREENSHOT */}
                    <div className="w-full aspect-[3/4] bg-[#f4f4f4] flex items-center justify-center overflow-hidden transition-all relative group-hover:bg-[#ebebeb]">
                      <img 
                        src={catImage} 
                        alt={cat.name} 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                      />
                      {/* LUXURY HOVER OVERLAY */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                          EXPLORE
                        </span>
                      </div>
                    </div>

                    {/* BOLD CENTERED CATEGORY TITLE BELOW IMAGE MATCHING SCREENSHOT */}
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-center pt-3 pb-1 truncate max-w-full text-zinc-900 group-hover:text-zinc-950 group-hover:underline">
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. TOP ACTION BAR: SMART FILTER DRAWER BUTTON & SORT */}
      <div className="border-y border-zinc-200 py-3.5 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          {/* Open Smart Side Filter Drawer */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white text-xs font-extrabold tracking-widest uppercase rounded hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <SlidersHorizontal size={16} />
            <span>SMART SIDE FILTER</span>
            {(selectedBrand !== 'all' || selectedCategory !== 'all' || selectedSize !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            )}
          </button>

          {/* Size Guide Trigger Button */}
          <button
            onClick={() => openSizeGuide(selectedCategory !== 'all' ? selectedCategory : undefined, selectedDept !== 'all' ? selectedDept : undefined)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 border border-zinc-300 text-zinc-900 text-xs font-extrabold tracking-widest uppercase rounded hover:border-zinc-950 transition-colors cursor-pointer"
            title="Size Guide"
          >
            <Ruler size={15} className="text-amber-500" />
            <span>SIZE GUIDE</span>
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-3">
          <ArrowUpDown size={14} className="text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="featured">SORT BY: FEATURED</option>
            <option value="newest">SORT BY: NEWEST</option>
            <option value="price-asc">PRICE: LOW TO HIGH</option>
            <option value="price-desc">PRICE: HIGH TO LOW</option>
          </select>
        </div>

      </div>

      {/* 4. PRODUCTS GRID (PURE CARDS SIDE BY SIDE, NO OUTER BOX FRAMES) */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-zinc-50 border border-zinc-200 rounded-xl">
          <p className="text-sm font-extrabold text-zinc-400 uppercase tracking-widest">
            NO PRODUCTS MATCH YOUR SELECTED FILTERS FOR THIS DEPARTMENT.
          </p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors"
          >
            VIEW ALL PRODUCTS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* 5. SMART SIDE FILTER DRAWER (Collapsible Sidebar Drawer) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[999999] bg-zinc-950/80 backdrop-blur-md flex justify-start animate-fadeIn">
          
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 sm:p-8 space-y-8 relative shadow-2xl animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-zinc-950" />
                <h3 className="font-serif text-xl font-bold tracking-wider text-zinc-950 uppercase">
                  SMART SIDE FILTER
                </h3>
              </div>
              
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-2 rounded-full hover:bg-zinc-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Department Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                DEPARTMENT
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {['women', 'men'].map(dept => (
                  <button
                    key={dept}
                    onClick={() => handleDeptChange(dept)}
                    className={`py-2 text-xs font-extrabold uppercase rounded border ${
                      selectedDept === dept
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                    }`}
                  >
                    {dept === 'women' ? 'FOR HER' : 'FOR HIM'}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter (With Brand Logos) */}
            <div className="space-y-3 border-t border-zinc-100 pt-6">
              <h4 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                DESIGNER BRANDS
              </h4>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => setSelectedBrand('all')}
                  className={`p-2 text-xs font-extrabold uppercase rounded border ${
                    selectedBrand === 'all'
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                  }`}
                >
                  ALL BRANDS
                </button>

                {brands.map(b => {
                  const isSelected = selectedBrand === b.slug || selectedBrand === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBrand(isSelected ? 'all' : b.slug)}
                      className={`p-2 rounded border text-xs font-extrabold uppercase flex items-center gap-2 ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                      }`}
                    >
                      <img src={b.logoUrl} alt={b.name} className="w-5 h-5 object-contain rounded bg-zinc-50" />
                      <span className="truncate">{b.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3 border-t border-zinc-100 pt-6">
              <h4 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                CATEGORIES
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-extrabold uppercase rounded border ${
                    selectedCategory === 'all'
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                  }`}
                >
                  ALL CATEGORIES
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 text-xs font-extrabold uppercase rounded border ${
                      selectedCategory === cat.name
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="space-y-3 border-t border-zinc-100 pt-6">
              <h4 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                AVAILABLE SIZES
              </h4>
              <div className="flex flex-wrap gap-2">
                {['all', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-4 py-2 text-xs font-extrabold uppercase rounded border ${
                      selectedSize === sz
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3 border-t border-zinc-100 pt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                  MAX PRICE
                </h4>
                <span className="text-xs font-extrabold text-zinc-950">
                  ${maxPrice}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-zinc-950 cursor-pointer"
              />
            </div>

            {/* Apply & Reset Buttons */}
            <div className="pt-6 border-t border-zinc-200 space-y-2">
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-3 bg-zinc-950 text-white text-xs font-extrabold tracking-widest uppercase rounded hover:bg-zinc-800 transition-colors"
              >
                APPLY FILTERS ({filtered.length} ITEMS)
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-2.5 border border-zinc-300 text-zinc-950 text-xs font-extrabold tracking-widest uppercase rounded hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} /> RESET ALL FILTERS
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs font-bold uppercase">Loading Boutique Catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
