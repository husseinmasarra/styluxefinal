'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Instagram, Send, Lock, Ruler, MessageCircle } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';
import { DataService } from '@/lib/store';
import { useActiveDepartment } from '@/lib/departmentContext';
import { WhatsAppIcon } from './WhatsAppIcon';

export function Footer() {
  const pathname = usePathname();
  const { settings } = useCart();
  const deptContext = useActiveDepartment(settings);
  const [mounted, setMounted] = React.useState(false);
  const [hasSaleProducts, setHasSaleProducts] = React.useState(false);

  const copyrightClicksRef = React.useRef<number>(0);
  const copyrightTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSecretCopyrightClick = () => {
    copyrightClicksRef.current += 1;
    if (copyrightClicksRef.current >= 3) {
      window.location.href = '/admin';
      copyrightClicksRef.current = 0;
      return;
    }
    if (copyrightTimerRef.current) clearTimeout(copyrightTimerRef.current);
    copyrightTimerRef.current = setTimeout(() => {
      copyrightClicksRef.current = 0;
    }, 1200);
  };

  React.useEffect(() => {
    setMounted(true);
    const checkSale = () => {
      const prods = DataService.getProducts();
      setHasSaleProducts(prods.some(p => Boolean(p.salePrice && p.salePrice > 0 && p.salePrice < p.price)));
    };
    checkSale();
    window.addEventListener('styluxe_data_updated', checkSale);
    return () => window.removeEventListener('styluxe_data_updated', checkSale);
  }, []);

  // Hide storefront footer inside private /admin control panel
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const addressText = mounted ? (settings.address || "Downtown Beirut, Allenby Street, Luxury Quarter") : "Downtown Beirut, Allenby Street, Luxury Quarter";

  const isHomePage = pathname === '/' || pathname === '';

  // On homepage, always strictly use WOMEN's phone/whatsapp and Instagram as requested
  const activeWhatsappUrl = isHomePage ? deptContext.womenWhatsappUrl : deptContext.whatsappUrl;
  const activeInstagramUrl = isHomePage ? deptContext.womenInstagramUrl : deptContext.instagramUrl;

  return (
    <footer className="bg-black text-white border-t border-zinc-900 pt-16 pb-12 px-6 sm:px-12 lg:px-16 w-full">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* 1. TOP BRAND HEADER IN SOLID BLACK - FULL WIDTH BALANCED */}
        <div className="text-center space-y-4 pb-8 border-b border-zinc-900">
          <Link href="/" className="inline-flex flex-col items-center justify-center group" title={settings.storeName || "STYLUXE"}>
            <span className="font-serif text-[24px] sm:text-[28px] font-semibold tracking-[0.25em] text-white uppercase group-hover:opacity-85 transition-opacity select-none">
              {settings.storeName || "STYLUXE"}
            </span>
          </Link>
          <p className="text-xs sm:text-sm font-medium text-zinc-400 max-w-2xl mx-auto tracking-wider uppercase leading-relaxed">
            Lebanon's premier luxury fashion boutique. Curated authentic designer apparel, footwear, and accessories from global fashion houses.
          </p>

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
                <Link href="/pre-order" className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 font-extrabold">
                  <span>PRE-ORDER EXCLUSIVES</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-400 text-black font-black tracking-wider rounded">2026</span>
                </Link>
              </li>
              {hasSaleProducts && (
                <li>
                  <Link href="/shop?sale=true" className="text-red-500 hover:text-red-400 transition-colors block font-extrabold">
                    LIMITED SALE
                  </Link>
                </li>
              )}
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
              <li className="pt-1.5 pb-0.5">
                <div className="flex items-center gap-3">
                  <a 
                    href={activeWhatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-zinc-900 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-full transition-all inline-flex items-center justify-center cursor-pointer border border-zinc-800 hover:border-[#25D366]"
                    title={isHomePage ? "WhatsApp Concierge (Women: +961 78 709 321)" : `WhatsApp Concierge (${deptContext.department === 'men' ? 'Men' : 'Women'})`}
                    aria-label="WhatsApp Concierge"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                  </a>
                  <a 
                    href={activeInstagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-pink-500 hover:text-pink-400 rounded-full transition-all inline-flex items-center justify-center cursor-pointer border border-zinc-800 hover:border-zinc-700"
                    title={isHomePage ? "Official Instagram (@styluxe.womenn)" : `Official Instagram (${deptContext.department === 'men' ? '@styluxe.men_lb' : '@styluxe.womenn'})`}
                    aria-label="Official Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                  {settings.facebookUrl && (
                    <a 
                      href={settings.facebookUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2.5 bg-zinc-900 hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-full transition-all inline-flex items-center justify-center cursor-pointer border border-zinc-800 hover:border-[#1877F2]"
                      title="Official Facebook Page"
                      aria-label="Official Facebook"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {settings.tiktokUrl && (
                    <a 
                      href={settings.tiktokUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition-all inline-flex items-center justify-center cursor-pointer border border-zinc-800 hover:border-zinc-700"
                      title="Official TikTok Account"
                      aria-label="Official TikTok"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    </a>
                  )}
                </div>
              </li>
              <li>
                <Link href="/account" className="text-amber-400 hover:text-amber-300 transition-colors block font-extrabold">
                  MY ACCOUNT & ORDER HISTORY
                </Link>
              </li>
              <li>
                <button
                  onClick={() => openSizeGuide()}
                  className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors uppercase font-extrabold cursor-pointer"
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
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest select-none">
          <p 
            onClick={handleSecretCopyrightClick}
            className="cursor-default select-none"
            title="STYLUXE Boutique"
          >
            © {new Date().getFullYear()} {(settings.storeName || "STYLUXE").replace(/\s+/g, '')} BOUTIQUE. ALL RIGHTS RESERVED.
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
