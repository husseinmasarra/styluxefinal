'use client';

import React, { useState, useEffect } from 'react';
import { DataService, formatCurrency, getCustomerTier } from '@/lib/store';
import { Customer, CustomerTier, Order } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { 
  Search, Mail, Phone, MapPin, Calendar, DollarSign, Trash2, Edit2, X, 
  User, Download, Send, MessageSquare, Share2, Sparkles, ExternalLink, Check, ShieldCheck, Award,
  Plus, ShoppingBag, Eye, Package, Copy, CheckCheck, Users
} from 'lucide-react';

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function MetaIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// Clean and normalize phone number for WhatsApp direct link
function normalizePhoneForWhatsApp(phoneStr: string): string {
  if (!phoneStr) return '';
  let cleaned = phoneStr.replace(/[^0-9]/g, '');
  // Lebanese 8-digit mobile (e.g. 03XXXXXX, 70XXXXXX, 71XXXXXX, 76XXXXXX, 78XXXXXX, 79XXXXXX, 81XXXXXX)
  if (cleaned.length === 8 && cleaned.startsWith('0')) {
    cleaned = '961' + cleaned.substring(1);
  } else if (cleaned.length === 8) {
    cleaned = '961' + cleaned;
  } else if (cleaned.length === 7) {
    cleaned = '961' + cleaned;
  }
  return cleaned;
}

export function CustomersManager() {
  const { currency, settings, showToast } = useCart();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | 'platinum' | 'gold' | 'silver' | 'bronze'>('all');
  
  // Create / Edit customer modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer Orders modal state
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [ordersCustomer, setOrdersCustomer] = useState<Customer | null>(null);
  const [customerOrdersList, setCustomerOrdersList] = useState<Order[]>([]);

  // WhatsApp Concierge CRM modal state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppCustomer, setWhatsAppCustomer] = useState<Customer | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('vip_welcome_ar');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Bulk WhatsApp Broadcast modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTierFilter, setBulkTierFilter] = useState<'all' | 'platinum' | 'gold' | 'silver'>('all');
  const [bulkMessage, setBulkMessage] = useState<string>(
    'مرحباً، يسعدنا في STYLUXE إعلامك بوصول تشكيلة جديدة وحصرية من أرقى الماركات العالمية (Dior, Zegna, Loro Piana). تصفح المجموعة وتفضل بطلب قطعك المفضلة مع توصيل سريع في لبنان والدفع عند الاستلام:\nhttps://www.styluxelb.com/shop'
  );
  const [copiedNumbers, setCopiedNumbers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Beirut',
    notes: '',
    tier: 'auto',
    totalSpentUSD: 0,
    totalOrders: 0
  });

  useEffect(() => {
    loadCustomers();
    const handleUpdate = () => loadCustomers();
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  // Keyboard shortcut listener: ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isBulkModalOpen) setIsBulkModalOpen(false);
        if (isWhatsAppModalOpen) setIsWhatsAppModalOpen(false);
        if (isOrdersModalOpen) setIsOrdersModalOpen(false);
        if (isModalOpen) setIsModalOpen(false);
      }
    };
    if (isModalOpen || isWhatsAppModalOpen || isOrdersModalOpen || isBulkModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isWhatsAppModalOpen, isOrdersModalOpen, isBulkModalOpen]);

  // Standard full CSV export
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

  // Meta Ads / Facebook & Instagram Custom Audience CSV Export
  const handleExportMetaAudienceCSV = () => {
    if (customers.length === 0) {
      showToast('No customers available to export for Meta Audience', 'error');
      return;
    }
    // Meta Ads Manager Customer List format
    const headers = ['email', 'phone', 'fn', 'ln', 'ct', 'country', 'value'];
    const rows = customers.map(c => {
      const email = (c.email || '').toLowerCase().trim();
      const phone = normalizePhoneForWhatsApp(c.phone || '');
      const nameParts = (c.name || '').trim().split(/\s+/);
      const fn = nameParts[0] || '';
      const ln = nameParts.slice(1).join(' ') || fn;
      const city = 'Beirut';
      const country = 'LB';
      const value = c.totalSpentUSD || 0;
      return [
        `"${email}"`,
        `"${phone}"`,
        `"${fn.replace(/"/g, '""')}"`,
        `"${ln.replace(/"/g, '""')}"`,
        `"${city}"`,
        `"${country}"`,
        value
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `styluxe_meta_ads_audience_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Meta Custom Audience CSV exported successfully!', 'success');
  };

  const loadCustomers = () => {
    setCustomers(DataService.getCustomers());
    setAllOrders(DataService.getOrders());
  };

  const getCustomerOrders = (cust: Customer): Order[] => {
    const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (cust.email || '').toLowerCase().trim();
    const cleanName = (cust.name || '').toLowerCase().trim();
    return allOrders.filter(o => 
      (cleanEmail && o.customerEmail && o.customerEmail.toLowerCase().trim() === cleanEmail) ||
      (cleanPhone.length >= 6 && o.customerPhone && o.customerPhone.replace(/[^0-9]/g, '').includes(cleanPhone)) ||
      (cleanName && o.customerName && o.customerName.toLowerCase().trim() === cleanName)
    );
  };

  const handleOpenOrdersModal = (cust: Customer) => {
    setOrdersCustomer(cust);
    const matched = getCustomerOrders(cust);
    setCustomerOrdersList(matched);
    setIsOrdersModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: 'Beirut',
      notes: '',
      tier: 'auto',
      totalSpentUSD: 0,
      totalOrders: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      email: cust.email || '',
      phone: cust.phone || '',
      address: cust.address || '',
      city: cust.city || 'Beirut',
      notes: cust.notes || '',
      tier: cust.tier || 'auto',
      totalSpentUSD: cust.totalSpentUSD || 0,
      totalOrders: cust.totalOrders || 0
    });
    setIsModalOpen(true);
  };

  // Open WhatsApp CRM Concierge Modal
  const handleOpenWhatsAppModal = (cust: Customer) => {
    setWhatsAppCustomer(cust);
    const tier = getCustomerTier(cust.totalSpentUSD, cust.totalOrders);
    let initialKey = 'vip_welcome_ar';
    if (tier.tier === 'platinum') initialKey = 'vip_platinum_perks';
    else if (tier.tier === 'gold') initialKey = 'vip_gold_perks';
    else if (tier.tier === 'silver') initialKey = 'vip_silver_perks';

    setSelectedTemplateKey(initialKey);
    setCustomMessage(getTemplateText(initialKey, cust));
    setIsWhatsAppModalOpen(true);
  };

  const getTemplateText = (templateKey: string, cust: Customer): string => {
    const name = cust.name || 'عميلنا العزيز';
    switch (templateKey) {
      case 'vip_platinum_perks':
        return `مرحباً ${name} 👑، يسعدنا في STYLUXE Beirut إعلامك بحصولك على تصنيف النخبة البلاتينية VIP Platinum.\n\nبصفتك من عملائنا الأكثر تميزاً، نسعد بتقديم خدمة المساعد الشخصي والتوصيل السريع المجاني لأي طلب خاص من أحدث التشكيلات العالمية.\n\nتفضل بزيارة متجرنا: https://www.styluxelb.com`;
      case 'vip_gold_perks':
        return `مرحباً ${name} ⭐، نشكر ثقتك المستمرة بـ STYLUXE Beirut. يسعدنا تصنيفك ضمن عملاء VIP Gold مع أولوية التجهيز وتتبع الشحن المباشر عبر الواتساب لكافة طلبياتك.\n\nتفضل بزيارة متجرنا: https://www.styluxelb.com`;
      case 'vip_silver_perks':
        return `مرحباً ${name} 💎، تقديراً لولائك لـ STYLUXE Beirut في تصنيف VIP Silver، نود إطلاعك على أحدث التصاميم الحصرية في متجرنا مع حفظ عنوانك وخياراتك المفضلة.\n\nتفضل بزيارة متجرنا: https://www.styluxelb.com`;
      case 'vip_welcome_ar':
        return `مرحباً ${name}، يسعدنا انضمامك إلى نخبة عملاء STYLUXE Beirut. نحن دائماً في خدمتكم لأي استفسار أو طلب خاص لأحدث الأزياء العالمية الفاخرة.\n\nتفضل بزيارة متجرنا: https://www.styluxelb.com`;
      case 'vip_welcome_en':
        return `Dear ${name}, thank you for choosing STYLUXE Beirut. We are at your service for any exclusive inquiries or personal styling assistance across our luxury designer collections.\n\nExplore our archives: https://www.styluxelb.com`;
      case 'order_followup_ar':
        return `مرحباً ${name}، بخصوص طلبك من STYLUXE Beirut، نود إعلامك بأن فريقنا يتابع تجهيز طلبك لخدمة التوصيل السريع. هل تود تأكيد عنوان التوصيل أو إضافة أي طلب آخر؟`;
      case 'order_followup_en':
        return `Dear ${name}, regarding your order with STYLUXE Beirut, our concierge team is currently preparing your parcel for express delivery. Please let us know if you require any specific scheduling or delivery details.`;
      case 'new_arrivals_ar':
        return `مرحباً ${name}، وصلتنا للتو تشكيلة جديدة حصرية من تصاميم الماركات العالمية (ZEGNA, BERLUTI, DIOR, LORO PIANA) على موقعنا.\n\nتصفح المجموعة الجديدة حصرياً: https://www.styluxelb.com`;
      case 'new_arrivals_en':
        return `Dear ${name}, exclusive new seasonal arrivals from our premier fashion houses (ZEGNA, BERLUTI, DIOR, LORO PIANA) have just dropped at STYLUXE.\n\nDiscover the curated drop: https://www.styluxelb.com`;
      default:
        return '';
    }
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    if (whatsAppCustomer && key !== 'custom') {
      setCustomMessage(getTemplateText(key, whatsAppCustomer));
    }
  };

  const handleSendWhatsApp = () => {
    if (!whatsAppCustomer) return;
    const rawPhone = whatsAppCustomer.phone || '';
    const cleanPhone = normalizePhoneForWhatsApp(rawPhone);
    if (!cleanPhone) {
      showToast('Customer does not have a valid phone number. Please edit profile first.', 'error');
      return;
    }
    const encoded = encodeURIComponent(customMessage.trim());
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
    setIsWhatsAppModalOpen(false);
  };

  const getBulkTargetCustomers = (): Customer[] => {
    if (bulkTierFilter === 'all') return customers;
    return customers.filter(c => {
      const tier = getCustomerTier(c.totalSpentUSD, c.totalOrders);
      return tier.tier === bulkTierFilter;
    });
  };

  const handleCopyBulkNumbers = () => {
    const list = getBulkTargetCustomers();
    const phones = list.map(c => normalizePhoneForWhatsApp(c.phone)).filter(Boolean).join(', ');
    if (!phones) {
      showToast('No valid phone numbers found for this tier.', 'error');
      return;
    }
    navigator.clipboard.writeText(phones);
    setCopiedNumbers(true);
    showToast(`Copied ${list.length} phone numbers! Paste into WhatsApp Broadcast List.`, 'success');
    setTimeout(() => setCopiedNumbers(false), 3000);
  };

  const handleSendSingleBulk = (cust: Customer) => {
    const cleanPhone = normalizePhoneForWhatsApp(cust.phone);
    if (!cleanPhone) {
      showToast(`${cust.name} does not have a valid phone number.`, 'error');
      return;
    }
    const personalized = bulkMessage.replace(/مرحباً/g, `مرحباً ${cust.name}`);
    const encoded = encodeURIComponent(personalized.trim());
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const resolvedTier: CustomerTier | undefined = 
      formData.tier === 'auto' ? undefined : (formData.tier as CustomerTier);

    let updatedCust: Customer;
    if (editingCustomer) {
      updatedCust = {
        ...editingCustomer,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim() || 'Beirut',
        notes: formData.notes.trim(),
        tier: resolvedTier,
        totalSpentUSD: Number(formData.totalSpentUSD) || 0,
        totalOrders: Number(formData.totalOrders) || 0,
      };
    } else {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      updatedCust = {
        id: `cust-${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email.trim() || `${cleanPhone}@styluxecustomer.com`,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim() || 'Beirut',
        notes: formData.notes.trim(),
        tier: resolvedTier,
        totalSpentUSD: Number(formData.totalSpentUSD) || 0,
        totalOrders: Number(formData.totalOrders) || 0,
        createdAt: new Date().toISOString(),
      };
    }

    const updatedList = DataService.saveCustomer(updatedCust);
    setCustomers(updatedList);
    setIsModalOpen(false);
    showToast(editingCustomer ? 'Customer profile updated successfully!' : 'New VIP client added successfully!', 'success');
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Are you sure you want to delete this customer account?')) {
      const updatedList = DataService.deleteCustomer(id);
      setCustomers(updatedList);
      showToast('Customer account deleted successfully!', 'success');
    }
  };

  // Tier Counts Calculation
  const platinumCount = customers.filter(c => getCustomerTier(c.totalSpentUSD, c.totalOrders).tier === 'platinum').length;
  const goldCount = customers.filter(c => getCustomerTier(c.totalSpentUSD, c.totalOrders).tier === 'gold').length;
  const silverCount = customers.filter(c => getCustomerTier(c.totalSpentUSD, c.totalOrders).tier === 'silver').length;
  const bronzeCount = customers.filter(c => getCustomerTier(c.totalSpentUSD, c.totalOrders).tier === 'bronze').length;

  const filteredCustomers = customers.filter(c => {
    if (selectedTierFilter !== 'all') {
      const custTier = getCustomerTier(c.totalSpentUSD, c.totalOrders).tier;
      if (custTier !== selectedTierFilter) return false;
    }
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
      
      {/* 1. OMNI-CHANNEL CRM & SOCIAL MEDIA SYNC BANNER */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white p-6 sm:p-8 rounded-xl shadow-lg border border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-[0.2em] uppercase text-white">
                OMNI-CHANNEL CRM & SOCIAL MEDIA ENGINE
              </h2>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider pt-0.5">
                Connect customer database with WhatsApp Business, Instagram Shopping & Meta Pixel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-700 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              WHATSAPP CRM ACTIVE
            </span>
            {settings.metaPixelId && (
              <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-widest bg-blue-950 text-blue-400 border border-blue-700 uppercase flex items-center gap-1.5">
                <MetaIcon className="w-3 h-3" />
                PIXEL SYNC
              </span>
            )}
          </div>
        </div>

        {/* 4 Key Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          <div className="bg-zinc-900/80 border border-emerald-500/30 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-wider uppercase">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Store Phone WhatsApp Sync</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Store WhatsApp: <strong className="text-white font-mono">{settings.whatsappNumber || settings.menWhatsappNumber || '96181713408'}</strong>. When clients place orders, their VIP level is automatically synchronized.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-wider uppercase">
              <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              <span>1-Click WhatsApp Concierge</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Message any VIP customer instantly with 1 click using personalized VIP Platinum, Gold, and Silver loyalty drop templates.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-black tracking-wider uppercase">
              <MetaIcon className="w-4 h-4 text-blue-400" />
              <span>Meta Ads Custom Audiences</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Export customer phone and email lists formatted for Meta Ads Manager to create VIP Lookalike audiences on Instagram and Facebook.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-pink-400 text-xs font-black tracking-wider uppercase">
              <Share2 size={16} />
              <span>Instagram & Facebook Shop Feed</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Sync products directly with Meta Commerce Manager to enable product tagging on Instagram Reels, Stories, and Posts.
            </p>
          </div>

        </div>
      </div>

      {/* 2. PAGE TITLE, EXPORT BUTTONS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.25em] text-zinc-950 uppercase">
            REGISTERED CLIENTS & CRM
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider pt-1.5">
            Total {customers.length} registered VIP accounts with direct communication actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          {/* Meta Audience Export */}
          <button
            onClick={handleExportMetaAudienceCSV}
            className="px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="Export customer list formatted for Meta Ads (Facebook & Instagram Lookalike Audiences)"
          >
            <MetaIcon className="w-4 h-4 text-white" />
            <span>META ADS AUDIENCE (CSV)</span>
          </button>

          {/* Standard CSV Export */}
          <button
            onClick={handleExportCustomersCSV}
            className="px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="Download full customer database spreadsheet"
          >
            <Download size={16} />
            <span>EXPORT CLIENTS (CSV)</span>
          </button>

          {/* Bulk Broadcast New Arrivals Button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="Send bulk WhatsApp message to customers about new arrivals"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>BROADCAST NEW ARRIVALS (رسائل جماعية)</span>
          </button>

          {/* Add New VIP Client Button */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-3 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="Register a new VIP client manually"
          >
            <Plus size={16} />
            <span>+ ADD NEW CLIENT</span>
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

      {/* TIER FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => setSelectedTierFilter('all')}
          className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded transition-all cursor-pointer ${
            selectedTierFilter === 'all'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          ALL CLIENTS ({customers.length})
        </button>
        <button
          onClick={() => setSelectedTierFilter('platinum')}
          className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedTierFilter === 'platinum'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 shadow-xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>👑</span>
          <span>VIP PLATINUM ({platinumCount})</span>
        </button>
        <button
          onClick={() => setSelectedTierFilter('gold')}
          className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedTierFilter === 'gold'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>⭐</span>
          <span>VIP GOLD ({goldCount})</span>
        </button>
        <button
          onClick={() => setSelectedTierFilter('silver')}
          className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedTierFilter === 'silver'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>💎</span>
          <span>VIP SILVER ({silverCount})</span>
        </button>
        <button
          onClick={() => setSelectedTierFilter('bronze')}
          className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedTierFilter === 'bronze'
              ? 'bg-zinc-700 text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200'
          }`}
        >
          <span>✨</span>
          <span>NEW CLIENT ({bronzeCount})</span>
        </button>
      </div>

      {/* 3. CUSTOMERS DATA TABLE */}
      <div className="border border-zinc-300 rounded overflow-x-auto shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-100/70 text-[11px]">
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">NAME</th>
              <th className="py-3 px-1.5 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">TIER / المستوى</th>
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center">EMAIL</th>
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">PHONE</th>
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center">ADDRESS</th>
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">LIFETIME VALUE</th>
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">CRM ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-xs font-extrabold text-zinc-400 tracking-wider uppercase">
                  NO REGISTERED CUSTOMERS FOUND IN THIS CATEGORY.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => {
                const tier = getCustomerTier(cust.totalSpentUSD, cust.totalOrders);
                return (
                  <tr key={cust.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs">
                    
                    {/* NAME */}
                    <td className="py-3 px-2 font-bold text-zinc-950 text-center uppercase tracking-wider whitespace-nowrap text-xs">
                      {cust.name}
                    </td>

                    {/* CLIENT TIER */}
                    <td className="py-3 px-1.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${tier.badgeClass}`}>
                          <span>{tier.icon}</span>
                          <span>{tier.label}</span>
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 font-mono">
                          {cust.totalOrders || 0} Orders
                        </span>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="py-3 px-2 font-medium text-zinc-700 text-center text-[11px] max-w-[140px] truncate" title={cust.email || 'N/A'}>
                      {cust.email || 'N/A'}
                    </td>

                    {/* PHONE */}
                    <td className="py-3 px-2 font-mono font-bold text-zinc-800 text-center text-[11px] whitespace-nowrap">
                      {cust.phone || 'N/A'}
                    </td>

                    {/* ADDRESS */}
                    <td className="py-3 px-2 font-medium text-zinc-600 text-center uppercase text-[11px] max-w-[130px] truncate" title={cust.address || 'BEIRUT, LEBANON'}>
                      {cust.address || 'BEIRUT, LEBANON'}
                    </td>

                    {/* LIFETIME VALUE */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className="font-black text-emerald-600 text-xs block font-mono">
                        {formatCurrency(cust.totalSpentUSD, currency, settings.lbpRate, settings.eurRate)}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">
                        {cust.totalOrders || 0} ORDER(S)
                      </span>
                    </td>

                    {/* ACTIONS: ORDERS, WHATSAPP, EDIT & DELETE */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        
                        {/* Customer Orders History Button */}
                        <button
                          onClick={() => handleOpenOrdersModal(cust)}
                          className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-black uppercase rounded flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
                          title={`View order history for ${cust.name}`}
                        >
                          <ShoppingBag size={11} className="text-blue-200" />
                          <span>ORDERS ({getCustomerOrders(cust).length || cust.totalOrders || 0})</span>
                        </button>

                        {/* WhatsApp Direct Concierge Button */}
                        <button
                          onClick={() => handleOpenWhatsAppModal(cust)}
                          className="px-2 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] font-black uppercase rounded flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
                          title={`Message ${cust.name} on WhatsApp`}
                        >
                          <WhatsAppIcon className="w-3 h-3" />
                          <span>WHATSAPP</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(cust)}
                          className="px-2 py-1 bg-zinc-900 hover:bg-black text-white text-[10px] font-bold uppercase rounded flex items-center gap-0.5 transition-colors shadow-2xs cursor-pointer shrink-0"
                          title="Edit Customer Profile"
                        >
                          <Edit2 size={11} />
                          <span>EDIT</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase rounded flex items-center gap-0.5 transition-colors shadow-2xs cursor-pointer shrink-0"
                          title="Delete Customer Profile"
                        >
                          <Trash2 size={11} />
                          <span>DELETE</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. WHATSAPP CRM CONCIERGE MODAL */}
      {isWhatsAppModalOpen && whatsAppCustomer && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsWhatsAppModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border-2 border-zinc-950 p-6 sm:p-8 max-w-xl w-full space-y-6 relative shadow-2xl animate-fadeIn">
            
            <button 
              onClick={() => setIsWhatsAppModalOpen(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="border-b border-zinc-200 pb-4 flex items-center gap-3">
              <div className="p-2.5 bg-[#25D366] text-white rounded-full">
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-black tracking-[0.15em] text-zinc-950 uppercase">
                  WHATSAPP VIP CONCIERGE
                </h2>
                <p className="text-xs font-bold text-zinc-600 uppercase">
                  Direct message to: <span className="text-zinc-950 font-black">{whatsAppCustomer.name}</span> ({whatsAppCustomer.phone || 'No phone'})
                </p>
              </div>
            </div>

            {/* Customer VIP Tier & CRM Level Banner */}
            {(() => {
              const tier = getCustomerTier(whatsAppCustomer.totalSpentUSD, whatsAppCustomer.totalOrders);
              return (
                <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{tier.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-zinc-950 uppercase">{tier.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${tier.badgeClass}`}>
                          {tier.arabicLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">Customer CRM Loyalty Classification</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-zinc-700 block">{whatsAppCustomer.totalOrders || 0} Orders</span>
                    <span className="font-mono font-black text-emerald-600 block">${whatsAppCustomer.totalSpentUSD || 0} Spent</span>
                  </div>
                </div>
              );
            })()}

            {/* Template Selector Pills */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                Select Quick Template (Tier-Matched):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('vip_platinum_perks')}
                  className={`p-3 text-left font-bold border rounded-lg transition-all ${
                    selectedTemplateKey === 'vip_platinum_perks'
                      ? 'border-[#25D366] bg-amber-50 text-amber-950 ring-2 ring-[#25D366]'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <span className="block text-amber-600 font-black uppercase text-[10px]">👑 VIP Platinum (AR)</span>
                  <span className="text-xs truncate block">رسالة النخبة البلاتينية</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('vip_gold_perks')}
                  className={`p-3 text-left font-bold border rounded-lg transition-all ${
                    selectedTemplateKey === 'vip_gold_perks'
                      ? 'border-[#25D366] bg-amber-50 text-amber-950 ring-2 ring-[#25D366]'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <span className="block text-amber-600 font-black uppercase text-[10px]">⭐ VIP Gold (AR)</span>
                  <span className="text-xs truncate block">رسالة العميل الذهبي</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('vip_silver_perks')}
                  className={`p-3 text-left font-bold border rounded-lg transition-all ${
                    selectedTemplateKey === 'vip_silver_perks'
                      ? 'border-[#25D366] bg-slate-50 text-slate-950 ring-2 ring-[#25D366]'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <span className="block text-slate-700 font-black uppercase text-[10px]">💎 VIP Silver (AR)</span>
                  <span className="text-xs truncate block">رسالة العميل الفضي</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('vip_welcome_ar')}
                  className={`p-3 text-left font-bold border rounded-lg transition-all ${
                    selectedTemplateKey === 'vip_welcome_ar'
                      ? 'border-[#25D366] bg-emerald-50 text-emerald-950 ring-2 ring-[#25D366]'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <span className="block text-emerald-700 font-black uppercase text-[10px]">✨ Welcome (AR)</span>
                  <span className="text-xs truncate block">ترحيب بالعميل الجديد</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('order_followup_ar')}
                  className={`p-3 text-left font-bold border rounded-lg transition-all ${
                    selectedTemplateKey === 'order_followup_ar'
                      ? 'border-[#25D366] bg-blue-50 text-blue-950 ring-2 ring-[#25D366]'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <span className="block text-blue-700 font-black uppercase text-[10px]">📦 Order Status (AR)</span>
                  <span className="text-xs truncate block">متابعة وتأكيد الطلب</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('new_arrivals_ar')}
                  className={`p-3 text-left font-bold border rounded-lg transition-all ${
                    selectedTemplateKey === 'new_arrivals_ar'
                      ? 'border-[#25D366] bg-purple-50 text-purple-950 ring-2 ring-[#25D366]'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <span className="block text-purple-700 font-black uppercase text-[10px]">👔 New Drop (AR)</span>
                  <span className="text-xs truncate block">تشكيلة جديدة حصرية</span>
                </button>

              </div>
            </div>

            {/* Editable Message Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                Message Preview (Editable):
              </label>
              <textarea
                rows={5}
                value={customMessage}
                onChange={(e) => {
                  setSelectedTemplateKey('custom');
                  setCustomMessage(e.target.value);
                }}
                className="w-full p-4 border-2 border-zinc-300 rounded-lg text-sm text-zinc-950 font-medium leading-relaxed focus:outline-none focus:border-[#25D366] bg-zinc-50/50"
                placeholder="Type your WhatsApp message..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-6 py-3.5 border-2 border-zinc-300 text-zinc-700 hover:text-zinc-950 text-xs font-black tracking-widest uppercase rounded cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black tracking-[0.2em] uppercase rounded flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>START CHAT ON WHATSAPP</span>
                <ExternalLink size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. EDIT / CREATE CUSTOMER PROFILE MODAL */}
      {isModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-6 sm:p-10 max-w-xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-xl">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer">
              <X size={20} />
            </button>

            <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-[0.2em] text-zinc-950 uppercase text-center border-b border-zinc-200 pb-4">
              {editingCustomer ? 'EDIT CLIENT PROFILE' : 'REGISTER NEW VIP CLIENT'}
            </h2>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-950 uppercase block">Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                  placeholder="e.g. Tarek Al-Hajj"
                  className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-zinc-950 uppercase block">Phone Number *</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                    placeholder="e.g. +961 70 123 456"
                    className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-zinc-950 uppercase block">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="e.g. tarek@example.com"
                    className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-zinc-950 uppercase block">VIP Loyalty Tier</label>
                  <select 
                    value={formData.tier || 'auto'}
                    onChange={e => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full p-3.5 border-2 border-zinc-300 rounded text-xs font-black uppercase text-zinc-950 bg-white focus:outline-none focus:border-zinc-950"
                  >
                    <option value="auto">✨ AUTOMATIC (BASED ON SPEND & ORDERS)</option>
                    <option value="platinum">👑 VIP PLATINUM (MANUAL OVERRIDE)</option>
                    <option value="gold">⭐ VIP GOLD (MANUAL OVERRIDE)</option>
                    <option value="silver">💎 VIP SILVER (MANUAL OVERRIDE)</option>
                    <option value="bronze">NEW CLIENT (STANDARD)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-zinc-950 uppercase block">Initial Lifetime Spend ($)</label>
                  <input 
                    type="number" 
                    value={formData.totalSpentUSD} 
                    onChange={e => setFormData({ ...formData, totalSpentUSD: Number(e.target.value) })} 
                    min="0"
                    className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-emerald-600 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-950 uppercase block">Shipping Address / Location</label>
                <textarea 
                  rows={2} 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                  placeholder="e.g. Beirut, Verdun, Luxury Center"
                  className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 resize-none focus:outline-none focus:border-zinc-950 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-950 uppercase block">CRM Notes & Style Preferences</label>
                <input 
                  type="text" 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                  placeholder="e.g. Prefers shoe size 42, loves Berluti leather and Zegna overcoats" 
                  className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-zinc-950 hover:bg-black text-white text-xs font-black tracking-[0.25em] uppercase transition-colors shadow-lg mt-4 cursor-pointer"
              >
                {editingCustomer ? 'SAVE CLIENT PROFILE' : 'CONFIRM & REGISTER CLIENT'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* 6. CUSTOMER ORDER ARCHIVES MODAL */}
      {isOrdersModalOpen && ordersCustomer && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsOrdersModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-6 sm:p-8 max-w-3xl w-full space-y-6 relative shadow-2xl animate-fadeIn rounded-xl max-h-[90vh] flex flex-col">
            
            <button 
              onClick={() => setIsOrdersModalOpen(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Modal Header with Customer Summary */}
            <div className="border-b border-zinc-200 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShoppingBag size={22} className="text-zinc-950" />
                <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                  ORDER ARCHIVES & HISTORY
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-sm">
                    {ordersCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-zinc-950 uppercase block">
                      {ordersCustomer.name}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono block">
                      {ordersCustomer.phone || ordersCustomer.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(() => {
                    const tier = getCustomerTier(ordersCustomer.totalSpentUSD, ordersCustomer.totalOrders);
                    return (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${tier.badgeClass}`}>
                        <span>{tier.icon}</span>
                        <span>{tier.label}</span>
                      </span>
                    );
                  })()}
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">
                      {formatCurrency(ordersCustomer.totalSpentUSD, currency, settings.lbpRate, settings.eurRate)}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">
                      {customerOrdersList.length} Total Orders
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List Container */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {customerOrdersList.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Package size={40} className="text-zinc-300 mx-auto" />
                  <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
                    NO ORDER ARCHIVES FOUND FOR THIS CLIENT YET.
                  </p>
                  <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                    Orders placed online through the storefront with this customer's phone or email will automatically appear here.
                  </p>
                </div>
              ) : (
                customerOrdersList.map(order => (
                  <div 
                    key={order.id} 
                    className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-white hover:border-zinc-950 transition-colors shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-zinc-950">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-500 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
                          {order.paymentMethod?.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-xs py-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-100 rounded border border-zinc-200 overflow-hidden shrink-0">
                              <img src={item.imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 block truncate max-w-xs">{item.productTitle}</span>
                              <span className="text-[11px] text-zinc-500">Size: <strong>{item.size}</strong> | Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-zinc-950">
                            {formatCurrency(item.priceUSD * item.quantity, currency, settings.lbpRate, settings.eurRate)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                      <span className="font-bold text-zinc-500 uppercase">Order Total:</span>
                      <span className="font-black text-sm text-zinc-950 font-mono">
                        {formatCurrency(order.totalUSD, currency, settings.lbpRate, settings.eurRate)}
                      </span>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOrdersModalOpen(false)}
                className="px-6 py-3 bg-zinc-950 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded cursor-pointer"
              >
                CLOSE ARCHIVES
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. BULK WHATSAPP BROADCAST MODAL */}
      {isBulkModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsBulkModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-6 sm:p-8 max-w-2xl w-full space-y-5 relative shadow-2xl animate-fadeIn rounded-xl max-h-[90vh] flex flex-col">
            
            <button 
              onClick={() => setIsBulkModalOpen(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="border-b border-zinc-200 pb-3 flex items-center gap-2.5">
              <div className="p-2 bg-[#25D366]/20 text-[#25D366] rounded-lg">
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                  VIP WHATSAPP BROADCAST
                </h2>
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">
                  إرسال رسائل جماعية للعملاء مع صور وروابط التشكيلة الجديدة
                </span>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              
              {/* Guidance Info Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs leading-relaxed text-emerald-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <span>📸</span>
                  <span>كيف ترسل الصور مع الرسالة الجماعية؟</span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  <strong>الخيار 1 (الأسرع للصور الجماعية):</strong> اضغط على <strong>&ldquo;نسخ جميع الأرقام&rdquo;</strong> أدناه، وافتح تطبيق واتساب على هاتفك ➔ أنشئ <strong>قائمة رسائل جماعية (Broadcast List)</strong> والصق الأرقام، وأرفق صور البضائع الجديدة بضغطة واحدة لتصل لكل زبون في محادثته الخاصة!
                </p>
                <p className="text-[11px] text-emerald-800">
                  <strong>الخيار 2 (إرسال مخصص مباشر):</strong> اضغط على زر <strong>&ldquo;إرسال إلى العميل&rdquo;</strong> بجانب كل اسم أدناه، وسيفتح واتساب فوراً بالرسالة باسم العميل لتُرفق معه الصور مباشرة!
                </p>
              </div>

              {/* Target Tier Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                  Target Customer Tier (الفئة المستهدفة):
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkTierFilter('all')}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-all cursor-pointer ${
                      bulkTierFilter === 'all'
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    ALL CLIENTS ({customers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkTierFilter('platinum')}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-all cursor-pointer ${
                      bulkTierFilter === 'platinum'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    👑 VIP PLATINUM
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkTierFilter('gold')}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-all cursor-pointer ${
                      bulkTierFilter === 'gold'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    ⭐ VIP GOLD
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkTierFilter('silver')}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-all cursor-pointer ${
                      bulkTierFilter === 'silver'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    💎 VIP SILVER
                  </button>
                </div>
              </div>

              {/* Broadcast Message Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                  Broadcast Message Text (نص الرسالة):
                </label>
                <textarea
                  rows={4}
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  className="w-full p-3.5 border-2 border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium leading-relaxed focus:outline-none focus:border-[#25D366] bg-zinc-50/50"
                  placeholder="Type broadcast message..."
                />
              </div>

              {/* Action Buttons: Copy Numbers */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyBulkNumbers}
                  className="w-full sm:w-auto px-5 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-black tracking-wider uppercase rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {copiedNumbers ? <CheckCheck size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copiedNumbers ? 'COPIED TO CLIPBOARD (تم النسخ)!' : 'COPY ALL NUMBERS (نسخ أرقام الهواتف)'}</span>
                </button>
                <span className="text-[11px] font-bold text-zinc-500 font-mono">
                  {getBulkTargetCustomers().length} Customer(s) in this segment
                </span>
              </div>

              {/* Customer Direct Send List */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                  1-Click Direct WhatsApp Messaging:
                </label>
                <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 max-h-56 overflow-y-auto bg-zinc-50/50">
                  {getBulkTargetCustomers().length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-zinc-400 uppercase">
                      No customers found in this tier.
                    </div>
                  ) : (
                    getBulkTargetCustomers().map(c => {
                      const tier = getCustomerTier(c.totalSpentUSD, c.totalOrders);
                      return (
                        <div key={c.id} className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm">{tier.icon}</span>
                            <div>
                              <span className="text-xs font-bold text-zinc-950 uppercase block">{c.name}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{c.phone || 'No phone'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendSingleBulk(c)}
                            className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] font-black uppercase rounded flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>SEND TO {c.name.split(' ')[0]} ➔</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-6 py-2.5 border-2 border-zinc-300 text-zinc-700 hover:text-zinc-950 text-xs font-black tracking-widest uppercase rounded cursor-pointer"
              >
                CLOSE
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
