/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  GripVertical,
  LayoutGrid,
  Loader2,
  Rows3,
  RotateCcw,
  Zap,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CapacityStage } from "@/models/CapacityLot";
import {
  getAllDailyStageCapacities,
  rebuildCapacity,
  getCapacityTelemetry,
  getStageLoadRail as fetchStageLoadRail,
} from "@/service/Category";
import { getAllCapacitySlots } from "@/service/CapacityLot";
import { rescheduleProjectFromCalendar } from "@/service/Project";
import { ProjectStatus } from "@/models/Projects";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ *
 * Constants & Ethiopian calendar helpers
 * ------------------------------------------------------------------ */
const ETHIOPIAN_MONTHS = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Mirrors backend config.SHIFT_TIMES hours — used to reconstruct the engine's
// effective daily ceiling (capacity × shiftHours/workingHours × parallelSlots).
const SHIFT_HOURS: Record<string, number> = {
  MORNING: 4, AFTERNOON: 3.5, FULL_DAY: 7.5, CUSTOM: 7.5,
};

const STAGE_ORDER: CapacityStage[] = [
  CapacityStage.DESIGN,
  CapacityStage.METAL_WORKS,
  CapacityStage.CNC,
  CapacityStage.CUTTING,
  CapacityStage.EDGE_BANDING,
  CapacityStage.ASSEMBLY,
  CapacityStage.PAINTING,
  CapacityStage.FINISHING,
  CapacityStage.DELIVERY,
];

const STAGE_META: Record<CapacityStage, { color: string; abbr: string }> = {
  [CapacityStage.DESIGN]: { color: "#8b5cf6", abbr: "DSN" },
  [CapacityStage.METAL_WORKS]: { color: "#3b82f6", abbr: "MTL" },
  [CapacityStage.CNC]: { color: "#06b6d4", abbr: "CNC" },
  [CapacityStage.CUTTING]: { color: "#f59e0b", abbr: "CUT" },
  [CapacityStage.EDGE_BANDING]: { color: "#10b981", abbr: "EDG" },
  [CapacityStage.ASSEMBLY]: { color: "#ef4444", abbr: "ASM" },
  [CapacityStage.PAINTING]: { color: "#ec4899", abbr: "PNT" },
  [CapacityStage.FINISHING]: { color: "#6366f1", abbr: "FIN" },
  [CapacityStage.DELIVERY]: { color: "#14b8a6", abbr: "DLV" },
};

const STAGE_SORT = new Map<string, number>(STAGE_ORDER.map((s, i) => [s, i]));

const gregorianToEthiopian = (g: Date) => {
  if (!g || Number.isNaN(g.getTime())) return { year: 2018, month: 1, date: 1 };
  const gy = g.getFullYear();
  const gm = g.getMonth() + 1;
  const gd = g.getDate();
  const afterNewYear = gm > 9 || (gm === 9 && gd > 10);
  const months = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5];
  let ny = new Date(gy, 8, 11);
  let doy = Math.floor((g.getTime() - ny.getTime()) / 86400000) + 1;
  let year = gy - 7;
  if (doy < 1) {
    ny = new Date(gy - 1, 8, 11);
    doy = Math.floor((g.getTime() - ny.getTime()) / 86400000) + 1;
    year = gy - 8;
  } else if (!afterNewYear) {
    year = gy - 8;
  }
  let m = 1;
  let d = doy;
  for (let i = 0; i < months.length; i += 1) {
    if (d <= months[i]) { m = i + 1; break; }
    d -= months[i];
  }
  return { year, month: m, date: d };
};

const ethLabel = (g: Date) => {
  const e = gregorianToEthiopian(g);
  return `${e.date} ${ETHIOPIAN_MONTHS[e.month - 1]} ${e.year}`;
};

const stageName = (s: string) => s.replace(/_/g, " ");

// Overcapacity model (mirror of backend config.js OVERCAPACITY_FACTOR). A manual
// reschedule may pack a stage's day up to 125% of base; above that is a VIOLATION
// of the hard ceiling and is rendered distinctly.
const OVERCAPACITY_FACTOR = 1.25;
const MAX_OC_BAND = OVERCAPACITY_FACTOR - 1.0; // 0.25 — the allowed 100→125% band

const dayHoursOf = (r: any) => r.maxHours || r.workingHours || 7.5;
const dayFrac = (r: any) => (dayHoursOf(r) > 0 ? (r.usedHours || 0) / dayHoursOf(r) : 0);
const rowOver = (r: any) =>
  (r.overCapacityUsed || 0) > 0 ||
  (r.overHoursCapacityUsed || 0) > 0 ||
  dayFrac(r) > 1.01 ||
  (r.usedCapacity || 0) > (r.maxCapacity || Infinity);
// True ratio of a row against its 100% base (uncapped, can exceed 1.25).
const rowFrac = (r: any) => {
  const u = r.usedCapacity || 0;
  const m = r.maxCapacity || 0;
  if (m > 0) return u / m;
  return dayFrac(r);
};
// A row that BREACHES the 125% hard ceiling (not just the allowed band).
const rowViolation = (r: any) => rowFrac(r) > OVERCAPACITY_FACTOR + 0.001;
// Display cap: a fully-loaded stage reads 100% (sub-unit rounding can't push it
// to 101/102%). Genuine over-capacity is conveyed by the red flag / "over by" text.
const clampPct = (v: number) => `${Math.min(Math.round(v), 100)}%`;
// Uncapped percentage — for overcapacity / violation readouts that must show the
// real value above 100% (e.g. 118%, 131%).
const truePct = (v: number) => `${Math.round(v)}%`;

// Heat ramp keyed to utilization fraction (0..>1).
const heatVar = (frac: number, over = false) => {
  if (frac > OVERCAPACITY_FACTOR + 0.0001) return "var(--cc-violation)";
  if (over || frac > 1.0001) return "var(--cc-over)";
  if (frac >= 0.9) return "var(--cc-crit)";
  if (frac >= 0.75) return "var(--cc-high)";
  if (frac >= 0.5) return "var(--cc-med)";
  if (frac > 0) return "var(--cc-low)";
  return "var(--cc-idle)";
};

const dateKeyOf = (raw: any): string =>
  typeof raw === "string" ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
const dateFromKey = (key: string) => new Date(`${key}T12:00:00`);
const keyOf = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const allocationStartMs = (a: any) =>
  new Date(a.startDateTime || a.customStartTime || a.allocationDate).getTime();

const earliestAllocationStart = (r: any, allocsOf: (r: any) => any[]) => {
  const starts = allocsOf(r).map(allocationStartMs).filter(Number.isFinite);
  return starts.length ? Math.min(...starts) : Number.MAX_SAFE_INTEGER;
};

const sortDayRows = (rows: any[], allocsOf: (r: any) => any[]) =>
  [...rows].sort((a, b) => {
    const byStart = earliestAllocationStart(a, allocsOf) - earliestAllocationStart(b, allocsOf);
    if (byStart !== 0) return byStart;
    return (STAGE_SORT.get(a.stage) ?? 999) - (STAGE_SORT.get(b.stage) ?? 999);
  });

/** Group sorted day-rows by their parent project so cells can render
 *  each project's stages together with a separator border between them. */
const groupRowsByProject = (rows: any[], allocsOf: (r: any) => any[]) => {
  const groups: { key: string; label: string; entries: { row: any; allocs: any[] }[] }[] = [];
  const keyMap = new Map<string, number>();
  rows.forEach((r) => {
    const allocs = allocsOf(r);
    // Group allocations by project
    const projAllocs = new Map<string, { label: string; allocs: any[] }>();
    allocs.forEach((a: any) => {
      const pid = a?.projectStage?.project?.id || '_ungrouped';
      const label =
        a?.projectStage?.project?.invoice?.piNumber ||
        a?.projectStage?.project?.customer?.name ||
        'Unassigned';
      if (!projAllocs.has(pid)) projAllocs.set(pid, { label, allocs: [] });
      projAllocs.get(pid)!.allocs.push(a);
    });
    // If no allocs, put under ungrouped
    if (projAllocs.size === 0) {
      projAllocs.set('_ungrouped', { label: 'Unassigned', allocs: [] });
    }
    // Add each project entry to the group
    projAllocs.forEach(({ label, allocs: pAllocs }, pid) => {
      if (keyMap.has(pid)) {
        groups[keyMap.get(pid)!].entries.push({ row: r, allocs: pAllocs });
      } else {
        keyMap.set(pid, groups.length);
        groups.push({ key: pid, label, entries: [{ row: r, allocs: pAllocs }] });
      }
    });
  });
  return groups;
};


const dayCapacityAllocationFrac = (rows: any[]) => {
  let totalUsedH = 0;
  let totalAvailableH = 0;
  rows.forEach((r) => {
    totalUsedH += r.usedHours || 0;
    totalAvailableH += dayHoursOf(r);
  });
  return totalAvailableH > 0 ? totalUsedH / totalAvailableH : 0;
};

/* ------------------------------------------------------------------ *
 * Small presentational pieces
 * ------------------------------------------------------------------ */
/** Dialog shown on drag: choose how many of the cell's units to reschedule.
 *  Default = all (whole-phase move); reducing it does a stage-specific partial move. */
const RescheduleQuantityDialog: React.FC<{
  pending: { projectLabel: string; stage: string; sourceDate: string; targetDate: string; cellUnits: number };
  busy?: boolean;
  onConfirm: (units: number) => void;
  onCancel: () => void;
}> = ({ pending, busy, onConfirm, onCancel }) => {
  const max = Math.round((pending.cellUnits || 0) * 100) / 100;
  const [val, setVal] = useState<number>(max);
  useEffect(() => { setVal(max); }, [max]);
  const clamp = (n: number) => Math.max(0, Math.min(Number.isFinite(n) ? n : 0, max));
  const isAll = val >= max - 1e-6;
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Reschedule {stageName(pending.stage)} — {pending.projectLabel}</DialogTitle>
          <DialogDescription>
            {pending.sourceDate} → {pending.targetDate}. Choose how many of this day&apos;s {max} unit(s) to move.
            Moving all also shifts the parallel stage; a partial move shifts only this stage. Downstream adjusts either way.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px" }}>
          <Label>Units to move (max {max})</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button type="button" variant="outline" size="icon" disabled={busy || val <= 1}
              onClick={() => setVal((v) => clamp(Math.round((v - 1) * 100) / 100))}>−</Button>
            <Input type="number" min={0} max={max} step={1} value={val}
              onChange={(e) => setVal(clamp(parseFloat(e.target.value)))}
              style={{ textAlign: "center", width: 90 }} />
            <Button type="button" variant="outline" size="icon" disabled={busy || val >= max}
              onClick={() => setVal((v) => clamp(Math.round((v + 1) * 100) / 100))}>+</Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy || isAll}
              onClick={() => setVal(max)}>All</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={() => onConfirm(clamp(val))} disabled={busy || val <= 0}>
            {isAll ? "Move all" : `Move ${val} of ${max}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Meter: React.FC<{ frac: number; over?: boolean; thin?: boolean }> = ({ frac, over, thin }) => {
  const normalWidth = Math.min(frac, 1.0) * 80;
  // The over-bar fills the allowed 100→125% band (0..MAX_OC_BAND).
  const overWidth = Math.max(0, Math.min(frac - 1.0, MAX_OC_BAND)) * 80;
  // Beyond 125% is a VIOLATION: render the band striped in the violation colour
  // so a genuine breach is unmistakable from the allowed band.
  const isViolation = frac > OVERCAPACITY_FACTOR + 0.0001;
  return (
    <div className={`cc-track ${thin ? "cc-track--thin" : ""}`} style={{ display: 'flex', position: 'relative' }}>
      <div
        className="cc-fill"
        style={{
          width: `${normalWidth}%`,
          background: heatVar(Math.min(frac, 1.0), false),
          borderTopRightRadius: overWidth > 0 ? 0 : '99px',
          borderBottomRightRadius: overWidth > 0 ? 0 : '99px',
          transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
      {overWidth > 0 && (
        <div
          className="cc-fill-over"
          style={{
            width: `${overWidth}%`,
            background: isViolation
              ? "repeating-linear-gradient(45deg, var(--cc-violation), var(--cc-violation) 3px, #b91c1c 3px, #b91c1c 6px)"
              : "var(--cc-over)",
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: '99px',
            borderBottomRightRadius: '99px',
            height: '100%',
            transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Main component
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ *
 * Draggable stage bar (wraps each cc-cell__row)
 * ------------------------------------------------------------------ */
const DraggableStageBar: React.FC<{
  id: string;
  data: { projectId: string; projectLabel: string; stage: string; sourceDate: string; cellUnits: number };
  children: React.ReactNode;
}> = ({ id, data, children }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.35 : 1, cursor: 'grab' }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Droppable day cell wrapper
 * ------------------------------------------------------------------ */
const DroppableDayCell: React.FC<{
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({ id, children, className, style, onClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        ...style,
        outline: isOver ? '2px solid var(--cc-med, #f59e0b)' : undefined,
        outlineOffset: isOver ? '-2px' : undefined,
        transition: 'outline 120ms ease',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/** Compute start/end date keys for a named range preset. */
const computeRangeBounds = (rangeKey: string) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = new Date(todayStart);
  let to = new Date(todayStart);

  switch (rangeKey) {
    case "today": break;
    case "tomorrow":
      from.setDate(from.getDate() + 1);
      to = new Date(from);
      break;
    case "next3": to.setDate(to.getDate() + 2); break;
    case "next5": to.setDate(to.getDate() + 4); break;
    case "next7": to.setDate(to.getDate() + 6); break;
    case "this_week": {
      const dow = now.getDay();
      from.setDate(todayStart.getDate() - ((dow + 6) % 7));
      to = new Date(from); to.setDate(from.getDate() + 6);
      break;
    }
    case "next_week": {
      const dow2 = now.getDay();
      from.setDate(todayStart.getDate() - ((dow2 + 6) % 7) + 7);
      to = new Date(from); to.setDate(from.getDate() + 6);
      break;
    }
    case "next2_weeks": {
      const dow3 = now.getDay();
      from.setDate(todayStart.getDate() - ((dow3 + 6) % 7));
      to = new Date(from); to.setDate(from.getDate() + 13);
      break;
    }
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "next_month":
      from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      to = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      break;
    default: break;
  }
  return {
    startKey: keyOf(from.getFullYear(), from.getMonth(), from.getDate()),
    endKey: keyOf(to.getFullYear(), to.getMonth(), to.getDate()),
    from, to,
  };
};

/** Human-readable label for a date range. */
const rangeLabel = (from: Date, to: Date) => {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (from.getTime() === to.getTime()) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
};

const CapacityCalendar: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [slots, setSlots] = useState<Record<string, { parallelSlots: number; workingHours: number; capacity: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const [stage, setStage] = useState<CapacityStage | "ALL">("ALL");
  const [view, setView] = useState<"board" | "ledger">("board");
  const [cursor, setCursor] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [railRange, setRailRange] = useState<string>("today");
  const [statsRange, setStatsRange] = useState<string>("today");
const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [caps, lotRes] = await Promise.all([
        getAllDailyStageCapacities(),
        getAllCapacitySlots().catch(() => ({ capacitySlots: [] })),
      ]);
      const map: Record<string, any> = {};
      (lotRes?.capacitySlots || []).forEach((l: any) => {
        map[l.stage] = {
          parallelSlots: l.parallelSlots || 1,
          workingHours: l.workingHours || 7.5,
          capacity: l.capacity || 0,
        };
      });
      setSlots(map);
      setRows(Array.isArray(caps) ? caps : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load capacity data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Drag state
  const [activeDrag, setActiveDrag] = useState<{ id: string; data: any } | null>(null);
  // Pending drag awaiting the "how many units?" dialog confirmation.
  const [pendingReschedule, setPendingReschedule] = useState<{
    projectId: string;
    projectLabel: string;
    stage: string;
    sourceDate: string;
    targetDate: string;
    cellUnits: number;
  } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag({ id: String(event.active.id), data: event.active.data.current });
  }, []);

  // A drag opens the quantity dialog; the actual reschedule runs on confirm.
  const performReschedule = useCallback(async (
    projectId: string,
    draggedStage: string,
    sourceDate: string,
    targetDate: string,
    projectLabel: string,
    units?: number,
    pastCellMove?: boolean,
  ) => {
    try {
      setRescheduling(true);
      toast.loading(`Rescheduling ${projectLabel} / ${stageName(draggedStage)} from ${sourceDate}…`, { id: 'reschedule' });

      // Pass sourceDate as fromDate. `units` (when < the cell) makes the backend
      // move only that many units of this stage; omitted → whole-phase move.
      // pastCellMove (backward drag) moves just this cell + parallel peer cells.
      const res: any = await rescheduleProjectFromCalendar(
        projectId,
        draggedStage,
        `${targetDate}T08:00:00.000Z`,
        `${sourceDate}T00:00:00.000Z`,
        units,
        pastCellMove,
      );

      // Surface overflow: when the target day(s) can't hold all units at ≤125%,
      // the scheduler spills the remainder onto following working days. Tell the
      // user so a stage landing later than the drop reads as expected, not a bug.
      const payload = res?.data ?? res;
      const draggedResult = (payload?.draggedPlan?.stages || []).find(
        (p: any) => p.stage === draggedStage,
      );
      const spilledDays = draggedResult?.capacityDays || 0;
      const landedEnd = draggedResult?.endDateTime
        ? String(draggedResult.endDateTime).slice(0, 10)
        : null;
      const overflowNote =
        spilledDays > 1 && landedEnd && landedEnd !== targetDate
          ? ` Capacity full — spread to ${landedEnd} (${spilledDays} working days).`
          : '';

      toast.success(
        pastCellMove
          ? `${projectLabel} — ${stageName(draggedStage)} cell moved back to ${targetDate} (cell only; downstream untouched).`
          : `${projectLabel} — ${stageName(draggedStage)} (from ${sourceDate}) moved to ${targetDate}. Downstream adjusted.${overflowNote}`,
        { id: 'reschedule', duration: 4000 },
      );

      // Refresh calendar data
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Reschedule failed', { id: 'reschedule' });
    } finally {
      setRescheduling(false);
    }
  }, [fetchData]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const { projectId, stage, sourceDate, projectLabel, cellUnits } = active.data.current as any;
    const targetDate = String(over.id); // droppable id = date key e.g. "2026-06-10"
    if (targetDate === sourceDate) return; // no-op: same day

    // Backward drag (drop on an earlier day): move ONLY this cell (+ its parallel
    // peer cells) to the past — no dialog, no downstream cascade. Date keys are
    // YYYY-MM-DD so a string compare is chronological.
    if (targetDate < sourceDate) {
      void performReschedule(projectId, stage, sourceDate, targetDate, projectLabel, undefined, true);
      return;
    }

    // Forward / same-direction drag: open the quantity dialog (default = all units).
    setPendingReschedule({
      projectId,
      projectLabel,
      stage,
      sourceDate,
      targetDate,
      cellUnits: Number(cellUnits) || 0,
    });
  }, [performReschedule]);

  const confirmReschedule = useCallback(async (unitsToMove: number) => {
    const p = pendingReschedule;
    if (!p) return;
    setPendingReschedule(null);
    // Omit `units` when moving the whole cell → backend does the whole-phase move.
    const partial = unitsToMove > 0 && unitsToMove < p.cellUnits - 1e-6;
    await performReschedule(
      p.projectId, p.stage, p.sourceDate, p.targetDate, p.projectLabel,
      partial ? unitsToMove : undefined,
    );
  }, [pendingReschedule, performReschedule]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Ensure the calendar always opens to the current month (guards against
  // stale SSR / long-lived tabs where the initialiser ran on a previous day).
  useEffect(() => {
    const n = new Date();
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
  }, []);

  // Effective daily ceiling (the 100% denominator). The backend stores the true
  // slots-inclusive ceiling in maxCapacity (capacity × shift ÷ working-hours ×
  // parallel-slots), so we trust it directly. We must NOT key off `usedCapacity`
  // here: with reschedule overcapacity a day legitimately runs `used > maxCapacity`
  // (up to 125%) — treating that as a "legacy under-counted" row and recomputing
  // both re-applied parallelSlots (double-count) AND hid the overcapacity, e.g.
  // DESIGN's real 6/day ballooned to ~11. Only a genuine pre-slots legacy row
  // (stored well below the lot ceiling) is scaled up to the lot ceiling.
  const effMax = useCallback((r: any) => {
    const lot = slots[r.stage] || { parallelSlots: 1, workingHours: 7.5, capacity: 0 };
    const stored = r.maxCapacity || 0;
    const slotsN = lot.parallelSlots || 1;
    const whpd = r.workingHours || lot.workingHours || 7.5;
    // CUSTOM stages run the whole working day, so their shift length IS whpd
    // (matches the engine's stageShiftHours); fixed shifts use their fixed length.
    const shift = r.shift || "CUSTOM";
    const sh = shift === "CUSTOM" ? whpd : (SHIFT_HOURS[shift] || whpd);
    // Authoritative ceiling from the (dynamic) CapacityLot — identical to the
    // engine's baseDailyMax = capacity × shiftHours/whpd × slots.
    const lotEff = (lot.capacity || 0) * (sh / whpd) * slotsN;
    if (stored > 0) {
      if (slotsN > 1 && lotEff > 0 && stored < lotEff * 0.6) return lotEff; // legacy pre-slots row
      return stored;
    }
    return lotEff > 0 ? lotEff : stored;
  }, [slots]);

  const allocsOf = (r: any) =>
    r.projectStageCapacityAllocations || r.projectStage_capacityAllocations || [];

  const filtered = useMemo(
    () => rows.filter((r) => stage === "ALL" || r.stage === stage),
    [rows, stage]
  );

  // Index rows by calendar day for the board.
  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    filtered.forEach((r) => {
      const k = dateKeyOf(r.date);
      (m[k] ||= []).push(r);
    });
    return m;
  }, [filtered]);

  // Telemetry summary — fetched from backend by statsRange.
  const statsBounds = useMemo(() => computeRangeBounds(statsRange), [statsRange]);
  const [summary, setSummary] = useState({
    used: 0, eff: 0, usedH: 0, maxH: 0, over: 0, violation: 0, allocs: 0, activeDays: 0,
    util: 0, hoursUtil: 0,
  });
  useEffect(() => {
    let cancelled = false;
    getCapacityTelemetry(statsBounds.startKey, statsBounds.endKey)
      .then((res) => {
        if (cancelled) return;
        setSummary({
          used: res.used ?? 0, eff: res.eff ?? 0, usedH: res.usedH ?? 0,
          maxH: res.maxH ?? 0, over: res.over ?? 0, violation: res.violation ?? 0,
          allocs: res.allocs ?? 0,
          activeDays: res.activeDays ?? 0, util: res.util ?? 0, hoursUtil: res.hoursUtil ?? 0,
        });
      })
      .catch(() => { /* telemetry fetch failed — keep previous values */ });
    return () => { cancelled = true; };
  }, [statsBounds]);

  // Per-stage load rail — fetched from backend by railRange.
  const railBounds = useMemo(() => computeRangeBounds(railRange), [railRange]);
  const [stageRail, setStageRail] = useState<{ stage: CapacityStage; used: number; eff: number; over: boolean; violation: boolean }[]>(
    STAGE_ORDER.map((s) => ({ stage: s as CapacityStage, used: 0, eff: 0, over: false, violation: false }))
  );
  useEffect(() => {
    let cancelled = false;
    fetchStageLoadRail(railBounds.startKey, railBounds.endKey)
      .then((res) => {
        if (cancelled) return;
        setStageRail(
          (res.stages || []).map((s: any) => ({
            stage: s.stage, used: s.used ?? 0, eff: s.eff ?? 0, over: s.over ?? false,
            violation: s.violation ?? false,
          }))
        );
      })
      .catch(() => { /* stage load fetch failed — keep previous values */ });
    return () => { cancelled = true; };
  }, [railBounds]);

  // Build a 6-week grid for the cursor month.
  const weeks = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDow = first.getDay();
    const cells: { key: string; day: number; inMonth: boolean; date: Date }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(cursor.y, cursor.m, 1 - startDow + i);
      cells.push({
        key: keyOf(d.getFullYear(), d.getMonth(), d.getDate()),
        day: d.getDate(),
        inMonth: d.getMonth() === cursor.m,
        date: d,
      });
    }
    const w: (typeof cells)[] = [];
    for (let i = 0; i < 6; i += 1) w.push(cells.slice(i * 7, i * 7 + 7));
    return w;
  }, [cursor]);

  const todayKey = useMemo(() => {
    const n = new Date();
    return keyOf(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  // Compact this week: pull current-week stages into empty space only. Nothing
  // outside the current week moves; no downstream cascade; no-op if no gaps.
  const handleRebuild = async () => {
    if (!window.confirm("Compact the current week? This pulls this week's stages earlier into any empty space (filling gaps). Nothing outside this week is moved, and if there's no empty space nothing changes.")) return;
    try {
      setResetting(true);
      await rebuildCapacity();
      await fetchData();
      setSelectedKey(null);
    } catch (err) {
      console.error(err);
      window.alert("Failed to compact the current week.");
    } finally {
      setResetting(false);
    }
  };


  /* ---------------------------------------------------------------- */
  return (
    <div className="capcal">
      <style>{CC_STYLES}</style>

      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="cc-mast">
        <div className="cc-mast__grid" aria-hidden />
        <div className="cc-mast__row">
          <div className="cc-mast__id">
            <span className="cc-eyebrow"><Gauge size={12} /> PRODUCTION&nbsp;CONTROL</span>
            <h1 className="cc-title">Capacity&nbsp;Board</h1>
            <p className="cc-sub">
              Daily factory load by stage — measured against the live engine ceiling
              <span className="cc-mono"> (capacity × shift ÷ hours × slots)</span>.
            </p>
          </div>
          <div className="cc-mast__meta">
            <div className="cc-stamp">
              <span className="cc-stamp__k">TODAY</span>
              <span className="cc-stamp__v cc-mono">{new Date().toLocaleDateString()}</span>
              <span className="cc-stamp__e">{ethLabel(new Date())} E.C.</span>
            </div>
            <div className="cc-actions">
              <Button onClick={fetchData} variant="outline" size="sm" className="cc-btn">
                <RotateCcw size={14} /> Refresh
              </Button>
              <Button onClick={handleRebuild} disabled={resetting} variant="outline" size="sm" className="cc-btn" title="Compact this week: pull current-week stages into empty space (fill gaps). Nothing else moves.">
                <Zap size={14} className={resetting ? "cc-spin" : ""} />
                {resetting ? "Compacting…" : "Compact week"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="cc-error">
          <AlertTriangle size={18} /> <span>{error}</span>
          <Button onClick={fetchData} variant="outline" size="sm" className="cc-btn ml-auto">Retry</Button>
        </div>
      )}

      {/* ── Telemetry ────────────────────────────────────────── */}
      <div className="cc-telemetry-header">
        <div className="cc-telemetry-header__left">
          <div className="cc-range-badge">
            <CalendarDays size={13} />
            <span>{rangeLabel(statsBounds.from, statsBounds.to)}</span>
          </div>
        </div>
        <div className="cc-select-wrap">
          <CalendarDays size={13} className="cc-select-wrap__icon" />
          <select
            className="cc-stats-select"
            value={statsRange}
            onChange={(e) => setStatsRange(e.target.value)}
          >
            {STATS_RANGE_OPTIONS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      <section className="cc-telemetry">
        <TelemetryTile
          icon={<Activity size={14} />} label="Effective utilization"
          value={loading ? "—" : (summary.util > 100 ? truePct(summary.util) : clampPct(summary.util))} meter={summary.util / 100}
          over={summary.util > 100}
          foot={`${Math.round(summary.used)} / ${Math.round(summary.eff)} units`}
        />
        <TelemetryTile
          icon={<Boxes size={14} />} label="Scheduled units"
          value={loading ? "—" : `${Math.round(summary.used)}`}
          foot={`${summary.allocs} allocation lines`}
        />
        <TelemetryTile
          icon={<Clock size={14} />} label="Hours loaded"
          value={loading ? "—" : summary.usedH.toFixed(1)} meter={summary.hoursUtil / 100}
          foot={`${summary.hoursUtil > 100 ? truePct(summary.hoursUtil) : clampPct(summary.hoursUtil)} of available`}
        />
        <TelemetryTile
          icon={<AlertTriangle size={14} />} label="Over-capacity days"
          value={loading ? "—" : `${summary.over}`} danger={summary.over > 0}
          foot={(summary.violation || 0) > 0
            ? `⚠ ${summary.violation} day(s) breach 125%`
            : `${summary.activeDays} active days in window`}
        />
      </section>

      {/* ── Control bar ──────────────────────────────────────── */}
      <div className="cc-controls">
        <div className="cc-chips">
          <button
            className={`cc-chip ${stage === "ALL" ? "is-on" : ""}`}
            onClick={() => setStage("ALL")}
          >
            All stages
          </button>
          {STAGE_ORDER.map((s) => (
            <button
              key={s}
              className={`cc-chip ${stage === s ? "is-on" : ""}`}
              onClick={() => setStage(s)}
              style={stage === s ? { borderColor: STAGE_META[s].color, color: STAGE_META[s].color } : undefined}
            >
              <span className="cc-dot" style={{ background: STAGE_META[s].color }} />
              {STAGE_META[s].abbr}
            </button>
          ))}
        </div>

        <div className="cc-right">
          <div className="cc-legend">
            {[
              ["IDLE", "var(--cc-low)"],
              ["50%", "var(--cc-med)"],
              ["75%", "var(--cc-high)"],
              ["90%", "var(--cc-crit)"],
              ["OVER", "var(--cc-over)"],
            ].map(([l, c]) => (
              <span key={l} className="cc-legend__i">
                <i style={{ background: c as string }} /> {l}
              </span>
            ))}
          </div>
          <div className="cc-seg">
            <button className={view === "board" ? "is-on" : ""} onClick={() => setView("board")}>
              <LayoutGrid size={14} /> Board
            </button>
            <button className={view === "ledger" ? "is-on" : ""} onClick={() => setView("ledger")}>
              <Rows3 size={14} /> Ledger
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cc-btn gap-1.5"
            onClick={() => setRailOpen(true)}
          >
            <BarChart3 size={14} /> Stage Load
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="cc-skeleton">
          <div className="cc-spinner" />
          <p className="cc-mono">Reading capacity ledger…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cc-empty">
          <CalendarDays size={28} />
          <h3>No reserved capacity in window</h3>
          <p>The board shows days with active allocations. Try another stage or refresh.</p>
        </div>
      ) : view === "board" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <section className="cc-board" style={{ position: 'relative' }}>
          {rescheduling && (
            <div className="cc-reschedule-overlay">
              <Loader2 className="animate-spin" size={24} />
              <span>Rescheduling…</span>
            </div>
          )}
          <div className="cc-board__head">
            <div className="cc-monthnav">
              <button onClick={() => setCursor((c) => { const d = new Date(c.y, c.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}>
                <ChevronLeft size={16} />
              </button>
              <div className="cc-monthnav__label">
                <span className="cc-month">{MONTHS[cursor.m]} {cursor.y}</span>
                <span className="cc-month__e cc-mono">{ethLabel(new Date(cursor.y, cursor.m, 15))} E.C.</span>
              </div>
              <button onClick={() => setCursor((c) => { const d = new Date(c.y, c.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}>
                <ChevronRight size={16} />
              </button>
            </div>
            <button className="cc-today cc-today--dated" onClick={() => { const n = new Date(); setCursor({ y: n.getFullYear(), m: n.getMonth() }); }}>
              <span>Today · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="cc-today__ec">{ethLabel(new Date())} E.C.</span>
            </button>
          </div>

          <div className="cc-dow">
            {WEEKDAYS.map((d, i) => (
              <span key={d} className={i === 0 ? "cc-dow--off" : ""}>{d}</span>
            ))}
          </div>

          <div className="cc-grid">
            {weeks.flat().map((cell, i) => {
              const dayRows = byDay[cell.key] || [];
              const displayRows = sortDayRows(dayRows, allocsOf);
              const isSunday = cell.date.getDay() === 0;
              const dayLoadFrac = dayCapacityAllocationFrac(dayRows);
              let anyOver = false;
              dayRows.forEach((r) => {
                if (rowOver(r)) anyOver = true;
              });
            
              const heat = heatVar(dayLoadFrac, anyOver);
              const active = dayRows.length > 0;
              return (
                <DroppableDayCell
                  key={cell.key}
                  id={cell.key}
                  className={[
                    "cc-cell",
                    cell.inMonth ? "" : "cc-cell--out",
                    isSunday ? "cc-cell--off" : "",
                    cell.key === todayKey ? "cc-cell--today" : "",
                    cell.key === selectedKey ? "cc-cell--sel" : "",
                    active ? "cc-cell--active" : "",
                  ].join(" ")}
                  style={{
                    animationDelay: `${i * 7}ms`,
                    background: active ? `color-mix(in srgb, ${heat} 12%, transparent)` : undefined,
                    "--heat": heat,
                  } as React.CSSProperties}
                  onClick={() => {
  if (active) {
    router.push(`/dashboard/capacityday/${cell.key}`);
  }
}}  


                >
                  <div className="cc-cell__top">
                    <span className="cc-cell__dates">
                      <span className="cc-cell__d">{cell.day}</span>
                      <span className="cc-cell__ed" title={`${ethLabel(cell.date)} E.C.`}>
                        {gregorianToEthiopian(cell.date).date}
                      </span>
                    </span>
                    {active && (() => {
                      const maxOverPct = Math.round(Math.max(...dayRows.map((r: any) => {
                        if ((r.maxCapacity || 0) <= 0) return 0;
                        const overFromField = (r.overCapacityUsed || 0) / r.maxCapacity;
                        const overFromUsage = Math.max(0, (r.usedCapacity || 0) - r.maxCapacity) / r.maxCapacity;
                        return Math.max(overFromField, overFromUsage);
                      })) * 100);
                      // >25% over base == >125% == breach of the hard ceiling.
                      const anyViolation = dayRows.some(rowViolation);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {anyOver && maxOverPct > 0 && (
                            <span
                              title={anyViolation
                                ? "Exceeds the 125% hard ceiling"
                                : "Within the allowed 100–125% overcapacity band"}
                              style={{
                                background: anyViolation
                                  ? "repeating-linear-gradient(45deg, var(--cc-violation), var(--cc-violation) 3px, #b91c1c 3px, #b91c1c 6px)"
                                  : "var(--cc-over)",
                                color: "#fff",
                                fontSize: "8px",
                                fontWeight: 800,
                                padding: "2px 4px",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                                lineHeight: 1.1,
                                flexShrink: 0
                              }}
                            >
                              {anyViolation ? `+${maxOverPct}% !` : `+${maxOverPct}% OC`}
                            </span>
                          )}
                          <span className="cc-cell__peak" style={{ background: heat, flexShrink: 0 }}>
                            {clampPct(dayLoadFrac * 100)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  {active && (
                    <div className="cc-cell__bars">
                      {(() => {
                        const groups = groupRowsByProject(displayRows, allocsOf);
                        let totalShown = 0;
                        const maxBars = 4;
                        return groups.map((group) => {
                          if (totalShown >= maxBars) return null;
                          const remaining = maxBars - totalShown;
                          const barsToShow = group.entries.slice(0, remaining);
                          totalShown += barsToShow.length;
                          return (
                            <div
                              key={group.key}
                              className="cc-cell__pgroup"
                            >
                              <span className="cc-cell__pdiv" title={group.label}>
                                <span>{group.label}</span>
                              </span>
                              {barsToShow.map(({ row: r, allocs }) => {
                                const meta = STAGE_META[r.stage as CapacityStage];
                                const eff = effMax(r);
                                const allocUnits = allocs.reduce((s: number, a: any) => s + (a.allocatedUnits || 0), 0);
                                const f = eff > 0 ? allocUnits / eff : 0;
                                const projectId = allocs[0]?.projectStage?.project?.id;
                                const dragId = `${group.key}::${r.stage}::${cell.key}`;
                                const stageBar = (
                                  <div
                                    className="cc-cell__row cc-cell__row--draggable"
                                    style={{ "--stage-color": meta?.color } as React.CSSProperties}
                                    title={`${stageName(r.stage)} - ${allocUnits} / ${Math.round(eff)} units (${clampPct(f * 100)} of capacity) — drag to reschedule`}
                                  >
                                    <span
                                      className="cc-cell__rowfill"
                                      style={{ width: `${Math.min(f * 100, 100)}%`, background: meta?.color }}
                                    />
                                    <GripVertical size={10} className="cc-cell__grip" />
                                    <span className="cc-cell__rowdot" style={{ background: meta?.color }} />
                                    <span className="cc-cell__rowabbr">{stageName(r.stage)}</span>
                                    <span className="cc-cell__rowpct">{clampPct(f * 100)}</span>
                                  </div>
                                );
                                // Only make draggable if we have a project ID
                                if (!projectId) {
                                  return <div key={`${r.id}-${group.key}`}>{stageBar}</div>;
                                }
                                return (
                                  <DraggableStageBar
                                    key={`${r.id}-${group.key}`}
                                    id={dragId}
                                    data={{
                                      projectId,
                                      projectLabel: group.label,
                                      stage: r.stage,
                                      sourceDate: cell.key,
                                      cellUnits: allocUnits,
                                    }}
                                  >
                                    {stageBar}
                                  </DraggableStageBar>
                                );
                              })}
                              {group.entries.length > barsToShow.length && (
                                <span className="cc-cell__more">+{group.entries.length - barsToShow.length} more</span>
                              )}
                            </div>
                          );
                        });
                      })()}
                      {dayRows.length > 4 && (
                        <span className="cc-cell__more">+{dayRows.length - 4} stage{dayRows.length - 4 > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  )}
                </DroppableDayCell>
              );
            })}
          </div>

          {/* Drag overlay — floating pill during drag */}
          <DragOverlay dropAnimation={null}>
            {activeDrag?.data && (
              <div className="cc-drag-overlay">
                <span
                  className="cc-drag-overlay__dot"
                  style={{ background: STAGE_META[activeDrag.data.stage as CapacityStage]?.color }}
                />
                <span className="cc-drag-overlay__label">
                  {activeDrag.data.projectLabel} — {stageName(activeDrag.data.stage)}
                </span>
              </div>
            )}
          </DragOverlay>
        </section>
        </DndContext>
      ) : (
        <Ledger rows={filtered} effMax={effMax} allocsOf={allocsOf} slots={slots} />
      )}

    

      {/* Reschedule quantity dialog — choose how many of the cell's units to move */}
      {pendingReschedule && (
        <RescheduleQuantityDialog
          pending={pendingReschedule}
          busy={rescheduling}
          onCancel={() => setPendingReschedule(null)}
          onConfirm={confirmReschedule}
        />
      )}

      {/* Stage load — side sheet */}
      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="right" className="w-[340px] sm:max-w-[340px] p-0 gap-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Stage Load</SheetTitle>
          </SheetHeader>
          <div className="capcal h-full flex flex-col">
            <style>{CC_STYLES}</style>
            <div className="flex-1 overflow-auto">
              <StageRail rail={stageRail} railRange={railRange} onRangeChange={(v) => setRailRange(v)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Telemetry tile
 * ------------------------------------------------------------------ */
const TelemetryTile: React.FC<{
  icon: React.ReactNode; label: string; value: string;
  foot?: string; meter?: number; over?: boolean; danger?: boolean;
}> = ({ icon, label, value, foot, meter, over, danger }) => (
  <div className={`cc-tile ${danger ? "cc-tile--danger" : ""}`}>
    <div className="cc-tile__head"><span className="cc-tile__ic">{icon}</span>{label}</div>
    <div className="cc-tile__val cc-mono">{value}</div>
    {typeof meter === "number" && <Meter frac={meter} over={over} thin />}
    {foot && <div className="cc-tile__foot cc-mono">{foot}</div>}
  </div>
);

/* ------------------------------------------------------------------ *
 * Per-stage load rail (shown when no day selected)
 * ------------------------------------------------------------------ */
const RANGE_OPTIONS = [
  { group: "Daily", items: [
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "next3", label: "Next 3 Days" },
    { key: "next5", label: "Next 5 Days" },
    { key: "next7", label: "Next 7 Days" },
  ]},
  { group: "Weekly", items: [
    { key: "this_week", label: "This Week" },
    { key: "next_week", label: "Next Week" },
    { key: "next2_weeks", label: "Next 2 Weeks" },
  ]},
  { group: "Monthly", items: [
    { key: "this_month", label: "This Month" },
    { key: "next_month", label: "Next Month" },
  ]},
];
const RAIL_RANGE_OPTIONS = RANGE_OPTIONS;
const STATS_RANGE_OPTIONS = RANGE_OPTIONS;

const StageRail: React.FC<{
  rail: { stage: CapacityStage; used: number; eff: number; over: boolean; violation?: boolean }[];
  railRange: string;
  onRangeChange: (r: string) => void;
}> = ({ rail, railRange, onRangeChange }) => (
  <div className="cc-panel">
    <div className="cc-panel__head"><Gauge size={14} /> Stage Load</div>
    <div className="cc-rail-range">
      <div className="cc-select-wrap">
        <CalendarDays size={13} className="cc-select-wrap__icon" />
        <select
          className="cc-rail-select"
          value={railRange}
          onChange={(e) => onRangeChange(e.target.value)}
        >
          {RAIL_RANGE_OPTIONS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
    <div className="cc-railscroll">
      {rail.map((r) => {
        const frac = r.eff > 0 ? r.used / r.eff : 0;
        return (
          <div key={r.stage} className="cc-railrow">
            <div className="cc-railrow__top">
              <span className="cc-railrow__name">
                <span className="cc-dot" style={{ background: STAGE_META[r.stage].color }} />
                {stageName(r.stage)}
              </span>
              <span className="cc-railrow__val cc-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {r.over && r.eff > 0 && (
                  <span
                    title={r.violation
                      ? "Exceeds the 125% hard ceiling"
                      : "Within the allowed 100–125% overcapacity band"}
                    style={{
                      background: r.violation
                        ? "repeating-linear-gradient(45deg, var(--cc-violation), var(--cc-violation) 3px, #b91c1c 3px, #b91c1c 6px)"
                        : "var(--cc-over)",
                      color: "#fff",
                      fontSize: "8.5px",
                      fontWeight: 800,
                      padding: "1.5px 4px",
                      borderRadius: "3px",
                      textTransform: "uppercase",
                      lineHeight: 1.1
                    }}
                  >
                    +{Math.round(((r.used - r.eff) / r.eff) * 100)}% {r.violation ? "!" : "OC"}
                  </span>
                )}
                <span>{Math.round(r.used)}/{Math.round(r.eff)}</span>
              </span>
            </div>
            <Meter frac={frac} over={r.over} />
          </div>
        );
      })}
    </div>
    <p className="cc-panel__hint cc-mono">Select a day for its breakdown →</p>
  </div>
);



/* ------------------------------------------------------------------ *
 * Ledger (table) view
 * ------------------------------------------------------------------ */
const Ledger: React.FC<{
  rows: any[]; effMax: (r: any) => number; allocsOf: (r: any) => any[];
  slots: Record<string, any>;
}> = ({ rows, effMax, allocsOf, slots }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllStagesForDate, setShowAllStagesForDate] = useState(false);

  const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const allPossibleStages = Object.values(ProjectStatus);

  const getProcessedRows = () => {
    if (!selectedDate) return sorted;
    const dateFiltered = sorted.filter(r => dateKeyOf(r.date) === selectedDate);
    if (!showAllStagesForDate) return dateFiltered;
    const existingStages = new Set(dateFiltered.map(r => r.stage));
    const result = [...dateFiltered];
    for (const stage of allPossibleStages) {
      if (!existingStages.has(stage)) {
        const templateRow = rows.find(r => r.stage === stage) || rows[0];
        if (templateRow) {
          result.push({
            ...templateRow,
            id: `${selectedDate}-${stage}-zero`,
            stage: stage,
            date: selectedDate,
            usedCapacity: 0,
            usedHours: 0,
            isZeroRow: true,
          });
        }
      }
    }
    return result.sort((a, b) => allPossibleStages.indexOf(a.stage) - allPossibleStages.indexOf(b.stage));
  };

  const finalRows = getProcessedRows();

  return (
    <div className="cc-ledger">
      <div className="cc-ledger__filters" style={{ 
        marginBottom: '1rem', 
        padding: '0.75rem', 
        background: 'var(--cc-inset)', 
        borderRadius: '6px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>Filter by date:</span>
          <select 
            value={selectedDate || ''} 
            onChange={(e) => {
              const newDate = e.target.value || null;
              setSelectedDate(newDate);
              setShowAllStagesForDate(!!newDate);
              setOpen({});
            }}
            style={{ 
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--cc-line)',
              background: 'var(--cc-surface)'
            }}
          >
            <option value="">All dates</option>
            {Array.from(new Set(rows.map(r => dateKeyOf(r.date)))).sort().map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </label>
        {selectedDate && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={showAllStagesForDate}
              onChange={(e) => {
                setShowAllStagesForDate(e.target.checked);
                setOpen({});
              }}
            />
            <span>Show all stages for this date (zero for missing)</span>
          </label>
        )}
      </div>

      <div className="cc-ledger__head cc-mono">
        <span>Date</span><span>Stage</span><span>Load</span><span>Effective</span><span>Hours</span><span>Lines</span>
      </div>
      <div className="cc-ledger__body">
        {finalRows.map((r, i) => {
          const eff = effMax(r);
          const frac = r.isZeroRow ? 0 : dayFrac(r);
          const over = r.isZeroRow ? false : rowOver(r);
          const allocs = r.isZeroRow ? [] : allocsOf(r);
          const lot = slots[r.stage] || {};
          const d = dateFromKey(dateKeyOf(r.date));
          const isOpen = !!open[r.id];
          const isZeroRow = r.isZeroRow;
          const isDesign = r.stage === CapacityStage.DESIGN;

          return (
            <React.Fragment key={r.id}>
              <div
                className={`cc-lrow ${isZeroRow ? 'cc-lrow--zero' : ''}`}
                style={{ 
                  animationDelay: `${i * 6}ms`,
                  opacity: isZeroRow ? 0.6 : 1,
                  backgroundColor: isZeroRow ? 'var(--cc-inset)' : 'transparent',
                  cursor: isZeroRow ? 'default' : 'pointer',
                }}
                onClick={() => !isZeroRow && setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
              >
                <span className="cc-lrow__date">
                  <span>{d.toLocaleDateString()}</span>
                  <span className="cc-lrow__e cc-mono">{ethLabel(d)}</span>
                </span>
                <span className="cc-lrow__stage">
                  <span className="cc-dot" style={{ background: STAGE_META[r.stage as CapacityStage]?.color || '#999' }} />
                  {stageName(r.stage)}
                  {isZeroRow && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--cc-dim)' }}>(zero)</span>}
                </span>
                <span className="cc-lrow__load">
                  <Meter frac={frac} over={over} thin />
                  <b className="cc-mono" style={{ color: isZeroRow ? 'var(--cc-dim)' : heatVar(frac, over) }}>
                    {isZeroRow ? '0%' : clampPct(frac * 100)}
                  </b>
                </span>
                <span className="cc-mono cc-lrow__eff">
                  {Math.round(r.usedCapacity || 0)}/{Math.round(eff)}
                  {(lot.parallelSlots || 1) > 1 && <i className="cc-x2">×{lot.parallelSlots}</i>}
                </span>
                <span className="cc-mono">
                  {(r.usedHours || 0).toFixed(1)}/{dayHoursOf(r).toFixed(1)}
                </span>
                <span className="cc-mono cc-lrow__lines">
                  {allocs.length}
                  {over && isDesign && <span className="cc-lrow__flag">OVER</span>}
                </span>
              </div>
              {isOpen && !isZeroRow && (
                <div className="cc-lexpand">
                  {allocs.length === 0 ? (
                    <p className="cc-allocs__empty cc-mono">No allocation lines.</p>
                  ) : (
                    allocs.map((a: any) => (
                      <div key={a.id} className="cc-alloc cc-alloc--wide">
                        <span className="cc-alloc__proj">
                          {a.projectStage?.project?.invoice?.piNumber || 
                           a.projectStage?.project?.customer?.name || "—"}
                        </span>
                        <span className="cc-alloc__u cc-mono">
                          {a.allocatedUnits} units · {a.allocatedHours} h
                        </span>
                        <span className="cc-mono cc-alloc__date">
                          {new Date(a.allocationDate).toLocaleDateString()}
                        </span>
                        {a.isOverCapacity
                          ? <span className="cc-alloc__over">OVER CAPACITY</span>
                          : <span className="cc-alloc__ok">ALLOCATED</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Scoped styles — Production Control Board
 * ------------------------------------------------------------------ */
const CC_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

.capcal{
  --cc-display:'Inter',ui-sans-serif,system-ui,sans-serif;
  --cc-mono:'DM Mono',ui-monospace,SFMono-Regular,monospace;
  --cc-idle: hsl(var(--muted-foreground)/.35);
  --cc-low:#14b8a6; --cc-med:#f59e0b; --cc-high:#f97316; --cc-crit:#ef4444; --cc-over:#dc2626;
  /* >125% breach of the hard ceiling — deliberately alarming + distinct from the
     allowed 100–125% overcapacity band (--cc-over). */
  --cc-violation:#7f1d1d;
  --cc-line: hsl(var(--border));
  --cc-ink: hsl(var(--foreground));
  --cc-dim: hsl(var(--muted-foreground));
  --cc-surface: hsl(var(--card));
  --cc-inset: hsl(var(--muted)/.4);
  font-family:var(--cc-display);
  color:var(--cc-ink);
  display:flex; flex-direction:column; gap:16px;
}
.capcal .cc-mono{font-family:var(--cc-mono);font-feature-settings:"tnum" 1;letter-spacing:-.02em;}

/* Masthead */
.capcal .cc-mast{position:relative;overflow:hidden;border:1px solid var(--cc-line);border-radius:14px;
  background:linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/.5));padding:22px 24px;}
.capcal .cc-mast__grid{position:absolute;inset:0;opacity:.5;pointer-events:none;
  background-image:linear-gradient(var(--cc-line) 1px,transparent 1px),linear-gradient(90deg,var(--cc-line) 1px,transparent 1px);
  background-size:26px 26px;mask-image:radial-gradient(120% 120% at 100% 0,#000,transparent 70%);}
.capcal .cc-mast__row{position:relative;display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;}
.capcal .cc-eyebrow{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-mono);font-size:10.5px;
  letter-spacing:.22em;color:var(--cc-dim);}
.capcal .cc-title{font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1.02;margin:6px 0 4px;}
.capcal .cc-sub{font-size:13px;color:var(--cc-dim);max-width:46ch;}
.capcal .cc-sub .cc-mono{font-size:11.5px;color:var(--cc-low);}
.capcal .cc-mast__meta{display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.capcal .cc-stamp{display:flex;flex-direction:column;align-items:flex-end;border-left:2px solid var(--cc-low);padding-left:12px;}
.capcal .cc-stamp__k{font-family:var(--cc-mono);font-size:10px;letter-spacing:.2em;color:var(--cc-dim);}
.capcal .cc-stamp__v{font-size:18px;font-weight:600;}
.capcal .cc-stamp__e{font-size:11px;color:var(--cc-dim);}
.capcal .cc-actions{display:flex;gap:8px;}
.capcal .cc-btn{font-family:var(--cc-display);gap:6px;border-radius:9px;}
.capcal .cc-btn--danger{background:transparent;border:1px solid color-mix(in srgb,var(--cc-over) 50%,transparent);color:var(--cc-over);}
.capcal .cc-btn--danger:hover{background:color-mix(in srgb,var(--cc-over) 12%,transparent);}
.capcal .cc-spin{animation:cc-rot 1s linear infinite;}
@keyframes cc-rot{to{transform:rotate(360deg)}}

.capcal .cc-error{display:flex;align-items:center;gap:10px;border:1px solid color-mix(in srgb,var(--cc-over) 40%,transparent);
  background:color-mix(in srgb,var(--cc-over) 8%,transparent);color:var(--cc-over);padding:12px 16px;border-radius:11px;font-size:13px;}

/* Telemetry */
/* Telemetry header */
.capcal .cc-telemetry-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4px;}
.capcal .cc-telemetry-header__left{display:flex;align-items:center;gap:8px;}
.capcal .cc-range-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-mono);
  font-size:11.5px;font-weight:600;color:var(--cc-low);padding:5px 12px;border-radius:8px;
  background:linear-gradient(135deg,color-mix(in srgb,var(--cc-low) 10%,transparent),color-mix(in srgb,var(--cc-low) 4%,transparent));
  border:1px solid color-mix(in srgb,var(--cc-low) 22%,transparent);letter-spacing:.01em;}
.capcal .cc-range-badge svg{opacity:.7;flex:none;}

/* Shared select wrapper */
.capcal .cc-select-wrap{position:relative;display:inline-flex;align-items:center;}
.capcal .cc-select-wrap__icon{position:absolute;left:10px;color:var(--cc-dim);pointer-events:none;
  z-index:1;flex:none;transition:color .18s;}
.capcal .cc-select-wrap:hover .cc-select-wrap__icon{color:var(--cc-ink);}
.capcal .cc-stats-select,.capcal .cc-rail-select{font-family:var(--cc-mono);font-size:11.5px;
  padding:7px 12px 7px 30px;border-radius:9px;border:1px solid var(--cc-line);
  background:var(--cc-surface);color:var(--cc-ink);cursor:pointer;outline:none;
  appearance:auto;transition:border-color .18s,box-shadow .18s;}
.capcal .cc-stats-select:hover,.capcal .cc-rail-select:hover{border-color:var(--cc-dim);
  background:color-mix(in srgb,var(--cc-inset) 60%,var(--cc-surface));}
.capcal .cc-stats-select:focus,.capcal .cc-rail-select:focus{border-color:var(--cc-low);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--cc-low) 14%,transparent);}
.capcal .cc-rail-select{width:100%;}

/* Telemetry */
.capcal .cc-telemetry{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
@media(max-width:880px){.capcal .cc-telemetry{grid-template-columns:repeat(2,1fr);}}
.capcal .cc-tile{border:1px solid var(--cc-line);border-radius:12px;background:var(--cc-surface);padding:14px 16px;
  display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden;animation:cc-rise .5s both;}
.capcal .cc-tile--danger{border-color:color-mix(in srgb,var(--cc-over) 45%,var(--cc-line));}
.capcal .cc-tile__head{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.04em;color:var(--cc-dim);text-transform:uppercase;}
.capcal .cc-tile__ic{display:inline-flex;color:var(--cc-low);}
.capcal .cc-tile--danger .cc-tile__ic{color:var(--cc-over);}
.capcal .cc-tile__val{font-size:30px;font-weight:500;line-height:1;}
.capcal .cc-tile__foot{font-size:10.5px;color:var(--cc-dim);}

/* Meters */
.capcal .cc-track{height:8px;border-radius:99px;background:var(--cc-inset);overflow:hidden;}
.capcal .cc-track--thin{height:5px;}
.capcal .cc-fill{height:100%;border-radius:99px;transition:width .7s cubic-bezier(.16,1,.3,1);}

/* Controls */
.capcal .cc-controls{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:center;}
.capcal .cc-chips{display:flex;gap:6px;flex-wrap:wrap;}
.capcal .cc-chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-mono);font-size:11px;
  padding:6px 11px;border-radius:8px;border:1px solid var(--cc-line);background:var(--cc-surface);color:var(--cc-dim);
  cursor:pointer;transition:.18s;letter-spacing:.02em;}
.capcal .cc-chip:hover{color:var(--cc-ink);border-color:var(--cc-dim);}
.capcal .cc-chip.is-on{background:var(--cc-ink);color:hsl(var(--background));border-color:var(--cc-ink);}
.capcal .cc-chip.is-on .cc-dot{box-shadow:0 0 0 2px hsl(var(--background));}
.capcal .cc-dot{width:8px;height:8px;border-radius:99px;display:inline-block;flex:none;}
.capcal .cc-right{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.capcal .cc-legend{display:flex;gap:10px;}
.capcal .cc-legend__i{display:inline-flex;align-items:center;gap:5px;font-family:var(--cc-mono);font-size:10px;color:var(--cc-dim);letter-spacing:.06em;}
.capcal .cc-legend__i i{width:10px;height:10px;border-radius:3px;}
.capcal .cc-seg{display:inline-flex;border:1px solid var(--cc-line);border-radius:9px;overflow:hidden;background:var(--cc-surface);}
.capcal .cc-seg button{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-display);font-size:12.5px;
  padding:7px 13px;border:0;background:transparent;color:var(--cc-dim);cursor:pointer;transition:.18s;}
.capcal .cc-seg button.is-on{background:var(--cc-ink);color:hsl(var(--background));}

/* Stage layout: board + rail */
/* Stage layout — calendar takes full width, rail is in a Sheet */


/* Board */
.capcal .cc-board{border:1px solid var(--cc-line);border-radius:14px;background:var(--cc-surface);padding:14px;}
.capcal .cc-board__head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.capcal .cc-monthnav{display:flex;align-items:center;gap:10px;}
.capcal .cc-monthnav button{width:30px;height:30px;border-radius:8px;border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-ink);cursor:pointer;display:grid;place-items:center;transition:.18s;}
.capcal .cc-monthnav button:hover{background:var(--cc-inset);}
.capcal .cc-monthnav__label{display:flex;flex-direction:column;line-height:1.05;min-width:160px;text-align:center;}
.capcal .cc-month{font-size:18px;font-weight:600;letter-spacing:-.01em;}
.capcal .cc-month__e{font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-today{font-family:var(--cc-mono);font-size:11px;letter-spacing:.08em;padding:7px 13px;border-radius:8px;
  border:1px solid var(--cc-line);background:transparent;color:var(--cc-dim);cursor:pointer;transition:.18s;}
.capcal .cc-today--dated{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 16px;line-height:1.3;}
.capcal .cc-today--dated span:first-child{font-size:12px;font-weight:700;color:var(--cc-ink);letter-spacing:.04em;}
.capcal .cc-today__ec{font-size:10px;font-weight:600;opacity:.75;}
.capcal .cc-today:hover{color:var(--cc-ink);border-color:var(--cc-dim);}
.capcal .cc-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;}
.capcal .cc-dow span{font-family:var(--cc-mono);font-size:10px;letter-spacing:.12em;color:var(--cc-dim);text-align:center;padding:2px 0;}
.capcal .cc-dow .cc-dow--off{color:color-mix(in srgb,var(--cc-dim) 55%,transparent);}
.capcal .cc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.capcal .cc-cell{min-height:128px;border:1px solid var(--cc-line);border-radius:10px;background:var(--cc-surface);
  padding:7px;display:flex;flex-direction:column;gap:4px;text-align:left;cursor:default;position:relative;overflow:hidden;
  transition:transform .18s,box-shadow .18s,border-color .18s;animation:cc-rise .4s both;}
.capcal .cc-cell--active{cursor:pointer;}
.capcal .cc-cell--active:hover{transform:translateY(-2px);box-shadow:0 8px 22px -10px color-mix(in srgb,var(--heat) 60%,transparent);
  border-color:color-mix(in srgb,var(--heat) 55%,var(--cc-line));z-index:2;}
.capcal .cc-cell--out{opacity:.4;}
.capcal .cc-cell--off{background-image:repeating-linear-gradient(45deg,transparent,transparent 6px,var(--cc-inset) 6px,var(--cc-inset) 7px);}
.capcal .cc-cell--today{border-color:var(--cc-ink);box-shadow:inset 0 0 0 1px var(--cc-ink);}
.capcal .cc-cell--sel{border-color:var(--heat);box-shadow:0 0 0 2px color-mix(in srgb,var(--heat) 45%,transparent);z-index:3;}
.capcal .cc-cell__top{display:flex;justify-content:space-between;align-items:center;gap:4px;}
.capcal .cc-cell__dates{display:inline-flex;align-items:baseline;gap:5px;min-width:0;}
.capcal .cc-cell__d{font-size:14px;font-weight:600;color:var(--cc-ink);}
.capcal .cc-cell--out .cc-cell__d{color:var(--cc-dim);font-weight:400;}
.capcal .cc-cell__ed{font-size:11px;font-weight:800;color:var(--cc-low);line-height:1;}
.capcal .cc-cell__peak{font-size:10px;font-weight:800;color:#fff;line-height:1.55;padding:0 6px;border-radius:6px;
  display:inline-flex;align-items:center;gap:2px;box-shadow:0 1px 2px rgba(0,0,0,.2);}
.capcal .cc-cell__bang{font-weight:800;}
.capcal .cc-cell__proj{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:800;color:var(--cc-ink);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.capcal .cc-cell__projmore{font-size:9px;font-weight:500;color:var(--cc-dim);flex:none;}
.capcal .cc-cell__bars{display:flex;flex-direction:column;gap:3px;margin-top:auto;}
.capcal .cc-cell__pgroup{display:flex;flex-direction:column;gap:3px;}
.capcal .cc-cell__pdiv{display:flex;align-items:center;gap:0;font-size:8.5px;font-weight:700;color:#000;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1;}
.capcal .cc-cell__pdiv::before,.capcal .cc-cell__pdiv::after{content:'';flex:1;min-width:6px;height:1px;background:#000;border-radius:1px;}
.capcal .cc-cell__pdiv::before{margin-right:5px;}
.capcal .cc-cell__pdiv::after{margin-left:5px;}
.capcal .cc-cell__pdiv span{flex:none;max-width:80%;overflow:hidden;text-overflow:ellipsis;}
.capcal .cc-cell__row{position:relative;display:flex;align-items:center;gap:5px;height:18px;padding:0 6px;border-radius:5px;
  border:1px solid color-mix(in srgb,var(--stage-color) 52%,transparent);
  background:color-mix(in srgb,var(--stage-color) 7%,var(--cc-inset));overflow:hidden;}
.capcal .cc-cell__rowfill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;opacity:.34;transition:width .7s cubic-bezier(.16,1,.3,1);}
.capcal .cc-cell__rowdot{position:relative;width:5px;height:5px;border-radius:99px;flex:none;}
.capcal .cc-cell__rowabbr{position:relative;font-size:9px;letter-spacing:0;font-weight:700;color:var(--cc-ink);
  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.capcal .cc-cell__rowpct{position:relative;margin-left:auto;font-size:9.5px;font-weight:700;color:var(--cc-ink);}
.capcal .cc-cell__more{font-size:9px;color:var(--cc-dim);align-self:flex-start;padding:1px 5px;border-radius:5px;
  border:1px dashed var(--cc-line);background:var(--cc-surface);}
@media(max-width:760px){
  .capcal .cc-cell{min-height:60px;}
  .capcal .cc-cell__bars{display:none;}
  .capcal .cc-cell__peak{font-size:11px;}
}
@keyframes cc-pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes cc-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}

/* Panel / rail / detail */
.capcal .cc-rail{position:sticky;top:12px;}
.capcal .cc-panel{border:1px solid var(--cc-line);border-radius:14px;background:var(--cc-surface);overflow:hidden;animation:cc-rise .4s both;}
[data-slot="sheet-content"] .capcal .cc-panel{border:0;border-radius:0;}
.capcal .cc-panel__head{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid var(--cc-line);
  font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--cc-dim);}
.capcal .cc-panel__head svg{color:var(--cc-low);}
.capcal .cc-railscroll{padding:10px 12px;display:flex;flex-direction:column;gap:10px;max-height:520px;overflow:auto;}
.capcal .cc-railrow__top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
.capcal .cc-railrow__name{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:500;}
.capcal .cc-railrow__val{font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-panel__hint{padding:0 12px 10px;font-size:10px;color:var(--cc-dim);}
.capcal .cc-rail-range{padding:8px 12px;border-bottom:1px solid var(--cc-line);}
.capcal .cc-rail-range .cc-select-wrap{width:100%;}


/* Ledger */
.capcal .cc-ledger{border:1px solid var(--cc-line);border-radius:14px;background:var(--cc-surface);overflow:hidden;}
.capcal .cc-ledger__head,.capcal .cc-lrow{display:grid;grid-template-columns:1.3fr 1fr 1.4fr .9fr .9fr .7fr;gap:12px;align-items:center;padding:11px 16px;}
.capcal .cc-ledger__head{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--cc-dim);border-bottom:1px solid var(--cc-line);background:var(--cc-inset);}
.capcal .cc-lrow{border-bottom:1px solid var(--cc-line);cursor:pointer;transition:background .15s;animation:cc-rise .4s both;font-size:13px;}
.capcal .cc-lrow:hover{background:var(--cc-inset);}
.capcal .cc-lrow__date{display:flex;flex-direction:column;line-height:1.15;}
.capcal .cc-lrow__e{font-size:10px;color:var(--cc-dim);}
.capcal .cc-lrow__stage{display:inline-flex;align-items:center;gap:7px;font-weight:500;}
.capcal .cc-lrow__load{display:flex;align-items:center;gap:9px;}
.capcal .cc-lrow__load .cc-track{flex:1;}
.capcal .cc-lrow__load b{font-size:11px;min-width:38px;text-align:right;}
.capcal .cc-lrow__eff .cc-x2{color:var(--cc-low);font-style:normal;margin-left:4px;font-size:10px;}
.capcal .cc-lrow__lines{display:flex;align-items:center;gap:7px;}
.capcal .cc-lrow__flag{font-size:9px;letter-spacing:.05em;color:#fff;background:var(--cc-over);padding:1px 5px;border-radius:4px;}
.capcal .cc-lexpand{padding:10px 16px 14px;background:var(--cc-inset);border-bottom:1px solid var(--cc-line);display:flex;flex-direction:column;gap:6px;}
.capcal .cc-alloc--wide{grid-template-columns:none;}
.capcal .cc-alloc__date{color:var(--cc-dim);font-size:10.5px;}

/* States */
.capcal .cc-skeleton,.capcal .cc-empty{border:1px dashed var(--cc-line);border-radius:14px;background:var(--cc-surface);
  padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--cc-dim);text-align:center;}
.capcal .cc-empty h3{font-size:16px;font-weight:600;color:var(--cc-ink);}
.capcal .cc-empty p{font-size:13px;max-width:40ch;}
.capcal .cc-spinner{width:34px;height:34px;border-radius:99px;border:2px solid var(--cc-inset);border-top-color:var(--cc-low);animation:cc-rot .8s linear infinite;}

/* Modal dialog — enhanced */
.capcal .cc-modal{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:20px;font-family:var(--cc-display);}
.capcal .cc-modal__scrim{position:absolute;inset:0;background:rgba(8,10,18,.58);backdrop-filter:blur(5px);animation:cc-fade .22s both;}
.capcal .cc-modal__card{position:relative;width:min(600px,100%);max-height:88vh;display:flex;flex-direction:column;
  background:#ffffff;border:1px solid var(--cc-line);border-radius:18px;overflow:hidden;
  box-shadow:0 40px 100px -28px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04);animation:cc-pop .28s cubic-bezier(.16,1,.3,1) both;}
@keyframes cc-fade{from{opacity:0}to{opacity:1}}
@keyframes cc-pop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}

/* Header */
.capcal .cc-modal__head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 22px;
  border-bottom:1px solid var(--cc-line);background:linear-gradient(145deg,#ffffff,#f4f5f8);}
.capcal .cc-modal__head-left{display:flex;align-items:center;gap:12px;min-width:0;}
.capcal .cc-modal__ic{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;flex:none;
  background:linear-gradient(135deg,color-mix(in srgb,var(--cc-low) 20%,transparent),color-mix(in srgb,var(--cc-low) 8%,transparent));
  color:var(--cc-low);border:1px solid color-mix(in srgb,var(--cc-low) 25%,transparent);}
.capcal .cc-modal__date-block{display:flex;flex-direction:column;gap:1px;min-width:0;}
.capcal .cc-modal__weekday{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--cc-low);font-weight:700;}
.capcal .cc-modal__fulldate{font-size:15px;font-weight:700;color:var(--cc-ink);letter-spacing:-.02em;line-height:1.2;}
.capcal .cc-modal__ethdate{font-size:10.5px;color:var(--cc-dim);line-height:1.3;}
.capcal .cc-modal__head-right{display:flex;align-items:center;gap:10px;flex:none;}
.capcal .cc-modal__dayutil{display:flex;flex-direction:column;align-items:center;padding:6px 14px;border-radius:10px;
  background:color-mix(in srgb,var(--util-heat) 12%,transparent);border:1px solid color-mix(in srgb,var(--util-heat) 30%,transparent);}
.capcal .cc-modal__dayutil-val{font-size:18px;font-weight:800;line-height:1;color:var(--util-heat);}
.capcal .cc-modal__dayutil-label{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--cc-dim);font-weight:600;}
.capcal .cc-modal__close{width:28px;height:28px;border-radius:8px;border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-dim);cursor:pointer;font-size:12px;display:grid;place-items:center;transition:.18s;}
.capcal .cc-modal__close:hover{color:var(--cc-ink);background:var(--cc-inset);border-color:var(--cc-dim);}

/* Stats tiles */
.capcal .cc-modal__stats{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--cc-line);}
.capcal .cc-modal__stat{padding:14px 16px;display:flex;flex-direction:column;gap:4px;
  border-right:1px solid var(--cc-line);background:#ffffff;position:relative;overflow:hidden;}
.capcal .cc-modal__stat:last-child{border-right:0;}
.capcal .cc-modal__stat-num{font-size:24px;font-weight:600;line-height:1;color:var(--cc-ink);}
.capcal .cc-modal__stat-label{font-size:8.5px;letter-spacing:.14em;color:var(--cc-dim);font-weight:600;}

/* Body */
.capcal .cc-modal__body{padding:20px 22px;overflow:auto;display:flex;flex-direction:column;gap:24px;background:#ffffff;}
.capcal .cc-modal__body .cc-detail__body{max-height:none;overflow:visible;padding:0;}

/* Section titles */
.capcal .cc-modal__sec-title{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--cc-dim);margin-bottom:12px;padding-bottom:8px;
  border-bottom:1px solid var(--cc-line);font-weight:600;}
.capcal .cc-modal__sec-title svg{color:var(--cc-low);flex:none;}
.capcal .cc-modal__section{}

/* Project groups in modal */
.capcal .cc-modal__pgroup{display:flex;flex-direction:column;gap:14px;}
.capcal .cc-modal__pgroup+.cc-modal__pgroup{margin-top:8px;}
.capcal .cc-modal__pdiv{display:flex;align-items:center;gap:0;font-size:12px;font-weight:700;color:#000;line-height:1;padding:2px 0;}
.capcal .cc-modal__pdiv::before,.capcal .cc-modal__pdiv::after{content:'';flex:1;min-width:10px;height:1px;background:#000;}
.capcal .cc-modal__pdiv::before{margin-right:8px;}
.capcal .cc-modal__pdiv::after{margin-left:8px;}
.capcal .cc-modal__pgroup .cc-detail__stage:first-of-type{border-top:0;padding-top:0;}

/* Project cards */
.capcal .cc-projlist{display:flex;flex-direction:column;gap:8px;}
.capcal .cc-proj{border:1px solid var(--cc-line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:9px;
  background:var(--cc-inset);position:relative;overflow:hidden;transition:border-color .18s,box-shadow .18s;}
.capcal .cc-proj:hover{border-color:var(--cc-dim);box-shadow:0 2px 8px -2px rgba(0,0,0,.1);}
.capcal .cc-proj__top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}
.capcal .cc-proj__id{display:flex;flex-direction:column;min-width:0;gap:2px;}
.capcal .cc-proj__pi{font-size:14.5px;font-weight:700;letter-spacing:-.01em;color:var(--cc-ink);}
.capcal .cc-proj__cust{font-size:11.5px;color:var(--cc-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.capcal .cc-proj__badges{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;}
.capcal .cc-badge{font-family:var(--cc-mono);font-size:9px;letter-spacing:.05em;padding:3px 7px;border-radius:6px;
  border:1px solid var(--cc-line);color:var(--cc-dim);white-space:nowrap;background:#ffffff;transition:.18s;}
.capcal .cc-proj__meta{display:flex;justify-content:space-between;gap:10px;font-size:10.5px;color:var(--cc-dim);flex-wrap:wrap;}

/* Stage detail cards */
.capcal .cc-detail__body{padding:6px 0;display:flex;flex-direction:column;gap:14px;}
.capcal .cc-detail__stage{padding:12px 14px;border:1px solid var(--cc-line);border-radius:11px;
  background:#ffffff;position:relative;overflow:hidden;}
.capcal .cc-detail__stage::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
  background:var(--stage-accent,var(--cc-dim));border-radius:0 3px 3px 0;}
.capcal .cc-detail__stageHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.capcal .cc-pill{font-family:var(--cc-mono);font-size:11px;padding:3px 10px;border-radius:8px;
  background:var(--cc-inset);color:var(--cc-ink);font-weight:600;}
.capcal .cc-pill--over{background:color-mix(in srgb,var(--cc-over) 18%,transparent);color:var(--cc-over);}
.capcal .cc-detail__nums{display:flex;justify-content:space-between;font-size:10.5px;color:var(--cc-dim);margin-top:6px;}
.capcal .cc-detail__over{margin-top:6px;font-size:10.5px;color:var(--cc-over);}

/* Alloc lines */
.capcal .cc-allocs{margin-top:9px;display:flex;flex-direction:column;gap:5px;}
.capcal .cc-allocs__empty{font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-alloc{display:flex;align-items:center;gap:8px;font-size:11.5px;background:var(--cc-inset);border-radius:8px;padding:7px 10px;
  border:1px solid transparent;transition:border-color .15s;}
.capcal .cc-alloc:hover{border-color:var(--cc-line);}
.capcal .cc-alloc__projwrap{display:flex;flex-direction:column;min-width:0;flex:1;}
.capcal .cc-alloc__proj{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.capcal .cc-alloc__cust{font-size:10px;color:var(--cc-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.capcal .cc-alloc__u{font-size:10.5px;color:var(--cc-dim);flex:none;}
.capcal .cc-alloc__over{font-family:var(--cc-mono);font-size:9px;letter-spacing:.06em;color:#fff;background:var(--cc-over);padding:2px 6px;border-radius:5px;}
.capcal .cc-alloc__ok{font-family:var(--cc-mono);font-size:9px;letter-spacing:.06em;color:var(--cc-low);}


/* Drag-and-drop */
.capcal .cc-cell__row--draggable{cursor:grab;transition:box-shadow .15s,transform .15s;}
.capcal .cc-cell__row--draggable:hover{box-shadow:0 2px 8px -2px rgba(0,0,0,.15);transform:translateY(-1px);}
.capcal .cc-cell__grip{position:relative;color:var(--cc-dim);flex:none;opacity:.35;transition:opacity .15s;}
.capcal .cc-cell__row--draggable:hover .cc-cell__grip{opacity:.8;}
.capcal .cc-drag-overlay{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:10px;
  background:#ffffff;border:1px solid var(--cc-line);box-shadow:0 12px 32px -8px rgba(0,0,0,.28);
  font-size:12px;font-weight:600;color:var(--cc-ink);white-space:nowrap;pointer-events:none;z-index:999;}
.capcal .cc-drag-overlay__dot{width:8px;height:8px;border-radius:99px;flex:none;}
.capcal .cc-drag-overlay__label{letter-spacing:-.01em;}
.capcal .cc-reschedule-overlay{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;gap:10px;
  background:rgba(255,255,255,.72);backdrop-filter:blur(3px);border-radius:14px;font-size:14px;font-weight:600;color:var(--cc-ink);pointer-events:none;}

/* Dark-mode nudges */
.dark .capcal .cc-cell--today{box-shadow:inset 0 0 0 1px hsl(var(--foreground)/.7);}
.dark .capcal .cc-modal__scrim{background:rgba(0,0,0,.72);}
.dark .capcal .cc-modal__card{background:#0c0e14;}
.dark .capcal .cc-modal__head{background:linear-gradient(145deg,#13161d,#0c0e14);}
.dark .capcal .cc-modal__stat,.dark .capcal .cc-modal__body{background:#0c0e14;}
.dark .capcal .cc-detail__stage{background:#13161d;}
.dark .capcal .cc-badge{background:#13161d;}
.dark .capcal .cc-modal__pdiv{color:#e8eaed;}
.dark .capcal .cc-modal__pdiv::before,.dark .capcal .cc-modal__pdiv::after{background:#e8eaed;}
.dark .capcal .cc-drag-overlay{background:#1a1d26;border-color:#2a2d36;color:#e8eaed;}
.dark .capcal .cc-reschedule-overlay{background:rgba(12,14,20,.72);}
`;

export default CapacityCalendar;
