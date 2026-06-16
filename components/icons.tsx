import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCommand,
  IconCreditCard,
  IconFile,
  IconFileText,
  IconHelpCircle,
  IconPhoto,
  IconDeviceLaptop,
  IconLayoutDashboard,
  IconLoader2,
  IconLogin,
  IconProps,
  IconShoppingBag,
  IconMoon,
  IconDotsVertical,
  IconPizza,
  IconPlus,
  IconSettings,
  IconSun,
  IconTrash,
  IconBrandTwitter,
  IconUser,
  IconUserCircle,
  IconUserEdit,
  IconUserX,
  IconX,
  IconLayoutKanban,
  IconBrandGithub,
  IconBuildingSkyscraper,
  IconBed,
  IconHome,
  IconBath,
  IconAlertCircle,
  IconChartBar,
  IconTrendingUp,
  IconReceipt,
  IconCash,
  IconShoppingCart,
  IconBox,
  IconTruckDelivery,
  IconClipboardList,
  IconBuildingStore,
  IconUsers,
  IconShieldLock,
  IconKey,
  IconListDetails,
  IconTags,
  IconCategory,
  IconAdjustmentsAlt,
  IconArrowsRightLeft,
  IconBuildingEstate,
  IconRuler,
  IconArrowsMove,
  IconBuildingFactory,
  IconPackageExport,
  IconPalette,
  IconWallet,
  IconBuildingWarehouse,
  IconLock,

  // NEW ADDED ICONS
  IconFolder,
  IconTruck,
  IconSearch,
  IconHammer,
  IconCpu,
  IconScissors,
  IconSparkles,
  IconPaint,
  IconBrush,
  IconUserCheck,
  IconUserOff,
  IconShoppingCartOff,
  IconCalendar,
  IconCalendarCog,
  IconTruckReturn,
  IconBuilding,
  IconPackage,
  IconMaximize,
  IconRefresh,
  IconTagsOff
} from '@tabler/icons-react';

import { Trophy } from 'lucide-react';

export type Icon = React.ComponentType<IconProps>;

export const Icons = {
  dashboard: IconLayoutDashboard,
  logo: IconCommand,
  login: IconLogin,
  close: IconX,
  product: IconShoppingBag,
  spinner: IconLoader2,
  kanban: IconLayoutKanban,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  trash: IconTrash,
  employee: IconUserX,
  post: IconFileText,
  page: IconFile,
  userPen: IconUserEdit,
  user2: IconUserCircle,
  media: IconPhoto,
  settings: IconSettings,
  billing: IconCreditCard,
  ellipsis: IconDotsVertical,
  add: IconPlus,

  // General
  Trophy: Trophy,
  warning: IconAlertTriangle,
  alertTriangle: IconAlertTriangle,
  alertCircle: IconAlertCircle,
  check: IconCheck,
  help: IconHelpCircle,
  arrowRight: IconArrowRight,

  // Theme
  sun: IconSun,
  moon: IconMoon,
  laptop: IconDeviceLaptop,

  lock: IconLock,

  // Social
  github: IconBrandGithub,
  twitter: IconBrandTwitter,
// ===== FIX NAV ICON TYPE ERRORS =====
fileText: IconFileText,
barChart: IconChartBar,
layers: IconLayoutKanban,
shoppingBag: IconShoppingCart,
// ===== FIX MISSING NAV ICONS =====

penTool: IconBrush,          // or IconPencil
userX: IconUserOff,
boxes: IconBox,
wrench: IconSettings,        // or IconTool
archive: IconBox,
creditCard: IconCreditCard,
userCircle: IconUserCircle,
badge: IconShieldLock,
  // User
  user: IconUser,
  users: IconUsers,
  userRound: IconUserCircle,
  userCheck: IconUserCheck,
  userOff: IconUserOff,
  shield: IconShieldLock,
  key: IconKey,

  // Building / Store
  building: IconBuildingSkyscraper,
  store: IconBuildingStore,
  estate: IconBuildingEstate,
  warehouse: IconBuildingWarehouse,
  home: IconHome,

  // Furniture / Room
  bed: IconBed,
  bath: IconBath,

  // Measurement
  ruler: IconRuler,

  // Charts / Reports
  chart: IconChartBar,
  trendingUp: IconTrendingUp,
  list: IconListDetails,

  // Sales / POS
  receipt: IconReceipt,
  cash: IconCash,
  shoppingCart: IconShoppingCart,
  wallet: IconWallet,

  // Product / Inventory
  box: IconBox,
  package: IconBox,
  category: IconCategory,
  tags: IconTags,
  palette: IconPalette,
  adjustments: IconAdjustmentsAlt,
  transfer: IconArrowsRightLeft,

  // Logistics
  truck: IconTruck,
  truckDelivery: IconTruckDelivery,
  clipboard: IconClipboardList,
  packageCheck: IconPackageExport,

  // Production / Manufacturing
  factory: IconBuildingFactory,
  hammer: IconHammer,
  cpu: IconCpu,
  scissors: IconScissors,
  sparkles: IconSparkles,
  paintbrush: IconBrush,
  paint: IconBrush,
  move: IconArrowsMove,

  // Project / Planning
  folder: IconFolder,
  folderKanban: IconFolder,
  gantt: IconLayoutKanban,
  calendar: IconCalendar,
  calendarCog: IconCalendarCog,
  search: IconSearch,

  // UI / Misc fixes
  refreshCcw: IconRefresh,
  maximize: IconMaximize,
  type: IconListDetails,

  // extra safety aliases
  buildingSkyscraper: IconBuildingSkyscraper,
  buildingStore: IconBuildingStore
};