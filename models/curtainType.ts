import { ICustomer } from "./customer";
import { IEmployee } from "./employee";
import { IProduct } from "./Product";
import { IShop } from "./shop";

export interface ICurtainType {
  id: string;          // UUID
  name: string;

  products?: IProduct[];    // Replace with IProduct[] if available

  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
}


export interface IMovementType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export type CurtainStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DELIVERED' | 'FINISHED' | 'RETURNED';
export type PaymentStatus = 'PENDING' | 'PAID';
// @/models/curtainOrder.ts
export interface ICurtainOrder {
  curtainstatusnote: string;
  id: string;
  code: string; // Unique order code for easy reference
    curtainStatus: CurtainStatus;
  paymentStatus: PaymentStatus;
  customerId: string;
  customer: ICustomer;
  movementTypeId?: string;
  movementType?: IMovementType;
  isSiteMeasured: boolean;
  siteMeasurePrice?: number;
  remark?: string;
  issueDate?: string;
  createdById?: string;
  createdBy?: IEmployee;
  totalAmount?: number;
  balance?: number;
  totalPaid?: number;

  deliveredById?: string;
  deliveredBy?: IEmployee;

        ShopId?: string;
  
    Shop?: IShop;
  measurements?: ICurtainMeasurement[];
  deliveryDeadline?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
    curtainPayments?: ICurtainPayment[];

}

export interface ICurtainPayment {
  id: string;

  curtainOrderId: string;

  amount: number;

  paymentMethod?:
    | 'CASH'
    | 'TELEBIRR'
    | 'TRANSFER'
    | 'CBE'
    | 'AWASH'
    | 'DASHEN'
    | 'ABYSSINIA'
    | 'HIBRET'
    | 'NIB'
    | 'OROMIA'
    | 'BERHAN'
    | 'BUNNA'
    | 'ZEMEN'
    | 'ENAT'
    | 'COOP'
    | 'WEGAGEN'
    | 'AMHARA'
    | 'TSEHAY'
    | 'GOH'
    | 'HIJRA'
    | 'SIINQEE'
    | 'SHABELLE'
    | 'AHMAD'
    | 'ADDIS'
    | 'LION'
    | 'GADA'
    | 'RAYA';

  note?: string;

  paymentDate?: string;

  createdById?: string;
  createdBy?: IEmployee;

  createdAt: string;
  updatedAt: string;
}
export type ProductSize = 'NORMAL' | 'TWO_POINT_FIVE' | 'THREE' ;


export interface ICurtainMeasurement {
  id: string;

  // 🔗 Order relation
  orderId: string;
  order?: ICurtainOrder;

  // 🏠 Room info
  roomName: string;
  // Status ✅
  size   ?:       ProductSize;
extrawidth?:number;
  // 📏 Measurements
  width: number;
  height: number;
  quantity?: number;
  pricePerUnit?: number; // This is the price per unit area (e.g., per m²) based on selected product and additional price
  unitprice?: number;
  price?: number;

  shatterVerticalProductId?: string;
  shatterVerticalProduct?: IProduct;

  curtainSize?: number;

  // 🟫 Thick Curtain Product
  thickProductId?: string;
  thickProduct?: IProduct;
  thickMeter?: number;
  thickPrice?: number;
  thickVariant?:  string;

  // 🟨 Thin Curtain Product
  thinProductId?: string;
  thinProduct?: IProduct;
  thinMeter?: number;
  thinPrice?: number;
  thinVariant?:  string;


  //
  thickWorkerPaid?: boolean;
  thickWorkerPaidDate?: string;
  thickWorkerPaidAmount?: number; // ISO date string
  thinWorkerPaid?: boolean;
  thinWorkerPaidDate?: string;
  thinWorkerPaidAmount?: number; // ISO date string 
  // 🟦 Curtain Pole
  curtainPoleId?: string;
  curtainPole?: IProduct;
  curtainPoleQuantity?: number;
  curtainPolePrice?: number;

  // 🟩 Curtain Pulls
  curtainPullsId?: string;
  curtainPulls?: IProduct;
  curtainPullsQuantity?: number;

  // 🟥 Curtain Brackets
  curtainBracketsId?: string;
  curtainBrackets?: IProduct;
  curtainBracketsQuantity?: number;
  curtainPullsBracketsPrice?: number;

  // 👷 Worker assignment
  thickWorkerId?: string;
  thickWorker?: IEmployee;
  
  thinWorkerId?: string;
  thinWorker?: IEmployee;

  workerPrice?: number;
  totalWorkerMeter?: number;

  // 👤 Created by
  createdById?: string;
  createdBy?: IEmployee;

  // 💰 Final price

  // 📝 Notes
  remark?: string;

  // ⏱ Timestamps
  createdAt: string;
  updatedAt: string;
}


