import { IEmployee } from './employee';
import { IProduct } from './Product';
import { IStore } from './store';
import { ISupplier } from './supplier';
import { IUnitOfMeasure } from './UnitOfMeasure';

export interface PurchaseItem {
    productId: string;

  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: IUnitOfMeasure;
    product: IProduct;

  // ✅ Optional — for dimension-based items (curtains, fabric, etc.)
  height?: number;
  width?: number;

  // ✅ Optional — for piece-based items
  quantity: number; 
   unitPrice: number;
  totalPrice: number;
  id?: string;


}
export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface IPurchase {
  id: string;
  invoiceNo: string;
  supplierId: string;
  storeId: string;
  purchaseDate: Date;
  paymentStatus: PaymentStatus;
  notes?: string;
  totalProducts: number;
  subTotal: number;
  grandTotal: number;
  items: PurchaseItem[];
  supplier?: ISupplier;
  store?: Partial<IStore>;
  createdBy?: IEmployee;
  updatedBy?: IEmployee;
}
