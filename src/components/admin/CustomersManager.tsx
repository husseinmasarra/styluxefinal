'use client';

import React, { useState, useEffect } from 'react';
import { DataService, formatCurrency } from '@/lib/store';
import { Customer } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { Search, Mail, Phone, MapPin, Calendar, DollarSign, Trash2, Edit2, X, User, Download } from 'lucide-react';

export function CustomersManager() {
  const { currency, settings, showToast } = useCart();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
    const handleUpdate = () => loadCustomers();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const handleExportCustomersCSV = () => {
    if (customers.length === 0) return;
    const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Address', 'Total Orders', 'Total Spent USD', 'Created Date'];
    const rows = customers.map(c => [
      `"${c.id}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.totalOrders || 0,
      c.totalSpentUSD || 0,
      `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `styluxe_customers_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadCustomers = () => {
    setCustomers(DataService.getCustomers());
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      email: cust.email || '',
      phone: cust.phone || '',
      address: cust.address || '',
      notes: cust.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !formData.name.trim()) return;

    const updatedCustomer: Customer = {
      ...editingCustomer,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes
    };

    const updatedList = DataService.saveCustomer(updatedCustomer);
    setCustomers(updatedList);
    setIsModalOpen(false);
    showToast('Customer profile updated successfully!', 'success');
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Are you sure you want to delete this customer account?')) {
      const updatedList = DataService.deleteCustomer(id);
      setCustomers(updatedList);
      showToast('Customer account deleted successfully!', 'success');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* 1. PAGE TITLE & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase">
            REGISTERED CUSTOMERS
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1.5">
            Manage registered clients, edit contact profiles, or delete accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCustomersCSV}
            className="px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0"
          >
            <Download size={16} />
            <span>EXPORT CUSTOMERS (CSV)</span>
          </button>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-3 border-2 border-zinc-300 text-xs font-bold focus:border-zinc-950 rounded placeholder:text-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* 2. CUSTOMERS DATA TABLE */}
      <div className="border border-zinc-300 rounded overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-100/70">
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">NAME</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">EMAIL</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">PHONE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ADDRESS</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">LIFETIME SPENT</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-xs font-extrabold text-zinc-400 tracking-wider uppercase">
                  NO REGISTERED CUSTOMERS FOUND.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => (
                <tr key={cust.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                  
                  {/* NAME */}
                  <td className="py-4 px-6 font-extrabold text-zinc-950 text-center uppercase tracking-wider">
                    {cust.name}
                  </td>

                  {/* EMAIL */}
                  <td className="py-4 px-6 font-medium text-zinc-700 text-center">
                    {cust.email || 'N/A'}
                  </td>

                  {/* PHONE */}
                  <td className="py-4 px-6 font-mono font-bold text-zinc-800 text-center">
                    {cust.phone || 'N/A'}
                  </td>

                  {/* ADDRESS */}
                  <td className="py-4 px-6 font-medium text-zinc-600 text-center uppercase">
                    {cust.address || 'BEIRUT, LEBANON'}
                  </td>

                  {/* LIFETIME SPENT */}
                  <td className="py-4 px-6 font-black text-emerald-600 text-center text-sm">
                    {formatCurrency(cust.totalSpentUSD, currency, settings.lbpRate, settings.eurRate)}
                  </td>

                  {/* ACTIONS: EDIT & DELETE */}
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(cust)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Edit2 size={12} /> EDIT
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(cust.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Trash2 size={12} /> DELETE
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. EDIT CUSTOMER MODAL */}
      {isModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-300 p-8 sm:p-10 max-w-xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-none">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2">
              <X size={20} />
            </button>

            <h2 className="font-serif text-3xl font-black tracking-[0.25em] text-zinc-950 uppercase text-center border-b border-zinc-200 pb-4">
              EDIT CLIENT PROFILE
            </h2>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-950 uppercase block">Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                  className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-zinc-950 uppercase block">Phone Number *</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                    className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-zinc-950 uppercase block">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-950 uppercase block">Shipping Address *</label>
                <textarea 
                  rows={2} 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                  required 
                  className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 resize-none focus:outline-none focus:border-zinc-950 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-950 uppercase block">Admin Notes</label>
                <input 
                  type="text" 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                  placeholder="e.g. VIP Client" 
                  className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.25em] uppercase transition-colors shadow-lg mt-4"
              >
                SAVE CLIENT PROFILE
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
