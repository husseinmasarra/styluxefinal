'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Instagram, Facebook, Globe, Send, Lock, Ruler } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';

export function Footer() {
  const { settings } = useCart();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const addressText = mounted ? (settings.address || "Downtown Beirut, Allenby Street, Luxury Quarter") : "Downtown Beirut, Allenby Street, Luxury Quarter";
  const phoneText = mounted ? (settings.phone || "+961 70 123 456") : "+961 70 123 456";
  const emailText = mounted ? (settings.email || "vip@styluxelb.com") : "vip@styluxelb.com";

  return (
    <footer className="bg-black text-white border-t border-zinc-900 pt-16 pb-12 px-6 sm:px-12 lg:px-16 w-full">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* 1. TOP BRAND HEADER IN SOLID BLACK - FULL WIDTH BALANCED */}
        <div className="text-center space-y-4 pb-8 border-b border-zinc-900">
          <Link href="/" className="inline-flex flex-col items-center justify-center group" title="STYLUXE">
            <img 
              src="/logo.jpg" 
              alt="STYLUXE" 
              className="h-14 sm:h-18 w-auto mx-auto invert object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>
          <p className="text-xs sm:text-sm font-medium text-zinc-400 max-w-2xl mx-auto tracking-wider uppercase leading-relaxed">
            Lebanon's premier luxury fashion boutique. Curated authentic designer apparel, footwear, and accessories from global fashion houses.
          </p>

          <div className="flex items-center justify-center gap-6 pt-2 text-zinc-400">
            <a href="#" aria-label="Instagram" className="hover:text-white transition-colors p-2.5 bg-zinc-900 rounded-full">
              <Instagram size={20} />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-white transition-colors p-2.5 bg-zinc-900 rounded-full">
              <Facebook size={20} />
            </a>
            <a href="#" aria-label="Website" className="hover:text-white transition-colors p-2.5 bg-zinc-900 rounded-full">
              <Globe size={20} />
            </a>
          </div>
        </div>

        {/* 2. THREE-COLUMN LUXURY FOOTER LAYOUT MATCHING 1400PX WIDE PAGE BOUNDARIES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16 pt-4">
          
          {/* Column 1: DEPARTMENTS */}
          <div className="space-y-4">
            <h3 className="text-xs sm:text-sm font-black tracking-[0.25em] text-white uppercase border-b border-zinc-800 pb-3">
              DEPARTMENTS
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm font-bold tracking-wider text-zinc-400 uppercase">
              <li>
                <Link href="/shop?department=women" className="hover:text-white transition-colors block">
                  WOMEN'S HIGH FASHION
                </Link>
              </li>
              <li>
                <Link href="/shop?department=men" className="hover:text-white transition-colors block">
                  MEN'S READY-TO-WEAR
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors block">
                  DESIGNER HOUSES
                </Link>
              </li>
              <li>
                <Link href="/shop?sale=true" className="text-red-500 hover:text-red-400 transition-colors block font-extrabold">
                  LIMITED SALE
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: CLIENT SERVICES & ADMIN ACCESS */}
          <div className="space-y-4">
            <h3 className="text-xs sm:text-sm font-black tracking-[0.25em] text-white uppercase border-b border-zinc-800 pb-3">
              CLIENT SERVICES
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm font-bold tracking-wider text-zinc-400 uppercase">
              <li className="text-zinc-300">
                {addressText}
              </li>
              <li className="text-zinc-300">
                PHONE: {phoneText}
              </li>
              <li className="text-zinc-300">
                EMAIL: {emailText}
              </li>
              <li>
                <button
                  onClick={() => openSizeGuide()}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors uppercase font-extrabold cursor-pointer"
                >
                  <Ruler size={14} />
                  <span>SIZE GUIDE</span>
                </button>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors block">
                  SHIPPING & DELIVERY
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors block">
                  RETURNS & EXCHANGES
                </Link>
              </li>
              <li>
                <Link href="/authenticity" className="hover:text-amber-300 transition-colors block text-zinc-300">
                  100% AUTHENTICITY GUARANTEE
                </Link>
              </li>
              <li className="pt-3 border-t border-zinc-850">
                <span className="text-[10px] text-zinc-500 block font-mono">DEVELOPER / الاتصال بالمبرمج</span>
                <a
                  href="https://wa.me/96181713408"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors font-mono font-bold text-xs uppercase"
                >
                  <span>CONTACT DEVELOPER</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: JOIN STYLUXE VIP NEWSLETTER */}
          <div className="space-y-4">
            <h3 className="text-xs sm:text-sm font-black tracking-[0.25em] text-white uppercase border-b border-zinc-800 pb-3">
              JOIN STYLUXE VIP
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-zinc-400 leading-relaxed uppercase tracking-wider">
              Subscribe to receive exclusive access to private runway collection drops and private sales.
            </p>
            <form 
              onSubmit={(e) => { e.preventDefault(); alert('Subscribed to STYLUXE VIP list!'); }} 
              className="flex items-center border border-zinc-700 rounded overflow-hidden bg-zinc-900 mt-2"
            >
              <input 
                type="email" 
                placeholder="ENTER YOUR EMAIL" 
                required
                className="w-full px-4 py-3.5 bg-zinc-900 text-xs sm:text-sm font-bold text-white placeholder:text-zinc-500 focus:outline-none uppercase"
              />
              <button 
                type="submit"
                className="px-6 py-3.5 bg-white text-zinc-950 text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>JOIN</span>
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

        {/* 3. BOTTOM COPYRIGHT BAR IN SOLID BLACK - WITH SECRET TRIPLE-CLICK ACCESS TO ADMIN */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest select-none">
          <p 
            onClick={(e) => {
              if (e.detail === 3) {
                window.location.href = '/admin';
              }
            }}
            className="cursor-default"
            title="STYLUXE Boutique"
          >
            © 2026 {(settings.storeName || "STYLUXE").replace(/\s+/g, '')} BOUTIQUE. ALL RIGHTS RESERVED.
          </p>
          <p className="text-zinc-500 text-xs font-mono tracking-widest select-auto">
            DEVELOPED BY:{" "}
            <a
              href="https://wa.me/96181713408"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-amber-400 font-bold underline underline-offset-4 transition-colors"
            >
              CONTACT DEVELOPER
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
