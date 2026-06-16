import { IBank } from "./bank";
import { ICustomer } from "./customer";
import { IEmployee } from "./employee";
import { IItem } from "./item";
import { IMaterial } from "./material";
import { SellPaymentStatus } from "./Sell";

/* =======================
   PROFORMA INVOICE
======================= */

export interface IPiLog {
  id: string;

  action: string;

  piuserId?: string;
  piuser?: IEmployee;

  proformaId: string;
  proforma?: IProformaInvoice;

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IProformaInvoice {
  id: string;
    paymentStatus: SellPaymentStatus;

  piNumber: string;
store?: boolean;
  customerId: string;
  customer?: ICustomer;
  bankId?: string;

  status: PIStatus;

  subtotal: number;
  vat?: number;
  total: number;

  amountPaid: number;
  balance: number;
  amountDate?: Date | string;

  preparedById?: string;
  approvedById?: string;

  preparedBy?: IEmployee;
  approvedBy?: IEmployee;

  items: IProformaInvoiceItem[];
  banks?: IProformaInvoiceBank[];
  attachments?: IAttachment[];
  piLogs?: IPiLog[];

  createdAt: Date | string;
  updatedAt: Date | string;
}
export interface IProformaInvoiceItem {
  id: string;
  invoiceId: string;
  invoice?: IProformaInvoice;
itemId?: string; // Add this - reference to Items table
  item?: IItem; // Add this - relation to Items model

  description: string;
  size?: string;

  quantity: number;
  unitPrice: number;
  amount: number;

  additionalDescription?: string;
  images?: IProformaInvoiceItemImage[];

  materials?: IProformaItemMaterial[];
  proformaItemMaterials?: IProformaItemMaterial[];
  banks? : IProformaInvoiceBank[];
}
/* =======================
   STATUS ENUM
======================= */

export enum PIStatus {
  PENDING_ST = "PENDING_ST",
  APPROVED_ST = "APPROVED_ST",
  SENT_TO_CLIENT = "SENT_TO_CLIENT",
  REVISION = "REVISION",
  APPROVED_CLIENT = "APPROVED_CLIENT",
  APPROVED_CREATE_PROJECT = "APPROVED_CREATE_PROJECT",
  CANCELLED = "CANCELLED",
}

/* =======================
   PROFORMA INVOICE ITEM
======================= */


export interface IProformaInvoiceItemImage {
  id: string;
  itemId: string;
  imageUrl: string;
  createdAt: string;

  item?: IProformaInvoiceItem;
}
/* =======================
   ITEM MATERIAL
======================= */

export enum MaterialIssueStatus {
  PENDING = "PENDING",
  ISSUED = "ISSUED",
  PARTIALLY = "PARTIALLY",
  CANCELLED = "CANCELLED",
}

export interface IProformaItemMaterial {
  id: string;

  itemId: string;
  item?: IProformaInvoiceItem;

  materialId: string;
  material?: IMaterial;

  quantity: number;
  note?: string;

  // ✅ Status
  status?: MaterialIssueStatus;

  // ✅ Issued By
  issuedById?: string;
  issuedBy?: IEmployee;

  // ✅ Given To
  givenToId?: string;
  givenTo?: IEmployee;

  givenquantity?: number;
  additionalQuantity?:number;

  // ✅ Issue Date
  issuedAt?: Date | string;
materialIssues: IMaterialIssue[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
export interface IMaterialIssue {
  id: string;

  proformaItemMaterialId: string;
  proformaItemMaterial?: IProformaItemMaterial;

  issuedById?: string;
  issuedBy?: IEmployee;

  givenToId?: string;
  givenTo?: IEmployee;

  quantity: number;
  note?: string;

  issuedAt: string;   // ISO date string
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string
}
export interface IAttachment {
  id: string;

  proformaInvoiceId?: string;
  proformaInvoice?: IProformaInvoice;

  fileUrl: string;

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/* =======================
   BANK (M:N)
======================= */

export interface IProformaInvoiceBank {
  id: string;

  proformaInvoiceId: string;
  proformaInvoice?: IProformaInvoice;

  bankId: string;
  bank?: IBank;

  amount?: number;
paidBy? : string;
  createdBy?: IEmployee;

  createdAt?: Date | string;
}

/* =======================
   ATTACHMENT
======================= */

