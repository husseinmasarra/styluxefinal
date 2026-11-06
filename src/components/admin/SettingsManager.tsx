'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import { DataService } from '@/lib/store';
import { StoreSettings } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { Save, Check, Plus, Trash2, Globe, Shield, Truck, DollarSign, Image as ImageIcon, Send, Percent, Upload, Phone, Instagram, Database, Download, Cloud, RefreshCw, Target, BarChart3, Radio, Video, Film, Sparkles, Eye, EyeOff, Zap, Server, Key } from 'lucide-react';
import { testSupabaseConnection, syncLocalDataToSupabase, getSupabaseClient, SUPABASE_CONFIG } from '@/lib/supabase';

export function SettingsManager() {
  const { settings } = useCart();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(
    typeof window !== 'undefined' ? (localStorage.getItem('styluxe_supabase_url') || SUPABASE_CONFIG.url) : SUPABASE_CONFIG.url
  );
  const [supabaseKey, setSupabaseKey] = useState(
    typeof window !== 'undefined' ? (localStorage.getItem('styluxe_supabase_key') || SUPABASE_CONFIG.anonKey) : SUPABASE_CONFIG.anonKey
  );
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWomenCapiToken, setShowWomenCapiToken] = useState(false);
  const [showMenCapiToken, setShowMenCapiToken] = useState(false);
  const [showMasterCapiToken, setShowMasterCapiToken] = useState(false);
  const [womenCapiTestStatus, setWomenCapiTestStatus] = useState<{ loading: boolean; message: string | null; success?: boolean }>({
    loading: false,
    message: null,
  });
  const [menCapiTestStatus, setMenCapiTestStatus] = useState<{ loading: boolean; message: string | null; success?: boolean }>({
    loading: false,
    message: null,
  });

  const handleTestSpecificCapi = async (target: 'women' | 'men') => {
    const isWomen = target === 'women';
    const token = isWomen 
      ? (formData.womenMetaCapiAccessToken?.trim() || formData.metaCapiAccessToken?.trim())
      : (formData.menMetaCapiAccessToken?.trim() || formData.metaCapiAccessToken?.trim());

    const pixelId = isWomen
      ? (formData.womenMetaPixelId?.trim() || '1128799242995614')
      : (formData.menMetaPixelId?.trim() || '1644089083922873');

    const setStatus = isWomen ? setWomenCapiTestStatus : setMenCapiTestStatus;

    if (!token) {
      setStatus({
        loading: false,
        message: `Please paste the ${isWomen ? 'Women' : 'Men'} CAPI Access Token first.`,
        success: false,
      });
      return;
    }

    setStatus({ loading: true, message: `Connecting to Meta for ${isWomen ? 'Women' : 'Men'} Pixel (${pixelId})...` });

    try {
      const testCode = formData.metaCapiTestEventCode?.trim() || '';
      const res = await fetch(`/api/meta-capi?token=${encodeURIComponent(token)}&pixelId=${encodeURIComponent(pixelId)}${testCode ? `&testCode=${encodeURIComponent(testCode)}` : ''}`);
      const data = await res.json();
      if (data.success && data.metaResponse?.events_received) {
        setStatus({
          loading: false,
          message: `✅ Connected! Meta confirmed receiving event for Pixel ${pixelId} (FB Trace: ${data.metaResponse.fbtrace_id?.substring(0, 10)}...)`,
          success: true,
        });
      } else if (data.metaResponse?.error) {
        setStatus({
          loading: false,
          message: `❌ Meta Error: ${data.metaResponse.error.message || 'Invalid Token or Pixel mismatch'}`,
          success: false,
        });
      } else {
        setStatus({
          loading: false,
          message: data.message || 'Connected to Meta CAPI!',
          success: data.success ?? true,
        });
      }
    } catch (err: any) {
      setStatus({
        loading: false,
        message: `Connection failed: ${err.message}`,
        success: false,
      });
    }
  };

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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        alert('Video file size exceeds 30MB. Please select a video under 30MB or compress it.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      if (file.size > 30 * 1024 * 1024) {
        alert('Hero video file size exceeds 30MB. Please select a video under 30MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 })
        .then(compressedUrl => callback(compressedUrl))
        .catch(err => {
          console.error('Hero media compression error, using fallback:', err);
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
      const urlToSave = supabaseUrl.trim() || SUPABASE_CONFIG.url;
      const keyToSave = supabaseKey.trim() || SUPABASE_CONFIG.anonKey;
      localStorage.setItem('styluxe_supabase_url', urlToSave);
      localStorage.setItem('styluxe_supabase_key', keyToSave);
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

      {/* 2. STORE BRANDING & LOGO (ANIMATED VIDEO LOGO & STATIC IMAGE LOGO) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <Film className="text-zinc-950" size={26} />
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                STORE IDENTITY & LOGO (VIDEO & IMAGE)
              </h2>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block pt-0.5">
                Animated website video logo and high-resolution static mark for header & footer
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {formData.logoVideoUrl && !formData.hideVideoLogo ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE VIDEO LOGO
              </span>
            ) : formData.logoUrl ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300 uppercase">
                STATIC IMAGE LOGO ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-amber-50 text-amber-800 border border-amber-300 uppercase">
                TEXT TYPOGRAPHY LOGO
              </span>
            )}
          </div>
        </div>

        {/* Guidance Alert */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs leading-relaxed text-zinc-700 space-y-1">
          <p className="font-bold text-zinc-950 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            <span>Storefront Animated Video Logo</span>
          </p>
          <p>
            Upload your animated MP4 or WebM video logo (or click <strong>Use Preloaded Video</strong> to activate the pre-configured video logo). 
            When active, the video logo automatically autoplays in an elegant loop in the top navigation header and footer. 
            If the video logo is disabled or cleared, STYLUXE automatically uses your static image logo or standard typographic brand mark.
          </p>
        </div>

        {/* CINEMATIC INTRO SPLASH VIDEO CARD */}
        <div className="border-2 border-amber-500/30 rounded-xl p-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Film size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black uppercase tracking-widest text-white">
                    INTRO SPLASH VIDEO (CINEMATIC WELCOME)
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500 text-black rounded font-mono font-bold">
                    VIP
                  </span>
                </div>
                <p className="text-xs text-zinc-400 pt-0.5">
                  Cinematic luxury intro video displayed when visitors enter the store, with a skip option.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new Event('styluxe_trigger_intro_splash'));
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Preview live intro splash video as seen by customers"
              >
                <Eye size={15} />
                <span>TEST LIVE SPLASH</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Video Player Preview */}
            <div className="lg:col-span-6 bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[220px] sm:min-h-[260px] shadow-2xl">
              {formData.introVideoUrl || formData.logoVideoUrl ? (
                <video
                  key={formData.introVideoUrl || formData.logoVideoUrl}
                  src={formData.introVideoUrl || formData.logoVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="w-full h-full max-h-[260px] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600 space-y-2 p-6 text-center">
                  <Film size={42} className="text-zinc-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">No intro video currently configured</span>
                  <span className="text-[11px] text-zinc-600 max-w-xs">Upload a video file or enter a direct URL to enable immediately</span>
                </div>
              )}
            </div>

            {/* Controls & Inputs */}
            <div className="lg:col-span-6 space-y-4">
              {/* Upload file button */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  1. Upload Video File (MP4 / WEBM / MOV):
                </label>
                <label className="w-full py-3.5 bg-white hover:bg-zinc-100 text-black text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md">
                  <Upload size={16} />
                  <span>Choose video file to upload</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    className="hidden"
                    onChange={e => handleVideoUpload(e, (url) => handleChange('introVideoUrl', url))}
                  />
                </label>
                <span className="text-[10px] text-zinc-400 block">
                  Supports MP4, WebM, and MOV up to 30 MB.
                </span>
              </div>

              {/* Direct URL input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">
                  2. Or provide a direct video URL:
                </label>
                <input
                  type="text"
                  value={formData.introVideoUrl || ''}
                  onChange={e => handleChange('introVideoUrl', e.target.value.trim())}
                  placeholder="e.g. /logo-video.mp4 or https://..."
                  className="w-full p-3.5 border-2 border-zinc-700 rounded-lg font-mono text-xs font-bold text-white bg-zinc-900 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Enter a direct cloud video link (Cloudinary, Supabase, Streamable, etc.)
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleChange('introVideoUrl', '/logo-video.mp4')}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restore default built-in video"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>DEFAULT VIDEO (/logo-video.mp4)</span>
                </button>

                {formData.introVideoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('introVideoUrl', '')}
                    className="px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    Remove Intro Video
                  </button>
                )}
              </div>

              {/* Enable / Disable Splash Screen Toggle */}
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!formData.hideIntroVideo && formData.enableIntroVideo !== false}
                    onChange={e => {
                      handleChange('hideIntroVideo', !e.target.checked);
                      handleChange('enableIntroVideo', e.target.checked);
                    }}
                    className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-900 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Enable cinematic intro video for visitors before entering the storefront
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-850">
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                    formData.introVideoMode !== 'once_per_session'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}>
                    <input
                      type="radio"
                      name="introVideoMode"
                      value="always_on_home"
                      checked={formData.introVideoMode !== 'once_per_session'}
                      onChange={() => handleChange('introVideoMode', 'always_on_home')}
                      className="text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="text-[11px]">
                      <span className="font-black uppercase block">Every time homepage is loaded (Always)</span>
                      <span className="text-[10px] text-zinc-400">Intro video plays every time visitor opens the site</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                    formData.introVideoMode === 'once_per_session'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}>
                    <input
                      type="radio"
                      name="introVideoMode"
                      value="once_per_session"
                      checked={formData.introVideoMode === 'once_per_session'}
                      onChange={() => handleChange('introVideoMode', 'once_per_session')}
                      className="text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="text-[11px]">
                      <span className="font-black uppercase block">Once per browsing session</span>
                      <span className="text-[10px] text-zinc-400">Plays only once per browser tab session</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 1: ANIMATED VIDEO LOGO */}
          <div className="border-2 border-zinc-900/15 rounded-xl p-6 bg-zinc-50/70 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                <span className="text-sm font-black text-zinc-950 uppercase tracking-widest flex items-center gap-2">
                  <Video size={18} className="text-zinc-950" />
                  <span>1. ANIMATED VIDEO LOGO (MP4 / WEBM)</span>
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono">
                  PREMIUM
                </span>
              </div>

              {/* Video Preview Player */}
              <div className="h-48 sm:h-56 w-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center relative shadow-inner">
                {formData.logoVideoUrl ? (
                  <video 
                    key={formData.logoVideoUrl}
                    src={formData.logoVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500 space-y-2 p-4 text-center">
                    <Film size={36} className="text-zinc-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-400">NO VIDEO LOGO UPLOADED</span>
                    <span className="text-[11px] text-zinc-500 max-w-xs">Upload an MP4 video or click "Use Preloaded Video" below to activate</span>
                  </div>
                )}
              </div>

              {/* Upload & Preset Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <label className="flex-1 py-3.5 bg-zinc-950 text-white text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-xs">
                  <Upload size={16} />
                  <span>UPLOAD VIDEO FILE (.MP4 / .WEBM)</span>
                  <input 
                    type="file" 
                    accept="video/mp4,video/webm,video/ogg,video/quicktime" 
                    className="hidden" 
                    onChange={e => handleVideoUpload(e, (url) => handleChange('logoVideoUrl', url))}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleChange('logoVideoUrl', '/logo-video.mp4')}
                  className="px-4 py-3.5 bg-white hover:bg-amber-50 text-zinc-950 border-2 border-zinc-900 rounded-lg text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Activate preloaded video logo from public/logo-video.mp4"
                >
                  <Sparkles size={15} className="text-amber-600" />
                  <span>USE PRELOADED VIDEO</span>
                </button>
              </div>

              {/* Direct Video URL Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                  Video Logo Path or Direct URL:
                </label>
                <input 
                  type="text" 
                  value={formData.logoVideoUrl || ''} 
                  onChange={e => handleChange('logoVideoUrl', e.target.value.trim())} 
                  placeholder="e.g. /logo-video.mp4 or https://..."
                  className="w-full p-3.5 border-2 border-zinc-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* Hide Video Logo Option */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.hideVideoLogo || false}
                  onChange={e => handleChange('hideVideoLogo', e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                />
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Temporarily hide video logo (use static image logo instead)
                </span>
              </label>
            </div>

            {formData.logoVideoUrl && (
              <button 
                type="button"
                onClick={() => handleChange('logoVideoUrl', '')}
                className="text-xs font-extrabold text-red-600 hover:underline uppercase text-center pt-2"
              >
                REMOVE VIDEO LOGO
              </button>
            )}
          </div>

          {/* COLUMN 2: STATIC IMAGE LOGO */}
          <div className="border-2 border-zinc-900/15 rounded-xl p-6 bg-zinc-50/70 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                <span className="text-sm font-black text-zinc-950 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={18} className="text-zinc-950" />
                  <span>2. STATIC IMAGE LOGO (JPG / PNG / WEBP)</span>
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded font-mono">
                  FALLBACK
                </span>
              </div>

              {/* Image Preview Box */}
              <div className="h-48 sm:h-56 w-full bg-white rounded-xl overflow-hidden border border-zinc-300 flex items-center justify-center relative shadow-inner p-4">
                {formData.logoUrl ? (
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo Preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400 space-y-2 text-center">
                    <ImageIcon size={36} />
                    <span className="text-xs font-black uppercase tracking-wider">NO STATIC LOGO IMAGE</span>
                    <span className="text-[11px] text-zinc-500 max-w-xs">Defaulting to standard 'STYLUXE' typography</span>
                  </div>
                )}
              </div>

              {/* Upload & Preset Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <label className="flex-1 py-3.5 bg-zinc-950 text-white text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-xs">
                  <Upload size={16} />
                  <span>UPLOAD LOGO IMAGE</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => handleFileUpload(e, (url) => handleChange('logoUrl', url))}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    handleChange('logoUrl', '');
                    handleChange('logoVideoUrl', '');
                  }}
                  className="px-4 py-3.5 bg-white hover:bg-zinc-100 text-zinc-950 border-2 border-zinc-300 rounded-lg text-xs font-black tracking-wider uppercase transition-colors cursor-pointer shadow-xs"
                  title="Use textual STYLUXE typography logo"
                >
                  <span>RESTORE TEXT LOGO (STYLUXE)</span>
                </button>
              </div>

              {/* Direct Image URL Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                  Static Logo Image URL:
                </label>
                <input 
                  type="text" 
                  value={formData.logoUrl || ''} 
                  onChange={e => handleChange('logoUrl', e.target.value.trim())} 
                  placeholder="e.g. /logo.jpg or https://..."
                  className="w-full p-3.5 border-2 border-zinc-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="pt-2 text-[11px] text-zinc-500">
                Recommended dimensions: Transparent PNG or high-res JPG, 300x80px or higher.
              </div>
            </div>

            {formData.logoUrl && (
              <button 
                type="button"
                onClick={() => handleChange('logoUrl', '')}
                className="text-xs font-extrabold text-red-600 hover:underline uppercase text-center pt-2"
              >
                REMOVE STATIC LOGO
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. PER-DEPARTMENT WHATSAPP & INSTAGRAM SETTINGS (20% ENLARGED FONTS) */}
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

        {/* GLOBAL SOCIAL MEDIA CHANNELS (FACEBOOK & TIKTOK) */}
        <div className="border-t border-zinc-200 pt-6 mt-2">
          <span className="text-xs font-black text-zinc-950 uppercase tracking-widest block mb-4 flex items-center gap-2">
            <span>🌐</span> GLOBAL SOCIAL MEDIA PAGES (FACEBOOK & TIKTOK)
          </span>
                  {/* DEDICATED META PIXEL SEPARATION (WOMEN & MEN) */}
        <div className="border-2 border-pink-500/30 bg-gradient-to-br from-pink-50/50 via-white to-indigo-50/50 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Instagram size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-zinc-950 uppercase tracking-wider">
                    META PIXEL SEPARATION (WOMEN & MEN DEPARTMENTS)
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono uppercase">
                    INDEPENDENT ROUTING (trackSingle)
                  </span>
                </div>
                <p className="text-xs text-zinc-600 font-medium pt-0.5">
                  Dedicated advertising attribution: Each department and Instagram handle tracks independently to optimize Meta algorithm delivery without signal crossover.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {formData.womenMetaPixelId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-pink-100 text-pink-800 border border-pink-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-600 animate-pulse"></span>
                  👠 WOMEN PIXEL ACTIVE
                </span>
              )}
              {formData.menMetaPixelId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  👔 MEN PIXEL ACTIVE
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* WOMEN PIXEL */}
            <div className="p-5 bg-white rounded-xl border-2 border-pink-200 hover:border-pink-500 transition-all space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-pink-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base">👠</span>
                  <span>WOMEN META PIXEL (@styluxe.womenn)</span>
                </label>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-pink-100 text-pink-700 rounded">
                  WOMEN CAMPAIGNS
                </span>
              </div>
              <input 
                type="text" 
                value={formData.womenMetaPixelId || ''} 
                onChange={e => handleChange('womenMetaPixelId', e.target.value.trim())} 
                placeholder="e.g. 1128799242995614"
                className="w-full p-3.5 border-2 border-pink-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-pink-50/20 focus:outline-none focus:border-pink-600"
              />
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                💡 <strong>Usage:</strong> Exclusively receives product views, cart additions, and purchases for dresses, bags, heels, and women's collections for <strong className="text-pink-700">@styluxe.womenn</strong>.
              </p>
            </div>

            {/* MEN PIXEL */}
            <div className="p-5 bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-500 transition-all space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base">👔</span>
                  <span>MEN META PIXEL (@styluxe.men_lb)</span>
                </label>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                  MEN CAMPAIGNS
                </span>
              </div>
              <input 
                type="text" 
                value={formData.menMetaPixelId || ''} 
                onChange={e => handleChange('menMetaPixelId', e.target.value.trim())} 
                placeholder="e.g. 1644089083922873"
                className="w-full p-3.5 border-2 border-indigo-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-indigo-50/20 focus:outline-none focus:border-indigo-600"
              />
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                💡 <strong>Usage:</strong> Exclusively receives product views, cart additions, and purchases for tailoring, Italian footwear, leather goods, and men's collections for <strong className="text-indigo-700">@styluxe.men_lb</strong>.
              </p>
            </div>
          </div>

          {/* MASTER / UNIFIED PIXEL (OPTIONAL) */}
          <div className="pt-3 border-t border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-white/60 p-3 rounded-lg border border-zinc-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-bold text-zinc-900 whitespace-nowrap">Master Pixel ID (Optional Store-Wide):</span>
              <input 
                type="text" 
                value={formData.metaPixelId || ''} 
                onChange={e => handleChange('metaPixelId', e.target.value.trim())} 
                placeholder="Optional store-wide pixel ID"
                className="p-2.5 border-2 border-zinc-300 rounded font-mono text-xs font-bold text-zinc-950 w-full sm:w-64 bg-white focus:outline-none focus:border-zinc-950"
              />
            </div>
            <span className="text-[11px] text-zinc-500">
              Optional unified pixel receiving all store events across both departments for consolidated master ad accounts.
            </span>
          </div>

          {/* META CONVERSIONS API (CAPI) SERVER-SIDE ENGINE */}
          <div className="mt-4 pt-5 border-t-2 border-zinc-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 rounded-xl border border-emerald-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-600 text-white rounded-md shadow-sm">
                    <Server size={18} />
                  </span>
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-widest">
                    Meta Conversions API (CAPI) • Server-Side Engine
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                    Graph API v19.0
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80 font-medium">
                  Direct server-to-server tracking bypassing browser ad-blockers, iOS 14+ restrictions, and maximizing Event Match Quality (EMQ) via SHA-256 hashed customer phones (+961) and emails.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-sm">
                  <input
                    type="checkbox"
                    checked={formData.metaCapiEnabled !== false}
                    onChange={e => handleChange('metaCapiEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-900">
                    Enable CAPI
                  </span>
                </label>

                {formData.metaCapiAccessToken?.trim() ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black bg-emerald-600 text-white shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    CAPI ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    TOKEN REQUIRED
                  </span>
                )}
              </div>
            </div>

            {/* DEDICATED SEPARATED CAPI TOKENS: WOMEN & MEN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* WOMEN CAPI TOKEN */}
              <div className="p-5 bg-white rounded-xl border-2 border-pink-200 hover:border-pink-500 transition-all space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-pink-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base">👠</span>
                    <span>WOMEN CAPI TOKEN (@styluxe.womenn)</span>
                  </label>
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-pink-100 text-pink-700 rounded">
                    PIXEL: {formData.womenMetaPixelId || '1128799242995614'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showWomenCapiToken ? 'text' : 'password'}
                    value={formData.womenMetaCapiAccessToken || ''}
                    onChange={e => handleChange('womenMetaCapiAccessToken', e.target.value.trim())}
                    placeholder="EAAG... (Paste Women CAPI Token here)"
                    className="w-full p-3.5 pr-20 border-2 border-pink-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-pink-50/20 focus:outline-none focus:border-pink-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWomenCapiToken(!showWomenCapiToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pink-700 hover:text-pink-950 flex items-center gap-1 cursor-pointer bg-pink-100/80 px-2 py-1 rounded"
                  >
                    {showWomenCapiToken ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showWomenCapiToken ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-zinc-600">
                    💡 Dedicated token from Events Manager for Women ads &amp; purchases.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTestSpecificCapi('women')}
                    disabled={womenCapiTestStatus.loading}
                    className="shrink-0 py-2 px-3 bg-pink-700 hover:bg-pink-800 text-white text-[11px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {womenCapiTestStatus.loading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Radio size={13} className="text-pink-300" />
                    )}
                    <span>{womenCapiTestStatus.loading ? 'Testing...' : 'Test Women CAPI'}</span>
                  </button>
                </div>

                {womenCapiTestStatus.message && (
                  <div className={`p-2.5 rounded-lg text-xs font-bold leading-relaxed ${
                    womenCapiTestStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {womenCapiTestStatus.message}
                  </div>
                )}
              </div>

              {/* MEN CAPI TOKEN */}
              <div className="p-5 bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-500 transition-all space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base">👔</span>
                    <span>MEN CAPI TOKEN (@styluxe.men_lb)</span>
                  </label>
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                    PIXEL: {formData.menMetaPixelId || '1644089083922873'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showMenCapiToken ? 'text' : 'password'}
                    value={formData.menMetaCapiAccessToken || ''}
                    onChange={e => handleChange('menMetaCapiAccessToken', e.target.value.trim())}
                    placeholder="EAAG... (Paste Men CAPI Token here)"
                    className="w-full p-3.5 pr-20 border-2 border-indigo-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-indigo-50/20 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMenCapiToken(!showMenCapiToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-700 hover:text-indigo-950 flex items-center gap-1 cursor-pointer bg-indigo-100/80 px-2 py-1 rounded"
                  >
                    {showMenCapiToken ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showMenCapiToken ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-zinc-600">
                    💡 Dedicated token from Events Manager for Men ads &amp; purchases.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTestSpecificCapi('men')}
                    disabled={menCapiTestStatus.loading}
                    className="shrink-0 py-2 px-3 bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {menCapiTestStatus.loading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Radio size={13} className="text-indigo-300" />
                    )}
                    <span>{menCapiTestStatus.loading ? 'Testing...' : 'Test Men CAPI'}</span>
                  </button>
                </div>

                {menCapiTestStatus.message && (
                  <div className={`p-2.5 rounded-lg text-xs font-bold leading-relaxed ${
                    menCapiTestStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {menCapiTestStatus.message}
                  </div>
                )}
              </div>
            </div>

            {/* UNIFIED / TEST SETTINGS */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span>Test Event Code (Optional for Live Testing)</span>
                </label>
                <input
                  type="text"
                  value={formData.metaCapiTestEventCode || ''}
                  onChange={e => handleChange('metaCapiTestEventCode', e.target.value.trim())}
                  placeholder="e.g. TEST12345"
                  className="w-full p-2.5 border-2 border-zinc-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Copy from Meta Events Manager ➔ Test Events tab. Leave empty in production.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={14} className="text-zinc-600" />
                    <span>Master / Store-Wide Token (Optional Fallback)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMasterCapiToken(!showMasterCapiToken)}
                    className="text-[11px] font-bold text-zinc-500 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                  >
                    {showMasterCapiToken ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showMasterCapiToken ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showMasterCapiToken ? 'text' : 'password'}
                  value={formData.metaCapiAccessToken || ''}
                  onChange={e => handleChange('metaCapiAccessToken', e.target.value.trim())}
                  placeholder="Optional unified fallback token"
                  className="w-full p-2.5 border-2 border-zinc-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Used as fallback if any department-specific token above is left blank.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* FACEBOOK URL */}
            <div className="border border-zinc-300 rounded-xl p-5 bg-zinc-50/70 space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs">f</span>
                <span>Official Facebook Page Link</span>
              </label>
              <input 
                type="text" 
                value={formData.facebookUrl || ''} 
                onChange={e => handleChange('facebookUrl', e.target.value)} 
                placeholder="https://facebook.com/styluxelb"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
              />
              <span className="text-[11px] text-zinc-500 block">
                Displayed in the luxury website footer and connected to Meta Commerce.
              </span>
            </div>

            {/* TIKTOK URL */}
            <div className="border border-zinc-300 rounded-xl p-5 bg-zinc-50/70 space-y-2">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">t</span>
                <span>Official TikTok Account Link</span>
              </label>
              <input 
                type="text" 
                value={formData.tiktokUrl || ''} 
                onChange={e => handleChange('tiktokUrl', e.target.value)} 
                placeholder="https://tiktok.com/@styluxelb"
                className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
              />
              <span className="text-[11px] text-zinc-500 block">
                Direct link to your TikTok profile for runway reels and style videos.
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* 4. HERO BANNER SLIDESHOW (VIDEOS & IMAGES) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="border-b border-zinc-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Film className="text-zinc-950" size={24} />
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                HERO BANNER & MAIN HOMEPAGE SLIDESHOW (VIDEOS & IMAGES)
              </h2>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pt-0.5">
                Customize hero slideshow with MP4 videos and luxury images (Slide #1 is primary)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className={`px-6 py-3 rounded text-xs font-black tracking-widest uppercase flex items-center gap-2 transition-all shadow-sm ${
              isSaved ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-white hover:bg-zinc-800'
            }`}
          >
            {isSaved ? <Check size={16} /> : <Save size={16} />}
            <span>{isSaved ? 'HERO SAVED!' : 'SAVE HERO BANNER'}</span>
          </button>
        </div>

        {/* Banner Visibility Toggle */}
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!formData.hideHeroBanner}
              onChange={e => handleChange('hideHeroBanner', !e.target.checked)}
              className="w-5 h-5 accent-zinc-950 rounded cursor-pointer"
            />
            <div>
              <span className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                SHOW HERO BANNER ON HOMEPAGE
              </span>
              <span className="text-[11px] font-semibold text-zinc-500 block">
                Uncheck if you wish to hide the hero banner entirely from the top of the storefront.
              </span>
            </div>
          </label>
        </div>

        {/* Hero Title, Subtitle, Description Customization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-zinc-50/70 p-5 rounded-xl border border-zinc-200">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
              1. Subtitle (Small Top Headline)
            </label>
            <input
              type="text"
              value={formData.heroSubtitle !== undefined ? formData.heroSubtitle : 'NEW ARRIVALS / COLLECTION 2026'}
              onChange={e => handleChange('heroSubtitle', e.target.value)}
              placeholder="NEW ARRIVALS / COLLECTION 2026"
              className="w-full p-3 border-2 border-zinc-300 rounded-lg text-xs font-bold uppercase bg-white focus:border-zinc-950 focus:outline-none"
            />
            <span className="text-[10px] text-zinc-400 block">
              Displays above the hero title in refined tracking
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
              2. Main Title (Primary Headline)
            </label>
            <textarea
              rows={2}
              value={formData.heroTitle !== undefined ? formData.heroTitle : 'REDEFINING\nLUXURY'}
              onChange={e => handleChange('heroTitle', e.target.value)}
              placeholder="REDEFINING&#10;LUXURY"
              className="w-full p-3 border-2 border-zinc-300 rounded-lg font-serif font-bold text-xs uppercase bg-white focus:border-zinc-950 focus:outline-none resize-none leading-relaxed"
            />
            <span className="text-[10px] text-zinc-400 block">
              Press Enter to create multiple lines (e.g., REDEFINING then LUXURY)
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
              3. Description Text
            </label>
            <textarea
              rows={2}
              value={formData.heroDescription !== undefined ? formData.heroDescription : 'Clean silhouettes, oversized fits, and permanent fabrications designed to elevate your daily archives.'}
              onChange={e => handleChange('heroDescription', e.target.value)}
              placeholder="Clean silhouettes, oversized fits..."
              className="w-full p-3 border-2 border-zinc-300 rounded-lg text-xs bg-white focus:border-zinc-950 focus:outline-none resize-none leading-relaxed"
            />
            <span className="text-[10px] text-zinc-400 block">
              Descriptive subtitle paragraph beneath the main title
            </span>
          </div>
        </div>

        {/* 5 Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[0, 1, 2, 3, 4].map(idx => {
            const currentImg = (formData.heroImages && formData.heroImages[idx]) || '';
            const hasCustomImg = !!(formData.heroImages && formData.heroImages[idx]);
            const lower = currentImg.toLowerCase();
            const isVideo = lower.startsWith('data:video') ||
              lower.endsWith('.mp4') ||
              lower.endsWith('.webm') ||
              lower.endsWith('.mov') ||
              lower.endsWith('.ogg') ||
              lower.includes('/video') ||
              lower.includes('video/mp4');

            return (
              <div key={idx} className="border border-zinc-300 rounded-xl p-4 space-y-3 bg-zinc-50/70 flex flex-col justify-between">
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                      {isVideo ? <Film size={15} className="text-amber-600" /> : <ImageIcon size={15} className="text-zinc-600" />}
                      <span>SLIDE #{idx + 1} {idx === 0 ? '(PRIMARY)' : ''}</span>
                    </span>
                    {currentImg && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </div>

                  {/* Media Preview Slot */}
                  <div className="aspect-[16/9] w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-300 relative group flex items-center justify-center">
                    {currentImg ? (
                      isVideo ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video 
                            src={currentImg} 
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover" 
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/85 text-amber-300 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                            <Film size={10} />
                            <span>VIDEO SLIDE</span>
                          </span>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img src={currentImg} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">
                            IMAGE SLIDE
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-1 bg-zinc-200 w-full">
                        <ImageIcon size={28} />
                        <span className="text-xs font-bold uppercase">EMPTY SLOT</span>
                      </div>
                    )}
                  </div>

                  {/* Easy Upload Button */}
                  <label className="w-full py-3 bg-zinc-950 text-white text-xs font-extrabold uppercase tracking-wider rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-xs">
                    <Upload size={16} />
                    <span>UPLOAD IMAGE OR VIDEO</span>
                    <input 
                      type="file" 
                      accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" 
                      className="hidden" 
                      onChange={e => handleHeroMediaUpload(e, (url) => handleHeroImageChange(idx, url))}
                    />
                  </label>

                  {/* Or Paste URL */}
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={(formData.heroImages && formData.heroImages[idx]) || ''} 
                      onChange={e => handleHeroImageChange(idx, e.target.value)}
                      placeholder="Paste image or video URL (e.g. /logo-video.mp4)..."
                      className="w-full p-2.5 border border-zinc-300 rounded-lg font-mono text-xs font-bold text-zinc-950 bg-white focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleHeroImageChange(idx, '/logo-video.mp4')}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-bold uppercase tracking-wider hover:underline cursor-pointer"
                        title="Use preloaded store video"
                      >
                        + USE PRELOADED VIDEO
                      </button>
                    </div>
                  </div>
                </div>

                {hasCustomImg && (
                  <button 
                    type="button"
                    onClick={() => handleHeroImageChange(idx, '')}
                    className="text-xs font-extrabold text-red-600 hover:underline uppercase text-center pt-2"
                  >
                    CLEAR SLIDE #{idx + 1}
                  </button>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* 5. GENERAL STORE & CURRENCY SETTINGS (20% ENLARGED FONTS) */}
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

          <div className="space-y-2">
            <label className="text-sm font-black text-zinc-950 uppercase tracking-wider block">
              Active Storefront Season
            </label>
            <select
              value={formData.activeSeason || 'all'}
              onChange={e => handleChange('activeSeason', e.target.value as any)}
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-black text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 uppercase"
            >
              <option value="all">ALL SEASONS (SHOW ALL PRODUCTS)</option>
              <option value="summer">☀️ SUMMER COLLECTION ONLY</option>
              <option value="winter">❄️ WINTER COLLECTION ONLY</option>
            </select>
          </div>
        </div>

      </div>

      {/* 6. CLIENT SERVICES FOOTER CONTACT INFO (ADDRESS, PHONE, EMAIL) */}
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

      {/* 7. MARKETING & TRACKING PIXELS (META / INSTAGRAM, TIKTOK, GOOGLE, SNAPCHAT) */}
      <div className="border border-zinc-300 rounded-xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <Target className="text-zinc-950" size={24} />
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                MARKETING & TRACKING PIXELS (META, TIKTOK, GOOGLE)
              </h2>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block pt-0.5">
                Tracking Pixels & Analytics for advertising and attribution
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {(formData.womenMetaPixelId || formData.menMetaPixelId || formData.metaPixelId) ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                META PIXELS ACTIVE ({[formData.womenMetaPixelId && '👠 WOMEN', formData.menMetaPixelId && '👔 MEN', formData.metaPixelId && 'MASTER'].filter(Boolean).join(' + ')})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-300 uppercase">
                <Radio size={12} className="text-zinc-400" />
                READY FOR SETUP
              </span>
            )}
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs leading-relaxed text-zinc-700 space-y-1">
          <p className="font-bold text-zinc-950">
            ✦ Tracking Pixels in STYLUXE
          </p>
          <p>
            Once configured, STYLUXE automatically fires events on customer actions:
            Page Views (<span className="font-mono text-zinc-900 font-bold">PageView</span>), 
            Product Views (<span className="font-mono text-zinc-900 font-bold">ViewContent</span>), 
            Add to Bag (<span className="font-mono text-zinc-900 font-bold">AddToCart</span>), 
            Initiate Checkout (<span className="font-mono text-zinc-900 font-bold">InitiateCheckout</span>), 
            and Confirmed Orders (<span className="font-mono text-zinc-900 font-bold">Purchase</span> with value & currency).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          


          {/* TIKTOK PIXEL */}
          <div className="border-2 border-zinc-900/15 rounded-xl p-5 bg-white space-y-3 relative hover:border-zinc-950 transition-colors">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={18} className="text-zinc-950" />
                <span>TikTok Pixel ID</span>
              </label>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded font-mono">
                OPTIONAL
              </span>
            </div>
            <input 
              type="text" 
              value={formData.tiktokPixelId || ''} 
              onChange={e => handleChange('tiktokPixelId', e.target.value.trim())} 
              placeholder="e.g. CXXXXXXXXXXXXXX"
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
            />
            <p className="text-[11px] text-zinc-500 leading-normal">
              💡 <strong>Where to find:</strong> TikTok Ads Manager ➔ Assets ➔ Events ➔ Web Events ➔ Copy Pixel ID.
            </p>
          </div>

          {/* GOOGLE ANALYTICS (GA4) */}
          <div className="border-2 border-zinc-900/15 rounded-xl p-5 bg-white space-y-3 relative hover:border-zinc-950 transition-colors">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                <Globe size={18} className="text-blue-600" />
                <span>Google Analytics (GA4 / Tag ID)</span>
              </label>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded font-mono">
                OPTIONAL
              </span>
            </div>
            <input 
              type="text" 
              value={formData.googleAnalyticsId || ''} 
              onChange={e => handleChange('googleAnalyticsId', e.target.value.trim())} 
              placeholder="e.g. G-XXXXXXXXXX"
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 uppercase"
            />
            <p className="text-[11px] text-zinc-500 leading-normal">
              💡 <strong>Where to find:</strong> Google Analytics ➔ Admin ➔ Data Streams ➔ Copy Measurement ID (starts with G-).
            </p>
          </div>

          {/* SNAPCHAT PIXEL */}
          <div className="border-2 border-zinc-900/15 rounded-xl p-5 bg-white space-y-3 relative hover:border-zinc-950 transition-colors">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                <Radio size={18} className="text-amber-500" />
                <span>Snapchat Pixel ID</span>
              </label>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded font-mono">
                OPTIONAL
              </span>
            </div>
            <input 
              type="text" 
              value={formData.snapchatPixelId || ''} 
              onChange={e => handleChange('snapchatPixelId', e.target.value.trim())} 
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full p-4 border-2 border-zinc-300 rounded-lg font-mono text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
            />
            <p className="text-[11px] text-zinc-500 leading-normal">
              💡 <strong>Where to find:</strong> Snapchat Ads Manager ➔ Events Manager ➔ Copy Pixel ID.
            </p>
          </div>

        </div>
      </div>

      {/* 8. CENTRAL CLOUD DATABASE SYNC (SUPABASE) */}
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
          <h3 className="text-lg font-bold font-serif text-white">DEVELOPED BY: CONTACT DEVELOPER</h3>
          <p className="text-xs text-zinc-400">For technical assistance, maintenance, or feature additions, reach out directly via WhatsApp.</p>
        </div>
        <a
          href="https://wa.me/96181713408"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wider uppercase rounded-lg flex items-center gap-2 transition-all shadow-lg shrink-0"
        >
          <Phone size={14} />
          <span>CONTACT DEVELOPER</span>
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
