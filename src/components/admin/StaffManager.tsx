'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Shield, Key, Check, UserCheck, Lock } from 'lucide-react';
import { DataService } from '@/lib/store';
import { StaffMember } from '@/lib/types';

export function StaffManager() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'STORE MANAGER',
    permissions: 'FULL ACCESS',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  useEffect(() => {
    loadStaff();
    const handleUpdate = () => loadStaff();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadStaff = () => {
    const loaded = DataService.getStaff();
    setStaffList(loaded);
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      username: '',
      password: '123',
      role: 'STORE MANAGER',
      permissions: 'FULL ACCESS',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      username: staff.username,
      password: staff.password || '123',
      role: staff.role,
      permissions: Array.isArray(staff.permissions) ? staff.permissions.join(', ') : (staff.permissions || 'FULL ACCESS'),
      status: staff.status
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) return;

    const staffToSave: StaffMember = {
      id: editingStaff ? editingStaff.id : `stf-${Date.now()}`,
      name: formData.name,
      username: formData.username.toLowerCase().replace(/\s+/g, ''),
      password: formData.password,
      role: formData.role as any,
      permissions: [formData.permissions],
      status: formData.status
    };

    const updated = DataService.saveStaff(staffToSave);
    setStaffList(updated);
    setIsModalOpen(false);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      const updated = DataService.deleteStaff(id);
      setStaffList(updated);
    }
  };

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* 1. TOP HEADER TITLE & ADD BUTTON MATCHING EXACT SCREENSHOT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase">
            STAFF & PERMISSIONS
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1.5">
            Strict User & Password Authentication System. Manage registered staff usernames and passwords.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3.5 bg-zinc-950 text-white text-xs font-black tracking-widest uppercase hover:bg-zinc-800 transition-all rounded shadow-md flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus size={18} strokeWidth={3} />
          <span>ADD NEW STAFF MEMBER</span>
        </button>
      </div>

      {/* 2. DATA TABLE */}
      <div className="border border-zinc-300 rounded overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-100/70">
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">STAFF NAME</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">USERNAME</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">PASSWORD</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ROLE</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">STATUS</th>
              <th className="py-4 px-6 text-xs font-black tracking-[0.2em] text-zinc-950 uppercase text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                <td className="py-4 px-6 font-extrabold text-zinc-950 text-center uppercase tracking-wider">
                  {staff.name}
                </td>
                <td className="py-4 px-6 font-mono font-black text-amber-600 text-center uppercase text-sm">
                  @{staff.username}
                </td>
                <td className="py-4 px-6 font-mono font-bold text-zinc-600 text-center uppercase">
                  •••••••• ({staff.password || '123'})
                </td>
                <td className="py-4 px-6 text-center font-bold text-zinc-700 uppercase">
                  {staff.role}
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 text-[11px] font-black uppercase rounded-full ${
                    staff.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {staff.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(staff)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors"
                    >
                      <Edit2 size={12} /> EDIT
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} /> DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-300 p-8 sm:p-10 max-w-xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-none">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2">
              <X size={20} />
            </button>

            <h2 className="font-serif text-3xl font-black tracking-[0.25em] text-zinc-950 uppercase text-center">
              STAFF ACCOUNT
            </h2>

            <form onSubmit={handleSaveStaff} className="space-y-5 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Hussein Manager" 
                  required 
                  className="w-full p-3.5 border border-zinc-300 rounded-none text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Username *</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })} 
                  placeholder="e.g. hussein or admin" 
                  required 
                  className="w-full p-3.5 border border-zinc-900 rounded-none text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 lowercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Password *</label>
                <input 
                  type="text" 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="e.g. admin123 or 123" 
                  required 
                  className="w-full p-3.5 border border-zinc-900 rounded-none text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Role *</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3.5 border border-zinc-900 rounded-none text-sm font-semibold text-zinc-950 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 uppercase"
                >
                  <option value="STORE MANAGER">STORE MANAGER</option>
                  <option value="POS CASHIER">POS CASHIER</option>
                  <option value="INVENTORY STAFF">INVENTORY STAFF</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-black hover:bg-zinc-900 text-white text-xs font-black tracking-[0.25em] uppercase transition-colors rounded-none shadow-md mt-6"
              >
                SAVE STAFF MEMBER
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
