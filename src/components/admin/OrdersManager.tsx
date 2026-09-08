'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DataService, formatCurrency } from '@/lib/store';
import { Order } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { Search, Printer, Eye, Trash2, CheckCircle2, Clock, Truck, RefreshCw, X, ShieldCheck, Download, MessageCircle, Volume2 } from 'lucide-react';
import { playLuxuryOrderChime } from '@/lib/audioNotification';

export function OrdersManager() {
  const { currency, settings } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printFormat, setPrintFormat] = useState<'auto' | 'a4' | 'thermal'>('auto');
  const previousCountRef = useRef<number | null>(null);

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => {
      const freshOrders = DataService.getOrders();
      if (previousCountRef.current !== null && freshOrders.length > previousCountRef.current) {
        // New order arrived! Play luxury chime
        playLuxuryOrderChime();
      }
      previousCountRef.current = freshOrders.length;
      setOrders(freshOrders);
    };
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadOrders = () => {
    const initial = DataService.getOrders();
    previousCountRef.current = initial.length;
    setOrders(initial);
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    const updated = DataService.updateOrderStatus(orderId, newStatus);
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      const updated = DataService.deleteOrder(orderId);
      setOrders(updated);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  const handlePrintAdminInvoice = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // WHATSAPP ORDER DISPATCHER
  const handleWhatsAppDispatch = (order: Order) => {
    let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '961' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('961') && cleanPhone.length === 8) {
      cleanPhone = '961' + cleanPhone;
    }
    const itemsList = order.items.map(i => `• ${i.quantity}x ${i.productTitle} (${i.size})`).join('\n');
    const msg = `Hello ${order.customerName} 👋✨\n\nWe are pleased to inform you of an update on your order #${order.orderNumber}.\nCurrent Status: *${order.status.toUpperCase()}*\n\nItems:\n${itemsList}\n\nTotal: *${formatCurrency(order.totalUSD, currency, settings.lbpRate, settings.eurRate)}*\nAddress: ${order.shippingAddress}, ${order.city || ''}\n\nThank you for shopping with STYLUXE BOUTIQUE! 🛍️`;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // CSV SALES EXPORT
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Customer Name', 'Phone', 'Email', 'Date', 'Status', 'Items Qty', 'Subtotal USD', 'Discount USD', 'Shipping USD', 'Total USD', 'Address', 'City'];
    const rows = orders.map(o => [
      `"${o.orderNumber}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.customerEmail || ''}"`,
      `"${new Date(o.createdAt).toLocaleDateString()}"`,
      `"${o.status}"`,
      o.items.length,
      o.subtotalUSD,
      o.discountUSD || 0,
      o.shippingFeeUSD,
      o.totalUSD,
      `"${(o.shippingAddress || '').replace(/"/g, '""')}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `styluxe_orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchPhone = order.customerPhone.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* PAGE TITLE MATCHING EXACT SCREENSHOT (20-30% ENLARGED FONTS) */}
      <div className="border-b border-zinc-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase">
            CUSTOMER ORDERS
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1.5">
            View client orders, manage fulfillment statuses, send WhatsApp updates, and export sales data.
          </p>
        </div>

        <button
          onClick={handleExportOrdersCSV}
          className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black tracking-[0.15em] uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0"
        >
          <Download size={16} />
          <span>EXPORT ORDERS (CSV / EXCEL)</span>
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR (ENLARGED TYPOGRAPHY) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2.5 text-xs font-black tracking-[0.2em] uppercase rounded transition-all ${
                statusFilter === status
                  ? 'bg-zinc-950 text-white shadow-md scale-105'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 font-extrabold'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order # or client..."
            className="w-full pl-10 pr-4 py-3 border-2 border-zinc-300 text-sm font-bold text-zinc-950 focus:border-zinc-950 rounded placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {/* ORDERS DATA TABLE (REFINED INTERNATIONAL LUXURY TYPOGRAPHY) */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-xs bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80">
              <th className="py-3.5 px-6 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase text-center">ORDER ID</th>
              <th className="py-3.5 px-6 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase text-center">CUSTOMER</th>
              <th className="py-3.5 px-6 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase text-center">DATE</th>
              <th className="py-3.5 px-6 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase text-center">ITEMS</th>
              <th className="py-3.5 px-6 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase text-center">TOTAL</th>
              <th className="py-3.5 px-6 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase text-center">STATUS</th>
              <th className="py-3.5 px-6 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-sm font-medium text-zinc-400">
                  No orders recorded yet.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors text-sm">
                  <td className="py-4 px-6 text-zinc-700 text-center font-mono text-[13px]">
                    {order.orderNumber}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="font-medium text-zinc-900 capitalize text-sm">{order.customerName.toLowerCase()}</div>
                    <div className="text-xs text-zinc-500 font-normal">{order.customerPhone}</div>
                  </td>
                  <td className="py-4 px-6 text-zinc-500 text-center text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-center text-zinc-700 text-sm">
                    {order.items.length} items
                  </td>
                  <td className="py-4 px-6 text-center font-medium text-zinc-950 text-sm">
                    {formatCurrency(order.totalUSD, currency, settings.lbpRate, settings.eurRate)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full capitalize ${
                      order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                      order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200/60' :
                      'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleWhatsAppDispatch(order)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Send WhatsApp confirmation"
                      >
                        <MessageCircle size={13} /> <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye size={13} /> <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="px-2.5 py-1.5 text-zinc-400 hover:text-red-600 transition-colors text-xs"
                        title="Delete order"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FULL ORDER DETAILS & ADMIN PRINTING MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white border border-zinc-300 p-8 sm:p-10 max-w-2xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-none">
            
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="border-b border-zinc-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black tracking-[0.25em] text-zinc-400 uppercase block">
                  ADMIN & STAFF ORDER DETAILS
                </span>
                <h2 className="font-serif text-3xl font-black tracking-wider text-zinc-950 uppercase font-mono">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
            </div>

            {/* PRINT FORMAT SELECTOR BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-100 p-2.5 rounded border border-zinc-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">FORMAT:</span>
                <button
                  onClick={() => setPrintFormat('auto')}
                  className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-all ${
                    printFormat === 'auto' ? 'bg-amber-500 text-zinc-950 shadow-xs' : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-300'
                  }`}
                >
                  ⚡ AUTO-DETECT
                </button>
                <button
                  onClick={() => setPrintFormat('a4')}
                  className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-all ${
                    printFormat === 'a4' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-300'
                  }`}
                >
                  📄 A4 PAGE
                </button>
                <button
                  onClick={() => setPrintFormat('thermal')}
                  className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-all ${
                    printFormat === 'thermal' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-300'
                  }`}
                >
                  🧾 POS THERMAL (80mm)
                </button>
              </div>

              <div className="space-y-0.5 text-right">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
                  STATUS:
                </label>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as any)}
                  className="p-1.5 border-2 border-zinc-950 rounded text-xs font-black uppercase text-zinc-950 bg-white"
                >
                  <option value="pending">PENDING</option>
                  <option value="processing">PROCESSING</option>
                  <option value="shipped">SHIPPED</option>
                  <option value="delivered">DELIVERED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* PRINTABLE ORDER INVOICE CONTENT (A4 PAGE OR THERMAL POS RECEIPT) */}
            {printFormat === 'thermal' ? (
              /* THERMAL POS RECEIPT LAYOUT (80mm ROLL PRINTER) */
              <div id="pos-receipt-print" className="max-w-[80mm] w-full mx-auto bg-white p-4 font-mono text-[11px] leading-snug text-zinc-950 border-2 border-dashed border-zinc-400 space-y-3">
                <div className="text-center space-y-1 border-b border-dashed border-zinc-400 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider">{(settings.storeName || "STYLUXE").replace(/\s+/g, '')} BOUTIQUE</h3>
                  <p className="text-[9px] uppercase">{settings.address || 'DOWNTOWN BEIRUT, ALLENBY ST'}</p>
                  <p className="text-[9px]">TEL: {settings.phone || '+961 70 123 456'}</p>
                </div>

                <div className="text-center border-b border-dashed border-zinc-400 pb-2 space-y-0.5 font-bold">
                  <div className="text-xs font-black">{selectedOrder.orderNumber}</div>
                  <div className="text-[9px] text-zinc-600">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                </div>

                <div className="space-y-1 text-[10px] border-b border-dashed border-zinc-400 pb-2 uppercase">
                  <div><span className="font-bold">CLIENT:</span> {selectedOrder.customerName}</div>
                  <div><span className="font-bold">PHONE:</span> {selectedOrder.customerPhone}</div>
                  <div><span className="font-bold">ADDR:</span> {selectedOrder.shippingAddress}, {selectedOrder.city}</div>
                </div>

                <div className="border-b border-dashed border-zinc-400 pb-2 space-y-1">
                  <div className="font-bold text-[10px] uppercase tracking-wider border-b border-zinc-200 pb-1">ORDER ITEMS</div>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-1 space-y-1 text-[10px] border-b border-zinc-100 last:border-0">
                      <div className="flex items-center gap-2">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.productTitle} className="w-8 h-10 object-cover border border-zinc-300 rounded shrink-0 print:w-8 print:h-10" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between font-bold">
                            <span>{item.quantity}x {item.productTitle.toUpperCase()}</span>
                            <span>{formatCurrency(item.priceUSD * item.quantity, currency, settings.lbpRate, settings.eurRate)}</span>
                          </div>
                          <div className="text-[9px] text-zinc-600">SIZE: {item.size} {item.color ? `| ${item.color.toUpperCase()}` : ''}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[10px] font-bold">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>{formatCurrency(selectedOrder.subtotalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>SHIPPING:</span>
                    <span>{selectedOrder.shippingFeeUSD === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingFeeUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t-2 border-zinc-950 pt-1 text-zinc-950">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(selectedOrder.totalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                  </div>
                </div>

                <div className="text-center pt-2 text-[9px] font-bold text-zinc-500 border-t border-dashed border-zinc-400 uppercase">
                  *** THANK YOU FOR SHOPPING AT STYLUXE ***
                </div>
              </div>
            ) : (
              /* A4 ULTRA-LUXURY INVOICE LAYOUT (ENLARGED & ULTRA-MODERN GLOBAL BOUTIQUE TYPOGRAPHY) */
              <div id="pos-receipt-print" className="space-y-5 text-sm bg-white p-6 sm:p-8 border-4 border-zinc-950 rounded-none font-sans text-zinc-950 shadow-md">
                
                {/* Header Info: Large Vogue Logo & Store Address */}
                <div className="text-center space-y-2 border-b-4 border-zinc-950 pb-5">
                  <h2 className="font-serif text-4xl sm:text-5xl font-black tracking-[0.4em] text-zinc-950 uppercase leading-none">
                    {(settings.storeName || "STYLUXE").replace(/\s+/g, '')}
                  </h2>
                  <div className="text-xs font-black tracking-[0.3em] text-zinc-600 uppercase">
                    ✦ OFFICIAL BOUTIQUE INVOICE & PROOF OF PURCHASE ✦
                  </div>
                  <p className="text-xs sm:text-sm font-black text-zinc-800 uppercase tracking-widest pt-1">
                    {settings.address || 'DOWNTOWN BEIRUT, ALLENBY STREET, LUXURY QUARTER'}
                  </p>
                  <p className="text-xs sm:text-sm font-black text-zinc-800 uppercase tracking-widest">
                    TEL: {settings.phone || '+961 70 123 456'} | EMAIL: VIP@STYLUXELB.COM
                  </p>
                </div>

                {/* Invoice Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-100/90 p-4 border-2 border-zinc-950 font-mono text-sm font-black gap-2">
                  <div>
                    <span className="text-zinc-600 font-sans block text-xs font-black tracking-widest uppercase">INVOICE NUMBER</span>
                    <span className="text-base sm:text-lg font-black text-zinc-950">{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-600 font-sans block text-xs font-black tracking-widest uppercase">DATE & TIME</span>
                    <span className="text-xs sm:text-sm font-black text-zinc-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-zinc-50 p-5 border-2 border-zinc-950 space-y-3">
                  <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-zinc-950 uppercase block border-b-2 border-zinc-950 pb-2">
                    CLIENT & DELIVERY DETAILS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm uppercase tracking-wider">
                    <div>
                      <span className="text-xs font-black text-zinc-500 block">CLIENT NAME:</span>
                      <span className="font-black text-zinc-950 text-base sm:text-lg">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-zinc-500 block">PHONE NUMBER:</span>
                      <span className="font-mono font-black text-amber-600 text-base sm:text-lg">{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-zinc-300">
                      <span className="text-xs font-black text-zinc-500 block">SHIPPING ADDRESS:</span>
                      <span className="font-black text-zinc-950 text-sm sm:text-base">{selectedOrder.shippingAddress}, {selectedOrder.city}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="space-y-3">
                  <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-zinc-950 uppercase block">
                    ORDERED ITEMS BREAKDOWN
                  </span>
                  <div className="border-2 border-zinc-950 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-zinc-950 text-white font-black text-xs sm:text-sm tracking-widest uppercase">
                          <th className="py-3.5 px-4 text-left">ITEM DESCRIPTION</th>
                          <th className="py-3.5 px-4 text-center">SPECS</th>
                          <th className="py-3.5 px-4 text-center">QTY</th>
                          <th className="py-3.5 px-4 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-zinc-200">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 font-bold">
                            <td className="py-3.5 px-4 font-black text-zinc-950 uppercase text-xs sm:text-sm">
                              <div className="flex items-center gap-3">
                                {item.imageUrl && (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.productTitle} 
                                    className="w-12 h-14 object-cover border-2 border-zinc-300 rounded shrink-0 print:w-12 print:h-14 print:object-cover" 
                                  />
                                )}
                                <div>
                                  <span className="font-black text-zinc-950 uppercase block text-xs sm:text-sm">{item.productTitle}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-black text-zinc-700 uppercase text-xs sm:text-sm">
                              SIZE: {item.size} {item.color ? `| ${item.color.toUpperCase()}` : ''}
                            </td>
                            <td className="py-3.5 px-4 text-center font-black text-zinc-950 text-sm sm:text-base">
                              {item.quantity}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-zinc-950 text-sm sm:text-base font-mono">
                              {formatCurrency(item.priceUSD * item.quantity, currency, settings.lbpRate, settings.eurRate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-80 bg-zinc-50 p-4 sm:p-5 border-2 border-zinc-950 space-y-2 text-xs sm:text-sm uppercase tracking-wider font-bold">
                    <div className="flex justify-between text-zinc-700">
                      <span className="font-extrabold">SUBTOTAL:</span>
                      <span className="font-black text-zinc-950">{formatCurrency(selectedOrder.subtotalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span className="font-extrabold">SHIPPING FEE:</span>
                      <span className="font-black text-zinc-950">{selectedOrder.shippingFeeUSD === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingFeeUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base font-black text-zinc-950 pt-2.5 border-t-2 border-zinc-950">
                      <span>TOTAL ORDER AMOUNT:</span>
                      <span className="text-base sm:text-lg text-zinc-950 font-black font-mono">{formatCurrency(selectedOrder.totalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Authenticity Guarantee */}
                <div className="pt-4 border-t-2 border-zinc-950 text-center space-y-1.5 text-xs font-black tracking-[0.25em] text-zinc-700 uppercase">
                  <div>✦ 100% AUTHENTIC GUARANTEED • OFFICIAL STYLUXE BOUTIQUE RECEIPT ✦</div>
                  <div>THANK YOU FOR SHOPPING AT STYLUXE BOUTIQUE. FOR VIP SUPPORT CONTACT OUR CLIENT SERVICES.</div>
                </div>

              </div>
            )}

            {/* ADMIN PRINT & ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={handlePrintAdminInvoice}
                  className="px-6 py-4 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.2em] uppercase rounded shadow-lg flex items-center gap-2"
                >
                  <Printer size={18} className="text-amber-400" />
                  <span>PRINT INVOICE</span>
                </button>

                <button
                  onClick={() => handleWhatsAppDispatch(selectedOrder)}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black tracking-[0.2em] uppercase rounded shadow-lg flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span>WHATSAPP UPDATE</span>
                </button>
              </div>

              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-4 border-2 border-zinc-300 hover:border-zinc-950 text-zinc-950 text-xs font-black tracking-[0.2em] uppercase rounded"
              >
                CLOSE
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
