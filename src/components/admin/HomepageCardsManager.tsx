'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/store';
import { HomepageCard, Department, StoreSettings } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Upload, Save, Check, Eye, EyeOff, Sliders } from 'lucide-react';

export function HomepageCardsManager() {
  const [cards, setCards] = useState<HomepageCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<HomepageCard | null>(null);

  // Hero Banner Management State
  const [heroSettings, setHeroSettings] = useState<StoreSettings>(() => DataService.getSettings());
  const [isHeroSaved, setIsHeroSaved] = useState(false);
  const [showAdvancedHero, setShowAdvancedHero] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    department: 'women' as Department,
    targetCategory: "Women's Bags",
    linkUrl: '/shop?department=women&category=Women%27s%20Bags',
    imageUrl: '',
    displayOrder: 1,
    active: true
  });

  useEffect(() => {
    loadCards();
    setHeroSettings(DataService.getSettings());
    const handleUpdate = () => {
      loadCards();
      setHeroSettings(DataService.getSettings());
    };
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  // Keyboard shortcut listener: ESC to close card modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const loadCards = () => {
    setCards(DataService.getCards());
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number = 0) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, { maxWidth: 1800, maxHeight: 1800, quality: 0.85 })
        .then(compressedUrl => {
          updateHeroImageSlot(slotIndex, compressedUrl);
        })
        .catch(err => {
          console.error('Hero image compression error:', err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) updateHeroImageSlot(slotIndex, reader.result as string);
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const updateHeroImageSlot = (slotIndex: number, url: string) => {
    const currentList = [...(heroSettings.heroImages || [])];
    while (currentList.length < 5) currentList.push('');
    currentList[slotIndex] = url;
    const updated: StoreSettings = { ...heroSettings, heroImages: currentList };
    setHeroSettings(updated);
    DataService.updateSettings(updated);
    setIsHeroSaved(true);
    setTimeout(() => setIsHeroSaved(false), 2500);
  };

  const handleHeroFieldChange = (field: keyof StoreSettings, val: any) => {
    const updated: StoreSettings = { ...heroSettings, [field]: val };
    setHeroSettings(updated);
  };

  const handleSaveHeroSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    DataService.updateSettings(heroSettings);
    setIsHeroSaved(true);
    setTimeout(() => setIsHeroSaved(false), 2500);
  };

  const handleOpenAddModal = () => {
    setEditingCard(null);
    setFormData({
      title: "Men's Leather Bags",
      department: 'men',
      targetCategory: "Bags",
      linkUrl: '/shop?department=men&category=Bags',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      displayOrder: cards.length + 1,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.85 })
        .then(compressedUrl => {
          setFormData(prev => ({ ...prev, imageUrl: compressedUrl }));
        })
        .catch(err => {
          console.error('Card image compression error:', err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            }
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const handleOpenEditModal = (card: HomepageCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      department: card.department,
      targetCategory: card.subtitle || card.title,
      linkUrl: card.linkUrl,
      imageUrl: card.imageUrl,
      displayOrder: card.displayOrder,
      active: card.active
    });
    setIsModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const cardToSave: HomepageCard = {
      id: editingCard ? editingCard.id : `card-${Date.now()}`,
      title: formData.title,
      subtitle: formData.targetCategory,
      department: formData.department,
      ctaText: 'EXPLORE',
      linkUrl: formData.linkUrl || `/shop?department=${formData.department}`,
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
      active: formData.active,
      displayOrder: Number(formData.displayOrder)
    };

    const updated = DataService.saveCard(cardToSave);
    setCards(updated);
    setIsModalOpen(false);
  };

  const handleDeleteCard = (id: string) => {
    if (confirm('Are you sure you want to delete this category card?')) {
      const updated = DataService.deleteCard(id);
      setCards(updated);
    }
  };

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* 1. TOP HEADER TITLE & ADD BUTTON MATCHING EXACT SCREENSHOT (20-30% ENLARGED FONTS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase">
            HOMEPAGE CATEGORY CARDS
          </h1>
          <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider pt-1.5">
            Manage the category cards grid displayed on the homepage for Women, Men, and Kids departments.
          </p>
        </div>

        {/* Right Action Button */}
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3.5 bg-zinc-950 text-white text-xs font-black tracking-widest uppercase hover:bg-zinc-800 transition-all rounded shadow-md flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus size={18} strokeWidth={3} />
          <span>ADD NEW CATEGORY CARD</span>
        </button>
      </div>

      {/* 2. HERO BANNER & MAIN HOMEPAGE IMAGE */}
      <div className="border-2 border-zinc-900 rounded-xl p-6 sm:p-8 bg-white shadow-md space-y-6">
        <div className="border-b border-zinc-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0">
              <ImageIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-2xl font-black tracking-[0.2em] text-zinc-950 uppercase">
                  HERO BANNER & MAIN IMAGE
                </h2>
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
                  TOP BANNER IMAGE
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-0.5">
                Manage the main header photo displayed at the top of the homepage (replaceable / removable anytime).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveHeroSettings()}
              className={`px-6 py-3 rounded text-xs font-black tracking-widest uppercase flex items-center gap-2 transition-all shadow-sm ${
                isHeroSaved ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              {isHeroSaved ? <Check size={16} /> : <Save size={16} />}
              <span>{isHeroSaved ? 'HERO SAVED!' : 'SAVE HERO BANNER'}</span>
            </button>
          </div>
        </div>

        {/* Banner Visibility & Status */}
        <div className="flex flex-wrap items-center justify-between bg-zinc-50 border border-zinc-200 p-4 rounded-lg gap-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!heroSettings.hideHeroBanner}
              onChange={e => {
                const hide = !e.target.checked;
                handleHeroFieldChange('hideHeroBanner', hide);
                DataService.updateSettings({ ...heroSettings, hideHeroBanner: hide });
                setIsHeroSaved(true);
                setTimeout(() => setIsHeroSaved(false), 2000);
              }}
              className="w-5 h-5 accent-zinc-950 rounded cursor-pointer"
            />
            <div>
              <span className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                SHOW HERO BANNER ON HOMEPAGE
              </span>
              <span className="text-[11px] font-semibold text-zinc-500 block">
                Uncheck to completely hide the top hero section so categories and products start at the very top.
              </span>
            </div>
          </label>

          <button
            type="button"
            onClick={() => setShowAdvancedHero(prev => !prev)}
            className="text-xs font-bold text-zinc-700 hover:text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 border border-zinc-300 px-3 py-1.5 rounded bg-white"
          >
            <Sliders size={14} />
            <span>{showAdvancedHero ? 'Hide Slide Options' : 'Slideshow & Text Settings'}</span>
          </button>
        </div>

        {/* Live Banner Preview & Main Image Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Preview Box (16:9 or compact) */}
          <div className="lg:col-span-7 space-y-2">
            <span className="text-xs font-black text-zinc-900 uppercase tracking-wider block">
              CURRENT ACTIVE HERO IMAGE
            </span>
            <div className="relative aspect-[21/9] sm:aspect-[16/6] w-full rounded-xl overflow-hidden border-2 border-zinc-300 bg-zinc-950 shadow-inner group">
              {(heroSettings.heroImages && heroSettings.heroImages[0]) ? (
                <img
                  src={heroSettings.heroImages[0]}
                  alt="Current Hero"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-1">
                  <ImageIcon size={36} />
                  <span className="text-xs font-bold uppercase">NO IMAGE (DARK TEXTURED BACKDROP)</span>
                </div>
              )}

              {/* Simulation Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-4 sm:p-6 flex flex-col justify-center text-white pointer-events-none">
                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-300">
                  {heroSettings.heroSubtitle || 'NEW ARRIVALS / COLLECTION 2026'}
                </span>
                <h3 className="font-serif text-lg sm:text-2xl font-bold tracking-wider uppercase leading-tight">
                  {heroSettings.heroTitle ? heroSettings.heroTitle.replace('\n', ' ') : 'REDEFINING LUXURY'}
                </h3>
                <span className="text-[10px] text-zinc-200 mt-1 uppercase tracking-widest border-b border-white/60 w-fit pb-0.5">
                  SHOP NOW &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons for Main Hero Image */}
          <div className="lg:col-span-5 space-y-4 border border-zinc-200 rounded-xl p-5 bg-zinc-50">
            <span className="text-xs font-black text-zinc-950 uppercase tracking-wider block border-b border-zinc-200 pb-2">
              CHANGE MAIN IMAGE
            </span>

            {/* Easy 1-click Upload from Computer / Mobile */}
            <label className="w-full py-3.5 bg-zinc-950 text-white text-xs font-black tracking-widest uppercase rounded-lg cursor-pointer hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-sm">
              <Upload size={16} />
              <span>UPLOAD NEW IMAGE</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleHeroImageUpload(e, 0)}
              />
            </label>

            {/* Paste Image URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                OR PASTE IMAGE URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={(heroSettings.heroImages && heroSettings.heroImages[0]) || ''}
                  onChange={e => updateHeroImageSlot(0, e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-zinc-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>

            {/* Clear / Delete Button */}
            {(heroSettings.heroImages && heroSettings.heroImages[0]) && (
              <button
                type="button"
                onClick={() => updateHeroImageSlot(0, '')}
                className="w-full py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>CLEAR THIS IMAGE</span>
              </button>
            )}
          </div>

        </div>

        {/* HERO BANNER TEXTS CUSTOMIZATION (OPEN & PROMINENT) */}
        <div className="border border-zinc-200 rounded-xl p-5 sm:p-6 bg-zinc-50/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-serif text-lg font-black tracking-wider text-zinc-950 uppercase flex items-center gap-2">
                <span>HERO BANNER TEXTS</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  HERO BANNER HEADINGS & TEXT
                </span>
              </h3>
              <p className="text-xs text-zinc-500 font-medium pt-0.5">
                Customize the subtitle, main title, and description displayed over the hero banner.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveHeroSettings()}
              className={`px-5 py-2.5 rounded text-xs font-black tracking-widest uppercase flex items-center gap-2 transition-all shadow-xs shrink-0 self-start sm:self-auto ${
                isHeroSaved ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              {isHeroSaved ? <Check size={16} /> : <Save size={16} />}
              <span>{isHeroSaved ? 'SAVED!' : 'SAVE TEXTS'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Subtitle */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                1. Subtitle (Small Top Heading)
              </label>
              <input
                type="text"
                value={heroSettings.heroSubtitle !== undefined ? heroSettings.heroSubtitle : 'NEW ARRIVALS / COLLECTION 2026'}
                onChange={e => handleHeroFieldChange('heroSubtitle', e.target.value)}
                placeholder="e.g. NEW ARRIVALS / COLLECTION 2026"
                className="w-full p-3 border-2 border-zinc-300 rounded-lg text-xs font-bold tracking-wider uppercase bg-white focus:border-zinc-950 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-400 block">
                Displays at the top with delicate tracking
              </span>
            </div>

            {/* Main Title (Textarea to support 2 lines) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                2. Main Title (Primary Headline)
              </label>
              <textarea
                rows={2}
                value={heroSettings.heroTitle !== undefined ? heroSettings.heroTitle : 'REDEFINING\nLUXURY'}
                onChange={e => handleHeroFieldChange('heroTitle', e.target.value)}
                placeholder="REDEFINING&#10;LUXURY"
                className="w-full p-3 border-2 border-zinc-300 rounded-lg font-serif font-bold text-xs uppercase bg-white focus:border-zinc-950 focus:outline-none resize-none leading-relaxed"
              />
              <span className="text-[10px] text-zinc-400 block">
                Press Enter to create multiple lines (e.g., REDEFINING then LUXURY)
              </span>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                3. Description Text
              </label>
              <textarea
                rows={2}
                value={heroSettings.heroDescription !== undefined ? heroSettings.heroDescription : 'Clean silhouettes, oversized fits, and permanent fabrications designed to elevate your daily archives.'}
                onChange={e => handleHeroFieldChange('heroDescription', e.target.value)}
                placeholder="Clean silhouettes, oversized fits, and permanent fabrications designed to elevate your daily archives."
                className="w-full p-3 border-2 border-zinc-300 rounded-lg text-xs bg-white focus:border-zinc-950 focus:outline-none resize-none leading-relaxed"
              />
              <span className="text-[10px] text-zinc-400 block">
                Subtitle description below the main headline
              </span>
            </div>
          </div>
        </div>

        {/* Additional Slides Toggle */}
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvancedHero(prev => !prev)}
            className="text-xs font-bold text-zinc-700 hover:text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 border border-zinc-300 px-3 py-2 rounded bg-white hover:bg-zinc-50 transition-colors"
          >
            <Sliders size={14} />
            <span>{showAdvancedHero ? 'Hide Extra Slides' : 'Manage Extra Slideshow Images'}</span>
          </button>
        </div>

        {/* Collapsible Additional Slides Customization */}
        {showAdvancedHero && (
          <div className="border-t border-zinc-200 pt-4 space-y-4">
            <span className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
              ADDITIONAL SLIDESHOW IMAGES (FOR AUTOMATIC ROTATION)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(idx => {
                const currentSlotImg = (heroSettings.heroImages && heroSettings.heroImages[idx]) || '';
                return (
                  <div key={idx} className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-zinc-900">
                      <span>SLIDE #{idx + 1}</span>
                      {currentSlotImg && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>

                      <div className="aspect-[16/9] w-full bg-zinc-200 rounded overflow-hidden border border-zinc-300 relative">
                        {currentSlotImg ? (
                          <img src={currentSlotImg} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-400 text-[10px] font-bold uppercase">
                            EMPTY
                          </div>
                        )}
                      </div>

                      <label className="w-full py-2 bg-zinc-900 text-white text-[10px] font-bold uppercase rounded cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1">
                        <Upload size={12} />
                        <span>UPLOAD</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleHeroImageUpload(e, idx)}
                        />
                      </label>

                      <input
                        type="text"
                        value={currentSlotImg}
                        onChange={e => updateHeroImageSlot(idx, e.target.value)}
                        placeholder="Paste URL..."
                        className="w-full p-1.5 border border-zinc-300 rounded text-[10px] font-mono"
                      />

                      {currentSlotImg && (
                        <button
                          type="button"
                          onClick={() => updateHeroImageSlot(idx, '')}
                          className="text-[10px] font-bold text-red-600 hover:underline uppercase block w-full text-center"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
        )}

      </div>

      {/* 3. DATA TABLE FOR CATEGORY CARDS */}
      <div className="border border-zinc-300 rounded overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-100/70">
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">DEPT</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">IMAGE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">TITLE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">TARGET CATEGORY</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  No homepage cards found.
                </td>
              </tr>
            ) : (
              cards.map((card) => (
                <tr key={card.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                  <td className="py-4 px-6 font-extrabold text-zinc-950 text-center uppercase tracking-wider">
                    {card.department.toUpperCase()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <img 
                      src={card.imageUrl} 
                      alt={card.title} 
                      className="w-14 h-14 object-cover rounded bg-zinc-100 mx-auto border border-zinc-200"
                    />
                  </td>
                  <td className="py-4 px-6 font-extrabold text-zinc-950 text-center uppercase tracking-wider">
                    {card.title}
                  </td>
                  <td className="py-4 px-6 font-bold text-zinc-600 text-center uppercase tracking-wider">
                    {card.subtitle || card.title}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(card)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors"
                      >
                        <Edit2 size={12} /> EDIT
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} /> DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. MODAL POPUP MATCHING EXACT SCREENSHOT 100% */}
      {isModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-8 sm:p-10 max-w-xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-none">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2">
              <X size={20} />
            </button>

            {/* Header matching screenshot: CATEGORY CARD */}
            <h2 className="font-serif text-3xl font-black tracking-[0.25em] text-zinc-950 uppercase text-center">
              CATEGORY CARD
            </h2>

            <form onSubmit={handleSaveCard} className="space-y-5 text-xs font-sans">
              
              {/* Department Dropdown matching screenshot */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Department *</label>
                <select 
                  value={formData.department} 
                  onChange={e => setFormData({ ...formData, department: e.target.value as any })}
                  className="w-full p-3.5 border border-zinc-900 rounded-none text-sm font-semibold text-zinc-950 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 uppercase"
                >
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="kids">Kids</option>
                </select>
              </div>

              {/* Card Title Input matching screenshot */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Card Title (e.g. Women's Bags) *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g. Men's Leather Bags"
                  required 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* Target Category Input matching screenshot */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Target Category (e.g. Bags, Shoes) *</label>
                <input 
                  type="text" 
                  value={formData.targetCategory} 
                  onChange={e => setFormData({ ...formData, targetCategory: e.target.value })} 
                  placeholder="e.g. Bags"
                  required 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* Category Image Upload & URL Inputs matching screenshot */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">Category Image (Upload File or Image URL) *</label>
                
                <div className="p-3 border border-zinc-300 rounded-none bg-white flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-zinc-950 hover:file:bg-zinc-300 cursor-pointer"
                  />
                </div>

                <input 
                  type="text" 
                  value={formData.imageUrl} 
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} 
                  placeholder="Or paste Image URL (e.g. assets/category_bags.png)" 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />

                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="Preview" className="w-16 h-16 object-cover border border-zinc-200 mt-2" />
                )}
              </div>

              {/* Save Button matching screenshot: FULL WIDTH SOLID BLACK */}
              <button 
                type="submit" 
                className="w-full py-4 bg-black hover:bg-zinc-900 text-white text-xs font-black tracking-[0.25em] uppercase transition-colors rounded-none shadow-md mt-6"
              >
                SAVE CATEGORY CARD
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
