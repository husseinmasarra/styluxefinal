'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Building, FileText } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  address: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  totalUSD: number;
  status: 'Paid' | 'Pending' | 'Unpaid';
  details: string;
  createdAt: string;
}

export function SuppliersInvoicesManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Modals state
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);

  // Keyboard shortcut listener: ESC to close supplier/invoice modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSuppModalOpen) setIsSuppModalOpen(false);
        if (isInvModalOpen) setIsInvModalOpen(false);
      }
    };
    if (isSuppModalOpen || isInvModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuppModalOpen, isInvModalOpen]);

  // Supplier Form State
  const [suppName, setSuppName] = useState('');
  const [suppCompany, setSuppCompany] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppAddress, setSuppAddress] = useState('');

  // Invoice Form State
  const [invNumber, setInvNumber] = useState('');
  const [invSupplier, setInvSupplier] = useState('');
  const [invAmount, setInvAmount] = useState<number | ''>('');
  const [invStatus, setInvStatus] = useState<'Paid' | 'Pending' | 'Unpaid'>('Paid');
  const [invDetails, setInvDetails] = useState('');

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName.trim()) return;

    const newSupp: Supplier = {
      id: `supp-${Date.now()}`,
      name: suppName.trim(),
      company: suppCompany.trim() || 'N/A',
      phone: suppPhone.trim() || 'N/A',
      address: suppAddress.trim() || 'Beirut, Lebanon'
    };

    setSuppliers(prev => [...prev, newSupp]);
    setSuppName('');
    setSuppCompany('');
    setSuppPhone('');
    setSuppAddress('');
    setIsSuppModalOpen(false);
  };

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNumber.trim() || !invAmount) return;

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber.trim(),
      supplierName: invSupplier || 'General Merchant',
      totalUSD: Number(invAmount),
      status: invStatus,
      details: invDetails,
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, newInv]);
    setInvNumber('');
    setInvAmount('');
    setInvDetails('');
    setIsInvModalOpen(false);
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Delete this supplier?')) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Delete this invoice?')) {
      setInvoices(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* PAGE TITLE & ACTION BUTTONS FOR MODALS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <h1 className="font-serif text-3xl font-normal tracking-[0.25em] text-zinc-900 uppercase">
          SUPPLIERS & INVOICES
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSuppModalOpen(true)}
            className="px-4 py-2.5 bg-zinc-950 text-white text-xs font-extrabold tracking-wider uppercase rounded hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} /> + ADD SUPPLIER
          </button>
          <button
            onClick={() => setIsInvModalOpen(true)}
            className="px-4 py-2.5 border-2 border-zinc-950 text-zinc-950 text-xs font-extrabold tracking-wider uppercase rounded hover:bg-zinc-950 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} /> + RECORD INVOICE
          </button>
        </div>
      </div>

      {/* TWO SIDE-BY-SIDE TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT PANEL: SUPPLIERS TABLE */}
        <div className="border border-zinc-200 rounded p-6 bg-white shadow-sm space-y-4">
          <h2 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase border-b border-zinc-100 pb-3 flex items-center gap-2">
            <Building size={16} /> SUPPLIERS LIST ({suppliers.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">SUPPLIER NAME</th>
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">PHONE & COMPANY</th>
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-16 text-center text-xs font-bold text-zinc-400 tracking-wider uppercase">
                      NO SUPPLIERS RECORDED.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supp) => (
                    <tr key={supp.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                      <td className="py-3 px-4 font-extrabold text-zinc-950 text-center uppercase">
                        {supp.name}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-600 text-center uppercase">
                        {supp.company} • {supp.phone}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDeleteSupplier(supp.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL: INVOICES TABLE */}
        <div className="border border-zinc-200 rounded p-6 bg-white shadow-sm space-y-4">
          <h2 className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase border-b border-zinc-100 pb-3 flex items-center gap-2">
            <FileText size={16} /> INVOICES RECORDED ({invoices.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">INVOICE #</th>
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">SUPPLIER</th>
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">TOTAL</th>
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">STATUS</th>
                  <th className="py-3 px-4 text-xs font-extrabold tracking-widest text-zinc-400 uppercase text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-xs font-bold text-zinc-400 tracking-wider uppercase">
                      NO INVOICES RECORDED.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                      <td className="py-3 px-4 font-extrabold text-zinc-950 text-center uppercase">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-700 text-center uppercase">
                        {inv.supplierName}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-zinc-950 text-center">
                        ${inv.totalUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* POPUP MODAL: ADD SUPPLIER */}
      {isSuppModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsSuppModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 max-w-md w-full space-y-6 relative shadow-2xl animate-fadeIn">
            
            <button onClick={() => setIsSuppModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2">
              <X size={20} />
            </button>

            <div className="border-b border-zinc-200 pb-3">
              <h3 className="text-xl font-serif font-bold text-zinc-950 uppercase flex items-center gap-2">
                <Building size={20} /> + ADD SUPPLIER
              </h3>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="font-extrabold text-zinc-700 uppercase block text-xs">Supplier / Merchant Name *</label>
                <input
                  type="text"
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  placeholder="e.g. Hassan Fabrics"
                  required
                  className="w-full p-3 border border-zinc-300 rounded font-semibold text-sm focus:border-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-zinc-700 uppercase block text-xs">Company Name</label>
                <input
                  type="text"
                  value={suppCompany}
                  onChange={(e) => setSuppCompany(e.target.value)}
                  placeholder="e.g. Hassan Trading Co."
                  className="w-full p-3 border border-zinc-300 rounded font-semibold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-zinc-700 uppercase block text-xs">Phone Number</label>
                <input
                  type="text"
                  value={suppPhone}
                  onChange={(e) => setSuppPhone(e.target.value)}
                  placeholder="e.g. +961 71 222 333"
                  className="w-full p-3 border border-zinc-300 rounded font-semibold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-zinc-700 uppercase block text-xs">Address</label>
                <textarea
                  rows={2}
                  value={suppAddress}
                  onChange={(e) => setSuppAddress(e.target.value)}
                  placeholder="e.g. Beirut, Lebanon"
                  className="w-full p-3 border border-zinc-300 rounded font-semibold text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsSuppModalOpen(false)} className="px-5 py-2.5 border border-zinc-300 text-xs font-bold uppercase rounded">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase rounded hover:bg-zinc-800">
                  + ADD SUPPLIER
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* POPUP MODAL: RECORD INVOICE */}
      {isInvModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsInvModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-zinc-950 rounded-xl p-6 sm:p-8 max-w-md w-full space-y-6 relative shadow-2xl animate-fadeIn">
            
            <button onClick={() => setIsInvModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2">
              <X size={20} />
            </button>

            <div className="border-b border-zinc-200 pb-3">
              <h3 className="text-xl font-serif font-bold text-zinc-950 uppercase flex items-center gap-2">
                <FileText size={20} /> + RECORD INVOICE
              </h3>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="font-extrabold text-zinc-700 uppercase block text-xs">Invoice Number *</label>
                <input
                  type="text"
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  required
                  className="w-full p-3 border border-zinc-300 rounded font-semibold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-zinc-700 uppercase block text-xs">Select Supplier *</label>
                <select
                  value={invSupplier}
                  onChange={(e) => setInvSupplier(e.target.value)}
                  className="w-full p-3 border border-zinc-300 rounded font-bold text-sm uppercase bg-white"
                >
                  <option value="">Select Supplier / Merchant *</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.company})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-zinc-700 uppercase block text-xs">Total USD *</label>
                  <input
                    type="number"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 500"
                    required
                    className="w-full p-3 border border-zinc-300 rounded font-extrabold text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-zinc-700 uppercase block text-xs">Status</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value as any)}
                    className="w-full p-3 border border-zinc-300 rounded font-bold text-sm uppercase bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-zinc-700 uppercase block text-xs">Invoice Details / Notes</label>
                <textarea
                  rows={2}
                  value={invDetails}
                  onChange={(e) => setInvDetails(e.target.value)}
                  placeholder="Invoice details, product quantities, or notes..."
                  className="w-full p-3 border border-zinc-300 rounded font-semibold text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsInvModalOpen(false)} className="px-5 py-2.5 border border-zinc-300 text-xs font-bold uppercase rounded">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase rounded hover:bg-zinc-800">
                  + RECORD INVOICE
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
