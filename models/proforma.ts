import { IEmployee } from "./employee";
import { IProduct } from "./Product";
import { IShop } from "./shop";
import { IStore } from "./store";
import { ICustomer } from "./customer";

export interface ProformaItem {
  productId: string;

  isBox: boolean;
  product: IProduct;

  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;

  id?: string;
}

export enum ProformaStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CONVERTED = "CONVERTED",
  EXPIRED = "EXPIRED",
}

export interface IProforma {
  id: string;

  proformaNo: string;

  imageUrl?: string;
  documentUrl?: string;

  customerId: string;
  customer?: ICustomer;

  shopId?: string;

  shop?: IShop;

  proformaDate: Date;
  validUntil?: Date;

  status: ProformaStatus;

  notes?: string;

  totalProducts: number;
  subTotal: number;
  discount: number;
  tax: number;
  grandTotal: number;

  items: ProformaItem[];

  createdBy?: IEmployee;
  updatedBy?: IEmployee;
}