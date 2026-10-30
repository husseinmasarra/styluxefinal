'use client';

export interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  activeNow: number;
  lastVisitTimestamp: number;
}

// v2 key starts completely fresh from ZERO (0)
const VISITOR_KEY = 'styluxe_visitor_stats_v2';
const VISITOR_UUID_KEY = 'styluxe_visitor_uuid_v2';
const BASELINE_VISITORS = 0; // Strictly zero

export function resetVisitorStats(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(VISITOR_KEY);
    localStorage.removeItem(VISITOR_UUID_KEY);
    // Also remove old v1 keys if any
    localStorage.removeItem('styluxe_visitor_stats_v1');
    localStorage.removeItem('styluxe_visitor_uuid_v1');
    
    const freshStats = {
      totalVisitors: 0,
      todayVisitors: 0,
      lastDate: new Date().toISOString().slice(0, 10),
      lastVisitTimestamp: Date.now(),
    };
    localStorage.setItem(VISITOR_KEY, JSON.stringify(freshStats));
    window.dispatchEvent(new Event('styluxe_visitor_updated'));
  } catch (err) {
    console.warn('Error resetting visitor stats:', err);
  }
}

export function recordPageVisit(): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Check or generate unique visitor token
    let visitorId = localStorage.getItem(VISITOR_UUID_KEY);
    const isNewVisitor = !visitorId;
    if (isNewVisitor) {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 11) + '_' + now;
      localStorage.setItem(VISITOR_UUID_KEY, visitorId);
    }

    // Read existing stats
    let raw = localStorage.getItem(VISITOR_KEY);
    let stats = {
      totalVisitors: BASELINE_VISITORS,
      todayVisitors: 0,
      lastDate: todayStr,
      lastVisitTimestamp: now,
    };

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        stats = { ...stats, ...parsed };
      } catch (_) {}
    }

    // Reset today count if it's a new calendar day
    if (stats.lastDate !== todayStr) {
      stats.lastDate = todayStr;
      stats.todayVisitors = 0;
    }

    // Increment strictly on real visits
    stats.totalVisitors += 1;
    stats.todayVisitors += 1;
    stats.lastVisitTimestamp = now;

    localStorage.setItem(VISITOR_KEY, JSON.stringify(stats));
    window.dispatchEvent(new Event('styluxe_visitor_updated'));
  } catch (err) {
    console.warn('Visitor tracking error:', err);
  }
}

export function getVisitorStats(): VisitorStats {
  if (typeof window === 'undefined') {
    return {
      totalVisitors: 0,
      todayVisitors: 0,
      activeNow: 0,
      lastVisitTimestamp: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(VISITOR_KEY);
    const todayStr = new Date().toISOString().slice(0, 10);
    let stats = {
      totalVisitors: 0,
      todayVisitors: 0,
      lastDate: todayStr,
      lastVisitTimestamp: Date.now(),
    };

    if (raw) {
      const parsed = JSON.parse(raw);
      stats = { ...stats, ...parsed };
    }

    // Active now is minimum 1 if someone is currently viewing, otherwise proportion of total
    let activeNow = 0;
    if (stats.totalVisitors > 0) {
      activeNow = 1; // Currently viewing session
      if (stats.todayVisitors > 5) {
        activeNow = Math.min(stats.todayVisitors, Math.floor(stats.todayVisitors * 0.15) + 1);
      }
    }

    return {
      totalVisitors: stats.totalVisitors,
      todayVisitors: stats.todayVisitors,
      activeNow,
      lastVisitTimestamp: stats.lastVisitTimestamp,
    };
  } catch (_) {
    return {
      totalVisitors: 0,
      todayVisitors: 0,
      activeNow: 0,
      lastVisitTimestamp: Date.now(),
    };
  }
}

/**
 * Returns dynamic viewer count for product social proof
 */
export function getProductLiveViewers(productId: string): number {
  if (!productId) return 5;
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const timeBlock = Math.floor(Date.now() / (1000 * 60 * 4));
  const combinedSeed = (positiveHash + timeBlock) % 10; // 0 to 9

  return 3 + combinedSeed; // 3 to 12 viewers
}
