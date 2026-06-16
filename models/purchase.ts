import { IEmployee } from './employee';
import { IMaterial } from './material';
import { ISupplier } from './supplier';
import { IUnitOfMeasure } from './UnitOfMeasure';

export interface PurchaseItem {
  materialId: string;
  material?: IMaterial;

  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: IUnitOfMeasure;

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
  purchaseDate: Date;
  paymentStatus: PaymentStatus;
  notes?: string;
  totalProducts: number;
  subTotal: number;
  grandTotal: number;
  items: PurchaseItem[];
  supplier?: ISupplier;
  createdBy?: IEmployee;
  updatedBy?: IEmployee;
}
