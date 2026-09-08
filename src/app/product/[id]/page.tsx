'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag, ShieldCheck, Truck, RefreshCw, ChevronRight, Check, ZoomIn, X, Maximize2, Ruler } from 'lucide-react';
import { DataService, formatCurrency } from '@/lib/store';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { ProductCard } from '@/components/storefront/ProductCard';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';

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

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { addToCart, currency, settings, wishlist, toggleWishlist } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);

  // ALWAYS SCROLL TO THE TOP IMMEDIATELY WHEN PRODUCT PAGE LOADS OR PRODUCT CHANGES!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }

    if (id) {
      const found = DataService.getProductById(id);
      if (found) {
        setProduct(found);
        const initialColor = found.colors[0] || 'Default';
        const colorImg = (found.colorImages && found.colorImages[initialColor]) || found.images[0] || '';
        setActiveImage(colorImg);

        const firstSize = Object.keys(found.stockPerSize)[0] || 'M';
        setSelectedSize(firstSize);
        setSelectedColor(initialColor);

        // Fetch related products strictly from same department
        const related = DataService.getProducts().filter(
          p => p.id !== id && p.department === found.department
        ).slice(0, 4);
        setRelatedProducts(related);
      }
    }
  }, [id]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-lg font-bold tracking-widest text-zinc-400 uppercase">LUXURY PRODUCT NOT FOUND</h2>
        <Link href="/shop" className="inline-block px-6 py-3 bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest">
          RETURN TO CATALOG
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock = (product.stockPerSize[selectedSize] || 0) <= 0;

  // DYNAMIC IMAGE SWITCHING WHEN A COLOR CIRCLE IS CLICKED!
  const handleSelectColor = (col: string, idx: number) => {
    setSelectedColor(col);
    const targetImage = (product.colorImages && product.colorImages[col]) || product.images[idx] || product.images[0];
    if (targetImage) {
      setActiveImage(targetImage);
    }
  };

  const handleOrderViaWhatsApp = () => {
    const rawNumber = product.department === 'women'
      ? (settings.womenWhatsappNumber || settings.whatsappNumber || '96170123456')
      : (settings.menWhatsappNumber || settings.whatsappNumber || '96170123456');
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const formattedPrice = formatCurrency(product.salePrice || product.price, currency, settings.lbpRate, settings.eurRate);

    const message = `Hello STYLUXE Concierge ✨\n\nI would like to order this item directly:\n• Product: *${product.title}*\n• Brand: *${product.brandName || 'STYLUXE'}*\n• Selected Size: *${selectedSize}*\n• Color: *${selectedColor}*\n• Quantity: *${quantity}*\n• Price: *${formattedPrice}*\n• Link: ${currentUrl}\n\nPlease confirm availability and express courier delivery. Thank you!`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Schema.org Product Structured Data for Google Shopping & Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.title,
            "image": product.images,
            "description": product.description || product.title,
            "brand": {
              "@type": "Brand",
              "name": product.brandName || "STYLUXE"
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": product.salePrice || product.price,
              "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition"
            }
          })
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        <Link href="/" className="hover:text-zinc-950">HOME</Link>
        <ChevronRight size={12} />
        <Link href={`/shop?department=${product.department}`} className="hover:text-zinc-950">{product.department}</Link>
        <ChevronRight size={12} />
        <span className="text-zinc-950 truncate max-w-[200px]">{product.title}</span>
      </nav>

      {/* Main Product Layout (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Main Big Image & Color Circles Swatches (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Big Display Image WITH CLICK-TO-ENLARGE / ZOOM LIGHTBOX MODAL */}
          <div 
            onClick={() => setIsZoomModalOpen(true)}
            className="relative aspect-[4/5] bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 shadow-sm transition-all cursor-zoom-in group"
            title="Click to view full-screen image"
          >
            <img
              src={activeImage}
              alt={`${product.title} - ${selectedColor}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Click to Zoom Overlay Pill Button */}
            <div className="absolute top-4 right-4 bg-zinc-950/80 hover:bg-zinc-950 text-white p-2.5 rounded-full backdrop-blur-xs transition-transform group-hover:scale-110 shadow-lg flex items-center gap-1.5 px-3">
              <ZoomIn size={16} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline">ZOOM</span>
            </div>

            {product.isPreOrder ? (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-widest rounded-md shadow-md">
                PRE-ORDER 2026
              </span>
            ) : product.isNewArrival ? (
              <span className="absolute top-4 left-4 px-3 py-1 bg-zinc-950 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-md">
                NEW 2026
              </span>
            ) : null}
            {product.salePrice && (
              <span className="absolute bottom-4 left-4 px-3 py-1 bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-md">
                SALE
              </span>
            )}
          </div>

          {/* BEAUTIFIED & PERFECTLY CENTERED COLOR CIRCLES SWATCHES */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3 pt-3 pb-3 text-center bg-zinc-50/90 border border-zinc-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-zinc-950">
                <span className="text-zinc-400 font-extrabold">SELECT COLOR:</span>
                <span className="text-amber-600 font-mono font-black border-b-2 border-amber-500 pb-0.5">{selectedColor}</span>
              </div>

              {/* BEAUTIFUL & CENTERED SWATCHES CIRCLES */}
              <div className="flex items-center justify-center flex-wrap gap-4 pt-1">
                {product.colors.map((col, idx) => {
                  const hex = (product.colorHexes && product.colorHexes[col]) || DEFAULT_COLOR_HEXES[col.toLowerCase()] || '#000000';
                  const isSelected = selectedColor === col;
                  const isWhite = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff';
                  
                  return (
                    <button
                      key={col}
                      onClick={() => handleSelectColor(col, idx)}
                      title={col}
                      className={`group relative w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer shadow-md ${
                        isSelected 
                          ? 'ring-4 ring-amber-500/40 ring-offset-2 scale-115 border-2 border-zinc-950 shadow-lg' 
                          : 'border-2 border-zinc-300 hover:border-zinc-950 hover:scale-110 hover:shadow-md'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {/* Active Indicator Ring / Dot */}
                      {isSelected && (
                        <span className={`w-3 h-3 rounded-full shadow-xs transition-transform ${isWhite ? 'bg-zinc-950' : 'bg-white'}`} />
                      )}
                      
                      {/* Subtle Inner Glow Border for Dark Swatches */}
                      {!isWhite && (
                        <span className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                      )}

                      {/* Tooltip on Hover */}
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {col}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Buying Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-8 sticky top-28">
          
          <div className="space-y-2 border-b border-zinc-200 pb-6">
            <span className="text-xs font-extrabold tracking-[0.25em] text-zinc-950 uppercase block">
              {product.brandName || "STYLUXE"}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wider text-zinc-950 uppercase leading-snug">
              {product.title}
            </h1>
            <p className="text-xs text-zinc-500 font-mono tracking-wider pt-1">
              REF / SKU: {product.sku || product.id}
            </p>

            {/* Price Tag */}
            <div className="pt-4 flex items-baseline gap-3">
              {product.salePrice ? (
                <>
                  <span className="text-2xl sm:text-3xl font-extrabold text-red-600">
                    {formatCurrency(product.salePrice, currency, settings.lbpRate, settings.eurRate)}
                  </span>
                  <span className="text-sm font-semibold line-through text-zinc-400">
                    {formatCurrency(product.price, currency, settings.lbpRate, settings.eurRate)}
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                  {formatCurrency(product.price, currency, settings.lbpRate, settings.eurRate)}
                </span>
              )}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold tracking-widest uppercase text-zinc-950">
              <span>SELECT SIZE:</span>
              <button
                type="button"
                onClick={() => openSizeGuide(product.category, product.department)}
                className="inline-flex items-center gap-1.5 text-zinc-900 hover:text-amber-600 underline font-black cursor-pointer transition-colors"
                title="Open Size Guide"
              >
                <Ruler size={14} className="text-amber-500" />
                <span>SIZE GUIDE</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Object.entries(product.stockPerSize).map(([size, stock]) => {
                const isSelected = selectedSize === size;
                const isAvailable = stock > 0;
                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-xs font-extrabold tracking-widest uppercase rounded border transition-all ${
                      isSelected
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                        : isAvailable
                        ? 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950'
                        : 'border-zinc-200 bg-zinc-100 text-zinc-400 line-through cursor-not-allowed'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold tracking-widest uppercase text-zinc-950 block">
              QUANTITY:
            </label>
            <div className="inline-flex items-center border border-zinc-300 rounded overflow-hidden">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-bold text-sm"
              >
                -
              </button>
              <span className="px-6 py-2 text-xs font-extrabold text-zinc-950">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* PRE-ORDER ITEM DELIVERY NOTE BANNER */}
          {product.isPreOrder && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-1">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
                🚀 PRE-ORDER ITEM
              </span>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                {product.preOrderNote || 'Estimated Dispatch: 14-21 Business Days'}
              </p>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-zinc-200">
            <button
              disabled={isOutOfStock}
              onClick={() => addToCart(product, selectedSize, selectedColor, quantity)}
              className={`w-full py-4 rounded-lg text-xs font-black tracking-[0.25em] uppercase flex items-center justify-center gap-3 transition-all shadow-md ${
                isOutOfStock
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                  : product.isPreOrder
                  ? 'bg-amber-400 text-zinc-950 hover:bg-amber-500 font-black'
                  : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              <ShoppingBag size={18} />
              <span>{isOutOfStock ? 'OUT OF STOCK' : product.isPreOrder ? 'PRE-ORDER NOW' : 'ADD TO BAG'}</span>
            </button>

            {/* Direct Instant WhatsApp Order Button */}
            <button
              onClick={handleOrderViaWhatsApp}
              className="w-full py-4 rounded-lg text-xs font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2.5 transition-all shadow-md bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-4 h-4 fill-white" 
                fill="currentColor"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>ORDER VIA WHATSAPP</span>
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className={`w-full py-3.5 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 border transition-all ${
                isWishlisted
                  ? 'border-red-600 bg-red-50 text-red-600'
                  : 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950'
              }`}
            >
              <Heart size={16} className={isWishlisted ? 'fill-red-600' : ''} />
              <span>{isWishlisted ? 'IN WISHLIST' : 'ADD TO WISHLIST'}</span>
            </button>
          </div>

          {/* Guarantees Badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-200 text-center">
            <div className="space-y-1.5">
              <ShieldCheck className="mx-auto text-zinc-950" size={20} />
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-900 block">100% AUTHENTIC</span>
            </div>
            <div className="space-y-1.5">
              <Truck className="mx-auto text-zinc-950" size={20} />
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-900 block">EXPRESS DELIVERY</span>
            </div>
            <div className="space-y-1.5">
              <RefreshCw className="mx-auto text-zinc-950" size={20} />
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-900 block">EASY EXCHANGES</span>
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="pt-6 border-t border-zinc-200 space-y-2">
              <h3 className="text-xs font-extrabold tracking-widest uppercase text-zinc-950">
                DESIGNER NOTE & DETAILS
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed uppercase tracking-wider">
                {product.description}
              </p>
            </div>
          )}

        </div>

      </div>

      {/* FULL-SCREEN HIGH-RESOLUTION IMAGE LIGHTBOX ZOOM MODAL */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute -top-12 right-0 bg-white text-zinc-950 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-2 hover:bg-zinc-200 transition-colors shadow-2xl z-20"
            >
              <X size={18} />
              <span>CLOSE</span>
            </button>

            {/* High-Resolution Zoom Image */}
            <img 
              src={activeImage} 
              alt={product.title} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            
            <div className="mt-4 text-center text-white space-y-1">
              <h4 className="font-serif text-lg font-bold tracking-wider uppercase">{product.title}</h4>
              <p className="text-xs font-mono text-zinc-400 uppercase">COLOR: {selectedColor}</p>
            </div>

          </div>
        </div>
      )}

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-8 pt-12 border-t border-zinc-200">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-extrabold tracking-widest text-amber-600 uppercase block">
              CURATED SELECTION
            </span>
            <h2 className="font-serif text-2xl font-bold tracking-widest uppercase text-zinc-950">
              YOU MAY ALSO LIKE
            </h2>
          </div>

          <div className="product-grid">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
