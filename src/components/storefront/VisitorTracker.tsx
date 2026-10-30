'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordPageVisit } from '@/lib/visitorTracking';

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Record page visit on route transition
    recordPageVisit();
  }, [pathname]);

  return null;
}
