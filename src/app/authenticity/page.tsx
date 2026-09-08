'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AuthenticityPage() {
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
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600 block">
          OUR SACRED PLEDGE
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-[0.2em] text-zinc-950 uppercase">
          100% AUTHENTICITY GUARANTEE
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 font-medium tracking-wider uppercase leading-relaxed max-w-2xl">
          Every creation presented at STYLUXE is verified authentic, brand new, and sourced from official European showrooms and licensed fashion houses.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <Award className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">DIRECT PROVENANCE</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            All inventory arrives directly from Milan, Paris, and London luxury brand authorized distributors with complete documentation.
          </p>
        </div>

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <ShieldCheck className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">MULTI-STAGE INSPECTION</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Every garment and accessory undergoes rigorous physical verification of fabric composition, stitching density, serials, and security tags.
          </p>
        </div>

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <Sparkles className="text-amber-500" size={24} />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">ORIGINAL LUXURY PACKAGING</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Pieces are accompanied by authentic branded dust covers, authenticity certificates, garment bags, and original designer boxing.
          </p>
        </div>
      </div>

      {/* Detailed Standards */}
      <div className="space-y-6 text-xs text-zinc-700 leading-relaxed border-t border-zinc-200 pt-8">
        <h2 className="font-serif text-lg font-bold tracking-wider uppercase text-zinc-950">
          DESIGNER HOUSES REPRESENTED
        </h2>
        <p>
          STYLUXE curates collections from prestigious world-renowned luxury houses including Prada, Gucci, Amiri, Off-White, Balenciaga, and Dior. We maintain strict zero-tolerance policies regarding unauthorized goods or grey-market duplicates.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p><strong>Official Serial Number Verification:</strong> Serial tags and QR authenticity codes (e.g. Prada Certificato di Autenticità, Moncler Certilogo, Gucci RFID) remain uncompromised.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p><strong>Customer Right of Inspection:</strong> You are encouraged to inspect your purchase upon arrival before releasing payment to the courier.</p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-8 bg-zinc-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="font-serif text-base sm:text-lg font-bold tracking-wider uppercase">VERIFY A SPECIFIC ARTICLE?</h3>
          <p className="text-xs text-zinc-400 tracking-wider">Contact our luxury concierge with any product SKU or serial inquiry.</p>
        </div>
        <Link 
          href="/shop"
          className="px-6 py-3 bg-white text-zinc-950 text-xs font-black uppercase tracking-widest rounded hover:bg-zinc-200 transition-colors shrink-0"
        >
          EXPLORE AUTHENTIC COLLECTIONS
        </Link>
      </div>

    </div>
  );
}
