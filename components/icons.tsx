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

  // User
  user: IconUser,
  users: IconUsers,
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
  category: IconCategory,
  tags: IconTags,
  palette: IconPalette,
  adjustments: IconAdjustmentsAlt,
  transfer: IconArrowsRightLeft,

  // Logistics
  truck: IconTruckDelivery,
  clipboard: IconClipboardList,
  packageCheck: IconPackageExport,

  // Production
  factory: IconBuildingFactory,
  move: IconArrowsMove,

  // Misc
  pizza: IconPizza
};
