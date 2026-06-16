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
    items: []
  },

  {
    title: 'Report',
    url: '/dashboard/CombinedReportDashboard',
    icon: 'fileText',
    permission: 'VIEW_COMPANY',
    items: [
      {
        title: 'Combined Report',
        url: '/dashboard/CombinedReportDashboard',
        icon: 'fileText',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_COMBINED_REPORT'
      },
      {
        title: 'Complete Statistics Report',
        url: '/dashboard/completestatic',
        icon: 'barChart',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_COMPLETE_STATISTICS_REPORT'
      },
      {
        title: 'Sales Trend',
        url: '/dashboard/proformasales',
        icon: 'trendingUp',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_ALL_SELLS_TREND'
      },
      {
        title: 'Finished Product',
        url: '/dashboard/finishedproduct',
        icon: 'package',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_DETAILED_FINISHED_PRODUCTS'
      }
    ]
  },

  {
    title: 'Company',
    url: '/dashboard/Company',
    icon: 'building',
    permission: 'VIEW_COMPANY'
  },

  {
    title: 'Projects',
    url: '/dashboard/',
    icon: 'folderKanban',
    permission: 'VIEW_PROJECT_DASHBOARD',
    items: [
      {
        title: 'Proforma Invoice',
        url: '/dashboard/ProformaInvoice',
        icon: 'fileText',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_ALL_PROFORMA'
      },
      {
        title: 'Project',
        url: '/dashboard/Project',
        icon: 'folder',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_PROJECTS'
      },
      {
        title: 'Gantt Chart',
        url: '/dashboard/allprojectgant',
        icon: 'gantt',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_PROJECTS'
      },
      {
        title: 'Delivery Estimation',
        url: '/dashboard/DeliveryEstimation',
        icon: 'truck',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_DELIVERY_ESTIMATION'
      },
      {
        title: 'Capacity Calendar',
        url: '/dashboard/capacitycalendar',
        icon: 'calendar',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_PROJECTS'
      }
    ]
  },

  {
    title: 'Project Stages',
    url: '#',
    icon: 'layers',
    permission: 'VIEW_PROJECT_STAGES_DASHBOARD',
    items: [
      { title: 'View all Design', url: '/dashboard/Stage/Design', icon: 'penTool', shortcut: ['m', 'm'], permission: 'VIEW_DESIGN_PROJECTS' },
      { title: 'Unassigned Design', url: '/dashboard/Stage/Design/unassigned', icon: 'userX', shortcut: ['m', 'm'], permission: 'VIEW_UNASSIGNED_DESIGN_PROJECTS' },
      { title: 'My Design', url: '/dashboard/Stage/Design/mydesign', icon: 'userCheck', shortcut: ['m', 'm'], permission: 'VIEW_DESIGN_PROJECTS_BY_DESIGNER' },

      { title: 'Purchase', url: '/dashboard/Stage/Purchase', icon: 'shoppingCart', shortcut: ['m', 'm'], permission: 'VIEW_PURCHASING_PROJECTS' },
      { title: 'Stock check Purchase', url: '/dashboard/Stage/Purchase/stockcheck', icon: 'search', shortcut: ['m', 'm'], permission: 'VIEW_PURCHASING_PROJECTS' },

      { title: 'Metal Works', url: '/dashboard/Stage/metalworks', icon: 'hammer', shortcut: ['m', 'm'], permission: 'VIEW_METAL_WORK_PROJECTS' },
      { title: 'Cnc', url: '/dashboard/Stage/cnc', icon: 'cpu', shortcut: ['m', 'm'], permission: 'VIEW_CNC_PROJECTS' },
      { title: 'Cutting', url: '/dashboard/Stage/cutting', icon: 'scissors', shortcut: ['m', 'm'], permission: 'VIEW_CUTTING_PROJECTS' },
      { title: 'Edge Banding', url: '/dashboard/Stage/edgebanding', icon: 'ruler', shortcut: ['m', 'm'], permission: 'VIEW_EDGE_BANDING_PROJECTS' },
      { title: 'Assembly', url: '/dashboard/Stage/assembly', icon: 'boxes', shortcut: ['m', 'm'], permission: 'VIEW_ASSEMBLY_PROJECTS' },
      { title: 'Painting', url: '/dashboard/Stage/painting', icon: 'paintbrush', shortcut: ['m', 'm'], permission: 'VIEW_PAINTING_PROJECTS' },
      { title: 'Finishing', url: '/dashboard/Stage/finishing', icon: 'sparkles', shortcut: ['m', 'm'], permission: 'VIEW_FINISHED_PROJECTS' },
      { title: 'Delivery', url: '/dashboard/Stage/delivery', icon: 'truck', shortcut: ['m', 'm'], permission: 'VIEW_DELIVERY_PROJECTS' },
      { title: 'Delivery Date Comparison', url: '/dashboard/deliverydatecampare', icon: 'calendar', shortcut: ['d', 'c'], permission: 'VIEW_DELIVERY_PROJECTS' },
      { title: 'Installation', url: '/dashboard/Stage/installation', icon: 'wrench', shortcut: ['m', 'm'], permission: 'VIEW_INSTALLATION_PROJECTS' }
    ]
  },



  {
    title: 'Pos',
    url: '#',
    icon: 'shoppingBag',
    permission: 'VIEW_POS_DASHBOARD',
    items: [
      { title: 'Order', url: '/dashboard/Pos', icon: 'shoppingCart', shortcut: ['b', 'b'], permission: 'CREATE_SELL' },
      { title: 'View All Orders', url: '/dashboard/Sell', icon: 'list', shortcut: ['rs', 'rs'], permission: 'VIEW_ALL_SELLS' },
      { title: 'My Orders', url: '/dashboard/UserBasedSell', icon: 'user', shortcut: ['rs', 'rs'], permission: 'CREATE_SELL' },
      { title: 'Store Orders', url: '/dashboard/StoreOrder', icon: 'store', shortcut: ['so', 'so'], permission: 'DELIVER_ALL_SALE_ITEMS' }
    ]
  },
  {
    title: 'Product',
    url: '#',
    icon: 'package',
    permission: 'VIEW_PRODUCT_DASHBOARD',
    items: [
      { title: 'Product Category', url: '/dashboard/productcategory', icon: 'tags', shortcut: ['b', 'b'], permission: 'VIEW_PRODUCT_CATEGORIES' },
      { title: 'Product Size', url: '/dashboard/productsize', icon: 'maximize', shortcut: ['b', 'b'], permission: 'VIEW_SIZES' },
      { title: 'Product Type', url: '/dashboard/producttype', icon: 'type', shortcut: ['b', 'b'], permission: 'VIEW_PRODUCT_TYPES' },
      { title: 'Product', url: '/dashboard/Item', icon: 'package', shortcut: ['b', 'b'], permission: 'VIEW_PRODUCT_ALL' }
    ]
  },


  {
    title: 'Inventory',
    url: '#',
    icon: 'archive',
    permission: 'VIEW_INVENTORY_DASHBOARD',
    items: [
      { title: 'Material Category', url: '/dashboard/MaterialCategory', icon: 'tags', shortcut: ['b', 'b'], permission: 'VIEW_MATERIAL_CATEGORY_ALL' },
      { title: 'Unit Of Measure', url: '/dashboard/UnitOfMeasure', icon: 'ruler', shortcut: ['u', 'u'], permission: 'VIEW_ALL_UNIT_OF_MEASURE' },
      { title: 'Material', url: '/dashboard/Material', icon: 'box', shortcut: ['b', 'b'], permission: 'VIEW_MATERIAL_ALL' },
      { title: 'Stock Correction', url: '/dashboard/StockCorrection', icon: 'refreshCcw', shortcut: ['s', 's'], permission: 'VIEW_ALL_STOCK_CORRECTIONS' },
      { title: 'Transfer', url: '/dashboard/Transfer', icon: 'move', shortcut: ['y', 'y'], permission: 'VIEW_ALL_TRANSFERS' }
    ]
  },

  {
    title: 'Purchase',
    url: '#',
    icon: 'shoppingCart',
    permission: 'VIEW_ALL_PURCHASES',
    items: [
      { title: 'Purchase', url: '/dashboard/purchase', icon: 'shoppingCart', shortcut: ['P', 'P'], permission: 'VIEW_ALL_PURCHASES' },
      { title: 'Stock check Purchase', url: '/dashboard/Stage/Purchase/stockcheck', icon: 'search', shortcut: ['m', 'm'], permission: 'VIEW_ALL_PURCHASES' }
    ]
  },

  {
    title: 'Settings',
    url: '#',
    icon: 'settings',
    permission: 'VIEW_SYSTEM_DASHBOARD',
    items: [
      { title: 'Scheduling Settings', url: '/dashboard/scheduling-settings', icon: 'calendarCog', shortcut: ['sc', 'sc'], permission: 'VIEW_CAPACITY_SLOT' },
      { title: 'Capacity Slots', url: '/dashboard/capacitySlots', icon: 'calendar', shortcut: ['b', 'b'], permission: 'VIEW_CAPACITY_SLOT' },
      { title: 'Bank', url: '/dashboard/Bank', icon: 'creditCard', shortcut: ['b', 'b'], permission: 'VIEW_BANK' },
      { title: 'Show Room', url: '/dashboard/showroom', icon: 'home', shortcut: ['h', 'h'], permission: 'VIEW_SHOWROOMS' },
      { title: 'Store', url: '/dashboard/store', icon: 'store', shortcut: ['sm', 'sm'], permission: 'VIEW_ALL_STORES' }
    ]
  },
  {
    title: 'User',
    url: '#',
    icon: 'users',
    permission: 'VIEW_Users_DASHBOARD',
    items: [
      { title: 'Employee', url: '/dashboard/employee', icon: 'user', shortcut: ['eb', 'eb'], permission: 'VIEW_ALL_EMPLOYEES' },
      { title: 'Customer', url: '/dashboard/customer', icon: 'userRound', shortcut: ['b', 'b'], permission: 'VIEW_ALL_CUSTOMERS' },
      { title: 'Supplier', url: '/dashboard/supplier', icon: 'truck', shortcut: ['l', 'l'], permission: 'VIEW_ALL_SUPPLIERS' }
    ]
  },
  {
    title: 'Account',
    url: '#',
    icon: 'userCircle',
    items: [
      { title: 'Profile', url: '/dashboard/profile', icon: 'user', shortcut: ['m', 'm'] }
    ]
  },

  {
    title: 'Role and Permission',
    url: '#',
    icon: 'shield',
    permission: 'VIEW_ROLE_PERMISSION_DASHBOARD',
    items: [
      { title: 'Role', url: '/dashboard/Role', icon: 'badge', shortcut: ['ro', 'ro'], permission: 'VIEW_ALL_ROLES' },
      { title: 'Role Permission', url: '/dashboard/RolePermission', icon: 'lock', shortcut: ['po', 'po'], permission: 'VIEW_ALL_ROLE_PERMISSIONS' },
      { title: 'Permission', url: '/dashboard/Permission', icon: 'key', shortcut: ['pr', 'pr'], permission: 'VIEW_ALL_PERMISSIONS' }
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
