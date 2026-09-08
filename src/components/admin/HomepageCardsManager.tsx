'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/store';
import { HomepageCard, Department } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Upload } from 'lucide-react';

export function HomepageCardsManager() {
  const [cards, setCards] = useState<HomepageCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<HomepageCard | null>(null);

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
    const handleUpdate = () => loadCards();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadCards = () => {
    setCards(DataService.getCards());
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

      {/* 2. DATA TABLE MATCHING EXACT SCREENSHOT (ENLARGED TYPOGRAPHY) */}
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
        <div className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
