'use client';

import React, { useState, useEffect } from 'react';
import { DataService, isProductMatchingCategory } from '@/lib/store';
import { Category, Department } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { Plus, Edit2, Trash2, X, FolderPlus, ArrowUp, ArrowDown, ExternalLink, Upload } from 'lucide-react';

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Modal States
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);

  // Form States for Main Category
  const [catName, setCatName] = useState('');
  const [catDepartment, setCatDepartment] = useState<Department>('women');
  const [catImage, setCatImage] = useState('');
  const [catOrder, setCatOrder] = useState<number>(1);

  // Form States for Sub Category
  const [subName, setSubName] = useState('');
  const [subImage, setSubImage] = useState('');
  const [parentCatId, setParentCatId] = useState('');
  const [subDepartment, setSubDepartment] = useState<Department>('women');
  const [subOrder, setSubOrder] = useState<number>(1);
  const [editingSubCat, setEditingSubCat] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
    const handleUpdate = () => loadCategories();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  // Keyboard shortcut listener: ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSubCatModalOpen) {
          setIsSubCatModalOpen(false);
          setEditingSubCat(null);
        } else if (isCatModalOpen) {
          setIsCatModalOpen(false);
        }
      }
    };
    if (isCatModalOpen || isSubCatModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCatModalOpen, isSubCatModalOpen]);

  const loadCategories = () => {
    const cats = DataService.getCategories();
    setCategories(cats);
    if (cats.length > 0 && !parentCatId) {
      setParentCatId(cats[0].id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.84 })
        .then(compressedUrl => callback(compressedUrl))
        .catch(err => {
          console.error('Category compression error:', err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) callback(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catName.trim(),
      slug: catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      department: catDepartment,
      imageUrl: catImage || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
      isFeatured: true,
      displayOrder: Number(catOrder),
      subCategories: []
    };

    const updated = DataService.saveCategory(newCat);
    setCategories(updated);

    setCatName('');
    setCatImage('');
    setIsCatModalOpen(false);
  };

  const handleOpenAddSubCat = (selectedParentId?: string) => {
    setEditingSubCat(null);
    if (selectedParentId) {
      setParentCatId(selectedParentId);
      const parent = categories.find(c => c.id === selectedParentId);
      if (parent) setSubDepartment(parent.department);
    } else if (categories.length > 0 && !parentCatId) {
      setParentCatId(categories[0].id);
      setSubDepartment(categories[0].department);
    }
    setSubName('');
    setSubImage('');
    setIsSubCatModalOpen(true);
  };

  const handleOpenEditSubCat = (parent: Category, sub: Category) => {
    setEditingSubCat(sub);
    setParentCatId(parent.id);
    setSubDepartment(sub.department || parent.department);
    setSubName(sub.name);
    setSubImage(sub.imageUrl || '');
    setIsSubCatModalOpen(true);
  };

  const handleSaveSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !parentCatId) return;

    const parent = categories.find(c => c.id === parentCatId);
    if (!parent) return;

    const existingSub = parent.subCategories || [];
    let updatedSub: Category[];

    if (editingSubCat) {
      updatedSub = existingSub.map(s => {
        if (s.id === editingSubCat.id) {
          return {
            ...s,
            name: subName.trim(),
            slug: subName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            department: subDepartment,
            imageUrl: subImage.trim() || s.imageUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800'
          };
        }
        return s;
      });
    } else {
      const newSub: Category = {
        id: `subcat-${Date.now()}`,
        name: subName.trim(),
        slug: subName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        department: subDepartment,
        imageUrl: subImage.trim() || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800',
        isFeatured: false,
        displayOrder: Number(subOrder)
      };
      updatedSub = [...existingSub, newSub];
    }

    const updatedParent: Category = {
      ...parent,
      subCategories: updatedSub
    };

    const updated = DataService.saveCategory(updatedParent);
    setCategories(updated);

    setSubName('');
    setSubImage('');
    setEditingSubCat(null);
    setIsSubCatModalOpen(false);
  };

  const handleDeleteSubCategory = (parentId: string, subId: string) => {
    if (!confirm('Are you sure you want to delete this sub-category?')) return;
    const parent = categories.find(c => c.id === parentId);
    if (!parent) return;

    const updatedSub = (parent.subCategories || []).filter(s => s.id !== subId);
    const updatedParent: Category = {
      ...parent,
      subCategories: updatedSub
    };

    const updated = DataService.saveCategory(updatedParent);
    setCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const updated = DataService.deleteCategory(id);
      setCategories(updated);
    }
  };

  const handleMoveOrder = (catId: string, direction: 'up' | 'down') => {
    const updated = [...categories];
    const index = updated.findIndex(c => c.id === catId);
    if (index < 0) return;

    if (direction === 'up' && index > 0) {
      const temp = updated[index].displayOrder;
      updated[index].displayOrder = updated[index - 1].displayOrder;
      updated[index - 1].displayOrder = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index].displayOrder;
      updated[index].displayOrder = updated[index + 1].displayOrder;
      updated[index + 1].displayOrder = temp;
    }

    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    updated.forEach(c => DataService.saveCategory(c));
    setCategories(updated);
  };

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* TOP HEADER */}
      {/* TOP HEADER (20-30% ENLARGED FONTS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase">
            MANAGE CATEGORIES
          </h1>
          <a
            href="/admin?tab=home_cards"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-zinc-600 hover:text-zinc-950 uppercase mt-2.5 transition-colors"
          >
            <span>⊞ EDIT HOMEPAGE CARDS</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-6 py-3.5 bg-zinc-950 text-white text-xs font-black tracking-widest uppercase rounded hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-md"
          >
            <Plus size={18} /> ADD MAIN CATEGORY
          </button>
          <button
            onClick={() => setIsSubCatModalOpen(true)}
            className="px-6 py-3.5 border-2 border-zinc-950 text-zinc-950 text-xs font-black tracking-widest uppercase rounded hover:bg-zinc-950 hover:text-white transition-colors flex items-center gap-2 shadow-md"
          >
            <Plus size={18} /> ADD SUB-CATEGORY
          </button>
        </div>
      </div>

      {/* CATEGORIES LIST */}
      <div className="border border-zinc-200 rounded overflow-hidden shadow-sm bg-white p-6 space-y-6">
        <h2 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase border-b border-zinc-100 pb-3 flex items-center gap-2">
          <span>≡</span> CATEGORIES LIST ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
            No categories recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="border border-zinc-200 rounded p-4 space-y-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={cat.imageUrl || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'} 
                      alt={cat.name} 
                      className="w-12 h-12 object-cover rounded border border-zinc-200"
                    />
                    <div>
                      <span className="font-extrabold text-base text-zinc-950 uppercase block">{cat.name}</span>
                      <span className="text-xs font-bold text-zinc-500 uppercase">
                        DEPARTMENT: {cat.department.toUpperCase()} • Order: {cat.displayOrder}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenAddSubCat(cat.id)}
                      className="px-3 py-1.5 border border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white text-xs font-bold rounded uppercase transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} /> ADD SUB-CAT
                    </button>
                    <span className="px-3 py-1 bg-zinc-200 text-zinc-900 text-xs font-bold rounded uppercase">
                      🛍 {DataService.getProducts().filter(p => p.category === cat.name).length} products
                    </span>
                    <button onClick={() => handleMoveOrder(cat.id, 'up')} className="p-2 border border-zinc-200 rounded text-zinc-600 hover:text-zinc-950 bg-white">
                      <ArrowUp size={14} />
                    </button>
                    <button onClick={() => handleMoveOrder(cat.id, 'down')} className="p-2 border border-zinc-200 rounded text-zinc-600 hover:text-zinc-950 bg-white">
                      <ArrowDown size={14} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 border border-red-100 rounded text-red-600 hover:text-red-800 bg-white">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* SUB-CATEGORIES SECTION WITH CUSTOM IMAGES */}
                {cat.subCategories && cat.subCategories.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-200 pl-2 sm:pl-6 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                        SUB-CATEGORIES ({cat.subCategories.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {cat.subCategories.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between gap-3 p-2.5 bg-white border border-zinc-200 rounded hover:border-zinc-300 transition-colors shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={sub.imageUrl || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800'} 
                              alt={sub.name}
                              className="w-11 h-11 object-cover rounded border border-zinc-200 shrink-0 bg-zinc-100"
                            />
                            <div className="truncate">
                              <span className="font-black text-xs text-zinc-950 uppercase block truncate">{sub.name}</span>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                {sub.department.toUpperCase()} • {DataService.getProducts().filter(p => isProductMatchingCategory(p.category, sub.name)).length} prods
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditSubCat(cat, sub)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded"
                              title="Edit Sub-Category"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubCategory(cat.id, sub.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete Sub-Category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* POPUP MODAL: ADD MAIN CATEGORY MATCHING SCREENSHOT 100% */}
      {isCatModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsCatModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-8 sm:p-10 max-w-xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-none">
            
            <button onClick={() => setIsCatModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2">
              <X size={20} />
            </button>

            <h2 className="font-serif text-3xl font-black tracking-[0.25em] text-zinc-950 uppercase text-center">
              ADD MAIN CATEGORY
            </h2>

            <form onSubmit={handleSaveCategory} className="space-y-5 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Department *</label>
                <select 
                  value={catDepartment} 
                  onChange={e => setCatDepartment(e.target.value as any)}
                  className="w-full p-3.5 border border-zinc-300 rounded-none bg-white font-bold text-zinc-950 focus:border-zinc-950 outline-none uppercase"
                >
                  <option value="women">WOMEN (نسائي)</option>
                  <option value="men">MEN (رجالي)</option>
                  <option value="all">BOTH / ALL DEPARTMENTS (مشترك)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Category Name *</label>
                <input 
                  type="text" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  placeholder="e.g. Jeans, Handbags, Dresses" 
                  required 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">Category Image (Upload File or Image URL) *</label>
                
                <div className="p-3 border border-zinc-300 rounded-none bg-white flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => handleFileUpload(e, setCatImage)}
                    className="text-xs text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-zinc-950 hover:file:bg-zinc-300 cursor-pointer"
                  />
                </div>

                <input 
                  type="text" 
                  value={catImage} 
                  onChange={e => setCatImage(e.target.value)} 
                  placeholder="Or paste Image URL..." 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-black hover:bg-zinc-900 text-white text-xs font-black tracking-[0.25em] uppercase transition-colors rounded-none shadow-md mt-6"
              >
                SAVE MAIN CATEGORY
              </button>

            </form>

          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD SUB-CATEGORY MATCHING SCREENSHOT 100% */}
      {isSubCatModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) { setIsSubCatModalOpen(false); setEditingSubCat(null); } }}
          className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-8 sm:p-10 max-w-xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-none">
            
            <button onClick={() => { setIsSubCatModalOpen(false); setEditingSubCat(null); }} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2">
              <X size={20} />
            </button>

            <h2 className="font-serif text-3xl font-black tracking-[0.25em] text-zinc-950 uppercase text-center">
              {editingSubCat ? 'EDIT SUB-CATEGORY' : 'ADD SUB-CATEGORY'}
            </h2>

            <form onSubmit={handleSaveSubCategory} className="space-y-5 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Department *</label>
                <select 
                  value={subDepartment} 
                  onChange={e => setSubDepartment(e.target.value as Department)}
                  className="w-full p-3.5 border border-zinc-900 rounded-none text-sm font-semibold text-zinc-950 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 uppercase"
                >
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Parent Category *</label>
                <select 
                  value={parentCatId} 
                  onChange={e => setParentCatId(e.target.value)}
                  className="w-full p-3.5 border border-zinc-900 rounded-none text-sm font-semibold text-zinc-950 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 uppercase"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Sub-Category Name *</label>
                <input 
                  type="text" 
                  value={subName} 
                  onChange={e => setSubName(e.target.value)} 
                  placeholder="e.g. Skinny Jeans, Tote Bags" 
                  required 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* SUB-CATEGORY IMAGE (FILE UPLOAD OR URL) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  Sub-Category Image (Upload File or Image URL) *
                </label>
                
                <div className="p-3 border border-zinc-300 rounded-none bg-white flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => handleFileUpload(e, setSubImage)}
                    className="text-xs text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-zinc-950 hover:file:bg-zinc-300 cursor-pointer"
                  />
                </div>

                <input 
                  type="text" 
                  value={subImage} 
                  onChange={e => setSubImage(e.target.value)} 
                  placeholder="Or paste Sub-Category Image URL..." 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />

                {subImage && (
                  <div className="flex items-center gap-3 p-2 bg-zinc-50 border border-zinc-200">
                    <img src={subImage} alt="Preview" className="w-14 h-14 object-cover border border-zinc-300 rounded" />
                    <span className="text-xs font-bold text-zinc-600">Sub-Category Image Loaded</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-black hover:bg-zinc-900 text-white text-xs font-black tracking-[0.25em] uppercase transition-colors rounded-none shadow-md mt-6"
              >
                {editingSubCat ? 'UPDATE SUB-CATEGORY' : 'SAVE SUB-CATEGORY'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
