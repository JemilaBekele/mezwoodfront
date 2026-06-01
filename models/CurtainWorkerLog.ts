import { IEmployee } from "./employee";
import { IShopStock } from "./store";

export enum CurtainWorkerType {
  THICK = "THICK",
  THIN = "THIN",
}
export enum CurtainWorkerLogStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export interface IShopProductVariant {
  id: string;

  shopStockId: string;
  shopStock?: IShopStock;

  height: number;
  width: number;
  quantity: number;

  curtainWorkerLogs?: ICurtainWorkerLog[];
}


export interface ICurtainWorkerLog {
  id: string;
  status?: CurtainWorkerLogStatus; // ✅ added status field

  curtainMeasurementId: string;

  workerId?: string;
  worker?: IEmployee;

  workerType: CurtainWorkerType;

   shopProductVariantId?: string;
  shopProductVariant?: IShopProductVariant;

  widthmeterAssigned?: number;
  heightmeterAssigned?: number;
  quantityAssigned?: number;
    extrawidthAssigned?: number; // ✅ added for shatter vertical curtains

  widthmeterCompleted?: number;
  heightmeterCompleted?: number;
  quantityCompleted?: number;
  extrawidthCompleted?: number; // ✅ added for shatter vertical curtains

  note?: string;

  createdById?: string;
  workerlogcreatedBy?: IEmployee;

  createdAt?: string;
}