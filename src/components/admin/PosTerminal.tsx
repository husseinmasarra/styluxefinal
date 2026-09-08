'use client';

import React, { useState, useEffect } from 'react';
import { Search, Printer, RotateCcw, Lock, Archive, LogOut, ArrowLeft, Check, Trash2, ShoppingBag, X } from 'lucide-react';
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
  
  // Receipt Print Modal
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut listener: ESC to close POS receipt modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lastCompletedOrder) {
        setLastCompletedOrder(null);
      }
    };
    if (lastCompletedOrder) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastCompletedOrder]);

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
      alert('Please add products to the checkout ticket first.');
      return;
    }

    const orderNumber = `POS-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName: customerName || 'WALK-IN CUSTOMER',
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
      status: 'delivered',
      paymentMethod: 'card',
      createdAt: new Date().toISOString()
    };

    DataService.saveOrder(newOrder);

    // Update Stock Inventory
    ticketItems.forEach(item => {
      const p = DataService.getProductById(item.product.id);
      if (p && p.stockPerSize[item.size] !== undefined) {
        p.stockPerSize[item.size] = Math.max(0, p.stockPerSize[item.size] - item.quantity);
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
      
      {/* 1. TOP HEADER TOOLBAR MATCHING EXACT SCREENSHOT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        
        {/* Left Title & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-widest uppercase flex items-center gap-2">
            <span>⌨</span> POS TERMINAL
          </h1>

          <button 
            onClick={() => setTicketItems([])} 
            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> SWITCH TO RETURN
          </button>

          {onBackToDashboard && (
            <button 
              onClick={onBackToDashboard}
              className="px-3 py-1.5 border border-zinc-300 text-zinc-800 hover:bg-zinc-100 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> DASHBOARD
            </button>
          )}

          <button className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5">
            <Lock size={14} /> CLOSE REGISTER
          </button>

          <button className="px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5">
            <Archive size={14} /> ARCHIVE
          </button>

          <button className="px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5">
            <LogOut size={14} /> LOGOUT
          </button>
        </div>

        {/* Right Print Report Action */}
        <button 
          onClick={() => window.print()}
          className="px-4 py-1.5 border border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 self-start lg:self-auto"
        >
          <Printer size={16} /> PRINT REPORT
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
            placeholder="Search by name, ID, or Barcode..."
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

      {/* MAIN POS WORKSPACE: LEFT CATALOG + RIGHT CHECKOUT TICKET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* LEFT CATALOG GRID (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[680px] overflow-y-auto pr-2">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="bg-white border border-zinc-200 rounded p-4 space-y-3 flex flex-col justify-between hover:border-zinc-950 transition-colors shadow-sm"
              >
                {/* Product Image */}
                <div className="aspect-[3/4] w-full bg-zinc-100 overflow-hidden relative border border-zinc-100">
                  <img 
                    src={product.images[0]} 
                    alt={product.title} 
                    className="w-full h-full object-cover object-center"
                  />
                  {product.salePrice && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase">
                      SALE
                    </span>
                  )}
                </div>

                {/* Color Swatch Preview */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">
                    SELECT COLOR:
                  </span>
                  <div className="flex gap-1.5">
                    {product.colors.map(col => (
                      <span 
                        key={col} 
                        className="w-4 h-4 rounded-full border border-zinc-300 bg-zinc-950 inline-block" 
                        title={col}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selector Pills: Clicking adds size directly to ticket */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">
                    SELECT SIZE TO ADD:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(product.stockPerSize).map(size => (
                      <button
                        key={size}
                        onClick={() => addItemToTicket(product, size)}
                        className="px-2.5 py-1 bg-zinc-950 text-white text-[11px] font-extrabold uppercase rounded hover:bg-zinc-800 transition-colors"
                      >
                        {size}
                      </button>
                    ))}
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
            ))}
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
              className="w-full py-3.5 bg-zinc-950 text-white font-extrabold text-xs tracking-[0.2em] uppercase rounded hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={16} /> COMPLETE SALE
            </button>

          </div>

        </div>

      </div>

      {/* POS THERMAL RECEIPT MODAL */}
      {lastCompletedOrder && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setLastCompletedOrder(null); }}
          className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white border border-zinc-200 rounded p-6 max-w-md w-full space-y-4 relative">
            <button 
              onClick={() => setLastCompletedOrder(null)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-950"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
                ✓ SALE COMPLETED SUCCESSFULLY
              </span>
              <h3 className="text-lg font-extrabold text-zinc-950 uppercase">
                RECEIPT #{lastCompletedOrder.orderNumber}
              </h3>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 text-xs space-y-2 font-mono">
              <p>CUSTOMER: {lastCompletedOrder.customerName}</p>
              <p>PHONE: {lastCompletedOrder.customerPhone}</p>
              <p>DATE: {new Date(lastCompletedOrder.createdAt).toLocaleString()}</p>
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
                <span>${lastCompletedOrder.totalUSD.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2"
              >
                <Printer size={16} /> PRINT RECEIPT
              </button>
              <button 
                onClick={() => setLastCompletedOrder(null)}
                className="flex-1 py-2.5 border border-zinc-300 text-zinc-900 text-xs font-bold uppercase tracking-wider rounded"
              >
                NEW SALE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
