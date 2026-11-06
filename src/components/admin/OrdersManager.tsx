'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DataService, formatCurrency, getCustomerTier, formatLebanonPhone } from '@/lib/store';
import { Order, OrderItem, Product, Customer } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { Search, Printer, Eye, Trash2, CheckCircle2, Clock, Truck, RefreshCw, X, ShieldCheck, Download, MessageCircle, Volume2, Plus, Sparkles, Send, UserCheck, PackagePlus } from 'lucide-react';
import { playLuxuryOrderChime } from '@/lib/audioNotification';

export function OrdersManager() {
  const { currency, settings } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printFormat, setPrintFormat] = useState<'auto' | 'a4' | 'thermal'>('auto');
  const previousCountRef = useRef<number | null>(null);

  // Quick WhatsApp / Direct Order Modal States
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState<boolean>(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [waCustomerName, setWaCustomerName] = useState<string>('');
  const [waCustomerPhone, setWaCustomerPhone] = useState<string>('');
  const [waCustomerAddress, setWaCustomerAddress] = useState<string>('');
  const [waCustomerCity, setWaCustomerCity] = useState<string>('Beirut');
  const [waOrderNotes, setWaOrderNotes] = useState<string>('Direct WhatsApp order');
  const [waShippingFee, setWaShippingFee] = useState<number>(5);
  const [waDiscount, setWaDiscount] = useState<number>(0);
  const [waTicketItems, setWaTicketItems] = useState<OrderItem[]>([]);
  
  // Product item picker state
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [prodSearchFilter, setProdSearchFilter] = useState<string>('');

  // Quick order completed state (to show confirmation & WhatsApp send button)
  const [justCompletedWaOrder, setJustCompletedWaOrder] = useState<Order | null>(null);

  const handleOpenQuickOrder = () => {
    setAvailableProducts(DataService.getProducts());
    setWaCustomerName('');
    setWaCustomerPhone('');
    setWaCustomerAddress('');
    setWaCustomerCity('Beirut');
    setWaOrderNotes('Direct WhatsApp order');
    setWaShippingFee(settings.defaultShippingFeeUSD ?? 5);
    setWaDiscount(0);
    setWaTicketItems([]);
    setSelectedProdId('');
    setSelectedSize('');
    setSelectedQty(1);
    setCustomItemPrice(0);
    setProdSearchFilter('');
    setJustCompletedWaOrder(null);
    setIsQuickOrderOpen(true);
  };

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

  // Keyboard shortcut listener: ESC to close order modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedOrder) {
        setSelectedOrder(null);
      }
    };
    if (selectedOrder) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder]);

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
    const customers = DataService.getCustomers();
    const cust = customers.find(c => 
      (order.customerEmail && c.email && c.email.toLowerCase() === order.customerEmail.toLowerCase()) ||
      (cleanPhone.length >= 6 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );
    const tier = getCustomerTier(cust?.totalSpentUSD || order.totalUSD, cust?.totalOrders || 1);
    const itemsList = order.items.map(i => `• ${i.quantity}x ${i.productTitle} (${i.size})`).join('\n');
    const msg = `Hello ${order.customerName} 👋✨\n\nVIP Tier: *${tier.icon} ${tier.label}* (${tier.arabicLabel})\nWe are pleased to inform you of an update on your order #${order.orderNumber}.\nCurrent Status: *${order.status.toUpperCase()}*\n\nItems:\n${itemsList}\n\nTotal: *${formatCurrency(order.totalUSD, currency, settings.lbpRate, settings.eurRate)}*\nAddress: ${order.shippingAddress}, ${order.city || ''}\n\nThank you for shopping with STYLUXE BOUTIQUE! 🛍️`;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // LIVE CRM MATCHING FOR QUICK WHATSAPP ORDER
  const cleanPhoneInput = waCustomerPhone.replace(/[^0-9]/g, '');
  const allCustomers = DataService.getCustomers();
  const matchedCustomer: Customer | undefined = cleanPhoneInput.length >= 6
    ? allCustomers.find(c => c.phone && c.phone.replace(/[^0-9]/g, '').includes(cleanPhoneInput))
    : undefined;

  const chosenProduct = availableProducts.find(p => p.id === selectedProdId);
  const availableSizes = chosenProduct && chosenProduct.stockPerSize 
    ? Object.keys(chosenProduct.stockPerSize).filter(s => (chosenProduct.stockPerSize[s] || 0) > 0)
    : [];

  const handleAddTicketItem = () => {
    if (!chosenProduct) {
      alert('Please select a product first.');
      return;
    }
    const finalSize = selectedSize || availableSizes[0] || 'Standard';
    const finalPrice = customItemPrice > 0 ? customItemPrice : (chosenProduct.salePrice || chosenProduct.price);

    const newItem: OrderItem = {
      productId: chosenProduct.id,
      productTitle: chosenProduct.title,
      brandName: chosenProduct.brandName,
      size: finalSize,
      color: chosenProduct.colors?.[0] || 'Standard',
      priceUSD: finalPrice,
      quantity: Math.max(1, selectedQty),
      imageUrl: chosenProduct.images?.[0] || '/logo.jpg'
    };

    setWaTicketItems(prev => [...prev, newItem]);
    setSelectedProdId('');
    setSelectedSize('');
    setSelectedQty(1);
    setCustomItemPrice(0);
  };

  const handleRemoveTicketItem = (index: number) => {
    setWaTicketItems(prev => prev.filter((_, i) => i !== index));
  };

  const waSubtotalUSD = waTicketItems.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0);
  const waTotalUSD = Math.max(0, waSubtotalUSD + waShippingFee - waDiscount);
  const waTotalLBP = waTotalUSD * (settings.lbpRate || 90000);

  const handleSaveWaOrder = () => {
    if (!waCustomerName.trim()) {
      alert('Please enter client name.');
      return;
    }
    if (!waCustomerPhone.trim()) {
      alert('Please enter client phone number.');
      return;
    }
    if (waTicketItems.length === 0) {
      alert('Please add at least one product to the order.');
      return;
    }

    const orderNumber = `WA-${Math.floor(10000 + Math.random() * 90000)}`;
    const priorSpend = matchedCustomer?.totalSpentUSD || 0;
    const priorOrders = matchedCustomer?.totalOrders || 0;
    const newTier = getCustomerTier(priorSpend + waTotalUSD, priorOrders + 1);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName: waCustomerName.trim(),
      customerEmail: matchedCustomer?.email || `${cleanPhoneInput}@styluxecustomer.com`,
      customerPhone: formatLebanonPhone(waCustomerPhone.trim()),
      shippingAddress: waCustomerAddress.trim() || 'Direct WhatsApp Dispatch',
      city: waCustomerCity.trim() || 'Beirut',
      country: 'Lebanon',
      items: waTicketItems,
      subtotalUSD: waSubtotalUSD,
      discountUSD: waDiscount,
      shippingFeeUSD: waShippingFee,
      totalUSD: waTotalUSD,
      currency: currency as 'USD' | 'LBP' | 'EUR',
      exchangeRate: settings.lbpRate || 90000,
      totalInCurrency: currency === 'LBP' ? waTotalLBP : waTotalUSD,
      status: 'pending',
      paymentMethod: 'cod',
      customerTier: newTier.tier,
      createdAt: new Date().toISOString(),
      notes: waOrderNotes
    };

    DataService.saveOrder(newOrder);
    playLuxuryOrderChime();
    setJustCompletedWaOrder(newOrder);
    loadOrders();
  };

  const handleSendWaClientReceipt = (order: Order) => {
    let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '961' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('961') && cleanPhone.length === 8) {
      cleanPhone = '961' + cleanPhone;
    }
    const customers = DataService.getCustomers();
    const cust = customers.find(c => 
      cleanPhone.length >= 6 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(cleanPhone)
    );
    const tier = getCustomerTier(cust?.totalSpentUSD || order.totalUSD, cust?.totalOrders || 1);
    const itemsList = order.items.map(i => `• ${i.productTitle} (Size: ${i.size}, Qty: ${i.quantity}) - $${i.priceUSD}`).join('\n');
    const msg = `👑 *STYLUXE LUXURY BOUTIQUE - ORDER CONFIRMATION* 👑\n━━━━━━━━━━━━━━━━━━━━\nHello *${order.customerName}* 👋✨\nThank you for ordering with STYLUXE!\n\n🎖️ *Your Loyalty Status:* ${tier.icon} *${tier.label}* (${tier.arabicLabel})\n━━━━━━━━━━━━━━━━━━━━\n🧾 *Order Number:* #${order.orderNumber}\n📍 *Delivery Address:* ${order.shippingAddress}, ${order.city || ''}\n💰 *Total Amount:* $${order.totalUSD} USD (${(order.totalUSD * (settings.lbpRate || 90000)).toLocaleString()} LBP)\n💵 *Payment:* Cash On Delivery (COD)\n\n📦 *Ordered Items:*\n${itemsList}\n━━━━━━━━━━━━━━━━━━━━\n⚡ Your order is registered in our VIP CRM system and being prepared for express courier dispatch. Enjoy your luxury experience! 🛍️`;

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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenQuickOrder}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-black tracking-[0.15em] uppercase rounded shadow-md flex items-center gap-2.5 transition-all shrink-0 border border-emerald-400/40 transform hover:scale-[1.02]"
          >
            <MessageCircle size={18} className="text-amber-300" />
            <span>+ RECORD WHATSAPP ORDER</span>
          </button>

          <button
            onClick={handleExportOrdersCSV}
            className="px-5 py-3 bg-zinc-900 hover:bg-zinc-950 text-white text-xs font-black tracking-[0.15em] uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 border border-zinc-700"
          >
            <Download size={16} />
            <span>EXPORT CSV</span>
          </button>
        </div>
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
                    <div className="font-extrabold text-zinc-950 uppercase text-xs tracking-wider">{order.customerName}</div>
                    {(() => {
                      const customers = DataService.getCustomers();
                      const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                      const cust = customers.find(c => 
                        (order.customerEmail && c.email && c.email.toLowerCase() === order.customerEmail.toLowerCase()) ||
                        (cleanPhone.length >= 6 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
                      );
                      const tier = getCustomerTier(cust?.totalSpentUSD || order.totalUSD, cust?.totalOrders || 1);
                      return (
                        <div className="flex items-center justify-center gap-1.5 pt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${tier.badgeClass}`}>
                            <span>{tier.icon}</span>
                            <span>{tier.label}</span>
                          </span>
                        </div>
                      );
                    })()}
                    <div className="text-[11px] text-zinc-500 font-mono pt-0.5">{order.customerPhone}</div>
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
                    <div className="relative inline-block">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                        className={`text-[11px] font-black uppercase tracking-wider py-1.5 px-3 rounded-full border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200' :
                          order.status === 'processing' ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200' :
                          order.status === 'refunded' ? 'bg-zinc-200 text-zinc-900 border-zinc-400 hover:bg-zinc-300' :
                          'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        <option value="pending">⏳ PENDING</option>
                        <option value="processing">⚙️ PROCESSING</option>
                        <option value="shipped">🚚 SHIPPED</option>
                        <option value="delivered">✅ DELIVERED</option>
                        <option value="cancelled">❌ CANCELLED</option>
                        <option value="refunded">🔄 REFUNDED</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleWhatsAppDispatch(order)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Send WhatsApp update to client"
                      >
                        <MessageCircle size={13} /> <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="View Full Order Details & Items"
                      >
                        <Eye size={13} /> <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setTimeout(() => {
                            if (typeof window !== 'undefined') window.print();
                          }, 150);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-xs font-bold rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Print invoice directly"
                      >
                        <Printer size={13} className="text-amber-500" /> <span>Print</span>
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors text-xs rounded hover:bg-red-50"
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
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans"
        >
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
                {(() => {
                  const customers = DataService.getCustomers();
                  const cleanPhone = (selectedOrder.customerPhone || '').replace(/[^0-9]/g, '');
                  const cust = customers.find(c => 
                    (selectedOrder.customerEmail && c.email && c.email.toLowerCase() === selectedOrder.customerEmail.toLowerCase()) ||
                    (cleanPhone.length >= 6 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
                  );
                  const tier = getCustomerTier(cust?.totalSpentUSD || selectedOrder.totalUSD, cust?.totalOrders || 1);
                  return (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${tier.badgeClass}`}>
                        <span>{tier.icon}</span>
                        <span>{tier.label} ({tier.arabicLabel})</span>
                      </span>
                      <span className="text-xs text-zinc-600 font-bold font-mono">
                        {cust?.totalOrders || 1} Orders • ${cust?.totalSpentUSD || selectedOrder.totalUSD} Lifetime
                      </span>
                    </div>
                  );
                })()}
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
                  <p className="text-[9px] uppercase">{settings.address || 'LEBANON'}</p>
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
                    {settings.address || 'LEBANON'}
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

      {/* QUICK WHATSAPP / DIRECT ORDER MODAL */}
      {isQuickOrderOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border-2 border-zinc-950 w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsQuickOrderOpen(false);
                setJustCompletedWaOrder(null);
              }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-950 transition-colors p-1"
            >
              <X size={24} />
            </button>

            {/* IF JUST COMPLETED: SHOW SUCCESS SCREEN WITH 1-CLICK WHATSAPP DISPATCH */}
            {justCompletedWaOrder ? (
              <div className="text-center py-6 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
                  <CheckCircle2 size={44} />
                </div>

                <div className="space-y-2 border-b border-zinc-200 pb-5">
                  <span className="text-xs font-black tracking-[0.25em] text-emerald-600 uppercase block">
                    ORDER RECORDED & CRM SYNCHRONIZED ✦
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                    WHATSAPP ORDER #{justCompletedWaOrder.orderNumber}
                  </h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1">
                    CLIENT: <strong className="text-zinc-950">{justCompletedWaOrder.customerName}</strong> ({justCompletedWaOrder.customerPhone})
                  </p>
                </div>

                {/* VIP CRM Live Tier Sync Badge */}
                {(() => {
                  const clean = (justCompletedWaOrder.customerPhone || '').replace(/[^0-9]/g, '');
                  const cust = allCustomers.find(c => 
                    clean.length >= 6 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(clean)
                  );
                  const tierInfo = getCustomerTier(cust?.totalSpentUSD || justCompletedWaOrder.totalUSD, cust?.totalOrders || 1);
                  return (
                    <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white p-5 border border-amber-500/30 text-left space-y-2 rounded">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tierInfo.icon}</span>
                          <div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase block">
                              CRM CLIENT VIP STATUS
                            </span>
                            <span className="text-sm font-black tracking-widest text-amber-400 uppercase">
                              {tierInfo.label} • {tierInfo.arabicLabel}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase ${tierInfo.badgeClass}`}>
                          {tierInfo.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-300 gap-2">
                        <span>Total Orders in CRM: <strong className="text-white font-mono">{cust?.totalOrders || 1}</strong></span>
                        <span>CRM Lifetime Spend: <strong className="text-emerald-400 font-mono">${cust?.totalSpentUSD || justCompletedWaOrder.totalUSD} USD</strong></span>
                        <span className="text-amber-300 font-bold">✨ Stock Deducted & Profile Linked</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => handleSendWaClientReceipt(justCompletedWaOrder)}
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black tracking-[0.2em] uppercase rounded shadow-lg flex items-center gap-2.5 transition-all transform hover:scale-[1.02]"
                  >
                    <MessageCircle size={18} />
                    <span>SEND WHATSAPP CONFIRMATION TO CLIENT</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOrder(justCompletedWaOrder);
                      setIsQuickOrderOpen(false);
                    }}
                    className="px-6 py-4 bg-zinc-900 hover:bg-black text-white text-xs font-black tracking-[0.2em] uppercase rounded shadow-md flex items-center gap-2 transition-all"
                  >
                    <Printer size={18} className="text-amber-400" />
                    <span>VIEW / PRINT RECEIPT</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickOrderOpen(false);
                      setJustCompletedWaOrder(null);
                    }}
                    className="px-6 py-4 border-2 border-zinc-300 hover:border-zinc-950 text-zinc-950 text-xs font-black tracking-[0.2em] uppercase rounded"
                  >
                    DONE
                  </button>
                </div>
              </div>
            ) : (
              /* QUICK ORDER INPUT FORM */
              <div className="space-y-6">
                
                {/* Header */}
                <div className="border-b border-zinc-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-300">
                      <MessageCircle size={22} />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                        RECORD WHATSAPP / DIRECT ORDER
                      </h2>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-0.5">
                        Direct WhatsApp order entry with real-time CRM sync and inventory deduction
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Client Information & Live CRM Match */}
                <div className="bg-zinc-50 border border-zinc-200 p-5 rounded space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-xs font-black tracking-[0.15em] text-zinc-950 uppercase flex items-center gap-2">
                      <UserCheck size={16} className="text-emerald-600" />
                      <span>1. CLIENT DETAILS & CRM RECOGNITION</span>
                    </span>
                    {matchedCustomer && (
                      <button
                        type="button"
                        onClick={() => {
                          setWaCustomerName(matchedCustomer.name);
                          if (matchedCustomer.address) setWaCustomerAddress(matchedCustomer.address);
                          if (matchedCustomer.city) setWaCustomerCity(matchedCustomer.city);
                        }}
                        className="text-[11px] font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded transition-colors uppercase tracking-wider"
                      >
                        ⚡ Autofill from CRM Profile
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-black text-zinc-700 uppercase tracking-wider block mb-1">
                        CLIENT PHONE *
                      </label>
                      <input
                        type="text"
                        value={waCustomerPhone}
                        onChange={(e) => setWaCustomerPhone(e.target.value)}
                        onBlur={() => setWaCustomerPhone(prev => formatLebanonPhone(prev))}
                        placeholder="e.g. 70 123 456 or 81713408"
                        className="w-full px-4 py-2.5 border-2 border-zinc-300 font-bold text-zinc-950 rounded text-sm focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-zinc-700 uppercase tracking-wider block mb-1">
                        CLIENT NAME *
                      </label>
                      <input
                        type="text"
                        value={waCustomerName}
                        onChange={(e) => setWaCustomerName(e.target.value)}
                        placeholder="e.g. Hussein Massara"
                        className="w-full px-4 py-2.5 border-2 border-zinc-300 font-bold text-zinc-950 rounded text-sm focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-zinc-700 uppercase tracking-wider block mb-1">
                        DELIVERY ADDRESS
                      </label>
                      <input
                        type="text"
                        value={waCustomerAddress}
                        onChange={(e) => setWaCustomerAddress(e.target.value)}
                        placeholder="Street, Building, Floor..."
                        className="w-full px-4 py-2.5 border-2 border-zinc-300 font-bold text-zinc-950 rounded text-sm focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-zinc-700 uppercase tracking-wider block mb-1">
                        CITY / REGION
                      </label>
                      <input
                        type="text"
                        value={waCustomerCity}
                        onChange={(e) => setWaCustomerCity(e.target.value)}
                        placeholder="e.g. Beirut, Aramoun, Saida..."
                        className="w-full px-4 py-2.5 border-2 border-zinc-300 font-bold text-zinc-950 rounded text-sm focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Live CRM Customer Recognition Banner */}
                  {matchedCustomer ? (
                    (() => {
                      const tier = getCustomerTier(matchedCustomer.totalSpentUSD, matchedCustomer.totalOrders);
                      return (
                        <div className="bg-amber-500/10 border-2 border-amber-500/40 p-3.5 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{tier.icon}</span>
                            <div>
                              <span className="font-black text-amber-950 uppercase tracking-wider block">
                                👑 EXISTING VIP CLIENT FOUND: {matchedCustomer.name}
                              </span>
                              <span className="text-[11px] text-amber-900 font-bold">
                                Tier: {tier.label} ({tier.arabicLabel}) • Past Orders: {matchedCustomer.totalOrders} • Total Spent: ${matchedCustomer.totalSpentUSD} USD
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded">
                            ✓ Order will automatically link to this CRM profile
                          </span>
                        </div>
                      );
                    })()
                  ) : cleanPhoneInput.length >= 6 ? (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-900 font-bold flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600 shrink-0" />
                      <span>New Client: A new VIP CRM profile will be created and synchronized automatically upon saving.</span>
                    </div>
                  ) : null}
                </div>

                {/* Section 2: Order Items in Ticket */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-xs font-black tracking-[0.15em] text-zinc-950 uppercase flex items-center gap-2">
                      <PackagePlus size={16} className="text-emerald-600" />
                      <span>2. ORDER ITEMS ({waTicketItems.length})</span>
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase">
                      Subtotal: <strong className="text-zinc-950 font-mono">${waSubtotalUSD} USD</strong>
                    </span>
                  </div>

                  {waTicketItems.length === 0 ? (
                    <div className="text-center py-6 bg-zinc-50 border border-dashed border-zinc-300 rounded text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      No items added to this order yet. Select a product below and click &quot;Add Item&quot;.
                    </div>
                  ) : (
                    <div className="border border-zinc-200 rounded overflow-hidden">
                      <table className="w-full text-left text-xs uppercase font-bold">
                        <thead className="bg-zinc-100 text-zinc-600 border-b border-zinc-200">
                          <tr>
                            <th className="py-2.5 px-3">Product</th>
                            <th className="py-2.5 px-3 text-center">Size</th>
                            <th className="py-2.5 px-3 text-center">Qty</th>
                            <th className="py-2.5 px-3 text-right">Price</th>
                            <th className="py-2.5 px-3 text-right">Total</th>
                            <th className="py-2.5 px-3 text-center">Remove</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {waTicketItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/80">
                              <td className="py-2.5 px-3 flex items-center gap-2">
                                <img src={item.imageUrl} alt={item.productTitle} className="w-8 h-8 object-cover rounded border border-zinc-200" />
                                <span className="text-zinc-950 truncate max-w-[200px]">{item.productTitle}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-zinc-700">{item.size}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-zinc-950">{item.quantity}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-zinc-700">${item.priceUSD}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-zinc-950">${item.priceUSD * item.quantity}</td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTicketItem(idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 3: Add Product to Order */}
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded space-y-3">
                  <span className="text-[11px] font-black tracking-wider text-zinc-700 uppercase block">
                    + SELECT PRODUCT TO ADD TO TICKET
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Product selector */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase block mb-1">Select Product</label>
                      <select
                        value={selectedProdId}
                        onChange={(e) => {
                          setSelectedProdId(e.target.value);
                          const p = availableProducts.find(prod => prod.id === e.target.value);
                          if (p) {
                            setCustomItemPrice(p.salePrice || p.price);
                            const sizes = p.stockPerSize ? Object.keys(p.stockPerSize).filter(s => (p.stockPerSize[s] || 0) > 0) : [];
                            setSelectedSize(sizes[0] || 'Standard');
                          }
                        }}
                        className="w-full px-3 py-2 border border-zinc-300 font-bold text-xs text-zinc-950 rounded focus:border-zinc-950 focus:outline-none bg-white"
                      >
                        <option value="">-- Choose Product ({availableProducts.length} in catalog) --</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} (${p.salePrice || p.price} USD - Stock: {p.totalStock ?? 'Available'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Size selector */}
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase block mb-1">Size</label>
                      <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        disabled={!chosenProduct}
                        className="w-full px-3 py-2 border border-zinc-300 font-bold text-xs text-zinc-950 rounded focus:border-zinc-950 focus:outline-none bg-white disabled:bg-zinc-100"
                      >
                        {availableSizes.length > 0 ? (
                          availableSizes.map(s => (
                            <option key={s} value={s}>
                              {s} ({chosenProduct?.stockPerSize?.[s] ?? 0} in stock)
                            </option>
                          ))
                        ) : (
                          <option value="Standard">Standard Size</option>
                        )}
                      </select>
                    </div>

                    {/* Price & Quantity & Add Button */}
                    <div className="flex items-end gap-2">
                      <div className="w-20">
                        <label className="text-[10px] font-black text-zinc-500 uppercase block mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={selectedQty}
                          onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-2 border border-zinc-300 font-bold text-xs text-zinc-950 rounded text-center focus:border-zinc-950 focus:outline-none bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTicketItem}
                        disabled={!chosenProduct}
                        className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-[11px] font-black uppercase tracking-wider rounded transition-all"
                      >
                        + ADD
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 4: Pricing, Delivery & Submission */}
                <div className="bg-zinc-950 text-white p-5 rounded space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">
                        SHIPPING FEE ($ USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={waShippingFee}
                        onChange={(e) => setWaShippingFee(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white font-mono font-bold text-xs rounded focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">
                        DISCOUNT ($ USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={waDiscount}
                        onChange={(e) => setWaDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white font-mono font-bold text-xs rounded focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">
                        INTERNAL ORDER NOTES
                      </label>
                      <input
                        type="text"
                        value={waOrderNotes}
                        onChange={(e) => setWaOrderNotes(e.target.value)}
                        placeholder="e.g. WhatsApp chat confirmation"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
                        FINAL TOTAL ORDER AMOUNT:
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          ${waTotalUSD} USD
                        </span>
                        <span className="text-xs font-bold text-amber-300 font-mono">
                          ({waTotalLBP.toLocaleString()} LBP)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsQuickOrderOpen(false)}
                        className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-black uppercase tracking-wider rounded transition-colors flex-1 sm:flex-initial"
                      >
                        CANCEL
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveWaOrder}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white text-xs font-black tracking-[0.2em] uppercase rounded shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial transform hover:scale-[1.02]"
                      >
                        <Sparkles size={16} className="text-amber-300" />
                        <span>CONFIRM & RECORD IN CRM ✦</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
