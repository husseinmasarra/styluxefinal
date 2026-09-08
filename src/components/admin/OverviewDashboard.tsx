'use client';

import React, { useState, useEffect } from 'react';
import { DataService, formatCurrency } from '@/lib/store';
import { Order, Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { Trash2, TrendingUp, ShoppingBag, DollarSign, Users, PackageCheck, AlertTriangle, Volume2 } from 'lucide-react';
import { playLuxuryOrderChime } from '@/lib/audioNotification';

export function OverviewDashboard() {
  const { currency, settings } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadData = () => {
    setOrders(DataService.getOrders());
    setProducts(DataService.getProducts());
  };

  const handleResetAllSales = () => {
    if (confirm('CAUTION: Are you sure you want to reset all sales and order metrics? This action cannot be undone.')) {
      DataService.resetToDemo();
      setOrders([]);
      loadData();
    }
  };

  // Calculations
  const totalSalesUSD = orders.reduce((acc, o) => acc + o.totalUSD, 0);
  const netProfitUSD = totalSalesUSD * 0.42; // Estimated 42% net profit margin
  const totalOrdersCount = orders.length;
  const avgOrderValueUSD = totalOrdersCount > 0 ? totalSalesUSD / totalOrdersCount : 0;
  const totalCustomersCount = Array.from(new Set(orders.map(o => o.customerEmail || o.customerPhone))).length;

  // Low Stock Items (sizes with stock <= 2)
  const lowStockItems: { product: Product; size: string; stock: number }[] = [];
  products.forEach(p => {
    Object.entries(p.stockPerSize || {}).forEach(([size, stock]) => {
      if (stock <= 2) {
        lowStockItems.push({ product: p, size, stock });
      }
    });
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

      {/* SECOND ROW CARDS (CUSTOMERS & RECENT METRICS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CUSTOMERS CARD */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            CUSTOMERS
          </span>
          <div className="text-3xl font-extrabold text-zinc-950">
            {totalCustomersCount}
          </div>
        </div>

        {/* INVENTORY COUNT */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            TOTAL CATALOG ITEMS
          </span>
          <div className="text-3xl font-extrabold text-zinc-950">
            {products.length}
          </div>
        </div>

        {/* STORE CURRENCY STATUS */}
        <div className="bg-white border border-zinc-200 rounded p-6 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block">
            ACTIVE BASE CURRENCY
          </span>
          <div className="text-xl font-extrabold text-zinc-950 uppercase flex items-center justify-between">
            <span>{currency}</span>
            <span className="text-xs text-zinc-500 font-semibold">1 USD = {settings.lbpRate.toLocaleString()} LBP</span>
          </div>
        </div>

      </div>

      {/* LOW STOCK ALERTS SECTION */}
      <div className="bg-white border border-zinc-200 rounded p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="text-xs font-black tracking-widest text-zinc-950 uppercase">
              LOW STOCK ALERTS ({lowStockItems.length} SIZES REQUIRING RESTOCK)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">
            THRESHOLD: &le; 2 UNITS
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-emerald-600 uppercase tracking-wider">
            ✓ ALL PRODUCT SIZES ARE HEALTHILY STOCKED.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
            {lowStockItems.map((item, idx) => (
              <div 
                key={`${item.product.id}-${item.size}-${idx}`}
                className="p-3 bg-amber-50/60 border border-amber-200 rounded flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <span className="font-extrabold text-zinc-950 block truncate">
                    {item.product.title}
                  </span>
                  <span className="text-[11px] text-zinc-500 uppercase font-semibold">
                    SIZE: <strong className="text-zinc-900">{item.size}</strong> • {item.product.brandName || 'STYLUXE'}
                  </span>
                </div>
                <span className={`px-2.5 py-1 text-[11px] font-black rounded uppercase shrink-0 ${
                  item.stock === 0 ? 'bg-red-600 text-white' : 'bg-amber-400 text-zinc-950'
                }`}>
                  {item.stock === 0 ? 'OUT OF STOCK' : `${item.stock} LEFT`}
                </span>
              </div>
            ))}
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
