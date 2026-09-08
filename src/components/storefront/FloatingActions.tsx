'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useCart } from '@/lib/CartContext';

export function FloatingActions() {
  const pathname = usePathname();
  const { settings } = useCart();
  const [deptLabel, setDeptLabel] = useState("MEN'S SUPPORT");

  // Determine active department based on URL or defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href.toLowerCase();
      if (url.includes('women')) {
        setDeptLabel("WOMEN'S SUPPORT");
      } else if (url.includes('kids')) {
        setDeptLabel("KIDS' SUPPORT");
      } else if (url.includes('men')) {
        setDeptLabel("MEN'S SUPPORT");
      } else {
        setDeptLabel("CUSTOMER SUPPORT");
      }
    }
  }, [pathname]);

  // Don't show floating buttons on the admin pages to avoid overlap
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const cleanNumber = (settings.whatsappNumber || '96170123456').replace(/[^\d]/g, '');
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent("Hi Styluxe, I would like to inquire about your luxury collections.")}`;

  return (
    <>
      {/* Bottom-Left: Floating WhatsApp Contact Pill (Emerald Green) */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer border border-emerald-400/30"
        title="Contact Styluxe on WhatsApp"
        aria-label="Contact Styluxe on WhatsApp"
      >
        {/* WhatsApp SVG Icon */}
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white fill-white"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <div className="flex flex-col text-left leading-tight pr-1">
          <span className="text-[11px] font-black tracking-widest uppercase text-white drop-shadow-xs">
            CONTACT US
          </span>
          <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-100 opacity-90">
            {deptLabel}
          </span>
        </div>
      </a>

      {/* Bottom-Right: Floating Control Panel Button (Jet Black with Gold/White Lock) */}
      <Link
        href="/admin"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-widest uppercase border border-zinc-800 shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer rounded-none"
        title="Access Admin Control Panel"
      >
        <Lock size={14} className="text-amber-400" />
        <span>CONTROL PANEL</span>
      </Link>
    </>
  );
}
