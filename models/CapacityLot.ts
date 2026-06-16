/* eslint-disable @typescript-eslint/no-explicit-any */
import { IProjectStage } from "./Projects";


export interface ICapacityLot {
  id: string;
  stage: CapacityStage;
  days: number;
  capacity: number;
  workingHours?: number;   // working hours per day for this stage (default 7.5)
  parallelSlots?: number;  // parallel workstations — multiplies daily throughput (default 1)

  createdAt: string;
  updatedAt: string;
}
export enum CapacityStage {
  DESIGN = 'DESIGN',
  METAL_WORKS = 'METAL_WORKS',
  CNC = 'CNC',
  CUTTING = 'CUTTING',
  EDGE_BANDING = 'EDGE_BANDING',
  ASSEMBLY = 'ASSEMBLY',
  PAINTING = 'PAINTING',
  FINISHING = 'FINISHING',
  DELIVERY = 'DELIVERY',
}


export interface IProjectStageCapacityAllocation {
  id: string;

  // Relations
  projectStageId: string;
  dailyStageCapacityId: string;

  // Allocation details
  allocatedUnits: number;
  allocatedHours: number;

  isOverCapacity: boolean;

  allocationDate: string; // ISO string
  createdAt: string;

  // Optional populated relations
  projectStage?: IProjectStage;
}

export interface IDailyStageCapacity {
  projectStage_capacityAllocations: IProjectStageCapacityAllocation[] | undefined;
  id: string;

  stage: CapacityStage;

  date: string; // ISO string

  usedCapacity: number;
  maxCapacity: number;

  workingHours: number;

  usedHours: number;
  maxHours: number;

  overCapacityUsed: number;
  overHoursCapacityUsed: number;

  createdAt: string;
  updatedAt: string;

  // ✅ Relations
  projectStageCapacityAllocations?: IProjectStageCapacityAllocation[];
}

export interface ICapacityReport {
  summary: {
    totalStages: number;
    totalCapacity: number;
    totalDays: number;
    totalWorkingHours: number;
    totalParallelSlots: number;
    averageCapacityPerStage: number;
    averageDaysPerStage: number;
    totalHistoryEntries: number;
    createdEntries: number;
    updatedEntries: number;
  };

  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };

  stages: {
    stage: string;
    days: number;
    currentCapacity: number;
    initialCapacity: number;
    finalCapacity: number;
    capacityChange: number;
    workingHours: number;
    parallelSlots: number;
    totalCapacityHours: number;
    historyCount: number;
    recentChanges: any[];
  }[];

  capacityTrend: {
    date: string;
    stage: string;
    change: number;
    cumulativeChange: number;
    changedBy: string;
  }[];

  generatedAt: string;
}