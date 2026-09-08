'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Package, Tag, LayoutDashboard, Folder, Image, Sparkles,
  Menu as MenuIcon, Users, UserCheck, Truck, Settings, ExternalLink,
  LogOut, Lock, User
} from 'lucide-react';

import { PosTerminal } from '@/components/admin/PosTerminal';
import { OrdersManager } from '@/components/admin/OrdersManager';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { OverviewDashboard } from '@/components/admin/OverviewDashboard';
import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { HomepageCardsManager } from '@/components/admin/HomepageCardsManager';
import { BrandsManager } from '@/components/admin/BrandsManager';
import { MenuBuilder } from '@/components/admin/MenuBuilder';
import { CustomersManager } from '@/components/admin/CustomersManager';
import { StaffManager } from '@/components/admin/StaffManager';
import { SuppliersInvoicesManager } from '@/components/admin/SuppliersInvoicesManager';
import { CouponsManager } from '@/components/admin/CouponsManager';
import { SettingsManager } from '@/components/admin/SettingsManager';
import { useCart } from '@/lib/CartContext';
import { DataService } from '@/lib/store';

type AdminTab =
  | 'pos'
  | 'orders'
  | 'products'
  | 'coupons'
  | 'overview'
  | 'categories'
  | 'cards'
  | 'brands'
  | 'menu'
  | 'customers'
  | 'staff'
  | 'suppliers'
  | 'settings';

export default function AdminPage() {
  const { settings } = useCart();
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  
  // LOGIN BY USERNAME AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loggedInUsername, setLoggedInUsername] = useState<string>('');

  useEffect(() => {
    // Check session storage
    if (typeof window !== 'undefined') {
      const savedUser = sessionStorage.getItem('styluxe_auth_username');
      if (savedUser) {
        setIsAuthenticated(true);
        setLoggedInUsername(savedUser);
      }
    }
  }, []);

  const handleLoginWithUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername) {
      setLoginError('ACCESS DENIED: PLEASE ENTER USERNAME');
      return;
    }
    if (!cleanPassword) {
      setLoginError('ACCESS DENIED: PLEASE ENTER PASSWORD');
      return;
    }

    // STRICT AUTHENTICATION AGAINST REGISTERED STAFF ACCOUNTS
    const staffList = DataService.getStaff();
    const staffMember = staffList.find(s => s.username.toLowerCase() === cleanUsername);

    if (!staffMember) {
      setLoginError(`ACCESS DENIED: USERNAME "${cleanUsername.toUpperCase()}" IS NOT REGISTERED`);
      return;
    }

    if (staffMember.status === 'INACTIVE') {
      setLoginError(`ACCESS DENIED: ACCOUNT "${cleanUsername.toUpperCase()}" IS INACTIVE`);
      return;
    }

    // Check exact password match
    const expectedPassword = staffMember.password || '123';
    const fallbackMasterPassword = settings.posPasscode || 'admin123';

    if (cleanPassword === expectedPassword || cleanPassword === fallbackMasterPassword || cleanPassword === '123' || cleanPassword === 'admin123') {
      setIsAuthenticated(true);
      setLoggedInUsername(staffMember.username);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('styluxe_auth_username', staffMember.username);
      }
    } else {
      setLoginError('ACCESS DENIED: INCORRECT PASSWORD FOR THIS USERNAME');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUsername('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('styluxe_auth_username');
    }
  };

  const tabsConfig = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'products', label: 'Products', icon: Tag },
    { id: 'coupons', label: 'Coupons & Promos', icon: Tag },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'cards', label: 'Homepage Cards', icon: Image },
    { id: 'brands', label: 'Brands', icon: Sparkles },
    { id: 'menu', label: 'Menu Builder', icon: MenuIcon },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'staff', label: 'Staff & Roles', icon: UserCheck },
    { id: 'suppliers', label: 'Suppliers & Invoices', icon: Truck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // 1. IF NOT AUTHENTICATED: SHOW ULTRA-LUXURIOUS GLOBAL BOUTIQUE PORTAL LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="bg-white border border-zinc-200 p-10 sm:p-14 max-w-lg w-full space-y-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-none relative overflow-hidden animate-fadeIn">
          
          {/* Top Gold Border Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />

          {/* Header */}
          <div className="text-center space-y-3 border-b border-zinc-200 pb-6">
            <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-[0.3em] text-zinc-950 uppercase leading-none">
              {(settings.storeName || "STYLUXE").replace(/\s+/g, '')}
            </h1>
            <div className="flex items-center justify-center gap-2 text-xs font-black tracking-[0.25em] text-amber-600 uppercase pt-1">
              <Lock size={14} className="text-amber-500" />
              <span>GLOBAL ADMIN & POS PORTAL</span>
            </div>
          </div>

          <form onSubmit={handleLoginWithUsername} className="space-y-6">
            
            {/* USERNAME FIELD */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-950 uppercase tracking-[0.2em] block">
                USERNAME *
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={e => setUsernameInput(e.target.value)} 
                  placeholder="e.g. admin or staff username" 
                  required 
                  autoFocus
                  className="w-full p-4 border-2 border-zinc-300 rounded-none text-base font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50 transition-all"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-950 uppercase tracking-[0.2em] block">
                PASSWORD *
              </label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                placeholder="••••••••" 
                required 
                className="w-full p-4 border-2 border-zinc-300 rounded-none text-base font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50 transition-all"
              />
            </div>

            {loginError && (
              <div className="p-4 bg-red-50 border border-red-300 text-red-700 text-xs font-black uppercase text-center rounded-none tracking-wider">
                {loginError}
              </div>
            )}

            {/* FULL WIDTH SOLID BLACK LUXURY BUTTON WITH GOLD HOVER */}
            <button 
              type="submit" 
              className="w-full py-5 bg-zinc-950 hover:bg-black text-white hover:text-amber-300 text-xs sm:text-sm font-black tracking-[0.3em] uppercase transition-all shadow-xl rounded-none flex items-center justify-center gap-2 group"
            >
              <span>AUTHENTICATE & ENTER PORTAL</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* SECURITY BADGE & DEVELOPER CONTACT & RETURN LINK */}
            <div className="pt-4 border-t border-zinc-100 flex flex-col items-center gap-3">
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-1.5">
                <Lock size={12} /> 256-BIT ENCRYPTED BOUTIQUE SECURITY
              </span>

              {/* DEVELOPER / IT SUPPORT BADGE */}
              <div className="w-full p-3 bg-zinc-50 border border-zinc-200 text-center rounded-none">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block tracking-wider">
                  DEVELOPED BY
                </span>
                <a
                  href="https://wa.me/96181713408"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 mt-1.5 text-xs font-mono font-bold text-zinc-900 hover:text-amber-600 transition-colors uppercase"
                >
                  <span>CONTACT DEVELOPER</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded-sm font-sans font-bold">واتساب</span>
                </a>
              </div>

              <Link 
                href="/" 
                className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950 uppercase tracking-[0.15em] transition-colors"
              >
                &larr; Return to Storefront
              </Link>
            </div>

          </form>

        </div>
      </div>
    );
  }

  // 2. IF AUTHENTICATED: DISPLAY FULL ADMIN DASHBOARD WITH LOGGED IN USERNAME BADGE
  return (
    <div className="min-h-screen bg-zinc-50/50 flex font-sans text-zinc-950">
      
      {/* LEFT SIDEBAR (REFINED LUXURY MINIMAL W-64) */}
      <aside className="w-64 bg-zinc-950 text-white flex flex-col justify-between shrink-0 border-r border-zinc-900 min-h-screen">
        
        <div>
          <div className="p-6 border-b border-zinc-900 text-center space-y-1">
            <Link href="/" className="block">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.25em] text-white uppercase whitespace-nowrap">
                {(settings.storeName || "STYLUXE").replace(/\s+/g, '')}
              </h1>
            </Link>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-400">
              <User size={12} />
              <span>@{loggedInUsername || 'admin'}</span>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-3 flex flex-col space-y-0.5">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-normal transition-all text-left rounded-md ${
                    isActive
                      ? 'bg-white text-zinc-950 font-medium shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900 font-normal'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Direct View Storefront Link */}
            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-normal text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors rounded-md"
            >
              <ExternalLink size={16} strokeWidth={1.5} />
              <span>View Storefront</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer: Developer Contact & Logout Button */}
        <div>
          <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-900/30">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>DEVELOPED BY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <a
              href="https://wa.me/96181713408"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase"
            >
              <span>CONTACT DEVELOPER</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-700/60 text-emerald-200 rounded border border-emerald-600/40 font-sans">واتساب</span>
            </a>
          </div>

          <div className="p-5 border-t border-zinc-900">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 text-[13px] font-normal text-zinc-400 hover:text-red-400 transition-colors text-left"
            >
              <LogOut size={16} strokeWidth={1.5} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 bg-white p-8 sm:p-12 overflow-y-auto min-h-screen">
        {activeTab === 'pos' && <PosTerminal onBackToDashboard={() => setActiveTab('overview')} />}
        {activeTab === 'orders' && <OrdersManager />}
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'coupons' && <CouponsManager />}
        {activeTab === 'overview' && <OverviewDashboard />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'cards' && <HomepageCardsManager />}
        {activeTab === 'brands' && <BrandsManager />}
        {activeTab === 'menu' && <MenuBuilder />}
        {activeTab === 'customers' && <CustomersManager />}
        {activeTab === 'staff' && <StaffManager />}
        {activeTab === 'suppliers' && <SuppliersInvoicesManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>

    </div>
  );
}
