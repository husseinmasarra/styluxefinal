'use client';

import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { formatCurrency } from '@/lib/store';

export function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, currency, settings } = useCart();

  if (!isCartOpen) return null;

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.product.salePrice || item.product.price) * item.quantity, 0);
  const freeShippingThreshold = settings.freeShippingThresholdUSD || 500;
  const progressPercent = Math.min(100, (subtotalUSD / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalUSD);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)} 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-prada text-zinc-950 uppercase">
                SHOPPING BAG ({cart.reduce((a, c) => a + c.quantity, 0)})
              </h2>
              <p className="text-[10px] tracking-wider text-zinc-500 uppercase mt-0.5">
                COMPLIMENTARY LUXURY PACKAGING INCLUDED
              </p>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 mb-1">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Truck size={14} className="text-zinc-900" />
                {remainingForFreeShipping === 0 
                  ? 'YOU HAVE UNLOCKED FREE EXPRESS SHIPPING!' 
                  : `ADD ${formatCurrency(remainingForFreeShipping, currency, settings.lbpRate, settings.eurRate)} FOR FREE SHIPPING`}
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-zinc-950 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  YOUR SHOPPING BAG IS CURRENTLY EMPTY
                </p>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="inline-block px-6 py-3 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors"
                >
                  EXPLORE COLLECTIONS
                </button>
              </div>
            ) : (
              cart.map((item, idx) => {
                const itemPrice = item.product.salePrice || item.product.price;
                return (
                  <div key={`${item.product.id}-${item.size}-${item.color}-${idx}`} className="flex gap-4 border-b border-zinc-100 pb-6">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.title} 
                      className="w-20 h-24 object-cover bg-zinc-100 rounded"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                            {item.product.brandName}
                          </span>
                          <button 
                            onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                            className="text-zinc-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-1 mt-0.5">
                          {item.product.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Size: <span className="font-semibold text-zinc-900">{item.size}</span> | Color: <span className="font-semibold text-zinc-900">{item.color}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-zinc-200 rounded">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                            className="p-1 text-zinc-600 hover:text-zinc-950"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-xs font-bold text-zinc-900">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                            className="p-1 text-zinc-600 hover:text-zinc-950"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span className="text-xs font-extrabold text-zinc-950">
                          {formatCurrency(itemPrice * item.quantity, currency, settings.lbpRate, settings.eurRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotalUSD, currency, settings.lbpRate, settings.eurRate)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Estimated Shipping</span>
                  <span>{subtotalUSD >= freeShippingThreshold ? 'FREE' : formatCurrency(settings.defaultShippingFeeUSD || 25, currency, settings.lbpRate, settings.eurRate)}</span>
                </div>
                <hr className="my-2 border-zinc-200" />
                <div className="flex justify-between text-sm font-extrabold text-zinc-950 uppercase tracking-wider">
                  <span>Total</span>
                  <span>{formatCurrency(subtotalUSD + (subtotalUSD >= freeShippingThreshold ? 0 : (settings.defaultShippingFeeUSD || 25)), currency, settings.lbpRate, settings.eurRate)}</span>
                </div>
              </div>

              <Link 
                href="/checkout" 
                onClick={() => setIsCartOpen(false)}
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold tracking-prada uppercase flex items-center justify-center gap-2 transition-colors"
              >
                PROCEED TO CHECKOUT
                <ArrowRight size={14} />
              </Link>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
                <ShieldCheck size={12} className="text-amber-500" />
                AUTHENTICITY & SECURE PAYMENT GUARANTEED
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
