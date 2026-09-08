'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ReturnsPage() {
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
          PURCHASE WITH COMPLETE CONFIDENCE
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-[0.2em] text-zinc-950 uppercase">
          RETURNS & EXCHANGES POLICY
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 font-medium tracking-wider uppercase leading-relaxed max-w-2xl">
          At STYLUXE, your satisfaction with tailoring, fit, and aesthetic elegance is paramount.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <RefreshCw className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">EXCHANGE WINDOW</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Eligible items may be exchanged for alternative sizes or store credit within 3 calendar days of delivery.
          </p>
        </div>

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <CheckCircle2 className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">PRISTINE CONDITION</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Garments must retain all original designer tags, authenticity cards, dustbags, and security seals intact.
          </p>
        </div>

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <ShieldAlert className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">COURIER PICKUP</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Our courier will collect the exchange piece from your doorstep and deliver the replacement concurrently.
          </p>
        </div>
      </div>

      {/* Policy Details */}
      <div className="space-y-6 text-xs text-zinc-700 leading-relaxed border-t border-zinc-200 pt-8">
        <h2 className="font-serif text-lg font-bold tracking-wider uppercase text-zinc-950">
          HOW TO INITIATE AN EXCHANGE
        </h2>
        <ol className="list-decimal pl-5 space-y-3 font-medium">
          <li>
            <strong>Contact Concierge:</strong> Reach out via WhatsApp or email within 72 hours of receiving your order with your Order ID.
          </li>
          <li>
            <strong>Specify Desired Replacement:</strong> Inform our concierge of your desired size or alternative designer reference.
          </li>
          <li>
            <strong>Doorstep Exchange:</strong> Our luxury courier will arrive at your registered address with the replacement piece, inspect the returned article, and complete the exchange seamlessly.
          </li>
        </ol>

        <div className="p-4 bg-zinc-100 rounded-lg text-zinc-600 space-y-1">
          <span className="font-black text-zinc-950 uppercase block">NON-EXCHANGEABLE ARTICLES:</span>
          <p>For hygiene and exclusivity standards, intimate apparel, customized alterations, and fragrance bottles with broken seals are final sale.</p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-8 bg-zinc-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="font-serif text-base sm:text-lg font-bold tracking-wider uppercase">NEED ASSISTANCE WITH SIZING?</h3>
          <p className="text-xs text-zinc-400 tracking-wider">Consult our International Size Guide or chat with our styling team.</p>
        </div>
        <Link 
          href="/shop"
          className="px-6 py-3 bg-white text-zinc-950 text-xs font-black uppercase tracking-widest rounded hover:bg-zinc-200 transition-colors shrink-0"
        >
          RETURN TO SHOPPING
        </Link>
      </div>

    </div>
  );
}
