'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/store';
import { MenuItem } from '@/lib/types';
import { Plus, Trash2, ArrowUp, ArrowDown, Wand2, Save, Check } from 'lucide-react';

export function MenuBuilder() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedL1, setSelectedL1] = useState<string | null>('women');
  const [selectedL2, setSelectedL2] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadMenuItems();
    const handleUpdate = () => loadMenuItems();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadMenuItems = () => {
    const items = DataService.getMenuItems();
    setMenuItems(items);
  };

  // Load Preset Full Luxury Catalog
  const handleLoadPreset = () => {
    const presetItems: MenuItem[] = [
      { id: 'women', title: 'WOMEN', url: '/shop?department=women', displayOrder: 1 },
      { id: 'men', title: 'MEN', url: '/shop?department=men', displayOrder: 2 },
      { id: 'kids', title: 'KIDS', url: '/shop?department=kids', displayOrder: 3 },
    ];
    DataService.saveMenuItems(presetItems);
    setMenuItems(presetItems);
    setSelectedL1('women');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Level 1 Root Items
  const rootItems = menuItems.filter(item => !item.parentId);

  // Level 2 Sub-Items
  const level2Items = selectedL1 
    ? menuItems.filter(item => item.parentId === selectedL1)
    : [];

  // Level 3 Leaf Items
  const level3Items = selectedL2
    ? menuItems.filter(item => item.parentId === selectedL2)
    : [];

  const handleAddItem = (level: 1 | 2 | 3) => {
    const title = prompt(`Enter item name for Level ${level}:`);
    if (!title || !title.trim()) return;

    let parentId: string | undefined = undefined;
    if (level === 2) parentId = selectedL1 || undefined;
    if (level === 3) parentId = selectedL2 || undefined;

    const cleanTitle = title.trim().toLowerCase();
    let url = `/shop?category=${encodeURIComponent(title.trim())}`;
    if (level === 1) {
      if (cleanTitle === 'women' || cleanTitle === 'النساء' || cleanTitle === 'نساء' || cleanTitle === 'نسائي') {
        url = '/shop?department=women';
      } else if (cleanTitle === 'men' || cleanTitle === 'الرجال' || cleanTitle === 'رجال' || cleanTitle === 'رجالي') {
        url = '/shop?department=men';
      } else if (cleanTitle === 'kids' || cleanTitle === 'الأطفال' || cleanTitle === 'اطفال') {
        url = '/shop?department=kids';
      } else if (cleanTitle === 'sale' || cleanTitle === 'البيع' || cleanTitle === 'تخفيضات' || cleanTitle === 'تنزيلات') {
        url = '/shop?sale=true';
      }
    }

    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      title: title.trim(),
      url,
      parentId,
      displayOrder: menuItems.length + 1
    };

    const updated = [...menuItems, newItem];
    DataService.saveMenuItems(updated);
    setMenuItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Delete this menu item and its sub-items?')) {
      const updated = menuItems.filter(item => item.id !== id && item.parentId !== id);
      DataService.saveMenuItems(updated);
      setMenuItems(updated);
      if (selectedL1 === id) setSelectedL1(null);
      if (selectedL2 === id) setSelectedL2(null);
    }
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const list = menuItems.filter(i => i.parentId === (menuItems.find(x => x.id === id)?.parentId));
    const idx = list.findIndex(i => i.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const updated = [...menuItems];
    const itemA = updated.find(i => i.id === list[idx].id);
    const itemB = updated.find(i => i.id === list[targetIdx].id);
    if (itemA && itemB) {
      const tempOrder = itemA.displayOrder;
      itemA.displayOrder = itemB.displayOrder;
      itemB.displayOrder = tempOrder;
    }

    DataService.saveMenuItems(updated);
    setMenuItems([...updated]);
  };

  const handleSaveMenu = () => {
    DataService.saveMenuItems(menuItems);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-8 bg-white min-h-[80vh]">
      
      {/* 1. TOP HEADER & PRESET BUTTON MATCHING EXACT SCREENSHOT */}
      <div className="space-y-4 border-b border-zinc-100 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-[0.2em] text-zinc-900 uppercase">
          NAVIGATION MENU BUILDER (PRADA SIDEBAR)
        </h1>
        
        <p className="text-xs text-zinc-500 font-medium">
          Design your 3-level side menu drawer. Click any item to manage its sub-items in the next column.
        </p>

        {/* BLUE PRESET BUTTON MATCHING SCREENSHOT */}
        <button
          onClick={handleLoadPreset}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold tracking-wider uppercase rounded transition-colors flex items-center gap-2"
        >
          <Wand2 size={14} /> LOAD FULL LUXURY PRESET MENU CATALOG
        </button>
      </div>

      {/* 2. 3-COLUMN MILLER COLUMNS LAYOUT MATCHING SCREENSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMN 1: LEVEL 1: ROOT ITEMS */}
        <div className="border border-zinc-200 rounded p-4 space-y-4 bg-white shadow-sm min-h-[420px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                LEVEL 1: ROOT ITEMS
              </span>
              <button 
                onClick={() => handleAddItem(1)}
                className="text-[11px] font-bold text-zinc-950 hover:opacity-75 uppercase flex items-center gap-1"
              >
                + ADD
              </button>
            </div>

            <div className="space-y-2 pt-4">
              {rootItems.length === 0 ? (
                <div className="py-20 text-center text-xs text-zinc-400 font-medium">
                  No root items found.
                </div>
              ) : (
                rootItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedL1(item.id);
                      setSelectedL2(null);
                    }}
                    className={`p-3 border rounded flex items-center justify-between cursor-pointer transition-colors text-xs font-extrabold tracking-wider uppercase ${
                      selectedL1 === item.id 
                        ? 'border-zinc-950 bg-zinc-50 text-zinc-950 shadow-sm' 
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    <span>{item.title}</span>

                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(item.id, 'up'); }} className="hover:text-zinc-950 p-0.5">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(item.id, 'down'); }} className="hover:text-zinc-950 p-0.5">
                        <ArrowDown size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="hover:text-red-600 p-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: LEVEL 2: SUB-ITEMS */}
        <div className="border border-zinc-200 rounded p-4 space-y-4 bg-white shadow-sm min-h-[420px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                LEVEL 2: SUB-ITEMS
              </span>
              {selectedL1 && (
                <button 
                  onClick={() => handleAddItem(2)}
                  className="text-[11px] font-bold text-zinc-950 hover:opacity-75 uppercase flex items-center gap-1"
                >
                  + ADD
                </button>
              )}
            </div>

            <div className="space-y-2 pt-4">
              {!selectedL1 ? (
                <div className="py-28 text-center text-xs text-zinc-400 font-medium">
                  Select a Level 1 item first
                </div>
              ) : level2Items.length === 0 ? (
                <div className="py-20 text-center text-xs text-zinc-400 font-medium">
                  No sub-items in this section.
                </div>
              ) : (
                level2Items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedL2(item.id)}
                    className={`p-3 border rounded flex items-center justify-between cursor-pointer transition-colors text-xs font-bold tracking-wider uppercase ${
                      selectedL2 === item.id 
                        ? 'border-zinc-950 bg-zinc-50 text-zinc-950 shadow-sm' 
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    <span>{item.title}</span>

                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(item.id, 'up'); }} className="hover:text-zinc-950 p-0.5">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(item.id, 'down'); }} className="hover:text-zinc-950 p-0.5">
                        <ArrowDown size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="hover:text-red-600 p-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: LEVEL 3: LEAF ITEMS */}
        <div className="border border-zinc-200 rounded p-4 space-y-4 bg-white shadow-sm min-h-[420px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase">
                LEVEL 3: LEAF ITEMS
              </span>
              {selectedL2 && (
                <button 
                  onClick={() => handleAddItem(3)}
                  className="text-[11px] font-bold text-zinc-950 hover:opacity-75 uppercase flex items-center gap-1"
                >
                  + ADD
                </button>
              )}
            </div>

            <div className="space-y-2 pt-4">
              {!selectedL2 ? (
                <div className="py-28 text-center text-xs text-zinc-400 font-medium">
                  Select a Level 2 item first
                </div>
              ) : level3Items.length === 0 ? (
                <div className="py-20 text-center text-xs text-zinc-400 font-medium">
                  No leaf items in this section.
                </div>
              ) : (
                level3Items.map(item => (
                  <div
                    key={item.id}
                    className="p-3 border border-zinc-200 rounded flex items-center justify-between text-xs font-medium text-zinc-700 uppercase"
                  >
                    <span>{item.title}</span>

                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <button onClick={() => handleDeleteItem(item.id)} className="hover:text-red-600 p-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM RIGHT SAVE NAVIGATION MENU BUTTON MATCHING SCREENSHOT */}
      <div className="flex justify-end pt-4 border-t border-zinc-100">
        <button
          onClick={handleSaveMenu}
          className="text-xs font-extrabold tracking-widest text-zinc-950 uppercase hover:opacity-75 transition-opacity flex items-center gap-2"
        >
          {isSaved ? <Check size={16} className="text-emerald-600" /> : <span>💾</span>}
          <span>{isSaved ? 'SAVED SUCCESSFULLY' : 'SAVE NAVIGATION MENU'}</span>
        </button>
      </div>

    </div>
  );
}
