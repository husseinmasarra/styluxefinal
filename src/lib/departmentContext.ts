'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DataService } from './store';
import { StoreSettings } from './types';

/**
 * Cleanly format WhatsApp URL, guaranteeing Lebanese 8-digit numbers have country code 961
 */
export function formatWhatsAppUrl(rawNumber?: string, message?: string): string {
  if (!rawNumber) return 'https://wa.me/96178709321';
  let clean = rawNumber.replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    clean = '961' + clean;
  }
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${textParam}`;
}

/**
 * Resolves current department from pathname, search params, product data, or active toggle
 */
export function getDepartmentFromLocation(pathname: string): 'women' | 'men' {
  if (typeof window === 'undefined') return 'women';

  // 1. Check URL query param: ?department=men or ?department=women
  try {
    const params = new URLSearchParams(window.location.search);
    const deptParam = params.get('department')?.toLowerCase();
    if (deptParam === 'men') return 'men';
    if (deptParam === 'women') return 'women';
  } catch (e) {
    // SSR or fallback
  }

  // 2. Check if product page: /product/[id]
  if (pathname && pathname.startsWith('/product/')) {
    const segments = pathname.split('/');
    const productId = segments[segments.length - 1];
    if (productId) {
      try {
        const prod = DataService.getProductById(productId);
        if (prod && prod.department === 'men') return 'men';
        if (prod && prod.department === 'women') return 'women';
      } catch (e) {
        // Fallback
      }
    }
  }

  // 3. Check localStorage active department (from homepage toggle)
  try {
    const stored = localStorage.getItem('styluxe_active_department');
    if (stored === 'men') return 'men';
  } catch (e) {
    // Fallback
  }

  return 'women';
}

/**
 * Custom React Hook to get active department, dynamic Instagram & WhatsApp links per page
 */
export function useActiveDepartment(settings?: StoreSettings) {
  const pathname = usePathname();
  const [dept, setDept] = useState<'women' | 'men'>('women');

  useEffect(() => {
    const updateDept = () => {
      setDept(getDepartmentFromLocation(pathname || ''));
    };

    updateDept();

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'men' || customEvent.detail === 'women') {
        setDept(customEvent.detail);
      }
    };

    window.addEventListener('styluxe_department_changed', handleCustomEvent);
    window.addEventListener('storage', updateDept);
    return () => {
      window.removeEventListener('styluxe_department_changed', handleCustomEvent);
      window.removeEventListener('storage', updateDept);
    };
  }, [pathname]);

  const womenInstagram = (settings?.womenInstagramUrl && settings.womenInstagramUrl.trim()) 
    || 'https://www.instagram.com/stories/styluxe.womenn/';
  const menInstagram = (settings?.menInstagramUrl && settings.menInstagramUrl.trim()) 
    || 'https://www.instagram.com/stories/styluxe.men_lb/';

  const womenWhatsapp = settings?.womenWhatsappNumber || '78709321';
  const menWhatsapp = settings?.menWhatsappNumber || '79024934';

  const activeInstagram = dept === 'men' ? menInstagram : womenInstagram;
  const activeWhatsappNumber = dept === 'men' ? menWhatsapp : womenWhatsapp;
  const activeWhatsappUrl = formatWhatsAppUrl(activeWhatsappNumber);

  return {
    department: dept,
    instagramUrl: activeInstagram,
    whatsappUrl: activeWhatsappUrl,
    whatsappNumber: activeWhatsappNumber,
    womenInstagramUrl: womenInstagram,
    menInstagramUrl: menInstagram,
    womenWhatsappUrl: formatWhatsAppUrl(womenWhatsapp),
    menWhatsappUrl: formatWhatsAppUrl(menWhatsapp),
  };
}

/**
 * Dispatch helper when switching departments (e.g. clicking FOR HER / FOR HIM)
 */
export function setActiveDepartment(dept: 'women' | 'men') {
  if (typeof window !== 'undefined') {
    localStorage.setItem('styluxe_active_department', dept);
    window.dispatchEvent(new CustomEvent('styluxe_department_changed', { detail: dept }));
  }
}
