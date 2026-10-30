'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { formatCurrency, getProductDisplayPrices } from '@/lib/store';

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
    Object.keys(product.stockPerSize || {})[0] || 'M'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0] || 'Default'
  );

  const [activeImage, setActiveImage] = useState<string>(
    product.images?.[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800'
  );

  // Images to cycle: all images uploaded without color / product images
  const cardImages = React.useMemo(() => {
    return Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : [];
  }, [product.images]);

  // Sync activeImage if cardImages changes
  React.useEffect(() => {
    if (cardImages.length > 0 && !cardImages.includes(activeImage)) {
      setActiveImage(cardImages[0]);
    }
  }, [cardImages]);

  // Automatic 5-second rotation for product images
  React.useEffect(() => {
    if (cardImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImage(current => {
        const currIdx = cardImages.indexOf(current);
        const nextIdx = currIdx >= 0 ? (currIdx + 1) % cardImages.length : 0;
        return cardImages[nextIdx];
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [cardImages]);

  const totalStock = Object.values(product.stockPerSize || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const isAllOutOfStock = !product.isPreOrder && (totalStock <= 0 || (product.totalStock !== undefined && product.totalStock <= 0));
  const currentSizeStock = (product.stockPerSize && product.stockPerSize[selectedSize] !== undefined) 
    ? Number(product.stockPerSize[selectedSize]) 
    : totalStock;
  const isCurrentSizeOut = !product.isPreOrder && currentSizeStock <= 0;

  const handleSelectColor = (col: string, idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(col);
    let targetImage = '';
    if (product.colorImages && product.colorImages[col]) {
      const cVal = product.colorImages[col];
      targetImage = Array.isArray(cVal) ? (cVal[0] || '') : (cVal || '');
    }
    if (!targetImage) {
      targetImage = product.images?.[idx] || product.images?.[0] || '';
    }
    if (targetImage) {
      setActiveImage(targetImage);
    }
  };

  const { currentPrice, oldPrice, hasDiscount } = getProductDisplayPrices(product.price, product.salePrice);

  return (
    <div className="product-card group">
      {/* Product Image Wrapper */}
      <div className="product-img-wrapper relative">
        <Link href={`/product/${encodeURIComponent(product.id)}`} className="block w-full h-full cursor-pointer">
          <img 
            src={activeImage} 
            alt={product.title} 
            loading="lazy"
            decoding="async"
            className={`transition-all duration-300 ${isAllOutOfStock ? 'opacity-60 grayscale-[30%]' : ''}`}
          />
        </Link>

        {/* Badges - 100% Match to Classic Styluxe Reference */}
        {isAllOutOfStock ? (
          <span className="product-badge bg-red-600 text-white font-black tracking-wider flex items-center gap-1 shadow-md">
            OUT OF STOCK
          </span>
        ) : product.isPreOrder ? (
          <span className="product-badge bg-amber-400 text-zinc-950 font-black">
            PRE-ORDER
          </span>
        ) : hasDiscount ? (
          <span className="product-badge bg-red-600 text-white font-black">
            SALE
          </span>
        ) : (
          <span className="product-badge">
            NEW ARRIVAL
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info space-y-1 pt-3">
        {/* Line 1: BRAND NAME */}
        <Link href={`/product/${encodeURIComponent(product.id)}`}>
          <span className="product-brand font-bold tracking-[0.14em] text-zinc-950 hover:text-amber-600 transition-colors uppercase text-[13px] block">
            {product.brandName && product.brandName.trim() !== '' ? product.brandName : 'STYLUXE'}
          </span>
        </Link>

        {/* Line 2: PRODUCT TITLE */}
        <Link href={`/product/${encodeURIComponent(product.id)}`}>
          <h3 className="product-name font-bold tracking-[0.05em] text-zinc-900 hover:text-zinc-950 uppercase text-[14px] line-clamp-1">
            {product.title}
          </h3>
        </Link>
        {product.shortDescription && (
          <p className="text-[11px] text-zinc-500 line-clamp-1 font-medium tracking-wide">
            {product.shortDescription}
          </p>
        )}

        {/* Line 3: Color Swatches Circles (Visible only when multiple colors exist) */}
        {product.colors && product.colors.filter(c => c && c.toLowerCase() !== 'default' && c.toLowerCase() !== 'standard').length > 1 && (
          <div className="flex items-center justify-center gap-2 py-1.5">
            {product.colors.map((color, idx) => {
              const hex = (product.colorHexes && product.colorHexes[color]) || DEFAULT_COLOR_HEXES[color.toLowerCase()] || '#000000';
              const isSelected = selectedColor === color;
              const isWhite = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff';
              return (
                <button
                  key={color}
                  type="button"
                  onClick={(e) => handleSelectColor(color, idx, e)}
                  className={`w-4 h-4 rounded-full transition-all duration-200 border cursor-pointer ${
                    isSelected 
                      ? 'ring-2 ring-zinc-950 ring-offset-2 scale-110 border-zinc-950 shadow-sm' 
                      : 'border-zinc-300 hover:scale-110 hover:border-zinc-600'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`${color} (${hex})`}
                >
                  {isWhite && <span className="sr-only">White</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Line 4: PRICE TAG */}
        <div className="product-price font-extrabold tracking-wide text-zinc-950 pt-0.5 text-[15px]">
          {hasDiscount && oldPrice ? (
            <div className="flex items-center gap-2 justify-center">
              <span className="text-red-600">
                {formatCurrency(currentPrice, currency, settings.lbpRate, settings.eurRate)}
              </span>
              <span className="line-through text-zinc-400 text-xs font-normal">
                {formatCurrency(oldPrice, currency, settings.lbpRate, settings.eurRate)}
              </span>
            </div>
          ) : (
            <span>
              {formatCurrency(currentPrice, currency, settings.lbpRate, settings.eurRate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
