'use client';

import React, { useState, useEffect } from 'react';
import { Search, Printer, RotateCcw, Lock, Archive, LogOut, ArrowLeft, Check, Trash2, ShoppingBag, X, AlertTriangle } from 'lucide-react';
import { DataService, formatCurrency } from '@/lib/store';
import { Product, Order } from '@/lib/types';
import { useCart } from '@/lib/CartContext';

interface PosTerminalProps {
  onBackToDashboard?: () => void;
}

export function PosTerminal({ onBackToDashboard }: PosTerminalProps) {
  const { currency, settings } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filtering
  const [selectedDept, setSelectedDept] = useState<'all' | 'men' | 'women'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ticket / Cart
  const [ticketItems, setTicketItems] = useState<{
    product: Product;
    size: string;
    color: string;
    quantity: number;
    priceUSD: number;
  }[]>([]);
  
  // Customer & Discount details matching screenshot
  const [customerName, setCustomerName] = useState('WALK-IN CUSTOMER');
  const [customerPhone, setCustomerPhone] = useState('+961 70 123 456');
  const [customerAddress, setCustomerAddress] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Mode & Modals
  const [isReturnMode, setIsReturnMode] = useState<boolean>(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState<boolean>(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState<string>('');
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  // Receipt Print Modal
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  const triggerStockWarning = (msg: string) => {
    setStockWarning(msg);
    setTimeout(() => {
      setStockWarning(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut listener: ESC to close any modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lastCompletedOrder) setLastCompletedOrder(null);
        if (isCloseRegisterOpen) setIsCloseRegisterOpen(false);
        if (isArchiveOpen) setIsArchiveOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastCompletedOrder, isCloseRegisterOpen, isArchiveOpen]);

  const loadData = () => {
    const prods = DataService.getProducts();
    setProducts(prods);
    const cats = Array.from(new Set(prods.map(p => p.category)));
    setCategories(cats);
  };

  // Filtered Products Catalog
  const filteredProducts = products.filter(p => {
    if (selectedDept !== 'all' && p.department !== selectedDept) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.title.toLowerCase().includes(q);
      const matchBrand = p.brandName?.toLowerCase().includes(q);
      const matchSKU = p.sku?.toLowerCase().includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchSKU && !matchId) return false;
    }
    return true;
  });

  // Add Item to POS Ticket
  const addItemToTicket = (product: Product, size: string) => {
    const availableStock = product.stockPerSize && product.stockPerSize[size] !== undefined
      ? Number(product.stockPerSize[size])
      : Number(product.totalStock) || 0;

    // In normal sale mode (not return):
    if (!isReturnMode) {
      if (availableStock <= 0) {
        triggerStockWarning(`⚠️ OUT OF STOCK: "${product.title}" size (${size}) is out of stock (Stock: 0).`);
        return;
      }

      const existingItem = ticketItems.find(item => item.product.id === product.id && item.size === size);
      const currentQty = existingItem ? existingItem.quantity : 0;

      if (currentQty + 1 > availableStock) {
        triggerStockWarning(`⚠️ Low Stock: Only ${availableStock} items in stock for "${product.title}" (${size}).`);
        return;
      }
    }

    setTicketItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.size === size);
      const priceUSD = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prev, {
          product,
          size,
          color: product.colors[0] || 'Default',
          quantity: 1,
          priceUSD
        }];
      }
    });
  };

  const updateItemQty = (index: number, delta: number) => {
    if (!isReturnMode && delta > 0) {
      const item = ticketItems[index];
      if (item) {
        const availableStock = item.product.stockPerSize && item.product.stockPerSize[item.size] !== undefined
          ? Number(item.product.stockPerSize[item.size])
          : Number(item.product.totalStock) || 0;

        if (item.quantity + delta > availableStock) {
          triggerStockWarning(`⚠️ Exceeds stock: Only ${availableStock} units available for "${item.product.title}" (${item.size}).`);
          return;
        }
      }
    }

    setTicketItems(prev => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setTicketItems(prev => prev.filter((_, i) => i !== index));
  };

  // Subtotal & Calculations
  const subtotalUSD = ticketItems.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0);
  const discountAmountUSD = (subtotalUSD * (discountPercent || 0)) / 100;
  const totalUSD = Math.max(0, subtotalUSD - discountAmountUSD);
  const totalItemsCount = ticketItems.reduce((acc, item) => acc + item.quantity, 0);

  // Complete POS Sale
  const handleCompleteSale = () => {
    if (ticketItems.length === 0) {
      alert('Please add products to the ticket first.');
      return;
    }

    const orderNumber = isReturnMode 
      ? `RET-${Math.floor(10000 + Math.random() * 90000)}`
      : `POS-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName: customerName || (isReturnMode ? 'WALK-IN RETURN' : 'WALK-IN CUSTOMER'),
      customerEmail: 'walkin@styluxelb.com',
      customerPhone: customerPhone || '+961 70 123 456',
      shippingAddress: customerAddress || 'Styluxe Boutique POS Store',
      city: 'Beirut',
      country: 'Lebanon',
      items: ticketItems.map(item => ({
        productId: item.product.id,
        productTitle: item.product.title,
        brandName: item.product.brandName,
        size: item.size,
        color: item.color,
        priceUSD: item.priceUSD,
        quantity: item.quantity,
        imageUrl: item.product.images[0]
      })),
      subtotalUSD,
      discountUSD: discountAmountUSD,
      shippingFeeUSD: 0,
      totalUSD,
      currency: currency,
      exchangeRate: settings.lbpRate,
      totalInCurrency: totalUSD * (currency === 'LBP' ? settings.lbpRate : currency === 'EUR' ? settings.eurRate : 1),
      status: isReturnMode ? 'refunded' : 'delivered',
      paymentMethod: 'cash',
      createdAt: new Date().toISOString()
    };

    DataService.saveOrder(newOrder);

    // Update Stock Inventory: Restock if return, deduct if sale
    ticketItems.forEach(item => {
      const p = DataService.getProductById(item.product.id);
      if (p && p.stockPerSize[item.size] !== undefined) {
        if (isReturnMode) {
          p.stockPerSize[item.size] = (p.stockPerSize[item.size] || 0) + item.quantity;
        } else {
          p.stockPerSize[item.size] = Math.max(0, p.stockPerSize[item.size] - item.quantity);
        }
        p.totalStock = Object.values(p.stockPerSize).reduce((a, b) => a + b, 0);
        DataService.saveProduct(p);
      }
    });

    setLastCompletedOrder(newOrder);
    setTicketItems([]);
    setDiscountPercent(0);
    loadData();
  };

  return (
    <div className="bg-white min-h-screen text-zinc-950 p-4 sm:p-6 space-y-6">
      
      {/* 1. TOP HEADER TOOLBAR FULLY FUNCTIONAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        
        {/* Left Title & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xl">⌨</span>
            <h1 className="text-lg sm:text-xl font-black tracking-wider uppercase">
              {isReturnMode ? 'RETURN TERMINAL' : 'POS TERMINAL'}
            </h1>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
              isReturnMode ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
            }`}>
              {isReturnMode ? 'RETURN MODE' : 'SALE MODE'}
            </span>
          </div>

          {/* 1. SWITCH TO RETURN / SALE */}
          <button 
            onClick={() => {
              setIsReturnMode(prev => !prev);
              setTicketItems([]);
            }} 
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isReturnMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border border-red-300 text-red-600 hover:bg-red-50'
            }`}
            title="Toggle between Sale and Return/Refund modes"
          >
            <RotateCcw size={14} /> 
            <span>{isReturnMode ? 'SWITCH TO SALE' : 'SWITCH TO RETURN'}</span>
          </button>

          {/* 2. DASHBOARD */}
          {onBackToDashboard && (
            <button 
              onClick={onBackToDashboard}
              className="px-3 py-1.5 border border-zinc-300 text-zinc-800 hover:bg-zinc-100 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Return to Main Overview Dashboard"
            >
              <ArrowLeft size={14} /> 
              <span>DASHBOARD</span>
            </button>
          )}

          {/* 3. CLOSE REGISTER */}
          <button 
            onClick={() => setIsCloseRegisterOpen(true)}
            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            title="View shift cash summary and close register"
          >
            <Lock size={14} /> 
            <span>CLOSE REGISTER</span>
          </button>

          {/* 4. ARCHIVE */}
          <button 
            onClick={() => setIsArchiveOpen(true)}
            className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            title="View past POS receipts and transaction history"
          >
            <Archive size={14} /> 
            <span>ARCHIVE</span>
          </button>

          {/* 5. LOGOUT */}
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to sign out from the POS Terminal?')) {
                sessionStorage.removeItem('styluxe_auth_username');
                sessionStorage.removeItem('styluxe_admin_auth');
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Sign out of the system"
          >
            <LogOut size={14} /> 
            <span>LOGOUT</span>
          </button>
        </div>

        {/* Right Print Report Action */}
        <button 
          onClick={() => setIsCloseRegisterOpen(true)}
          className="px-4 py-1.5 border border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 self-start lg:self-auto cursor-pointer"
          title="Print daily shift Z-Report"
        >
          <Printer size={16} /> 
          <span>PRINT REPORT</span>
        </button>

      </div>

      {/* 2. DEPARTMENT FILTER TABS (ALL, MEN, WOMEN) */}
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
        {(['all', 'men', 'women'] as const).map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-6 py-2 text-xs font-bold tracking-widest uppercase transition-colors rounded-sm ${
              selectedDept === dept
                ? 'bg-zinc-950 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return;
                const matched = products.find(p => 
                  p.id.toLowerCase() === q ||
                  (p.sku && p.sku.toLowerCase() === q) ||
                  p.title.toLowerCase() === q
                ) || filteredProducts[0];

                if (matched) {
                  const availableSize = Object.keys(matched.stockPerSize || {}).find(sz => ((matched.stockPerSize && matched.stockPerSize[sz]) || 0) > 0) 
                    || Object.keys(matched.stockPerSize || {})[0] 
                    || 'Standard';

                  const stock = (matched.stockPerSize && matched.stockPerSize[availableSize]) ?? matched.totalStock ?? 0;
                  if (!isReturnMode && stock <= 0) {
                    triggerStockWarning(`⚠️ OUT OF STOCK: "${matched.title}" is out of stock (0 units).`);
                  } else {
                    addItemToTicket(matched, availableSize);
                    setSearchQuery('');
                  }
                }
              }
            }}
            placeholder="Search by name, ID, or Barcode (Press Enter to quick-add)..."
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 text-xs font-medium focus:border-zinc-950 rounded placeholder:text-zinc-400"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2.5 border border-zinc-200 bg-white text-xs font-bold uppercase tracking-wider rounded focus:border-zinc-950"
        >
          <option value="all">ALL CATEGORIES</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Floating Stock Warning Toast / Alert */}
      {stockWarning && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-2xl border-2 border-white flex items-center gap-3 animate-bounce">
          <AlertTriangle size={22} className="shrink-0 text-yellow-300" />
          <span>{stockWarning}</span>
          <button 
            onClick={() => setStockWarning(null)} 
            className="ml-3 text-white/80 hover:text-white font-black text-base cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN POS WORKSPACE: LEFT CATALOG + RIGHT CHECKOUT TICKET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* LEFT CATALOG GRID (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[680px] overflow-y-auto pr-2">
            {filteredProducts.map(product => {
              const totalStock = Object.values(product.stockPerSize || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
              const isAllOut = totalStock <= 0 || (product.totalStock !== undefined && product.totalStock <= 0);

              return (
                <div 
                  key={product.id} 
                  className={`bg-white border rounded p-4 space-y-3 flex flex-col justify-between transition-all shadow-sm relative ${
                    isAllOut 
                      ? 'border-red-300 bg-red-50/20' 
                      : 'border-zinc-200 hover:border-zinc-950'
                  }`}
                >
                  {/* Product Image */}
                  <div className="aspect-[3/4] w-full bg-zinc-100 overflow-hidden relative border border-zinc-100 rounded">
                    <img 
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800'} 
                      alt={product.title} 
                      className={`w-full h-full object-cover object-center ${isAllOut ? 'opacity-40 grayscale' : ''}`}
                    />

                    {/* CLEAR & HIGH VISIBILITY OUT OF STOCK BADGE */}
                    {isAllOut ? (
                      <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex flex-col items-center justify-center p-2.5 text-center z-10">
                        <div className="bg-red-600 text-white font-black text-[11px] px-3 py-1.5 rounded uppercase tracking-widest shadow-xl border-2 border-white flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle size={14} className="text-yellow-300" />
                          <span>OUT OF STOCK</span>
                        </div>
                        <span className="text-white text-[9px] font-bold mt-1.5 uppercase tracking-wider bg-black/70 px-2.5 py-0.5 rounded">
                          Stock: 0 (OUT OF STOCK)
                        </span>
                      </div>
                    ) : product.salePrice ? (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase z-10 rounded">
                        SALE
                      </span>
                    ) : null}
                  </div>

                  {/* Color Swatch Preview */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">
                      COLOR:
                    </span>
                    <div className="flex gap-1.5">
                      {(product.colors || []).map(col => (
                        <span 
                          key={col} 
                          className="w-4 h-4 rounded-full border border-zinc-300 bg-zinc-950 inline-block" 
                          title={col}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Size Selector Pills: Shows exact stock and warns if 0 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                        SIZES & STOCK:
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isAllOut ? 'bg-red-100 text-red-700 font-bold' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {isAllOut ? 'OUT OF STOCK' : `STOCK: ${totalStock}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(product.stockPerSize || {}).map(([size, stock]) => {
                        const stockNum = Number(stock) || 0;
                        const isSizeOut = stockNum <= 0;
                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={isSizeOut && !isReturnMode}
                            onClick={() => addItemToTicket(product, size)}
                            className={`px-2 py-1 text-[10px] font-extrabold uppercase rounded transition-all flex items-center gap-1 ${
                              isSizeOut
                                ? isReturnMode
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                  : 'bg-zinc-100 text-red-500 border border-red-200 line-through cursor-not-allowed opacity-60'
                                : 'bg-zinc-950 text-white hover:bg-zinc-800 cursor-pointer shadow-xs'
                            }`}
                            title={isSizeOut ? `${size}: OUT OF STOCK (Stock: 0)` : `${size}: ${stockNum} available in stock`}
                          >
                            <span>{size}</span>
                            <span className={`text-[8px] px-1 py-0.2 rounded font-black ${
                              isSizeOut 
                                ? 'bg-red-600 text-white no-underline' 
                                : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              {isSizeOut ? 'OUT' : stockNum}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Product Details (GUCCI / JEANS / $90.00) */}
                  <div className="pt-2 border-t border-zinc-100 text-center space-y-0.5">
                    <span className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase block">
                      {product.brandName || "STYLUXE"}
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-800 uppercase line-clamp-1">
                      {product.title}
                    </h4>
                    <p className="text-sm font-extrabold text-zinc-950 mt-1">
                      {formatCurrency(
                        product.salePrice && product.salePrice < product.price ? product.salePrice : product.price,
                        currency,
                        settings.lbpRate,
                        settings.eurRate
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT CHECKOUT TICKET PANEL (5 Columns) MATCHING SCREENSHOT */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded p-6 space-y-6 flex flex-col justify-between shadow-sm">
          
          <div className="space-y-6">
            {/* Ticket Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <span className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase flex items-center gap-2">
                <span>📋</span> CHECKOUT TICKET
              </span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {totalItemsCount} ITEMS
              </span>
            </div>

            {/* Ticket Items List */}
            <div className="min-h-[160px] max-h-[260px] overflow-y-auto space-y-3 pr-1">
              {ticketItems.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  NO ITEMS IN TICKET.
                </div>
              ) : (
                ticketItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2 border-b border-zinc-100 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={item.product.images[0]} alt={item.product.title} className="w-10 h-12 object-cover rounded bg-zinc-100" />
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">{item.product.brandName}</span>
                        <span className="font-bold text-zinc-950 uppercase block line-clamp-1">{item.product.title}</span>
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase">SIZE: {item.size} | QTY: {item.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-zinc-950">
                        {formatCurrency(item.priceUSD * item.quantity, currency, settings.lbpRate, settings.eurRate)}
                      </span>
                      <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Information Grid (Customer | Phone | Address) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-200 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase flex items-center gap-1">
                  <span>👤</span> Customer
                </label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  className="w-full p-2 border border-zinc-200 text-xs font-semibold uppercase rounded bg-zinc-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase flex items-center gap-1">
                  <span>📞</span> Phone
                </label>
                <input 
                  type="text" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)} 
                  className="w-full p-2 border border-zinc-200 text-xs font-semibold rounded bg-zinc-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase flex items-center gap-1">
                  <span>📍</span> Address (Optional)
                </label>
                <input 
                  type="text" 
                  value={customerAddress} 
                  onChange={(e) => setCustomerAddress(e.target.value)} 
                  placeholder="e.g. Beirut, Hamra Str" 
                  className="w-full p-2 border border-zinc-200 text-xs font-medium rounded bg-zinc-50 placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Discount (%) Row */}
            <div className="space-y-1 border-t border-zinc-100 pt-3">
              <label className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase flex items-center gap-1">
                <span>🏷</span> Discount (%)
              </label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={discountPercent} 
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} 
                className="w-full p-2 border border-zinc-200 text-xs font-bold rounded bg-zinc-50"
              />
            </div>
          </div>

          {/* Subtotal & Complete Sale Totals */}
          <div className="space-y-4 pt-4 border-t border-zinc-200">
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold text-zinc-500 uppercase tracking-wider">
                <span>SUBTOTAL</span>
                <span>{formatCurrency(subtotalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
              </div>
              <div className="flex justify-between font-bold text-red-600 uppercase tracking-wider">
                <span>DISCOUNT</span>
                <span>-{formatCurrency(discountAmountUSD, currency, settings.lbpRate, settings.eurRate)}</span>
              </div>
            </div>

            <div className="border-t-2 border-zinc-950 pt-2 flex items-center justify-between">
              <span className="text-base font-extrabold tracking-widest text-zinc-950 uppercase">
                TOTAL
              </span>
              <span className="text-2xl font-extrabold text-zinc-950">
                {formatCurrency(totalUSD, currency, settings.lbpRate, settings.eurRate)}
              </span>
            </div>

            <button 
              onClick={handleCompleteSale}
              className={`w-full py-3.5 text-white font-extrabold text-xs tracking-[0.2em] uppercase rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isReturnMode ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-950 hover:bg-zinc-800'
              }`}
            >
              <Check size={16} /> 
              <span>{isReturnMode ? 'PROCESS RETURN & RESTOCK' : 'COMPLETE SALE'}</span>
            </button>

          </div>

        </div>

      </div>

      {/* 1. POS THERMAL RECEIPT MODAL */}
      {lastCompletedOrder && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setLastCompletedOrder(null); }}
          className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white border border-zinc-200 rounded p-6 max-w-md w-full space-y-4 relative shadow-2xl">
            <button 
              onClick={() => setLastCompletedOrder(null)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-950 p-1 rounded-full hover:bg-zinc-100"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-1">
              <span className={`text-xs font-bold uppercase tracking-widest block ${
                lastCompletedOrder.status === 'refunded' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {lastCompletedOrder.status === 'refunded' ? '✓ RETURN & RESTOCK COMPLETED' : '✓ SALE COMPLETED SUCCESSFULLY'}
              </span>
              <h3 className="text-lg font-extrabold text-zinc-950 uppercase">
                {lastCompletedOrder.status === 'refunded' ? 'RETURN RECEIPT' : 'RECEIPT'} #{lastCompletedOrder.orderNumber}
              </h3>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 text-xs space-y-2 font-mono">
              <p>CUSTOMER: {lastCompletedOrder.customerName}</p>
              <p>PHONE: {lastCompletedOrder.customerPhone}</p>
              <p>DATE: {new Date(lastCompletedOrder.createdAt).toLocaleString()}</p>
              <p>STATUS: <span className="font-bold uppercase">{lastCompletedOrder.status}</span></p>
              <hr className="border-zinc-200" />
              {lastCompletedOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.quantity}x {it.productTitle} ({it.size})</span>
                  <span>${(it.priceUSD * it.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr className="border-zinc-200" />
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span className={lastCompletedOrder.status === 'refunded' ? 'text-red-600' : 'text-zinc-950'}>
                  {lastCompletedOrder.status === 'refunded' ? '-' : ''}${lastCompletedOrder.totalUSD.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Printer size={16} /> PRINT RECEIPT
              </button>
              <button 
                onClick={() => setLastCompletedOrder(null)} 
                className="flex-1 py-2.5 border border-zinc-300 text-zinc-900 hover:bg-zinc-100 text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
              >
                NEW SALE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLOSE REGISTER & SHIFT SUMMARY MODAL */}
      {isCloseRegisterOpen && (() => {
        const allOrders = DataService.getOrders();
        const todayStr = new Date().toISOString().split('T')[0];
        const todayOrders = allOrders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
        const posSalesToday = todayOrders.filter(o => o.orderNumber && o.orderNumber.startsWith('POS-'));
        const posRefundsToday = todayOrders.filter(o => (o.orderNumber && o.orderNumber.startsWith('RET-')) || o.status === 'refunded');

        const totalSalesUSD = posSalesToday.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
        const totalRefundsUSD = posRefundsToday.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
        const netRegisterUSD = Math.max(0, totalSalesUSD - totalRefundsUSD);

        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setIsCloseRegisterOpen(false); }}
            className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          >
            <div className="bg-white border border-zinc-200 rounded-lg p-6 max-w-lg w-full space-y-5 relative shadow-2xl">
              <button 
                onClick={() => setIsCloseRegisterOpen(false)} 
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-950 p-1 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-1 border-b border-zinc-200 pb-4">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Lock size={14} /> POS CASH REGISTER MANAGEMENT
                </span>
                <h3 className="font-serif text-xl font-bold text-zinc-950 uppercase tracking-wider">
                  DAILY SHIFT SUMMARY &amp; CLOSING
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs bg-zinc-50 p-4 rounded border border-zinc-200">
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-500">CASHIER / TERMINAL:</span>
                  <span className="font-bold text-zinc-950">@admin (ACTIVE SHIFT)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-500">POS SALES TRANSACTIONS:</span>
                  <span className="font-bold text-zinc-950">{posSalesToday.length} ORDERS</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-500">TOTAL GROSS REVENUE:</span>
                  <span className="font-bold text-emerald-600">+{formatCurrency(totalSalesUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-500">RETURNS &amp; REFUNDS ({posRefundsToday.length}):</span>
                  <span className="font-bold text-red-600">-{formatCurrency(totalRefundsUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold border-t-2 border-zinc-950 text-zinc-950">
                  <span>NET CASH IN REGISTER:</span>
                  <span className="text-emerald-700">{formatCurrency(netRegisterUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-3 border border-zinc-950 text-zinc-950 hover:bg-zinc-100 text-xs font-black uppercase tracking-wider rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer size={16} /> PRINT Z-REPORT
                </button>
                <button 
                  onClick={() => {
                    alert(`Cash Register closed successfully for this shift.\nTotal Net Sales: $${netRegisterUSD.toFixed(2)}`);
                    setIsCloseRegisterOpen(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Lock size={16} /> CONFIRM &amp; CLOSE
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. ARCHIVED POS TRANSACTIONS MODAL */}
      {isArchiveOpen && (() => {
        const allOrders = DataService.getOrders();
        const posOrders = allOrders.filter(o => 
          (o.orderNumber && o.orderNumber.startsWith('POS-')) || 
          (o.orderNumber && o.orderNumber.startsWith('RET-')) || 
          o.shippingAddress?.includes('POS')
        );

        const filteredArchive = posOrders.filter(o => {
          if (!archiveSearchQuery.trim()) return true;
          const q = archiveSearchQuery.toLowerCase();
          return (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
                 (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                 (o.customerPhone && o.customerPhone.includes(q));
        });

        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setIsArchiveOpen(false); }}
            className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          >
            <div className="bg-white border border-zinc-200 rounded-lg p-6 max-w-2xl w-full max-h-[85vh] flex flex-col space-y-4 relative shadow-2xl">
              <button 
                onClick={() => setIsArchiveOpen(false)} 
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-950 p-1 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="border-b border-zinc-200 pb-3">
                <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-1">
                  <Archive size={14} /> HISTORICAL AUDIT LOG
                </span>
                <h3 className="font-serif text-xl font-bold text-zinc-950 uppercase tracking-wider">
                  POS TRANSACTIONS ARCHIVE
                </h3>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Search receipt # (e.g. POS-), customer name or phone..."
                  value={archiveSearchQuery}
                  onChange={(e) => setArchiveSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded text-xs font-medium focus:border-zinc-950"
                />
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px]">
                {filteredArchive.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    NO TRANSACTIONS RECORDED IN POS ARCHIVE YET
                  </div>
                ) : (
                  filteredArchive.map(order => {
                    const isRefund = (order.orderNumber && order.orderNumber.startsWith('RET-')) || order.status === 'refunded';
                    return (
                      <div 
                        key={order.id}
                        className="p-3 bg-zinc-50 border border-zinc-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-400 transition-colors"
                      >
                        <div className="space-y-1 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-zinc-950">#{order.orderNumber}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              isRefund ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isRefund ? 'REFUND' : 'SALE'}
                            </span>
                            <span className="text-zinc-400 text-[10px]">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600">
                            {order.customerName} &bull; {order.customerPhone} &bull; {order.items.length} items
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className={`font-black text-sm ${isRefund ? 'text-red-600' : 'text-zinc-950'}`}>
                            {isRefund ? '-' : ''}{formatCurrency(order.totalUSD, currency, settings.lbpRate, settings.eurRate)}
                          </span>
                          <button
                            onClick={() => {
                              setLastCompletedOrder(order);
                              setIsArchiveOpen(false);
                            }}
                            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-[10px] font-black uppercase rounded flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Printer size={12} /> RE-PRINT
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
