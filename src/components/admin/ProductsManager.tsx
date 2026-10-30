'use client';

import React, { useState, useEffect } from 'react';
import { DataService, isProductMatchingCategory } from '@/lib/store';
import { Product, Brand, Category } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { useCart } from '@/lib/CartContext';
import { Plus, Search, Edit2, Trash2, X, Package, ScanBarcode, Palette, Upload, ArrowUp, ArrowDown, GripVertical, Download, Share2 } from 'lucide-react';

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
  const { currency, settings, showToast } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<'summer' | 'winter' | 'all'>('all');
  const [selectedDeptTab, setSelectedDeptTab] = useState<'all' | 'women' | 'men'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [smartFilterBadge, setSmartFilterBadge] = useState<'all' | 'low_stock' | 'out_of_stock' | 'on_sale' | 'featured'>('all');
  
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
    colorsInput: '',
    colorHexes: {} as Record<string, string>,
    sizeQuantities: {
      S: 10,
      M: 15,
      L: 8,
      XL: 4
    } as Record<string, number>,
    sizesStock: {} as Record<string, Record<string, number>>,
    colorImages: {} as Record<string, string[]>,
    images: [] as string[],
    videoUrl: '',
    shortDescription: '',
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

  useEffect(() => {
    if (settings?.activeSeason) {
      setSelectedSeason(settings.activeSeason);
    }
  }, [settings?.activeSeason]);

  const handleSeasonChange = async (season: 'summer' | 'winter' | 'all') => {
    setSelectedSeason(season);
    try {
      await DataService.updateSettings({ activeSeason: season });
    } catch (err) {
      console.error('Failed to update store active season:', err);
    }
  };

  const handleExportMetaCatalogCSV = () => {
    if (products.length === 0) {
      if (showToast) showToast('No products available to export for Meta Catalog', 'error');
      return;
    }
    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'google_product_category',
      'fb_product_category'
    ];
    const rows = products.map(p => {
      const id = p.id;
      const title = (p.title || 'Luxury Product').replace(/"/g, '""');
      const desc = (p.description || p.title || 'Authentic designer luxury').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      const availability = (p.totalStock && p.totalStock > 0) ? 'in stock' : 'out of stock';
      const condition = 'new';
      const price = `${p.salePrice && p.salePrice < p.price ? p.salePrice : p.price} USD`;
      const link = `https://www.styluxelb.com/product/${p.slug || p.id}`;
      const imageLink = (p.images && p.images[0]) || 'https://www.styluxelb.com/logo.jpg';
      const brand = (p.brandName || 'STYLUXE').replace(/"/g, '""');
      const googleCat = '1604';
      const fbCat = 'Apparel & Accessories';

      return [
        `"${id}"`,
        `"${title}"`,
        `"${desc}"`,
        `"${availability}"`,
        `"${condition}"`,
        `"${price}"`,
        `"${link}"`,
        `"${imageLink.startsWith('http') ? imageLink : 'https://www.styluxelb.com/product/' + (p.slug || p.id)}"`,
        `"${brand}"`,
        `"${googleCat}"`,
        `"${fbCat}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `styluxe_meta_catalog_feed_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('Meta & Instagram Shop Catalog CSV exported successfully!', 'success');
  };

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
      compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.72 })
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

  const handleMultipleFilesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (urls: string[]) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const results: string[] = [];
    for (const file of list) {
      try {
        const compressed = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.72 });
        results.push(compressed);
      } catch (err) {
        console.error('Compression failed, using fallback reader:', err);
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || '');
          reader.readAsDataURL(file);
        });
        if (base64) results.push(base64);
      }
    }
    if (results.length > 0) {
      callback(results);
    }
    e.target.value = '';
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
    const targetDept = (selectedDeptTab === 'men' ? 'men' : 'women') as 'women' | 'men';
    const availableCats = categories.filter(c => c.department === targetDept || c.department === 'all');
    const firstCat = availableCats[0]?.name || categories[0]?.name || '';
    setFormData({
      title: '',
      barcode: '',
      priority: 1000,
      department: targetDept,
      category: firstCat,
      brandId: brands[0]?.id || '',
      brandName: brands[0]?.name || '',
      season: 'All Seasons',
      price: 90,
      salePrice: 0,
      costPrice: 45,
      sizesInput: 'S, M, L, XL',
      sizeQuantities: { S: 10, M: 10, L: 10, XL: 10 },
      colorsInput: '',
      colorHexes: {},
      sizesStock: {},
      colorImages: {},
      images: [],
      videoUrl: '',
      shortDescription: '',
      description: 'Garment details...',
      isFeatured: true,
      isPreOrder: false,
      preOrderNote: 'Dispatches in 14-21 Business Days'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    const parsedSizes = Object.keys(prod.stockPerSize || {}).join(', ') || 'S, M, L, XL';
    const parsedColors = (prod.colors || [])
      .filter(c => c && c.toLowerCase() !== 'default' && c.toLowerCase() !== 'standard')
      .join(', ');

    const hexes: Record<string, string> = { ...(prod.colorHexes || {}) };
    (prod.colors || []).forEach(col => {
      if (!hexes[col]) {
        hexes[col] = DEFAULT_COLOR_HEXES[col.toLowerCase()] || '#000000';
      }
    });

    const sizeQuantitiesMap: Record<string, number> = { ...(prod.stockPerSize || {}) };

    const normalizedColorImages: Record<string, string[]> = {};
    if (prod.colorImages) {
      Object.entries(prod.colorImages).forEach(([col, val]) => {
        if (Array.isArray(val)) {
          normalizedColorImages[col] = val.filter(Boolean);
        } else if (typeof val === 'string' && val) {
          normalizedColorImages[col] = [val];
        }
      });
    }

    setFormData({
      title: prod.title,
      barcode: prod.sku || '',
      priority: 1000,
      department: ((prod.department as string) === 'kids' ? 'women' : (prod.department || 'women')) as 'women' | 'men' | 'all',
      category: prod.category,
      brandId: prod.brandId,
      brandName: prod.brandName || 'PRADA',
      season: prod.season || (prod as any).season || 'All Seasons',
      price: prod.salePrice ? Math.min(prod.price, prod.salePrice) : prod.price,
      salePrice: prod.salePrice ? Math.max(prod.price, prod.salePrice) : 0,
      costPrice: 45,
      sizesInput: parsedSizes,
      sizeQuantities: sizeQuantitiesMap,
      colorsInput: parsedColors,
      colorHexes: hexes,
      sizesStock: {},
      colorImages: normalizedColorImages,
      images: (prod.images && prod.images.length > 0) ? [...prod.images] : [],
      videoUrl: '',
      shortDescription: prod.shortDescription || '',
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
      category: availableCats.some(c => c.name === prev.category) ? prev.category : firstCat
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

    // Combine general images and color-specific images
    const generalImages = (formData.images || []).filter(Boolean);
    const colorSpecificImages = Object.values(formData.colorImages || {}).flat().filter(Boolean);
    const combinedImages = Array.from(new Set([...generalImages, ...colorSpecificImages]));
    const finalImages = combinedImages.length > 0 
      ? combinedImages 
      : ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'];

    // Map colorImages
    const finalColorImages: Record<string, string | string[]> = {};
    colorsList.forEach(col => {
      const imgs = formData.colorImages[col] || [];
      if (imgs.length > 0) {
        finalColorImages[col] = imgs;
      }
    });

    const inputPrice1 = Number(formData.price) || 0;
    const inputPrice2 = formData.salePrice ? Number(formData.salePrice) : undefined;
    let finalPrice = inputPrice1;
    let finalSalePrice = inputPrice2;

    if (inputPrice2 !== undefined && inputPrice2 > 0 && inputPrice2 !== inputPrice1) {
      finalPrice = Math.max(inputPrice1, inputPrice2);
      finalSalePrice = Math.min(inputPrice1, inputPrice2);
    }

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      department: formData.department,
      category: formData.category || (categories[0]?.name || 'General'),
      brandId: finalBrandId || '',
      brandName: finalBrandName || 'PRADA',
      price: finalPrice,
      salePrice: finalSalePrice,
      sku: formData.barcode || `SKU-${Date.now()}`,
      stockPerSize,
      totalStock,
      colors: colorsList,
      colorHexes: colorHexesMap,
      colorImages: Object.keys(finalColorImages).length > 0 ? finalColorImages : undefined,
      images: finalImages,
      description: formData.description,
      shortDescription: formData.shortDescription?.trim() || undefined,
      season: formData.season || 'All Seasons',
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
      .filter(c => c.department === formData.department || c.department === 'all')
      .flatMap(c => [
        c.name,
        ...(c.subCategories || []).map(sc => sc.name),
        ...(c.subCategories || []).map(sc => `${c.name} > ${sc.name}`)
      ]),
    ...products.filter(p => p.department === formData.department).map(p => p.category),
    ...(formData.category ? [formData.category] : [])
  ])).filter(Boolean);

  const lowStockCount = products.filter(p => p.totalStock > 0 && p.totalStock <= 5).length;
  const outOfStockCount = products.filter(p => p.totalStock === 0).length;
  const onSaleCount = products.filter(p => Boolean(p.salePrice && p.salePrice > 0 && p.salePrice < p.price)).length;
  const featuredCount = products.filter(p => p.isFeatured).length;

  const filteredProducts = products.filter(p => {
    // 0. Department Tab filter
    if (selectedDeptTab !== 'all' && p.department !== selectedDeptTab) return false;

    // 1. Category filter
    if (selectedCategory !== 'all' && !isProductMatchingCategory(p.category, selectedCategory)) return false;

    // 2. Season filter
    if (selectedSeason !== 'all') {
      const pSeason = ((p as any).season || '').toLowerCase();
      if (selectedSeason === 'summer' && !pSeason.includes('summer') && pSeason !== 'all seasons' && pSeason !== '') return false;
      if (selectedSeason === 'winter' && !pSeason.includes('winter') && pSeason !== 'all seasons' && pSeason !== '') return false;
    }

    // 3. Smart Filter Badge
    if (smartFilterBadge === 'low_stock' && !(p.totalStock > 0 && p.totalStock <= 5)) return false;
    if (smartFilterBadge === 'out_of_stock' && p.totalStock !== 0) return false;
    if (smartFilterBadge === 'on_sale' && !(p.salePrice && p.salePrice > 0 && p.salePrice < p.price)) return false;
    if (smartFilterBadge === 'featured' && !p.isFeatured) return false;

    // 4. Smart Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();

      // Check price range comparison: e.g. "< 100", "> 50", "<=80"
      if (q.startsWith('<') || q.startsWith('>')) {
        const op = q.startsWith('<=') || q.startsWith('>=') ? q.slice(0, 2) : q[0];
        const num = parseFloat(q.slice(op.length).trim());
        if (!isNaN(num)) {
          const effectivePrice = p.salePrice || p.price;
          if (op === '<' && effectivePrice >= num) return false;
          if (op === '<=' && effectivePrice > num) return false;
          if (op === '>' && effectivePrice <= num) return false;
          if (op === '>=' && effectivePrice < num) return false;
          return true;
        }
      }

      // Stock status keywords
      if (q === 'out of stock' || q === 'out' || q === 'sold out') {
        return p.totalStock === 0;
      }
      if (q === 'low stock' || q === 'low') {
        return p.totalStock > 0 && p.totalStock <= 5;
      }
      if (q === 'in stock') {
        return p.totalStock > 0;
      }
      if (q === 'sale' || q === 'discount' || q === 'promo') {
        return Boolean(p.salePrice && p.salePrice > 0);
      }

      // Comprehensive search across all product attributes
      const brandObj = brands.find(b => b.id === p.brandId);
      const brandName = (p.brandName || brandObj?.name || '').toLowerCase();
      const title = p.title.toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = ((p as any).barcode || '').toLowerCase();
      const id = p.id.toLowerCase();
      const category = (p.category || '').toLowerCase();
      const department = (p.department || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const colors = (p.colors || []).join(' ').toLowerCase();
      const colorHexKeys = Object.keys(p.colorHexes || {}).join(' ').toLowerCase();
      const sizes = Object.keys(p.stockPerSize || {}).join(' ').toLowerCase();
      const priceStr = `${p.price} ${p.salePrice || ''}`;

      // English synonyms dictionary
      const synonyms: Record<string, string[]> = {
        'denim': ['jeans'],
        'tee': ['t-shirt', 'shirt'],
        'tshirt': ['t-shirt', 'tee'],
        'jacket': ['coat', 'blazer'],
        'sneakers': ['shoes'],
        'boots': ['shoes'],
        'bag': ['tote', 'handbag', 'shoulder']
      };

      const queryTokens = q.split(/\s+/).filter(Boolean);
      return queryTokens.every(token => {
        // Direct match
        if (
          title.includes(token) ||
          brandName.includes(token) ||
          sku.includes(token) ||
          barcode.includes(token) ||
          id.includes(token) ||
          category.includes(token) ||
          department.includes(token) ||
          description.includes(token) ||
          colors.includes(token) ||
          colorHexKeys.includes(token) ||
          sizes.includes(token) ||
          priceStr.includes(token)
        ) {
          return true;
        }

        // Synonym match
        const synList = synonyms[token];
        if (synList) {
          return synList.some(s => 
            title.includes(s) || category.includes(s) || department.includes(s) || description.includes(s)
          );
        }

        return false;
      });
    }

    return true;
  });

  const parsedColors = formData.colorsInput.split(',').map(c => c.trim()).filter(Boolean);
  const parsedSizes = formData.sizesInput.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6 bg-white min-h-[80vh]">
      
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

          <div className="flex items-center gap-1 border-2 border-zinc-950 rounded p-1 bg-white">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-1.5 hidden sm:inline-block">
              STOREFRONT:
            </span>
            <button
              onClick={() => handleSeasonChange('summer')}
              title="Activate Summer Collection for Storefront"
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${
                selectedSeason === 'summer' ? 'bg-amber-400 text-zinc-950 shadow-xs' : 'text-zinc-700 hover:text-zinc-950'
              }`}
            >
              <span>☀️</span> Summer
            </button>
            <button
              onClick={() => handleSeasonChange('winter')}
              title="Activate Winter Collection for Storefront"
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${
                selectedSeason === 'winter' ? 'bg-sky-400 text-zinc-950 shadow-xs' : 'text-zinc-700 hover:text-zinc-950'
              }`}
            >
              <span>❄️</span> Winter
            </button>
            <button
              onClick={() => handleSeasonChange('all')}
              title="Show All Collections on Storefront"
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${
                selectedSeason === 'all' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-700 hover:text-zinc-950'
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={handleExportMetaCatalogCSV}
            className="px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            title="Export products feed for Instagram Shopping & Facebook Shop catalog sync"
          >
            <Share2 size={16} />
            <span>META CATALOG (CSV)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-zinc-950 text-white text-xs font-black tracking-widest uppercase hover:bg-zinc-800 transition-all rounded shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} />
            <span>ADD NEW PRODUCT</span>
          </button>

        </div>

      </div>

      {/* DEPARTMENT TABS FOR STRICT SEPARATION BETWEEN MEN & WOMEN */}
      <div className="flex items-center gap-2 border-b-2 border-zinc-200 pb-3">
        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest mr-2">DEPARTMENT:</span>
        <button
          type="button"
          onClick={() => setSelectedDeptTab('all')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded transition-all flex items-center gap-2 ${
            selectedDeptTab === 'all'
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <span>ALL PRODUCTS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
            {products.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedDeptTab('women')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded transition-all flex items-center gap-2 ${
            selectedDeptTab === 'women'
              ? 'bg-rose-950 text-white shadow-md'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <span>♀ FOR HER (WOMEN)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
            {products.filter(p => p.department === 'women').length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedDeptTab('men')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded transition-all flex items-center gap-2 ${
            selectedDeptTab === 'men'
              ? 'bg-sky-950 text-white shadow-md'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <span>♂ FOR HIM (MEN)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
            {products.filter(p => p.department === 'men').length}
          </span>
        </button>
      </div>

      {/* SMART SEARCH BAR & LIVE FILTERS TOOLBAR */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Smart Search Input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search size={18} className="text-zinc-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search by Title, Brand, Category, SKU, Barcode, Color, Size..."
              className="w-full pl-10 pr-10 py-3 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-950 cursor-pointer"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Live Product Counter & Reset Button */}
          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            <span className="px-3.5 py-2.5 bg-white border border-zinc-300 rounded text-xs font-mono font-black text-zinc-900 shadow-2xs">
              {filteredProducts.length} of {products.length} PRODUCTS
            </span>
            {(searchQuery || selectedCategory !== 'all' || selectedSeason !== 'all' || smartFilterBadge !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedSeason('all');
                  setSmartFilterBadge('all');
                }}
                className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black uppercase rounded border border-red-200 transition-colors cursor-pointer"
              >
                RESET FILTERS
              </button>
            )}
          </div>

        </div>

        {/* Quick Smart Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-200/60">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mr-1">
            SMART FILTERS:
          </span>
          <button
            onClick={() => setSmartFilterBadge('all')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors cursor-pointer ${
              smartFilterBadge === 'all'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white border border-zinc-300 text-zinc-700 hover:border-zinc-950'
            }`}
          >
            ALL ({products.length})
          </button>
          <button
            onClick={() => setSmartFilterBadge('low_stock')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors cursor-pointer ${
              smartFilterBadge === 'low_stock'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                : 'bg-white border border-zinc-300 text-amber-700 hover:border-amber-500'
            }`}
          >
            ⚠️ LOW STOCK ({lowStockCount})
          </button>
          <button
            onClick={() => setSmartFilterBadge('out_of_stock')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors cursor-pointer ${
              smartFilterBadge === 'out_of_stock'
                ? 'bg-red-600 text-white font-black shadow-xs'
                : 'bg-white border border-zinc-300 text-red-600 hover:border-red-600'
            }`}
          >
            ⛔ OUT OF STOCK ({outOfStockCount})
          </button>
          <button
            onClick={() => setSmartFilterBadge('on_sale')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors cursor-pointer ${
              smartFilterBadge === 'on_sale'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-white border border-zinc-300 text-emerald-700 hover:border-emerald-600'
            }`}
          >
            🏷️ ON SALE ({onSaleCount})
          </button>
          <button
            onClick={() => setSmartFilterBadge('featured')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors cursor-pointer ${
              smartFilterBadge === 'featured'
                ? 'bg-purple-600 text-white font-black shadow-xs'
                : 'bg-white border border-zinc-300 text-purple-700 hover:border-purple-600'
            }`}
          >
            ⭐ FEATURED ({featuredCount})
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
                <td colSpan={7} className="py-20 text-center space-y-4">
                  <div className="flex justify-center text-zinc-400">
                    <Search size={44} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-zinc-950 uppercase tracking-wider">
                      NO PRODUCTS FOUND MATCHING YOUR SMART SEARCH
                    </p>
                    <p className="text-xs text-zinc-500 font-medium">
                      No products match your current search or filter criteria.
                    </p>
                    {searchQuery && (
                      <p className="text-xs font-mono font-bold text-zinc-700 pt-1">
                        Search term: &quot;{searchQuery}&quot;
                      </p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedSeason('all');
                        setSmartFilterBadge('all');
                      }}
                      className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider rounded shadow-xs cursor-pointer"
                    >
                      CLEAR SEARCH & SHOW ALL PRODUCTS
                    </button>
                  </div>
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
                    {prod.shortDescription && (
                      <span className="text-[10px] text-zinc-500 font-medium block truncate max-w-[200px] mx-auto mt-0.5">
                        {prod.shortDescription}
                      </span>
                    )}
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

              {/* Short Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                    Short Description (Optional)
                  </label>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Displays directly beneath the product title
                  </span>
                </div>
                <input 
                  type="text" 
                  value={formData.shortDescription} 
                  onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} 
                  placeholder="e.g. 100% Organic Cotton with Tailored Slim Fit" 
                  className="w-full p-4 border-2 border-zinc-300 rounded text-base font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50"
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
                            <React.Fragment key={sub.id}>
                              <option value={`${cat.name} > ${sub.name}`}>↳ {cat.name} &gt; {sub.name}</option>
                              <option value={sub.name}>↳ {sub.name}</option>
                            </React.Fragment>
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

              {/* 1. GENERAL PRODUCT IMAGES GALLERY (UPLOAD DIRECTLY WITHOUT COLOR) */}
              <div className="space-y-4 border-2 border-zinc-200 rounded p-4 bg-zinc-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                  <div>
                    <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                      <Upload size={16} className="text-blue-600" />
                      <span>Product Images Gallery *</span>
                    </label>
                    <span className="text-xs text-zinc-500 font-medium block mt-0.5">
                      Upload one or multiple images directly from your device (no color required).
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase rounded cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 shadow-sm">
                      <Upload size={14} /> CHOOSE FILES FROM COMPUTER
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleMultipleFilesUpload(e, newUrls => {
                          setFormData(prev => ({
                            ...prev,
                            images: [...(prev.images || []), ...newUrls]
                          }));
                        })}
                      />
                    </label>
                  </div>
                </div>

                {/* Paste Image URL Input */}
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    id="generalImageInputUrl"
                    placeholder="Or paste image URL (https://...)" 
                    className="w-full p-2.5 border border-zinc-300 text-xs font-mono rounded font-bold bg-white"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        if (input.value.trim()) {
                          setFormData(prev => ({
                            ...prev,
                            images: [...(prev.images || []), input.value.trim()]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('generalImageInputUrl') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          images: [...(prev.images || []), input.value.trim()]
                        }));
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 text-xs font-black uppercase rounded shrink-0 cursor-pointer"
                  >
                    + ADD URL
                  </button>
                </div>

                {/* Thumbnails Grid */}
                {(formData.images || []).length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                    {(formData.images || []).map((imgUrl, idx) => (
                      <div key={idx} className="relative group border-2 border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs aspect-3/4">
                        <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-zinc-950 text-white text-[9px] font-black uppercase rounded tracking-wider shadow-xs">
                            COVER
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="Delete this image"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-zinc-300 rounded bg-white text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    No general images uploaded yet. Upload images above or add per color below.
                  </div>
                )}
              </div>

              {/* 2. COLORS & COLOR-SPECIFIC MULTI-IMAGE GALLERY (OPTIONAL) */}
              <div className="space-y-4 border-2 border-zinc-200 rounded p-4 bg-zinc-50">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                      <Palette size={16} className="text-amber-500" />
                      <span>Colors & Multi-Color Gallery (Optional)</span>
                    </label>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase">
                      {parsedColors.length === 0 ? 'SINGLE COLOR / NO COLOR' : `${parsedColors.length} COLORS`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    If the product has a single color, leave this empty. For multiple colors, enter comma-separated (e.g. Black, White, Navy).
                  </p>
                  <input 
                    type="text" 
                    value={formData.colorsInput} 
                    onChange={e => setFormData({ ...formData, colorsInput: e.target.value })} 
                    placeholder="Optional: Black, Charcoal, Navy (Leave empty for single color)" 
                    className="w-full p-4 border-2 border-zinc-300 rounded text-base font-black uppercase text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  />
                </div>

                {/* Color Shades Pickers */}
                {parsedColors.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-black text-zinc-700 uppercase tracking-wider block">
                      COLOR SHADES:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {parsedColors.map(color => {
                        const currentHex = formData.colorHexes[color] || DEFAULT_COLOR_HEXES[color.toLowerCase()] || '#000000';
                        return (
                          <div key={color} className="p-3 border-2 border-zinc-200 rounded bg-white space-y-1.5 shadow-2xs">
                            <span className="font-extrabold text-zinc-950 text-xs uppercase block truncate">
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
                                className="w-full p-1.5 border border-zinc-300 rounded font-mono text-xs font-black uppercase"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* MULTIPLE IMAGES PER COLOR */}
                {parsedColors.length > 0 && (
                  <div className="space-y-4 pt-3 border-t border-zinc-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                        <Upload size={14} className="text-blue-600" />
                        <span>Upload Multiple Images for Each Color:</span>
                      </label>
                      <span className="text-[11px] text-zinc-500 font-bold uppercase">
                        You can upload multiple high-res photos for the same color
                      </span>
                    </div>

                    <div className="space-y-3">
                      {parsedColors.map(color => {
                        const colorImgs = formData.colorImages[color] || [];
                        const colorHex = formData.colorHexes[color] || DEFAULT_COLOR_HEXES[color.toLowerCase()] || '#000000';

                        return (
                          <div key={color} className="border-2 border-zinc-200 rounded-lg p-4 bg-white space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <span 
                                  className="w-4 h-4 rounded-full border border-zinc-300 shadow-xs inline-block"
                                  style={{ backgroundColor: colorHex }}
                                />
                                <span className="font-black text-zinc-950 text-sm uppercase">
                                  COLOR: {color}
                                </span>
                                <span className="text-[11px] font-bold text-zinc-400">
                                  ({colorImgs.length} {colorImgs.length === 1 ? 'image' : 'images'})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase rounded cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 shadow-xs">
                                  <Upload size={13} /> + CHOOSE FILES FOR {color}
                                  <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleMultipleFilesUpload(e, newUrls => {
                                      setFormData(prev => ({
                                        ...prev,
                                        colorImages: {
                                          ...prev.colorImages,
                                          [color]: [...(prev.colorImages[color] || []), ...newUrls]
                                        }
                                      }));
                                    })}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* URL paste for this color */}
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                id={`color-img-url-${color}`}
                                placeholder={`Paste image URL for ${color}...`} 
                                className="w-full p-2 border border-zinc-300 text-xs font-mono rounded font-medium"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.currentTarget;
                                    if (input.value.trim()) {
                                      setFormData(prev => ({
                                        ...prev,
                                        colorImages: {
                                          ...prev.colorImages,
                                          [color]: [...(prev.colorImages[color] || []), input.value.trim()]
                                        }
                                      }));
                                      input.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`color-img-url-${color}`) as HTMLInputElement;
                                  if (input && input.value.trim()) {
                                    setFormData(prev => ({
                                      ...prev,
                                      colorImages: {
                                        ...prev.colorImages,
                                        [color]: [...(prev.colorImages[color] || []), input.value.trim()]
                                      }
                                    }));
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 text-xs font-black uppercase rounded shrink-0 cursor-pointer"
                              >
                                + Add URL
                              </button>
                            </div>

                            {/* Grid of images for this color */}
                            {colorImgs.length > 0 ? (
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 pt-1">
                                {colorImgs.map((imgUrl, imgIdx) => (
                                  <div key={imgIdx} className="relative group border border-zinc-200 rounded-md overflow-hidden bg-zinc-50 aspect-3/4 shadow-2xs">
                                    <img src={imgUrl} alt={`${color} ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          colorImages: {
                                            ...prev.colorImages,
                                            [color]: (prev.colorImages[color] || []).filter((_, i) => i !== imgIdx)
                                          }
                                        }));
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                                      title="Remove image"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-2.5 text-zinc-400 text-xs font-semibold">
                                No images uploaded for {color} yet. Click upload button above.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                  Detailed Description *
                </label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full garment specifications, care instructions, and designer notes..."
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
