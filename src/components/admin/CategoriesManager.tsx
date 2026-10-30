'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/store';
import { Category, Department } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { 
  Plus, Edit2, Trash2, X, ArrowUp, ArrowDown, ExternalLink, 
  Upload, Sparkles, Check, ChevronRight, Layers, Tag, Image as ImageIcon
} from 'lucide-react';

function getSuggestedCategoryHeroImage(name: string, dept: string): string {
  const n = name.toLowerCase();
  if (n.includes('jean') || n.includes('denim')) {
    return 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('bag') || n.includes('tote') || n.includes('clutch')) {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('boot') || n.includes('heel') || n.includes('loafer')) {
    return 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('dress') || n.includes('gown')) {
    return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('jacket') || n.includes('coat') || n.includes('blazer')) {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('hoodie') || n.includes('sweater') || n.includes('knit') || n.includes('sweatshirt')) {
    return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('accessori') || n.includes('belt') || n.includes('sunglass') || n.includes('wallet')) {
    return 'https://images.unsplash.com/photo-1624222247344-550fa60583dc?w=800&auto=format&fit=crop&q=80';
  }
  if (dept === 'women') {
    return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80';
}

const LUXURY_SUGGESTIONS: Record<'women' | 'men', { title: string; defaultSubs: string[] }[]> = {
  women: [
    { title: 'Ready To Wear', defaultSubs: ['Jeans', 'Dresses', 'Jackets & Coats', 'Tops & Shirts', 'Knitwear & Sweaters', 'Skirts', 'Pants'] },
    { title: 'Bags', defaultSubs: ['Tote Bags', 'Shoulder Bags', 'Crossbody Bags', 'Clutches & Mini Bags', 'Backpacks'] },
    { title: 'Shoes', defaultSubs: ['Heels & Pumps', 'Sneakers', 'Boots', 'Loafers & Flats', 'Sandals'] },
    { title: 'Accessories', defaultSubs: ['Belts', 'Sunglasses', 'Wallets', 'Scarves & Silk', 'Jewelry'] },
  ],
  men: [
    { title: 'Ready To Wear', defaultSubs: ['Jeans', 'Jackets & Coats', 'Hoodies & Sweatshirts', 'T-Shirts & Polos', 'Shirts', 'Sweaters', 'Trousers'] },
    { title: 'Bags', defaultSubs: ['Backpacks', 'Crossbody Bags', 'Briefcases', 'Travel & Duffle Bags'] },
    { title: 'Shoes', defaultSubs: ['Sneakers', 'Loafers', 'Boots', 'Dress Shoes'] },
    { title: 'Accessories', defaultSubs: ['Belts', 'Sunglasses', 'Wallets & Cardholders', 'Hats & Caps'] },
  ]
};

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterDept, setFilterDept] = useState<'all' | 'women' | 'men'>('women');

  // Quick Top Adder Bar State
  const [quickDept, setQuickDept] = useState<Department>('women');
  const [quickName, setQuickName] = useState('');
  const [quickSubs, setQuickSubs] = useState('');
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  // Per-category inline subcategory input
  const [inlineSubInputs, setInlineSubInputs] = useState<Record<string, string>>({});

  // Full Modals (for detailed editing)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDepartment, setCatDepartment] = useState<Department>('women');
  const [catImage, setCatImage] = useState('');
  const [catOrder, setCatOrder] = useState<number>(1);

  // Sub Category Edit Modal
  const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
  const [editingSubCat, setEditingSubCat] = useState<Category | null>(null);
  const [subName, setSubName] = useState('');
  const [subImage, setSubImage] = useState('');
  const [parentCatId, setParentCatId] = useState('');
  const [subDepartment, setSubDepartment] = useState<Department>('women');

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
          setEditingCat(null);
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
  };

  const showFeedback = (msg: string) => {
    setQuickFeedback(msg);
    setTimeout(() => setQuickFeedback(null), 3000);
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

  // 1. FAST TOP CREATE: Creates Main Category + optional comma-separated subcategories in 1-Click
  const handleQuickCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickName.trim()) return;

    const trimmedName = quickName.trim();
    const targetDept = quickDept;

    // Check if category already exists in this department
    const existing = categories.find(
      c => c.name.toLowerCase() === trimmedName.toLowerCase() && (c.department === targetDept || c.department === 'all')
    );

    let parentCat: Category;

    if (existing) {
      parentCat = existing;
    } else {
      parentCat = {
        id: `cat-${Date.now()}`,
        name: trimmedName,
        slug: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        department: targetDept,
        imageUrl: getSuggestedCategoryHeroImage(trimmedName, targetDept),
        isFeatured: true,
        displayOrder: categories.length + 1,
        subCategories: []
      };
    }

    // Add subcategories if provided
    let subsToAdd: Category[] = [...(parentCat.subCategories || [])];
    if (quickSubs.trim()) {
      const subNames = quickSubs.split(/[,،]+/).map(s => s.trim()).filter(Boolean);
      subNames.forEach((sName, idx) => {
        const alreadySub = subsToAdd.some(sub => sub.name.toLowerCase() === sName.toLowerCase());
        if (!alreadySub) {
          subsToAdd.push({
            id: `subcat-${Date.now()}-${idx}`,
            name: sName,
            slug: sName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            department: targetDept,
            imageUrl: getSuggestedCategoryHeroImage(sName, targetDept),
            isFeatured: false,
            displayOrder: subsToAdd.length + 1
          });
        }
      });
    }

    const updatedParent = {
      ...parentCat,
      subCategories: subsToAdd
    };

    const updated = DataService.saveCategory(updatedParent);
    setCategories(updated);
    setQuickName('');
    setQuickSubs('');
    showFeedback(`Created "${trimmedName}" with ${subsToAdd.length} subcategories!`);
  };

  // 2. QUICK PRESET PILL CLICK
  const handleApplyPreset = (preset: { title: string; defaultSubs: string[] }, dept: Department) => {
    const existing = categories.find(
      c => c.name.toLowerCase() === preset.title.toLowerCase() && (c.department === dept || c.department === 'all')
    );

    let parentCat: Category = existing || {
      id: `cat-${Date.now()}`,
      name: preset.title,
      slug: preset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      department: dept,
      imageUrl: getSuggestedCategoryHeroImage(preset.title, dept),
      isFeatured: true,
      displayOrder: categories.length + 1,
      subCategories: []
    };

    const subsToAdd: Category[] = [...(parentCat.subCategories || [])];
    preset.defaultSubs.forEach((sName, idx) => {
      const alreadySub = subsToAdd.some(sub => sub.name.toLowerCase() === sName.toLowerCase());
      if (!alreadySub) {
        subsToAdd.push({
          id: `subcat-${Date.now()}-${idx}`,
          name: sName,
          slug: sName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          department: dept,
          imageUrl: getSuggestedCategoryHeroImage(sName, dept),
          isFeatured: false,
          displayOrder: subsToAdd.length + 1
        });
      }
    });

    const updatedParent = {
      ...parentCat,
      subCategories: subsToAdd
    };

    const updated = DataService.saveCategory(updatedParent);
    setCategories(updated);
    showFeedback(`Added preset "${preset.title}" (${subsToAdd.length} subcategories)`);
  };

  // 3. INLINE QUICK ADD SUBCATEGORY (inside category card)
  const handleInlineAddSubCategory = (parentCatId: string) => {
    const rawVal = inlineSubInputs[parentCatId];
    if (!rawVal || !rawVal.trim()) return;

    const parent = categories.find(c => c.id === parentCatId);
    if (!parent) return;

    const subNames = rawVal.split(/[,،]+/).map(s => s.trim()).filter(Boolean);
    const existingSubs = parent.subCategories || [];
    const updatedSubs = [...existingSubs];

    subNames.forEach((sName, idx) => {
      if (!updatedSubs.some(s => s.name.toLowerCase() === sName.toLowerCase())) {
        updatedSubs.push({
          id: `subcat-${Date.now()}-${idx}`,
          name: sName,
          slug: sName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          department: parent.department || 'women',
          imageUrl: getSuggestedCategoryHeroImage(sName, parent.department || 'women'),
          isFeatured: false,
          displayOrder: updatedSubs.length + 1
        });
      }
    });

    const updatedParent: Category = {
      ...parent,
      subCategories: updatedSubs
    };

    const updated = DataService.saveCategory(updatedParent);
    setCategories(updated);
    setInlineSubInputs(prev => ({ ...prev, [parentCatId]: '' }));
    showFeedback(`Added ${subNames.join(', ')} to ${parent.name}!`);
  };

  // 4. OPEN EDIT MAIN CATEGORY MODAL
  const handleOpenEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDepartment(cat.department || 'women');
    setCatImage(cat.imageUrl || '');
    setCatOrder(cat.displayOrder || 1);
    setIsCatModalOpen(true);
  };

  const handleSaveCategoryModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    let target: Category;
    if (editingCat) {
      target = {
        ...editingCat,
        name: catName.trim(),
        slug: catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        department: catDepartment,
        imageUrl: catImage.trim() || editingCat.imageUrl || getSuggestedCategoryHeroImage(catName, catDepartment),
        displayOrder: Number(catOrder)
      };
    } else {
      target = {
        id: `cat-${Date.now()}`,
        name: catName.trim(),
        slug: catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        department: catDepartment,
        imageUrl: catImage.trim() || getSuggestedCategoryHeroImage(catName, catDepartment),
        isFeatured: true,
        displayOrder: Number(catOrder),
        subCategories: []
      };
    }

    const updated = DataService.saveCategory(target);
    setCategories(updated);
    setIsCatModalOpen(false);
    setEditingCat(null);
    setCatName('');
    setCatImage('');
    showFeedback(`Saved category "${target.name}"!`);
  };

  // 5. OPEN EDIT SUB-CATEGORY MODAL
  const handleOpenEditSubCat = (parent: Category, sub: Category) => {
    setEditingSubCat(sub);
    setParentCatId(parent.id);
    setSubDepartment(sub.department || parent.department || 'women');
    setSubName(sub.name);
    setSubImage(sub.imageUrl || '');
    setIsSubCatModalOpen(true);
  };

  const handleSaveSubCategoryModal = (e: React.FormEvent) => {
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
            imageUrl: subImage.trim() || s.imageUrl || getSuggestedCategoryHeroImage(subName, subDepartment)
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
        imageUrl: subImage.trim() || getSuggestedCategoryHeroImage(subName, subDepartment),
        isFeatured: false,
        displayOrder: existingSub.length + 1
      };
      updatedSub = [...existingSub, newSub];
    }

    const updatedParent: Category = {
      ...parent,
      subCategories: updatedSub
    };

    const updated = DataService.saveCategory(updatedParent);
    setCategories(updated);
    setIsSubCatModalOpen(false);
    setEditingSubCat(null);
    setSubName('');
    setSubImage('');
    showFeedback(`Saved subcategory "${subName}"!`);
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
    showFeedback('Subcategory removed');
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category and all its subcategories?')) {
      const updated = DataService.deleteCategory(id);
      setCategories(updated);
      showFeedback('Category deleted');
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

  const currentDeptPresetList = LUXURY_SUGGESTIONS[filterDept === 'men' ? 'men' : 'women'];
  const filteredCategories = categories.filter(c => filterDept === 'all' || c.department === filterDept);

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* 1. TOP HEADER & QUICK FEEDBACK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
            MANAGE CATEGORIES
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1">
            Easily create main categories and subcategories for Women and Men boutique departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin?tab=home_cards"
            className="inline-flex items-center gap-1.5 px-4 py-3 border border-zinc-300 hover:border-zinc-950 text-zinc-800 text-xs font-black uppercase rounded tracking-wider transition-colors shadow-xs"
          >
            <span>HOMEPAGE CARDS</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {quickFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{quickFeedback}</span>
        </div>
      )}

      {/* 2. ULTRA-FAST ONE-CLICK CREATOR BAR (NO MODALS REQUIRED!) */}
      <div className="p-6 bg-gradient-to-br from-zinc-950 to-zinc-900 text-white rounded-2xl shadow-xl space-y-5 border border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-black">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest uppercase text-white">
                INSTANT CATEGORY CREATOR
              </h2>
              <span className="text-[11px] text-zinc-400 font-medium">
                Create a main category and all its subcategories in 1 step!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-zinc-850 p-1 rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => setQuickDept('women')}
              className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-colors ${
                quickDept === 'women' ? 'bg-rose-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              ♀ Women
            </button>
            <button
              type="button"
              onClick={() => setQuickDept('men')}
              className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-colors ${
                quickDept === 'men' ? 'bg-sky-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              ♂ Men
            </button>
            <button
              type="button"
              onClick={() => setQuickDept('all')}
              className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-colors ${
                quickDept === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Both
            </button>
          </div>
        </div>

        {/* INPUTS ROW */}
        <form onSubmit={handleQuickCreateCategory} className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-4 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              1. Main Category Name *
            </label>
            <input
              type="text"
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              placeholder="e.g. Ready To Wear, Bags, Shoes"
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-bold text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="md:col-span-6 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              2. Subcategories (Optional - comma separated)
            </label>
            <input
              type="text"
              value={quickSubs}
              onChange={e => setQuickSubs(e.target.value)}
              placeholder="e.g. Jeans, Jackets, Dresses, Sweaters"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-bold text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black tracking-widest uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} />
              <span>CREATE</span>
            </button>
          </div>
        </form>

        {/* 1-CLICK POPULAR LUXURY PRESETS */}
        <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-400/90 flex items-center gap-1">
            <Sparkles size={12} />
            QUICK PRESETS:
          </span>
          {currentDeptPresetList.map(p => (
            <button
              key={p.title}
              type="button"
              onClick={() => handleApplyPreset(p, filterDept === 'men' ? 'men' : 'women')}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-bold rounded-lg border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>+ {p.title}</span>
              <span className="text-[9px] text-zinc-400">({p.defaultSubs.length} subs)</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. DEPARTMENT TABS (WOMEN / MEN / ALL) */}
      <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterDept('women');
              setQuickDept('women');
            }}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterDept === 'women'
                ? 'bg-rose-950 text-white shadow-md'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <span>♀ FOR HER (WOMEN)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
              {categories.filter(c => c.department === 'women').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterDept('men');
              setQuickDept('men');
            }}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterDept === 'men'
                ? 'bg-sky-950 text-white shadow-md'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <span>♂ FOR HIM (MEN)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
              {categories.filter(c => c.department === 'men').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterDept('all')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              filterDept === 'all'
                ? 'bg-zinc-950 text-white shadow-md'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <span>ALL DEPARTMENTS</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
              {categories.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            setEditingCat(null);
            setCatName('');
            setCatImage('');
            setCatDepartment(filterDept === 'all' ? 'women' : filterDept);
            setIsCatModalOpen(true);
          }}
          className="px-4 py-2 border border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>CUSTOM CATEGORY WITH IMAGE</span>
        </button>
      </div>

      {/* 4. CATEGORIES LIST WITH INLINE SUBCATEGORY ADDER */}
      <div className="space-y-5">
        {filteredCategories.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 space-y-3">
            <Layers className="mx-auto text-zinc-300" size={40} />
            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">
              No categories created for {filterDept.toUpperCase()} yet.
            </p>
            <p className="text-xs text-zinc-400">
              Use the Instant Category Creator above or click a quick preset to add categories in 1 second!
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const subCount = (cat.subCategories || []).length;
            const prodsInCat = DataService.getProducts().filter(
              p => (p.department === cat.department || p.department === 'all') && (p.category === cat.name || p.category?.startsWith(`${cat.name} >`))
            ).length;

            return (
              <div 
                key={cat.id} 
                className="border-2 border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 bg-white shadow-sm space-y-4 transition-all"
              >
                {/* Main Category Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={cat.imageUrl || getSuggestedCategoryHeroImage(cat.name, cat.department || 'women')} 
                      alt={cat.name} 
                      className="w-14 h-14 object-cover rounded-xl border border-zinc-200 bg-zinc-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg sm:text-xl font-black text-zinc-950 uppercase tracking-wide">
                          {cat.name}
                        </h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          cat.department === 'women' ? 'bg-rose-100 text-rose-800' : cat.department === 'men' ? 'bg-sky-100 text-sky-800' : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {cat.department === 'women' ? '♀ FOR HER' : cat.department === 'men' ? '♂ FOR HIM' : 'BOTH'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1 text-xs font-bold text-zinc-500">
                        <span>{subCount} Subcategories</span>
                        <span>•</span>
                        <span>{prodsInCat} Products</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Main Category */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button 
                      onClick={() => handleOpenEditCat(cat)}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit Category Name & Image"
                    >
                      <Edit2 size={13} />
                      <span>EDIT</span>
                    </button>
                    <button 
                      onClick={() => handleMoveOrder(cat.id, 'up')}
                      className="p-2 border border-zinc-200 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 bg-white cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleMoveOrder(cat.id, 'down')}
                      className="p-2 border border-zinc-200 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 bg-white cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 border border-red-200 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 bg-white cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Pills List */}
                {cat.subCategories && cat.subCategories.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {cat.subCategories.map(sub => (
                        <div 
                          key={sub.id} 
                          className="group flex items-center gap-2 pl-2 pr-1.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-all shadow-2xs"
                        >
                          <img 
                            src={sub.imageUrl || getSuggestedCategoryHeroImage(sub.name, sub.department || cat.department)} 
                            alt={sub.name}
                            className="w-6 h-6 rounded-md object-cover border border-zinc-200 bg-white shrink-0"
                          />
                          <span className="text-xs font-black uppercase text-zinc-900 tracking-wide">
                            {sub.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubCat(cat, sub)}
                            className="p-1 text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer"
                            title="Edit Subcategory Image/Name"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubCategory(cat.id, sub.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Subcategory"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAST INLINE SUBCATEGORY ADDER ROW */}
                <div className="pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={`+ Add subcategory to ${cat.name} (e.g. Jeans, or comma-separated: Jeans, Jackets)`}
                        value={inlineSubInputs[cat.id] || ''}
                        onChange={e => setInlineSubInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleInlineAddSubCategory(cat.id);
                          }
                        }}
                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-950 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInlineAddSubCategory(cat.id)}
                      className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus size={14} strokeWidth={3} />
                      <span>ADD SUB</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 5. EDIT MAIN CATEGORY MODAL */}
      {isCatModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsCatModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-7 sm:p-9 max-w-lg w-full space-y-6 relative shadow-2xl rounded-2xl animate-in fade-in">
            <button 
              onClick={() => setIsCatModalOpen(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="font-serif text-2xl font-black tracking-wider text-zinc-950 uppercase text-center">
              {editingCat ? 'EDIT MAIN CATEGORY' : 'NEW MAIN CATEGORY'}
            </h2>

            <form onSubmit={handleSaveCategoryModal} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Department *</label>
                <select 
                  value={catDepartment} 
                  onChange={e => setCatDepartment(e.target.value as any)}
                  className="w-full p-3.5 border border-zinc-300 rounded-xl bg-white font-bold text-zinc-950 focus:border-zinc-950 outline-none uppercase"
                >
                  <option value="women">WOMEN (FOR HER)</option>
                  <option value="men">MEN (FOR HIM)</option>
                  <option value="all">BOTH / ALL DEPARTMENTS</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Category Name *</label>
                <input 
                  type="text" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  placeholder="e.g. Ready To Wear, Handbags, Dresses" 
                  required 
                  className="w-full p-3.5 border border-zinc-300 rounded-xl text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  Category Image (Upload or Paste URL)
                </label>
                
                <div className="p-3 border border-zinc-300 rounded-xl bg-zinc-50 flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => handleFileUpload(e, setCatImage)}
                    className="text-xs text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-zinc-950 hover:file:bg-zinc-300 cursor-pointer"
                  />
                </div>

                <input 
                  type="text" 
                  value={catImage} 
                  onChange={e => setCatImage(e.target.value)} 
                  placeholder="Leave empty to use automatic luxury photo..." 
                  className="w-full p-3.5 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />

                {catImage && (
                  <div className="flex items-center gap-3 p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <img src={catImage} alt="Preview" className="w-14 h-14 object-cover border border-zinc-300 rounded" />
                    <span className="text-xs font-bold text-zinc-600">Image Loaded</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-black tracking-widest uppercase transition-all rounded-xl shadow-md mt-4 cursor-pointer"
              >
                SAVE CATEGORY
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT SUB-CATEGORY MODAL */}
      {isSubCatModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) { setIsSubCatModalOpen(false); setEditingSubCat(null); } }}
          className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-7 sm:p-9 max-w-lg w-full space-y-6 relative shadow-2xl rounded-2xl animate-in fade-in">
            <button 
              onClick={() => { setIsSubCatModalOpen(false); setEditingSubCat(null); }} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="font-serif text-2xl font-black tracking-wider text-zinc-950 uppercase text-center">
              {editingSubCat ? 'EDIT SUB-CATEGORY' : 'NEW SUB-CATEGORY'}
            </h2>

            <form onSubmit={handleSaveSubCategoryModal} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Sub-Category Name *</label>
                <input 
                  type="text" 
                  value={subName} 
                  onChange={e => setSubName(e.target.value)} 
                  placeholder="e.g. Skinny Jeans, Tote Bags" 
                  required 
                  className="w-full p-3.5 border border-zinc-300 rounded-xl text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  Sub-Category Image (Optional)
                </label>
                
                <div className="p-3 border border-zinc-300 rounded-xl bg-zinc-50 flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => handleFileUpload(e, setSubImage)}
                    className="text-xs text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-zinc-950 hover:file:bg-zinc-300 cursor-pointer"
                  />
                </div>

                <input 
                  type="text" 
                  value={subImage} 
                  onChange={e => setSubImage(e.target.value)} 
                  placeholder="Leave empty for automatic luxury photo..." 
                  className="w-full p-3.5 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />

                {subImage && (
                  <div className="flex items-center gap-3 p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <img src={subImage} alt="Preview" className="w-14 h-14 object-cover border border-zinc-300 rounded" />
                    <span className="text-xs font-bold text-zinc-600">Sub-Category Image Loaded</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-black tracking-widest uppercase transition-all rounded-xl shadow-md mt-4 cursor-pointer"
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
