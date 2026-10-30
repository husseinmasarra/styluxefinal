'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/store';
import { MenuItem, Category } from '@/lib/types';
import { INITIAL_MENU_ITEMS } from '@/lib/seed';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Wand2, Save, Check, 
  Edit2, Eye, X, ChevronRight, FolderSync
} from 'lucide-react';

export function MenuBuilder() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedL1, setSelectedL1] = useState<string | null>('women');
  const [selectedL2, setSelectedL2] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('SAVE NAVIGATION MENU');

  // Interactive Live Drawer Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewL1, setPreviewL1] = useState<MenuItem | null>(null);
  const [previewL2, setPreviewL2] = useState<MenuItem | null>(null);

  // Modern Modal Dialog State (replaces prompt())
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalLevel, setModalLevel] = useState<1 | 2 | 3>(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategorySlug, setFormCategorySlug] = useState('');

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const loadData = () => {
    const items = DataService.getMenuItems();
    setMenuItems(items);
    setCategories(DataService.getCategories());

    // Auto-select initial active items if not set
    if (items.length > 0) {
      const roots = items.filter(i => !i.parentId);
      const defaultL1 = roots.find(r => r.id === 'women') || roots[0];
      if (defaultL1) {
        setSelectedL1(prev => prev || defaultL1.id);
        const l2Children = items.filter(i => i.parentId === defaultL1.id);
        if (l2Children.length > 0) {
          setSelectedL2(prev => prev || l2Children[0].id);
        }
      }
    }
  };

  // Load Preset Full Luxury Catalog (3 Levels complete with subcategories)
  const handleLoadPreset = () => {
    DataService.saveMenuItems(INITIAL_MENU_ITEMS);
    setMenuItems(INITIAL_MENU_ITEMS);
    setSelectedL1('women');
    const firstL2 = INITIAL_MENU_ITEMS.find(i => i.parentId === 'women');
    setSelectedL2(firstL2 ? firstL2.id : null);
    setIsSaved(true);
    setSaveMessage('FULL LUXURY PRESET LOADED!');
    setTimeout(() => {
      setIsSaved(false);
      setSaveMessage('SAVE NAVIGATION MENU');
    }, 2500);
  };

  // Auto-Sync Menu Hierarchy from Store Categories
  const handleAutoSyncFromCategories = () => {
    const storeCats = DataService.getCategories();
    if (storeCats.length === 0) {
      alert('No store categories found. Please create categories first in the Categories tab.');
      return;
    }

    const newItems: MenuItem[] = [
      { id: 'women', title: 'WOMEN', url: '/shop?department=women', department: 'women', displayOrder: 1 },
      { id: 'men', title: 'MEN', url: '/shop?department=men', department: 'men', displayOrder: 2 },
      { id: 'sale', title: 'SALE & OFFERS', url: '/shop?sale=true', displayOrder: 3 },
    ];

    let order = 5;
    storeCats.forEach(cat => {
      const parentDeptId = cat.department === 'men' ? 'men' : cat.department === 'kids' ? 'kids' : 'women';
      const catMenuId = `menu-cat-${cat.id}`;
      newItems.push({
        id: catMenuId,
        title: cat.name.toUpperCase(),
        url: `/category/${cat.slug}?department=${cat.department}`,
        parentId: parentDeptId,
        displayOrder: order++
      });

      if (cat.subCategories && cat.subCategories.length > 0) {
        cat.subCategories.forEach(sub => {
          newItems.push({
            id: `menu-sub-${sub.id}`,
            title: sub.name,
            url: `/category/${sub.slug}?department=${cat.department}`,
            parentId: catMenuId,
            displayOrder: order++
          });
        });
      }
    });

    DataService.saveMenuItems(newItems);
    setMenuItems(newItems);
    setSelectedL1('women');
    const firstL2 = newItems.find(i => i.parentId === 'women');
    setSelectedL2(firstL2 ? firstL2.id : null);
    setIsSaved(true);
    setSaveMessage('AUTO-SYNCED FROM CATEGORIES!');
    setTimeout(() => {
      setIsSaved(false);
      setSaveMessage('SAVE NAVIGATION MENU');
    }, 2500);
  };

  // Level 1 Root Items
  const rootItems = menuItems
    .filter(item => !item.parentId)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Level 2 Sub-Items
  const level2Items = selectedL1 
    ? menuItems
        .filter(item => item.parentId === selectedL1)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  // Level 3 Leaf Items
  const level3Items = selectedL2
    ? menuItems
        .filter(item => item.parentId === selectedL2)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  // Interactive Selection Handlers
  const handleSelectL1 = (id: string) => {
    setSelectedL1(id);
    const children = menuItems
      .filter(item => item.parentId === id)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setSelectedL2(children.length > 0 ? children[0].id : null);
  };

  const handleSelectL2 = (id: string) => {
    setSelectedL2(id);
  };

  // Modal Open Handlers
  const openAddModal = (level: 1 | 2 | 3) => {
    setModalMode('add');
    setModalLevel(level);
    setEditingItemId(null);
    setFormTitle('');
    setFormCategorySlug('');

    if (level === 1) {
      setFormUrl('/shop?department=');
    } else if (level === 2) {
      setFormUrl('/shop?category=');
    } else {
      setFormUrl('/shop?category=');
    }

    setModalOpen(true);
  };

  const openEditModal = (item: MenuItem, level: 1 | 2 | 3) => {
    setModalMode('edit');
    setModalLevel(level);
    setEditingItemId(item.id);
    setFormTitle(item.title);
    setFormUrl(item.url || '');
    setFormCategorySlug('');
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let targetUrl = formUrl.trim();
    if (!targetUrl) {
      targetUrl = `/shop?category=${encodeURIComponent(formTitle.trim())}`;
    }

    if (modalMode === 'add') {
      let parentId: string | undefined = undefined;
      if (modalLevel === 2) parentId = selectedL1 || undefined;
      if (modalLevel === 3) parentId = selectedL2 || undefined;

      const newItem: MenuItem = {
        id: `menu-${Date.now()}`,
        title: formTitle.trim(),
        url: targetUrl,
        parentId,
        displayOrder: menuItems.length + 1
      };

      const updated = [...menuItems, newItem];
      DataService.saveMenuItems(updated);
      setMenuItems(updated);

      if (modalLevel === 1) {
        setSelectedL1(newItem.id);
        setSelectedL2(null);
      } else if (modalLevel === 2) {
        setSelectedL2(newItem.id);
      }
    } else if (modalMode === 'edit' && editingItemId) {
      const updated = menuItems.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            title: formTitle.trim(),
            url: targetUrl
          };
        }
        return item;
      });
      DataService.saveMenuItems(updated);
      setMenuItems(updated);
    }

    setModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Delete this menu item and all its sub-items?')) {
      const toDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        menuItems.forEach(item => {
          if (item.parentId && toDelete.has(item.parentId) && !toDelete.has(item.id)) {
            toDelete.add(item.id);
            changed = true;
          }
        });
      }

      const updated = menuItems.filter(item => !toDelete.has(item.id));
      DataService.saveMenuItems(updated);
      setMenuItems(updated);

      if (selectedL1 === id) {
        const remainingRoots = updated.filter(i => !i.parentId);
        setSelectedL1(remainingRoots.length > 0 ? remainingRoots[0].id : null);
        setSelectedL2(null);
      } else if (selectedL2 === id) {
        const remainingL2 = updated.filter(i => i.parentId === selectedL1);
        setSelectedL2(remainingL2.length > 0 ? remainingL2[0].id : null);
      }
    }
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const currentItem = menuItems.find(x => x.id === id);
    if (!currentItem) return;

    const list = menuItems
      .filter(i => i.parentId === currentItem.parentId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const idx = list.findIndex(i => i.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const targetItem = list[targetIdx];
    const updated = menuItems.map(item => {
      if (item.id === currentItem.id) {
        return { ...item, displayOrder: targetItem.displayOrder };
      }
      if (item.id === targetItem.id) {
        return { ...item, displayOrder: currentItem.displayOrder };
      }
      return item;
    });

    DataService.saveMenuItems(updated);
    setMenuItems(updated);
  };

  const handleSaveMenu = () => {
    DataService.saveMenuItems(menuItems);
    setIsSaved(true);
    setSaveMessage('SAVED SUCCESSFULLY!');
    setTimeout(() => {
      setIsSaved(false);
      setSaveMessage('SAVE NAVIGATION MENU');
    }, 2000);
  };

  const getSubItemCount = (parentId: string) => {
    return menuItems.filter(item => item.parentId === parentId).length;
  };

  const currentL1Item = rootItems.find(r => r.id === selectedL1);
  const currentL2Item = level2Items.find(l => l.id === selectedL2);

  return (
    <div className="space-y-8 bg-white min-h-[80vh] font-sans pb-16">
      
      {/* 1. TOP HEADER WITH QUICK ACTIONS */}
      <div className="space-y-4 border-b border-zinc-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-[0.2em] text-zinc-950 uppercase">
              NAVIGATION MENU BUILDER (PRADA SIDEBAR)
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
              Design your 3-level interactive drawer. Click any item to manage its sub-items in the next column.
            </p>
          </div>

          {/* Interactive Live Drawer Test Trigger */}
          <button
            onClick={() => {
              const r = rootItems.find(x => x.id === selectedL1) || rootItems[0] || null;
              setPreviewL1(r);
              if (r) {
                const l2s = menuItems.filter(m => m.parentId === r.id);
                setPreviewL2(l2s[0] || null);
              } else {
                setPreviewL2(null);
              }
              setIsPreviewOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black tracking-wider uppercase rounded shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Eye size={15} /> TEST LIVE INTERACTIVE DRAWER
          </button>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Blue Preset Catalog Button */}
          <button
            onClick={handleLoadPreset}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black tracking-wider uppercase rounded transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Wand2 size={14} /> LOAD FULL LUXURY PRESET MENU CATALOG
          </button>

          {/* Auto-Sync with Store Categories Button */}
          <button
            onClick={handleAutoSyncFromCategories}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black tracking-wider uppercase rounded transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FolderSync size={14} /> AUTO-SYNC FROM STORE CATEGORIES
          </button>
        </div>

        {/* Active Path Breadcrumbs */}
        <div className="bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded text-xs font-mono font-bold flex items-center gap-2 text-zinc-700">
          <span className="text-zinc-400 uppercase tracking-widest text-[10px]">CURRENT PATH:</span>
          <span className={currentL1Item ? 'text-zinc-950 underline font-black' : 'text-zinc-400'}>
            {currentL1Item ? currentL1Item.title : '(No Level 1 Selected)'}
          </span>
          <ChevronRight size={13} className="text-zinc-400" />
          <span className={currentL2Item ? 'text-zinc-950 underline font-black' : 'text-zinc-400'}>
            {currentL2Item ? currentL2Item.title : '(No Level 2 Selected)'}
          </span>
          {currentL2Item && (
            <>
              <ChevronRight size={13} className="text-zinc-400" />
              <span className="text-emerald-700 font-black">
                {level3Items.length} LEAF ITEMS
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. 3-COLUMN MILLER COLUMNS LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMN 1: LEVEL 1: ROOT ITEMS */}
        <div className="border border-zinc-300 rounded p-4 space-y-4 bg-white shadow-sm min-h-[480px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-xs font-black tracking-widest text-zinc-950 uppercase block">
                  LEVEL 1: ROOT ITEMS
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  {rootItems.length} DEPARTMENTS
                </span>
              </div>
              <button 
                onClick={() => openAddModal(1)}
                className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black uppercase rounded flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus size={13} /> ADD
              </button>
            </div>

            <div className="space-y-2">
              {rootItems.length === 0 ? (
                <div className="py-24 text-center text-xs text-zinc-400 font-bold uppercase space-y-3">
                  <p>No root items found.</p>
                  <button
                    onClick={handleLoadPreset}
                    className="text-blue-700 underline text-xs font-bold"
                  >
                    Click here to load presets
                  </button>
                </div>
              ) : (
                rootItems.map(item => {
                  const subCount = getSubItemCount(item.id);
                  const isSelected = selectedL1 === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectL1(item.id)}
                      className={`p-3.5 border rounded flex items-center justify-between cursor-pointer transition-all text-xs font-black tracking-wider uppercase select-none ${
                        isSelected 
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-md' 
                          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate">{item.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {subCount} SUB
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleMoveOrder(item.id, 'up')} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-zinc-300 hover:text-white' : 'text-zinc-500'}`}
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button 
                          onClick={() => handleMoveOrder(item.id, 'down')} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-zinc-300 hover:text-white' : 'text-zinc-500'}`}
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button 
                          onClick={() => openEditModal(item, 1)} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-amber-300 hover:text-amber-200' : 'text-amber-600'}`}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-red-300 hover:text-red-200' : 'text-red-600'}`}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: LEVEL 2: SUB-ITEMS */}
        <div className="border border-zinc-300 rounded p-4 space-y-4 bg-white shadow-sm min-h-[480px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-xs font-black tracking-widest text-zinc-950 uppercase block">
                  LEVEL 2: SUB-ITEMS
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  {selectedL1 ? `${currentL1Item?.title || ''} (${level2Items.length} ITEMS)` : 'SELECT LEVEL 1 FIRST'}
                </span>
              </div>
              {selectedL1 && (
                <button 
                  onClick={() => openAddModal(2)}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black uppercase rounded flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Plus size={13} /> ADD
                </button>
              )}
            </div>

            <div className="space-y-2">
              {!selectedL1 ? (
                <div className="py-28 text-center text-xs text-zinc-400 font-bold uppercase">
                  Select a Level 1 item first
                </div>
              ) : level2Items.length === 0 ? (
                <div className="py-24 text-center text-xs text-zinc-400 font-bold uppercase space-y-3">
                  <p>No sub-items in this section.</p>
                  <button
                    onClick={() => openAddModal(2)}
                    className="px-3 py-1.5 bg-zinc-950 text-white text-xs font-bold rounded inline-flex items-center gap-1"
                  >
                    <Plus size={12} /> Add First Sub-Item
                  </button>
                </div>
              ) : (
                level2Items.map(item => {
                  const leafCount = getSubItemCount(item.id);
                  const isSelected = selectedL2 === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectL2(item.id)}
                      className={`p-3.5 border rounded flex items-center justify-between cursor-pointer transition-all text-xs font-black tracking-wider uppercase select-none ${
                        isSelected 
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-md' 
                          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate">{item.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {leafCount} LEAF
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleMoveOrder(item.id, 'up')} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-zinc-300 hover:text-white' : 'text-zinc-500'}`}
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button 
                          onClick={() => handleMoveOrder(item.id, 'down')} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-zinc-300 hover:text-white' : 'text-zinc-500'}`}
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button 
                          onClick={() => openEditModal(item, 2)} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-amber-300 hover:text-amber-200' : 'text-amber-600'}`}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)} 
                          className={`p-1 rounded hover:bg-zinc-200/50 ${isSelected ? 'text-red-300 hover:text-red-200' : 'text-red-600'}`}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: LEVEL 3: LEAF ITEMS */}
        <div className="border border-zinc-300 rounded p-4 space-y-4 bg-white shadow-sm min-h-[480px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-xs font-black tracking-widest text-zinc-950 uppercase block">
                  LEVEL 3: LEAF ITEMS
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  {selectedL2 ? `${currentL2Item?.title || ''} (${level3Items.length} ITEMS)` : 'SELECT LEVEL 2 FIRST'}
                </span>
              </div>
              {selectedL2 && (
                <button 
                  onClick={() => openAddModal(3)}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black uppercase rounded flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Plus size={13} /> ADD
                </button>
              )}
            </div>

            <div className="space-y-2">
              {!selectedL2 ? (
                <div className="py-28 text-center text-xs text-zinc-400 font-bold uppercase">
                  Select a Level 2 item first
                </div>
              ) : level3Items.length === 0 ? (
                <div className="py-24 text-center text-xs text-zinc-400 font-bold uppercase space-y-3">
                  <p>No leaf items in this section.</p>
                  <button
                    onClick={() => openAddModal(3)}
                    className="px-3 py-1.5 bg-zinc-950 text-white text-xs font-bold rounded inline-flex items-center gap-1"
                  >
                    <Plus size={12} /> Add First Leaf Item
                  </button>
                </div>
              ) : (
                level3Items.map(item => (
                  <div
                    key={item.id}
                    className="p-3 border border-zinc-200 rounded flex items-center justify-between text-xs font-bold text-zinc-800 uppercase bg-white hover:border-zinc-400 transition-colors"
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="block truncate text-zinc-950">{item.title}</span>
                      <span className="block text-[10px] text-zinc-400 font-mono lowercase truncate">
                        {item.url}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button 
                        onClick={() => handleMoveOrder(item.id, 'up')} 
                        className="p-1 rounded text-zinc-500 hover:text-zinc-950"
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button 
                        onClick={() => handleMoveOrder(item.id, 'down')} 
                        className="p-1 rounded text-zinc-500 hover:text-zinc-950"
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button 
                        onClick={() => openEditModal(item, 3)} 
                        className="p-1 rounded text-amber-600 hover:text-amber-800"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        className="p-1 rounded text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM SAVE BAR */}
      <div className="flex justify-end pt-6 border-t border-zinc-200">
        <button
          onClick={handleSaveMenu}
          className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          {isSaved ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />}
          <span>{saveMessage}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODERN ADD / EDIT ITEM MODAL (REPLACES BROWSER PROMPT) */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white border border-zinc-300 p-6 sm:p-8 max-w-lg w-full rounded-none shadow-2xl space-y-6 relative animate-scaleUp">
            
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-black tracking-widest text-zinc-950 uppercase">
                  {modalMode === 'add' ? `+ ADD LEVEL ${modalLevel} ITEM` : `EDIT LEVEL ${modalLevel} ITEM`}
                </h3>
                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                  {modalLevel === 1 ? 'Root Department' : modalLevel === 2 ? `Sub-item under ${currentL1Item?.title || ''}` : `Leaf item under ${currentL2Item?.title || ''}`}
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              
              {/* Optional Quick Store Category Picker */}
              {categories.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider text-zinc-900 uppercase block">
                    LINK TO STORE CATEGORY (OPTIONAL):
                  </label>
                  <select
                    value={formCategorySlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      setFormCategorySlug(slug);
                      const matched = categories.find(c => c.slug === slug);
                      if (matched) {
                        if (!formTitle || modalMode === 'add') setFormTitle(matched.name.toUpperCase());
                        setFormUrl(`/category/${matched.slug}?department=${matched.department}`);
                      }
                    }}
                    className="w-full p-2.5 border border-zinc-300 text-xs font-bold uppercase bg-zinc-50 focus:outline-none focus:border-zinc-950"
                  >
                    <option value="">-- Choose Category or enter custom below --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.department.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Item Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black tracking-wider text-zinc-900 uppercase block">
                  ITEM TITLE: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. READY TO WEAR, BAGS, SHOES, JEANS..."
                  className="w-full p-3 border border-zinc-300 text-xs font-bold uppercase focus:outline-none focus:border-zinc-950"
                  autoFocus
                />
              </div>

              {/* Target URL Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black tracking-wider text-zinc-900 uppercase">
                    TARGET LINK:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (formTitle) {
                        setFormUrl(`/shop?category=${encodeURIComponent(formTitle.trim())}`);
                      }
                    }}
                    className="text-[10px] font-bold text-blue-700 underline uppercase"
                  >
                    Auto-Generate URL
                  </button>
                </div>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="/shop?category=... or /category/..."
                  className="w-full p-3 border border-zinc-300 text-xs font-mono font-medium focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-zinc-300 text-zinc-700 text-xs font-bold uppercase hover:bg-zinc-100"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider shadow-md"
                >
                  {modalMode === 'add' ? 'ADD ITEM' : 'SAVE CHANGES'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LIVE INTERACTIVE DRAWER TEST PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[999999] flex animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs"
            onClick={() => setIsPreviewOpen(false)}
          />

          {/* Drawer Simulation Container */}
          <div className="relative h-full flex flex-row overflow-x-auto shadow-2xl z-10 bg-white">
            
            {/* COLUMN 1 PREVIEW */}
            <div className="w-[300px] sm:w-[320px] shrink-0 bg-white h-full border-r border-zinc-200 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black tracking-widest uppercase text-zinc-950">
                      LIVE PREVIEW (LEVEL 1)
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-zinc-500 hover:text-zinc-950 text-xs font-bold uppercase flex items-center gap-1"
                  >
                    <X size={16} /> Close
                  </button>
                </div>

                <div className="py-4">
                  {rootItems.map(item => {
                    const l2s = menuItems.filter(m => m.parentId === item.id);
                    const isActive = previewL1?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setPreviewL1(item);
                          setPreviewL2(l2s.length > 0 ? l2s[0] : null);
                        }}
                        className={`flex items-center justify-between px-6 py-3.5 cursor-pointer text-sm transition-colors ${
                          isActive 
                            ? 'bg-zinc-100 text-zinc-950 font-bold border-l-4 border-zinc-950' 
                            : 'text-zinc-800 hover:bg-zinc-50 font-normal'
                        }`}
                      >
                        <span>{item.title}</span>
                        {l2s.length > 0 && <ChevronRight size={15} className="text-zinc-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 text-[11px] text-zinc-400 uppercase font-mono">
                PRADA SIDEBAR INTERACTIVE TEST
              </div>
            </div>

            {/* COLUMN 2 PREVIEW */}
            {previewL1 && (() => {
              const l2s = menuItems
                .filter(m => m.parentId === previewL1.id)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

              return (
                <div className="w-[300px] sm:w-[320px] shrink-0 bg-white h-full border-r border-zinc-200 flex flex-col justify-between overflow-y-auto animate-slideRight">
                  <div>
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-xs font-black tracking-widest uppercase text-zinc-950">
                        {previewL1.title} (LEVEL 2)
                      </span>
                    </div>

                    <div className="py-4">
                      {l2s.length === 0 ? (
                        <div className="p-6 text-center text-xs text-zinc-400 font-bold uppercase">
                          No sub-items in this section
                        </div>
                      ) : (
                        l2s.map(item => {
                          const l3s = menuItems.filter(m => m.parentId === item.id);
                          const isActive = previewL2?.id === item.id;

                          return (
                            <div
                              key={item.id}
                              onClick={() => setPreviewL2(item)}
                              className={`flex items-center justify-between px-6 py-3 cursor-pointer text-sm transition-colors ${
                                isActive 
                                  ? 'bg-zinc-100 text-zinc-950 font-bold border-l-4 border-zinc-950' 
                                  : 'text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              <span>{item.title}</span>
                              {l3s.length > 0 && <ChevronRight size={15} className="text-zinc-400" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* COLUMN 3 PREVIEW */}
            {previewL2 && (() => {
              const l3s = menuItems
                .filter(m => m.parentId === previewL2.id)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

              return (
                <div className="w-[300px] sm:w-[320px] shrink-0 bg-white h-full border-r border-zinc-200 flex flex-col justify-between overflow-y-auto animate-slideRight">
                  <div>
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-xs font-black tracking-widest uppercase text-zinc-950">
                        {previewL2.title} (LEVEL 3)
                      </span>
                    </div>

                    <div className="py-4">
                      {l3s.length === 0 ? (
                        <div className="p-6 text-center text-xs text-zinc-400 font-bold uppercase">
                          No leaf items in this section
                        </div>
                      ) : (
                        l3s.map(item => (
                          <div
                            key={item.id}
                            className="px-6 py-2.5 text-sm text-zinc-800 hover:text-zinc-950 hover:bg-zinc-50 cursor-pointer select-none transition-colors"
                          >
                            {item.title}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}
