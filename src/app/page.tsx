'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { DataService, isProductMatchingCategory, isProductMatchingSeason } from '@/lib/store';
import { Product, Category, HomepageCard, StoreSettings, Department } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/lib/CartContext';
import { fetchSupabaseCloudData } from '@/lib/supabase';
import { setActiveDepartment } from '@/lib/departmentContext';

export default function HomePage() {
  const { currency, settings } = useCart();
  const [currentSettings, setCurrentSettings] = useState<StoreSettings>(settings);
  const [selectedDept, setSelectedDept] = useState<Department>('women');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homepageCards, setHomepageCards] = useState<HomepageCard[]>([]);
  const [heroIndex, setHeroIndex] = useState<number>(0);

  useEffect(() => {
    setCurrentSettings(DataService.getSettings());
  }, [settings]);

  useEffect(() => {
    // Initial load
    setAllProducts(DataService.getProducts());
    setCategories(DataService.getCategories());
    setHomepageCards(DataService.getCards());
    setCurrentSettings(DataService.getSettings());

    // Background cloud sync
    fetchSupabaseCloudData().then(cloud => {
      if (cloud.hasData) {
        if (cloud.products !== undefined && cloud.products.length > 0) {
          setAllProducts(cloud.products);
          DataService.saveAllProducts(cloud.products);
        }
        if (cloud.categories !== undefined) {
          setCategories(cloud.categories);
          DataService.saveAllCategories(cloud.categories);
        }
        if (cloud.cards !== undefined) {
          setHomepageCards(cloud.cards);
          try {
            localStorage.setItem('styluxe_cards_v1', JSON.stringify(cloud.cards));
          } catch (_) {}
        }
        if (cloud.settings !== undefined && cloud.settings) {
          const currentLocal = DataService.getSettings();
          const merged = { ...currentLocal, ...cloud.settings };
          setCurrentSettings(merged);
          try {
            localStorage.setItem('styluxe_settings_v1', JSON.stringify(merged));
          } catch (_) {}
        }
      }
    });

    const handleUpdate = () => {
      setAllProducts(DataService.getProducts());
      setCategories(DataService.getCategories());
      setHomepageCards(DataService.getCards());
      setCurrentSettings(DataService.getSettings());
    };
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  // Hero Slideshow Automatic Rotation
  const heroImagesList = (currentSettings.heroImages && currentSettings.heroImages.filter(Boolean).length > 0)
    ? currentSettings.heroImages.filter(Boolean)
    : [];

  useEffect(() => {
    if (heroImagesList.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImagesList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImagesList.length]);

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

  // STRICT SEPARATION & SEASONAL FILTERING: ONLY SHOW PRODUCTS THAT BELONG TO THIS DEPARTMENT AND ACTIVE SEASON!
  const displayedProducts = allProducts.filter(p => {
    if (p.department !== selectedDept && p.department !== 'all') return false;
    return isProductMatchingSeason(p.season, currentSettings.activeSeason);
  });

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
      
      {/* Hero Section: Enlarge by 20% */}
      {!currentSettings.hideHeroBanner && (
        <section className="relative w-full min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] max-w-[1400px] mx-auto overflow-hidden bg-zinc-950 flex items-center justify-start border-b border-zinc-200">
          
          {/* Slideshow with Ken Burns Zoom Transition Effect & Video Support */}
          {heroImagesList.length > 0 && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {heroImagesList.map((mediaUrl, idx) => {
                const isActive = heroIndex === idx;
                const lower = (mediaUrl || '').toLowerCase();
                const isVideo = lower.startsWith('data:video') ||
                  lower.endsWith('.mp4') ||
                  lower.endsWith('.webm') ||
                  lower.endsWith('.mov') ||
                  lower.endsWith('.ogg') ||
                  lower.includes('/video') ||
                  lower.includes('video/mp4');

                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    {isVideo ? (
                      <video 
                        src={mediaUrl} 
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <img 
                        src={mediaUrl} 
                        alt={currentSettings.heroTitle || "REDEFINING LUXURY"} 
                        loading={idx === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className={`w-full h-full object-cover object-center ${
                          isActive ? 'hero-slide-zoom-active' : 'scale-100'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Soft, Elegant Vignette Gradient Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />

          {/* Slide Indicators (Delicate Dots) */}
          {heroImagesList.length > 1 && (
            <div className="absolute top-4 sm:top-5 right-6 sm:right-8 z-20 flex items-center gap-2">
              {heroImagesList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    heroIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Hero Content Overlay (Softer Typography, Balanced Proportions) */}
          <div className="relative z-20 w-full max-w-2xl text-left text-white px-6 sm:px-12 lg:px-16 py-8 sm:py-12 space-y-2.5 sm:space-y-3 antialiased">
            
            {/* Subtitle: Soft, refined, letter-spaced */}
            <span className="font-sans text-[10px] sm:text-[11px] font-light tracking-[0.3em] text-zinc-300 uppercase block">
              {currentSettings.heroSubtitle || `NEW ARRIVALS / COLLECTION ${new Date().getFullYear()}`}
            </span>

            {/* Main Title: Refined Cinzel Serif, Soft Weight, Balanced Line Height */}
            <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl lg:text-[44px] font-normal tracking-[0.2em] text-white uppercase leading-[1.18]">
              {currentSettings.heroTitle ? (
                <span className="whitespace-pre-line">{currentSettings.heroTitle}</span>
              ) : (
                <>REDEFINING<br />LUXURY</>
              )}
            </h1>

            {/* Description Paragraph: Light, Elegant */}
            <p className="font-sans text-[11px] sm:text-xs font-light text-zinc-200/90 max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none pt-0.5">
              {currentSettings.heroDescription || 'Clean silhouettes, oversized fits, and permanent fabrications designed to elevate your daily archives.'}
            </p>

            {/* Shop Call to Action Link: Soft, Understated Elegance */}
            <div className="pt-2">
              <Link 
                href={`/shop?department=${selectedDept}`} 
                className="inline-flex items-center gap-2 font-serif text-xs sm:text-sm font-normal tracking-[0.24em] uppercase text-white hover:text-amber-200 transition-colors border-b border-white/70 hover:border-amber-200 pb-0.5"
              >
                <span>SHOP {selectedDept.toUpperCase()}</span>
                <span className="text-xs">&rarr;</span>
              </Link>
            </div>

          </div>

          {/* Hero Department Switcher Links (Softer, Refined Luxury Styling) */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-4 sm:gap-8 w-full px-4 antialiased">
            <button 
              onClick={() => { setSelectedDept('women'); setActiveDepartment('women'); }} 
              className={`font-serif text-xs sm:text-sm tracking-[0.22em] uppercase transition-all pb-0.5 cursor-pointer ${
                selectedDept === 'women' 
                  ? 'text-white font-normal border-b border-white' 
                  : 'text-zinc-400 font-light hover:text-white'
              }`}
            >
              FOR HER
            </button>

            <button 
              onClick={() => { setSelectedDept('men'); setActiveDepartment('men'); }} 
              className={`font-serif text-xs sm:text-sm tracking-[0.22em] uppercase transition-all pb-0.5 cursor-pointer ${
                selectedDept === 'men' 
                  ? 'text-white font-normal border-b border-white' 
                  : 'text-zinc-400 font-light hover:text-white'
              }`}
            >
              FOR HIM
            </button>
          </div>

        </section>
      )}

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
          const cleanName = (raw: string) => raw.split(/[>/]+/).pop()?.trim() || raw.trim();

          // Collect all distinct category names that have products in this department (using clean leaf names so sections aren't duplicate)
          const leafNamesWithProducts = Array.from(new Set(
            displayedProducts.map(p => cleanName(p.category || '')).filter(Boolean)
          ));

          const categoriesWithProducts = leafNamesWithProducts.length > 0
            ? leafNamesWithProducts
            : deptCats.map(c => c.name);

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

                          {/* PRADA REFINED LUXURY TITLE BELOW IMAGE */}
                          <div className="py-3 sm:py-5 px-2 sm:px-3 bg-white text-center border-t border-zinc-100 flex items-center justify-center min-h-[46px] sm:min-h-[56px]">
                            <span className="font-serif text-xs sm:text-sm font-normal text-zinc-950 tracking-[0.22em] uppercase group-hover:underline">
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
                              <span className="font-serif text-xs sm:text-sm font-normal text-zinc-950 tracking-[0.22em] uppercase group-hover:underline">
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

              {/* QUICK CATEGORY NAVIGATION PILLS */}
              <div className="flex items-center justify-center flex-wrap gap-2 pt-2 border-t border-zinc-100">
                <Link
                  href={`/shop?department=${selectedDept}`}
                  className="px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all bg-zinc-100 text-zinc-600 hover:bg-zinc-950 hover:text-white"
                >
                  ALL CATEGORIES
                </Link>
                {categoriesWithProducts.map(cName => {
                  const matchedCat = deptCats.find(c => isProductMatchingCategory(c.name, cName));
                  const slug = matchedCat?.slug || encodeURIComponent(cName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  const count = displayedProducts.filter(p => isProductMatchingCategory(p.category, cName)).length;
                  if (count === 0) return null;

                  return (
                    <Link
                      key={cName}
                      href={`/category/${slug}?department=${selectedDept}`}
                      className="px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all bg-zinc-100 text-zinc-600 hover:bg-zinc-950 hover:text-white"
                    >
                      {cName} ({count})
                    </Link>
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
                          <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-[0.25em] text-zinc-950 uppercase">
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
                      <div className="text-center py-16 px-4 bg-zinc-50 border border-zinc-200 rounded max-w-2xl mx-auto space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 block">
                          {selectedDept === 'women' ? "WOMEN'S COLLECTION" : "MEN'S COLLECTION"}
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-[0.2em] text-zinc-950 uppercase">
                          {selectedDept === 'women' ? "NEW ARCHIVE IN CURATION" : "COLLECTION REFRESH IN PROGRESS"}
                        </h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                          {selectedDept === 'women' 
                            ? "Exclusive designer selections for women are currently arriving. Explore our Men's Collection or contact our VIP Concierge for bespoke sourcing."
                            : "New designer arrivals are updating. Inquire via our WhatsApp VIP Concierge for incoming luxury drops."}
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                          {selectedDept === 'women' && (
                            <button
                              onClick={() => { setSelectedDept('men'); setActiveDepartment('men'); }}
                              className="px-6 py-3 bg-zinc-950 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              EXPLORE MEN'S COLLECTION &rarr;
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${(selectedDept === 'women' ? (currentSettings.womenWhatsappNumber || currentSettings.whatsappNumber || '96178709321') : (currentSettings.menWhatsappNumber || currentSettings.whatsappNumber || '96179024934')).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello STYLUXE Concierge, I would like to inquire about the ${selectedDept === 'women' ? "Women's" : "Men's"} Collection arrivals.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5"
                          >
                            <span>VIP WHATSAPP CONCIERGE</span>
                          </a>
                        </div>
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
                              <h3 className="font-serif text-lg sm:text-xl font-normal tracking-[0.25em] text-zinc-950 uppercase">
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
                            <h3 className="font-serif text-lg sm:text-xl font-normal tracking-[0.25em] text-zinc-950 uppercase">
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
