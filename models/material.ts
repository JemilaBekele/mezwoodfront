/* eslint-disable @typescript-eslint/no-explicit-any */

import { IMaterialCategory } from "./materialCategory";
import { IUnitOfMeasure } from "./UnitOfMeasure";

export interface IMaterial {
  id: string;
  name: string;
  color: string;
  size: string;
  plainMDF?: boolean;
  laminatedMDF?: boolean;
  wood?: boolean;
  metal?: boolean;
  accessory?: boolean; // ✅ New
  other?: boolean; 
  imageUrl?: string;

  // Relation to MaterialCategory
  materialTypeId: string;
  materialType?: IMaterialCategory;

  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: IUnitOfMeasure;
  // Related items
  items?: any[]; // ProformaItemMaterial[] (can be typed later)
  purchaseItems?: any[]; // PurchaseItem[] (can be typed later)

  createdAt: string | Date;
  updatedAt: string | Date;
}