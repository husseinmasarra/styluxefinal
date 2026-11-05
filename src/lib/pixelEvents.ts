'use client';

import { Department } from './types';

/**
 * Pixel Events Dispatcher for STYLUXE
 * Dispatches standard e-commerce tracking events across Meta (Facebook/Instagram),
 * TikTok, Google Analytics (GA4), and Snapchat Pixels.
 * 
 * Includes DEPARTMENT-BASED META PIXEL ROUTING (Strict separation between Men and Women Pixels)
 */

export type PixelDepartment = Department | 'both';

export interface TrackAddToCartPayload {
  id: string;
  title: string;
  price: number;
  quantity?: number;
  currency?: string;
  department?: PixelDepartment;
}

export interface TrackViewContentPayload {
  id: string;
  title: string;
  price: number;
  category?: string;
  currency?: string;
  department?: PixelDepartment;
}

export interface TrackInitiateCheckoutPayload {
  numItems: number;
  value: number;
  currency?: string;
  department?: PixelDepartment;
}

export interface TrackPurchaseItem {
  id: string;
  title?: string;
  price: number;
  quantity: number;
  department?: PixelDepartment;
}

export interface TrackPurchasePayload {
  orderNumber: string;
  value: number;
  currency?: string;
  department?: PixelDepartment;
  items: TrackPurchaseItem[];
}

export function trackPixelPageView(path?: string, department?: PixelDepartment) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('styluxe_pixel_pageview', {
      detail: { path: path || window.location.pathname, department },
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
