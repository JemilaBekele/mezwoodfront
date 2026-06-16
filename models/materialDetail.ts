// models/materialDetail.ts
import { IMaterial } from './material';

export interface MaterialStockSummary {
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  expiredStock: number;
  byStatus: Record<string, number>;
}

export interface MaterialMovementSummary {
  totalIn: number;
  totalOut: number;
  netChange: number;
  byType: Record<string, number>;
}

export interface InventoryEntry {
  id: string;
  quantity: number;
  status: string;
  lastUpdated: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface StockLedgerEntry {
  id: string;
  movementType: string;
  quantity: number;
  reference?: string;
  movementDate: string;
  notes?: string;
  user?: {
    id: string;
    name: string;
  };
  unit?: {
    name: string;
    symbol?: string;
  };
}

export interface PurchaseItemInfo {
  id: string;
  quantity: number;
  unitPrice: number;
  purchase: {
    id: string;
    invoiceNo: string;
    purchaseDate: string;
  };
  unitOfMeasure?: {
    name: string;
  };
}

export interface StockCorrectionItemInfo {
  id: string;
  quantity: number;
  correction: {
    id: string;
    shortCode: string;
    reason: string;
    status: string;
    createdAt: string;
  };
  unitOfMeasure?: {
    name: string;
  };
}

export interface ItemUsageInfo {
  itemId: string;
  itemName: string;
  quantity: number;
  note?: string;
}

export interface MaterialDetail extends IMaterial {
  stockSummary: MaterialStockSummary;
  movementSummary: MaterialMovementSummary;
  recentInventory: InventoryEntry[];
  recentMovements: StockLedgerEntry[];
  recentPurchases: PurchaseItemInfo[];
  recentCorrections: StockCorrectionItemInfo[];
  itemUsage: ItemUsageInfo[];
}