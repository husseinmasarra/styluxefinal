'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { DataService, isProductMatchingCategory } from '@/lib/store';
import { Product, Category, HomepageCard } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/lib/CartContext';
import { fetchSupabaseCloudData } from '@/lib/supabase';

export default function HomePage() {
  const { currency, settings } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homepageCards, setHomepageCards] = useState<HomepageCard[]>([]);
  const [selectedDept, setSelectedDept] = useState<'women' | 'men'>('women');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [heroIndex, setHeroIndex] = useState<number>(0);

  useEffect(() => {
    setAllProducts(DataService.getProducts());
    setCategories(DataService.getCategories());
    setHomepageCards(DataService.getCards());

    // Immediate direct live sync from Supabase cloud
    fetchSupabaseCloudData().then(cloud => {
      if (cloud.hasData) {
        if (cloud.products !== undefined) {
          setAllProducts(cloud.products);
          localStorage.setItem('styluxe_products_v1', JSON.stringify(cloud.products));
        }
        if (cloud.categories !== undefined) {
          setCategories(cloud.categories);
          localStorage.setItem('styluxe_categories_v1', JSON.stringify(cloud.categories));
        }
        if (cloud.cards !== undefined) {
          setHomepageCards(cloud.cards);
          localStorage.setItem('styluxe_cards_v1', JSON.stringify(cloud.cards));
        }
      }
    });

    const handleUpdate = () => {
      setAllProducts(DataService.getProducts());
      setCategories(DataService.getCategories());
      setHomepageCards(DataService.getCards());
    };
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  // Hero Slideshow Automatic Rotation
  const heroImagesList = (settings.heroImages && settings.heroImages.filter(Boolean).length > 0)
    ? settings.heroImages.filter(Boolean)
    : ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&auto=format&fit=crop&q=80'];

  useEffect(() => {
    if (heroImagesList.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImagesList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImagesList]);

  // ALL Categories created by user in Admin > Manage Categories for this department or all departments
  const catItemsForDept = categories
    .filter(c => c.department === selectedDept || c.department === 'all')
    .map(c => ({
      title: c.name,
      imageUrl: c.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
      link: `/shop?department=${selectedDept}&category=${encodeURIComponent(c.name)}`
    }));

  const customCards = homepageCards
    .filter(c => (c.department === selectedDept || c.department === 'all') && c.title !== 'REDEFINING LUXURY')
    .map(c => ({ title: c.title, imageUrl: c.imageUrl, link: c.linkUrl }));

  // ALWAYS DISPLAY CATEGORIES CREATED IN MANAGE CATEGORIES!
  const allDisplayCards = catItemsForDept.length > 0 ? catItemsForDept : customCards;

  // STRICT SEPARATION: ONLY SHOW PRODUCTS THAT BELONG TO THIS DEPARTMENT OR BOTH!
  const displayedProducts = allProducts.filter(p => p.department === selectedDept || p.department === 'all');

  const sectionHeadingText = selectedDept === 'women' 
    ? "WOMEN'S COLLECTION" 
    : "MEN'S COLLECTION";

  // DYNAMIC DEDICATED WHATSAPP NUMBER PER DEPARTMENT!
  const currentDeptWhatsapp = selectedDept === 'women'
    ? (settings.womenWhatsappNumber || settings.whatsappNumber || '96170123456')
    : (settings.menWhatsappNumber || settings.whatsappNumber || '96170987654');

  const currentHeroImage = heroImagesList[heroIndex] || heroImagesList[0];

  return (
    <div className="bg-white relative">
      
      {/* Hero Section MATCHING REFERENCE SCREENSHOT 100% WITH 5-SLIDE CAROUSEL */}
      <section className="relative w-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] max-w-[1400px] mx-auto overflow-hidden bg-zinc-950 flex items-center justify-start border-b border-zinc-200">
        
        {/* Hero Background Display Image */}
        <img 
          src={currentHeroImage} 
          alt="REDEFINING LUXURY" 
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
        />
        {/* Left Dark Gradient Overlay for Ultra-High Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-transparent" />

        {/* 5 Slide Indicators Dots */}
        {heroImagesList.length > 1 && (
          <div className="absolute top-6 right-8 z-20 flex items-center gap-2">
            {heroImagesList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  heroIndex === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Hero Content Overlay (LEFT ALIGNED 100% MATCHING SCREENSHOT) */}
        <div className="relative z-10 w-full max-w-3xl text-left text-white px-5 sm:px-12 lg:px-20 py-8 sm:py-12 space-y-3 sm:space-y-4">
          
          {/* Subtitle Tag matching screenshot: NEW ARRIVALS / COLLECTION 2026 */}
          <span className="text-[11px] sm:text-sm font-black tracking-[0.25em] text-white uppercase block drop-shadow-sm">
            {settings.heroSubtitle || 'NEW ARRIVALS / COLLECTION 2026'}
          </span>

          {/* Main Title matching screenshot: REDEFINING \n LUXURY (BODONI MODA SERIF) */}
          <h1 className="font-serif text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.04em] text-white uppercase leading-[1.05] drop-shadow-2xl">
            REDEFINING<br />LUXURY
          </h1>

          {/* Description Paragraph matching screenshot */}
          <p className="text-xs sm:text-base font-bold text-zinc-100 max-w-xl leading-relaxed drop-shadow-md pt-0.5">
            {settings.heroDescription || 'Clean silhouettes, oversized fits, and permanent fabrications designed to elevate your daily archives.'}
          </p>

          {/* Left-Aligned Text Link WITH BODONI MODA LUXURY SERIF FONT */}
          <div className="pt-2 sm:pt-4">
            <Link 
              href={`/shop?department=${selectedDept}`} 
              className="inline-block font-serif text-sm sm:text-xl md:text-2xl font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white hover:text-amber-300 transition-all border-b-2 border-white hover:border-amber-300 pb-1 drop-shadow-md"
            >
              SHOP {selectedDept.toUpperCase()} &rarr;
            </Link>
          </div>

        </div>

        {/* Hero Department Switcher Links WITH BODONI MODA LUXURY SERIF FONT */}
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-6 sm:gap-14 w-full px-4">
          <button 
            onClick={() => setSelectedDept('women')} 
            className={`font-serif text-base sm:text-2xl tracking-[0.18em] sm:tracking-[0.2em] uppercase transition-all pb-1 ${
              selectedDept === 'women' 
                ? 'text-white font-black border-b-2 border-white scale-105 sm:scale-110 drop-shadow-lg' 
                : 'text-zinc-400 font-extrabold hover:text-white hover:scale-105'
            }`}
          >
            FOR HER
          </button>

          <button 
            onClick={() => setSelectedDept('men')} 
            className={`font-serif text-base sm:text-2xl tracking-[0.18em] sm:tracking-[0.2em] uppercase transition-all pb-1 ${
              selectedDept === 'men' 
                ? 'text-white font-black border-b-2 border-white scale-105 sm:scale-110 drop-shadow-lg' 
                : 'text-zinc-400 font-extrabold hover:text-white hover:scale-105'
            }`}
          >
            FOR HIM
          </button>
        </div>

      </section>

      {/* CATEGORIES COLLECTION: CARD INSIDE CARD WITH PRODUCTS INSIDE */}
      <section className="section-container">
        <div className="section-header">
          <h2 className="section-title font-serif">
            {sectionHeadingText}
          </h2>
          <div className="section-line" />
        </div>

        {(() => {
          const deptCats = categories.filter(c => c.department === selectedDept || c.department === 'all');

          // Collect all distinct category names that have products in this department
          const categoriesWithProducts = Array.from(new Set([
            ...deptCats.map(c => c.name),
            ...displayedProducts.map(p => p.category?.trim()).filter(Boolean)
          ]));

          const handleCategoryClick = (catName: string) => {
            if (activeCategory.toLowerCase().trim() === catName.toLowerCase().trim()) {
              setActiveCategory('all');
            } else {
              setActiveCategory(catName);
            }
          };

          const allSubCats = deptCats.flatMap(c => (c.subCategories || []).map(sc => ({
            ...sc,
            parentName: c.name,
            parentSlug: c.slug
          })));

          const formatPradaCategoryTitle = (name: string, dept: string): string => {
            const clean = name.trim();
            if (/^(women'?s?|men'?s?)\s+/i.test(clean)) {
              return clean;
            }
            const prefix = dept === 'women' ? "Women's" : (dept === 'men' ? "Men's" : "");
            if (!prefix) return clean;
            return `${prefix} ${clean}`;
          };

          return (
            <div className="space-y-12 max-w-7xl mx-auto">
              {/* EXACT PRADA 4-COLUMN HORIZONTAL GRID MATCHING SCREENSHOT 100% */}
              {deptCats.length > 0 && (
                <div className="border border-zinc-200 bg-white overflow-hidden shadow-2xs">
                  <div className="grid grid-cols-2 lg:grid-cols-4">
                    {deptCats.map((cat, idx) => {
                      const catImage = cat.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80";
                      const catSlug = cat.slug || encodeURIComponent(cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      const formattedTitle = formatPradaCategoryTitle(cat.name, selectedDept);

                      const isLastColMobile = idx % 2 === 1;
                      const isLastRowMobile = idx >= deptCats.length - (deptCats.length % 2 === 0 ? 2 : 1);
                      const isLastColDesktop = idx === deptCats.length - 1;

                      return (
                        <Link
                          key={cat.id}
                          href={`/category/${catSlug}?department=${selectedDept}`}
                          className={`group flex flex-col bg-white overflow-hidden transition-colors hover:bg-zinc-50/60
                            ${!isLastColMobile ? 'border-r border-zinc-200' : ''}
                            ${!isLastRowMobile ? 'border-b border-zinc-200' : ''}
                            lg:border-b-0
                            ${!isLastColDesktop ? 'lg:border-r lg:border-zinc-200' : 'lg:border-r-0'}
                          `}
                          title={`Explore ${formattedTitle}`}
                        >
                          {/* PRADA STUDIO BACKGROUND WITH CRISP OBJECT-CONTAIN / COVER */}
                          <div className="w-full aspect-[4/5] sm:aspect-[3/4] bg-[#f6f6f6] flex items-center justify-center overflow-hidden relative p-3 sm:p-6 lg:p-8">
                            <img 
                              src={catImage} 
                              alt={cat.name} 
                              className="w-full h-full object-contain sm:object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out" 
                            />
                          </div>

                          {/* PRADA CLEAN BOLD TITLE BELOW IMAGE */}
                          <div className="py-3 sm:py-5 px-2 sm:px-3 bg-white text-center border-t border-zinc-100 flex items-center justify-center min-h-[46px] sm:min-h-[56px]">
                            <span className="text-xs sm:text-sm font-bold text-zinc-950 tracking-normal sm:tracking-wide group-hover:underline">
                              {formattedTitle}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-CATEGORIES SECTION IN THE SAME PRADA 4-COLUMN ARRANGEMENT */}
              {allSubCats.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                      SUB-CATEGORIES & ARCHIVES
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500">
                      Curated collections
                    </span>
                  </div>

                  <div className="border border-zinc-200 bg-white overflow-hidden shadow-2xs">
                    <div className="grid grid-cols-2 lg:grid-cols-4">
                      {allSubCats.map((sub, idx) => {
                        const subImage = sub.imageUrl || "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80";
                        const subSlug = sub.slug || encodeURIComponent(sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

                        const isLastColMobile = idx % 2 === 1;
                        const isLastRowMobile = idx >= allSubCats.length - (allSubCats.length % 2 === 0 ? 2 : 1);
                        const isLastColDesktop = idx === allSubCats.length - 1;

                        return (
                          <Link
                            key={sub.id}
                            href={`/category/${subSlug}?department=${selectedDept}`}
                            className={`group flex flex-col bg-white overflow-hidden transition-colors hover:bg-zinc-50/60
                              ${!isLastColMobile ? 'border-r border-zinc-200' : ''}
                              ${!isLastRowMobile ? 'border-b border-zinc-200' : ''}
                              lg:border-b-0
                              ${!isLastColDesktop ? 'lg:border-r lg:border-zinc-200' : 'lg:border-r-0'}
                            `}
                            title={`Explore ${sub.name}`}
                          >
                            <div className="w-full aspect-[4/5] sm:aspect-[3/4] bg-[#f6f6f6] flex items-center justify-center overflow-hidden relative p-3 sm:p-6 lg:p-8">
                              <img 
                                src={subImage} 
                                alt={sub.name} 
                                className="w-full h-full object-contain sm:object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out" 
                              />
                            </div>

                            <div className="py-3 sm:py-5 px-2 sm:px-3 bg-white text-center border-t border-zinc-100 flex flex-col items-center justify-center min-h-[46px] sm:min-h-[56px]">
                              <span className="text-xs sm:text-sm font-bold text-zinc-950 tracking-normal sm:tracking-wide group-hover:underline">
                                {sub.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">
                                {sub.parentName}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* QUICK CATEGORY FILTER TABS PILL BAR */}
              <div className="flex items-center justify-center flex-wrap gap-2 pt-2 border-t border-zinc-100">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all ${
                    activeCategory === 'all'
                      ? 'bg-zinc-950 text-white shadow-sm scale-105'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  ALL CATEGORIES
                </button>
                {categoriesWithProducts.map(cName => {
                  const isSelected = activeCategory !== 'all' && isProductMatchingCategory(cName, activeCategory);
                  const count = displayedProducts.filter(p => isProductMatchingCategory(p.category, cName)).length;
                  if (count === 0 && activeCategory !== cName) return null;

                  return (
                    <button
                      key={cName}
                      onClick={() => handleCategoryClick(cName)}
                      className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all ${
                        isSelected
                          ? 'bg-zinc-950 text-white shadow-sm scale-105'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {cName}
                    </button>
                  );
                })}
              </div>

              {/* PRODUCTS DISPLAY SECTION */}
              <div className="space-y-8 pt-4 border-t border-zinc-200">
                
                {/* CASE A: SINGLE CATEGORY FILTERED */}
                {activeCategory !== 'all' ? (() => {
                  const filteredList = displayedProducts.filter(p => isProductMatchingCategory(p.category, activeCategory));

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 block">
                            CATEGORY SHOWCASE
                          </span>
                          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                            {activeCategory}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setActiveCategory('all')}
                            className="text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-950 border border-zinc-300 px-4 py-2 rounded hover:border-zinc-950 transition-colors"
                          >
                            ← SHOW ALL CATEGORIES
                          </button>
                          <Link
                            href={`/category/${encodeURIComponent(activeCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}?department=${selectedDept}`}
                            className="text-xs font-black uppercase tracking-widest bg-zinc-950 text-white px-4 py-2 rounded hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>EXPLORE DEDICATED PAGE</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>

                      {filteredList.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-50 border border-zinc-200 rounded text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          NO PRODUCTS RECORDED IN THIS CATEGORY YET.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2.5 sm:gap-x-6 gap-y-6 sm:gap-y-10">
                          {filteredList.map(product => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })() : (() => {
                  /* CASE B: ALL CATEGORIES - DISPLAY EACH CATEGORY WITH ITS OWN STRICT PRODUCTS LIST */
                  if (displayedProducts.length === 0) {
                    return (
                      <div className="text-center py-16 bg-zinc-50 border border-zinc-200 rounded text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        NO PRODUCTS RECORDED FOR THIS DEPARTMENT YET.
                      </div>
                    );
                  }

                  // Group products by their distinct categories
                  const groupedCategories = categoriesWithProducts
                    .map(cName => {
                      const prods = displayedProducts.filter(p => isProductMatchingCategory(p.category, cName));
                      return { name: cName, products: prods };
                    })
                    .filter(group => group.products.length > 0);

                  // Any products not matching any known category
                  const knownNames = groupedCategories.map(g => g.name);
                  const orphanProducts = displayedProducts.filter(p => 
                    !knownNames.some(kn => isProductMatchingCategory(p.category, kn))
                  );

                  return (
                    <div className="space-y-16">
                      {groupedCategories.map(group => (
                        <div key={group.name} className="space-y-6 pt-6 first:pt-0">
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-200 pb-3">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 block">
                                CATEGORY COLLECTION
                              </span>
                              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                                {group.name}
                              </h3>
                            </div>
                            <Link
                              href={`/category/${encodeURIComponent(group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}?department=${selectedDept}`}
                              className="text-xs font-black uppercase tracking-widest text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <span>EXPLORE ALL {group.name}</span>
                              <ArrowRight size={14} />
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2.5 sm:gap-x-6 gap-y-6 sm:gap-y-10">
                            {group.products.map(product => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </div>
                      ))}

                      {orphanProducts.length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-zinc-200">
                          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                            <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                              MORE SELECTIONS
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2.5 sm:gap-x-6 gap-y-6 sm:gap-y-10">
                            {orphanProducts.map(product => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          );
        })()}
      </section>

    </div>
  );
}
