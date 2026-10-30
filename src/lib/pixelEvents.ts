'use client';

/**
 * Pixel Events Dispatcher for STYLUXE
 * Dispatches standard e-commerce tracking events across Meta (Facebook/Instagram),
 * TikTok, Google Analytics (GA4), and Snapchat Pixels.
 */

export interface TrackAddToCartPayload {
  id: string;
  title: string;
  price: number;
  quantity?: number;
  currency?: string;
}

export interface TrackViewContentPayload {
  id: string;
  title: string;
  price: number;
  category?: string;
  currency?: string;
}

export interface TrackInitiateCheckoutPayload {
  numItems: number;
  value: number;
  currency?: string;
}

export interface TrackPurchasePayload {
  orderNumber: string;
  value: number;
  currency?: string;
  items: Array<{
    id: string;
    title?: string;
    price: number;
    quantity: number;
  }>;
}

export function trackPixelPageView(path?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('styluxe_pixel_pageview', {
      detail: { path: path || window.location.pathname },
    })
  );
}

export function trackPixelAddToCart(payload: TrackAddToCartPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('styluxe_pixel_add_to_cart', {
      detail: payload,
    })
  );
}

export function trackPixelViewContent(payload: TrackViewContentPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('styluxe_pixel_view_content', {
      detail: payload,
    })
  );
}

export function trackPixelInitiateCheckout(payload: TrackInitiateCheckoutPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('styluxe_pixel_initiate_checkout', {
      detail: payload,
    })
  );
}

export function trackPixelPurchase(payload: TrackPurchasePayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('styluxe_pixel_purchase', {
      detail: payload,
    })
  );
}
