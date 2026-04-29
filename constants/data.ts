import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_MAIN_DASHBOARD',
    group: 'Main',
    items: [] 
  },
  {
    title: 'Report',
    url: '#',
    icon: 'chart',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_SALES_REPORT_VIEW_DASHBOARD',
    group: 'Analytics',
    items: [
      {
        title: 'All Sells Trend',
        url: '/dashboard/Selllist',
        icon: 'trendingUp',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_ALL_SELLS_TREND'
      },
      {
        title: 'Sales Rank',
        url: '/dashboard/Reportsellstatic',
        icon: 'list',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_SALES_RANK'
      },
         {
        title: 'Top Product Report',
        url: '/dashboard/TopProductsReport',
        icon: 'Trophy',        
shortcut: ['ps', 'ps'],
        permission: 'VIEW_SALES_RANK'
      }
    ]
  },
  {
    title: 'POS',
    url: '#',
    icon: 'receipt',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_SELL_DASHBOARD',
    group: 'Sales',
    items: [
      {
        title: 'Order',
        url: '/dashboard/Pos',
        icon: 'add',
        shortcut: ['ro', 'ro'],
        permission: 'CREATE_SELL'
      },
      {
        title: 'View All Orders',
        url: '/dashboard/Sell',
        icon: 'clipboard',
        shortcut: ['rs', 'rs'],
        permission: 'VIEW_ALL_SELLS'
      },
      {
        title: 'My Orders',
        url: '/dashboard/UserBasedSell',
        icon: 'shoppingCart',
        shortcut: ['rs', 'rs'],
        permission: 'CREATE_SELL'
      }
    ]
  },
  {
    title: 'Manage Store and shops',
    url: '#',
    icon: 'store',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_AND_MANAGE_STORE_AND_SHOPS',
    group: 'Sales',
    items: [
      {
        title: 'Orders',
        url: '/dashboard/StoreOrder',
        icon: 'clipboard',
        shortcut: ['so', 'so'],
        permission: 'VIEW_AND_MANAGE_STORE_AND_SHOPS'
      }
    ]
  },
  {
    title: 'Product Management',
    url: '#',
    icon: 'box',
    isActive: true,
    permission: 'VIEW_PRODUCT_DASHBOARD',
    group: 'Inventory',
    items: [
      {
        title: 'Category',
        url: '/dashboard/category',
        icon: 'category',
        shortcut: ['c', 'c'],
        permission: 'VIEW_ALL_CATEGORIES'
      },
      {
        title: 'Brand',
        url: '/dashboard/brand',
        icon: 'tags',
        shortcut: ['b', 'b'],
        permission: 'VIEW_ALL_BRANDS'
      },
   {
        title: 'Unit OfMeasure',
        url: '/dashboard/UnitOfMeasure', // Update to your actual subcategory page route UnitOfMeasure ProductUnit
        icon: 'ruler',
        shortcut: ['u', 'u'],
        permission: 'VIEW_ALL_UNIT_OF_MEASURE'
      },
      {
        title: 'Products',
        url: '/dashboard/Products',
        icon: 'box',
        shortcut: ['u', 'u'],
        permission: 'VIEW_PRODUCT_ALL'
      },
      {
        title: 'Purchase',
        url: '/dashboard/purchase',
        icon: 'shoppingCart',
        shortcut: ['P', 'P'],
        permission: 'VIEW_ALL_PURCHASES'
      },
      {
        title: 'Transfer',
        url: '/dashboard/Transfer',
        icon: 'transfer',
        shortcut: ['y', 'y'],
        permission: 'VIEW_ALL_TRANSFERS'
      },
        {
        title: 'Proforma',
        url: '/dashboard/proforma',
        icon: 'receipt',
        shortcut: ['p', 'p'],
        // permission: 'VIEW_ALL_PROFORMAS'
      },
      {
        title: 'Stock Correction',
        url: '/dashboard/StockCorrection',
        icon: 'adjustments',
        shortcut: ['s', 's'],
        permission: 'VIEW_ALL_STOCK_CORRECTIONS'
      }
    ]
  },
  {
    title: 'User',
    url: '#',
    icon: 'users',
    isActive: true,
    permission: 'VIEW_Users_DASHBOARD',
    group: 'Management',
    items: [
      {
        title: 'Employee',
        url: '/dashboard/employee',
        icon: 'employee',
        shortcut: ['eb', 'eb'],
        permission: 'VIEW_ALL_EMPLOYEES'
      },
      {
        title: 'Customer',
        url: '/dashboard/customer',
        icon: 'users',
        shortcut: ['b', 'b'],
        permission: 'VIEW_ALL_CUSTOMERS'
      },
      {
        title: 'Supplier',
        url: '/dashboard/supplier',
        icon: 'truck',
        shortcut: ['l', 'l'],
        permission: 'VIEW_ALL_SUPPLIERS'
      }
    ]
  },
  {
    title: 'System',
    url: '#',
    icon: 'settings',
    isActive: true,
    permission: 'VIEW_SYSTEM_DASHBOARD',
    group: 'Management',
    items: [
      {
        title: 'Branch',
        url: '/dashboard/Branch',
        icon: 'building',
        shortcut: ['b', 'b'],
        permission: 'VIEW_ALL_BRANCHES'
      },
      {
        title: 'Shop',
        url: '/dashboard/Shop',
        icon: 'store',
        shortcut: ['h', 'h'],
        permission: 'VIEW_ALL_SHOPS'
      },
      {
        title: 'Store',
        url: '/dashboard/store',
        icon: 'estate',
        shortcut: ['sm', 'sm'],
        permission: 'VIEW_ALL_STORES'
      }
    ]
  },
  {
    title: 'Account',
    url: '#',
    icon: 'user2',
    isActive: true,
    group: 'Personal',
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'user',
        shortcut: ['m', 'm']
      }
    ]
  },
  {
    title: 'Role and Permission',
    url: '#',
    icon: 'shield',
    isActive: true,
    permission: 'VIEW_ROLE_PERMISSION_DASHBOARD',
    group: 'Administration',
    items: [
      {
        title: 'Role',
        url: '/dashboard/Role',
        icon: 'shield',
        shortcut: ['ro', 'ro'],
        permission: 'VIEW_ALL_ROLES'
      },
      {
        title: 'Role Permission',
        url: '/dashboard/RolePermission',
        icon: 'key',
        shortcut: ['po', 'po'],
        permission: 'VIEW_ALL_ROLE_PERMISSIONS'
      }, 
      {
        title: 'Permission',
        url: '/dashboard/Permission',
        icon: 'key',
        shortcut: ['pr', 'pr'],
        permission: 'VIEW_ALL_PERMISSIONS'
      }
    ]
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'SD'
  }
];
