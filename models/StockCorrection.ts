import { IEmployee } from './employee';
import { IProduct, IProductBatch } from './Product';
import { IPurchase } from './purchase';
import { IShop } from './shop';
import { IStore } from './store';
import { ITransfer } from './transfer';
import { IUnitOfMeasure } from './UnitOfMeasure';

// ======================= ENUMS ======================= //

export type StockCorrectionReason =
  | 'PURCHASE_ERROR'
  | 'TRANSFER_ERROR'
  | 'EXPIRED'
  | 'DAMAGED'
  | 'MANUAL_ADJUSTMENT';

export enum StockCorrectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// ======================= ITEM ======================= //
export interface IStockCorrectionItem {
  id: string;
  correctionId: string;

  productId: string;
  product?: IProduct;

 
  unitOfMeasureId: string;
  unitOfMeasure?: IUnitOfMeasure;

  // ✅ Optional — for dimension-based items (curtains, fabric, etc.)
  height?: number;
  width?: number;

  // ✅ Optional — for piece-based items
  quantity: number;
  
  createdAt: string;
  updatedAt: string;
}

// ======================= MAIN ======================= //
export interface IStockCorrection {
  shortCode: string | undefined;
  id: string; // Prisma uses "id" instead of "_id"
  storeId?: string;
  shopId?: string;
  shop?: IShop;
  store?: IStore;
  reason: StockCorrectionReason;
  status: StockCorrectionStatus;

  purchaseId?: string;
  transferId?: string;
  purchase: IPurchase;
  transfer: ITransfer;

  reference?: string;
  notes?: string;

  createdById?: string;
  updatedById?: string;

  createdAt: string;
  updatedAt: string;
  createdBy?: IEmployee;
  updatedBy?: IEmployee;
  items: IStockCorrectionItem[];
}
