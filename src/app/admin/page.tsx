'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Package, Tag, LayoutDashboard, Folder, Image, Sparkles,
  Menu as MenuIcon, Users, UserCheck, Truck, Settings, ExternalLink,
  LogOut, Lock, User, ShieldAlert, Clock, AlertTriangle
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
import { StaffMember } from '@/lib/types';
import { getStaffAllowedTabs } from '@/lib/permissions';
import { SecurityService, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES } from '@/lib/security';

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
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);

  // BRUTE-FORCE SECURITY & LOCKOUT STATE
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(MAX_LOGIN_ATTEMPTS);
  const [honeypotValue, setHoneypotValue] = useState<string>('');

  useEffect(() => {
    // Check security lockout state on load
    const locked = SecurityService.isLockedOut();
    setIsLockedOut(locked);
    if (locked) {
      setRemainingLockoutSeconds(SecurityService.getRemainingLockoutSeconds());
    } else {
      const failed = SecurityService.getFailedAttempts();
      setRemainingAttempts(Math.max(0, MAX_LOGIN_ATTEMPTS - failed));
    }

    // Check cryptographic session token
    const verifySession = async () => {
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('styluxe_auth_token');
        const savedUser = sessionStorage.getItem('styluxe_auth_username');
        if (token) {
          const verified = await SecurityService.verifySecureSessionToken(token);
          if (verified.valid && verified.username) {
            setIsAuthenticated(true);
            setLoggedInUsername(verified.username);
            const staffList = DataService.getStaff();
            const member = staffList.find(s => s.username.toLowerCase() === verified.username.toLowerCase()) || null;
            setCurrentStaff(member);
            return;
          }
        }
        if (savedUser) {
          setIsAuthenticated(true);
          setLoggedInUsername(savedUser);
          const staffList = DataService.getStaff();
          const member = staffList.find(s => s.username.toLowerCase() === savedUser.toLowerCase()) || null;
          setCurrentStaff(member);
        }
      }
    };
    verifySession();
  }, []);

  // Live countdown timer while account is locked out
  useEffect(() => {
    if (!isLockedOut) return;

    const interval = setInterval(() => {
      const remaining = SecurityService.getRemainingLockoutSeconds();
      if (remaining <= 0) {
        setIsLockedOut(false);
        setRemainingLockoutSeconds(0);
        setRemainingAttempts(MAX_LOGIN_ATTEMPTS);
        setLoginError('');
      } else {
        setRemainingLockoutSeconds(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut]);

  const formatLockoutTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const allowedTabIds = React.useMemo(() => {
    if (!isAuthenticated) return [];
    return getStaffAllowedTabs(currentStaff);
  }, [isAuthenticated, currentStaff]);

  // Strictly enforce: activeTab is ALWAYS within the staff member's permitted tabs
  useEffect(() => {
    if (isAuthenticated && allowedTabIds.length > 0) {
      if (!allowedTabIds.includes(activeTab)) {
        setActiveTab(allowedTabIds[0] as AdminTab);
      }
    }
  }, [isAuthenticated, allowedTabIds, activeTab]);

  const handleLoginWithUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // 1. BOT TRAP / HONEYPOT CHECK
    if (honeypotValue && honeypotValue.trim() !== '') {
      setLoginError('ACCESS DENIED: AUTOMATED BOT DETECTED');
      return;
    }

    // 2. CHECK IF CURRENTLY LOCKED OUT
    if (SecurityService.isLockedOut()) {
      setIsLockedOut(true);
      const remaining = SecurityService.getRemainingLockoutSeconds();
      setRemainingLockoutSeconds(remaining);
      setLoginError(`⛔ Login temporarily locked for security after 5 failed attempts. Please wait (${formatLockoutTime(remaining)}).`);
      return;
    }

    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername) {
      setLoginError('Please enter username');
      return;
    }
    if (!cleanPassword) {
      setLoginError('Please enter password');
      return;
    }

    // 3. AUTHENTICATE AGAINST REGISTERED STAFF ACCOUNTS
    const staffList = DataService.getStaff();
    const staffMember = staffList.find(s => s.username.toLowerCase() === cleanUsername);

    if (!staffMember) {
      const sec = SecurityService.recordFailedAttempt(cleanUsername);
      if (sec.isLocked) {
        setIsLockedOut(true);
        setRemainingLockoutSeconds(sec.lockoutSeconds);
        setLoginError(`⛔ Login locked for ${LOCKOUT_DURATION_MINUTES} minutes for system security after 5 failed attempts.`);
      } else {
        setRemainingAttempts(sec.remainingAttempts);
        setLoginError(`Username "${cleanUsername.toUpperCase()}" not found. ${sec.remainingAttempts} attempt(s) remaining before temporary lockout.`);
      }
      return;
    }

    if (staffMember.status === 'INACTIVE') {
      setLoginError(`Account "${cleanUsername.toUpperCase()}" is currently suspended by administration.`);
      return;
    }

    // 4. CHECK STRICT PASSWORD MATCH WITH CRYPTOGRAPHIC VERIFICATION
    const expectedPassword = staffMember.password;
    const fallbackMasterPassword = settings.posPasscode;

    const isMemberMatch = await SecurityService.verifyPassword(cleanPassword, expectedPassword);
    const isMasterMatch = fallbackMasterPassword ? await SecurityService.verifyPassword(cleanPassword, fallbackMasterPassword) : false;

    const isPasswordCorrect = isMemberMatch || isMasterMatch;

    if (isPasswordCorrect) {
      // Upgrade plaintext password to SHA-256 hash if not yet hashed
      if (expectedPassword && !expectedPassword.startsWith('sha256$')) {
        const secureHash = await SecurityService.hashPassword(cleanPassword);
        DataService.saveStaff({
          ...staffMember,
          password: secureHash
        });
      }

      // SUCCESSFUL LOGIN: RESET SECURITY COUNTERS
      SecurityService.recordSuccessfulLogin(staffMember.username);
      setIsLockedOut(false);
      setRemainingAttempts(MAX_LOGIN_ATTEMPTS);
      setRemainingLockoutSeconds(0);

      setIsAuthenticated(true);
      setLoggedInUsername(staffMember.username);
      setCurrentStaff(staffMember);

      // Auto-route employee to their first authorized tab
      const allowed = getStaffAllowedTabs(staffMember);
      if (allowed.length > 0) {
        setActiveTab(allowed[0] as AdminTab);
      }

      // Store cryptographically signed session token
      if (typeof window !== 'undefined') {
        const token = await SecurityService.createSecureSessionToken(staffMember.username);
        sessionStorage.setItem('styluxe_auth_token', token);
        sessionStorage.setItem('styluxe_auth_username', staffMember.username);
      }
    } else {
      // FAILED ATTEMPT: INCREMENT COUNTER & LOCK IF 5 REACHED
      const sec = SecurityService.recordFailedAttempt(cleanUsername);
      if (sec.isLocked) {
        setIsLockedOut(true);
        setRemainingLockoutSeconds(sec.lockoutSeconds);
        setLoginError(`⛔ Login locked for ${LOCKOUT_DURATION_MINUTES} minutes due to repeated incorrect password attempts.`);
      } else {
        setRemainingAttempts(sec.remainingAttempts);
        setLoginError(`Incorrect password. ${sec.remainingAttempts} attempt(s) remaining before security lockout.`);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUsername('');
    setCurrentStaff(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('styluxe_auth_token');
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
    { id: 'cards', label: 'Hero Banner & Cards', icon: Image },
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
            
            {/* HONEYPOT ANTI-BOT INVISIBLE FIELD */}
            <div className="hidden opacity-0 absolute -z-50 pointer-events-none" aria-hidden="true">
              <input 
                type="text" 
                name="website_protection_trap" 
                tabIndex={-1} 
                autoComplete="off" 
                value={honeypotValue} 
                onChange={e => setHoneypotValue(e.target.value)} 
              />
            </div>

            {/* LIVE LOCKOUT WARNING & COUNTDOWN BANNER */}
            {isLockedOut ? (
              <div className="p-6 bg-red-600 text-white border-2 border-red-800 space-y-3 text-center shadow-xl animate-pulse">
                <div className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider">
                  <ShieldAlert size={22} className="text-yellow-300" />
                  <span>LOGIN FROZEN FOR SYSTEM SECURITY</span>
                </div>
                <p className="text-xs font-semibold text-red-100 leading-relaxed">
                  Maximum login attempts reached (5 failed attempts). Please wait until the lockout timer expires:
                </p>
                <div className="text-3xl font-mono font-black text-yellow-300 tracking-widest pt-1 flex items-center justify-center gap-2">
                  <Clock size={24} />
                  <span>{formatLockoutTime(remainingLockoutSeconds)}</span>
                </div>
              </div>
            ) : remainingAttempts < MAX_LOGIN_ATTEMPTS ? (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-400 text-amber-900 text-xs font-black uppercase text-center tracking-wider flex items-center justify-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Security warning: {remainingAttempts} attempt(s) remaining before system lockout</span>
              </div>
            ) : null}

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
                  autoFocus={!isLockedOut}
                  disabled={isLockedOut}
                  className={`w-full p-4 border-2 rounded-none text-base font-bold transition-all ${
                    isLockedOut
                      ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60'
                      : 'border-zinc-300 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50'
                  }`}
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
                disabled={isLockedOut}
                className={`w-full p-4 border-2 rounded-none text-base font-bold transition-all ${
                  isLockedOut
                    ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60'
                    : 'border-zinc-300 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-zinc-50/50'
                }`}
              />
            </div>

            {loginError && !isLockedOut && (
              <div className="p-4 bg-red-50 border border-red-300 text-red-700 text-xs font-black uppercase text-center rounded-none tracking-wider">
                {loginError}
              </div>
            )}

            {/* FULL WIDTH BUTTON WITH LOCKOUT STATUS */}
            <button 
              type="submit" 
              disabled={isLockedOut}
              className={`w-full py-5 text-xs sm:text-sm font-black tracking-[0.3em] uppercase transition-all shadow-xl rounded-none flex items-center justify-center gap-2 ${
                isLockedOut
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed border border-zinc-300'
                  : 'bg-zinc-950 hover:bg-black text-white hover:text-amber-300 group cursor-pointer'
              }`}
            >
              {isLockedOut ? (
                <>
                  <Lock size={16} className="text-red-600" />
                  <span>LOCKED ({formatLockoutTime(remainingLockoutSeconds)})</span>
                </>
              ) : (
                <>
                  <span>AUTHENTICATE & ENTER PORTAL</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
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
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded-sm font-sans font-bold">WhatsApp</span>
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
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-400">
              <User size={12} />
              <span>@{loggedInUsername || 'admin'}</span>
              {currentStaff && (
                <span className="text-[9px] px-2 py-0.5 bg-zinc-900 text-amber-400 rounded-full font-mono uppercase font-bold border border-zinc-800">
                  {currentStaff.role}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Menu Links (strictly restricted to staff member's permitted tabs) */}
          <nav className="p-3 flex flex-col space-y-0.5">
            {tabsConfig
              .filter(tab => allowedTabIds.includes(tab.id))
              .map((tab) => {
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
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-700/60 text-emerald-200 rounded border border-emerald-600/40 font-sans">WhatsApp</span>
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

      {/* MAIN WORKSPACE (STRICT ROLE PERMISSION GUARD) */}
      <main className="flex-1 bg-white p-8 sm:p-12 overflow-y-auto min-h-screen">
        {!allowedTabIds.includes(activeTab) ? (
          <div className="max-w-md mx-auto my-20 p-8 text-center bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <h2 className="font-serif text-xl font-bold text-zinc-950 uppercase">UNAUTHORIZED SECTION</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your access is restricted based on your role assigned by store management.
            </p>
            {allowedTabIds[0] && (
              <button
                onClick={() => setActiveTab(allowedTabIds[0] as AdminTab)}
                className="px-6 py-2.5 bg-zinc-950 hover:bg-black text-white text-xs font-bold uppercase rounded shadow"
              >
                GO TO AUTHORIZED SECTION
              </button>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'pos' && <PosTerminal onBackToDashboard={() => setActiveTab(allowedTabIds.includes('overview') ? 'overview' : (allowedTabIds[0] as AdminTab))} />}
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
          </>
        )}
      </main>

    </div>
  );
}
