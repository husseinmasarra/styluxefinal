'use client';

import React, { useState, useEffect } from 'react';
import { DataService, isProductMatchingCategory } from '@/lib/store';
import { Product, Brand, Category } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { useCart } from '@/lib/CartContext';
import { Plus, Search, Edit2, Trash2, X, Package, ScanBarcode, Palette, Upload, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

const DEFAULT_COLOR_HEXES: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  charcoal: '#36454F',
  grey: '#808080',
  gray: '#808080',
  red: '#DC2626',
  blue: '#2563EB',
  navy: '#000080',
  green: '#16A34A',
  beige: '#F5F5DC',
  gold: '#D4AF37',
  silver: '#C0C0C0',
  brown: '#8B4513',
  pink: '#EC4899',
  yellow: '#EAB308',
  purple: '#9333EA',
  orange: '#F97316'
};

export function ProductsManager() {
  const { currency, settings } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<'summer' | 'winter' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Brand Modal State
  const [isQuickBrandModalOpen, setIsQuickBrandModalOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState('');
  const [quickBrandLogo, setQuickBrandLogo] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    barcode: '',
    priority: 1000,
    department: 'women' as 'women' | 'men' | 'all',
    category: '',
    brandId: '',
    brandName: '',
    season: 'All Seasons',
    price: 90,
    salePrice: 0,
    costPrice: 45,
    sizesInput: 'S, M, L, XL',
    colorsInput: 'Black, Charcoal, Grey',
    colorHexes: {
      Black: '#000000',
      Charcoal: '#36454F',
      Grey: '#808080'
    } as Record<string, string>,
    sizeQuantities: {
      S: 10,
      M: 15,
      L: 8,
      XL: 4
    } as Record<string, number>,
    sizesStock: {} as Record<string, Record<string, number>>,
    colorImages: {
      Black: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
      Charcoal: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800',
      Grey: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800'
    } as Record<string, string>,
    videoUrl: '',
    description: 'Garment details...',
    isFeatured: true,
    isPreOrder: false,
    preOrderNote: 'Dispatches in 14-21 Business Days'
  });

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  // Keyboard shortcut listener: ESC to close popup modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isQuickBrandModalOpen) {
          setIsQuickBrandModalOpen(false);
        } else if (isModalOpen) {
          setIsModalOpen(false);
        }
      }
    };
    if (isModalOpen || isQuickBrandModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isQuickBrandModalOpen]);

  const loadData = () => {
    const loadedProds = DataService.getProducts();
    const loadedBrands = DataService.getBrands();
    const loadedCats = DataService.getCategories();
    setProducts(loadedProds);
    setBrands(loadedBrands);
    setCategories(loadedCats);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.84 })
        .then(compressedUrl => {
          callback(compressedUrl);
        })
        .catch(err => {
          console.error('Compression failed, falling back:', err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              callback(reader.result);
            }
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const handleSaveQuickBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBrandName.trim()) return;

    const brandToSave: Brand = {
      id: `brand-${Date.now()}`,
      name: quickBrandName.trim().toUpperCase(),
      slug: quickBrandName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoUrl: quickBrandLogo.trim() || '',
      isFeatured: true
    };

    const updatedBrands = DataService.saveBrand(brandToSave);
    setBrands(updatedBrands);
    setFormData(prev => ({
      ...prev,
      brandId: brandToSave.id,
      brandName: brandToSave.name
    }));

    setQuickBrandName('');
    setQuickBrandLogo('');
    setIsQuickBrandModalOpen(false);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const availableCats = categories.filter(c => c.department === 'women' || c.department === 'all');
    const firstCat = availableCats[0]?.name || categories[0]?.name || '';
    setFormData({
      title: '',
      barcode: '',
      priority: 1000,
      department: 'women',
      category: firstCat,
      brandId: brands[0]?.id || '',
      brandName: brands[0]?.name || '',
      season: 'All Seasons',
      price: 90,
      salePrice: 0,
      costPrice: 45,
      sizesInput: 'S, M, L, XL',
      sizeQuantities: { S: 10, M: 10, L: 10, XL: 10 },
      colorsInput: 'Black, Charcoal, Grey',
      colorHexes: {
        Black: '#000000',
        Charcoal: '#36454F',
        Grey: '#808080'
      },
      sizesStock: {},
      colorImages: {
        Black: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        Charcoal: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800',
        Grey: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800'
      },
      videoUrl: '',
      description: 'Garment details...',
      isFeatured: true,
      isPreOrder: false,
      preOrderNote: 'Dispatches in 14-21 Business Days'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    const parsedSizes = Object.keys(prod.stockPerSize).join(', ') || 'S, M, L, XL';
    const parsedColors = prod.colors.join(', ') || 'Black';

    const hexes: Record<string, string> = { ...(prod.colorHexes || {}) };
    prod.colors.forEach(col => {
      if (!hexes[col]) {
        hexes[col] = DEFAULT_COLOR_HEXES[col.toLowerCase()] || '#000000';
      }
    });

    const sizeQuantitiesMap: Record<string, number> = { ...prod.stockPerSize };

    setFormData({
      title: prod.title,
      barcode: prod.sku || '',
      priority: 1000,
      department: ((prod.department as string) === 'kids' ? 'women' : (prod.department || 'women')) as 'women' | 'men' | 'all',
      category: prod.category,
      brandId: prod.brandId,
      brandName: prod.brandName || 'PRADA',
      season: 'All Seasons',
      price: prod.price,
      salePrice: prod.salePrice || 0,
      costPrice: 45,
      sizesInput: parsedSizes,
      sizeQuantities: sizeQuantitiesMap,
      colorsInput: parsedColors,
      colorHexes: hexes,
      sizesStock: {},
      colorImages: prod.colorImages || {
        Black: prod.images[0] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'
      },
      videoUrl: '',
      description: prod.description || 'Garment details...',
      isFeatured: prod.isFeatured,
      isPreOrder: prod.isPreOrder || false,
      preOrderNote: prod.preOrderNote || 'Dispatches in 14-21 Business Days'
    });
    setIsModalOpen(true);
  };

  const handleDepartmentChangeInForm = (dept: 'women' | 'men' | 'all') => {
    const availableCats = categories.filter(c => dept === 'all' || c.department === dept || c.department === 'all');
    const firstCat = availableCats[0]?.name || categories[0]?.name || '';
    setFormData(prev => ({
      ...prev,
      department: dept,
      category: prev.category || firstCat
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let finalBrandId = formData.brandId;
    let finalBrandName = (formData.brandName || '').trim();

    if (finalBrandId && !finalBrandName) {
      const b = brands.find(brand => brand.id === finalBrandId);
      if (b) finalBrandName = b.name;
    } else if (!finalBrandId && finalBrandName) {
      const b = brands.find(brand => brand.name.toLowerCase() === finalBrandName.toLowerCase());
      if (b) {
        finalBrandId = b.id;
        finalBrandName = b.name;
      } else {
        const newBrand: Brand = {
          id: `brand-${Date.now()}`,
          name: finalBrandName.toUpperCase(),
          slug: finalBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          logoUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
          isFeatured: true
        };
        const updatedBrands = DataService.saveBrand(newBrand);
        setBrands(updatedBrands);
        finalBrandId = newBrand.id;
      }
    } else if (finalBrandId && finalBrandName) {
      // Validate that brandName matches brandId
      const b = brands.find(brand => brand.id === finalBrandId);
      if (b && b.name.toLowerCase() !== finalBrandName.toLowerCase()) {
        finalBrandName = b.name;
      }
    }

    const colorsList = formData.colorsInput.split(',').map(c => c.trim()).filter(Boolean);
    const sizesList = formData.sizesInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    const colorHexesMap: Record<string, string> = {};
    colorsList.forEach(col => {
      colorHexesMap[col] = formData.colorHexes[col] || DEFAULT_COLOR_HEXES[col.toLowerCase()] || '#000000';
    });

    const stockPerSize: Record<string, number> = {};
    sizesList.forEach(sz => {
      const qty = formData.sizeQuantities[sz] !== undefined ? Number(formData.sizeQuantities[sz]) : (formData.sizeQuantities[sz.toLowerCase()] !== undefined ? Number(formData.sizeQuantities[sz.toLowerCase()]) : 10);
      stockPerSize[sz] = Math.max(0, qty);
    });

    const totalStock = Object.values(stockPerSize).reduce((acc, curr) => acc + curr, 0);
    const imageList = colorsList.map(col => formData.colorImages[col] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800');

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      department: formData.department,
      category: formData.category || (categories[0]?.name || 'General'),
      brandId: finalBrandId || '',
      brandName: finalBrandName || 'PRADA',
      price: Number(formData.price),
      salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      sku: formData.barcode || `SKU-${Date.now()}`,
      stockPerSize,
      totalStock,
      colors: colorsList.length ? colorsList : ['Black'],
      colorHexes: colorHexesMap,
      colorImages: formData.colorImages,
      images: imageList.length ? imageList : ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
      description: formData.description,
      isFeatured: formData.isFeatured,
      isNewArrival: true,
      isPreOrder: formData.isPreOrder,
      preOrderNote: formData.preOrderNote,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    const updated = DataService.saveProduct(productToSave);
    setProducts(updated);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const updated = DataService.deleteProduct(id);
      setProducts(updated);
    }
  };

  const userCategoryNames = Array.from(new Set([
    ...categories.map(c => c.name),
    ...products.map(p => p.category)
  ])).filter(Boolean);

  const modalCategoryOptions = Array.from(new Set([
    ...categories
      .filter(c => formData.department === 'all' || c.department === formData.department || c.department === 'all')
      .flatMap(c => [
        c.name,
        ...(c.subCategories || []).map(sc => sc.name),
        ...(c.subCategories || []).map(sc => `${c.name} > ${sc.name}`)
      ]),
    ...products.map(p => p.category),
    ...(formData.category ? [formData.category] : [])
  ])).filter(Boolean);

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && !isProductMatchingCategory(p.category, selectedCategory)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.title.toLowerCase().includes(q);
      const matchBrand = p.brandName ? p.brandName.toLowerCase().includes(q) : false;
      const matchSKU = p.sku.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchSKU) return false;
    }
    return true;
  });

  const parsedColors = formData.colorsInput.split(',').map(c => c.trim()).filter(Boolean);
  const parsedSizes = formData.sizesInput.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* 1. TOP HEADER MATCHING SCREENSHOT (20-30% ENLARGED FONTS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        
        <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase">
          MANAGE PRODUCTS
        </h1>

        {/* Right Top Controls: Category Select + Season Switcher + Add Button */}
        <div className="flex flex-wrap items-center gap-4">
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border-2 border-zinc-300 bg-white text-xs font-black uppercase tracking-wider rounded focus:border-zinc-950 text-zinc-950"
          >
            <option value="all">ALL CATEGORIES</option>
            {userCategoryNames.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex items-center border-2 border-zinc-950 rounded p-1 bg-white">
            <button
              onClick={() => setSelectedSeason('summer')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${
                selectedSeason === 'summer' ? 'bg-amber-400 text-zinc-950 shadow-xs' : 'text-zinc-700 hover:text-zinc-950'
              }`}
            >
              <span>☀️</span> Summer
            </button>
            <button
              onClick={() => setSelectedSeason('winter')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${
                selectedSeason === 'winter' ? 'bg-sky-400 text-zinc-950 shadow-xs' : 'text-zinc-700 hover:text-zinc-950'
              }`}
            >
              <span>❄️</span> Winter
            </button>
            <button
              onClick={() => setSelectedSeason('all')}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${
                selectedSeason === 'all' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-700 hover:text-zinc-950'
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-zinc-950 text-white text-xs font-black tracking-widest uppercase hover:bg-zinc-800 transition-all rounded shadow-md flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            <span>ADD NEW PRODUCT</span>
          </button>

        </div>

      </div>

      {/* 2. PRODUCTS DATA TABLE (ENLARGED TYPOGRAPHY) */}
      <div className="border border-zinc-300 rounded overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-100/70">
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ID</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">IMAGE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">NAME</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">CATEGORY</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">PRICE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">SIZES & INVENTORY</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center space-y-3">
                  <div className="flex justify-center text-zinc-950">
                    <Package size={40} strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    NO PRODUCTS RECORDED YET.
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod, idx) => (
                <tr key={prod.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                  
                  <td className="py-4 px-6 font-extrabold text-zinc-950 text-center uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <GripVertical size={14} className="text-zinc-400" />
                      <span>#{100 + idx + 1}</span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <img 
                      src={prod.images[0]} 
                      alt={prod.title} 
                      className="w-14 h-14 object-cover rounded bg-zinc-100 mx-auto border border-zinc-200 shadow-xs"
                    />
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span className="font-extrabold text-zinc-950 uppercase block text-xs tracking-wider">
                      {prod.title}
                    </span>
                    <div className="flex items-center justify-center gap-1.5 text-zinc-400 mt-1">
                      <span className="text-[10px] font-semibold">Priority: 1000</span>
                      <button className="hover:text-zinc-950"><ArrowUp size={12} /></button>
                      <button className="hover:text-zinc-950"><ArrowDown size={12} /></button>
                    </div>
                  </td>

                  <td className="py-4 px-6 font-extrabold text-zinc-600 text-center uppercase tracking-wider text-xs">
                    <div>{prod.department.toUpperCase()} /</div>
                    <div className="text-zinc-950">{prod.category.toUpperCase()}</div>
                  </td>

                  <td className="py-4 px-6 font-extrabold text-zinc-950 text-center text-xs">
                    ${prod.price.toFixed(2)}
                  </td>

                  <td className="py-4 px-6 text-center">
                    <div className="space-y-1">
                      <div className="font-extrabold text-zinc-950 text-xs">
                        Sizes: {Object.keys(prod.stockPerSize).join(', ')}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-semibold">
                        Colors: {prod.colors.join(', ')}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {Object.entries(prod.stockPerSize).map(([s, q]) => `${s}: ${q}`).join(' | ')}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors"
                      >
                        <Edit2 size={12} /> EDIT
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
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

      {/* 3. POPUP MODAL DIALOG WITH ULTRA-CLEAR & LARGE FONTS FOR EASY WORK */}
      {isModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 sm:p-8 space-y-6 relative shadow-2xl border-2 border-zinc-950 animate-fadeIn">
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="border-b-2 border-zinc-950 pb-3">
              <h2 className="font-serif text-2xl font-black tracking-[0.2em] text-zinc-950 uppercase text-center w-full">
                {editingProduct ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
              </h2>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6 font-sans">
              
              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                  Product Name *
                </label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g. STYLUXE CROP TEE" 
                  required 
                  className="w-full p-4 border-2 border-zinc-300 rounded text-base font-extrabold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50"
                />
              </div>

              {/* Barcode Box */}
              <div className="space-y-2">
                <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                  Barcode Scanner (Optional)
                </label>
                <div className="border-2 border-zinc-950 rounded p-4 bg-white flex items-center shadow-xs">
                  <ScanBarcode size={22} className="text-zinc-800 ml-2 shrink-0" />
                  <input 
                    type="text" 
                    value={formData.barcode} 
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
                    placeholder="e.g. 123456789012 (Scan now)" 
                    className="w-full text-base font-mono font-black text-zinc-950 focus:outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Priority & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Priority *
                  </label>
                  <input 
                    type="number" 
                    value={formData.priority} 
                    onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })} 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-base font-extrabold text-zinc-950 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Department *
                  </label>
                  <select 
                    value={formData.department} 
                    onChange={e => handleDepartmentChangeInForm(e.target.value as any)} 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-sm font-black uppercase text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  >
                    <option value="women">WOMEN</option>
                    <option value="men">MEN</option>
                    <option value="all">BOTH / ALL</option>
                  </select>
                </div>
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Category *
                  </label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-sm font-black uppercase text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  >
                    <option value="">-- CHOOSE CATEGORY FROM LIST --</option>
                    {categories
                      .filter(c => formData.department === 'all' || c.department === formData.department || c.department === 'all')
                      .map(cat => (
                        <optgroup key={cat.id} label={cat.name.toUpperCase()}>
                          <option value={cat.name}>{cat.name} (Main Category)</option>
                          {(cat.subCategories || []).map(sub => (
                            <option key={sub.id} value={sub.name}>↳ {sub.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    {modalCategoryOptions.filter(c => !categories.some(cat => cat.name === c || (cat.subCategories || []).some(sub => sub.name === c))).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    placeholder="Or type custom category (e.g. Jeans or Ready to Wear)"
                    required
                    className="w-full p-3 border-2 border-zinc-300 rounded text-xs font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 bg-zinc-50"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                      Brand *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickBrandModalOpen(true)}
                      className="text-[11px] font-bold text-zinc-600 hover:text-zinc-950 uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> + NEW BRAND
                    </button>
                  </div>
                  <select 
                    value={formData.brandId} 
                    onChange={e => {
                      const selId = e.target.value;
                      const found = brands.find(b => b.id === selId);
                      setFormData(prev => ({
                        ...prev,
                        brandId: selId,
                        brandName: found ? found.name : ''
                      }));
                    }} 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-sm font-black uppercase text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  >
                    <option value="">-- SELECT BRAND ({brands.length}) --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={formData.brandName} 
                    onChange={e => {
                      const typed = e.target.value;
                      const match = brands.find(b => b.name.toLowerCase() === typed.trim().toLowerCase());
                      setFormData(prev => ({
                        ...prev,
                        brandName: typed,
                        brandId: match ? match.id : ''
                      }));
                    }} 
                    placeholder="Or type brand name (e.g. Prada, Nike)..."
                    required={!formData.brandId && !formData.brandName}
                    className="w-full p-3 border-2 border-zinc-300 rounded text-xs font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 bg-zinc-50 uppercase"
                  />
                </div>
              </div>

              {/* Season & Selling Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Season *
                  </label>
                  <select 
                    value={formData.season} 
                    onChange={e => setFormData({ ...formData, season: e.target.value })} 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-sm font-black uppercase text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  >
                    <option value="All Seasons">All Seasons</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Selling Price ($) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} 
                    placeholder="e.g. 45" 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-base font-black text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50"
                  />
                </div>
              </div>

              {/* Old Price & Cost Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Old Price / Previous Price ($) (Optional)
                  </label>
                  <input 
                    type="number" 
                    value={formData.salePrice} 
                    onChange={e => setFormData({ ...formData, salePrice: Number(e.target.value) })} 
                    placeholder="e.g. 60 (Strikethrough)" 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-base font-extrabold text-red-600 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Cost Price ($) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.costPrice} 
                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })} 
                    placeholder="e.g. 18" 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-base font-extrabold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50"
                  />
                </div>
              </div>

              {/* Sizes Input & Stock Control Grid */}
              <div className="space-y-4 border-2 border-zinc-200 rounded p-4 bg-zinc-50">
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                      <Package size={16} className="text-emerald-600" />
                      <span>Sizes (Comma-separated) & Stock Control *</span>
                    </label>
                  </div>

                  <input 
                    type="text" 
                    value={formData.sizesInput} 
                    onChange={e => setFormData({ ...formData, sizesInput: e.target.value })} 
                    placeholder="S, M, L, XL or 38, 39, 40, 41, 42" 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-base font-black text-zinc-950 uppercase placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 bg-white"
                  />

                  {/* Size Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">QUICK PRESETS:</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sizesInput: 'S, M, L, XL, XXL' }))}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-[10px] font-black uppercase rounded shadow-2xs"
                    >
                      👕 CLOTHING (S - XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sizesInput: '38, 39, 40, 41, 42, 43, 44' }))}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-[10px] font-black uppercase rounded shadow-2xs"
                    >
                      👟 SHOES (38 - 44)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sizesInput: 'ONE SIZE' }))}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-[10px] font-black uppercase rounded shadow-2xs"
                    >
                      👜 ACCESSORIES (ONE SIZE)
                    </button>
                  </div>
                </div>

                {/* Stock Adjustment per Size Box */}
                <div className="bg-white border-2 border-zinc-300 p-4 space-y-3 rounded">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-xs font-black text-zinc-950 uppercase tracking-widest flex items-center gap-1.5">
                      <span>📦 INVENTORY & QUANTITY PER SIZE</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sizes = formData.sizesInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                          const updated = { ...formData.sizeQuantities };
                          sizes.forEach(s => updated[s] = 10);
                          setFormData(prev => ({ ...prev, sizeQuantities: updated }));
                        }}
                        className="text-[10px] font-extrabold text-blue-600 hover:underline uppercase"
                      >
                        [SET ALL TO 10]
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sizes = formData.sizesInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                          const updated = { ...formData.sizeQuantities };
                          sizes.forEach(s => updated[s] = 0);
                          setFormData(prev => ({ ...prev, sizeQuantities: updated }));
                        }}
                        className="text-[10px] font-extrabold text-red-600 hover:underline uppercase"
                      >
                        [SET ALL TO 0]
                      </button>
                    </div>
                  </div>

                  {/* Size Stock Input Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {formData.sizesInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).map(size => {
                      const currentQty = formData.sizeQuantities[size] !== undefined ? formData.sizeQuantities[size] : 10;
                      return (
                        <div key={size} className="p-3 border-2 border-zinc-200 rounded bg-zinc-50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-zinc-950 text-xs uppercase">
                              SIZE {size}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${currentQty > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {currentQty > 0 ? `${currentQty} IN STOCK` : 'OUT OF STOCK'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  sizeQuantities: {
                                    ...prev.sizeQuantities,
                                    [size]: Math.max(0, currentQty - 1)
                                  }
                                }));
                              }}
                              className="w-8 h-8 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 font-black text-sm rounded flex items-center justify-center shrink-0"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min={0}
                              value={currentQty}
                              onChange={e => {
                                const val = Math.max(0, Number(e.target.value));
                                setFormData(prev => ({
                                  ...prev,
                                  sizeQuantities: {
                                    ...prev.sizeQuantities,
                                    [size]: val
                                  }
                                }));
                              }}
                              className="w-full p-1.5 text-center border border-zinc-300 rounded font-mono font-black text-sm bg-white text-zinc-950 focus:outline-none focus:border-zinc-950"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  sizeQuantities: {
                                    ...prev.sizeQuantities,
                                    [size]: currentQty + 1
                                  }
                                }));
                              }}
                              className="w-8 h-8 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 font-black text-sm rounded flex items-center justify-center shrink-0"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Colors & Shades */}
              <div className="space-y-4 border-2 border-zinc-200 rounded p-4 bg-zinc-50">
                <div className="space-y-1">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                    <Palette size={16} className="text-amber-500" />
                    <span>Colors (Comma-separated) & Color Shades *</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.colorsInput} 
                    onChange={e => setFormData({ ...formData, colorsInput: e.target.value })} 
                    placeholder="Black, Charcoal, Grey" 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-base font-black uppercase text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  {parsedColors.map(color => {
                    const currentHex = formData.colorHexes[color] || DEFAULT_COLOR_HEXES[color.toLowerCase()] || '#000000';
                    return (
                      <div key={color} className="p-3 border-2 border-zinc-200 rounded bg-white space-y-1.5 shadow-2xs">
                        <span className="font-extrabold text-zinc-950 text-xs uppercase block">
                          {color} SHADE
                        </span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={currentHex} 
                            onChange={e => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                colorHexes: { ...prev.colorHexes, [color]: val }
                              }));
                            }}
                            className="w-8 h-8 rounded cursor-pointer border border-zinc-300 p-0.5 bg-white shrink-0"
                          />
                          <input 
                            type="text" 
                            value={currentHex} 
                            onChange={e => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                colorHexes: { ...prev.colorHexes, [color]: val }
                              }));
                            }}
                            className="w-full p-2 border border-zinc-300 rounded font-mono text-xs font-black uppercase"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Images by Color WITH DIRECT COMPUTER FILE UPLOAD */}
              <div className="space-y-4 border-2 border-zinc-200 rounded p-4 bg-zinc-50">
                <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                  <Upload size={16} className="text-blue-600" />
                  <span>Product Images by Color (Upload from Computer) *</span>
                </label>

                {parsedColors.map(color => (
                  <div key={color} className="border-2 border-zinc-200 rounded p-3 bg-white space-y-2">
                    <span className="font-black text-zinc-950 text-xs uppercase block">
                      {color}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase rounded cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 shadow-sm">
                        <Upload size={14} /> CHOOSE FILE FROM COMPUTER
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleFileUpload(e, base64 => {
                            setFormData(prev => ({
                              ...prev,
                              colorImages: {
                                ...prev.colorImages,
                                [color]: base64
                              }
                            }));
                          })}
                        />
                      </label>
                      <input 
                        type="text" 
                        value={formData.colorImages[color] || ''} 
                        onChange={e => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            colorImages: {
                              ...prev.colorImages,
                              [color]: val
                            }
                          }));
                        }}
                        placeholder="Or paste image URL" 
                        className="w-full p-2.5 border border-zinc-300 text-xs font-mono rounded font-bold"
                      />
                    </div>
                    {formData.colorImages[color] && (
                      <div className="pt-1">
                        <img src={formData.colorImages[color]} alt={color} className="w-14 h-16 object-cover rounded border border-zinc-200" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                  Description *
                </label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  className="w-full p-4 border-2 border-zinc-300 rounded text-sm font-semibold text-zinc-950 resize-none focus:outline-none focus:border-zinc-950"
                />
              </div>
              <div className="border-2 border-amber-400 bg-amber-50/70 rounded-lg p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isPreOrder" 
                    checked={formData.isPreOrder} 
                    onChange={e => setFormData({ ...formData, isPreOrder: e.target.checked })} 
                    className="w-6 h-6 accent-amber-600 rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="isPreOrder" className="text-sm font-black text-amber-950 uppercase tracking-wider cursor-pointer select-none">
                    ENABLE PRE-ORDER (PRE-ORDER ITEM 🚀)
                  </label>
                </div>

                {formData.isPreOrder && (
                  <div className="space-y-2 pt-1 border-t border-amber-200">
                    <label className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                      Pre-Order Delivery Note / Estimated Shipping Time *
                    </label>
                    <input 
                      type="text" 
                      value={formData.preOrderNote} 
                      onChange={e => setFormData({ ...formData, preOrderNote: e.target.value })} 
                      placeholder="e.g. Dispatches in 14-21 Business Days" 
                      className="w-full p-3.5 border-2 border-amber-400 rounded-md text-xs font-bold text-amber-950 bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Full Width Bold Black Save Button */}
              <div className="pt-4 sticky bottom-0 bg-white pb-2">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-zinc-950 text-white text-sm font-black uppercase tracking-[0.25em] rounded hover:bg-zinc-800 transition-colors shadow-lg"
                >
                  SAVE PRODUCT
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

      {/* QUICK ADD BRAND POPUP MODAL */}
      {isQuickBrandModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsQuickBrandModalOpen(false); }}
          className="fixed inset-0 z-[1000001] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-zinc-950 p-6 sm:p-8 max-w-md w-full space-y-6 relative shadow-2xl animate-fadeIn">
            <button
              onClick={() => setIsQuickBrandModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-1"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-serif font-black text-zinc-950 uppercase tracking-widest text-center">
              ADD NEW BRAND
            </h3>

            <form onSubmit={handleSaveQuickBrand} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 block uppercase">Brand Name *</label>
                <input
                  type="text"
                  value={quickBrandName}
                  onChange={e => setQuickBrandName(e.target.value)}
                  placeholder="e.g. Prada, Louis Vuitton, Gucci"
                  required
                  autoFocus
                  className="w-full p-3.5 border border-zinc-300 text-sm font-bold uppercase text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-zinc-700 block uppercase">Brand Logo (File or URL)</label>
                <div className="p-2.5 border border-zinc-300 bg-zinc-50 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, base64 => setQuickBrandLogo(base64))}
                    className="text-xs text-zinc-600 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-zinc-200 file:text-zinc-950 hover:file:bg-zinc-300 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={quickBrandLogo}
                  onChange={e => setQuickBrandLogo(e.target.value)}
                  placeholder="Or paste Logo URL..."
                  className="w-full p-2.5 border border-zinc-300 text-xs font-mono"
                />
                {quickBrandLogo && (
                  <div className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200">
                    <img src={quickBrandLogo} alt="Logo" className="w-10 h-10 object-contain bg-white border border-zinc-300 p-1" />
                    <span className="text-xs font-bold text-zinc-600">Logo preview</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black tracking-widest uppercase transition-colors shadow-md mt-2"
              >
                SAVE & SELECT BRAND
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
