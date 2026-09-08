'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import { DataService } from '@/lib/store';
import { StoreSettings } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { Save, Check, Plus, Trash2, Globe, Shield, Truck, DollarSign, Image as ImageIcon, Send, Percent, Upload, Phone, Instagram, Database, Download, Cloud, RefreshCw } from 'lucide-react';
import { testSupabaseConnection, syncLocalDataToSupabase, getSupabaseClient } from '@/lib/supabase';

export function SettingsManager() {
  const { settings } = useCart();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(
    typeof window !== 'undefined' ? (localStorage.getItem('styluxe_supabase_url') || '') : ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    typeof window !== 'undefined' ? (localStorage.getItem('styluxe_supabase_key') || '') : ''
  );
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (field: keyof StoreSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHeroImageChange = (index: number, value: string) => {
    const updatedImages = [...(formData.heroImages || [])];
    updatedImages[index] = value;
    setFormData(prev => ({ ...prev, heroImages: updatedImages }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 })
        .then(compressedUrl => callback(compressedUrl))
        .catch(err => {
          console.error('Settings image compression failed:', err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) callback(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const handleExportBackup = () => {
    const jsonStr = DataService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `styluxe_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!confirm('Are you sure you want to restore this backup? All existing data will be updated.')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = DataService.importDatabaseJSON(content);
          if (success) {
            alert('Database and backup restored successfully!');
            window.location.reload();
          } else {
            alert('Error reading backup file. Please ensure you selected a valid JSON file.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    setIsTesting(true);
    setSyncStatus(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('styluxe_supabase_url', supabaseUrl.trim());
      localStorage.setItem('styluxe_supabase_key', supabaseKey.trim());
    }
    const result = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setIsTesting(false);
    if (result.success) {
      setSyncStatus(`SUCCESS: ${result.message}`);
    } else {
      setSyncStatus(`ERROR: ${result.message}`);
    }
  };

  const handleSyncToSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    setIsSyncing(true);
    setSyncStatus(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('styluxe_supabase_url', supabaseUrl.trim());
      localStorage.setItem('styluxe_supabase_key', supabaseKey.trim());
    }
    const client = getSupabaseClient(supabaseUrl.trim(), supabaseKey.trim());
    if (!client) {
      setIsSyncing(false);
      setSyncStatus('ERROR: Could not initialize Supabase client.');
      return;
    }
    const data = {
      products: DataService.getProducts(),
      categories: DataService.getCategories(),
      brands: DataService.getBrands(),
      orders: DataService.getOrders(),
      settings: DataService.getSettings(),
    };
    const result = await syncLocalDataToSupabase(data, client);
    setIsSyncing(false);
    if (result.success) {
      setSyncStatus(`SUCCESS: Successfully synchronized ${result.count} records to Supabase Cloud!`);
    } else {
      setSyncStatus(`ERROR: ${result.error || 'Failed to sync data to Supabase.'}`);
    }
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    DataService.updateSettings(formData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('styluxe_supabase_url', supabaseUrl.trim());
      localStorage.setItem('styluxe_supabase_key', supabaseKey.trim());
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-10 bg-white min-h-[80vh]">
      
      {/* 1. TOP HEADER & SAVE NOTIFICATION (20% ENLARGED FONTS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-5 gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
            STORE CONFIGURATION & SETTINGS
          </h1>
          <p className="text-sm font-bold text-zinc-600 uppercase tracking-wider pt-1.5">
            Configure per-department WhatsApp & Instagram contacts, 5 Hero slideshow images, and currency rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-6 py-4 border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-950 rounded text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Download full database JSON backup"
          >
            <Download size={16} />
            <span>EXPORT BACKUP</span>
          </button>

          <label className="px-6 py-4 border-2 border-zinc-300 hover:border-zinc-950 bg-zinc-50 text-zinc-900 rounded text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all cursor-pointer shadow-sm">
            <Upload size={16} />
            <span>RESTORE BACKUP</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={() => handleSaveAll()}
            className={`px-8 py-4 rounded text-sm font-black tracking-[0.25em] uppercase flex items-center gap-2.5 transition-all shadow-md shrink-0 ${
              isSaved ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'
            }`}
          >
            {isSaved ? <Check size={18} /> : <Save size={18} />}
            <span>{isSaved ? 'SETTINGS SAVED!' : 'SAVE ALL SETTINGS'}</span>
          </button>
        </div>
      </div>

      {/* 2. PER-DEPARTMENT WHATSAPP & INSTAGRAM SETTINGS (20% ENLARGED FONTS) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="border-b border-zinc-200 pb-4 flex items-center gap-2.5">
          <Phone className="text-zinc-950" size={24} />
          <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
            DEPARTMENT CONTACTS (WHATSAPP & INSTAGRAM PER PAGE)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* WOMEN DEPARTMENT CONTACTS */}
          <div className="border border-zinc-300 rounded-xl p-6 bg-zinc-50/70 space-y-5">
            <span className="text-sm font-black text-amber-700 uppercase tracking-widest block border-b border-zinc-200 pb-2.5">
              👩 WOMEN DEPARTMENT (FOR HER)
            </span>

            <div className="space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                Women WhatsApp Number
              </label>
              <input 
                type="text" 
                value={formData.womenWhatsappNumber || formData.whatsappNumber || ''} 
                onChange={e => handleChange('womenWhatsappNumber', e.target.value)} 
                placeholder="e.g. 96170123456"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-bold text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                Women Instagram Link
              </label>
              <input 
                type="text" 
                value={formData.womenInstagramUrl || formData.instagramUrl || ''} 
                onChange={e => handleChange('womenInstagramUrl', e.target.value)} 
                placeholder="https://instagram.com/styluxe_women"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          {/* MEN DEPARTMENT CONTACTS */}
          <div className="border border-zinc-300 rounded-xl p-6 bg-zinc-50/70 space-y-5">
            <span className="text-sm font-black text-zinc-950 uppercase tracking-widest block border-b border-zinc-200 pb-2.5">
              👨 MEN DEPARTMENT (FOR HIM)
            </span>

            <div className="space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                Men WhatsApp Number
              </label>
              <input 
                type="text" 
                value={formData.menWhatsappNumber || formData.whatsappNumber || ''} 
                onChange={e => handleChange('menWhatsappNumber', e.target.value)} 
                placeholder="e.g. 96170987654"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-bold text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                Men Instagram Link
              </label>
              <input 
                type="text" 
                value={formData.menInstagramUrl || formData.instagramUrl || ''} 
                onChange={e => handleChange('menInstagramUrl', e.target.value)} 
                placeholder="https://instagram.com/styluxe_men"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          {/* KIDS DEPARTMENT CONTACTS */}
          <div className="border border-zinc-300 rounded-xl p-6 bg-zinc-50/70 space-y-5">
            <span className="text-sm font-black text-sky-700 uppercase tracking-widest block border-b border-zinc-200 pb-2.5">
              🧒 KIDS DEPARTMENT (FOR KIDS)
            </span>

            <div className="space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                Kids WhatsApp Number
              </label>
              <input 
                type="text" 
                value={formData.kidsWhatsappNumber || formData.whatsappNumber || ''} 
                onChange={e => handleChange('kidsWhatsappNumber', e.target.value)} 
                placeholder="e.g. 96170555444"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-bold text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
                Kids Instagram Link
              </label>
              <input 
                type="text" 
                value={formData.kidsInstagramUrl || formData.instagramUrl || ''} 
                onChange={e => handleChange('kidsInstagramUrl', e.target.value)} 
                placeholder="https://instagram.com/styluxe_kids"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>

        </div>
      </div>

      {/* 3. HERO SLIDESHOW IMAGES (20% ENLARGED FONTS & BUTTONS) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="border-b border-zinc-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="text-zinc-950" size={24} />
            <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
              HERO BANNER SLIDESHOW (5 IMAGES MAX)
            </h2>
          </div>
          <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            UPLOAD COMPUTER FILES OR PASTE URLS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[0, 1, 2, 3, 4].map(idx => {
            const currentImg = (formData.heroImages && formData.heroImages[idx]) || '';
            return (
              <div key={idx} className="border border-zinc-300 rounded-xl p-4 space-y-3 bg-zinc-50/70 flex flex-col justify-between">
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-zinc-950 uppercase tracking-wider">
                      IMAGE #{idx + 1} {idx === 0 ? '(MAIN)' : ''}
                    </span>
                    {currentImg && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </div>

                  {/* Image Preview Slot */}
                  <div className="aspect-[16/9] w-full bg-zinc-200 rounded-lg overflow-hidden border border-zinc-300 relative group">
                    {currentImg ? (
                      <img src={currentImg} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-1">
                        <ImageIcon size={28} />
                        <span className="text-xs font-bold uppercase">EMPTY SLOT</span>
                      </div>
                    )}
                  </div>

                  {/* Easy Upload Button */}
                  <label className="w-full py-3 bg-zinc-950 text-white text-xs font-extrabold uppercase tracking-wider rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-xs">
                    <Upload size={16} />
                    <span>UPLOAD FILE</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e, (url) => handleHeroImageChange(idx, url))}
                    />
                  </label>

                  {/* Or Paste URL */}
                  <input 
                    type="text" 
                    value={currentImg} 
                    onChange={e => handleHeroImageChange(idx, e.target.value)}
                    placeholder="Or paste image URL..."
                    className="w-full p-2.5 border border-zinc-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-white focus:outline-none"
                  />
                </div>

                {currentImg && (
                  <button 
                    onClick={() => handleHeroImageChange(idx, '')}
                    className="text-xs font-extrabold text-red-600 hover:underline uppercase text-center pt-2"
                  >
                    CLEAR IMAGE #{idx + 1}
                  </button>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. GENERAL STORE & CURRENCY SETTINGS (20% ENLARGED FONTS) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="border-b border-zinc-200 pb-4 flex items-center gap-2.5">
          <DollarSign className="text-zinc-950" size={24} />
          <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
            CURRENCY EXCHANGE RATES & GENERAL STORE INFO
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Store Name
            </label>
            <input 
              type="text" 
              value={formData.storeName} 
              onChange={e => handleChange('storeName', e.target.value)} 
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-serif font-black text-sm uppercase text-zinc-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              LBP Exchange Rate (1 USD = ? LBP)
            </label>
            <input 
              type="number" 
              value={formData.lbpRate} 
              onChange={e => handleChange('lbpRate', Number(e.target.value))} 
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-black text-sm text-zinc-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              EUR Exchange Rate (1 USD = ? EUR)
            </label>
            <input 
              type="number" 
              step="0.01"
              value={formData.eurRate} 
              onChange={e => handleChange('eurRate', Number(e.target.value))} 
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-black text-sm text-zinc-950"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Default Shipping Fee ($)
            </label>
            <input 
              type="number" 
              value={formData.defaultShippingFeeUSD} 
              onChange={e => handleChange('defaultShippingFeeUSD', Number(e.target.value))} 
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-black text-sm text-zinc-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Free Shipping Threshold ($)
            </label>
            <input 
              type="number" 
              value={formData.freeShippingThresholdUSD} 
              onChange={e => handleChange('freeShippingThresholdUSD', Number(e.target.value))} 
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-black text-sm text-emerald-600"
            />
          </div>
        </div>

      </div>

      {/* 5. CLIENT SERVICES FOOTER CONTACT INFO (ADDRESS, PHONE, EMAIL) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="border-b border-zinc-200 pb-4 flex items-center gap-2.5">
          <Globe className="text-zinc-950" size={24} />
          <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
            CLIENT SERVICES FOOTER CONTACT INFO
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Physical Address Field */}
          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Footer Store Address
            </label>
            <textarea 
              rows={2}
              value={formData.address || ''} 
              onChange={e => handleChange('address', e.target.value)} 
              placeholder="e.g. Downtown Beirut, Allenby Street, Luxury Quarter"
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-bold text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 resize-none uppercase"
            />
          </div>

          {/* Customer Care Phone */}
          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Footer Phone Number
            </label>
            <input 
              type="text" 
              value={formData.phone || ''} 
              onChange={e => handleChange('phone', e.target.value)} 
              placeholder="e.g. +961 70 123 456"
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-bold text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 uppercase"
            />
          </div>

          {/* Support Email */}
          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Footer Support Email
            </label>
            <input 
              type="email" 
              value={formData.email || ''} 
              onChange={e => handleChange('email', e.target.value)} 
              placeholder="e.g. vip@styluxelb.com"
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-bold text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
            />
          </div>

        </div>
      </div>

      {/* 6. CENTRAL CLOUD DATABASE SYNC (SUPABASE) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-3">
            <Cloud className="text-zinc-950" size={24} />
            <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
              CENTRAL CLOUD DATABASE (SUPABASE)
            </h2>
          </div>
          <span className="text-xs uppercase tracking-widest px-3 py-1 font-mono border border-zinc-300 bg-zinc-50 rounded text-zinc-700">
            HYBRID CLOUD SYNC
          </span>
        </div>

        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider leading-relaxed">
          Connect a Supabase PostgreSQL database to synchronize products, orders, and settings centrally across all devices and admin sessions. If unconfigured, the store continues operating smoothly on high-speed LocalStorage fallback.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Supabase Project URL
            </label>
            <input 
              type="text" 
              value={supabaseUrl} 
              onChange={e => setSupabaseUrl(e.target.value)} 
              placeholder="https://xyzcompany.supabase.co"
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Supabase Anon / Service Key
            </label>
            <input 
              type="password" 
              value={supabaseKey} 
              onChange={e => setSupabaseKey(e.target.value)} 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
            />
          </div>
        </div>

        {syncStatus && (
          <div className={`p-4 rounded-lg text-xs font-mono tracking-wider uppercase border ${
            syncStatus.startsWith('SUCCESS') ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
          }`}>
            {syncStatus}
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            type="button"
            onClick={handleTestSupabase}
            disabled={isTesting || !supabaseUrl || !supabaseKey}
            className="px-6 py-3.5 border-2 border-zinc-950 bg-white text-zinc-950 hover:bg-zinc-100 disabled:opacity-40 rounded-lg text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={isTesting ? 'animate-spin' : ''} />
            <span>{isTesting ? 'TESTING CONNECTION...' : 'TEST CONNECTION'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={isSyncing || !supabaseUrl || !supabaseKey}
            className="px-6 py-3.5 bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 rounded-lg text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Cloud size={16} className={isSyncing ? 'animate-bounce' : ''} />
            <span>{isSyncing ? 'SYNCING DATA...' : 'SYNC LOCAL DATA TO CLOUD'}</span>
          </button>
        </div>
      </div>

      {/* DEVELOPER & TECHNICAL SUPPORT CARD */}
      <div className="bg-zinc-950 text-white p-6 sm:p-8 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-400">IT & SYSTEM DEVELOPER</span>
          </div>
          <h3 className="text-lg font-bold font-serif text-white">الدعم الفني والاتصال بالمبرمج</h3>
          <p className="text-xs text-zinc-400">لأي استفسار تقني، صيانة، تعديل في المتجر أو إضافة ميزات جديدة، يرجى التواصل مباشرة مع المبرمج.</p>
        </div>
        <a
          href="https://wa.me/96181713408?text=Hi%20Developer,%20regarding%20Styluxe%20Admin%20Settings"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wider uppercase rounded-lg flex items-center gap-2 transition-all shadow-lg shrink-0"
        >
          <Phone size={14} />
          <span>+961 81 713 408 (واتساب المبرمج)</span>
        </a>
      </div>

      {/* BOTTOM SAVE BUTTON (20% ENLARGED) */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={() => handleSaveAll()}
          className={`px-12 py-5 rounded-lg text-sm font-black tracking-[0.25em] uppercase flex items-center gap-3 transition-all shadow-xl ${
            isSaved ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'
          }`}
        >
          {isSaved ? <Check size={20} /> : <Save size={20} />}
          <span>{isSaved ? 'ALL SETTINGS SAVED SUCCESSFULLY!' : 'SAVE ALL SETTINGS'}</span>
        </button>
      </div>

    </div>
  );
}
