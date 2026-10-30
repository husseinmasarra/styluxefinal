'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag, ShieldCheck, Truck, RefreshCw, ChevronRight, Check, X, Ruler, AlertCircle, Instagram } from 'lucide-react';
import { DataService, formatCurrency, getProductDisplayPrices } from '@/lib/store';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { ProductCard } from '@/components/storefront/ProductCard';
import { openSizeGuide } from '@/components/storefront/SizeGuideModal';
import { setActiveDepartment } from '@/lib/departmentContext';
import { trackPixelViewContent } from '@/lib/pixelEvents';
import { getSupabaseClient } from '@/lib/supabase';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const mainImageRef = React.useRef<HTMLDivElement>(null);
  const currentScaleRef = React.useRef<number>(1);
  const currentPanRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = React.useRef<boolean>(false);
  const isMouseDownRef = React.useRef<boolean>(false);
  const mouseDragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleResetZoom = () => {
    currentScaleRef.current = 1;
    currentPanRef.current = { x: 0, y: 0 };
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // Keyboard shortcut listener: ESC to close image zoom lightbox & lock scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomModalOpen) {
        setIsZoomModalOpen(false);
        handleResetZoom();
      }
    };
    if (isZoomModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomModalOpen]);

  // NATIVE PINCH-TO-ZOOM WITH FINGERS (iOS Safari, Android Chrome & Trackpad)
  useEffect(() => {
    if (!isZoomModalOpen) return;
    const el = viewportRef.current;
    if (!el) return;

    let initialPinchDist = 0;
    let initialPinchScale = 1;
    let initialPinchCenter = { x: 0, y: 0 };
    let initialPinchPan = { x: 0, y: 0 };
    let isPinching = false;
    let isTouchPanning = false;
    let touchPanStart = { x: 0, y: 0 };
    let lastTapTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        isTouchPanning = false;
        hasMovedRef.current = true;
        setIsDragging(true);

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialPinchScale = currentScaleRef.current;
        initialPinchCenter = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        initialPinchPan = { ...currentPanRef.current };
      } else if (e.touches.length === 1) {
        const now = Date.now();
        // Double-tap gesture (finger)
        if (now - lastTapTime < 300) {
          e.preventDefault();
          if (currentScaleRef.current > 1.2) {
            handleResetZoom();
          } else {
            currentScaleRef.current = 2.5;
            setZoomScale(2.5);
          }
          lastTapTime = 0;
          return;
        }
        lastTapTime = now;

        if (currentScaleRef.current > 1) {
          e.preventDefault();
          isTouchPanning = true;
          isPinching = false;
          hasMovedRef.current = false;
          setIsDragging(true);
          touchPanStart = {
            x: e.touches[0].clientX - currentPanRef.current.x,
            y: e.touches[0].clientY - currentPanRef.current.y,
          };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (initialPinchDist > 0) {
          const factor = currentDist / initialPinchDist;
          const nextScale = Math.min(5, Math.max(0.8, +(initialPinchScale * factor).toFixed(3)));

          const currentCenter = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          };
          const deltaX = currentCenter.x - initialPinchCenter.x;
          const deltaY = currentCenter.y - initialPinchCenter.y;

          currentScaleRef.current = nextScale;
          currentPanRef.current = {
            x: initialPinchPan.x + deltaX,
            y: initialPinchPan.y + deltaY,
          };

          setZoomScale(nextScale);
          setPanPosition({ ...currentPanRef.current });
        }
      } else if (isTouchPanning && e.touches.length === 1 && currentScaleRef.current > 1) {
        e.preventDefault();
        hasMovedRef.current = true;
        const newX = e.touches[0].clientX - touchPanStart.x;
        const newY = e.touches[0].clientY - touchPanStart.y;
        currentPanRef.current = { x: newX, y: newY };
        setPanPosition({ x: newX, y: newY });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      setIsDragging(false);
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
        if (currentScaleRef.current < 1.05) {
          handleResetZoom();
        }
      }
      if (e.touches.length === 0) {
        isTouchPanning = false;
        if (currentScaleRef.current < 1.05) {
          handleResetZoom();
        }
      }
    };

    // Computer / Laptop Trackpad Pinch & Mouse Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.ctrlKey ? -e.deltaY * 0.015 : -e.deltaY * 0.005;
      const nextScale = Math.min(5, Math.max(1, +(currentScaleRef.current + delta).toFixed(2)));
      currentScaleRef.current = nextScale;
      if (nextScale === 1) {
        currentPanRef.current = { x: 0, y: 0 };
      }
      setZoomScale(nextScale);
      setPanPosition({ ...currentPanRef.current });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, [isZoomModalOpen]);

  // Pinch-to-Open on Main Product Image with 2 fingers
  useEffect(() => {
    const el = mainImageRef.current;
    if (!el) return;

    let startDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        startDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (currentDist - startDist > 25) {
          e.preventDefault();
          const initialFactor = Math.min(3, Math.max(1.3, +(currentDist / startDist).toFixed(2)));
          currentScaleRef.current = initialFactor;
          setZoomScale(initialFactor);
          setIsZoomModalOpen(true);
          startDist = 0;
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // Mouse pan drag handlers (Computer)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    isMouseDownRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    mouseDragStartRef.current = {
      x: e.clientX - currentPanRef.current.x,
      y: e.clientY - currentPanRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || zoomScale <= 1) return;
    hasMovedRef.current = true;
    const newX = e.clientX - mouseDragStartRef.current.x;
    const newY = e.clientY - mouseDragStartRef.current.y;
    currentPanRef.current = { x: newX, y: newY };
    setPanPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setIsDragging(false);
  };

  // Load product reliably, decode URI, listen to cloud data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }

    const applyProduct = (found: Product) => {
      setProduct(found);
      setLoading(false);
      trackPixelViewContent({
        id: found.id,
        title: found.title,
        price: found.salePrice || found.price,
        category: found.category,
        currency: currency || 'USD',
      });
      if (found.department === 'men' || found.department === 'women') {
        setActiveDepartment(found.department);
      }
      const initialColor = found.colors?.[0] || 'Default';
      let colorImg = found.images?.[0] || '';
      if (found.colorImages && found.colorImages[initialColor]) {
        const cVal = found.colorImages[initialColor];
        colorImg = Array.isArray(cVal) ? (cVal[0] || colorImg) : (cVal || colorImg);
      }
      setActiveImage(colorImg);

      const firstSize = Object.keys(found.stockPerSize || {})[0] || 'M';
      setSelectedSize(firstSize);
      setSelectedColor(initialColor);

      // Fetch related products strictly from same department
      const related = DataService.getProducts().filter(
        p => p.id !== found.id && p.department === found.department
      ).slice(0, 4);
      setRelatedProducts(related);
    };

    const loadProduct = async () => {
      if (!id) return;
      // 1. Check local cache
      const found = DataService.getProductById(id);
      if (found) {
        applyProduct(found);
        return;
      }

      // 2. Direct fast query to Supabase by ID or slug (resolves instantly on mobile)
      try {
        const client = getSupabaseClient();
        const cleanId = decodeURIComponent(id).trim();
        const { data: row } = await client
          .from('products')
          .select('*')
          .or(`id.eq.${cleanId},slug.eq.${cleanId}`)
          .maybeSingle();

        if (row) {
          const directProd: Product = {
            ...(row.data || {}),
            id: row.id,
            title: row.title || row.data?.title || 'Product',
            slug: row.slug || row.id,
            department: (row.department || row.data?.department || row.data?.gender || 'women').toLowerCase(),
            category: row.category || row.data?.category || 'General',
            brandId: row.brand_id || row.data?.brandId || '',
            brandName: row.brand_name || row.data?.brandName || '',
            price: Number(row.price ?? row.data?.price) || 0,
            salePrice: row.sale_price ? Number(row.sale_price) : (row.data?.salePrice ? Number(row.data?.salePrice) : undefined),
            sku: row.sku || row.id,
            stockPerSize: row.stock_per_size || row.data?.stockPerSize || {},
            totalStock: Number(row.total_stock ?? row.data?.totalStock) || 0,
            colors: row.colors || row.data?.colors || [],
            images: row.images || row.data?.images || [],
            description: row.description || row.data?.description || '',
            shortDescription: row.short_description || row.data?.shortDescription || undefined,
            season: row.season || row.data?.season || 'All Seasons',
            isFeatured: !!(row.is_featured ?? row.data?.isFeatured),
            isNewArrival: !!(row.is_new_arrival ?? row.data?.isNewArrival ?? true),
            createdAt: row.created_at || row.updated_at || row.data?.createdAt || new Date().toISOString(),
          };
          applyProduct(directProd);
          DataService.saveProduct(directProd);
          return;
        }
      } catch (err) {
        console.warn('Direct product fetch error:', err);
      }
      setLoading(false);
    };

    loadProduct();

    // Listen for Supabase cloud sync & local updates
    window.addEventListener('styluxe_data_updated', loadProduct);
    window.addEventListener('storage', loadProduct);

    // Timeout safety fallback
    const timer = setTimeout(() => {
      loadProduct();
      setLoading(false);
    }, 4000);

    return () => {
      window.removeEventListener('styluxe_data_updated', loadProduct);
      window.removeEventListener('storage', loadProduct);
      clearTimeout(timer);
    };
  }, [id]);

  // Compute display images: ensure all images uploaded without colors (general images) are included
  const displayImages: string[] = React.useMemo(() => {
    if (!product) return [];
    const generalImgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

    let colorImgs: string[] = [];
    if (selectedColor && product.colorImages && product.colorImages[selectedColor]) {
      const cVal = product.colorImages[selectedColor];
      if (Array.isArray(cVal)) {
        colorImgs = cVal.filter(Boolean);
      } else if (typeof cVal === 'string' && cVal) {
        colorImgs = [cVal];
      }
    }

    // Combine: if color-specific images exist, put them first, then all images uploaded without colors
    const combined = colorImgs.length > 0 
      ? Array.from(new Set([...colorImgs, ...generalImgs]))
      : generalImgs;

    return combined.length > 0 ? combined : (product.images || []);
  }, [product, selectedColor]);

  // Sync activeImage if current image is not in displayImages
  useEffect(() => {
    if (displayImages.length > 0 && !displayImages.includes(activeImage)) {
      setActiveImage(displayImages[0]);
    }
  }, [displayImages]);

  // AUTOMATIC 5-SECOND IMAGE ROTATION (cycles all images every 5 seconds)
  useEffect(() => {
    if (!displayImages || displayImages.length <= 1) return;
    if (isZoomModalOpen) return; // Don't auto-rotate while customer is inspecting/zooming image!

    const autoCycleTimer = setInterval(() => {
      setActiveImage(current => {
        const currentIndex = displayImages.indexOf(current);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % displayImages.length : 0;
        return displayImages[nextIndex];
      });
    }, 5000);

    return () => clearInterval(autoCycleTimer);
  }, [displayImages, isZoomModalOpen]);

  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">LOADING LUXURY PIECE...</p>
      </div>
    );
  }

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
  const totalStock = Object.values(product.stockPerSize || {}).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const isAllOutOfStock = !product.isPreOrder && (totalStock <= 0 || (product.totalStock !== undefined && product.totalStock <= 0));
  const isOutOfStock = !product.isPreOrder && ((Number(product.stockPerSize[selectedSize]) || 0) <= 0 || isAllOutOfStock);

  // Calculate correct selling price & optional strikethrough price (handles discount seamlessly)
  const { currentPrice, oldPrice, hasDiscount } = getProductDisplayPrices(product.price, product.salePrice);

  // DYNAMIC IMAGE SWITCHING WHEN A COLOR CIRCLE IS CLICKED!
  const handleSelectColor = (col: string, idx: number) => {
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

  const handleOrderViaWhatsApp = () => {
    const rawNumber = product.department === 'men'
      ? (settings.menWhatsappNumber || settings.whatsappNumber || '79024934')
      : (settings.womenWhatsappNumber || settings.whatsappNumber || '78709321');
    let cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 8) cleanNumber = '961' + cleanNumber;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const formattedPrice = formatCurrency(currentPrice, currency, settings.lbpRate, settings.eurRate);

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
            "description": product.shortDescription || product.description || product.title,
            "brand": {
              "@type": "Brand",
              "name": product.brandName || "STYLUXE"
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": currentPrice,
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
          
          {/* Main Big Display Image WITH TOUCH PINCH-TO-ZOOM / CLICK-TO-ENLARGE */}
          <div 
            ref={mainImageRef}
            onClick={() => setIsZoomModalOpen(true)}
            className="relative aspect-[4/5] bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 shadow-sm transition-all cursor-zoom-in group touch-pan-y"
            title="Pinch with 2 fingers or tap to zoom"
          >
            <img
              src={activeImage}
              alt={`${product.title} - ${selectedColor}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {isAllOutOfStock ? (
              <span className="absolute top-4 left-4 px-4 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-md shadow-xl border-2 border-white flex items-center gap-1.5 animate-pulse z-10">
                <AlertCircle size={16} className="text-yellow-300" />
                <span>OUT OF STOCK</span>
              </span>
            ) : product.isPreOrder ? (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-widest rounded-md shadow-md z-10">
                PRE-ORDER 2026
              </span>
            ) : product.isNewArrival ? (
              <span className="absolute top-4 left-4 px-3 py-1 bg-zinc-950 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-md z-10">
                NEW 2026
              </span>
            ) : null}
            {hasDiscount && (
              <span className="absolute bottom-4 left-4 px-3 py-1 bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-md z-10">
                SALE
              </span>
            )}
          </div>

          {/* Product Gallery Thumbnails (if multiple images) */}
          {displayImages && displayImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImage === img ? 'border-zinc-950 scale-105 shadow-md' : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                  }`}
                  title={`View image ${idx + 1}`}
                >
                  <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* BEAUTIFIED & PERFECTLY CENTERED COLOR CIRCLES SWATCHES (ONLY IF > 1 COLOR) */}
          {product.colors && product.colors.filter(c => c && c.toLowerCase() !== 'default' && c.toLowerCase() !== 'standard').length > 1 && (
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
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[0.2em] text-zinc-950 uppercase leading-snug">
              {product.title}
            </h1>
            {product.shortDescription && (
              <p className="text-sm text-zinc-600 leading-relaxed font-medium pt-1">
                {product.shortDescription}
              </p>
            )}

            {/* Price Tag */}
            <div className="pt-4 flex items-baseline gap-3">
              {hasDiscount && oldPrice ? (
                <>
                  <span className="text-2xl sm:text-3xl font-extrabold text-red-600">
                    {formatCurrency(currentPrice, currency, settings.lbpRate, settings.eurRate)}
                  </span>
                  <span className="text-sm font-semibold line-through text-zinc-400">
                    {formatCurrency(oldPrice, currency, settings.lbpRate, settings.eurRate)}
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                  {formatCurrency(currentPrice, currency, settings.lbpRate, settings.eurRate)}
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
              {Object.entries(product.stockPerSize || {}).map(([size, stock]) => {
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

          {/* OUT OF STOCK CLEAR WARNING BANNER */}
          {isOutOfStock && !product.isPreOrder && (
            <div className="p-4 bg-red-50 border-2 border-red-500 text-red-700 rounded-xl flex items-center gap-3 shadow-xs">
              <AlertCircle size={22} className="shrink-0 text-red-600 animate-pulse" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-900">
                  SELECTED SIZE IS OUT OF STOCK
                </p>
                <p className="text-[11px] font-medium text-red-700 mt-0.5">
                  Current stock is 0. Please select another available size or inquire via WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-zinc-200">
            <button
              disabled={isOutOfStock}
              onClick={() => addToCart(product, selectedSize, selectedColor, quantity)}
              className={`w-full py-4 rounded-lg text-xs font-black tracking-[0.25em] uppercase flex items-center justify-center gap-3 transition-all shadow-md ${
                isOutOfStock
                  ? 'bg-red-100 text-red-600 border-2 border-red-300 cursor-not-allowed opacity-90'
                  : product.isPreOrder
                  ? 'bg-amber-400 text-zinc-950 hover:bg-amber-500 font-black'
                  : 'bg-zinc-950 text-white hover:bg-zinc-800'
              }`}
            >
              <ShoppingBag size={18} />
              <span>{isOutOfStock ? 'OUT OF STOCK' : product.isPreOrder ? 'PRE-ORDER NOW' : 'ADD TO CART'}</span>
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

            {/* Direct Instant Instagram Inquiry Button for Product Department */}
            <a
              href={product.department === 'men' 
                ? (settings.menInstagramUrl || 'https://www.instagram.com/stories/styluxe.men_lb/') 
                : (settings.womenInstagramUrl || 'https://www.instagram.com/stories/styluxe.womenn/')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-lg text-xs font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2.5 transition-all border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 cursor-pointer shadow-2xs"
              title={`Inquire on Instagram (${product.department === 'men' ? '@styluxe.men_lb' : '@styluxe.womenn'})`}
            >
              <Instagram size={16} className={product.department === 'men' ? 'text-sky-600' : 'text-pink-600'} />
              <span>INQUIRE VIA INSTAGRAM</span>
            </a>

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
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-900 block">
                {currentPrice >= (settings.freeShippingThresholdUSD || 149) 
                  ? 'FREE DELIVERY' 
                  : 'EXPRESS DELIVERY'}
              </span>
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
        <div 
          onClick={(e) => { 
            if (e.target === e.currentTarget && !hasMovedRef.current) {
              setIsZoomModalOpen(false);
              handleResetZoom();
            }
          }}
          className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-fadeIn select-none cursor-default"
        >
          {/* Top Bar with Title, Controls, and Close Button */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full flex items-center justify-between z-30 pb-3 border-b border-white/15 max-w-5xl cursor-default"
          >
            <div className="text-white truncate pr-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
                {product.brandName || 'STYLUXE'}
              </span>
              <h4 className="font-serif text-xs sm:text-base font-bold tracking-wider uppercase truncate text-white">
                {product.title}
              </h4>
            </div>

            {/* Clean Close Button - No Symbol Buttons */}
            <button 
              type="button"
              onClick={() => {
                setIsZoomModalOpen(false);
                handleResetZoom();
              }}
              className="bg-white text-zinc-950 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5 hover:bg-zinc-200 transition-colors shadow-2xl cursor-pointer"
            >
              <X size={16} />
              <span>CLOSE</span>
            </button>
          </div>

          {/* Center Image Viewport Container with Finger Pinch-to-Zoom & Pan */}
          <div 
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2 relative select-none touch-none ${
              zoomScale > 1 
                ? isDragging ? 'cursor-grabbing' : 'cursor-grab' 
                : 'cursor-zoom-in'
            }`}
          >
            <div
              style={{
                transform: `translate3d(${panPosition.x}px, ${panPosition.y}px, 0) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transformOrigin: 'center center',
              }}
              className="will-change-transform flex items-center justify-center max-w-full max-h-full"
            >
              <img 
                src={activeImage} 
                alt={product.title} 
                draggable={false}
                onClick={() => {
                  if (!hasMovedRef.current) {
                    if (zoomScale === 1) {
                      setZoomScale(2);
                    } else {
                      handleResetZoom();
                    }
                  }
                }}
                className="max-w-full max-h-[70vh] sm:max-h-[76vh] object-contain rounded-lg shadow-2xl pointer-events-auto select-none"
              />
            </div>
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {product.images && product.images.length > 1 ? (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="w-full max-w-md flex items-center justify-center gap-2 overflow-x-auto py-2 z-30 cursor-default"
            >
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImage(img);
                    handleResetZoom();
                  }}
                  className={`w-12 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImage === img ? 'border-white scale-110 shadow-lg' : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-zinc-400 text-xs font-mono uppercase tracking-wider pb-1">
              COLOR: {selectedColor}
            </div>
          )}
        </div>
      )}

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-8 pt-12 border-t border-zinc-200">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-extrabold tracking-widest text-amber-600 uppercase block">
              CURATED SELECTION
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-[0.25em] uppercase text-zinc-950">
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
