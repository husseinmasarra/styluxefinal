'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, Clock, ShieldCheck, Banknote, ArrowLeft } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-white">
      
      {/* Top Back Link */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>BACK TO BOUTIQUE</span>
      </Link>

      {/* Header */}
      <div className="space-y-4 border-b border-zinc-200 pb-8 text-center sm:text-left">
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 block">
          CLIENT SERVICES & LOGISTICS
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-[0.2em] text-zinc-950 uppercase">
          SHIPPING & DELIVERY INFORMATION
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 font-medium tracking-wider uppercase leading-relaxed max-w-2xl">
          Complimentary private white-glove express courier dispatch across all territories of Lebanon.
        </p>
      </div>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <Clock className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">24-48 HOUR DISPATCH</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            All in-stock designer ready-to-wear, footwear, and accessories are dispatched within 24 to 48 hours.
          </p>
        </div>

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <Banknote className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">CASH ON DELIVERY</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Pay upon arrival directly to the courier in USD, EUR, or Lebanese Pounds at the daily official boutique rate.
          </p>
        </div>

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <ShieldCheck className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">INSPECTION UPON ARRIVAL</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Clients are entitled to examine packaging and authenticity seals prior to final payment acceptance.
          </p>
        </div>
      </div>

      {/* Detailed Delivery Guidelines */}
      <div className="space-y-6 text-xs text-zinc-700 leading-relaxed border-t border-zinc-200 pt-8">
        <h2 className="font-serif text-lg font-bold tracking-wider uppercase text-zinc-950">
          TERRITORIAL COVERAGE & COURIER STANDARDS
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-black text-zinc-950 uppercase tracking-wider mb-1">1. Greater Beirut & Mount Lebanon</h4>
            <p>Next-day priority delivery by dedicated boutique drivers. Delivery windows are confirmed with clients via WhatsApp prior to departure.</p>
          </div>
          <div>
            <h4 className="font-black text-zinc-950 uppercase tracking-wider mb-1">2. North, South & Bekaa Governorates</h4>
            <p>Delivered within 48 to 72 business hours via secure insured luxury express transport.</p>
          </div>
          <div>
            <h4 className="font-black text-zinc-950 uppercase tracking-wider mb-1">3. Pre-Order Runway Deliveries</h4>
            <p>Items marked with the &quot;PRE-ORDER&quot; badge are reserved directly from European showrooms. Expected dispatch windows (typically 14-21 business days) are communicated immediately upon order registration.</p>
          </div>
        </div>
      </div>

      {/* Contact Concierge Banner */}
      <div className="p-8 bg-zinc-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="font-serif text-base sm:text-lg font-bold tracking-wider uppercase">HAVE QUESTIONS REGARDING DISPATCH?</h3>
          <p className="text-xs text-zinc-400 tracking-wider">Our luxury concierge is accessible 7 days a week via WhatsApp.</p>
        </div>
        <Link 
          href="/shop"
          className="px-6 py-3 bg-white text-zinc-950 text-xs font-black uppercase tracking-widest rounded hover:bg-zinc-200 transition-colors shrink-0"
        >
          EXPLORE THE BOUTIQUE
        </Link>
      </div>

    </div>
  );
}
