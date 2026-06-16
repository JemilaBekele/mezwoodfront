import { IEmployee } from './employee';
import { IMaterial } from './material';
import { IPurchase } from './purchase';
import { IItem } from './item'; // ✅ add this
import { IStore } from './store';
import { IShowroom } from './showroom';

// ======================= ENUMS ======================= //

export enum StockCorrectionReason {
  PURCHASE_ERROR = 'PURCHASE_ERROR',
  EXPIRED = 'EXPIRED',
  DAMAGED = 'DAMAGED',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export enum StockCorrectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ======================= ITEM ======================= //

export interface IStockCorrectionItem {
  id: string;
  correctionId: string;

  itemId?: string | null;
  item?: IItem | null;

  materialId?: string | null;
  material?: IMaterial | null;

  quantity: number; // can be positive or negative

  createdAt: string | Date;
  updatedAt: string | Date;
}

// ======================= MAIN ======================= //

export interface IStockCorrection {
  id: string;

  shortCode: string;

  ismaterial: boolean; // ✅ IMPORTANT (from schema)

  // Location
  storeId?: string | null;
  showroomId?: string | null;

  store?: IStore | null; // replace with IStore
  showroom?: IShowroom | null; // replace with IShowroom
  // Details
  reason: StockCorrectionReason;
  status: StockCorrectionStatus;

  // Optional relation
  purchaseId?: string | null;
  purchase?: IPurchase | null;

  reference?: string | null;
  notes?: string | null;

  // Users
  createdById?: string | null;
  updatedById?: string | null;
  createdBy?: IEmployee | null;
  updatedBy?: IEmployee | null;

  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relations
  items: IStockCorrectionItem[];
}