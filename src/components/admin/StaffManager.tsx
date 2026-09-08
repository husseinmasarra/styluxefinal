'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Shield, Key, Check, UserCheck, Lock, CheckSquare, Square, ShieldCheck, Sparkles } from 'lucide-react';
import { DataService } from '@/lib/store';
import { StaffMember } from '@/lib/types';
import { ADMIN_TABS, ROLE_PRESETS, getStaffAllowedTabs } from '@/lib/permissions';

export function StaffManager() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'POS CASHIER (كاشير نقطة البيع)',
    permissions: ['pos'] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  useEffect(() => {
    loadStaff();
    const handleUpdate = () => loadStaff();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  // Keyboard shortcut listener: ESC to close staff modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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
      role: 'POS CASHIER (كاشير نقطة البيع)',
      permissions: ['pos'],
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    const allowed = getStaffAllowedTabs(staff);
    setFormData({
      name: staff.name,
      username: staff.username,
      password: staff.password || '123',
      role: staff.role || 'STAFF',
      permissions: allowed,
      status: staff.status
    });
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      role: preset.role,
      permissions: [...preset.tabs]
    }));
  };

  const handleToggleTabPermission = (tabId: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(tabId);
      let updated: string[];
      if (exists) {
        updated = prev.permissions.filter(id => id !== tabId);
      } else {
        updated = [...prev.permissions, tabId];
      }
      return { ...prev, permissions: updated };
    });
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      permissions: ADMIN_TABS.map(t => t.id)
    }));
  };

  const handleSelectOnlyPOS = () => {
    setFormData(prev => ({
      ...prev,
      role: 'POS CASHIER (كاشير نقطة البيع)',
      permissions: ['pos']
    }));
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) return;

    const finalPermissions = formData.permissions.length > 0 ? formData.permissions : ['pos'];

    const staffToSave: StaffMember = {
      id: editingStaff ? editingStaff.id : `stf-${Date.now()}`,
      name: formData.name,
      username: formData.username.toLowerCase().replace(/\s+/g, ''),
      password: formData.password,
      role: formData.role,
      permissions: finalPermissions,
      status: formData.status
    };

    const updated = DataService.saveStaff(staffToSave);
    setStaffList(updated);
    setIsModalOpen(false);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      const updated = DataService.deleteStaff(id);
      setStaffList(updated);
    }
  };

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* 1. TOP HEADER TITLE & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
            STAFF & PERMISSIONS
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1.5">
            نظام حصر صلاحيات الموظفين حسب الاختصاص المحدد من قِبل المدير العام.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3.5 bg-zinc-950 text-white text-xs font-black tracking-widest uppercase hover:bg-zinc-800 transition-all rounded-none shadow-md flex items-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus size={18} strokeWidth={3} />
          <span>إضافة موظف وتحديد اختصاصه</span>
        </button>
      </div>

      {/* 2. DATA TABLE */}
      <div className="border border-zinc-300 rounded-none overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-zinc-300 bg-zinc-100/80">
                <th className="py-4 px-6 text-xs font-black tracking-[0.15em] text-zinc-950 uppercase text-center">الموظف (STAFF)</th>
                <th className="py-4 px-6 text-xs font-black tracking-[0.15em] text-zinc-950 uppercase text-center">اسم المستخدم</th>
                <th className="py-4 px-6 text-xs font-black tracking-[0.15em] text-zinc-950 uppercase text-center">كلمة المرور</th>
                <th className="py-4 px-6 text-xs font-black tracking-[0.15em] text-zinc-950 uppercase text-center">المسمى / الاختصاص</th>
                <th className="py-4 px-6 text-xs font-black tracking-[0.15em] text-zinc-950 uppercase text-center">الأقسام المسموح بها</th>
                <th className="py-4 px-6 text-xs font-black tracking-[0.15em] text-zinc-950 uppercase text-center">الحالة</th>
                <th className="py-4 px-6 text-xs font-black tracking-[0.15em] text-zinc-950 uppercase text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => {
                const allowed = getStaffAllowedTabs(staff);
                const isFull = allowed.length === ADMIN_TABS.length;
                return (
                  <tr key={staff.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                    <td className="py-4 px-6 font-extrabold text-zinc-950 text-center uppercase tracking-wider">
                      {staff.name}
                    </td>
                    <td className="py-4 px-6 font-mono font-black text-amber-600 text-center uppercase text-sm">
                      @{staff.username}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-zinc-600 text-center uppercase">
                      •••• ({staff.password || '123'})
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-zinc-800">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-900 rounded font-semibold text-[11px] inline-block">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {isFull ? (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded font-black text-[11px] tracking-wide inline-flex items-center gap-1">
                          <ShieldCheck size={13} />
                          <span>كامل الصلاحيات (الكل)</span>
                        </span>
                      ) : allowed.length === 1 && allowed[0] === 'pos' ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded font-black text-[11px] tracking-wide inline-block">
                          نقطة البيع (POS) فقط
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                          {allowed.map((tId) => {
                            const def = ADMIN_TABS.find(t => t.id === tId);
                            return (
                              <span key={tId} className="px-1.5 py-0.5 bg-zinc-200/80 text-zinc-800 text-[10px] font-bold rounded">
                                {def ? def.labelEn : tId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-full ${
                        staff.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {staff.status === 'ACTIVE' ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 size={12} /> تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} /> حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ADD / EDIT STAFF MODAL WITH GRANULAR PERMISSIONS */}
      {isModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-6 sm:p-10 max-w-2xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-none my-8 max-h-[90vh] overflow-y-auto">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer">
              <X size={20} />
            </button>

            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-[0.2em] text-zinc-950 uppercase">
                {editingStaff ? 'تعديل بيانات وصلاحيات الموظف' : 'إضافة موظف وتحديد اختصاصه'}
              </h2>
              <p className="text-xs text-zinc-500 font-bold">
                لن يتمكن الموظف من رؤية أو دخول أي قسم غير الأقسام المحددة له في هذه الشاشة.
              </p>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-6 text-xs font-sans">
              
              {/* Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 border border-zinc-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">اسم الموظف الثلاثي *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="مثال: أحمد كاشير" 
                    required 
                    className="w-full p-3 border border-zinc-300 rounded-none text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-950 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">اسم المستخدم للدخول (Username) *</label>
                  <input 
                    type="text" 
                    value={formData.username} 
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })} 
                    placeholder="مثال: cashier1" 
                    required 
                    className="w-full p-3 border border-zinc-900 rounded-none text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 lowercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">كلمة المرور (Password) *</label>
                  <input 
                    type="text" 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="مثال: 123456" 
                    required 
                    className="w-full p-3 border border-zinc-900 rounded-none text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">حالة الحساب *</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3 border border-zinc-300 rounded-none text-sm font-bold text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  >
                    <option value="ACTIVE">حساب نشط (ACTIVE)</option>
                    <option value="INACTIVE">حساب معطل وموقوف (INACTIVE)</option>
                  </select>
                </div>
              </div>

              {/* Quick Role Templates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-wider block">
                    اختيار نموذج اختصاص سريع (Presets):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={handleSelectOnlyPOS}
                      className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      كاشير فقط
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_PRESETS.map((preset) => {
                    const isSelected = formData.role === preset.role;
                    return (
                      <button
                        key={preset.role}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-3 text-left border rounded transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected 
                            ? 'border-zinc-950 bg-zinc-900 text-white shadow-sm' 
                            : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs">{preset.role}</span>
                          {isSelected && <Check size={14} className="text-amber-400" />}
                        </div>
                        <span className={`text-[10px] leading-tight ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {preset.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Section Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <span className="text-xs font-black text-zinc-950 uppercase tracking-wider">
                    تحديد الأقسام المسموح للموظف بدخولها ({formData.permissions.length} من {ADMIN_TABS.length} محددة):
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ADMIN_TABS.map((tab) => {
                    const isChecked = formData.permissions.includes(tab.id);
                    return (
                      <div
                        key={tab.id}
                        onClick={() => handleToggleTabPermission(tab.id)}
                        className={`p-3 border rounded transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked 
                            ? 'border-emerald-600 bg-emerald-50/70 text-zinc-950 ring-1 ring-emerald-500' 
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600'
                        }`}
                      >
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare size={18} className="text-emerald-600" />
                          ) : (
                            <Square size={18} className="text-zinc-300" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-zinc-950">{tab.labelAr}</span>
                            <span className="text-[10px] font-mono text-zinc-400 font-normal">({tab.labelEn})</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-tight">
                            {tab.descriptionAr}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full py-4 bg-zinc-950 hover:bg-black text-white text-xs sm:text-sm font-black tracking-[0.2em] uppercase transition-all rounded-none shadow-xl mt-6 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>حفظ بيانات واختصاص الموظف</span>
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
