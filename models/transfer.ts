/* eslint-disable @typescript-eslint/no-explicit-any */
/* ================= ENUMS ================= */

import { IShowroom } from "./showroom";
import { IStore } from "./store";

export enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransferEntityType {
  STORE = 'STORE',
  SHOWROOM = 'SHOWROOM', // ✅ FIXED (was SHOP)
}

/* ================= TRANSFER ITEM ================= */

export interface ITransferItem {
  id: string;

  transferId: string;

  ismaterial: boolean;

  itemId?: string | null;
  item?: any | null; // replace with IItem

  materialId?: string | null;
  material?: any | null; // replace with IMaterial

  quantity: number;

  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ================= TRANSFER ================= */

export interface ITransfer {
  id: string;

  shortCode: string;

  /* ===== SOURCE ===== */
  sourceType: TransferEntityType;

  sourceStoreId?: string | null;
  sourceStore?: IStore | null; // replace with IStore

  sourceShowroomId?: string | null;
  sourceShowroom?: IShowroom | null; // replace with IShowroom

  /* ===== DESTINATION ===== */
  destinationType: TransferEntityType;

  destStoreId?: string | null;
  destStore?: IStore | null; // replace with IStore

  destShowroomId?: string | null;
  destShowroom?: IShowroom | null; // replace with IShowroom

  /* ===== DETAILS ===== */
  reference?: string | null;
  notes?: string | null;

  status: TransferStatus;

  movementDate: string | Date;

  /* ===== USERS ===== */
  createdById?: string | null;
  createdBy?: any | null; // replace with IUser

  updatedById?: string | null;
  updatedBy?: any | null; // replace with IUser

  /* ===== TIMESTAMPS ===== */
  createdAt: string | Date;
  updatedAt: string | Date;

  /* ===== RELATIONS ===== */
  items?: ITransferItem[];
}