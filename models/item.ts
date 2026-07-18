/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMaterial } from "./material";
import { IProductCategory, IProductType, ISize } from "./productConfiguration";

export interface IItem {
  stockDetails: any;
  itemMaterials: boolean;
  id: string;
  name: string;

  price: number;
  imageUrl?: string;
    itemImages?: IItemImage[];

  color?: string;

  // ✅ Relations (IDs)
  categoryId?: string;
  typeId?: string;
  sizeId?: string;

  // ✅ Populated relations
  category?: IProductCategory;
  type?: IProductType;
  size?: ISize;

  // ⚠️ Optional computed (if you calculate stock from ledger)
  stock?: number;

  createdAt: string;
  updatedAt: string;
}

export interface IItemImage {
  id: string;
  imageUrl: string;
  itemId: string;


  createdAt: string;
  updatedAt: string;
}
export interface IItemMaterial {
  id: string;

  // relations
  itemId: string;
  materialId: string;
  material?: IMaterial;

  // optional populated relations
  item?: IItem;

  quantity: number;
  note?: string;

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}