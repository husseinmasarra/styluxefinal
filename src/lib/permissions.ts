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
  { id: 'pos', labelEn: 'POS Terminal', labelAr: 'POS Terminal', descriptionAr: 'Fast checkout and customer receipts', category: 'operations' },
  { id: 'orders', labelEn: 'Orders & Sales', labelAr: 'Orders & Sales', descriptionAr: 'Manage orders and fulfillment', category: 'operations' },
  { id: 'customers', labelEn: 'Customers', labelAr: 'Customer Database', descriptionAr: 'Customer history and contacts', category: 'operations' },
  
  // Catalog & Inventory
  { id: 'products', labelEn: 'Products & Inventory', labelAr: 'Product Catalog', descriptionAr: 'Manage products and stock', category: 'catalog' },
  { id: 'categories', labelEn: 'Categories', labelAr: 'Categories', descriptionAr: 'Manage categories and hierarchy', category: 'catalog' },
  { id: 'brands', labelEn: 'Designer Brands', labelAr: 'Designer Brands', descriptionAr: 'Manage fashion houses and logos', category: 'catalog' },
  { id: 'suppliers', labelEn: 'Suppliers & Invoices', labelAr: 'Suppliers', descriptionAr: 'Manage supplier invoices', category: 'catalog' },

  // Marketing & Frontend
  { id: 'cards', labelEn: 'Homepage Cards', labelAr: 'Homepage Cards', descriptionAr: 'Homepage banners and cards', category: 'marketing' },
  { id: 'menu', labelEn: 'Menu Builder', labelAr: 'Menu Builder', descriptionAr: 'Customize navigation menus', category: 'marketing' },
  { id: 'coupons', labelEn: 'Coupons & Promos', labelAr: 'Coupons & Promos', descriptionAr: 'Manage discount codes', category: 'marketing' },

  // Management & Analytics
  { id: 'overview', labelEn: 'Overview & Analytics', labelAr: 'Overview & Analytics', descriptionAr: 'Sales and financial reports', category: 'management' },
  { id: 'staff', labelEn: 'Staff & Permissions', labelAr: 'Staff & Roles', descriptionAr: 'Staff member permissions', category: 'management' },
  { id: 'settings', labelEn: 'Store Settings & Cloud', labelAr: 'Store Settings', descriptionAr: 'Global settings and backups', category: 'management' },
];

export const ROLE_PRESETS = [
  {
    role: 'SUPER ADMIN',
    description: 'Full unrestricted access to all operations and settings',
    tabs: ADMIN_TABS.map(t => t.id)
  },
  {
    role: 'POS CASHIER',
    description: 'Restricted exclusively to POS terminal operations',
    tabs: ['pos']
  },
  {
    role: 'ORDERS & SALES',
    description: 'Access to orders, POS, and customer records',
    tabs: ['orders', 'pos', 'customers']
  },
  {
    role: 'INVENTORY & PRODUCTS',
    description: 'Access to products, categories, brands, and suppliers',
    tabs: ['products', 'categories', 'brands', 'suppliers']
  },
  {
    role: 'MARKETING & CONTENT',
    description: 'Access to cards, menus, coupons, and brands',
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
  if (role.includes('SUPER ADMIN') || role.includes('OWNER') ) {
    return ADMIN_TABS.map(t => t.id);
  }

  const p = staff.permissions;
  if (!p) {
    if (role.includes('CASHIER') ) return ['pos'];
    if (role.includes('INVENTORY') ) return ['products', 'categories', 'brands', 'suppliers'];
    return ['pos', 'orders'];
  }

  if (typeof p === 'string') {
    const pu = p.toUpperCase().trim();
    if (pu === 'ALL' || pu === 'FULL ACCESS' || pu === 'FULL_ACCESS' ) {
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
    if (p.some(item => typeof item === 'string' && (item.toUpperCase().includes('ALL') || item.toUpperCase().includes('FULL') ))) {
      return ADMIN_TABS.map(t => t.id);
    }
    return p.map(item => String(item).toLowerCase().trim());
  }

  return ['pos'];
}
