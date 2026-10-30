'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import { useActiveDepartment, formatWhatsAppUrl } from '@/lib/departmentContext';
import { WhatsAppIcon } from './WhatsAppIcon';

export function FloatingActions() {
  const pathname = usePathname();
  const { settings } = useCart();
  const deptContext = useActiveDepartment(settings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Do not render on SSR before mount, or inside private admin dashboard
  if (!mounted || (pathname && pathname.startsWith('/admin'))) {
    return null;
  }

  const isMenActive = deptContext.department === 'men';
  const targetNumber = isMenActive
    ? (settings?.menWhatsappNumber || '79024934')
    : (settings?.womenWhatsappNumber || '78709321');

  const targetUrl = formatWhatsAppUrl(
    targetNumber,
    isMenActive
      ? 'Hello STYLUXE Concierge ✨ I would like assistance with the Men\'s Collection.'
      : 'Hello STYLUXE Concierge ✨ I would like assistance with the Women\'s Collection.'
  );

  return (
    <aside 
      aria-label="WhatsApp Concierge"
      className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-50 flex flex-col items-start font-sans select-none"
    >
      {/* DIRECT ONE-CLICK WHATSAPP CIRCLE (ICON ONLY, NO TEXT, NO BADGES) */}
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl hover:shadow-[#25D366]/50 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/40"
        title={`WhatsApp Concierge (${isMenActive ? 'Men' : 'Women'}: +961 ${targetNumber.replace(/^961/, '')})`}
        aria-label="Chat directly on WhatsApp"
      >
        {/* Pulsing Outer Glow */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none" />

        {/* Official WhatsApp SVG Icon */}
        <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 drop-shadow-sm text-white" />
      </a>
    </aside>
  );
}
