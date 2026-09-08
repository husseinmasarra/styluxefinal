import { StaffMember } from './types';

export interface AdminTabDefinition {
  id: string;
  labelEn: string;
  labelAr: string;
  descriptionAr: string;
  category: 'operations' | 'catalog' | 'marketing' | 'management';
}

export const ADMIN_TABS: AdminTabDefinition[] = [
  // Operations
  { id: 'pos', labelEn: 'POS Terminal', labelAr: 'نقطة البيع (الكاشير)', descriptionAr: 'إجراء عمليات البيع السريع وإصدار الفواتير للزبائن', category: 'operations' },
  { id: 'orders', labelEn: 'Orders & Sales', labelAr: 'إدارة الطلبات والمبيعات', descriptionAr: 'معاينة ومتابعة طلبات المتجر وتحديث حالات الشحن والتوصيل', category: 'operations' },
  { id: 'customers', labelEn: 'Customers', labelAr: 'قاعدة بيانات العملاء', descriptionAr: 'سجلات الزبائن وسجل المشتريات وأرقام التواصل', category: 'operations' },
  
  // Catalog & Inventory
  { id: 'products', labelEn: 'Products & Inventory', labelAr: 'إدارة المنتجات والمخزون', descriptionAr: 'إضافة وتعديل المنتجات والأسعار والكميات المتاحة', category: 'catalog' },
  { id: 'categories', labelEn: 'Categories', labelAr: 'الأقسام والتصنيفات', descriptionAr: 'إدارة الأقسام الرئيسية والفرعية وترتيب المعروضات', category: 'catalog' },
  { id: 'brands', labelEn: 'Designer Brands', labelAr: 'الماركات التجارية', descriptionAr: 'إدارة دور الأزياء والماركات العالمية والشعارات', category: 'catalog' },
  { id: 'suppliers', labelEn: 'Suppliers & Invoices', labelAr: 'الموردين وفواتير الشراء', descriptionAr: 'إدارة الموردين وتكاليف البضائع وفواتير الاستيراد', category: 'catalog' },

  // Marketing & Frontend
  { id: 'cards', labelEn: 'Homepage Cards', labelAr: 'بطاقات وبنرات الواجهة', descriptionAr: 'التحكم في بنرات وبطاقات الصفحة الرئيسية والعروض', category: 'marketing' },
  { id: 'menu', labelEn: 'Menu Builder', labelAr: 'تعديل قوائم المتجر', descriptionAr: 'تخصيص القائمة الرئيسية وروابط التصفح', category: 'marketing' },
  { id: 'coupons', labelEn: 'Coupons & Promos', labelAr: 'كوبونات الخصم والعروض', descriptionAr: 'إنشاء وتفعيل أكواد وكوبونات الخصم لزبائن المتجر', category: 'marketing' },

  // Management & Analytics
  { id: 'overview', labelEn: 'Overview & Analytics', labelAr: 'لوحة الإحصائيات والأرباح', descriptionAr: 'متابعة المبيعات الإجمالية والأرباح والتقارير المالية', category: 'management' },
  { id: 'staff', labelEn: 'Staff & Permissions', labelAr: 'إدارة الموظفين والصلاحيات', descriptionAr: 'إضافة الموظفين وحصر دخول كل موظف حسب اختصاصه', category: 'management' },
  { id: 'settings', labelEn: 'Store Settings & Cloud', labelAr: 'إعدادات المتجر والربط', descriptionAr: 'إعدادات المتجر والعملات والربط السحابي والنسخ الاحتياطي', category: 'management' },
];

export const ROLE_PRESETS = [
  {
    role: 'SUPER ADMIN (مدير عام)',
    description: 'صلاحية كاملة وشاملة على جميع الأقسام والعمليات والإعدادات',
    tabs: ADMIN_TABS.map(t => t.id)
  },
  {
    role: 'POS CASHIER (كاشير نقطة البيع)',
    description: 'مخصص لنقطة البيع الكاشير فقط لإتمام المبيعات والفواتير',
    tabs: ['pos']
  },
  {
    role: 'ORDERS & SALES (مسؤول الطلبات والمبيعات)',
    description: 'إدارة الطلبات ونقطة البيع وسجلات العملاء',
    tabs: ['orders', 'pos', 'customers']
  },
  {
    role: 'INVENTORY & PRODUCTS (مسؤول المنتجات والمخزون)',
    description: 'إدارة المنتجات، الأقسام، الماركات، وفواتير الموردين',
    tabs: ['products', 'categories', 'brands', 'suppliers']
  },
  {
    role: 'MARKETING & CONTENT (مسؤول التسويق والمحتوى)',
    description: 'بطاقات الواجهة الرئيسية، القوائم، الكوبونات والماركات',
    tabs: ['cards', 'menu', 'coupons', 'categories', 'brands']
  }
];

export function getStaffAllowedTabs(staff?: StaffMember | null): string[] {
  if (!staff) return [];

  // Super admins (Owner or root username admin/hussein)
  const username = (staff.username || '').toLowerCase().trim();
  if (username === 'admin' || username === 'hussein') {
    return ADMIN_TABS.map(t => t.id);
  }

  const role = (staff.role || '').toUpperCase().trim();
  if (role.includes('SUPER ADMIN') || role.includes('OWNER') || role.includes('مدير عام')) {
    return ADMIN_TABS.map(t => t.id);
  }

  const p = staff.permissions;
  if (!p) {
    if (role.includes('CASHIER') || role.includes('كاشير')) return ['pos'];
    if (role.includes('INVENTORY') || role.includes('مخزون')) return ['products', 'categories', 'brands', 'suppliers'];
    return ['pos', 'orders'];
  }

  if (typeof p === 'string') {
    const pu = p.toUpperCase().trim();
    if (pu === 'ALL' || pu === 'FULL ACCESS' || pu === 'FULL_ACCESS' || pu.includes('كامل')) {
      return ADMIN_TABS.map(t => t.id);
    }
    if (pu.includes('POS') && !pu.includes('PRODUCT') && !pu.includes('ORDER')) {
      return ['pos'];
    }
    
    // Try JSON array
    try {
      if (p.startsWith('[') && p.endsWith(']')) {
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.some(item => typeof item === 'string' && (item.toUpperCase().includes('ALL') || item.toUpperCase().includes('FULL')))) {
            return ADMIN_TABS.map(t => t.id);
          }
          return parsed.map(item => String(item).toLowerCase().trim());
        }
      }
    } catch {}

    const splitted = p.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (splitted.length > 0) {
      if (splitted.includes('all') || splitted.includes('full access')) {
        return ADMIN_TABS.map(t => t.id);
      }
      return splitted;
    }
  }

  if (Array.isArray(p)) {
    if (p.length === 0) return ['pos'];
    if (p.some(item => typeof item === 'string' && (item.toUpperCase().includes('ALL') || item.toUpperCase().includes('FULL') || item.includes('كامل')))) {
      return ADMIN_TABS.map(t => t.id);
    }
    return p.map(item => String(item).toLowerCase().trim());
  }

  return ['pos'];
}
