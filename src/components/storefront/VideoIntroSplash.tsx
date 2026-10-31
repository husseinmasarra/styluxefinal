'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';

export function VideoIntroSplash() {
  const { settings } = useCart();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close handler with smooth fade/scale transition
  const handleClose = () => {
    if (isExiting) return;
    setIsExiting(true);
    try {
      sessionStorage.setItem('styluxe_intro_seen_session', 'true');
    } catch (_) {}
    setTimeout(() => {
      setIsOpen(false);
      setIsExiting(false);
      setHasError(false);
      setIsVideoLoaded(false);
      setProgress(0);
    }, 700);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Check conditions and trigger video on homepage
  useEffect(() => {
    // 1. Never show on admin dashboard
    if (pathname && pathname.startsWith('/admin')) {
      setIsOpen(false);
      return;
    }

    // 2. Only show on the homepage (before opening the home page)
    if (pathname !== '/') {
      setIsOpen(false);
      return;
    }

    // 3. Check if explicitly disabled in settings
    if (settings.hideIntroVideo === true || settings.enableIntroVideo === false) {
      setIsOpen(false);
      return;
    }

    // 4. Check frequency mode
    if (settings.introVideoMode === 'once_per_session') {
      try {
        const seen = sessionStorage.getItem('styluxe_intro_seen_session');
        if (seen === 'true') {
          setIsOpen(false);
          return;
        }
      } catch (_) {}
    }

    // Open splash immediately
    setIsOpen(true);
    setIsExiting(false);
    setHasError(false);
    setProgress(0);

    // Generous safety timeout: dismiss after 16 seconds if video is stalled
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      handleClose();
    }, 16000);

    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [pathname, settings.hideIntroVideo, settings.enableIntroVideo, settings.introVideoMode]);

  // Programmatic autoplay enforcement on mount or source change
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        setIsMuted(true);
        videoRef.current.play().catch((err) => {
          console.log('Autoplay deferred or pending user gesture:', err);
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Listen for manual trigger from Admin panel "Test Intro Splash"
  useEffect(() => {
    const handleManualTrigger = () => {
      setIsOpen(true);
      setIsExiting(false);
      setHasError(false);
      setIsVideoLoaded(false);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        setIsMuted(true);
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('styluxe_trigger_intro_splash', handleManualTrigger);
    return () => window.removeEventListener('styluxe_trigger_intro_splash', handleManualTrigger);
  }, []);

  if (!isOpen) return null;

  // Resolve video source (User's uploaded video, direct URL, or fallback)
  const videoSrc = settings.introVideoUrl || settings.logoVideoUrl || '/logo-video.mp4';

  return (
    <div
      className={`fixed inset-0 z-[99999999] bg-black flex flex-col items-center justify-between select-none overflow-hidden transition-all duration-700 ease-out p-4 sm:p-8 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none filter blur-xs' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.98)_75%)] pointer-events-none" />

      {/* TOP HEADER CONTROLS */}
      <div className="relative z-50 w-full flex items-center justify-between max-w-5xl mx-auto pt-2">
        {/* Brand Monogram */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-serif text-xs sm:text-sm font-bold tracking-[0.3em] text-white uppercase">
            {settings.storeName || 'STYLUXE'}
          </span>
        </div>

        {/* Right Action Buttons: Unmute & Skip */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleSound}
            className="px-3 sm:px-4 py-2 rounded-full text-[11px] font-sans font-bold tracking-wider uppercase border border-white/20 hover:border-white/60 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-amber-400 animate-pulse" />}
            <span className="hidden sm:inline">{isMuted ? 'UNMUTE' : 'SOUND ON'}</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-full text-[11px] font-sans font-bold tracking-[0.25em] text-white uppercase border border-white/25 hover:border-white bg-black/50 hover:bg-white hover:text-black transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
            title="Skip Intro"
          >
            <span>SKIP INTRO</span>
            <span className="text-xs">➔</span>
          </button>
        </div>
      </div>

      {/* CENTER VIDEO PRESENTATION */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-4xl px-2">
        <div className="relative overflow-hidden rounded-2xl shadow-[0_0_80px_rgba(255,255,255,0.12)] border border-white/15 bg-black flex items-center justify-center max-w-full">
          {!hasError ? (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setIsVideoLoaded(true)}
              onTimeUpdate={() => {
                if (videoRef.current && videoRef.current.duration) {
                  const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                  setProgress(pct);
                }
              }}
              onEnded={handleClose}
              onError={() => {
                console.warn('Intro video failed to load or play, showing fallback brand logo:', videoSrc);
                setHasError(true);
                setTimeout(handleClose, 2000);
              }}
              className={`w-auto h-auto max-w-[92vw] sm:max-w-[560px] md:max-w-[680px] max-h-[58vh] sm:max-h-[64vh] object-contain block transition-opacity duration-500 ${
                isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : (
            /* Luxury Brand Fallback if video is missing or unsupported */
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-fadeIn">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || 'STYLUXE'}
                  className="h-16 sm:h-20 w-auto object-contain invert animate-pulse"
                />
              ) : (
                <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-[0.45em] text-white uppercase">
                  {settings.storeName || 'STYLUXE'}
                </h1>
              )}
              <span className="text-xs font-sans tracking-[0.3em] text-zinc-400 uppercase">
                {settings.tagline || 'REDEFINING LUXURY INTERNATIONAL BRANDS'}
              </span>
            </div>
          )}

          {/* Loading spinner while video is buffering */}
          {!isVideoLoaded && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span className="text-[11px] font-sans tracking-[0.25em] text-zinc-400 uppercase">
                LOADING CINEMATIC INTRO...
              </span>
            </div>
          )}
        </div>

        {/* Brand Caption Under Video */}
        <div className="mt-4 text-center space-y-1 animate-fadeIn">
          <h2 className="font-serif text-base sm:text-lg font-light tracking-[0.4em] text-white uppercase">
            {settings.storeName || 'STYLUXE'}
          </h2>
          <span className="text-[10px] sm:text-xs font-sans tracking-[0.3em] text-zinc-400 uppercase block">
            {settings.tagline || 'REDEFINING LUXURY INTERNATIONAL BRANDS'}
          </span>
        </div>
      </div>

      {/* BOTTOM ACTION & PROGRESS */}
      <div className="relative z-50 w-full max-w-xl mx-auto flex flex-col items-center gap-4 pb-2">
        {/* Main "ENTER BOUTIQUE" Call to Action */}
        <button
          type="button"
          onClick={handleClose}
          className="group px-8 sm:px-10 py-3.5 sm:py-4 bg-white hover:bg-zinc-100 text-black text-xs sm:text-sm font-black tracking-[0.3em] uppercase rounded-full shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all flex items-center gap-3 cursor-pointer active:scale-95 border-2 border-white"
        >
          <span>ENTER BOUTIQUE</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
        </button>

        {/* Video Playback Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 via-white to-amber-300 h-full transition-all duration-150 ease-linear rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
