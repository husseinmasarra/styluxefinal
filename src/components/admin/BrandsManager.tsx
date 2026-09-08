'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/store';
import { Brand } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';

export function BrandsManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    loadBrands();
    const handleUpdate = () => loadBrands();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadBrands = () => {
    setBrands(DataService.getBrands());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 })
        .then(compressedUrl => setLogoUrl(compressedUrl))
        .catch(err => {
          console.error('Brand compression error:', err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') setLogoUrl(reader.result);
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setBrandName('');
    setLogoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Brand) => {
    setEditingBrand(b);
    setBrandName(b.name);
    setLogoUrl(b.logoUrl);
    setIsModalOpen(true);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    const brandToSave: Brand = {
      id: editingBrand ? editingBrand.id : `brand-${Date.now()}`,
      name: brandName.trim(),
      slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800',
      isFeatured: true
    };

    const updated = DataService.saveBrand(brandToSave);
    setBrands(updated);
    setIsModalOpen(false);
  };

  const handleDeleteBrand = (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      const updated = DataService.deleteBrand(id);
      setBrands(updated);
    }
  };

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* PAGE TITLE & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <h1 className="font-serif text-3xl font-normal tracking-[0.25em] text-zinc-900 uppercase">
          MANAGE BRANDS
        </h1>

        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3.5 bg-zinc-950 text-white text-xs font-extrabold tracking-widest uppercase rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={20} /> ADD BRAND
        </button>
      </div>

      {/* BRANDS DATA TABLE */}
      <div className="border border-zinc-200 rounded-xl p-6 bg-white shadow-sm space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-4 px-6 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">LOGO</th>
                <th className="py-4 px-6 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">BRAND NAME</th>
                <th className="py-4 px-6 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-xs font-bold text-zinc-400 tracking-wider uppercase">
                    NO BRANDS FOUND.
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                    <td className="py-4 px-6 text-center">
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.name} 
                        className="w-14 h-14 object-contain rounded-lg bg-zinc-50 border border-zinc-200 p-1 mx-auto"
                      />
                    </td>

                    <td className="py-4 px-6 font-extrabold text-zinc-950 text-center uppercase tracking-widest text-base">
                      {brand.name}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(brand)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 size={14} /> EDIT
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 size={14} /> DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: ADD / EDIT BRAND - ULTRA LARGE & ULTRA CLEAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-zinc-950/85 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="bg-white border-4 border-zinc-950 rounded-3xl p-8 sm:p-12 max-w-3xl w-full space-y-10 relative shadow-2xl animate-fadeIn">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-950 p-3 rounded-full hover:bg-zinc-100 transition-colors">
              <X size={32} />
            </button>

            <div className="border-b-4 border-zinc-950 pb-5">
              <h3 className="text-3xl sm:text-4xl font-serif font-black text-zinc-950 uppercase tracking-wider">
                {editingBrand ? 'EDIT BRAND' : 'ADD NEW BRAND'}
              </h3>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-8 text-lg">
              <div className="space-y-3">
                <label className="font-black text-zinc-950 uppercase block text-base tracking-widest">Brand Name *</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Brand name (e.g. Nike, Chanel, Gucci)"
                  required
                  className="w-full p-5 border-3 border-zinc-300 rounded-xl font-extrabold text-xl focus:border-zinc-950 focus:outline-none bg-zinc-50/50"
                />
              </div>

              <div className="space-y-3">
                <label className="font-black text-zinc-950 uppercase block text-base tracking-widest">Brand Logo *</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <label className="w-full sm:w-auto px-8 py-5 bg-zinc-950 text-white text-sm font-black uppercase rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-center gap-3 shrink-0 shadow-lg">
                    <Upload size={22} /> UPLOAD LOGO FROM COMPUTER
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Or paste URL..."
                    className="w-full p-4 border-3 border-zinc-300 rounded-xl font-mono text-sm"
                  />
                </div>
                {logoUrl && (
                  <img src={logoUrl} alt="Logo preview" className="w-24 h-24 object-contain rounded-xl bg-zinc-50 border-3 border-zinc-200 p-2 mt-3 shadow-md" />
                )}
              </div>

              <div className="pt-8 flex items-center justify-end gap-5 border-t-3 border-zinc-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 border-3 border-zinc-300 text-zinc-950 font-black text-sm uppercase rounded-xl hover:bg-zinc-100 transition-colors">
                  CANCEL
                </button>
                <button type="submit" className="px-10 py-5 bg-zinc-950 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 shadow-2xl transition-all">
                  + {editingBrand ? 'UPDATE BRAND' : 'ADD BRAND'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
