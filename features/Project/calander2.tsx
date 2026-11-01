/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  type DragMoveEvent,
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
  rebuildCapacity,
  getCapacityCalendar,
  getCalendarRowAllocations,
  type CapacityCalendarResponse,
  type CapacityLedgerRow,
  type CapacityLoadLevel,
} from "@/service/Category";
import { rescheduleProjectFromCalendar } from "@/service/Project";
import { ProjectStatus } from "@/models/Projects";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
// Ethiopian calendar rendering lives in lib/format.ts — the single copy shared
// by every screen, so a fix to the conversion cannot reach only some of them.
import { gregorianToEthiopian, formatDateEth as ethLabel } from '@/lib/format';


/* ------------------------------------------------------------------ *
 * Constants & Ethiopian calendar helpers
 * ------------------------------------------------------------------ */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

// FIX: Add safe stageName function with error handling
const stageName = (s: string | undefined) => {
  if (!s) return "Unknown Stage";
  return s.replace(/_/g, " ");
};

// Overcapacity model (mirror of backend config.js OVERCAPACITY_FACTOR). A manual
// reschedule may pack a stage's day up to 125% of base; above that is a VIOLATION
// of the hard ceiling and is rendered distinctly.
const OVERCAPACITY_FACTOR = 1.25;
const MAX_OC_BAND = OVERCAPACITY_FACTOR - 1.0; // 0.25 — the allowed 100→125% band

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

// Colour of each load level the API returns (same bands as heatVar)
const LEVEL_VAR: Record<CapacityLoadLevel, string> = {
  VIOLATION: "var(--cc-violation)",
  OVER: "var(--cc-over)",
  CRIT: "var(--cc-crit)",
  HIGH: "var(--cc-high)",
  MED: "var(--cc-med)",
  LOW: "var(--cc-low)",
  IDLE: "var(--cc-idle)",
};

const dateFromKey = (key: string) => new Date(`${key}T12:00:00`);
const keyOf = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Filters in the URL use the stage chip abbreviations (?stage=CNC)
const stageFromAbbr = (abbr: string | null): CapacityStage | "ALL" =>
  (STAGE_ORDER.find((s) => STAGE_META[s].abbr === abbr) as CapacityStage | undefined) || "ALL";

const parseMonth = (value: string | null) => {
  const m = /^(\d{4})-(\d{2})$/.exec(value || "");
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { y: Number(m[1]), m: Number(m[2]) - 1 };
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() };
};
const monthParam = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;

/* ------------------------------------------------------------------ *
 * Small presentational pieces
 * ------------------------------------------------------------------ */
/** Dialog shown on drag: choose how many of the cell's units to reschedule.
 *  Default = all (whole-phase move); reducing it does a stage-specific partial move. */
const RescheduleQuantityDialog: React.FC<{
  pending: { projectLabel: string; stage: string; sourceDate: string; targetDate: string; cellUnits: number; pastCellMove?: boolean };
  busy?: boolean;
  onConfirm: (units: number) => void;
  onCancel: () => void;
}> = ({ pending, busy, onConfirm, onCancel }) => {
  // FIX: Add safe access with fallbacks
  const max = Math.round((pending?.cellUnits || 0) * 100) / 100;
  const [val, setVal] = useState<number>(max);
  useEffect(() => { setVal(max); }, [max]);
  const clamp = (n: number) => Math.max(0, Math.min(Number.isFinite(n) ? n : 0, max));
  const isAll = val >= max - 1e-6;
  
  // FIX: Safe stage name with fallback
  const stageDisplay = pending?.stage ? stageName(pending.stage) : "Unknown Stage";
  const projectDisplay = pending?.projectLabel || "Unknown Project";
  
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Reschedule {stageDisplay} — {projectDisplay}</DialogTitle>
          <DialogDescription>
            {pending?.sourceDate || "Unknown"} → {pending?.targetDate || "Unknown"}. Choose how many of this day&apos;s {max} unit(s) to move.
            {pending?.pastCellMove
              ? "Moving back: moving all also moves the parallel stage's cell; a partial move moves only this stage. Downstream is untouched."
              : "Moving all also shifts the parallel stage; a partial move shifts only this stage. Downstream adjusts either way."}
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
  const [data, setData] = useState<CapacityCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [view, setView] = useState<"board" | "ledger">("board");

  // Month and filters live in the URL (?month=2026-10&stage=CNC&pi=&customer=)
  // so refresh and shared links keep the same view.
  const [urlState, setUrl] = useQueryStates(
    {
      month: parseAsString,
      stage: parseAsString,
      pi: parseAsString,
      customer: parseAsString,
    },
    { history: "replace" }
  );
  const cursor = useMemo(() => parseMonth(urlState.month), [urlState.month]);
  const setCursor = useCallback(
    (c: { y: number; m: number }) => { setUrl({ month: monthParam(c.y, c.m) }); },
    [setUrl]
  );
  const stage = stageFromAbbr(urlState.stage);
  const setStage = (s: CapacityStage | "ALL") => {
    setUrl({ stage: s === "ALL" ? null : STAGE_META[s].abbr });
  };
  const piQuery = urlState.pi || "";
  const customerQuery = urlState.customer || "";

  // The text boxes update immediately; the URL (and the API call) follow
  // once typing pauses for 400 ms.
  const [piFilter, setPiFilter] = useState<string>(piQuery);
  const [customerFilter, setCustomerFilter] = useState<string>(customerQuery);
  useEffect(() => {
    const pi = piFilter.trim();
    const customer = customerFilter.trim();
    if (pi === piQuery && customer === customerQuery) return;
    const timer = setTimeout(() => {
      setUrl({ pi: pi || null, customer: customer || null });
    }, 400);
    return () => clearTimeout(timer);
  }, [piFilter, customerFilter, piQuery, customerQuery, setUrl]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [railRange, setRailRange] = useState<string>("today");
  const [statsRange, setStatsRange] = useState<string>("today");
  const [isChangingMonth, setIsChangingMonth] = useState(false);
  const router = useRouter();

  // Auto-scroll for drag with month navigation
  const boardRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const monthChangeCooldown = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
// Add this ref with your other refs
const dragDataRef = useRef<any>(null);
  // Track mouse position globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with input fields
      }
      
      if (e.key === 'ArrowLeft') {
        changeMonth(-1);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        changeMonth(1);
        e.preventDefault();
      } else if (e.key === 't' || e.key === 'T') {
        goToToday();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursor]);

  const changeMonth = useCallback((delta: number) => {
    setIsChangingMonth(true);
    const newDate = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: newDate.getFullYear(), m: newDate.getMonth() });
    setTimeout(() => setIsChangingMonth(false), 300);
  }, [cursor, setCursor]);

  const goToToday = useCallback(() => {
    setIsChangingMonth(true);
    const n = new Date();
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
    setTimeout(() => setIsChangingMonth(false), 300);
  }, [setCursor]);

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
    pastCellMove?: boolean;
  } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  

const handleDragStart = useCallback((event: DragStartEvent) => {
  const data = event.active.data.current;
  console.log('🟢 [DragStart] Data:', data);
  
  // Store in ref to preserve during month changes
  dragDataRef.current = data;
  
  setActiveDrag({ id: String(event.active.id), data });
  setIsDragging(true);
}, []);

  // Handle drag move for auto-scroll handleDragEnd and month navigation
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!boardRef.current) return;
    
    // Use the tracked mouse position
    const clientX = mousePositionRef.current.x;
    const clientY = mousePositionRef.current.y;
    const rect = boardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const edgeThreshold = 80;
    
    // Clear any existing interval
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
    
    // === GOOGLE CALENDAR STYLE MONTH NAVIGATION ===
    const isLeftOutside = clientX < edgeThreshold;
    const isRightOutside = clientX > viewportWidth - edgeThreshold;
    
    // Navigate months when dragging to viewport edges
    if (isLeftOutside && !monthChangeCooldown.current) {
      monthChangeCooldown.current = true;
      changeMonth(-1);
      
      toast.info(`Moving to ${MONTHS[new Date(cursor.y, cursor.m - 1, 1).getMonth()]}`, { 
        duration: 800,
        position: 'top-center'
      });
      
      setTimeout(() => {
        monthChangeCooldown.current = false;
      }, 600);
      
    } else if (isRightOutside && !monthChangeCooldown.current) {
      monthChangeCooldown.current = true;
      changeMonth(1);
      
      toast.info(`Moving to ${MONTHS[new Date(cursor.y, cursor.m + 1, 1).getMonth()]}`, { 
        duration: 800,
        position: 'top-center'
      });
      
      setTimeout(() => {
        monthChangeCooldown.current = false;
      }, 600);
    }
    
    // === VERTICAL SCROLLING (within the board) ===
    const isInsideBoard = clientX >= rect.left && clientX <= rect.right && 
                          clientY >= rect.top && clientY <= rect.bottom;
    
    if (isInsideBoard) {
      const scrollThreshold = 60;
      const nearTop = clientY - rect.top < scrollThreshold;
      const nearBottom = rect.bottom - clientY < scrollThreshold;
      
      if (nearTop || nearBottom) {
        const scrollSpeed = 15;
        const direction = nearTop ? -1 : 1;
        
        autoScrollInterval.current = setInterval(() => {
          if (boardRef.current) {
            boardRef.current.scrollTop += direction * scrollSpeed;
          }
        }, 50);
      }
    }
  }, [changeMonth, cursor]);

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

      // Refresh the visible range and the KPIs (one request)
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Reschedule failed', { id: 'reschedule' });
    } finally {
      setRescheduling(false);
    }
  }, [reload]);

const handleDragEnd = useCallback((event: DragEndEvent) => {
  setActiveDrag(null);
  setIsDragging(false);
  
  // Clear auto-scroll interval
  if (autoScrollInterval.current) {
    clearInterval(autoScrollInterval.current);
    autoScrollInterval.current = null;
  }
  
  const { active, over } = event;
  
  // Use preserved drag data if active.data.current is empty
  let dragData = active?.data?.current;
  if (!dragData || !dragData.projectId) {
    console.log('⚠️ [DragEnd] Using preserved drag data');
    dragData = dragDataRef.current;
  }
  
  if (!over || !dragData) {
    console.log('❌ [DragEnd] No over or drag data');
    dragDataRef.current = null;
    return;
  }

  const { projectId, stage, sourceDate, projectLabel, cellUnits } = dragData;
  const targetDate = String(over.id);
  
  console.log('📦 [DragEnd] Final drag data:', { projectId, stage, sourceDate, projectLabel, cellUnits, targetDate });
  
  if (targetDate === sourceDate) {
    dragDataRef.current = null;
    return;
  }

  // Always ask how many units to move (forward and backward drags alike)
  setPendingReschedule({
    projectId,
    projectLabel,
    stage,
    sourceDate,
    targetDate,
    cellUnits: Number(cellUnits) || 0,
    pastCellMove: targetDate < sourceDate,
  });
  
  dragDataRef.current = null;
}, []);

  const confirmReschedule = useCallback(async (unitsToMove: number) => {
    const p = pendingReschedule;
    if (!p) return;
    setPendingReschedule(null);
    // Omit `units` when moving the whole cell → backend does the whole-phase move.
    const partial = unitsToMove > 0 && unitsToMove < p.cellUnits - 1e-6;
    await performReschedule(
      p.projectId, p.stage, p.sourceDate, p.targetDate, p.projectLabel,
      partial ? unitsToMove : undefined,
      p.pastCellMove,
    );
  }, [pendingReschedule, performReschedule]);

  // Clean up auto-scroll interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
    };
  }, []);

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

  const statsBounds = useMemo(() => computeRangeBounds(statsRange), [statsRange]);
  const railBounds = useMemo(() => computeRangeBounds(railRange), [railRange]);
  // First and last day shown, including the leading / trailing days
  const gridFrom = weeks[0][0].key;
  const gridTo = weeks[weeks.length - 1][6].key;

  // One request per change of month, filter, view or KPI / stage-load range.
  // The API filters and aggregates; nothing is counted in the browser.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCapacityCalendar({
      from: gridFrom,
      to: gridTo,
      stage,
      pi: piQuery || undefined,
      customer: customerQuery || undefined,
      kpiFrom: statsBounds.startKey,
      kpiTo: statsBounds.endKey,
      loadFrom: railBounds.startKey,
      loadTo: railBounds.endKey,
      view,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load capacity data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [gridFrom, gridTo, stage, piQuery, customerQuery, statsBounds, railBounds, view, reloadKey]);

  const kpis = data?.kpis;
  const daysByKey = useMemo(
    () => Object.fromEntries((data?.days || []).map((d) => [d.date, d])),
    [data]
  );
  const stageRail = useMemo(
    () =>
      (data?.stageLoad.stages || STAGE_ORDER.map((s) => ({ stage: s, units: 0, capacity: 0, over: false, violation: false })))
        .map((s) => ({
          stage: s.stage as CapacityStage,
          used: s.units,
          eff: s.capacity,
          over: s.over,
          violation: s.violation,
        })),
    [data]
  );
  const isEmpty = view === "board" ? !data?.days.length : !data?.rows.length;

  // Compact this week: pull current-week stages into empty space only. Nothing
  // outside the current week moves; no downstream cascade; no-op if no gaps.
  const handleRebuild = async () => {
    if (!window.confirm("Compact the current week? Overdue work and this week's stages are packed into the rest of this week, starting now and filling each day in order (within working hours, up to 130% of each stage's daily capacity). If overdue work doesn't fit, the rest goes onto earlier days of this week. Nothing booked next week is touched, and a stage that still can't fit stays where it is. Completed stages and locked projects are not touched.")) return;
    try {
      setResetting(true);
      await rebuildCapacity();
      reload();
      setSelectedKey(null);
    } catch (err) {
      console.error(err);
      const reason = (err as any)?.response?.data?.message || (err as any)?.message;
      window.alert(`Failed to compact the current week.${reason ? `\n\n${reason}` : ""}`);
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
                  <Button
          onClick={() => router.push("/dashboard/calanderstatus")}
          variant="outline"
          size="sm"
          className="cc-btn"
        >
          <Gauge size={14} />
          Calander based on Project status 
        </Button>
              <Button onClick={reload} variant="outline" size="sm" className="cc-btn">
                <RotateCcw size={14} /> Refresh
              </Button>
              <Button onClick={handleRebuild} disabled={resetting} variant="outline" size="sm" className="cc-btn" title="Compact this week: pack overdue and this week's work from now, within working hours, up to 130% capacity. Next week is not touched.">
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
          <Button onClick={reload} variant="outline" size="sm" className="cc-btn ml-auto">Retry</Button>
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
        {/* All KPI numbers are calculated by the API for the selected range and filters */}
        <TelemetryTile
          icon={<Activity size={14} />} label="Effective utilization"
          value={!kpis ? "—" : (kpis.utilizationPct > 100 ? truePct(kpis.utilizationPct) : clampPct(kpis.utilizationPct))}
          meter={(kpis?.utilizationPct ?? 0) / 100}
          over={(kpis?.utilizationPct ?? 0) > 100}
          foot={`${Math.round(kpis?.scheduledUnits ?? 0)} / ${Math.round(kpis?.capacityUnits ?? 0)} units`}
        />
        <TelemetryTile
          icon={<Boxes size={14} />} label="Scheduled units"
          value={!kpis ? "—" : `${Math.round(kpis.scheduledUnits)}`}
          foot={`${kpis?.allocationLines ?? 0} allocation lines`}
        />
        <TelemetryTile
          icon={<Clock size={14} />} label="Hours loaded"
          value={!kpis ? "—" : kpis.hoursLoaded.toFixed(1)}
          meter={(kpis?.hoursAvailablePct ?? 0) / 100}
          foot={`${(kpis?.hoursAvailablePct ?? 0) > 100 ? truePct(kpis?.hoursAvailablePct ?? 0) : clampPct(kpis?.hoursAvailablePct ?? 0)} of available`}
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

      {/* Filter controls */}
      <div className="cc-filters" style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: '8px',
        width: '100%'
      }}>
        <div className="cc-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="cc-filter-label" style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'var(--cc-dim)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            PI:
          </span>
          <Input
            type="text"
            placeholder="Filter by PI #"
            value={piFilter}
            onChange={(e) => setPiFilter(e.target.value)}
            className="cc-filter-input"
            style={{
              width: '140px',
              height: '30px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--cc-line)',
              background: 'var(--cc-surface)'
            }}
          />
        </div>
        
        <div className="cc-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="cc-filter-label" style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'var(--cc-dim)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            Customer:
          </span>
          <Input
            type="text"
            placeholder="Filter by customer"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="cc-filter-input"
            style={{
              width: '160px',
              height: '30px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--cc-line)',
              background: 'var(--cc-surface)'
            }}
          />
        </div>
        
        {(piFilter || customerFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPiFilter("");
              setCustomerFilter("");
            }}
            style={{ 
              fontSize: '11px', 
              height: '30px',
              padding: '0 10px',
              color: 'var(--cc-dim)'
            }}
          >
            Clear filters ✕
          </Button>
        )}
      </div>

      {loading && !data ? (
        <div className="cc-skeleton">
          <div className="cc-spinner" />
          <p className="cc-mono">Reading capacity ledger…</p>
        </div>
      ) : view === "ledger" && isEmpty ? (
        <div className="cc-empty">
          <CalendarDays size={28} />
          <h3>No reserved capacity in window</h3>
          <p>The board shows days with active allocations. Try another stage or refresh.</p>
        </div>
      ) : view === "board" ? (
        // The board always renders so the month navigation stays usable on empty months
        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart} 
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <section 
            className="cc-board" 
            style={{ position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}
            ref={boardRef}
          >
            {(rescheduling || loading) && (
              <div className="cc-reschedule-overlay">
                <Loader2 className="animate-spin" size={24} />
                <span>{rescheduling ? "Rescheduling…" : "Loading…"}</span>
              </div>
            )}
            <div className="cc-board__head">
              <div className="cc-monthnav" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => changeMonth(-1)} title="Previous month (← arrow key)">
                  <ChevronLeft size={16} />
                </button>
                
                <div className="cc-monthnav__label" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    value={cursor.m}
                    onChange={(e) => {
                      setIsChangingMonth(true);
                      setCursor({ ...cursor, m: parseInt(e.target.value) });
                      setTimeout(() => setIsChangingMonth(false), 300);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      border: '1px solid var(--cc-line)',
                      borderRadius: '6px',
                      background: 'var(--cc-surface)',
                      cursor: 'pointer',
                      color: 'var(--cc-ink)'
                    }}
                  >
                    {MONTHS.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  
                  <select
                    value={cursor.y}
                    onChange={(e) => {
                      setIsChangingMonth(true);
                      setCursor({ ...cursor, y: parseInt(e.target.value) });
                      setTimeout(() => setIsChangingMonth(false), 300);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      border: '1px solid var(--cc-line)',
                      borderRadius: '6px',
                      background: 'var(--cc-surface)',
                      cursor: 'pointer',
                      color: 'var(--cc-ink)'
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => cursor.y - 4 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  
                  <span className="cc-month__e cc-mono" style={{ fontSize: '10.5px', color: 'var(--cc-dim)', marginLeft: '4px' }}>
                    {ethLabel(new Date(cursor.y, cursor.m, 15))} E.C.
                  </span>
                </div>
                
                <button onClick={() => changeMonth(1)} title="Next month (→ arrow key)">
                  <ChevronRight size={16} />
                </button>
                
                <button 
                  className="cc-today-btn"
                  onClick={goToToday}
                  title="Go to today (T key)"
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--cc-line)',
                    background: 'transparent',
                    color: 'var(--cc-dim)',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                  Today
                </button>
                
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--cc-dim)', 
                  marginLeft: '8px',
                  opacity: 0.6,
                  display: 'flex',
                  gap: '12px'
                }}>
                  <span title="Keyboard shortcuts">← → to navigate</span>
                </div>
              </div>
            </div>

            <div className="cc-dow">
              {WEEKDAYS.map((d, i) => (
                <span key={d} className={i === 0 ? "cc-dow--off" : ""}>{d}</span>
              ))}
            </div>

            <div className={`cc-grid ${isChangingMonth ? 'cc-grid--changing' : ''}`}>
              {weeks.flat().map((cell, i) => {
                // Load %, colour level and bars for the day come from the API
                const day = daysByKey[cell.key];
                const isSunday = cell.date.getDay() === 0;
                const heat = day ? LEVEL_VAR[day.level] : LEVEL_VAR.IDLE;
                const active = !!day;
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
                      // The day page loads that day's full allocation list
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
                        {cell.key === todayKey && (
                          <span className="cc-cell__todaytag">Today</span>
                        )}
                      </span>
                      {day && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {day.over && day.maxOverPct > 0 && (
                            <span
                              title={day.violation
                                ? "Exceeds the 125% hard ceiling"
                                : "Within the allowed 100–125% overcapacity band"}
                              style={{
                                background: day.violation
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
                              {day.violation ? `+${day.maxOverPct}% !` : `+${day.maxOverPct}% OC`}
                            </span>
                          )}
                          <span className="cc-cell__peak" style={{ background: heat, flexShrink: 0 }}>
                            {clampPct(day.loadPct)}
                          </span>
                        </div>
                      )}
                    </div>
                    {day && (
                      <div className="cc-cell__bars">
                        {day.groups.map((group) => (
                          <div
                            key={group.projectId}
                            className="cc-cell__pgroup"
                          >
                            <span className="cc-cell__pdiv" title={group.label}>
                              <span>{group.label}</span>
                            </span>
                            {group.bars.map((bar) => {
                              const meta = STAGE_META[bar.stage as CapacityStage];
                              const dragId = `${group.projectId}::${bar.stage}::${cell.key}`;
                              return (
                                <DraggableStageBar
                                  key={dragId}
                                  id={dragId}
                                  data={{
                                    projectId: group.projectId,
                                    projectLabel: group.label,
                                    stage: bar.stage,
                                    sourceDate: cell.key,
                                    cellUnits: bar.units,
                                  }}
                                >
                                  <div
                                    className="cc-cell__row cc-cell__row--draggable"
                                    style={{ "--stage-color": meta?.color } as React.CSSProperties}
                                    title={`${stageName(bar.stage)} - ${bar.units} / ${Math.round(bar.eff)} units (${clampPct(bar.pct)} of capacity) — drag to reschedule`}
                                  >
                                    <span
                                      className="cc-cell__rowfill"
                                      style={{ width: `${Math.min(bar.pct, 100)}%`, background: meta?.color }}
                                    />
                                    <GripVertical size={10} className="cc-cell__grip" />
                                    <span className="cc-cell__rowdot" style={{ background: meta?.color }} />
                                    <span className="cc-cell__rowabbr">{stageName(bar.stage)}</span>
                                    <span className="cc-cell__rowpct">{clampPct(bar.pct)}</span>
                                  </div>
                                </DraggableStageBar>
                              );
                            })}
                            {group.more > 0 && (
                              <span className="cc-cell__more">+{group.more} more</span>
                            )}
                          </div>
                        ))}
                        {day.moreStages > 0 && (
                          <span className="cc-cell__more">+{day.moreStages} stage{day.moreStages > 1 ? "s" : ""}</span>
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
        <Ledger rows={data?.rows || []} pi={piQuery} customer={customerQuery} />
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
type LedgerLine = Awaited<ReturnType<typeof getCalendarRowAllocations>>[number];
type LedgerViewRow = CapacityLedgerRow & { isZeroRow?: boolean };

const Ledger: React.FC<{
  rows: CapacityLedgerRow[];
  pi: string;
  customer: string;
}> = ({ rows, pi, customer }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllStagesForDate, setShowAllStagesForDate] = useState(false);
  // Allocation lines are loaded per row the first time it is opened. The cache
  // belongs to one `rows` response, so new data starts with an empty cache.
  type LineState = LedgerLine[] | "loading" | "error";
  const [lineCache, setLineCache] = useState<{ rows: CapacityLedgerRow[]; byId: Record<string, LineState> }>({ rows, byId: {} });
  const lines = lineCache.rows === rows ? lineCache.byId : {};
  const setLine = (id: string, value: LineState) =>
    setLineCache((c) => ({ rows, byId: { ...(c.rows === rows ? c.byId : {}), [id]: value } }));

  const toggleRow = (id: string) => {
    const opening = !open[id];
    setOpen((o) => ({ ...o, [id]: !o[id] }));
    if (!opening || Array.isArray(lines[id]) || lines[id] === "loading") return;
    setLine(id, "loading");
    getCalendarRowAllocations({ rowId: id, pi: pi || undefined, customer: customer || undefined })
      .then((res) => setLine(id, res))
      .catch(() => setLine(id, "error"));
  };

  const allPossibleStages = Object.values(ProjectStatus) as string[];

  const getProcessedRows = (): LedgerViewRow[] => {
    if (!selectedDate) return rows;
    const dateFiltered = rows.filter((r) => r.date === selectedDate);
    if (!showAllStagesForDate) return dateFiltered;
    const existingStages = new Set(dateFiltered.map((r) => r.stage));
    const result: LedgerViewRow[] = [...dateFiltered];
    for (const stage of allPossibleStages) {
      if (!existingStages.has(stage)) {
        const templateRow = rows.find((r) => r.stage === stage) || rows[0];
        if (templateRow) {
          result.push({
            ...templateRow,
            id: `${selectedDate}-${stage}-zero`,
            stage,
            date: selectedDate,
            used: 0,
            usedHours: 0,
            frac: 0,
            over: false,
            lines: 0,
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
            {Array.from(new Set(rows.map((r) => r.date))).sort().map((date) => (
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
          const d = dateFromKey(r.date);
          const isOpen = !!open[r.id];
          const isZeroRow = !!r.isZeroRow;
          const isDesign = r.stage === CapacityStage.DESIGN;
          const rowLines = lines[r.id];

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
                onClick={() => !isZeroRow && toggleRow(r.id)}
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
                  <Meter frac={r.frac} over={r.over} thin />
                  <b className="cc-mono" style={{ color: isZeroRow ? 'var(--cc-dim)' : heatVar(r.frac, r.over) }}>
                    {isZeroRow ? '0%' : clampPct(r.frac * 100)}
                  </b>
                </span>
                <span className="cc-mono cc-lrow__eff">
                  {Math.round(r.used)}/{Math.round(r.eff)}
                  {r.parallelSlots > 1 && <i className="cc-x2">×{r.parallelSlots}</i>}
                </span>
                <span className="cc-mono">
                  {r.usedHours.toFixed(1)}/{r.dayHours.toFixed(1)}
                </span>
                <span className="cc-mono cc-lrow__lines">
                  {r.lines}
                  {r.over && isDesign && <span className="cc-lrow__flag">OVER</span>}
                </span>
              </div>
              {isOpen && !isZeroRow && (
                <div className="cc-lexpand">
                  {rowLines === "loading" || rowLines === undefined ? (
                    <p className="cc-allocs__empty cc-mono">Loading allocation lines…</p>
                  ) : rowLines === "error" ? (
                    <p className="cc-allocs__empty cc-mono">Could not load allocation lines.</p>
                  ) : rowLines.length === 0 ? (
                    <p className="cc-allocs__empty cc-mono">No allocation lines.</p>
                  ) : (
                    rowLines.map((a) => (
                      <div key={a.id} className="cc-alloc cc-alloc--wide">
                        <span className="cc-alloc__proj">{a.label}</span>
                        <span className="cc-alloc__u cc-mono">
                          {a.units} units · {a.hours} h
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
  /* Today's date: a colour of its own so it never reads as a load level. */
  --cc-today:#2563eb;
  --cc-dim: hsl(var(--muted-foreground));
  --cc-surface: hsl(var(--card));
  --cc-inset: hsl(var(--muted)/.4);
  font-family:var(--cc-display);
  color:var(--cc-ink);
  display:flex; flex-direction:column; gap:16px;
  /* Size to the page, never to the content: the dashboard ScrollArea grows to
     its widest child, which pushed the 7th column and buttons off-screen. */
  width:100%; min-width:0; contain:inline-size;
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
.capcal .cc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
.capcal .cc-mast__meta{max-width:100%;}
.capcal .cc-btn{font-family:var(--cc-display);gap:6px;border-radius:9px;}
.capcal .cc-btn--danger{background:transparent;border:1px solid color-mix(in srgb,var(--cc-over) 50%,transparent);color:var(--cc-over);}
.capcal .cc-btn--danger:hover{background:color-mix(in srgb,var(--cc-over) 12%,transparent);}
.capcal .cc-spin{animation:cc-rot 1s linear infinite;}
@keyframes cc-rot{to{transform:rotate(360deg)}}

.capcal .cc-error{display:flex;align-items:center;gap:10px;border:1px solid color-mix(in srgb,var(--cc-over) 40%,transparent);
  background:color-mix(in srgb,var(--cc-over) 8%,transparent);color:var(--cc-over);padding:12px 16px;border-radius:11px;font-size:13px;}

/* Telemetry */
/* Telemetry header */
.capcal .cc-telemetry-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap;}
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
.capcal .cc-telemetry{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
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
.capcal .cc-legend{display:flex;gap:10px;flex-wrap:wrap;}
.capcal .cc-legend__i{display:inline-flex;align-items:center;gap:5px;font-family:var(--cc-mono);font-size:10px;color:var(--cc-dim);letter-spacing:.06em;}
.capcal .cc-legend__i i{width:10px;height:10px;border-radius:3px;}
.capcal .cc-seg{display:inline-flex;border:1px solid var(--cc-line);border-radius:9px;overflow:hidden;background:var(--cc-surface);}
.capcal .cc-seg button{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-display);font-size:12.5px;
  padding:7px 13px;border:0;background:transparent;color:var(--cc-dim);cursor:pointer;transition:.18s;}
.capcal .cc-seg button.is-on{background:var(--cc-ink);color:hsl(var(--background));}

/* Stage layout: board + rail */
/* Stage layout — calendar takes full width, rail is in a Sheet */


/* Board */
.capcal .cc-board{border:1px solid var(--cc-line);border-radius:14px;background:var(--cc-surface);padding:14px;overflow-x:auto;}
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
.capcal .cc-dow{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-bottom:6px;min-width:560px;}
.capcal .cc-dow span{font-family:var(--cc-mono);font-size:10px;letter-spacing:.12em;color:var(--cc-dim);text-align:center;padding:2px 0;}
.capcal .cc-dow .cc-dow--off{color:color-mix(in srgb,var(--cc-dim) 55%,transparent);}
.capcal .cc-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;min-width:560px;}
.capcal .cc-cell{min-height:128px;border:1px solid var(--cc-line);border-radius:10px;background:var(--cc-surface);
  padding:7px;display:flex;flex-direction:column;gap:4px;text-align:left;cursor:default;position:relative;overflow:hidden;
  transition:transform .18s,box-shadow .18s,border-color .18s;animation:cc-rise .4s both;}
.capcal .cc-cell--active{cursor:pointer;}
.capcal .cc-cell--active:hover{transform:translateY(-2px);box-shadow:0 8px 22px -10px color-mix(in srgb,var(--heat) 60%,transparent);
  border-color:color-mix(in srgb,var(--heat) 55%,var(--cc-line));z-index:2;}
.capcal .cc-cell--out{opacity:.4;}
.capcal .cc-cell--off{background-image:repeating-linear-gradient(45deg,transparent,transparent 6px,var(--cc-inset) 6px,var(--cc-inset) 7px);}
.capcal .cc-cell--today{border:2px solid var(--cc-today);box-shadow:0 0 0 3px color-mix(in srgb,var(--cc-today) 25%,transparent);}
.capcal .cc-cell--today .cc-cell__d{background:var(--cc-today);color:#fff;border-radius:999px;padding:0 7px;}
.capcal .cc-cell__todaytag{align-self:center;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:var(--cc-today);border-radius:4px;padding:1px 5px;line-height:1.4;}
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
  /* Compact cells (no bars) fit any width without scrolling */
  .capcal .cc-grid,.capcal .cc-dow{min-width:0;}
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
.capcal .cc-ledger{border:1px solid var(--cc-line);border-radius:14px;background:var(--cc-surface);overflow-x:auto;}
.capcal .cc-ledger__head,.capcal .cc-ledger__body{min-width:640px;}
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
.capcal .cc-cell__row--locked{cursor:not-allowed;opacity:.6;}
.capcal .cc-cell__row--locked .cc-cell__grip{visibility:hidden;}
.capcal .cc-drag-overlay{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:10px;
  background:#ffffff;border:1px solid var(--cc-line);box-shadow:0 12px 32px -8px rgba(0,0,0,.28);
  font-size:12px;font-weight:600;color:var(--cc-ink);white-space:nowrap;pointer-events:none;z-index:999;}
.capcal .cc-drag-overlay__dot{width:8px;height:8px;border-radius:99px;flex:none;}
.capcal .cc-drag-overlay__label{letter-spacing:-.01em;}
.capcal .cc-reschedule-overlay{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;gap:10px;
  background:rgba(255,255,255,.72);backdrop-filter:blur(3px);border-radius:14px;font-size:14px;font-weight:600;color:var(--cc-ink);pointer-events:none;}

/* Dark-mode nudges */
.dark .capcal{--cc-today:#60a5fa;}
.dark .capcal .cc-cell--today{box-shadow:0 0 0 3px color-mix(in srgb,var(--cc-today) 30%,transparent);}
.dark .capcal .cc-cell--today .cc-cell__d,.dark .capcal .cc-cell__todaytag{color:#0b1220;}
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