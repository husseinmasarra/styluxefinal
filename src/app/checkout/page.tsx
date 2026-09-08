'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Truck, Banknote, ArrowLeft, Printer, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { DataService, formatCurrency } from '@/lib/store';
import { Order, OrderItem } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart, currency, settings, showToast } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Beirut');
  const [paymentMethod] = useState<'cod'>('cod');
  const [notes, setNotes] = useState('');
  
  // PROMO CODE / COUPON SYSTEM
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');

  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Keyboard shortcut listener: ESC to close auth modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        setIsAuthModalOpen(false);
      }
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen]);

  // Auto load saved customer account details
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('styluxe_customer_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) setCustomerName(parsed.name);
          if (parsed.phone) setCustomerPhone(parsed.phone);
          if (parsed.address) setShippingAddress(parsed.address);
          if (parsed.city) setCity(parsed.city);
          if (parsed.email) setCustomerEmail(parsed.email);
        } catch (e) {}
      } else {
        // Open Auth & Shipping Details Registration Modal if customer info missing
        setIsAuthModalOpen(true);
      }
    }
  }, []);

  const handleSaveCustomerAuthModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem('styluxe_customer_user', JSON.stringify({
        name: customerName,
        phone: customerPhone,
        address: shippingAddress,
        city: city,
        email: customerEmail || `${customerPhone.replace(/[^0-9]/g, '')}@styluxecustomer.com`
      }));
    }

    setIsAuthModalOpen(false);
    showToast('Account & Shipping details saved!', 'success');
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;

    const found = DataService.getCouponByCode(couponInput);
    if (!found) {
      setCouponError('INVALID OR EXPIRED PROMO CODE');
      return;
    }
    const currentSubtotal = cart.reduce((acc, item) => acc + (item.product.salePrice || item.product.price) * item.quantity, 0);
    if (found.minSpendUSD && currentSubtotal < found.minSpendUSD) {
      setCouponError(`MINIMUM SPEND OF $${found.minSpendUSD} REQUIRED FOR THIS COUPON`);
      return;
    }

    setAppliedCoupon(found);
    showToast(`Coupon ${found.code} applied: ${found.discountPercent}% OFF!`, 'success');
  };

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.product.salePrice || item.product.price) * item.quantity, 0);
  const discountUSD = appliedCoupon ? Math.round((subtotalUSD * appliedCoupon.discountPercent) / 100) : 0;
  const freeShippingThreshold = settings.freeShippingThresholdUSD || 500;
  const shippingFeeUSD = subtotalUSD >= freeShippingThreshold ? 0 : (settings.defaultShippingFeeUSD || 25);
  const totalUSD = Math.max(0, subtotalUSD - discountUSD + shippingFeeUSD);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast('Your Shopping Bag is empty', 'error');
      return;
    }

    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      brandName: item.product.brandName,
      size: item.size,
      color: item.color,
      priceUSD: item.product.salePrice || item.product.price,
      quantity: item.quantity,
      imageUrl: item.product.images[0] || ''
    }));

    const orderNumber = `STX-${Math.floor(10000 + Math.random() * 90000)}`;

    let exchangeRate = 1;
    let totalInCurrency = totalUSD;
    if (currency === 'LBP') {
      exchangeRate = settings.lbpRate || 89500;
      totalInCurrency = Math.round(totalUSD * exchangeRate);
    } else if (currency === 'EUR') {
      exchangeRate = settings.eurRate || 0.92;
      totalInCurrency = Number((totalUSD * exchangeRate).toFixed(2));
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      country: 'Lebanon',
      items: orderItems,
      subtotalUSD,
      discountUSD,
      shippingFeeUSD,
      totalUSD,
      currency,
      exchangeRate,
      totalInCurrency,
      status: 'pending',
      paymentMethod,
      createdAt: new Date().toISOString(),
      notes
    };

    DataService.saveOrder(newOrder);
    setCompletedOrder(newOrder);
    clearCart();
    showToast(`Order ${orderNumber} placed successfully!`, 'success');
  };

  // STOREFRONT CUSTOMER SUCCESS VIEW (NO PRINT RECEIPT BUTTON FOR CUSTOMER)
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-8 font-sans">
        <div className="bg-white border border-zinc-200 p-10 sm:p-14 shadow-2xl space-y-8 text-center rounded-none relative overflow-hidden">
          
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
            <CheckCircle2 size={44} />
          </div>

          <div className="space-y-2 border-b border-zinc-200 pb-6">
            <span className="text-xs font-black tracking-[0.25em] text-emerald-600 uppercase block">
              ORDER CONFIRMED & RECEIVED ✦
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-[0.2em] text-zinc-950 uppercase leading-snug">
              THANK YOU FOR YOUR ORDER
            </h1>
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest pt-2">
              ORDER NUMBER: <span className="font-black text-zinc-950 font-mono text-base">{completedOrder.orderNumber}</span>
            </p>
          </div>

          {/* Customer Summary Card */}
          <div className="bg-zinc-50 p-6 border border-zinc-200 text-left space-y-3 text-xs uppercase tracking-wider rounded">
            <div className="flex justify-between border-b border-zinc-200 pb-2.5">
              <span className="font-black text-zinc-950">CLIENT NAME:</span>
              <span className="font-bold text-zinc-800">{completedOrder.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-2.5">
              <span className="font-black text-zinc-950">PHONE NUMBER:</span>
              <span className="font-bold text-amber-600 font-mono">{completedOrder.customerPhone}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-2.5">
              <span className="font-black text-zinc-950">SHIPPING ADDRESS:</span>
              <span className="font-bold text-zinc-800">{completedOrder.shippingAddress}, {completedOrder.city}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-black text-zinc-950">TOTAL ORDER AMOUNT:</span>
              <span className="font-black text-emerald-600 text-sm">
                {formatCurrency(completedOrder.totalUSD, currency, settings.lbpRate, settings.eurRate)}
              </span>
            </div>
          </div>

          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider leading-relaxed">
            Our luxury concierge team has received your order and will contact you via WhatsApp for express courier dispatch.
          </p>

          <div className="pt-4 flex justify-center">
            <Link 
              href="/shop" 
              className="px-10 py-5 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.25em] uppercase transition-all shadow-xl rounded-none"
            >
              CONTINUE SHOPPING
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // EMPTY BAG STATE
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6 font-sans">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200">
          <ShoppingBag size={32} />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-pradaWide text-zinc-400 uppercase block">
            YOUR BAG IS EMPTY
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-prada text-zinc-950 uppercase">
            NO ITEMS IN SHOPPING BAG
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-widest max-w-md mx-auto pt-1">
            You currently have no items selected for checkout. Explore our latest luxury arrivals to fill your bag.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/shop"
            className="inline-block px-10 py-4 bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-sm"
          >
            EXPLORE COLLECTIONS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 hover:text-zinc-950 uppercase">
        <ArrowLeft size={14} /> BACK TO SHOPPING BAG
      </Link>

      <div className="border-b border-zinc-200 pb-4">
        <span className="text-[10px] font-extrabold tracking-pradaWide text-zinc-400 uppercase block">
          SECURE CHECKOUT
        </span>
        <h1 className="text-2xl font-extrabold tracking-prada text-zinc-950 uppercase">
          COMPLETE YOUR ORDER
        </h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left: Customer Information & Delivery Address */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white border border-zinc-200 p-6 space-y-4">
            <h3 className="text-xs font-extrabold tracking-prada text-zinc-950 uppercase border-b border-zinc-200 pb-3">
              1. CLIENT CONTACT INFORMATION
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  FULL NAME *
                </label>
                <input 
                  type="text" 
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Sami Al-Khoury"
                  className="w-full p-2.5 border border-zinc-200 text-xs focus:outline-none focus:border-zinc-950"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  EMAIL ADDRESS *
                </label>
                <input 
                  type="email" 
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="sami@example.com"
                  className="w-full p-2.5 border border-zinc-200 text-xs focus:outline-none focus:border-zinc-950"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  PHONE NUMBER (FOR EXPRESS DELIVERY) *
                </label>
                <input 
                  type="tel" 
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+961 70 123 456"
                  className="w-full p-2.5 border border-zinc-200 text-xs focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-6 space-y-4">
            <h3 className="text-xs font-extrabold tracking-prada text-zinc-950 uppercase border-b border-zinc-200 pb-3">
              2. SHIPPING ADDRESS (LEBANON & WORLDWIDE)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  STREET ADDRESS & BUILDING *
                </label>
                <input 
                  type="text" 
                  required
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="e.g. Achrafieh, Sursock Street, Building 14"
                  className="w-full p-2.5 border border-zinc-200 text-xs focus:outline-none focus:border-zinc-950"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  CITY / REGION *
                </label>
                <input 
                  type="text" 
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Beirut"
                  className="w-full p-2.5 border border-zinc-200 text-xs focus:outline-none focus:border-zinc-950"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  COUNTRY
                </label>
                <input 
                  type="text" 
                  value="Lebanon"
                  disabled
                  className="w-full p-2.5 border border-zinc-200 text-xs bg-zinc-50 text-zinc-500 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-6 space-y-4">
            <h3 className="text-xs font-extrabold tracking-prada text-zinc-950 uppercase border-b border-zinc-200 pb-3 flex items-center justify-between">
              <span>3. PAYMENT METHOD</span>
              <span className="text-[10px] font-black tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                COD ONLY
              </span>
            </h3>
            <div className="p-4 border-2 border-zinc-950 bg-zinc-50 flex items-center gap-4 rounded">
              <div className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Banknote size={20} className="text-amber-400" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-black text-zinc-950 block uppercase tracking-wider">
                  CASH ON DELIVERY (COD)
                </span>
                <span className="text-xs text-zinc-500 block">
                  Pay cash upon arrival of your express luxury courier delivery.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-xs font-extrabold tracking-prada text-zinc-950 uppercase">
                ORDER SUMMARY ({cart.reduce((acc, i) => acc + i.quantity, 0)} ITEMS)
              </h3>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all items from your bag? / هل تريد تفريغ السلة؟')) {
                      clearCart();
                      showToast('Shopping bag emptied / تم تفريغ السلة', 'info');
                    }
                  }}
                  className="text-[10px] font-bold tracking-wider text-red-600 hover:text-red-700 uppercase cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 divide-y divide-zinc-100">
              {cart.map((item, idx) => {
                const itemPrice = item.product.salePrice || item.product.price;
                return (
                  <div key={`${item.product.id}-${item.size}-${item.color || ''}-${idx}`} className="pt-3 first:pt-0 flex gap-3 text-xs">
                    <Link href={`/product/${item.product.id}`} className="shrink-0 group">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.title} 
                        className="w-14 h-18 object-cover bg-zinc-100 rounded border border-zinc-200 group-hover:opacity-90 transition-opacity" 
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block truncate">
                              {item.product.brandName}
                            </span>
                            <Link href={`/product/${item.product.id}`} className="font-bold text-zinc-900 hover:text-zinc-600 line-clamp-1">
                              {item.product.title}
                            </Link>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(item.product.id, item.size, item.color);
                              showToast(`Removed "${item.product.title}" / تم الحذف`, 'info');
                            }}
                            className="text-zinc-400 hover:text-red-600 p-1 transition-colors cursor-pointer shrink-0 ml-1"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Size: <span className="font-semibold text-zinc-800 uppercase">{item.size}</span>
                          {item.color && (
                            <> | Color: <span className="font-semibold text-zinc-800">{item.color}</span></>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        {/* Quantity Controller */}
                        <div className="inline-flex items-center border border-zinc-300 rounded bg-zinc-50 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.product.id, item.size, item.color, item.quantity - 1);
                              } else {
                                removeFromCart(item.product.id, item.size, item.color);
                                showToast(`Removed "${item.product.title}"`, 'info');
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-black hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
                            title={item.quantity === 1 ? 'Remove item' : 'Decrease'}
                            aria-label="Decrease quantity"
                          >
                            {item.quantity === 1 ? <Trash2 size={11} className="text-red-600" /> : <Minus size={11} />}
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-zinc-950 select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateQuantity(item.product.id, item.size, item.color, item.quantity + 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-black hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
                            title="Increase"
                            aria-label="Increase quantity"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <span className="font-extrabold text-zinc-950 text-xs">
                          {formatCurrency(itemPrice * item.quantity, currency, settings.lbpRate, settings.eurRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="border-zinc-200" />

            {/* PROMO / COUPON CODE BOX */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest block">
                PROMO / COUPON CODE
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. STYLUXE10"
                  className="flex-1 p-2.5 border border-zinc-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-zinc-950"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 bg-zinc-950 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-colors"
                >
                  APPLY
                </button>
              </div>
              {couponError && (
                <p className="text-[10px] font-bold text-red-600 uppercase">{couponError}</p>
              )}
              {appliedCoupon && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase flex justify-between items-center rounded">
                  <span>✓ {appliedCoupon.code} ({appliedCoupon.discountPercent}% OFF)</span>
                  <button
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                    className="text-red-600 hover:text-red-800 font-bold ml-2 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <hr className="border-zinc-200" />

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
              </div>
              {discountUSD > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({appliedCoupon?.discountPercent}%):</span>
                  <span>-{formatCurrency(discountUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>Shipping:</span>
                <span>{shippingFeeUSD === 0 ? 'FREE' : formatCurrency(shippingFeeUSD, currency, settings.lbpRate, settings.eurRate)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-zinc-950 pt-2 border-t border-zinc-200 uppercase tracking-widest">
                <span>Total Amount:</span>
                <span>{formatCurrency(totalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-extrabold tracking-prada uppercase flex items-center justify-center gap-2 shadow-xl transition-colors"
            >
              <ShieldCheck size={16} className="text-amber-400" />
              CONFIRM & PLACE ORDER
            </button>

            <div className="text-center text-[10px] text-zinc-400 uppercase tracking-widest">
              COMPLIMENTARY PRADA BOUTIQUE PACKAGING INCLUDED
            </div>
          </div>
        </div>

      </form>

      {/* CUSTOMER ACCOUNT LOGIN & SHIPPING DETAILS REGISTRATION MODAL (ULTRA-LUXURY GLOBAL STYLE) */}
      {isAuthModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAuthModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans"
        >
          <div className="bg-white border border-zinc-200 p-8 sm:p-12 max-w-xl w-full space-y-7 relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-none overflow-hidden animate-fadeIn">
            
            {/* Top Gold Border Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />

            <div className="text-center space-y-2.5 border-b border-zinc-200 pb-6">
              <h2 className="font-serif text-3xl sm:text-4xl font-black tracking-[0.25em] text-zinc-950 uppercase leading-none">
                CLIENT CHECKOUT DETAILS
              </h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pt-1">
                PLEASE REGISTER YOUR CONTACT & SHIPPING ADDRESS TO COMPLETE YOUR ORDER
              </p>
            </div>

            <form onSubmit={handleSaveCustomerAuthModal} className="space-y-5 text-xs font-sans">
              
              {/* 2-Column Grid: Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-[0.15em] block">
                    FULL NAME *
                  </label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="e.g. Hussein Al-Khoury" 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded-none text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50 transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-[0.15em] block">
                    PHONE NUMBER (WHATSAPP) *
                  </label>
                  <input 
                    type="tel" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)} 
                    placeholder="+961 70 123 456" 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded-none text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50 transition-all"
                  />
                </div>

              </div>

              {/* Full Width Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-[0.15em] block">
                  STREET ADDRESS & BUILDING *
                </label>
                <textarea 
                  rows={2} 
                  value={shippingAddress} 
                  onChange={e => setShippingAddress(e.target.value)} 
                  placeholder="e.g. Downtown Beirut, Allenby Street, Luxury Quarter, Bldg #4" 
                  required 
                  className="w-full p-4 border-2 border-zinc-300 rounded-none text-sm font-bold text-zinc-950 placeholder:text-zinc-400 resize-none focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50 transition-all"
                />
              </div>

              {/* 2-Column Grid: City & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-[0.15em] block">
                    CITY / REGION *
                  </label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    placeholder="Beirut" 
                    required 
                    className="w-full p-4 border-2 border-zinc-300 rounded-none text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50 transition-all"
                  />
                </div>

                {/* Email Optional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-[0.15em] block">
                    EMAIL ADDRESS (OPTIONAL)
                  </label>
                  <input 
                    type="email" 
                    value={customerEmail} 
                    onChange={e => setCustomerEmail(e.target.value)} 
                    placeholder="vip@example.com" 
                    className="w-full p-4 border-2 border-zinc-300 rounded-none text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50 transition-all"
                  />
                </div>

              </div>

              {/* Action Button */}
              <button 
                type="submit" 
                className="w-full py-5 bg-zinc-950 hover:bg-black text-white hover:text-amber-300 text-xs sm:text-sm font-black tracking-[0.25em] uppercase transition-all shadow-xl rounded-none flex items-center justify-center gap-3 group mt-6"
              >
                <ShieldCheck size={18} className="text-amber-400" />
                <span>CONFIRM DETAILS & CONTINUE ORDER</span>
              </button>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}
