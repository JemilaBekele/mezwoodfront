import { IBank } from './bank';
import { ICustomer } from './customer';
import { IEmployee } from './employee';
import { IItem } from './item';
import { IShowroom } from './showroom';
import { IStore } from './store';

export interface ISellItem {
  id: string;
  itemSaleStatus: ItemSaleStatus;

  sellId: string;
  sell?: ISell;

  itemId: string;        // ✅ changed
  item?: IItem;          // ✅ changed

  quantity: number;
  // Location
  storeId?: string | null;
  showroomId?: string | null;

  store?: IStore | null; // replace with IStore
  showroom?: IShowroom | null; // replace with IShowroom
  unitPrice: number;
  totalPrice: number;

  createdAt: string;
  updatedAt: string;
}

export interface ISell {
  id: string;
deliveryDate: string;
  invoiceNo: string;
imageUrl?: string;
documentUrl?: string;
  paymentStatus: SellPaymentStatus;
  saleStatus: SaleStatus;

  grandTotal: number;
  balance: number;
  totalPaid: number;

  customerId: string;
  customer: ICustomer;

  totalProducts: number;
  subTotal: number;
  discount: number;
  vat: number;

  notes?: string;
  saleDate: string;

  createdById?: string;
  createdBy?: IEmployee;

  updatedById?: string;
  updatedBy?: IEmployee;

  createdAt: string;
  updatedAt: string;

  // ✅ relations
  items?: ISellItem[];
  sellPayments?: ISellPayment[];
}

export interface ISellPayment {
  id: string;

  sellId: string;

  amount: number;

  createdById?: string;
  createdBy?: IEmployee;

  bankId: string;
  bank?: IBank;

  paidBy?: string;

  createdAt: string;
  updatedAt: string;
}
export enum ItemSaleStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED'
}
export enum SaleStatus {
  NOT_APPROVED = 'NOT_APPROVED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  APPROVED = 'APPROVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum SellPaymentStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  NONE = "NONE"
}