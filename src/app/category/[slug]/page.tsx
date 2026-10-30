'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, SlidersHorizontal, ArrowUpDown, Grid3X3, 
  LayoutGrid, Ruler, Filter, ChevronRight
} from 'lucide-react';
import { DataService, formatCurrency, isProductMatchingCategory, isProductMatchingSeason } from '@/lib/store';
import { Product, Category, Brand, Department } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/lib/CartContext';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';
import { fetchSupabaseCloudData } from '@/lib/supabase';
import { setActiveDepartment } from '@/lib/departmentContext';

function CategoryPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const slugParam = (params?.slug as string) || '';
  const deptParam = searchParams.get('department') as Department;
  const initialDept = deptParam === 'men' || deptParam === 'women' || deptParam === 'kids' ? deptParam : 'all';
  const viewParam = searchParams.get('view');
  const subParam = searchParams.get('sub');

  const { currency, settings } = useCart();

  const [category, setCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [isSubCategory, setIsSubCategory] = useState<boolean>(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filter States
  const [selectedDept, setSelectedDept] = useState<Department>(initialDept);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');
  const [gridCols, setGridCols] = useState<2 | 4>(4);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(true);

  useEffect(() => {
    if (deptParam === 'men' || deptParam === 'women') {
      setSelectedDept(deptParam);
      setActiveDepartment(deptParam);
    }
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('styluxe_data_updated', handleUpdate);

    let isMounted = true;
    fetchSupabaseCloudData().then(cloud => {
      if (!isMounted) return;
      if (cloud.hasData) {
        if (cloud.products !== undefined && cloud.products.length > 0) {
          DataService.saveAllProducts(cloud.products);
        }
        if (cloud.categories !== undefined) {
          DataService.saveAllCategories(cloud.categories);
        }
        try {
          if (cloud.brands !== undefined) {
            localStorage.setItem('styluxe_brands_v1', JSON.stringify(cloud.brands));
          }
        } catch (_) {}
        loadData(cloud.categories, cloud.products, cloud.brands);
      }
      setIsLoadingCloud(false);
    }).catch(() => {
      if (isMounted) setIsLoadingCloud(false);
    });

    return () => {
      isMounted = false;
      window.removeEventListener('styluxe_data_updated', handleUpdate);
    };
  }, [slugParam, deptParam]);

  const loadData = (customCats?: Category[], customProds?: Product[], customBrands?: Brand[]) => {
    const loadedCats = customCats || DataService.getCategories();
    const loadedProds = customProds || DataService.getProducts();
    const loadedBrands = customBrands || DataService.getBrands();

    setAllCategories(loadedCats);
    setAllProducts(loadedProds);
    setBrands(loadedBrands);

    const decodedSlug = decodeURIComponent(slugParam).toLowerCase().trim();

    // Prioritize categories matching requested department
    const prioritizedCats = [...loadedCats].sort((a, b) => {
      const aMatches = initialDept !== 'all' && (a.department === initialDept || a.department === 'all');
      const bMatches = initialDept !== 'all' && (b.department === initialDept || b.department === 'all');
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });

    // 1. Check if slugParam matches a top-level category
    const matchedMain = prioritizedCats.find(c => {
      const cSlug = (c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
      const cName = c.name.toLowerCase().trim();
      return cSlug === decodedSlug || cName === decodedSlug || c.id.toLowerCase() === decodedSlug || isProductMatchingCategory(c.name, decodedSlug);
    });

    // 2. Check if slugParam matches a subcategory of ANY category
    let matchedSub: any = null;
    let foundParent: Category | null = null;
    for (const c of prioritizedCats) {
      if (c.subCategories && c.subCategories.length > 0) {
        const sub = c.subCategories.find(s => {
          const sSlug = (s.slug || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
          const sName = s.name.toLowerCase().trim();
          return sSlug === decodedSlug || sName === decodedSlug || s.id.toLowerCase() === decodedSlug || isProductMatchingCategory(s.name, decodedSlug);
        });
        if (sub) {
          matchedSub = sub;
          foundParent = c;
          break;
        }
      }
    }

    if (matchedSub && foundParent) {
      // It's a dedicated subcategory page!
      setIsSubCategory(true);
      setParentCategory(foundParent);
      setCategory({
        id: matchedSub.id || `sub-${decodedSlug}`,
        name: matchedSub.name,
        slug: matchedSub.slug || decodedSlug,
        department: initialDept !== 'all' ? initialDept : (foundParent.department || 'women'),
        imageUrl: matchedSub.imageUrl || foundParent.imageUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1600&auto=format&fit=crop&q=80',
        isFeatured: true,
        displayOrder: matchedSub.displayOrder || 1,
        subCategories: []
      });
      if (initialDept === 'all' && foundParent.department !== 'all') {
        setSelectedDept(foundParent.department);
      }
    } else if (matchedMain) {
      setIsSubCategory(false);
      setParentCategory(null);
      setCategory(matchedMain);
      if (initialDept === 'all' && matchedMain.department !== 'all') {
        setSelectedDept(matchedMain.department);
      }
    } else {
      // Virtual category if not found
      setIsSubCategory(false);
      setParentCategory(null);
      const titleName = decodedSlug.replace(/-/g, ' ').toUpperCase();
      setCategory({
        id: `virtual-${decodedSlug}`,
        name: titleName,
        slug: decodedSlug,
        department: initialDept,
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1600&auto=format&fit=crop&q=80',
        isFeatured: true,
        displayOrder: 1,
        subCategories: []
      });
    }
  };

  const categoryName = category?.name || decodeURIComponent(slugParam).replace(/-/g, ' ').toUpperCase();
  const categoryImage = category?.imageUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1600&auto=format&fit=crop&q=80';

  const hasSubCategories = Boolean(!isSubCategory && category?.subCategories && category.subCategories.length > 0);
  const isHub = hasSubCategories && viewParam !== 'all' && !subParam;

  // 1. FILTER PRODUCTS FOR THIS CATEGORY (OR SUB-CATEGORY)
  const subCatNames = (category?.subCategories || []).map(sc => sc.name.toLowerCase().trim());
  const categoryProducts = allProducts.filter(p => {
    const pCat = p.category || '';
    const pSub = (p as any).subcategory || (p as any).subCategory || '';
    const pTitle = (p.title || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    const pShort = (p.shortDescription || '').toLowerCase();
    const subTerm = categoryName.toLowerCase().trim();
    const slugTerm = slugParam.toLowerCase().trim();

    if (isSubCategory) {
      if (isProductMatchingCategory(pCat, categoryName) || isProductMatchingCategory(pCat, slugParam)) {
        return true;
      }
      if (pSub && (isProductMatchingCategory(pSub, categoryName) || isProductMatchingCategory(pSub, slugParam))) {
        return true;
      }
      if (parentCategory && isProductMatchingCategory(pCat, parentCategory.name)) {
        if (pTitle.includes(subTerm) || pTitle.includes(slugTerm) || pDesc.includes(subTerm) || pShort.includes(subTerm)) {
          return true;
        }
      }
      if (pTitle.includes(subTerm) || pTitle.includes(slugTerm)) {
        return true;
      }
      return false;
    }
    if (subParam) {
      return isProductMatchingCategory(pCat, subParam) || isProductMatchingCategory(pSub, subParam) || pTitle.includes(subParam.toLowerCase());
    }
    if (isProductMatchingCategory(pCat, categoryName)) return true;
    if (isProductMatchingCategory(pCat, slugParam)) return true;
    if (pSub && (isProductMatchingCategory(pSub, categoryName) || isProductMatchingCategory(pSub, slugParam))) return true;
    if (subCatNames.some(sc => isProductMatchingCategory(pCat, sc) || isProductMatchingCategory(pSub, sc) || pTitle.includes(sc))) return true;
    if (pCat.toLowerCase().startsWith(categoryName.toLowerCase())) return true;
    if (pTitle.includes(categoryName.toLowerCase()) || pTitle.includes(slugTerm)) return true;
    return false;
  });

  // 2. FILTER BY DEPARTMENT (IF SELECTED) & ACTIVE SEASON
  const deptFiltered = categoryProducts.filter(p => {
    const pDept = (p.department || (p as any).gender || 'all').toLowerCase();
    if (selectedDept !== 'all' && pDept !== selectedDept && pDept !== 'all') {
      return false;
    }
    return isProductMatchingSeason(p.season, settings?.activeSeason);
  });

  // 3. AVAILABLE BRANDS IN THIS SPECIFIC SELECTION
  const availableBrandsInCategory = brands.filter(b => 
    deptFiltered.some(p => p.brandId === b.id || p.brandName?.toLowerCase() === b.name.toLowerCase())
  );

  // 4. FILTER BY BRAND
  let finalProducts = deptFiltered.filter(p => {
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
      
      {/* Top Back Link matching classic Styluxe */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        {isSubCategory && parentCategory ? (
          <Link
            href={`/category/${parentCategory.slug || parentCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}?department=${selectedDept}`}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-600 hover:text-zinc-950 uppercase transition-colors"
          >
            <ArrowLeft size={14} /> BACK TO {parentCategory.name.toUpperCase()}
          </Link>
        ) : viewParam === 'all' && hasSubCategories ? (
          <Link
            href={`/category/${category?.slug || slugParam}?department=${selectedDept}`}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-600 hover:text-zinc-950 uppercase transition-colors"
          >
            <ArrowLeft size={14} /> BACK TO SUB-COLLECTIONS
          </Link>
        ) : (
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-600 hover:text-zinc-950 uppercase transition-colors"
          >
            <ArrowLeft size={14} /> BACK TO COLLECTIONS
          </Link>
        )}
      </div>

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
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-300 flex-wrap">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              HOME
            </Link>
            <ChevronRight size={12} className="text-zinc-500" />
            <Link href={`/shop?department=${selectedDept !== 'all' ? selectedDept : 'women'}`} className="hover:text-amber-400 transition-colors">
              {selectedDept !== 'all' ? (selectedDept === 'women' ? 'WOMEN' : 'MEN') : 'BOUTIQUE'}
            </Link>
            {isSubCategory && parentCategory && (
              <>
                <ChevronRight size={12} className="text-zinc-500" />
                <Link 
                  href={`/category/${parentCategory.slug || parentCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}?department=${selectedDept}`}
                  className="hover:text-amber-400 transition-colors"
                >
                  {parentCategory.name.toUpperCase()}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="text-zinc-500" />
            <span className="text-amber-400">
              {viewParam === 'all' ? `${categoryName} (ALL)` : categoryName}
            </span>
          </div>

          {/* Luxury Prada Bodoni/Cinzel Serif Title */}
          <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[0.25em] uppercase text-white leading-tight antialiased">
            {viewParam === 'all' ? `${categoryName} (ALL)` : categoryName}
          </h1>

          {/* Luxury Excerpt / Tagline */}
          <p className="text-xs sm:text-sm font-medium text-zinc-200 max-w-2xl leading-relaxed tracking-wider uppercase drop-shadow-md">
            {category?.description || `Explore our permanent curated collection of authentic designer ${categoryName.toLowerCase()}, crafted by premier international luxury houses.`}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-4 flex-wrap">
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
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          
          {/* Active Department Indicator Badge */}
          <div className="flex items-center gap-2">
            {selectedDept === 'men' && (
              <span className="px-3.5 py-1.5 rounded-full bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xs">
                MEN'S COLLECTION
              </span>
            )}
            {selectedDept === 'women' && (
              <span className="px-3.5 py-1.5 rounded-full bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xs">
                WOMEN'S COLLECTION
              </span>
            )}
            {selectedDept === 'kids' && (
              <span className="px-3.5 py-1.5 rounded-full bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xs">
                KIDS' COLLECTION
              </span>
            )}
          </div>

          {/* Quick Back link */}
          {isSubCategory && parentCategory ? (
            <Link
              href={`/category/${parentCategory.slug || parentCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}?department=${selectedDept}`}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>BACK TO {parentCategory.name.toUpperCase()}</span>
            </Link>
          ) : viewParam === 'all' && hasSubCategories ? (
            <Link
              href={`/category/${category?.slug || slugParam}?department=${selectedDept}`}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>BACK TO SUB-COLLECTIONS</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>BACK TO HOME</span>
            </Link>
          )}

        </div>

        {/* Sub-Categories Luxury Showcase: Prada 4-Column Divided Grid Layout (ONLY SHOWN IN HUB VIEW) */}
        {isHub && category?.subCategories && category.subCategories.length > 0 && (() => {
          const allSubItems = [
            { 
              id: 'all', 
              name: `ALL ${categoryName}`, 
              isAll: true, 
              imageUrl: categoryImage, 
              count: deptFiltered.length,
              href: `/category/${category.slug || slugParam}?view=all&department=${selectedDept}`
            },
            ...category.subCategories.map(s => {
              const sSlug = s.slug || encodeURIComponent(s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
              return {
                ...s,
                isAll: false,
                count: deptFiltered.filter(p => isProductMatchingCategory(p.category, s.name)).length,
                href: `/category/${sSlug}?department=${selectedDept}`
              };
            })
          ];

          return (
            <div className="space-y-6 pt-2 pb-8 border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-[0.25em] text-zinc-900 uppercase">
                  EXPLORE {categoryName} COLLECTIONS
                </span>
                <Link
                  href={`/category/${category?.slug || slugParam}?view=all&department=${selectedDept}`}
                  className="text-[11px] font-bold tracking-wider text-zinc-500 hover:text-zinc-950 underline uppercase transition-colors"
                >
                  VIEW ALL ({categoryName})
                </Link>
              </div>

              <div className="border border-zinc-200 bg-white overflow-hidden shadow-2xs">
                <div className="grid grid-cols-2 lg:grid-cols-4">
                  {allSubItems.map((item, idx) => {
                    const isLastColMobile = idx % 2 === 1;
                    const isLastRowMobile = idx >= allSubItems.length - (allSubItems.length % 2 === 0 ? 2 : 1);
                    const isLastColDesktop = idx === allSubItems.length - 1;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`group flex flex-col bg-white overflow-hidden transition-colors hover:bg-zinc-50/60
                          ${!isLastColMobile ? 'border-r border-zinc-200' : ''}
                          ${!isLastRowMobile ? 'border-b border-zinc-200' : ''}
                          lg:border-b-0
                          ${!isLastColDesktop ? 'lg:border-r lg:border-zinc-200' : 'lg:border-r-0'}
                        `}
                      >
                        <div className="w-full aspect-[4/5] sm:aspect-[3/4] bg-[#f6f6f6] flex items-center justify-center overflow-hidden relative p-3 sm:p-6">
                          <img
                            src={item.imageUrl || categoryImage || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600'}
                            alt={item.name}
                            className="w-full h-full object-contain sm:object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
                          />
                        </div>
                        <div className="py-3 sm:py-4 px-2 sm:px-3 bg-white text-center border-t border-zinc-100 flex flex-col items-center justify-center min-h-[48px] sm:min-h-[58px]">
                          <span className="text-[11px] sm:text-sm font-bold text-zinc-950 tracking-normal sm:tracking-wide group-hover:underline">
                            {item.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* DIRECT VIEW ALL CTA BUTTON */}
              <div className="pt-6 pb-2 text-center">
                <Link
                  href={`/category/${category?.slug || slugParam}?view=all&department=${selectedDept}`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 text-white text-xs font-black uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <span>VIEW ALL {categoryName}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })()}

        {/* PRODUCTS SECTION (ONLY DISPLAYED ON DEDICATED CATEGORY OR SUBCATEGORY PAGE, NOT IN HUB) */}
        {!isHub && (
          <div className="space-y-6">
            {/* Brand Swatches Bar (If available in this category) */}
            {availableBrandsInCategory.length > 0 && (
              <div className="space-y-3 pt-1 border-b border-zinc-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-[0.25em] text-zinc-400 uppercase block">
                    FILTER BY DESIGNER HOUSE
                  </span>
                  {selectedBrand !== 'all' && (
                    <button
                      onClick={() => setSelectedBrand('all')}
                      className="text-[10px] font-bold text-red-600 uppercase hover:underline cursor-pointer"
                    >
                      Reset Brand Filter
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar flex-nowrap sm:flex-wrap">
                  {/* ALL HOUSES CIRCLE */}
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className="flex items-center justify-center shrink-0 transition-all cursor-pointer group"
                    title="All Houses"
                  >
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${
                      selectedBrand === 'all'
                        ? 'border-zinc-950 ring-4 ring-amber-500/40 scale-105 shadow-md bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950 hover:scale-105'
                    }`}>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${selectedBrand === 'all' ? 'text-white' : 'text-zinc-950'}`}>
                        ALL
                      </span>
                    </div>
                  </button>

                  {/* BRAND LOGO ONLY CIRCLES */}
                  {availableBrandsInCategory.map(brand => {
                    const isSel = selectedBrand === brand.slug || selectedBrand === brand.id;
                    const bCount = deptFiltered.filter(p => p.brandId === brand.id || p.brandName?.toLowerCase() === brand.name.toLowerCase()).length;

                    return (
                      <button
                        key={brand.id}
                        onClick={() => setSelectedBrand(isSel ? 'all' : (brand.slug || brand.id))}
                        className="flex items-center justify-center shrink-0 transition-all cursor-pointer group"
                        title={`${brand.name} (${bCount} Products)`}
                      >
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center p-2.5 bg-white transition-all shadow-sm overflow-hidden ${
                          isSel
                            ? 'border-zinc-950 ring-4 ring-amber-500/40 scale-105 shadow-md'
                            : 'border-zinc-200 hover:border-zinc-950 hover:scale-105'
                        }`}>
                          {brand.logoUrl ? (
                            <img 
                              src={brand.logoUrl} 
                              alt={brand.name} 
                              className="w-full h-full object-contain p-0.5" 
                            />
                          ) : (
                            <span className="text-[10px] font-black uppercase text-zinc-950 text-center leading-tight">
                              {brand.name}
                            </span>
                          )}
                        </div>
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
              isLoadingCloud ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-8">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="animate-pulse space-y-3 bg-white p-2 border border-zinc-100">
                      <div className="aspect-[3/4] bg-zinc-100 rounded-none w-full" />
                      <div className="h-3 bg-zinc-200 rounded w-3/4 mx-auto" />
                      <div className="h-3 bg-zinc-100 rounded w-1/2 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : (
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
              )
            ) : (
              <div className={`grid gap-x-2.5 sm:gap-x-6 gap-y-6 sm:gap-y-12 ${
                gridCols === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              }`}>
                {finalProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
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
                <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-[0.25em] text-zinc-950 uppercase">
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
          <p className="font-serif text-xs sm:text-sm font-normal tracking-[0.25em] text-zinc-950 uppercase">
            LOADING CATEGORY COLLECTION...
          </p>
        </div>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}
