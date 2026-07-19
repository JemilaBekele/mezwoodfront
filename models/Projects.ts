
/* =========================
   ENUMS
========================= */

import { ICustomer } from "./customer";
import { IEmployee } from "./employee";
import { IProformaInvoice } from "./ProformaInvoice";

export enum ProjectStatus {
  INVOICE = 'INVOICE',
  DESIGN = 'DESIGN',
  PURCHASING = 'PURCHASING',
  METAL_WORKS = 'METAL_WORKS',
  CNC = 'CNC',
  CUTTING = 'CUTTING',
  EDGE_BANDING = 'EDGE_BANDING',
  ASSEMBLY = 'ASSEMBLY',
  PAINTING = 'PAINTING',
  FINISHING = 'FINISHING',
  DELIVERY = 'DELIVERY',
  INSTALLATION = 'INSTALLATION',
}
export enum DesignStatus {
    DESIGN_FINISHED = 'DESIGN_FINISHED',

    INITIATED = 'INITIATED',

  MODELING = 'MODELING',
  DRAFTING = 'DRAFTING',
  CUTLIST = 'CUTLIST',
  BOQ = 'BOQ',
  FINISHED = 'FINISHED',
}


export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// Governs whether automatic jobs may move a project's dates.
export enum ScheduleMode {
  AUTO = 'AUTO',       // cron / completion-cascade / auto-schedule may all move it
  MANUAL = 'MANUAL',   // automatic jobs skip it; explicit user actions still move it
  LOCKED = 'LOCKED',   // nothing automatic touches it; auto-schedule refuses until unlocked
}

/* =========================
   MAIN MODEL
========================= */

export interface IProjectLog {
  id: string;

  projectId: string;
  project?: IProject;

  note: string;

  createdById?: string;
  createdBy?: IEmployee;

  createdAt: string; // ISO date string
}
export interface IProject {
  id: string;
   designStatus?: DesignStatus;
  designFinished?: string;
  
  customerId: string;
  customer?: ICustomer;

  invoiceId: string;
  invoice?: IProformaInvoice;

  status: ProjectStatus;
  difficulty: DifficultyLevel;
  scheduleMode?: ScheduleMode;     // AUTO | MANUAL | LOCKED (default AUTO)
  requestedDelivery?: string;      // ISO string — the customer's asked-for date (reference)
  calculatedDelivery?: string;     // auto-scheduled date from the engine
  manualDelivery?: string;         // ISO string — manager override
  finalDelivery?: string;          // ISO string — committed/actual delivery date
  totalDays?: number;
  totalProjectQuantity?: number;
  createdById?: string;
  createdBy?: IEmployee;

   designById? : string;
   designBy?: IEmployee;
  
  updatedById?: string;
  updatedBy?: IEmployee;

  projectLogs?: IProjectLog[];
  stages?: IProjectStage[];

  createdAt: string;
  updatedAt: string;
}
export enum StageStatus {
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',

}
export enum WorkShift {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
  FULL_DAY = "FULL_DAY",
  CUSTOM = "CUSTOM",
}
export interface IProjectStage {
  id: string;

  projectId: string;
  project?: IProject;

  stage: ProjectStatus;

  capacityDays: number;

  workUnits?: number | null;

  finished: boolean;

  startDate?: string | null;
  endDate?: string | null;

  // Shift scheduling
  startDateTime?: string | null;
  endDateTime?: string | null;

  shift?: WorkShift | null;

  // Used only for CUSTOM shift
  customStartTime?: string | null;
  customEndTime?: string | null;

  timeTaken?: number | null;

  actualWorkUnits?: number | null;

  autoSchedule: boolean;

  status: StageStatus;

  projectStageWorkLogs?: IProjectStageWorkLog[];

}

export interface IProjectStageWorkLog {
  id: string;

  projectStageId: string;

  doneUnits: number;     // units completed in this log
  hours?: number | null; // actual working hours logged for this entry
  doneById?: string;     // user id (optional)
doneBy?:  IEmployee;
  note?: string;

  createdAt: string;
}

/* =========================
   SCHEDULE AUDIT HISTORY
========================= */

export enum ScheduleEventType {
  CREATED = 'CREATED',
  RESCHEDULED = 'RESCHEDULED',
  STAGE_COMPLETED = 'STAGE_COMPLETED',
  STAGE_CANCELLED = 'STAGE_CANCELLED',
  PROJECT_CANCELLED = 'PROJECT_CANCELLED',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
  CAPACITY_RELEASED = 'CAPACITY_RELEASED',
  DELIVERY_RECOMPUTED = 'DELIVERY_RECOMPUTED',
  MODE_CHANGED = 'MODE_CHANGED',
}

export enum ScheduleTrigger {
  USER = 'USER',
  CRON = 'CRON',
  COMPLETION = 'COMPLETION',
  CANCELLATION = 'CANCELLATION',
  SYSTEM = 'SYSTEM',
}

export interface IScheduleHistory {
  id: string;
  projectId: string;
  event: ScheduleEventType;
  trigger: ScheduleTrigger;
  stage?: ProjectStatus | null;
  oldDelivery?: string | null;
  newDelivery?: string | null;
  reason?: string | null;
  byUserId?: string | null;
  byUser?: IEmployee;
  createdAt: string;
}