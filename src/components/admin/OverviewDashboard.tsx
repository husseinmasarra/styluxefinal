'use client';

import React, { useState, useEffect } from 'react';
import { DataService, formatCurrency } from '@/lib/store';
import { Order, Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { Trash2, TrendingUp, ShoppingBag, DollarSign, Users, PackageCheck, AlertTriangle, Volume2, Eye, Activity, RotateCcw } from 'lucide-react';
import { playLuxuryOrderChime } from '@/lib/audioNotification';
import { getVisitorStats, resetVisitorStats, VisitorStats } from '@/lib/visitorTracking';

export function OverviewDashboard() {
  const { currency, settings } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>(getVisitorStats());

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    window.addEventListener('styluxe_visitor_updated', handleUpdate);
    
    // Refresh live visitor pulses every 15s
    const pulseInterval = setInterval(() => {
      setVisitorStats(getVisitorStats());
    }, 15000);

    return () => {
      window.removeEventListener('styluxe_data_updated', handleUpdate);
      window.removeEventListener('styluxe_visitor_updated', handleUpdate);
      clearInterval(pulseInterval);
    };
  }, []);

  const loadData = () => {
    setOrders(DataService.getOrders());
    setProducts(DataService.getProducts());
    setVisitorStats(getVisitorStats());
  };

  const handleResetAllSales = () => {
    if (confirm('CAUTION: Are you sure you want to reset all sales, order, and visitor metrics? This action cannot be undone.')) {
      DataService.resetToDemo();
      resetVisitorStats();
      setOrders([]);
      loadData();
    }
  };

  const handleResetVisitors = () => {
    if (confirm('Are you sure you want to reset the visitor count back to ZERO (0)?')) {
      resetVisitorStats();
      setVisitorStats(getVisitorStats());
    }
  };

  // Calculations
  const totalSalesUSD = orders.reduce((acc, o) => acc + o.totalUSD, 0);
  const netProfitUSD = totalSalesUSD * 0.42; // Estimated 42% net profit margin
  const totalOrdersCount = orders.length;
  const avgOrderValueUSD = totalOrdersCount > 0 ? totalSalesUSD / totalOrdersCount : 0;
  const totalCustomersCount = Array.from(new Set(orders.map(o => o.customerEmail || o.customerPhone))).length;
  const conversionRate = visitorStats.totalVisitors > 0
    ? ((totalOrdersCount / visitorStats.totalVisitors) * 100).toFixed(1)
    : '0.0';

  // Low Stock Items Grouped by Product (Organizes space efficiently)
  interface LowStockProductGroup {
    product: Product;
    sizes: { size: string; stock: number }[];
    totalRemaining: number;
    hasOutOfStock: boolean;
  }

  const groupedLowStock: LowStockProductGroup[] = [];
  let totalLowStockSizesCount = 0;

  products.forEach(p => {
    const lowSizes: { size: string; stock: number }[] = [];
    let totalRem = 0;
    let hasZero = false;

    Object.entries(p.stockPerSize || {}).forEach(([size, stock]) => {
      const s = Number(stock) || 0;
      if (s <= 2) {
        lowSizes.push({ size, stock: s });
        totalRem += s;
        if (s === 0) hasZero = true;
        totalLowStockSizesCount++;
      }
    });

    if (lowSizes.length > 0) {
      groupedLowStock.push({
        product: p,
        sizes: lowSizes,
        totalRemaining: totalRem,
        hasOutOfStock: hasZero,
      });
    }
  });

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* HEADER TITLE & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        
        <h1 className="font-serif text-3xl font-normal tracking-[0.25em] text-zinc-900 uppercase">
          DASHBOARD OVERVIEW
        </h1>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => playLuxuryOrderChime()}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2"
            title="Test audio chime notification"
          >
            <Volume2 size={16} className="text-amber-500" />
            <span>TEST ORDER CHIME</span>
          </button>
          
          <button
            onClick={handleResetAllSales}
            className="px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-extrabold uppercase tracking-widest rounded flex items-center gap-2"
          >
            <Trash2 size={16} /> RESET ALL SALES
          </button>
        </div>

      </div>

      {/* KPI METRIC CARDS ROW MATCHING EXACT SCREENSHOT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: GLOBAL SALES */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            GLOBAL SALES
          </span>
          <div className="text-3xl font-extrabold text-zinc-950">
            {formatCurrency(totalSalesUSD, currency, settings.lbpRate, settings.eurRate)}
          </div>
        </div>

        {/* CARD 2: NET PROFIT (GREEN ACCENT BORDER & COLOR MATCHING SCREENSHOT) */}
        <div className="bg-white border border-zinc-200 border-l-4 border-l-emerald-500 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-emerald-500 uppercase block">
            NET PROFIT
          </span>
          <div className="text-3xl font-extrabold text-emerald-500">
            {formatCurrency(netProfitUSD, currency, settings.lbpRate, settings.eurRate)}
          </div>
        </div>

        {/* CARD 3: TOTAL ORDERS */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            TOTAL ORDERS
          </span>
          <div className="text-3xl font-extrabold text-zinc-950">
            {totalOrdersCount}
          </div>
        </div>

        {/* CARD 4: AVG ORDER VALUE */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            AVG ORDER VALUE
          </span>
          <div className="text-3xl font-extrabold text-zinc-950">
            {formatCurrency(avgOrderValueUSD, currency, settings.lbpRate, settings.eurRate)}
          </div>
        </div>

      </div>

      {/* SECOND ROW CARDS (AUDIENCE, TRAFFIC & PERFORMANCE METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD: TOTAL VISITORS & LIVE AUDIENCE */}
        <div className="bg-white border border-zinc-200 border-l-4 border-l-sky-500 rounded p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                STORE VISITORS
              </span>
              <button
                onClick={handleResetVisitors}
                className="text-zinc-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-zinc-100"
                title="Reset visitor counter to 0"
              >
                <RotateCcw size={12} />
              </button>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              {visitorStats.activeNow} LIVE NOW
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-950">
            {visitorStats.totalVisitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            <strong className="text-zinc-900 font-bold">+{visitorStats.todayVisitors}</strong> visitors today
          </div>
        </div>

        {/* CARD: CUSTOMERS */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            CUSTOMERS
          </span>
          <div className="text-3xl font-extrabold text-zinc-950">
            {totalCustomersCount}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            Registered customer profiles
          </div>
        </div>

        {/* CARD: CONVERSION RATE */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            CONVERSION RATE
          </span>
          <div className="text-3xl font-extrabold text-zinc-950">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            {totalOrdersCount} orders from total visits
          </div>
        </div>

        {/* CARD: INVENTORY & CURRENCY */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
              CATALOG ITEMS
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase px-1.5 py-0.5 bg-zinc-100 rounded">
              {currency} (1$ = {settings.lbpRate.toLocaleString()} LBP)
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-950">
            {products.length}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            Active luxury items in store
          </div>
        </div>

      </div>

      {/* LOW STOCK ALERTS SECTION */}
      <div className="bg-white border border-zinc-200 rounded p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="text-xs font-black tracking-widest text-zinc-950 uppercase">
              LOW STOCK ALERTS ({groupedLowStock.length} PRODUCTS · {totalLowStockSizesCount} SIZES)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">
            THRESHOLD: &le; 2 UNITS
          </span>
        </div>

        {groupedLowStock.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-emerald-600 uppercase tracking-wider">
            ✓ ALL PRODUCT SIZES ARE HEALTHILY STOCKED.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedLowStock.map((group) => {
              const p = group.product;
              const img = (p.images && p.images[0]) || '';

              return (
                <div 
                  key={p.id}
                  className="p-3.5 bg-amber-50/40 border border-amber-200/80 rounded-xl flex gap-3.5 items-start hover:border-amber-300 transition-all shadow-xs"
                >
                  {/* Product Thumbnail */}
                  <div className="w-12 h-16 bg-zinc-100 rounded-lg overflow-hidden shrink-0 border border-zinc-200 relative">
                    {img ? (
                      <img src={img} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400 font-bold">
                        NO IMG
                      </div>
                    )}
                  </div>

                  {/* Product Details & Sizes */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase block truncate">
                          {p.brandName || 'STYLUXE'}
                        </span>
                        <h4 className="text-xs font-extrabold text-zinc-950 truncate" title={p.title}>
                          {p.title}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase shrink-0 ${
                        group.hasOutOfStock ? 'bg-red-600 text-white' : 'bg-amber-400 text-zinc-950'
                      }`}>
                        {group.totalRemaining === 0 ? 'OUT' : `${group.totalRemaining} LEFT`}
                      </span>
                    </div>

                    {/* Low Stock Sizes Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {group.sizes.map((s) => (
                        <span
                          key={s.size}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            s.stock === 0
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-white text-zinc-900 border border-amber-300 shadow-2xs'
                          }`}
                        >
                          <span>SIZE {s.size}:</span>
                          <strong className={s.stock === 0 ? 'text-red-700' : 'text-amber-700'}>
                            {s.stock === 0 ? '0' : `${s.stock}`}
                          </strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOWER SECTION: RECENT SALES ACTIVITY SUMMARY */}
      <div className="bg-white border border-zinc-200 rounded p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-extrabold tracking-widest text-zinc-400 uppercase">
          RECENT SALES ACTIVITY
        </h3>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
            NO SALES RECORDED YET.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-zinc-950 uppercase">{o.orderNumber}</span>
                  <span className="text-zinc-500 block">{o.customerName} • {new Date(o.createdAt).toLocaleTimeString()}</span>
                </div>
                <span className="font-extrabold text-zinc-950">
                  {formatCurrency(o.totalUSD, currency, settings.lbpRate, settings.eurRate)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
