'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/CartContext';

export function VideoIntroSplash() {
  const { settings } = useCart();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close handler with smooth fade/scale transition
  const handleClose = () => {
    setIsExiting(true);
    try {
      sessionStorage.setItem('styluxe_intro_played', Date.now().toString());
    } catch (_) {}
    setTimeout(() => {
      setIsOpen(false);
      setIsExiting(false);
      setHasError(false);
      setIsVideoLoaded(false);
    }, 650);
  };

  useEffect(() => {
    // 1. Never show on admin dashboard
    if (pathname && pathname.startsWith('/admin')) {
      setIsOpen(false);
      return;
    }

    // 2. Check if explicitly disabled in settings
    if (settings.hideIntroVideo === true || settings.enableIntroVideo === false) {
      setIsOpen(false);
      return;
    }

    // 3. Check sessionStorage: only show once per 3 minutes to avoid annoying repeat visits
    try {
      const lastPlayed = sessionStorage.getItem('styluxe_intro_played');
      if (lastPlayed) {
        const timestamp = parseInt(lastPlayed, 10);
        if (Date.now() - timestamp < 180000) {
          setIsOpen(false);
          return;
        }
      }
    } catch (_) {}

    // Open splash
    setIsOpen(true);
    setIsExiting(false);
    setHasError(false);

    // Safety timeout: dismiss after 7 seconds max if video does not end
    const timer = setTimeout(() => {
      handleClose();
    }, 7000);

    return () => clearTimeout(timer);
  }, [pathname, settings.hideIntroVideo, settings.enableIntroVideo]);

  // Listen for manual trigger from Admin panel "Test Intro Splash"
  useEffect(() => {
    const handleManualTrigger = () => {
      setIsOpen(true);
      setIsExiting(false);
      setHasError(false);
      setIsVideoLoaded(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
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
      className={`fixed inset-0 z-[99999999] bg-black flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-700 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none filter blur-xs' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.95)_70%)] pointer-events-none" />

      {/* Top Right SKIP Button */}
      <button
        onClick={handleClose}
        className="absolute top-5 right-5 sm:top-8 sm:right-8 z-50 text-[11px] font-sans font-bold tracking-[0.25em] text-white/70 hover:text-white uppercase transition-all px-4 py-2 rounded-full border border-white/20 hover:border-white/70 backdrop-blur-md bg-black/40 hover:bg-black/60 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
        title="Skip intro / تخطي"
      >
        <span>SKIP</span>
        <span className="text-xs">→</span>
      </button>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-full">
        {/* Video Frame */}
        <div className="relative overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-white/10 bg-black flex items-center justify-center min-w-[280px] min-h-[160px] sm:min-w-[420px] sm:min-h-[240px]">
          {!hasError ? (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setIsVideoLoaded(true)}
              onEnded={handleClose}
              onError={() => {
                console.warn('Intro video failed to load or play, showing fallback brand logo:', videoSrc);
                setHasError(true);
                // Graceful fallback: dismiss smoothly after 1.8s
                setTimeout(handleClose, 1800);
              }}
              className={`w-auto h-auto max-w-[85vw] sm:max-w-[480px] md:max-w-[560px] max-h-[60vh] object-contain block transition-opacity duration-500 ${
                isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            /* Luxury Brand Fallback if video is missing or unsupported */
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 animate-fadeIn">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || 'STYLUXE'}
                  className="h-14 sm:h-18 w-auto object-contain invert animate-pulse"
                />
              ) : (
                <h1 className="font-serif text-2xl sm:text-3xl font-light tracking-[0.4em] text-white uppercase">
                  {settings.storeName || 'STYLUXE'}
                </h1>
              )}
            </div>
          )}

          {/* Subtle loading spinner while video is buffering */}
          {!isVideoLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          )}
        </div>

        {/* Brand Caption */}
        <div className="mt-5 text-center space-y-1.5 animate-fadeIn">
          <h2 className="font-serif text-sm sm:text-base font-light tracking-[0.4em] text-white/90 uppercase">
            {settings.storeName || 'STYLUXE'}
          </h2>
          <span className="text-[10px] font-sans font-normal tracking-[0.3em] text-zinc-400 uppercase block">
            {settings.tagline || 'REDEFINING LUXURY INTERNATIONAL BRANDS'}
          </span>
        </div>
      </div>
    </div>
  );
}
