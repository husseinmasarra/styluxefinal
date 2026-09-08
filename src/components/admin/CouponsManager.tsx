'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/store';
import { Coupon } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { Tag, Plus, Trash2, CheckCircle2, XCircle, Search, Percent } from 'lucide-react';

export function CouponsManager() {
  const { showToast } = useCart();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New coupon form state
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [minSpendUSD, setMinSpendUSD] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);

  useEffect(() => {
    loadCoupons();
    const handleUpdate = () => loadCoupons();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadCoupons = () => {
    setCoupons(DataService.getCoupons());
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      showToast('Please enter a valid coupon code', 'error');
      return;
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      showToast('Discount percent must be between 1% and 100%', 'error');
      return;
    }

    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discountPercent: Number(discountPercent),
      active,
      minSpendUSD: Number(minSpendUSD) || 0,
      createdAt: new Date().toISOString()
    };

    const updated = DataService.saveCoupon(newCoupon);
    setCoupons(updated);

    // Reset form
    setCode('');
    setDiscountPercent(10);
    setMinSpendUSD(0);
    setActive(true);
    showToast(`Coupon ${cleanCode} created successfully!`, 'success');
  };

  const handleToggleActive = (coupon: Coupon) => {
    const updatedCoupon: Coupon = {
      ...coupon,
      active: !coupon.active
    };
    const updated = DataService.saveCoupon(updatedCoupon);
    setCoupons(updated);
    showToast(`Coupon ${coupon.code} status updated`, 'info');
  };

  const handleDeleteCoupon = (id: string, codeStr: string) => {
    if (confirm(`Are you sure you want to delete coupon "${codeStr}"?`)) {
      const updated = DataService.deleteCoupon(id);
      setCoupons(updated);
      showToast(`Coupon ${codeStr} deleted successfully`, 'success');
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* PAGE HEADER */}
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase flex items-center gap-3">
          <Tag className="text-amber-500" size={32} />
          DISCOUNT COUPONS & PROMO CODES
        </h1>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1.5">
          Manage checkout promotional coupons, discount percentages, and minimum purchase rules.
        </p>
      </div>

      {/* CREATE NEW COUPON FORM */}
      <div className="bg-zinc-50 border-2 border-zinc-950 p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-black tracking-[0.2em] text-zinc-950 uppercase flex items-center gap-2 border-b border-zinc-200 pb-3">
          <Plus size={16} className="text-amber-500" />
          CREATE NEW PROMO CODE
        </h2>

        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          
          <div>
            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest block mb-1">
              COUPON CODE *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. STYLUXE20"
              className="w-full p-3 border-2 border-zinc-300 rounded text-xs font-mono font-black uppercase text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest block mb-1">
              DISCOUNT % *
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                placeholder="20"
                className="w-full p-3 pr-8 border-2 border-zinc-300 rounded text-xs font-black text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
              <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest block mb-1">
              MINIMUM SPEND ($ USD)
            </label>
            <input
              type="number"
              min={0}
              value={minSpendUSD}
              onChange={(e) => setMinSpendUSD(Number(e.target.value))}
              placeholder="0"
              className="w-full p-3 border-2 border-zinc-300 rounded text-xs font-black text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-3.5 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.2em] uppercase rounded shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> ADD COUPON
            </button>
          </div>

        </form>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full pl-10 pr-4 py-3 border-2 border-zinc-300 text-xs font-bold text-zinc-950 focus:border-zinc-950 rounded placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* COUPONS TABLE */}
      <div className="border border-zinc-300 rounded overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-100/70">
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">COUPON CODE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">DISCOUNT %</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">MIN SPEND</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">STATUS</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">CREATED DATE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-xs font-extrabold text-zinc-400 tracking-wider uppercase">
                  NO COUPONS FOUND.
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors text-xs">
                  
                  {/* CODE */}
                  <td className="py-4 px-6 text-center font-mono font-black text-base text-amber-600 uppercase tracking-widest">
                    {coupon.code}
                  </td>

                  {/* DISCOUNT PERCENT */}
                  <td className="py-4 px-6 text-center font-black text-zinc-950 text-sm">
                    {coupon.discountPercent}% OFF
                  </td>

                  {/* MIN SPEND */}
                  <td className="py-4 px-6 text-center font-bold text-zinc-700">
                    {coupon.minSpendUSD ? `$${coupon.minSpendUSD}` : 'No Minimum'}
                  </td>

                  {/* STATUS TOGGLE */}
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 mx-auto ${
                        coupon.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {coupon.active ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600" /> ACTIVE
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="text-zinc-400" /> INACTIVE
                        </>
                      )}
                    </button>
                  </td>

                  {/* CREATED DATE */}
                  <td className="py-4 px-6 text-center font-bold text-zinc-500 text-xs">
                    {new Date(coupon.createdAt).toLocaleDateString()}
                  </td>

                  {/* ACTIONS */}
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase rounded shadow-2xs flex items-center gap-1 mx-auto"
                    >
                      <Trash2 size={12} /> DELETE
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
