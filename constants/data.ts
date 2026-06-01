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
    shortcut: ['r', 'r'],
    permission: 'VIEW_REPORT_DASHBOARD',
    group: 'Analytics',
    items: [
      {
        title: 'Top Performers',
        url: '/dashboard/topperformance',
        icon: 'Trophy',
        shortcut: ['tp', 'tp']
      },
      {
        title: 'Invoice Report',
        url: '/dashboard/invoicerreport',
        icon: 'receipt',
        shortcut: ['ir', 'ir']
      },
      {
        title: 'Worker Payment Report',
        url: '/dashboard/workcomission',
        icon: 'wallet',
        shortcut: ['wp', 'wp'],
        permission: 'GIVE_WORKER_PAYMENT'
      },
      {
        title: 'Worker Report',
        url: '/dashboard/WorkerCommissionReport',
        icon: 'users',
        shortcut: ['wr', 'wr'],
        permission: 'VIEW_WORKER_PAYMENT_REPORT'
      },
      {
        title: 'Low Stock',
        url: '/dashboard/lowstock',
        icon: 'alertTriangle',
        shortcut: ['ls', 'ls']
      }
    ]
  },

  {
    title: 'Production',
    url: '#',
    icon: 'factory',
    isActive: false,
    shortcut: ['p', 'p'],
    permission: 'VIEW_ALL_CURTAIN_ORDERS',
    group: 'Production',
    items: [
      {
        title: 'Curtain Order',
        url: '/dashboard/CurtainOrder',
        icon: 'clipboard',
        shortcut: ['co', 'co'],
        permission: 'VIEW_ALL_CURTAIN_ORDERS'
      },
      {
        title: 'My Delivery Curtain Order',
        url: '/dashboard/deliverby',
        icon: 'truck',
        shortcut: ['md', 'md'],
        permission: 'VIEW_ALL_CURTAIN_ORDERS'
      },
      {
        title: 'Delivery Management',
        url: '/dashboard/Delivertcurtainorder',
        icon: 'packageCheck',
        shortcut: ['dm', 'dm'],
        permission: 'VIEW_ALL_CURTAIN_ORDERS'
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
        title: 'Colour',
        url: '/dashboard/Colour',
        icon: 'palette',
        shortcut: ['cl', 'cl'],
        permission: 'VIEW_ALL_COLOURS'
      },
      {
        title: 'Movement Type',
        url: '/dashboard/MovementType',
        icon: 'move',
        shortcut: ['mt', 'mt'],
        permission: 'VIEW_ALL_MOVEMENT_TYPES'
      },
      {
        title: 'Unit OfMeasure',
        url: '/dashboard/UnitOfMeasure',
        icon: 'ruler',
        shortcut: ['u', 'u'],
        permission: 'VIEW_ALL_UNIT_OF_MEASURE'
      },
      {
        title: 'Products',
        url: '/dashboard/Products',
        icon: 'box',
        shortcut: ['p', 'p'],
        permission: 'VIEW_PRODUCT_ALL'
      },
      {
        title: 'Purchase',
        url: '/dashboard/purchase',
        icon: 'shoppingCart',
        shortcut: ['pu', 'pu'],
        permission: 'VIEW_ALL_PURCHASES'
      },
      {
        title: 'Transfer',
        url: '/dashboard/Transfer',
        icon: 'transfer',
        shortcut: ['tr', 'tr'],
        permission: 'VIEW_ALL_TRANSFERS'
      },
      {
        title: 'Stock Correction',
        url: '/dashboard/StockCorrection',
        icon: 'adjustments',
        shortcut: ['sc', 'sc'],
        permission: 'VIEW_ALL_STOCK_CORRECTIONS'
      },
      {
        title: 'Expense',
        url: '/dashboard/expense',
        icon: 'wallet',
        shortcut: ['ex', 'ex']
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
        shortcut: ['cu', 'cu'],
        permission: 'VIEW_ALL_CUSTOMERS'
      },
      {
        title: 'Supplier',
        url: '/dashboard/supplier',
        icon: 'truck',
        shortcut: ['su', 'su'],
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
        shortcut: ['sh', 'sh'],
        permission: 'VIEW_ALL_SHOPS'
      },
      {
        title: 'Store',
        url: '/dashboard/store',
        icon: 'warehouse',
        shortcut: ['st', 'st'],
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
        shortcut: ['rp', 'rp'],
        permission: 'VIEW_ALL_ROLE_PERMISSIONS'
      },
      {
        title: 'Permission',
        url: '/dashboard/Permission',
        icon: 'lock',
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
