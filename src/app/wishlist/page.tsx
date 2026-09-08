'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { DataService } from '@/lib/store';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';

export default function WishlistPage() {
  const { wishlist } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const all = DataService.getProducts();
    const wishlistedProds = all.filter(p => wishlist.includes(p.id));
    setProducts(wishlistedProds);
  }, [wishlist]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-zinc-200 pb-4">
        <span className="text-[10px] font-extrabold tracking-pradaWide text-zinc-400 uppercase block">SAVED ITEMS</span>
        <h1 className="text-3xl font-extrabold tracking-prada text-zinc-950 uppercase flex items-center gap-3">
          MY WISHLIST ({products.length})
        </h1>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 space-y-4 border border-dashed border-zinc-200 rounded">
          <Heart size={48} className="mx-auto text-zinc-300" />
          <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            YOUR WISHLIST IS CURRENTLY EMPTY
          </h3>
          <Link href="/shop" className="inline-block px-6 py-3 bg-zinc-950 text-white text-xs font-bold tracking-widest uppercase">
            EXPLORE COLLECTIONS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
