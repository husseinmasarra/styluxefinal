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
        <div className="border-t border-zinc-900 pt-8 text-center text-xs font-mono text-zinc-500 uppercase tracking-widest select-none">
          <p 
            onClick={(e) => {
              if (e.detail === 3) {
                window.location.href = '/admin';
              }
            }}
            className="cursor-default"
            title="STYLUXE Boutique"
          >
            © 2026 {(settings.storeName || "STYLUXE").replace(/\s+/g, '')} BOUTIQUE. ALL RIGHTS RESERVED. • AUTHENTICITY GUARANTEED
          </p>
        </div>
      </div>

      {/* OFFICIAL FLOATING WHATSAPP BUTTON (BOTTOM LEFT) */}
      <a
        href={`https://wa.me/${(settings.whatsappNumber || '96170123456').replace(/\+/g, '').replace(/\s+/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-[99999] w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_40px_rgba(37,211,102,0.65)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white"
        title="Contact STYLUXE VIP Concierge on WhatsApp"
        aria-label="WhatsApp VIP Concierge"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-7 h-7 sm:w-8 sm:h-8 fill-white" 
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>
    </footer>
  );
}
