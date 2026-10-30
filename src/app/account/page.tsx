'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, Package, MapPin, Phone, Mail, Clock, CheckCircle2, 
  Truck, AlertCircle, XCircle, Search, RefreshCw, ShoppingBag, 
  ExternalLink, Printer, ArrowRight, ShieldCheck, LogOut, Edit3, MessageCircle 
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { DataService, formatCurrency, getCustomerTier } from '@/lib/store';
import { Order, OrderStatus, CustomerProfile } from '@/lib/types';

export default function CustomerAccountPage() {
  const router = useRouter();
  const { currency, settings, showToast, addToCart, setIsCartOpen } = useCart();

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'track'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Login / Registration Form States
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('Beirut');
  const [authError, setAuthError] = useState('');

  // Quick Order Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackSearched, setTrackSearched] = useState(false);

  // Selected Order for Receipt Modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Profile Edit Form States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCity, setProfileCity] = useState('Beirut');

  // Load Customer Profile on Mount
  useEffect(() => {
    loadCustomerAndOrders();

    const handleAuthChange = () => loadCustomerAndOrders();
    window.addEventListener('styluxe_customer_auth_changed', handleAuthChange);
    window.addEventListener('styluxe_data_updated', handleAuthChange);
    return () => {
      window.removeEventListener('styluxe_customer_auth_changed', handleAuthChange);
      window.removeEventListener('styluxe_data_updated', handleAuthChange);
    };
  }, []);

  const loadCustomerAndOrders = async () => {
    const user = DataService.getCustomerUser();
    setCustomer(user);
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileEmail(user.email || '');
      setProfileAddress(user.address || '');
      setProfileCity(user.city || 'Beirut');

      // Fetch orders for this customer (local + real-time cloud)
      setLoadingOrders(true);
      const identifier = user.phone || user.email || '';
      try {
        const freshOrders = await DataService.fetchCustomerOrdersRealtime(identifier);
        setOrders(freshOrders);
      } catch (_) {
        setOrders(DataService.getCustomerOrders(identifier));
      } finally {
        setLoadingOrders(false);
      }
    } else {
      setOrders([]);
    }
  };

  // Sign In with Phone or Email
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginIdentifier.trim()) {
      setAuthError('Please enter your mobile phone number or email.');
      return;
    }

    setLoadingOrders(true);
    const identifier = loginIdentifier.trim();
    try {
      const foundOrders = await DataService.fetchCustomerOrdersRealtime(identifier);
      
      let profile: CustomerProfile;
      if (foundOrders.length > 0) {
        const latest = foundOrders[0];
        profile = {
          name: latest.customerName || 'VIP Client',
          phone: latest.customerPhone || identifier,
          email: latest.customerEmail || (identifier.includes('@') ? identifier : ''),
          address: latest.shippingAddress || '',
          city: latest.city || 'Beirut',
        };
      } else {
        // Check existing customers in store
        const existingCusts = DataService.getCustomers();
        const clean = identifier.toLowerCase();
        const numOnly = identifier.replace(/[^0-9]/g, '');
        const match = existingCusts.find(c => 
          (c.email && c.email.toLowerCase() === clean) ||
          (numOnly.length >= 6 && c.phone.replace(/[^0-9]/g, '').includes(numOnly))
        );

        if (match) {
          profile = {
            name: match.name,
            phone: match.phone,
            email: match.email,
            address: match.address,
            city: match.city || 'Beirut',
          };
        } else {
          // New customer identifier
          profile = {
            name: identifier.includes('@') ? identifier.split('@')[0] : 'STYLUXE Client',
            phone: identifier.includes('@') ? '' : identifier,
            email: identifier.includes('@') ? identifier : '',
            address: '',
            city: 'Beirut',
          };
        }
      }

      DataService.saveCustomerUser(profile);
      setCustomer(profile);
      setOrders(foundOrders);
      showToast(`Welcome back, ${profile.name}!`, 'success');
    } catch (err) {
      console.error(err);
      setAuthError('Unable to verify account details. Please try again.');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Register New Account
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regName.trim() || !regPhone.trim()) {
      setAuthError('Full Name and Phone Number are required.');
      return;
    }

    const newProfile: CustomerProfile = {
      name: regName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || `${regPhone.replace(/[^0-9]/g, '')}@styluxecustomer.com`,
      address: regAddress.trim(),
      city: regCity.trim() || 'Beirut',
      createdAt: new Date().toISOString(),
    };

    DataService.saveCustomerUser(newProfile);
    setCustomer(newProfile);
    showToast(`Account created successfully for ${newProfile.name}!`, 'success');
  };

  // Save Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    const updated: CustomerProfile = {
      ...customer,
      name: profileName.trim() || customer.name,
      phone: profilePhone.trim() || customer.phone,
      email: profileEmail.trim() || customer.email,
      address: profileAddress.trim(),
      city: profileCity.trim() || 'Beirut',
    };

    DataService.saveCustomerUser(updated);
    setCustomer(updated);
    showToast('Profile & Shipping address updated!', 'success');
  };

  // Sign Out
  const handleSignOut = () => {
    DataService.logoutCustomerUser();
    setCustomer(null);
    setOrders([]);
    showToast('Signed out of your customer account.', 'info');
  };

  // Real-time Refresh
  const handleRefreshOrders = async () => {
    if (!customer) return;
    setLoadingOrders(true);
    const identifier = customer.phone || customer.email || '';
    const fresh = await DataService.fetchCustomerOrdersRealtime(identifier);
    setOrders(fresh);
    setLoadingOrders(false);
    showToast('Order history updated with live status!', 'success');
  };

  // Direct Order Lookup
  const handleTrackDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackSearched(true);
    try {
      const results = await DataService.fetchCustomerOrdersRealtime(trackQuery.trim());
      if (results.length > 0) {
        setTrackedOrder(results[0]);
      } else {
        setTrackedOrder(null);
      }
    } catch (_) {
      setTrackedOrder(null);
    } finally {
      setTrackLoading(false);
    }
  };

  // Re-order / Buy Again
  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      const existingProduct = DataService.getProductById(item.productId);
      if (existingProduct) {
        addToCart(existingProduct, item.size, item.color || 'Default', item.quantity);
      } else {
        addToCart(
          {
            id: item.productId,
            title: item.productTitle,
            price: item.priceUSD,
            images: [item.imageUrl],
            department: 'men',
            category: 'General',
            brandId: '',
            brandName: item.brandName || 'STYLUXE',
            slug: item.productId,
            stockPerSize: { [item.size]: 10 },
            totalStock: 10,
            colors: [item.color || 'Default'],
            sku: item.productId,
            description: '',
            isFeatured: false,
            isNewArrival: false,
            createdAt: new Date().toISOString()
          },
          item.size,
          item.color || 'Default',
          item.quantity
        );
      }
    });
    showToast(`Items from order #${order.orderNumber} added to shopping bag!`, 'success');
    setIsCartOpen(true);
  };

  // WhatsApp Concierge Link for Order
  const getWhatsAppTrackUrl = (order: Order) => {
    const rawNumber = settings.whatsappNumber || settings.menWhatsappNumber || '96181713408';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanNumber.startsWith('961') ? cleanNumber : `961${cleanNumber.replace(/^0+/, '')}`;
    const tier = getCustomerTier(totalSpentUSD || order.totalUSD, orders.length || 1);
    const text = encodeURIComponent(
      `👑 *STYLUXE CONCIERGE - ORDER TRACKING* 👑\n━━━━━━━━━━━━━━━━━━━━\n🎖️ *CLIENT TIER:* ${tier.icon} *${tier.label}* (${tier.arabicLabel})\n🧾 *Order Number:* #${order.orderNumber}\n👤 *Client:* ${order.customerName}\n📞 *Phone:* ${order.customerPhone}\n💰 *Order Total:* $${order.totalUSD} USD\n━━━━━━━━━━━━━━━━━━━━\nHello STYLUXE Concierge, I would like to check the live tracking status of my order #${order.orderNumber}. Thank you!`
    );
    return `https://wa.me/${phoneWithCode}?text=${text}`;
  };

  // Helper for status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>DELIVERED</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-purple-50 text-purple-700 border border-purple-200">
            <Truck size={13} />
            <span>OUT FOR DELIVERY</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-sky-50 text-sky-700 border border-sky-200">
            <RefreshCw size={13} className="animate-spin" />
            <span>CONFIRMED & PREPARING</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-red-50 text-red-700 border border-red-200">
            <XCircle size={13} />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} />
            <span>PENDING DISPATCH</span>
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const totalSpentUSD = orders.reduce((sum, o) => sum + (Number(o.totalUSD) || 0), 0);

  return (
    <div className="bg-white min-h-screen text-zinc-950 font-sans">
      
      {/* 1. TOP BREADCRUMB & LUXURY HEADER */}
      <div className="border-b border-zinc-200 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <Link href="/" className="hover:text-zinc-950 transition-colors">HOME</Link>
              <span>/</span>
              <span className="text-zinc-950">MY ACCOUNT & ORDERS</span>
            </div>
            {customer && (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-red-600 transition-colors"
                title="Sign out of this device"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">SIGN OUT</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* ============================================================== */}
        {/* CASE 1: CUSTOMER NOT LOGGED IN (AUTH & QUICK ORDER TRACKER) */}
        {/* ============================================================== */}
        {!customer ? (
          <div className="max-w-3xl mx-auto space-y-10">
            
            {/* Header Text */}
            <div className="text-center space-y-3">
              <span className="text-[11px] font-black tracking-[0.25em] text-zinc-400 uppercase block">
                STYLUXE CLIENT PRIVILEGE
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[0.2em] text-zinc-950 uppercase">
                CUSTOMER ACCOUNT
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
                Sign in to view your previous order history, live delivery status, and save your express checkout details.
              </p>
            </div>

            {/* Auth Card with Dual Tabs: Sign In / Register / Direct Track */}
            <div className="bg-white border border-zinc-200 shadow-xl rounded-none overflow-hidden">
              
              {/* Tab Selector */}
              <div className="grid grid-cols-3 border-b border-zinc-200 bg-zinc-50 text-center">
                <button
                  onClick={() => { setAuthMode('signin'); setAuthError(''); }}
                  className={`py-4 text-xs font-black uppercase tracking-widest transition-all ${
                    authMode === 'signin'
                      ? 'bg-white text-zinc-950 border-b-2 border-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-950'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`py-4 text-xs font-black uppercase tracking-widest transition-all ${
                    authMode === 'register'
                      ? 'bg-white text-zinc-950 border-b-2 border-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-950'
                  }`}
                >
                  CREATE ACCOUNT
                </button>
                <button
                  onClick={() => { setAuthMode('signin'); setActiveTab('track'); setAuthError(''); }}
                  className="py-4 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-all border-l border-zinc-200"
                >
                  TRACK ORDER
                </button>
              </div>

              <div className="p-6 sm:p-10 space-y-6">
                
                {authError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* SIGN IN FORM */}
                {authMode === 'signin' && (
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                        MOBILE PHONE NUMBER OR EMAIL ADDRESS
                      </label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="e.g. +961 81 713 408 or hussein@example.com"
                          className="w-full pl-12 pr-4 py-3.5 border border-zinc-300 rounded-none text-sm font-bold focus:border-zinc-950 focus:outline-none"
                          required
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        Enter the phone number or email used during your previous orders.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingOrders}
                      className="w-full py-4 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.25em] uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loadingOrders ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>SEARCHING ARCHIVE...</span>
                        </>
                      ) : (
                        <>
                          <span>ACCESS MY ORDERS & ACCOUNT</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* REGISTER NEW ACCOUNT FORM */}
                {authMode === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                          FULL NAME *
                        </label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Hussein Massara"
                          className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                          PHONE NUMBER (WHATSAPP) *
                        </label>
                        <input
                          type="text"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+961 81 713 408"
                          className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                          EMAIL ADDRESS
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="client@styluxelb.com"
                          className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                          CITY / REGION
                        </label>
                        <select
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none bg-white"
                        >
                          <option value="Beirut">Beirut</option>
                          <option value="Mount Lebanon">Mount Lebanon / Aramoun</option>
                          <option value="Metn">Metn</option>
                          <option value="Keserwan">Keserwan / Jounieh</option>
                          <option value="Tripoli">Tripoli / North</option>
                          <option value="Saida">Saida / South</option>
                          <option value="Tyre">Tyre</option>
                          <option value="Zahle">Zahle / Bekaa</option>
                          <option value="Nabatieh">Nabatieh</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                        DEFAULT DELIVERY ADDRESS
                      </label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Street, Building, Floor, Apartment"
                        className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.25em] uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer pt-3"
                    >
                      <span>CREATE VIP ACCOUNT</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}

              </div>
            </div>

            {/* QUICK GUEST ORDER TRACKER */}
            <div className="border border-zinc-200 bg-zinc-50 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-zinc-950" />
                <h3 className="text-xs font-black tracking-[0.2em] text-zinc-950 uppercase">
                  GUEST ORDER TRACKER (NO LOGIN REQUIRED)
                </h3>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Enter your Order Number (e.g. STX-81389) or mobile number to track dispatch status immediately.
              </p>
              
              <form onSubmit={handleTrackDirectOrder} className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Order # (STX-XXXXX) or Phone"
                  className="flex-1 px-4 py-3 bg-white border border-zinc-300 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-zinc-950"
                  required
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="px-8 py-3 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-widest uppercase transition-colors shrink-0 disabled:opacity-50"
                >
                  {trackLoading ? 'TRACKING...' : 'TRACK ORDER'}
                </button>
              </form>

              {trackSearched && (
                <div className="pt-4 border-t border-zinc-200">
                  {trackedOrder ? (
                    <div className="bg-white p-5 border border-zinc-300 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                        <div>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">ORDER FOUND</span>
                          <span className="font-mono text-base font-black text-zinc-950">#{trackedOrder.orderNumber}</span>
                        </div>
                        {getStatusBadge(trackedOrder.status)}
                      </div>
                      <div className="text-xs uppercase space-y-1 text-zinc-600">
                        <p><strong className="text-zinc-950">Client:</strong> {trackedOrder.customerName}</p>
                        <p><strong className="text-zinc-950">Date:</strong> {new Date(trackedOrder.createdAt).toLocaleDateString()}</p>
                        <p><strong className="text-zinc-950">Total:</strong> ${trackedOrder.totalUSD} USD</p>
                        <p><strong className="text-zinc-950">Items:</strong> {trackedOrder.items.length} designer piece(s)</p>
                      </div>
                      <div className="pt-2 flex gap-3">
                        <a
                          href={getWhatsAppTrackUrl(trackedOrder)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black tracking-widest uppercase inline-flex items-center gap-1.5"
                        >
                          <MessageCircle size={14} />
                          <span>WHATSAPP CONCIERGE</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-wider text-center">
                      No order found matching &quot;{trackQuery}&quot;. Please verify the order number or contact our WhatsApp Concierge.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          
          /* ============================================================== */
          /* CASE 2: CUSTOMER LOGGED IN (VIP PORTAL & ORDERS ARCHIVE) */
          /* ============================================================== */
          <div className="space-y-10">
            
            {/* VIP Client Greeting Banner */}
            <div className="bg-zinc-950 text-white p-6 sm:p-10 relative overflow-hidden shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  {(() => {
                    const tierInfo = getCustomerTier(totalSpentUSD, orders.length);
                    return (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black tracking-[0.25em] uppercase rounded-full">
                        <span>{tierInfo.icon}</span>
                        <span>{tierInfo.label} CLIENT MEMBER • {tierInfo.arabicLabel}</span>
                      </div>
                    );
                  })()}
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[0.18em] uppercase leading-tight">
                    WELCOME BACK, {customer.name}
                  </h1>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest flex flex-wrap items-center gap-4 pt-1">
                    {customer.phone && <span className="flex items-center gap-1"><Phone size={13} /> {customer.phone}</span>}
                    {customer.email && <span className="flex items-center gap-1"><Mail size={13} /> {customer.email}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefreshOrders}
                    disabled={loadingOrders}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black tracking-widest uppercase transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Sync real-time orders status"
                  >
                    <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
                    <span>REFRESH</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-black tracking-widest uppercase transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>SIGN OUT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-1">
                <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase block">TOTAL ORDERS</span>
                <span className="font-serif text-2xl font-bold text-zinc-950 font-mono">{orders.length}</span>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-1">
                <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase block">TOTAL INVESTED</span>
                <span className="font-serif text-2xl font-bold text-emerald-600 font-mono">
                  {formatCurrency(totalSpentUSD, currency, settings.lbpRate, settings.eurRate)}
                </span>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-1">
                <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase block">PRIMARY HUB</span>
                <span className="font-serif text-base sm:text-lg font-bold text-zinc-950 uppercase truncate block">
                  {customer.city || 'BEIRUT, LEBANON'}
                </span>
              </div>
              {(() => {
                const tierInfo = getCustomerTier(totalSpentUSD, orders.length);
                return (
                  <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-1">
                    <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase block">CRM LOYALTY TIER</span>
                    <span className="font-serif text-base sm:text-lg font-bold text-amber-600 uppercase flex items-center gap-1.5 truncate">
                      <span>{tierInfo.icon}</span>
                      <span>{tierInfo.label}</span>
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* VIP LOYALTY PRIVILEGES & PROGRESSION CARD */}
            {(() => {
              const tierInfo = getCustomerTier(totalSpentUSD, orders.length);
              let nextTierMsg = '';
              if (tierInfo.tier === 'bronze') {
                const needed = Math.max(0, 200 - totalSpentUSD);
                nextTierMsg = `Invest $${needed} more to elevate to VIP SILVER status.`;
              } else if (tierInfo.tier === 'silver') {
                const needed = Math.max(0, 500 - totalSpentUSD);
                nextTierMsg = `Invest $${needed} more to elevate to VIP GOLD status with priority preparation & express tracking.`;
              } else if (tierInfo.tier === 'gold') {
                const needed = Math.max(0, 1000 - totalSpentUSD);
                nextTierMsg = `Invest $${needed} more to elevate to royal VIP PLATINUM status with personal stylist concierge.`;
              } else {
                nextTierMsg = 'You hold our highest luxury status: VIP PLATINUM with royal white-glove concierge privileges.';
              }

              return (
                <div className="bg-zinc-950 text-white p-6 sm:p-7 border border-zinc-800 rounded-none shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{tierInfo.icon}</span>
                      <div>
                        <h3 className="text-xs font-black tracking-[0.2em] text-amber-400 uppercase">
                          BOUTIQUE LOYALTY LEVEL: {tierInfo.label} ({tierInfo.arabicLabel})
                        </h3>
                        <p className="text-[11px] text-zinc-400 pt-0.5">
                          Synced with Store WhatsApp: <strong className="text-zinc-200 font-mono">{settings.whatsappNumber || '96181713408'}</strong>
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase self-start sm:self-auto ${tierInfo.badgeClass}`}>
                      ACTIVE CLIENT LEVEL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {tierInfo.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span className="text-amber-400">✦</span>
                    <span className="text-zinc-200 font-bold">{nextTierMsg}</span>
                  </div>
                </div>
              );
            })()}

            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-200 space-x-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === 'orders'
                    ? 'text-zinc-950 border-b-2 border-zinc-950 font-black'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <span>MY ORDERS ({orders.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === 'profile'
                    ? 'text-zinc-950 border-b-2 border-zinc-950 font-black'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <span>PROFILE & SHIPPING DETAILS</span>
              </button>
              <button
                onClick={() => setActiveTab('track')}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === 'track'
                    ? 'text-zinc-950 border-b-2 border-zinc-950 font-black'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <span>TRACK AN ORDER</span>
              </button>
            </div>

            {/* ============================================================== */}
            {/* TAB 1: PREVIOUS ORDERS (الطلبيات السابقة) */}
            {/* ============================================================== */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                
                {/* Status Filter Pills */}
                {orders.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          statusFilter === st
                            ? 'bg-zinc-950 text-white shadow-xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {orders.length === 0 ? (
                  <div className="text-center py-20 px-4 bg-zinc-50 border border-zinc-200 max-w-2xl mx-auto space-y-4">
                    <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                      <ShoppingBag size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 block">
                      ARCHIVE EMPTY
                    </span>
                    <h2 className="font-serif text-2xl font-normal tracking-[0.2em] text-zinc-950 uppercase">
                      NO PREVIOUS ORDERS RECORDED YET
                    </h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                      You haven&apos;t placed any orders with this phone number yet. Explore our latest arrivals to acquire authentic luxury pieces.
                    </p>
                    <div className="pt-4">
                      <Link
                        href="/shop"
                        className="px-8 py-3.5 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-widest uppercase transition-all shadow-md inline-block"
                      >
                        EXPLORE COLLECTIONS &rarr;
                      </Link>
                    </div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    No orders matching filter &quot;{statusFilter}&quot;.
                  </div>
                ) : (
                  
                  /* List of Orders */
                  <div className="space-y-6">
                    {filteredOrders.map(order => (
                      <div 
                        key={order.id} 
                        className="border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        
                        {/* Order Header */}
                        <div className="bg-zinc-50/80 px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm sm:text-base font-black text-zinc-950">
                                #{order.orderNumber}
                              </span>
                              {getStatusBadge(order.status)}
                            </div>
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                              PLACED ON {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                              TOTAL AMOUNT
                            </span>
                            <span className="font-mono text-base sm:text-lg font-black text-emerald-600">
                              {formatCurrency(order.totalUSD, currency, settings.lbpRate, settings.eurRate)}
                            </span>
                          </div>
                        </div>

                        {/* Order Body: Items Grid & Shipping Details */}
                        <div className="p-6 space-y-6">
                          
                          {/* Items List */}
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block">
                              ORDERED PIECES ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                            </span>

                            <div className="divide-y divide-zinc-100">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                                  <div className="flex items-center gap-4">
                                    <div className="w-14 h-18 sm:w-16 sm:h-20 bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0">
                                      <img 
                                        src={item.imageUrl || '/logo.jpg'} 
                                        alt={item.productTitle} 
                                        className="w-full h-full object-cover object-center" 
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      {item.brandName && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
                                          {item.brandName}
                                        </span>
                                      )}
                                      <h3 className="font-serif text-xs sm:text-sm font-bold text-zinc-950 uppercase">
                                        {item.productTitle}
                                      </h3>
                                      <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500 uppercase">
                                        <span>Size: <strong className="text-zinc-900">{item.size}</strong></span>
                                        {item.color && item.color !== 'Default' && (
                                          <span>• Color: <strong className="text-zinc-900">{item.color}</strong></span>
                                        )}
                                        <span>• Qty: <strong className="text-zinc-900">{item.quantity}</strong></span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="font-mono text-xs sm:text-sm font-black text-zinc-950">
                                      ${item.priceUSD * item.quantity} USD
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping & Payment Meta Footer */}
                          <div className="pt-4 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs uppercase text-zinc-600 bg-zinc-50 p-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-zinc-400 tracking-widest block">DELIVERY DESTINATION</span>
                              <p className="font-bold text-zinc-900 flex items-start gap-1.5">
                                <MapPin size={14} className="shrink-0 mt-0.5 text-zinc-500" />
                                <span>{order.shippingAddress}, {order.city || 'Beirut'}, Lebanon</span>
                              </p>
                            </div>
                            <div className="space-y-1 sm:text-right">
                              <span className="text-[10px] font-black text-zinc-400 tracking-widest block">PAYMENT METHOD</span>
                              <p className="font-bold text-zinc-900">
                                {order.paymentMethod === 'cod' ? 'Cash On Delivery (COD)' : order.paymentMethod.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          {/* Interactive Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            
                            <div className="flex flex-wrap items-center gap-2">
                              {/* 1-Click WhatsApp Track */}
                              <a
                                href={getWhatsAppTrackUrl(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black tracking-widest uppercase transition-colors inline-flex items-center gap-1.5 shadow-sm"
                                title="Contact Luxury Concierge for dispatch updates"
                              >
                                <MessageCircle size={14} />
                                <span>TRACK ON WHATSAPP</span>
                              </a>

                              {/* View / Print Receipt */}
                              <button
                                onClick={() => setSelectedReceiptOrder(order)}
                                className="px-4 py-2.5 border border-zinc-300 hover:border-zinc-950 text-zinc-800 hover:text-zinc-950 text-[11px] font-black tracking-widest uppercase transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Printer size={14} />
                                <span>VIEW RECEIPT</span>
                              </button>
                            </div>

                            {/* Re-order */}
                            <button
                              onClick={() => handleReorder(order)}
                              className="px-4 py-2.5 bg-zinc-950 hover:bg-black text-white text-[11px] font-black tracking-widest uppercase transition-colors inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                            >
                              <ShoppingBag size={14} />
                              <span>BUY AGAIN</span>
                            </button>

                          </div>

                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: PROFILE & ADDRESS (بيانات الحساب والعنوان) */}
            {/* ============================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-zinc-200 p-6 sm:p-10 max-w-2xl space-y-6">
                <div className="space-y-1 border-b border-zinc-200 pb-4">
                  <h2 className="font-serif text-xl font-normal tracking-[0.2em] text-zinc-950 uppercase">
                    PERSONAL PROFILE & SHIPPING ADDRESS
                  </h2>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">
                    Keep your primary contact and Lebanese shipping address up to date for 1-click checkout.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                        WHATSAPP PHONE NUMBER
                      </label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                      CITY / REGION
                    </label>
                    <select
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none bg-white"
                    >
                      <option value="Beirut">Beirut</option>
                      <option value="Mount Lebanon">Mount Lebanon / Aramoun</option>
                      <option value="Metn">Metn</option>
                      <option value="Keserwan">Keserwan / Jounieh</option>
                      <option value="Tripoli">Tripoli / North</option>
                      <option value="Saida">Saida / South</option>
                      <option value="Tyre">Tyre</option>
                      <option value="Zahle">Zahle / Bekaa</option>
                      <option value="Nabatieh">Nabatieh</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black tracking-widest text-zinc-700 uppercase block">
                      STREET & BUILDING ADDRESS
                    </label>
                    <textarea
                      rows={3}
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      placeholder="e.g. Aramoun Main Street, Kaser Haidar, 2nd Floor"
                      className="w-full px-4 py-3 border border-zinc-300 text-xs font-bold focus:border-zinc-950 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.25em] uppercase transition-all shadow-md cursor-pointer"
                  >
                    SAVE PROFILE CHANGES
                  </button>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: TRACK ANY ORDER (تتبع سريع) */}
            {/* ============================================================== */}
            {activeTab === 'track' && (
              <div className="border border-zinc-200 bg-zinc-50 p-6 sm:p-10 max-w-2xl space-y-6">
                <div className="space-y-1 border-b border-zinc-200 pb-4">
                  <h2 className="font-serif text-xl font-normal tracking-[0.2em] text-zinc-950 uppercase">
                    DIRECT ORDER TRACKER
                  </h2>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">
                    Lookup any order number or telephone to see courier progress in real time.
                  </p>
                </div>

                <form onSubmit={handleTrackDirectOrder} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Enter Order # (e.g. STX-81389) or Phone"
                    className="flex-1 px-4 py-3.5 bg-white border border-zinc-300 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-zinc-950"
                    required
                  />
                  <button
                    type="submit"
                    disabled={trackLoading}
                    className="px-8 py-3.5 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-widest uppercase transition-colors shrink-0 disabled:opacity-50"
                  >
                    {trackLoading ? 'SEARCHING...' : 'TRACK'}
                  </button>
                </form>

                {trackSearched && (
                  <div className="pt-4">
                    {trackedOrder ? (
                      <div className="bg-white p-6 border border-zinc-300 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                          <div>
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">ORDER FOUND</span>
                            <span className="font-mono text-base font-black text-zinc-950">#{trackedOrder.orderNumber}</span>
                          </div>
                          {getStatusBadge(trackedOrder.status)}
                        </div>
                        <div className="text-xs uppercase space-y-1.5 text-zinc-600">
                          <p><strong className="text-zinc-950">Client:</strong> {trackedOrder.customerName}</p>
                          <p><strong className="text-zinc-950">Date:</strong> {new Date(trackedOrder.createdAt).toLocaleDateString()}</p>
                          <p><strong className="text-zinc-950">Total:</strong> ${trackedOrder.totalUSD} USD</p>
                          <p><strong className="text-zinc-950">Delivery Address:</strong> {trackedOrder.shippingAddress}, {trackedOrder.city || ''}</p>
                        </div>
                        <div className="pt-2 flex gap-3">
                          <a
                            href={getWhatsAppTrackUrl(trackedOrder)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black tracking-widest uppercase inline-flex items-center gap-1.5"
                          >
                            <MessageCircle size={14} />
                            <span>WHATSAPP CONCIERGE TRACKING</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white border border-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-wider text-center">
                        No order found matching &quot;{trackQuery}&quot;. Please check your order number or phone.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* PRINTABLE RECEIPT MODAL */}
      {/* ============================================================== */}
      {selectedReceiptOrder && (
        <div 
          className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setSelectedReceiptOrder(null)}
        >
          <div 
            className="bg-white max-w-lg w-full p-8 shadow-2xl relative space-y-6 text-zinc-950 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <span className="font-serif text-lg font-bold tracking-[0.2em] uppercase">
                STYLUXE INVOICE
              </span>
              <button 
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-zinc-400 hover:text-zinc-950 p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1 border-b border-zinc-200 pb-4">
              <h3 className="font-serif text-2xl font-bold tracking-[0.25em] uppercase">STYLUXE</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {settings.receiptHeader || "LEBANON'S PREMIER LUXURY BOUTIQUE\nBEIRUT - LEBANON | 100% AUTHENTIC GUARANTEED"}
              </p>
              <div className="pt-2 font-mono text-xs font-black">
                ORDER #{selectedReceiptOrder.orderNumber}
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">
                {new Date(selectedReceiptOrder.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Client Info */}
            <div className="text-xs uppercase space-y-1 border-b border-zinc-200 pb-4 text-zinc-700">
              <div className="flex justify-between">
                <span>Client Name:</span>
                <strong className="text-zinc-950">{selectedReceiptOrder.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <strong className="text-zinc-950">{selectedReceiptOrder.customerPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span>Destination:</span>
                <strong className="text-zinc-950">{selectedReceiptOrder.shippingAddress}, {selectedReceiptOrder.city || ''}</strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className="text-emerald-600">{selectedReceiptOrder.status.toUpperCase()}</strong>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 border-b border-zinc-200 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">ITEMS</span>
              <div className="divide-y divide-zinc-100 text-xs">
                {selectedReceiptOrder.items.map((item, i) => (
                  <div key={i} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-zinc-950 uppercase">{item.productTitle}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Size: {item.size} • Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono font-black text-zinc-950">${item.priceUSD * item.quantity} USD</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5 text-xs uppercase text-zinc-700 border-b border-zinc-200 pb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">${selectedReceiptOrder.subtotalUSD} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-mono font-bold">${selectedReceiptOrder.shippingFeeUSD} USD</span>
              </div>
              <div className="flex justify-between text-sm font-black text-zinc-950 pt-1">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-600">
                  {formatCurrency(selectedReceiptOrder.totalUSD, currency, settings.lbpRate, settings.eurRate)}
                </span>
              </div>
            </div>

            {/* Print & Close */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-widest uppercase transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>PRINT RECEIPT</span>
              </button>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-6 py-3 border border-zinc-300 hover:border-zinc-950 text-xs font-black tracking-widest uppercase transition-colors cursor-pointer"
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
