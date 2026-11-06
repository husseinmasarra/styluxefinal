'use client';

import React, { useState, useEffect } from 'react';
import { DataService, formatCurrency, getCustomerTier, formatLebanonPhone } from '@/lib/store';
import { INITIAL_CUSTOMERS } from '@/lib/seed';
import { Customer, CustomerDepartment, CustomerTier, Order } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { 
  Search, Mail, Phone, MapPin, Calendar, DollarSign, Trash2, Edit2, X, 
  User, Download, Send, MessageSquare, Share2, Sparkles, ExternalLink, Check, ShieldCheck, Award,
  Plus, ShoppingBag, Eye, Package, Copy, CheckCheck, Users, Upload, Instagram, FileText, CheckCircle2, AlertCircle, CheckSquare, Square
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
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  // Guarantee 961 for any Lebanese phone entered without country code
  if (cleaned.startsWith('961')) {
    return cleaned;
  }
  if (cleaned.startsWith('0') && (cleaned.length === 8 || cleaned.length === 7)) {
    return '961' + cleaned.substring(1);
  }
  if (cleaned.length === 7 && cleaned.startsWith('3')) {
    return '961' + cleaned;
  }
  if (cleaned.length === 8) {
    return '961' + cleaned;
  }
  if (cleaned.length > 0 && !cleaned.startsWith('961') && cleaned.length <= 8) {
    return '961' + cleaned;
  }
  return cleaned;
}

export interface ParsedLead {
  id: string;
  raw: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  isDuplicate: boolean;
  duplicateName?: string;
  isValid: boolean;
}

export function parsePhoneNumbersFromText(
  text: string, 
  source: 'instagram' | 'whatsapp' | 'file',
  existingCustomers: Customer[]
): ParsedLead[] {
  if (!text || !text.trim()) return [];

  // Lookup of existing normalized numbers
  const existingMap = new Map<string, string>();
  existingCustomers.forEach(c => {
    const norm = normalizePhoneForWhatsApp(c.phone || '');
    if (norm) existingMap.set(norm, c.name);
  });

  const leads: ParsedLead[] = [];
  const seenInBatch = new Set<string>();

  // Check if vCard format (.vcf)
  if (text.includes('BEGIN:VCARD')) {
    const vcardBlocks = text.split('BEGIN:VCARD');
    for (const block of vcardBlocks) {
      if (!block.trim()) continue;
      const fnMatch = block.match(/FN(?:;[^:]*)?:(.*)/i);
      const telMatch = block.match(/TEL(?:;[^:]*)?:(.*)/i);
      if (telMatch && telMatch[1]) {
        const rawPhone = telMatch[1].trim();
        const norm = normalizePhoneForWhatsApp(rawPhone);
        if (norm && !seenInBatch.has(norm)) {
          seenInBatch.add(norm);
          const rawName = fnMatch && fnMatch[1] ? fnMatch[1].trim() : `Contact ${norm.slice(-4)}`;
          const isDuplicate = existingMap.has(norm);
          leads.push({
            id: `lead-${Date.now()}-${leads.length}`,
            raw: `VCARD: ${rawName} - ${rawPhone}`,
            name: rawName || `Contact ${norm.slice(-4)}`,
            phone: rawPhone,
            normalizedPhone: norm,
            isDuplicate,
            duplicateName: isDuplicate ? existingMap.get(norm) : undefined,
            isValid: true,
          });
        }
      }
    }
    if (leads.length > 0) return leads;
  }

  // General line-by-line parsing
  const lines = text.split(/[\r\n]+/);
  const phonePattern = /(?:\+?00?\d{1,4}[-.\s/]*)?(?:\(?\d{1,4}\)?[-.\s/]*)?\d{2,4}[-.\s/]*\d{3,4}[-.\s/]*\d{2,4}|\b\d{7,14}\b/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const matches = line.match(phonePattern);
    if (!matches) continue;

    for (const match of matches) {
      const digitsOnly = match.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) continue;

      const norm = normalizePhoneForWhatsApp(match);
      if (!norm || seenInBatch.has(norm)) continue;
      seenInBatch.add(norm);

      // Clean name from the line
      let candidateName = line
        .replace(match, '')
        .replace(/\[?\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\]?/gi, '')
        .replace(/[,\-:|–—•~_=+*#]/g, ' ')
        .trim();

      // Remove email if present in candidate name
      candidateName = candidateName.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '').trim();
      candidateName = candidateName.replace(/\s+/g, ' ');

      let finalName = candidateName;
      if (!finalName || finalName.length < 2 || /^[\d\s]+$/.test(finalName)) {
        const sourceLabel = source === 'instagram' ? 'Instagram Lead' : source === 'whatsapp' ? 'WhatsApp Contact' : 'Imported Client';
        finalName = `${sourceLabel} ${norm.slice(-4)}`;
      }

      const isDuplicate = existingMap.has(norm);
      leads.push({
        id: `lead-${Date.now()}-${leads.length}`,
        raw: line,
        name: finalName,
        phone: match.trim(),
        normalizedPhone: norm,
        isDuplicate,
        duplicateName: isDuplicate ? existingMap.get(norm) : undefined,
        isValid: true,
      });
    }
  }

  return leads;
}

export function CustomersManager() {
  const { currency, settings, showToast } = useCart();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | 'platinum' | 'gold' | 'silver' | 'bronze'>('all');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<'all' | 'women' | 'men' | 'both'>('all');
  
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
  // Selected customers state for multi-select actions & WhatsApp sending
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [bulkTargetMode, setBulkTargetMode] = useState<'selected' | 'filter'>('filter');
  const [sentCustomerIds, setSentCustomerIds] = useState<Set<string>>(new Set());

  // Bulk WhatsApp Broadcast modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTierFilter, setBulkTierFilter] = useState<'all' | 'platinum' | 'gold' | 'silver'>('all');
  const [bulkDepartmentFilter, setBulkDepartmentFilter] = useState<'all' | 'women' | 'men'>('all');
  const [bulkMessage, setBulkMessage] = useState<string>(
    'Hello {name}, we are delighted to inform you that STYLUXE has just released an exclusive new luxury arrivals drop (Dior, Zegna, Loro Piana). Discover the curated collection with complimentary express delivery across Lebanon:\nhttps://www.styluxelb.com'
  );
  const [copiedNumbers, setCopiedNumbers] = useState(false);

  // Import Leads (Instagram & WhatsApp) modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSource, setImportSource] = useState<'instagram' | 'whatsapp' | 'file'>('instagram');
  const [importDepartment, setImportDepartment] = useState<CustomerDepartment>('both');
  const [importRawText, setImportRawText] = useState<string>('');
  const [importDefaultTier, setImportDefaultTier] = useState<CustomerTier>('bronze');
  const [importParsedList, setImportParsedList] = useState<ParsedLead[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Beirut',
    notes: '',
    tier: 'auto',
    department: 'both' as CustomerDepartment,
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
        if (isImportModalOpen) setIsImportModalOpen(false);
        if (isBulkModalOpen) setIsBulkModalOpen(false);
        if (isWhatsAppModalOpen) setIsWhatsAppModalOpen(false);
        if (isOrdersModalOpen) setIsOrdersModalOpen(false);
        if (isModalOpen) setIsModalOpen(false);
      }
    };
    if (isModalOpen || isWhatsAppModalOpen || isOrdersModalOpen || isBulkModalOpen || isImportModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isWhatsAppModalOpen, isOrdersModalOpen, isBulkModalOpen, isImportModalOpen]);

  // Real-time parser for import leads
  useEffect(() => {
    if (!importRawText.trim()) {
      setImportParsedList([]);
      return;
    }
    const parsed = parsePhoneNumbersFromText(importRawText, importSource, customers);
    setImportParsedList(parsed);
  }, [importRawText, importSource, customers]);

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
  const handleExportMetaAudienceCSV = (targetDept: 'all' | 'women' | 'men' = 'all') => {
    let list = customers;
    if (targetDept !== 'all') {
      list = customers.filter(c => {
        const dept = getCustomerEffectiveDepartment(c);
        return dept === targetDept;
      });
    }
    if (list.length === 0) {
      showToast(`No customers available to export for ${targetDept.toUpperCase()} Meta Audience`, 'error');
      return;
    }
    // Meta Ads Manager Customer List format
    const headers = ['email', 'phone', 'fn', 'ln', 'ct', 'country', 'value'];
    const rows = list.map(c => {
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
    link.setAttribute('download', `styluxe_meta_ads_${targetDept}_audience_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Meta Custom Audience (${targetDept.toUpperCase()}) CSV exported successfully!`, 'success');
  };

  const loadCustomers = () => {
    let current = DataService.getCustomers();
    const hasWomen = current.some(c => c.department === 'women');
    const hasMen = current.some(c => c.department === 'men');

    // Auto-seed demo clients if current list is missing women or men or has less than 5 clients
    if (!hasWomen || !hasMen || current.length < 5) {
      const existingIds = new Set(current.map(c => c.id));
      const existingPhones = new Set(current.map(c => (c.phone || '').replace(/[^0-9]/g, '')));
      const toMerge: Customer[] = [];
      INITIAL_CUSTOMERS.forEach(seedCust => {
        const cleanP = (seedCust.phone || '').replace(/[^0-9]/g, '');
        if (!existingIds.has(seedCust.id) && !existingPhones.has(cleanP)) {
          toMerge.push(seedCust);
        }
      });

      const updatedExisting = current.map(c => {
        if (!c.department) {
          const lowerName = (c.name || '').toLowerCase();
          const isWomen = ['maya', 'nour', 'zeina', 'celine', 'yasmina', 'sarah', 'layla', 'chloe', 'lea', 'lara'].some(n => lowerName.includes(n));
          return { ...c, department: isWomen ? ('women' as CustomerDepartment) : ('men' as CustomerDepartment) };
        }
        return c;
      });

      const merged = [...updatedExisting, ...toMerge];
      DataService.setAllCustomers(merged);
      current = merged;
    }

    setCustomers(current);
    setAllOrders(DataService.getOrders());
  };

  const handleResetDemoCustomers = () => {
    DataService.setAllCustomers(INITIAL_CUSTOMERS);
    setCustomers(INITIAL_CUSTOMERS);
    showToast('Loaded 12 luxury demo clients (5 Women, 5 Men, 2 Both) successfully!', 'success');
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

  const getCustomerEffectiveDepartment = (cust: Customer): CustomerDepartment => {
    if (cust.department) return cust.department;
    const lowerName = (cust.name || '').toLowerCase();
    const isWomen = ['maya', 'nour', 'zeina', 'celine', 'yasmina', 'sarah', 'layla', 'chloe', 'lea', 'lara'].some(n => lowerName.includes(n));
    if (isWomen) return 'women';
    const isMen = ['hussein', 'sami', 'tarek', 'karim', 'jad', 'ahmad', 'omar', 'walid', 'rami'].some(n => lowerName.includes(n));
    if (isMen) return 'men';

    const orders = getCustomerOrders(cust);
    if (orders.length === 0) return 'men';
    let hasMen = false;
    let hasWomen = false;
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const title = (item.productTitle || '').toLowerCase();
        if (title.includes('women') || title.includes('bag') || title.includes('dress') || title.includes('skirt') || title.includes('heel') || title.includes('pumps') || title.includes('blouse') || title.includes('tote')) {
          hasWomen = true;
        } else {
          hasMen = true;
        }
      });
    });
    if (hasMen && hasWomen) return 'both';
    if (hasWomen) return 'women';
    if (hasMen) return 'men';
    return 'men';
  };

  const handleUpdateCustomerDepartment = (cust: Customer, newDept: CustomerDepartment) => {
    const updatedCust = { ...cust, department: newDept };
    const updatedList = DataService.saveCustomer(updatedCust);
    setCustomers(updatedList);
    showToast(`Updated ${cust.name} category to ${newDept.toUpperCase()}!`, 'success');
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
      department: 'both',
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
      department: cust.department || getCustomerEffectiveDepartment(cust) || 'both',
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
    const name = cust.name || 'Valued Client';
    switch (templateKey) {
      case 'vip_platinum_perks':
        return `Dear ${name} 👑, STYLUXE is honored to welcome you to our VIP Platinum tier.\n\nAs one of our most distinguished clientele, you enjoy complimentary white-glove express delivery and bespoke concierge styling across all premier luxury archives.\n\nDiscover your privileges: https://www.styluxelb.com`;
      case 'vip_gold_perks':
        return `Dear ${name} ⭐, thank you for your patronage at STYLUXE. We are pleased to designate you as a VIP Gold client with expedited fulfillment and dedicated order concierge support.\n\nExplore our latest drop: https://www.styluxelb.com`;
      case 'vip_silver_perks':
        return `Dear ${name} 💎, in appreciation of your loyalty as a VIP Silver member, we are pleased to share early access to our seasonal designer arrivals.\n\nExplore the collection: https://www.styluxelb.com`;
      case 'vip_welcome_ar':
        return `Dear ${name}, welcome to STYLUXE. Our concierge team is at your complete disposal for bespoke styling, sizing advice, and luxury acquisitions.\n\nVisit our store: https://www.styluxelb.com`;
      case 'vip_welcome_en':
        return `Dear ${name}, thank you for choosing STYLUXE. We are at your service for any exclusive inquiries or personal styling assistance across our luxury designer collections.\n\nExplore our archives: https://www.styluxelb.com`;
      case 'order_followup_ar':
        return `Dear ${name}, regarding your recent order with STYLUXE, our atelier team is preparing your parcel for prompt delivery. Please let us know if you have any scheduling requests or additional items to include.`;
      case 'order_followup_en':
        return `Dear ${name}, regarding your order with STYLUXE, our concierge team is currently preparing your parcel for express delivery. Please let us know if you require any specific scheduling or delivery details.`;
      case 'new_arrivals_ar':
        return `Dear ${name}, exclusive new seasonal arrivals from our premier houses (ZEGNA, BERLUTI, DIOR, LORO PIANA) have just dropped at STYLUXE.\n\nExplore the drop: https://www.styluxelb.com`;
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

  // Selection Handlers (Multi-Select & WhatsApp Messaging)
  const handleToggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredCustomers.map(c => c.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedCustomerIds.has(id));
    
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allFilteredIds.forEach(id => next.delete(id));
      } else {
        allFilteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const getSelectedCustomers = (): Customer[] => {
    return customers.filter(c => selectedCustomerIds.has(c.id));
  };

  const handleOpenBulkForSelected = () => {
    if (selectedCustomerIds.size === 0) {
      showToast('Please select at least one customer first.', 'error');
      return;
    }
    setBulkTargetMode('selected');
    setIsBulkModalOpen(true);
  };

  const handleCopySelectedNumbers = () => {
    const selected = getSelectedCustomers();
    const phones = selected.map(c => normalizePhoneForWhatsApp(c.phone)).filter(Boolean).join(', ');
    if (!phones) {
      showToast('No valid phone numbers found for selected customers.', 'error');
      return;
    }
    navigator.clipboard.writeText(phones);
    showToast(`Copied ${selected.length} customer phone numbers successfully!`, 'success');
  };

  const handleDownloadSelectedVCF = () => {
    const selected = getSelectedCustomers();
    if (selected.length === 0) {
      showToast('Please select customers first to download contacts.', 'error');
      return;
    }
    let vcfContent = '';
    selected.forEach(c => {
      const cleanPhone = normalizePhoneForWhatsApp(c.phone || '');
      if (cleanPhone) {
        const dept = getCustomerEffectiveDepartment(c);
        const prefix = dept === 'women' ? '[W] ' : dept === 'men' ? '[M] ' : '[VIP] ';
        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${prefix}${c.name}\nTEL;TYPE=CELL:+${cleanPhone}\nEND:VCARD\n`;
      }
    });
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `styluxe_selected_clients_${selected.length}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded VCF contacts file for ${selected.length} selected clients!`, 'success');
  };

  const handleExportSelectedCSV = () => {
    const selected = getSelectedCustomers();
    if (selected.length === 0) {
      showToast('Please select customers first to export CSV.', 'error');
      return;
    }
    const headers = ['Customer ID', 'Name', 'Department', 'Email', 'Phone', 'Address', 'Total Orders', 'Total Spent USD', 'Created Date'];
    const rows = selected.map(c => [
      `"${c.id}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${getCustomerEffectiveDepartment(c).toUpperCase()}"`,
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
    link.href = url;
    link.download = `styluxe_selected_clients_${selected.length}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported CSV file for ${selected.length} selected clients!`, 'success');
  };

  const getBulkTargetCustomers = (): Customer[] => {
    if (bulkTargetMode === 'selected') {
      return customers.filter(c => selectedCustomerIds.has(c.id));
    }
    return customers.filter(c => {
      if (bulkTierFilter !== 'all') {
        const tier = getCustomerTier(c.totalSpentUSD, c.totalOrders);
        if (tier.tier !== bulkTierFilter) return false;
      }
      if (bulkDepartmentFilter !== 'all') {
        const dept = getCustomerEffectiveDepartment(c);
        if (dept !== bulkDepartmentFilter) return false;
      }
      return true;
    });
  };

  const handleCopyBulkNumbers = () => {
    const list = getBulkTargetCustomers();
    const phones = list.map(c => normalizePhoneForWhatsApp(c.phone)).filter(Boolean).join(', ');
    if (!phones) {
      showToast('No valid phone numbers found for this filter.', 'error');
      return;
    }
    navigator.clipboard.writeText(phones);
    setCopiedNumbers(true);
    showToast(`Copied ${list.length} phone numbers! Paste into WhatsApp Broadcast List.`, 'success');
    setTimeout(() => setCopiedNumbers(false), 3000);
  };

  const handleDownloadVCF = () => {
    const list = getBulkTargetCustomers();
    if (list.length === 0) {
      showToast('No customers found in this filter.', 'error');
      return;
    }
    let vcfContent = '';
    list.forEach(c => {
      const cleanPhone = normalizePhoneForWhatsApp(c.phone || '');
      if (cleanPhone) {
        const dept = getCustomerEffectiveDepartment(c);
        const prefix = dept === 'women' ? '[W] ' : dept === 'men' ? '[M] ' : '[VIP] ';
        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${prefix}${c.name}\nTEL;TYPE=CELL:+${cleanPhone}\nEND:VCARD\n`;
      }
    });
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `styluxe_contacts_${bulkDepartmentFilter}_${bulkTierFilter}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded VCF contacts file for ${list.length} customers!`, 'success');
  };

  const handleSendSingleBulk = (cust: Customer) => {
    const cleanPhone = normalizePhoneForWhatsApp(cust.phone);
    if (!cleanPhone) {
      showToast(`${cust.name} does not have a valid phone number.`, 'error');
      return;
    }
    let personalized = bulkMessage;
    if (personalized.includes('{name}')) {
      personalized = personalized.replace(/{name}/g, cust.name);
    } else if (personalized.toLowerCase().includes('dear client')) {
      personalized = personalized.replace(/dear client/gi, `Dear ${cust.name}`);
    } else if (personalized.toLowerCase().startsWith('hello,')) {
      personalized = personalized.replace(/^hello,/i, `Hello ${cust.name},`);
    } else if (personalized.toLowerCase().startsWith('hello')) {
      personalized = personalized.replace(/^hello/i, `Hello ${cust.name}`);
    } else if (personalized.toLowerCase().startsWith('dear')) {
      personalized = personalized.replace(/^dear/i, `Dear ${cust.name}`);
    } else if (personalized.toLowerCase().includes('dear')) {
      personalized = personalized.replace(/dear/i, `Dear ${cust.name}`);
    } else {
      personalized = `Hello ${cust.name},\n\n` + personalized;
    }

    const encoded = encodeURIComponent(personalized.trim());
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    setSentCustomerIds(prev => new Set(prev).add(cust.id));
    window.open(waUrl, '_blank');
  };

  // Import Leads Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportRawText(content);
        showToast(`Uploaded ${file.name} successfully!`, 'info');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUpdateParsedName = (id: string, newName: string) => {
    setImportParsedList(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleRemoveParsedLead = (id: string) => {
    setImportParsedList(prev => prev.filter(p => p.id !== id));
  };

  const handlePasteSampleData = () => {
    let sample = '';
    if (importSource === 'instagram') {
      sample = `Ahmad Al-Hajj: 03 123456\nNour Mansour - 71 556677\n76 889900 (asked about Dior sneakers)\nZeina K.: 03 998877\n+961 70 445566`;
    } else if (importSource === 'whatsapp') {
      sample = `[12/10/24, 14:22] +961 70 123 456: Hello I would like to order\n[12/10/24, 15:40] Karim: 03 445566\n+961 71 998877: Inquired about Dior sneakers\n03 223344`;
    } else {
      sample = `Full Name, Phone Number, City\nOmar Haddad, 03 112233, Beirut\nLara Khoury, +961 70 334455, Jounieh\nSami Azar, 71 889900, Tripoli`;
    }
    setImportRawText(sample);
  };

  const handleConfirmImport = () => {
    const validToImport = importParsedList.filter(l => l.isValid && (!skipDuplicates || !l.isDuplicate));
    if (validToImport.length === 0) {
      showToast('No eligible leads to import. Please check your numbers.', 'error');
      return;
    }

    const newCustomers: Customer[] = validToImport.map((lead, idx) => {
      const cleanDigits = lead.normalizedPhone.replace(/[^0-9]/g, '');
      return {
        id: `cust-lead-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: lead.name.trim(),
        email: `${cleanDigits}@styluxelead.com`,
        phone: formatLebanonPhone(lead.normalizedPhone || lead.phone),
        address: 'Lebanon',
        city: 'Beirut',
        notes: `Imported via ${importSource.toUpperCase()} Lead Import (${importDepartment.toUpperCase()}) on ${new Date().toLocaleDateString()}`,
        tier: importDefaultTier,
        department: importDepartment,
        totalSpentUSD: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
      };
    });

    const updated = DataService.saveBulkCustomers(newCustomers);
    setCustomers(updated);
    setIsImportModalOpen(false);
    setImportRawText('');
    setImportParsedList([]);
    showToast(`Successfully imported ${newCustomers.length} leads into your CRM database!`, 'success');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const resolvedTier: CustomerTier | undefined = 
      formData.tier === 'auto' ? undefined : (formData.tier as CustomerTier);

    let updatedCust: Customer;
    const finalPhone = formatLebanonPhone(formData.phone.trim());
    if (editingCustomer) {
      updatedCust = {
        ...editingCustomer,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: finalPhone,
        address: formData.address.trim(),
        city: formData.city.trim() || 'Beirut',
        notes: formData.notes.trim(),
        tier: resolvedTier,
        department: formData.department,
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
        department: formData.department,
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

  // Department Counts Calculation
  const womenCount = customers.filter(c => getCustomerEffectiveDepartment(c) === 'women').length;
  const menCount = customers.filter(c => getCustomerEffectiveDepartment(c) === 'men').length;
  const bothCount = customers.filter(c => getCustomerEffectiveDepartment(c) === 'both').length;

  const filteredCustomers = customers.filter(c => {
    // 1. Department filter
    if (selectedDepartmentFilter !== 'all') {
      const custDept = getCustomerEffectiveDepartment(c);
      if (custDept !== selectedDepartmentFilter) return false;
    }
    // 2. VIP Tier filter
    if (selectedTierFilter !== 'all') {
      const custTier = getCustomerTier(c.totalSpentUSD, c.totalOrders).tier;
      if (custTier !== selectedTierFilter) return false;
    }
    // 3. Search query filter
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
          
          {/* Meta Audience Export with Department Choice */}
          <div className="flex items-center bg-blue-700 hover:bg-blue-800 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm transition-all shrink-0">
            <button
              onClick={() => handleExportMetaAudienceCSV('all')}
              className="px-3.5 py-3 flex items-center gap-2 hover:bg-blue-800 cursor-pointer rounded-l"
              title="Export all customers formatted for Meta Ads"
            >
              <MetaIcon className="w-4 h-4 text-white" />
              <span>META ADS (ALL)</span>
            </button>
            <span className="w-px h-6 bg-blue-500/50"></span>
            <button
              onClick={() => handleExportMetaAudienceCSV('women')}
              className="px-2.5 py-3 hover:bg-pink-700 flex items-center gap-1 text-[11px] cursor-pointer"
              title="Export Women Audience CSV for Instagram/Facebook ads"
            >
              <span>👠 WOMEN</span>
            </button>
            <span className="w-px h-6 bg-blue-500/50"></span>
            <button
              onClick={() => handleExportMetaAudienceCSV('men')}
              className="px-2.5 py-3 hover:bg-indigo-900 flex items-center gap-1 text-[11px] cursor-pointer rounded-r"
              title="Export Men Audience CSV for Instagram/Facebook ads"
            >
              <span>👔 MEN</span>
            </button>
          </div>

          {/* Standard CSV Export */}
          <button
            onClick={handleExportCustomersCSV}
            className="px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="Download full customer database spreadsheet"
          >
            <Download size={16} />
            <span>EXPORT CLIENTS (CSV)</span>
          </button>

          {/* Import Leads (Instagram & WhatsApp) */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-3 bg-gradient-to-r from-purple-800 via-pink-700 to-rose-700 hover:from-purple-900 hover:to-rose-800 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="Import phone numbers directly from Instagram DMs, WhatsApp chats, or uploaded files"
          >
            <div className="flex items-center -space-x-0.5">
              <Instagram className="w-4 h-4 text-pink-200" />
              <WhatsAppIcon className="w-4 h-4 text-emerald-300 ml-1" />
            </div>
            <span>IMPORT LEADS</span>
          </button>

          {/* Bulk Broadcast New Arrivals Button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="Send bulk WhatsApp message to customers about new arrivals"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>BROADCAST NEW ARRIVALS</span>
          </button>

          {/* Reset / Add Demo VIP Clients Button */}
          <button
            onClick={handleResetDemoCustomers}
            className="px-4 py-3 bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 hover:opacity-90 text-white text-xs font-black tracking-wider uppercase rounded shadow-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            title="Generate 12 realistic luxury demo clients for Women, Men & Both"
          >
            <Sparkles size={16} className="text-yellow-200" />
            <span>+ DEMO VIP CLIENTS</span>
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

      {/* 2.1 DEPARTMENT SEGMENTATION BAR (MEN & WOMEN SEPARATION) */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-black p-3.5 rounded-xl border border-zinc-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-black tracking-widest text-white uppercase">
            DEPARTMENT CRM SEGREGATION (MEN & WOMEN):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ALL DEPARTMENTS */}
          <button
            onClick={() => setSelectedDepartmentFilter('all')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedDepartmentFilter === 'all'
                ? 'bg-white text-zinc-950 shadow-md font-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            <span>🌐 ALL ({customers.length})</span>
          </button>

          {/* WOMEN VIP */}
          <button
            onClick={() => setSelectedDepartmentFilter('women')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-2 border ${
              selectedDepartmentFilter === 'women'
                ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white border-pink-400 shadow-lg ring-2 ring-pink-400/30'
                : 'bg-pink-950/60 text-pink-200 border-pink-800/60 hover:bg-pink-900/80 hover:text-white'
            }`}
          >
            <span>👠 WOMEN VIP ({womenCount})</span>
            <span className="text-[10px] font-mono opacity-80 bg-pink-900/60 px-1.5 py-0.5 rounded">WOMEN</span>
          </button>

          {/* MEN VIP */}
          <button
            onClick={() => setSelectedDepartmentFilter('men')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-2 border ${
              selectedDepartmentFilter === 'men'
                ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-blue-400 shadow-lg ring-2 ring-indigo-400/30'
                : 'bg-indigo-950/60 text-indigo-200 border-indigo-800/60 hover:bg-indigo-900/80 hover:text-white'
            }`}
          >
            <span>👔 MEN VIP ({menCount})</span>
            <span className="text-[10px] font-mono opacity-80 bg-indigo-900/60 px-1.5 py-0.5 rounded">MEN</span>
          </button>

          {/* BOTH / DUAL */}
          <button
            onClick={() => setSelectedDepartmentFilter('both')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-2 border ${
              selectedDepartmentFilter === 'both'
                ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white border-purple-400 shadow-lg'
                : 'bg-purple-950/60 text-purple-200 border-purple-800/60 hover:bg-purple-900/80 hover:text-white'
            }`}
          >
            <span>✨ DUAL / BOTH ({bothCount})</span>
            <span className="text-[10px] font-mono opacity-80 bg-purple-900/60 px-1.5 py-0.5 rounded">DUAL / BOTH</span>
          </button>
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

      {/* SELECTION ACTIONS TOOLBAR */}
      {selectedCustomerIds.size > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-zinc-950 to-emerald-950 text-white p-4 sm:p-5 rounded-xl border-2 border-emerald-500/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <CheckSquare size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black tracking-wider uppercase text-emerald-300">
                  {selectedCustomerIds.size} {selectedCustomerIds.size === 1 ? 'CLIENT SELECTED' : 'CLIENTS SELECTED'}
                </span>
                <span className="text-xs text-white font-bold bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-700">
                  {selectedCustomerIds.size} Selected
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 pt-0.5">
                Send targeted WhatsApp broadcasts, copy numbers, or download contacts for selected clients.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* WhatsApp to Selected */}
            <button
              type="button"
              onClick={handleOpenBulkForSelected}
              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black tracking-wider uppercase rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              title="Open WhatsApp sender for selected clients"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>MESSAGE SELECTED ON WHATSAPP ({selectedCustomerIds.size})</span>
            </button>

            {/* Copy Numbers */}
            <button
              type="button"
              onClick={handleCopySelectedNumbers}
              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black tracking-wider uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy phone numbers of selected clients"
            >
              <Copy size={14} />
              <span>COPY NUMBERS</span>
            </button>

            {/* Download Selected VCF */}
            <button
              type="button"
              onClick={handleDownloadSelectedVCF}
              className="px-3.5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black tracking-wider uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download VCF for selected clients"
            >
              <Download size={14} />
              <span>DOWNLOAD VCF</span>
            </button>

            {/* Export Selected CSV */}
            <button
              type="button"
              onClick={handleExportSelectedCSV}
              className="px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black tracking-wider uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export selected clients to CSV"
            >
              <FileText size={14} />
              <span>EXPORT CSV</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedCustomerIds(new Set())}
              className="px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase rounded-lg transition-all cursor-pointer border border-zinc-700"
              title="Clear all selections"
            >
              <span>CLEAR SELECTION ✕</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CUSTOMERS DATA TABLE */}
      <div className="border border-zinc-300 rounded overflow-x-auto shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-100/70 text-[11px]">
              {/* SELECT ALL CHECKBOX */}
              <th className="py-3 px-3 text-center w-12 bg-zinc-200/60">
                <input
                  type="checkbox"
                  checked={filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.has(c.id))}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 accent-[#25D366] rounded cursor-pointer"
                  title="Select or deselect all visible customers on this page"
                />
              </th>
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">NAME</th>
              <th className="py-3 px-1.5 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">TIER & LOYALTY</th>
              <th className="py-3 px-2 font-black tracking-wider text-zinc-950 uppercase text-center whitespace-nowrap">DEPARTMENT</th>
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
                <td colSpan={9} className="py-16 text-center text-xs font-extrabold text-zinc-400 tracking-wider uppercase">
                  NO REGISTERED CUSTOMERS FOUND IN THIS CATEGORY.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => {
                const tier = getCustomerTier(cust.totalSpentUSD, cust.totalOrders);
                const dept = getCustomerEffectiveDepartment(cust);
                return (
                  <tr key={cust.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-xs ${selectedCustomerIds.has(cust.id) ? 'bg-emerald-50/70 font-semibold' : ''}`}>
                    
                    {/* ROW SELECT CHECKBOX */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCustomerIds.has(cust.id)}
                        onChange={() => handleToggleSelectCustomer(cust.id)}
                        className="w-4 h-4 accent-[#25D366] rounded cursor-pointer"
                        title={`Select ${cust.name}`}
                      />
                    </td>

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

                    {/* DEPARTMENT BADGE WITH QUICK SWITCH */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {dept === 'women' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-50 text-pink-700 border border-pink-300 shadow-2xs">
                            <span>👠</span>
                            <span>WOMEN</span>
                          </span>
                        )}
                        {dept === 'men' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-2xs">
                            <span>👔</span>
                            <span>MEN</span>
                          </span>
                        )}
                        {dept === 'both' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-300 shadow-2xs">
                            <span>✨</span>
                            <span>BOTH</span>
                          </span>
                        )}

                        <select
                          value={dept}
                          onChange={(e) => handleUpdateCustomerDepartment(cust, e.target.value as CustomerDepartment)}
                          className="text-[10px] font-bold text-zinc-400 hover:text-zinc-950 bg-transparent border border-zinc-200 rounded px-1 py-0.5 cursor-pointer focus:outline-none"
                          title="Click to quickly change department"
                        >
                          <option value="women">👠 Women</option>
                          <option value="men">👔 Men</option>
                          <option value="both">✨ Both</option>
                        </select>
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
                    <td className="py-3 px-2 font-medium text-zinc-600 text-center uppercase text-[11px] max-w-[130px] truncate" title={cust.address || 'LEBANON'}>
                      {cust.address || 'LEBANON'}
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
                  <span className="text-xs truncate block">Platinum Elite VIP Perk</span>
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
                  <span className="text-xs truncate block">Gold VIP Welcome</span>
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
                  <span className="text-xs truncate block">Silver VIP Welcome</span>
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
                  <span className="text-xs truncate block">New VIP Concierge Welcome</span>
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
                  <span className="text-xs truncate block">Order Status & Dispatch Follow-up</span>
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
                  <span className="text-xs truncate block">New Seasonal Drop Announcement</span>
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
                    onBlur={() => setFormData(prev => ({ ...prev, phone: formatLebanonPhone(prev.phone) }))}
                    required 
                    placeholder="e.g. 70 123 456 or +961 70 123 456"
                    className="w-full p-3.5 border-2 border-zinc-300 rounded text-sm font-bold text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                  <span className="text-[10px] text-zinc-500 font-bold block pt-0.5">
                    🇱🇧 Always automatically formatted with Lebanon code (+961)
                  </span>
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

              {/* Department Selection */}
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-950 uppercase block">Client Department</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, department: 'women' })}
                    className={`py-2.5 px-3 rounded text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      formData.department === 'women'
                        ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                        : 'bg-pink-50 text-pink-900 border-pink-200 hover:bg-pink-100'
                    }`}
                  >
                    <span>👠 WOMEN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, department: 'men' })}
                    className={`py-2.5 px-3 rounded text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      formData.department === 'men'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <span>👔 MEN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, department: 'both' })}
                    className={`py-2.5 px-3 rounded text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      formData.department === 'both'
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                        : 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    <span>✨ BOTH / DUAL</span>
                  </button>
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
            <div className="border-b border-zinc-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#25D366]/20 text-[#25D366] rounded-lg">
                  <WhatsAppIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase">
                    VIP WHATSAPP MESSAGING
                  </h2>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">
                    Send personalized luxury WhatsApp announcements with direct links and concierge styling
                  </span>
                </div>
              </div>

              {/* MODE SWITCHER: SELECTED vs FILTER */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setBulkTargetMode('selected')}
                  className={`py-1.5 px-3 text-xs font-black uppercase rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                    bulkTargetMode === 'selected'
                      ? 'bg-[#25D366] text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <CheckSquare size={13} />
                  <span>SELECTED CLIENTS ({selectedCustomerIds.size})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTargetMode('filter')}
                  className={`py-1.5 px-3 text-xs font-black uppercase rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                    bulkTargetMode === 'filter'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <span>FILTER ALL ({customers.length})</span>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              
              {/* Guidance Info Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs leading-relaxed text-emerald-950 space-y-2.5">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <span>📸</span>
                  <span>Two seamless methods to deliver broadcasts & photos to clientele:</span>
                </p>
                
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-[11px] font-medium flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <strong>Note for WhatsApp Desktop / Web:</strong>
                    <br />
                    WhatsApp Desktop searches one number at a time. <strong>For Desktop:</strong> Click <strong>(SEND TO ➔)</strong> or <strong>(SEND NEXT)</strong> to open each contact conversation pre-filled in 1 click.
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800">
                  <strong>Method 1 (1-Click Phone Broadcast):</strong> Click <strong>&ldquo;DOWNLOAD CONTACTS (.VCF)&rdquo;</strong> to save numbers to your phone in 1 click, then open WhatsApp ➔ <strong>New Broadcast</strong> ➔ select group and send with 1 click!
                </p>
                <p className="text-[11px] text-emerald-800">
                  <strong>Method 2 (Sequential Desktop Sender):</strong> Click <strong>&ldquo;SEND TO NEXT ➔&rdquo;</strong> to sequentially open client chats with the pre-filled English message ready to send.
                </p>
              </div>

              {/* Target Department Filter */}
              <div className="space-y-1.5 bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block flex items-center justify-between">
                  <span>Target Department Filter:</span>
                  <span className="text-[10px] text-zinc-500 font-bold lowercase">Segment by department</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDepartmentFilter('all');
                      setBulkMessage('Hello {name}, we are delighted to inform you that STYLUXE has just released an exclusive new luxury arrivals drop (Dior, Zegna, Loro Piana). Discover the curated collection with complimentary express delivery across Lebanon:\nhttps://www.styluxelb.com');
                    }}
                    className={`py-2 px-3 text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      bulkDepartmentFilter === 'all'
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <span>🌐 ALL DEPARTMENTS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDepartmentFilter('women');
                      setBulkMessage('Hello {name}, we are thrilled to present the new STYLUXE Women\'s luxury collection (Dior, Chanel, Prada, Loro Piana). Discover curated haute couture gowns, designer bags and footwear:\nhttps://www.styluxelb.com/category/women');
                    }}
                    className={`py-2 px-3 text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      bulkDepartmentFilter === 'women'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-pink-50 text-pink-900 border border-pink-200 hover:bg-pink-100'
                    }`}
                  >
                    <span>👠 WOMEN ONLY</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkDepartmentFilter('men');
                      setBulkMessage('Hello {name}, we are pleased to present the new STYLUXE Men\'s seasonal drop (Zegna, Berluti, Loro Piana, Brunello Cucinelli). Explore bespoke tailoring, Italian footwear and leather accessories:\nhttps://www.styluxelb.com/category/men');
                    }}
                    className={`py-2 px-3 text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      bulkDepartmentFilter === 'men'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <span>👔 MEN ONLY</span>
                  </button>
                </div>

                {bulkDepartmentFilter === 'women' && (
                  <p className="text-[11px] font-bold text-pink-700 pt-1">
                    🌸 Message will be directed exclusively to Women's department clientele with women's catalog link.
                  </p>
                )}
                {bulkDepartmentFilter === 'men' && (
                  <p className="text-[11px] font-bold text-indigo-700 pt-1">
                    👔 Message will be directed exclusively to Men's department clientele with men's catalog link.
                  </p>
                )}
              </div>

              {/* Target Tier Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                  Target Customer Tier:
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
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                    Message Text in English:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (bulkDepartmentFilter === 'women') {
                          setBulkMessage('Hello {name}, we are thrilled to present the new STYLUXE Women\'s luxury collection (Dior, Chanel, Prada, Loro Piana). Discover curated haute couture gowns, designer bags and footwear:\nhttps://www.styluxelb.com/category/women');
                        } else if (bulkDepartmentFilter === 'men') {
                          setBulkMessage('Hello {name}, we are pleased to present the new STYLUXE Men\'s seasonal drop (Zegna, Berluti, Loro Piana, Brunello Cucinelli). Explore bespoke tailoring, Italian footwear and leather accessories:\nhttps://www.styluxelb.com/category/men');
                        } else {
                          setBulkMessage('Hello {name}, we are delighted to inform you that STYLUXE has just released an exclusive new luxury arrivals drop (Dior, Zegna, Loro Piana). Discover the curated collection with complimentary express delivery across Lebanon:\nhttps://www.styluxelb.com');
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-black bg-zinc-900 text-white rounded hover:bg-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Load English message template"
                    >
                      <span>🇬🇧 English</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (bulkDepartmentFilter === 'women') {
                          setBulkMessage('Dear {name}, we are delighted to present the new STYLUXE Women\'s luxury collection (Dior, Chanel, Prada, Loro Piana). Discover curated haute couture gowns, designer bags and footwear:\nhttps://www.styluxelb.com/category/women');
                        } else if (bulkDepartmentFilter === 'men') {
                          setBulkMessage('Dear {name}, we are pleased to introduce the new STYLUXE Men\'s seasonal drop (Zegna, Berluti, Loro Piana, Brunello Cucinelli). Explore bespoke tailoring, Italian footwear and leather accessories:\nhttps://www.styluxelb.com/category/men');
                        } else {
                          setBulkMessage('Dear {name}, STYLUXE has just released an exclusive new luxury arrivals drop (Dior, Zegna, Loro Piana). Discover the curated collection with complimentary express delivery across Lebanon:\nhttps://www.styluxelb.com');
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-black bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 border border-zinc-300 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Load English Luxury Template"
                    >
                      <span>✨ Concierge</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  className="w-full p-3.5 border-2 border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium leading-relaxed focus:outline-none focus:border-[#25D366] bg-zinc-50/50"
                  placeholder="Type broadcast message in English..."
                />
                <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                  <span>💡</span>
                  <span>Use <strong>{'{name}'}</strong> to automatically insert each customer's personal name into the WhatsApp message.</span>
                </p>
              </div>

              {/* Action Buttons: Copy Numbers & Download VCF */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyBulkNumbers}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-black tracking-wider uppercase rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {copiedNumbers ? <CheckCheck size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copiedNumbers ? 'COPIED TO CLIPBOARD!' : 'COPY NUMBERS'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadVCF}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black tracking-wider uppercase rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Download VCF contacts file to save numbers to your phone in 1 click"
                >
                  <Download size={16} />
                  <span>DOWNLOAD CONTACTS (.VCF)</span>
                </button>

                <span className="text-[11px] font-bold text-zinc-500 font-mono">
                  {getBulkTargetCustomers().length} Customer(s)
                </span>
              </div>

              {/* Quick Next Sender & 1-Click Explanation Banner */}
              {(() => {
                const targetList = getBulkTargetCustomers();
                const unsent = targetList.filter(c => !sentCustomerIds.has(c.id));
                if (targetList.length === 0) return null;
                
                return (
                  <div className="space-y-3 pt-1">
                    {/* Broadcast Guidance Box */}
                    <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-2">
                      <div className="flex items-center gap-2 text-emerald-950 font-black">
                        <span className="text-base">💡</span>
                        <span>How to broadcast to all {targetList.length} clients in 1 click safely?</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        Due to WhatsApp anti-spam policies and browser popup blocking, sending simultaneous bulk background messages requires official paid APIs. 
                        <strong>Two fast, compliant, and complimentary methods are provided below:</strong>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 bg-white/90 border border-emerald-200 rounded-lg">
                          <strong className="text-emerald-950 block pb-0.5">📱 Method 1 (1-Click Phone Broadcast List):</strong>
                          Click the blue <strong>&ldquo;DOWNLOAD CONTACTS (.VCF)&rdquo;</strong> button to save selected numbers to your phone ➔ Open WhatsApp ➔ <strong>New Broadcast</strong> ➔ Blast message to all selected clients in a single tap!
                        </div>
                        <div className="p-2.5 bg-white/90 border border-emerald-200 rounded-lg">
                          <strong className="text-emerald-950 block pb-0.5">💻 Method 2 (Quick Next Sender on Desktop):</strong>
                          Click the green <strong>&ldquo;SEND TO NEXT ➔&rdquo;</strong> button below; it sequentially opens each customer conversation pre-filled, tracking who has been sent.
                        </div>
                      </div>
                    </div>

                    {/* Quick Next Sender Button */}
                    {unsent.length > 0 ? (
                      <div className="p-3 bg-emerald-50 border-2 border-[#25D366] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-950 uppercase">
                              🚀 QUICK NEXT SENDER
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-[#25D366] text-white px-2 py-0.5 rounded-full">
                              {unsent.length} / {targetList.length} REMAINING
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 pt-0.5">
                            Click here to launch conversation with <strong>{unsent[0].name}</strong> pre-filled:
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendSingleBulk(unsent[0])}
                          className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-white" />
                          <span>SEND TO {unsent[0].name.split(' ')[0]} ➔</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-100 border-2 border-emerald-400 text-emerald-900 rounded-xl text-xs font-black text-center flex items-center justify-center gap-2 shadow-xs">
                        <CheckCheck size={18} className="text-emerald-700" />
                        <span>🎉 All {targetList.length} clients in this list have been messaged successfully!</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Customer Direct Send List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                    Individual Customer WhatsApp Direct Links:
                  </label>
                  {sentCustomerIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSentCustomerIds(new Set())}
                      className="text-[10px] text-zinc-500 hover:text-zinc-800 underline font-bold cursor-pointer"
                    >
                      Reset Sent Status
                    </button>
                  )}
                </div>
                <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 max-h-56 overflow-y-auto bg-zinc-50/50">
                  {getBulkTargetCustomers().length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-zinc-400 uppercase">
                      No customers found in this tier.
                    </div>
                  ) : (
                    getBulkTargetCustomers().map(c => {
                      const tier = getCustomerTier(c.totalSpentUSD, c.totalOrders);
                      return (
                        <div key={c.id} className={`p-3 flex items-center justify-between gap-3 transition-colors ${selectedCustomerIds.has(c.id) ? 'bg-emerald-50/40' : 'hover:bg-white'}`}>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={selectedCustomerIds.has(c.id)}
                              onChange={() => handleToggleSelectCustomer(c.id)}
                              className="w-4 h-4 accent-[#25D366] rounded cursor-pointer"
                              title="Toggle Selection"
                            />
                            <span className="text-sm">{tier.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-950 uppercase block">{c.name}</span>
                                {sentCustomerIds.has(c.id) && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCheck size={10} className="text-emerald-600" />
                                    <span>SENT ✓</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">{c.phone || 'No phone'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendSingleBulk(c)}
                            className={`px-3 py-1.5 text-white text-[10px] font-black uppercase rounded flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                              sentCustomerIds.has(c.id) ? 'bg-zinc-800 hover:bg-zinc-900' : 'bg-[#25D366] hover:bg-[#20ba59]'
                            }`}
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>{sentCustomerIds.has(c.id) ? `RESEND TO ${c.name.split(' ')[0]} ➔` : `SEND TO ${c.name.split(' ')[0]} ➔`}</span>
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

      {/* 8. IMPORT LEADS (INSTAGRAM & WHATSAPP & FILES) MODAL */}
      {isImportModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsImportModalOpen(false); }}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-300 p-6 sm:p-8 max-w-4xl w-full space-y-5 relative shadow-2xl animate-fadeIn rounded-xl max-h-[92vh] flex flex-col">
            
            <button 
              onClick={() => setIsImportModalOpen(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-2 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="border-b border-zinc-200 pb-3 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-600 via-pink-600 to-emerald-500 text-white rounded-lg shadow-xs flex items-center gap-1.5">
                <Instagram className="w-5 h-5 text-white" />
                <WhatsAppIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-zinc-950 uppercase flex items-center gap-2">
                  <span>IMPORT LEADS & PHONE NUMBERS</span>
                  <span className="text-xs bg-zinc-950 text-white font-sans px-2.5 py-0.5 rounded-full font-black">
                    INSTAGRAM & WHATSAPP
                  </span>
                </h2>
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">
                  Import phone numbers directly from Instagram DMs, WhatsApp chats, or contacts files into your VIP client database.
                </span>
              </div>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              
              {/* Source Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
                <button
                  type="button"
                  onClick={() => setImportSource('instagram')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    importSource === 'instagram'
                      ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <Instagram size={16} />
                  <span>Instagram DMs & Comments</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportSource('whatsapp')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    importSource === 'whatsapp'
                      ? 'bg-[#25D366] text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>WhatsApp Chats & Groups</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportSource('file')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    importSource === 'file'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <Upload size={16} />
                  <span>Upload File (.csv, .txt, .vcf)</span>
                </button>
              </div>

              {/* Instructions Banner */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1.5 leading-relaxed">
                <div className="font-bold text-zinc-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>
                    {importSource === 'instagram' && 'How to import leads from Instagram DMs & comments:'}
                    {importSource === 'whatsapp' && 'How to import leads from WhatsApp chats & groups:'}
                    {importSource === 'file' && 'Upload contacts spreadsheet or vCard file:'}
                  </span>
                </div>
                <p className="text-zinc-600 text-[11px]">
                  {importSource === 'instagram' && 'Paste customer inquiries or order requests from Instagram Direct or comments into the box below. The smart parser automatically detects phone numbers and client names ready for CRM attribution!'}
                  {importSource === 'whatsapp' && 'Copy and paste any WhatsApp conversation or group chat export. The parser extracts and normalizes numbers even when mixed with timestamps [12/10/24, 15:30].'}
                  {importSource === 'file' && 'Select a CSV spreadsheet, plain text TXT file, or vCard (.vcf) contacts file. The system will parse all contacts instantly.'}
                </p>
              </div>

              {/* File Upload Box (if file tab selected) */}
              {importSource === 'file' && (
                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-zinc-950 transition-colors bg-zinc-50/50">
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-zinc-100 rounded-full text-zinc-700">
                      <Upload size={24} />
                    </div>
                    <span className="text-xs font-black uppercase text-zinc-900">
                      Click to choose file or drag & drop (.csv, .txt, .vcf)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Supports Excel CSV, plain text TXT, and phone vCard VCF files.
                    </span>
                    <input
                      type="file"
                      accept=".txt,.csv,.vcf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Text Area Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                    Paste Raw Text / Phone Numbers:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteSampleData}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      📋 Try Sample Data
                    </button>
                    {importRawText && (
                      <button
                        type="button"
                        onClick={() => setImportRawText('')}
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={`Paste customer numbers or text here, for example:\nAhmad Al-Hajj: 03123456\n+961 70 889900\nNour - 71 556677\n03 998877\n76123456`}
                  className="w-full p-3.5 border-2 border-zinc-300 rounded-lg text-xs font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none bg-zinc-50/30"
                />
              </div>

              {/* Configuration Controls: Department, Default Tier & Skip Duplicates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-100/70 p-4 rounded-lg border border-zinc-200">
                <div>
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block mb-1.5">
                    Assign Department:
                  </label>
                  <select
                    value={importDepartment}
                    onChange={(e) => setImportDepartment(e.target.value as CustomerDepartment)}
                    className="w-full p-2.5 border border-zinc-300 rounded bg-white text-xs font-bold text-zinc-900 focus:border-zinc-950"
                  >
                    <option value="both">✨ BOTH / GENERAL</option>
                    <option value="women">👠 WOMEN VIP</option>
                    <option value="men">👔 MEN VIP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block mb-1.5">
                    Assign VIP Tier:
                  </label>
                  <select
                    value={importDefaultTier}
                    onChange={(e) => setImportDefaultTier(e.target.value as CustomerTier)}
                    className="w-full p-2.5 border border-zinc-300 rounded bg-white text-xs font-bold text-zinc-900 focus:border-zinc-950"
                  >
                    <option value="bronze">🥉 BRONZE (New Client)</option>
                    <option value="silver">💎 SILVER VIP</option>
                    <option value="gold">⭐ GOLD VIP</option>
                    <option value="platinum">👑 PLATINUM VIP</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-1 sm:mt-4">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 border-zinc-300 cursor-pointer"
                    />
                    <span className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                      Skip Duplicates
                    </span>
                  </label>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    Prevents duplicate customer entries and protects existing profiles.
                  </span>
                </div>
              </div>

              {/* Live Detection Summary Pills */}
              {importParsedList.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-900 text-white rounded-lg text-xs font-black tracking-wider uppercase">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                    <span>TOTAL DETECTED: {importParsedList.length}</span>
                  </div>
                  <span className="text-zinc-600">|</span>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={14} />
                    <span>NEW LEADS TO IMPORT: {importParsedList.filter(l => !l.isDuplicate).length}</span>
                  </div>
                  <span className="text-zinc-600">|</span>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <AlertCircle size={14} />
                    <span>EXISTING DUPLICATES: {importParsedList.filter(l => l.isDuplicate).length}</span>
                  </div>
                </div>
              )}

              {/* Parsed Leads Table Preview */}
              {importParsedList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-950 uppercase tracking-wider block">
                      Live Preview & Edit ({importParsedList.length} Records):
                    </label>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      You can edit customer names directly before importing, or remove any unneeded entries.
                    </span>
                  </div>

                  <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-zinc-100 text-zinc-700 uppercase font-black tracking-wider text-[10px] sticky top-0 z-10 border-b border-zinc-200">
                        <tr>
                          <th className="p-2.5 w-12 text-center">#</th>
                          <th className="p-2.5 w-36">STATUS</th>
                          <th className="p-2.5">CLIENT NAME (EDITABLE)</th>
                          <th className="p-2.5">PHONE (FORMATTED)</th>
                          <th className="p-2.5 hidden md:table-cell">ORIGINAL SNIPPET</th>
                          <th className="p-2.5 w-16 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {importParsedList.map((lead, idx) => (
                          <tr 
                            key={lead.id} 
                            className={`hover:bg-zinc-50 transition-colors ${
                              lead.isDuplicate && skipDuplicates ? 'opacity-50 bg-zinc-50/50' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center font-mono text-zinc-400 text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="p-2.5">
                              {lead.isDuplicate ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 block truncate" title={`Already in database as ${lead.duplicateName}`}>
                                  EXISTING ({lead.duplicateName || 'Client'})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 block text-center">
                                  NEW LEAD
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={lead.name}
                                onChange={(e) => handleUpdateParsedName(lead.id, e.target.value)}
                                className="w-full px-2.5 py-1 text-xs font-bold border border-zinc-200 rounded focus:border-zinc-950 focus:outline-none bg-white"
                                placeholder="Client name..."
                              />
                            </td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap" title="Automatically formatted with Lebanon code (+961)">
                              {formatLebanonPhone(lead.normalizedPhone || lead.phone)}
                            </td>
                            <td className="p-2.5 hidden md:table-cell text-zinc-400 text-[11px] truncate max-w-[200px] font-mono">
                              {lead.raw}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveParsedLead(lead.id)}
                                className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                                title="Remove this entry"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-600">
                {importParsedList.length > 0 ? (
                  <>
                    Ready to import: <strong className="text-emerald-700">{importParsedList.filter(l => !skipDuplicates || !l.isDuplicate).length}</strong> new customer profiles
                  </>
                ) : (
                  'Paste numbers above to parse and preview leads'
                )}
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 border-2 border-zinc-300 text-zinc-700 hover:text-zinc-950 text-xs font-black tracking-widest uppercase rounded cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importParsedList.filter(l => !skipDuplicates || !l.isDuplicate).length === 0}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black tracking-widest uppercase rounded flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    CONFIRM & IMPORT ({importParsedList.filter(l => !skipDuplicates || !l.isDuplicate).length}) LEADS
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
