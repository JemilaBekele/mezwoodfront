import { IEmployee } from "./employee";
import { IItem } from "./item";
import { ProjectStatus } from "./Projects";

export enum EstimationStatus {
  ESTIMATED = 'ESTIMATED',
  ON_HOLD = 'ON_HOLD',
  CONFIRMED = 'CONFIRMED',
  PROJECT_CREATED = 'PROJECT_CREATED', // ✅ added (missing before)
  EXPIRED = 'EXPIRED',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}


export interface IDeliveryEstimation {
  id: string;
  code: string;

  customerName?: string;
  phone?: string;

  difficulty: DifficultyLevel;

  // ✅ Correct source of truth
  totalQuantity: number;

  estimatedDays: number;
  estimatedDelivery: string;

  // 🔹 Capacity Lot (stage quantities)
  DESIGN?: number;
  METAL_WORKS?: number;
  CNC?: number;
  CUTTING?: number;
  EDGE_BANDING?: number;
  ASSEMBLY?: number;
  PAINTING?: number;
  FINISHING?: number;
  DELIVERY?: number;

  status: EstimationStatus;

  createdById?: string;
  updatedById?: string;
createdBy?: IEmployee;
updatedBy?: IEmployee; // Allow both string and object
  createdAt: string;
  updatedAt?: string;// ✅ NEW
}
