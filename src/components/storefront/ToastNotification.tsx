'use client';

import React from 'react';
import { useCart } from '@/lib/CartContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function ToastNotification() {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <div className="bg-zinc-950 text-white px-5 py-3 rounded shadow-2xl flex items-center gap-3 border border-zinc-800">
        {toast.type === 'error' ? (
          <AlertCircle className="text-red-500" size={18} />
        ) : toast.type === 'info' ? (
          <Info className="text-sky-400" size={18} />
        ) : (
          <CheckCircle2 className="text-emerald-400" size={18} />
        )}
        <span className="text-xs font-bold tracking-wider uppercase">
          {toast.text}
        </span>
      </div>
    </div>
  );
}
