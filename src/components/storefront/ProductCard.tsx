'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { formatCurrency } from '@/lib/store';

const DEFAULT_COLOR_HEXES: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  charcoal: '#36454F',
  grey: '#808080',
  gray: '#808080',
  red: '#DC2626',
  blue: '#2563EB',
  navy: '#000080',
  green: '#16A34A',
  beige: '#F5F5DC',
  gold: '#D4AF37',
  silver: '#C0C0C0',
  brown: '#8B4513',
  pink: '#EC4899',
  yellow: '#EAB308',
  purple: '#9333EA',
  orange: '#F97316'
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, currency, settings } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>(
    Object.keys(product.stockPerSize)[0] || 'M'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors[0] || 'Default'
  );

  const primaryImage = product.images[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800';

  const handleProductClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  };

  return (
    <div className="product-card group">
      {/* Product Image Wrapper */}
      <div className="product-img-wrapper">
        <Link href={`/product/${product.id}`} onClick={handleProductClick} scroll={true}>
          <img 
            src={primaryImage} 
            alt={product.title} 
          />
        </Link>

        {/* Badges - 100% Match to Classic Styluxe Reference */}
        {product.isPreOrder ? (
          <span className="product-badge bg-amber-400 text-zinc-950 font-black">
            PRE-ORDER
          </span>
        ) : product.salePrice ? (
          <span className="product-badge bg-red-600 text-white font-black">
            SALE
          </span>
        ) : (
          <span className="product-badge">
            NEW ARRIVAL
          </span>
        )}

        {/* Quick View Drawer */}
        <div className="product-quick-view">
          <div className="flex flex-wrap gap-1 justify-center mb-2">
            {Object.keys(product.stockPerSize).map((size) => (
              <button 
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`text-[10px] font-extrabold px-2 py-1 border transition-colors ${
                  selectedSize === size
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <button 
            onClick={() => addToCart(product, selectedSize, selectedColor, 1)}
            className={`quick-view-btn flex items-center justify-center gap-2 ${
              product.isPreOrder ? 'bg-amber-400 text-zinc-950 hover:bg-amber-500 font-black' : ''
            }`}
          >
            <ShoppingBag size={14} /> {product.isPreOrder ? 'PRE-ORDER NOW' : 'ADD TO BAG'}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info space-y-1 pt-3">
        {/* Line 1: BRAND NAME (DEFAULTS TO STYLUXE IF UNSET MATCHING SCREENSHOT) */}
        <span className="product-brand font-black tracking-widest text-zinc-950 uppercase text-xs block">
          {product.brandName && product.brandName.trim() !== '' ? product.brandName : 'STYLUXE'}
        </span>

        {/* Line 2: PRODUCT TITLE */}
        <Link href={`/product/${product.id}`} onClick={handleProductClick} scroll={true}>
          <h3 className="product-name font-medium tracking-wide text-zinc-800 hover:text-zinc-950 uppercase text-xs line-clamp-1">
            {product.title}
          </h3>
        </Link>

        {/* Line 3: PRICE */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs font-black text-zinc-950">
            {formatCurrency(product.salePrice || product.price, currency, settings.lbpRate, settings.eurRate)}
          </span>
          {product.salePrice && (
            <span className="text-[11px] text-zinc-400 line-through">
              {formatCurrency(product.price, currency, settings.lbpRate, settings.eurRate)}
            </span>
          )}
        </div>

        {/* Smart Visual Color Swatches with tooltips */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {product.colors.map((color) => {
              const hex = (product.colorHexes && product.colorHexes[color]) || DEFAULT_COLOR_HEXES[color.toLowerCase()] || '#000000';
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform border ${
                    isSelected ? 'ring-2 ring-zinc-950 ring-offset-1 scale-110 border-zinc-950' : 'border-zinc-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`${color} (${hex})`}
                />
              );
            })}
          </div>
        )}

        {/* Line 3: PRICE TAG */}
        <div className="product-price font-extrabold tracking-wide text-zinc-950 pt-1">
          {product.salePrice ? (
            <div className="flex items-center gap-2 justify-center">
              <span className="text-red-600">
                {formatCurrency(product.salePrice, currency, settings.lbpRate, settings.eurRate)}
              </span>
              <span className="line-through text-zinc-400 text-xs font-normal">
                {formatCurrency(product.price, currency, settings.lbpRate, settings.eurRate)}
              </span>
            </div>
          ) : (
            <span>
              {formatCurrency(product.price, currency, settings.lbpRate, settings.eurRate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
