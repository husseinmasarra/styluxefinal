'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';

export function FloatingActions() {
  const pathname = usePathname();

  // Don't show floating buttons on the admin pages to avoid overlap
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
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
