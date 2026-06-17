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

const OVERCAPACITY_FACTOR = 1.25;

const dayHoursOf = (r: any) => r.maxHours || r.workingHours || 7.5;
const dayFrac = (r: any) => (dayHoursOf(r) > 0 ? (r.usedHours || 0) / dayHoursOf(r) : 0);
const rowOver = (r: any) =>
  (r.overCapacityUsed || 0) > 0 ||
  (r.overHoursCapacityUsed || 0) > 0 ||
  dayFrac(r) > 1.01 ||
  (r.usedCapacity || 0) > (r.maxCapacity || Infinity);

const clampPct = (v: number) => `${Math.min(Math.round(v), 100)}%`;

const heatVar = (frac: number, isDesignStage: boolean = false, over: boolean = false) => {
  // OVERCAPACITY takes precedence for ALL stages
  if (over || frac > 1.0001) return "var(--cc-over)";
  if (frac > 1.25) return "var(--cc-violation)";
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
 * Dialog for selecting project and quantity when dragging ANY stage
 * ------------------------------------------------------------------ */
interface ProjectOption {
  id: string;
  label: string;
  quantity: number;
}

const StageRescheduleDialog: React.FC<{
  open: boolean;
  projects: ProjectOption[];
  loading?: boolean;
  stageName?: string;
  onConfirm: (projectId: string, quantity: number) => void;
  onCancel: () => void;
}> = ({ open, projects, loading, stageName = "this", onConfirm, onCancel }) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const actualSelectedProject = useMemo(
    () => {
      if (selectedProject && projects.some((p) => p.id === selectedProject)) {
        return selectedProject;
      }
      return projects[0]?.id ?? "";
    },
    [projects, selectedProject]
  );

  const selectedProjectData = projects.find((p) => p.id === actualSelectedProject);
  const maxQuantity = selectedProjectData?.quantity ?? 1;
  const clamp = (n: number) => Math.max(1, Math.min(n, maxQuantity));
  const displayedQuantity = clamp(quantity);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader>
          <DialogTitle>Schedule {stageName} Stage</DialogTitle>
          <DialogDescription>
            Select a project and specify the quantity for the {stageName} stage.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 2px" }}>
          <div>
            <Label>Project</Label>
            <select
              className="cc-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ width: "100%", marginTop: "4px" }}
              disabled={loading}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.quantity} units remaining)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Quantity to schedule (max {maxQuantity})</Label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={loading || quantity <= 1}
                onClick={() => setQuantity(clamp(quantity - 1))}
              >
                −
              </Button>
              <Input
                type="number"
                min={1}
                max={maxQuantity}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(clamp(parseInt(e.target.value) || 1))}
                style={{ textAlign: "center", width: "100px" }}
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={loading || quantity >= maxQuantity}
                onClick={() => setQuantity(clamp(quantity + 1))}
              >
                +
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading || quantity >= maxQuantity}
                onClick={() => setQuantity(maxQuantity)}
              >
                All
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedProject, quantity)}
            disabled={loading || !selectedProject || quantity <= 0}
          >
            {loading ? "Scheduling..." : `Schedule ${quantity} unit${quantity > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Meter: React.FC<{ frac: number; isDesign?: boolean; over?: boolean; thin?: boolean }> = ({ 
  frac, isDesign, over, thin 
}) => {
  const normalWidth = Math.min(frac, 1.0) * 80;
  const overWidth = Math.max(0, Math.min(frac - 1.0, 0.25)) * 80;
  const isViolation = frac > 1.25;
  
  return (
    <div className={`cc-track ${thin ? "cc-track--thin" : ""}`} style={{ display: 'flex', position: 'relative' }}>
      <div
        className="cc-fill"
        style={{
          width: `${normalWidth}%`,
          background: heatVar(Math.min(frac, 1.0), isDesign, false),
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
 * Draggable stage bar - ALL stages are draggable
 * ------------------------------------------------------------------ */
const DraggableStageBar: React.FC<{
  id: string;
  data: { stage: string; sourceDate: string; cellUnits: number; projects?: any[]; stageData?: any };
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ id, data, children, disabled }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ 
    id, 
    data,
    disabled: disabled
  });
  
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ 
        opacity: isDragging ? 0.35 : 1, 
        cursor: 'grab'
      }}
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

const rangeLabel = (from: Date, to: Date) => {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (from.getTime() === to.getTime()) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
};

const ThCapacityCalendar: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [slots, setSlots] = useState<Record<string, { parallelSlots: number; workingHours: number; capacity: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
const router = useRouter();

  const [stage, setStage] = useState<CapacityStage | "ALL">("ALL");
  const [view, setView] = useState<"board" | "ledger">("board");
  const [cursor, setCursor] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [railRange, setRailRange] = useState<string>("today");
  const [statsRange, setStatsRange] = useState<string>("today");
const [draggedAllocation, setDraggedAllocation] = useState<{
  projectId: string;
  quantity: number;
  stage: CapacityStage;
  sourceDate: string;
} | null>(null);
  // Drag state
  const [activeDrag, setActiveDrag] = useState<{ id: string; data: any } | null>(null);
  const [dragPending, setDragPending] = useState<{
    sourceDate: string;
    targetDate: string;
    stageData: any;
    stage: CapacityStage;
  } | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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
const allocsOf = useCallback((r: any) =>
    r.projectStageCapacityAllocations || r.projectStage_capacityAllocations || [], []);

  const filtered = useMemo(
    () => rows.filter((r) => stage === "ALL" || r.stage === stage),
    [rows, stage]
  );
// Update handleDragStart to capture the specific allocation being dragged
const handleDragStart = useCallback((event: DragStartEvent) => {
  const data = event.active.data.current;
  if (data && data.stageData && data.stageData.row) {
    // Find the specific allocation for this stage on this date
    const rowDate = data.sourceDate;
    const stage = data.stage;
    const row = data.stageData.row;
    const allocs = allocsOf(row);
    
    // Get the first non-zero allocation (you might want to let user choose)
    const allocation = allocs.find((a: any) => (a.allocatedUnits || 0) > 0);
    if (allocation && allocation.projectStage?.project) {
      setDraggedAllocation({
        projectId: allocation.projectStage.project.id,
        quantity: allocation.allocatedUnits,
        stage: stage,
        sourceDate: rowDate,
      });
    }
  }
  setActiveDrag({ id: String(event.active.id), data });
}, [allocsOf]);

  const scheduleStageReschedule = useCallback(async (
    projectId: string,
    quantity: number,
    stageToReschedule: CapacityStage,
    sourceDate: string,
    targetDate: string
  ) => {
    try {
      setRescheduling(true);
      toast.loading(`Rescheduling ${stageName(stageToReschedule)} stage...`, { id: 'schedule-stage' });

      await rescheduleProjectFromCalendar(
        projectId,
        stageToReschedule,
        `${targetDate}T08:00:00.000Z`,
        `${sourceDate}T00:00:00.000Z`,
        quantity,
      );

      toast.success(
        `${stageName(stageToReschedule)} stage rescheduled: ${quantity} unit${quantity > 1 ? "s" : ""} to ${targetDate}`,
        { id: 'schedule-stage', duration: 4000 },
      );

      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Reschedule failed', { id: 'schedule-stage' });
    } finally {
      setRescheduling(false);
    }
  }, [fetchData]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
  setActiveDrag(null);
  const { active, over } = event;
  if (!over || !active.data.current) return;

  const { stage: draggedStage, sourceDate, stageData } = active.data.current as any;
  const targetDate = String(over.id);
  
  if (targetDate === sourceDate) return;

  // CRITICAL: Make sure sourceDate is passed correctly
  setDragPending({
    sourceDate,      // This should be the date we're dragging FROM
    targetDate,
    stageData,
    stage: draggedStage,
  });
}, []);

  const confirmStageDrag = useCallback(async (projectId: string, quantity: number) => {
    if (!dragPending) return;
    const { sourceDate, targetDate, stage } = dragPending;
    setDragPending(null);
    await scheduleStageReschedule(projectId, quantity, stage, sourceDate, targetDate);
  }, [dragPending, scheduleStageReschedule]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const n = new Date();
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
  }, []);

  const effMax = useCallback((r: any) => {
    const lot = slots[r.stage] || { parallelSlots: 1, workingHours: 7.5, capacity: 0 };
    const stored = r.maxCapacity || 0;
    const slotsN = lot.parallelSlots || 1;
    const whpd = r.workingHours || lot.workingHours || 7.5;
    const shift = r.shift || "CUSTOM";
    const sh = shift === "CUSTOM" ? whpd : (SHIFT_HOURS[shift] || whpd);
    const lotEff = (lot.capacity || 0) * (sh / whpd) * slotsN;
    if (stored > 0 && slotsN > 1 && lotEff > 0 && stored < lotEff * 0.6) return lotEff;
    return stored > 0 ? stored : lotEff;
  }, [slots]);



  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    filtered.forEach((r) => {
      const k = dateKeyOf(r.date);
      (m[k] ||= []).push(r);
    });
    return m;
  }, [filtered]);

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
      .catch(() => {});
    return () => { cancelled = true; };
  }, [statsBounds]);

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
      .catch(() => {});
    return () => { cancelled = true; };
  }, [railBounds]);

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

  const handleRebuild = async () => {
    if (!window.confirm("Compact the current week? This pulls this week's stages earlier into any empty space (filling gaps). Nothing outside this week is moved, and if there's no empty space nothing changes.")) return;
    try {
      setResetting(true);
      await rebuildCapacity();
      await fetchData();
      setSelectedKey(null);
    } catch (err) {
      console.error(err);
      window.alert("Failed to rebuild capacity.");
    } finally {
      setResetting(false);
    }
  };

  const selectedRows = selectedKey ? byDay[selectedKey] || [] : [];

  // Get all active projects with remaining quantity for ANY stage
// Update getAvailableProjectsForStage to accept sourceDate parameter
const getAvailableProjectsForStage = useCallback((stageType: CapacityStage, sourceDate?: string) => {
  const projectMap = new Map<string, { id: string; label: string; quantity: number }>();
  
  rows.forEach((r) => {
    // Only look at rows that match the stage we're dragging
    if (r.stage === stageType) {
      // CRITICAL FIX: If sourceDate provided, ONLY include allocations from that specific date
      const rowDate = dateKeyOf(r.date);
      if (sourceDate && rowDate !== sourceDate) {
        return; // Skip rows from other dates
      }
      
      const allocs = allocsOf(r);
      allocs.forEach((a: any) => {
        const p = a.projectStage?.project;
        if (p && p.status !== "COMPLETED") {
          const allocatedUnits = a.allocatedUnits || 0;
          if (allocatedUnits > 0 && !projectMap.has(p.id)) {
            projectMap.set(p.id, {
              id: p.id,
              label: p.invoice?.piNumber || p.customer?.name || p.name || "Unnamed Project",
              quantity: allocatedUnits,
            });
          }
        }
      });
    }
  });
  
  return Array.from(projectMap.values());
}, [rows, allocsOf]);

  // Get stage data for a day including all projects
  const getStageDataForDay = (dayRows: any[]) => {
    const stageData = new Map();
    
    dayRows.forEach((r) => {
      const allocs = allocsOf(r);
      const projects = new Map();
      
      allocs.forEach((a: any) => {
        const p = a.projectStage?.project;
        if (p) {
          if (!projects.has(p.id)) {
            projects.set(p.id, {
              id: p.id,
              label: p.invoice?.piNumber || p.customer?.name || "Unnamed",
              units: 0,
            });
          }
          projects.get(p.id).units += a.allocatedUnits || 0;
        }
      });
      
      stageData.set(r.stage, {
        row: r,
        projects: Array.from(projects.values()),
        totalUnits: Array.from(projects.values()).reduce((sum, p) => sum + p.units, 0),
      });
    });
    
    return stageData;
  };

  return (
    <div className="capcal">
      <style>{CC_STYLES}</style>

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
              <Button
                onClick={handleRebuild}
                disabled={resetting}
                variant="outline"
                size="sm"
                className="cc-btn"
                title="Rebuild full capacity calendar"
              >
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
            {RANGE_OPTIONS.map((g) => (
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
          value={loading ? "—" : (summary.util > 100 ? `${Math.round(summary.util)}%` : clampPct(summary.util))}
          meter={summary.util / 100}
          over={summary.util > 100}
          foot={`${Math.round(summary.used)} / ${Math.round(summary.eff)} units`}
        />
        <TelemetryTile
          icon={<Boxes size={14} />} label="Scheduled units"
          value={loading ? "—" : `${Math.round(summary.used)}`}
          foot=""
        />
        <TelemetryTile
          icon={<Clock size={14} />} label="Hours loaded"
          value={loading ? "—" : summary.usedH.toFixed(1)}
          meter={summary.hoursUtil / 100}
          foot=""
        />
      </section>

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
                <span>Rescheduling stage...</span>
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
  // Also check if stage is over capacity by units
  const eff = effMax(r);
  const totalUnits = allocsOf(r).reduce((sum: number, a: any) => sum + (a.allocatedUnits || 0), 0);
  if (totalUnits > eff) anyOver = true;
});
const heat = heatVar(dayLoadFrac, false, anyOver);
                const active = dayRows.length > 0;
                
                const stageDataMap = getStageDataForDay(displayRows);
                const stageOrderList = STAGE_ORDER.filter(s => stageDataMap.has(s));
                
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
// To:
onClick={() => {
  if (active) {
    router.push(`/dashboard/capacityday/${cell.key}`);
  }
}}                  >
                    <div className="cc-cell__top">
                      <span className="cc-cell__dates">
                        <span className="cc-cell__d">{cell.day}</span>
                        <span className="cc-cell__ed" title={`${ethLabel(cell.date)} E.C.`}>
                          {gregorianToEthiopian(cell.date).date}
                        </span>
                      </span>
                    
                    </div>
                    {active && (
                      <div className="cc-cell__bars">
                        {stageOrderList.slice(0, 4).map((stageKey) => {
                          const stageInfo = stageDataMap.get(stageKey);
                          const { row: r, projects, totalUnits } = stageInfo;
                          const meta = STAGE_META[r.stage as CapacityStage];
                          const eff = effMax(r);
                          const isDesign = r.stage === CapacityStage.DESIGN;
                          const totalFrac = eff > 0 ? totalUnits / eff : 0;
                          const isDesignOverCapacity = isDesign && totalFrac > 1.0;
                          const projectCount = projects.length;
                          
                          const dragId = `${stageKey}::${cell.key}`;
                        const stageBar = (
  <div
    className="cc-cell__row cc-cell__row--draggable"
    style={{ 
      "--stage-color": meta?.color,
      // Apply red styling for ANY stage that is over capacity
      borderColor: (totalFrac > 1.0) ? "var(--cc-over)" : `color-mix(in srgb, ${meta?.color} 52%, transparent)`,
      backgroundColor: (totalFrac > 1.0) 
        ? "color-mix(in srgb, var(--cc-over) 15%, transparent)" 
        : `color-mix(in srgb, ${meta?.color} 7%, var(--cc-inset))`,
    } as React.CSSProperties}
    title={`${stageName(r.stage)} - ${totalUnits} / ${Math.round(eff)} units (${clampPct(totalFrac * 100)} of capacity) — drag to reschedule`}
  >
    <span
      className="cc-cell__rowfill"
      style={{ 
        width: `${Math.min(totalFrac * 100, 100)}%`, 
        background: (totalFrac > 1.0) ? "var(--cc-over)" : meta?.color,
        opacity: 0.34,
      }}
    />
    <GripVertical size={10} className="cc-cell__grip" />
    <span className="cc-cell__rowdot" style={{ background: (totalFrac > 1.0) ? "var(--cc-over)" : meta?.color }} />
    <span className="cc-cell__rowabbr">{stageName(r.stage)}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
      {projectCount > 0 && (
        <span className="cc-project-count" style={{ fontSize: '7px', opacity: 0.7 }}>
          {projectCount} proj
        </span>
      )}
      {/* Show overcapacity badge for ALL stages, not just DESIGN */}
      {(totalFrac > 1.0) && (
        <span className="cc-design-over-badge" style={{ color: 'var(--cc-over)', background: 'color-mix(in srgb, var(--cc-over) 15%, transparent)' }}>
          +{Math.round((totalFrac - 1) * 100)}%
        </span>
      )}
      <span className="cc-cell__rowpct" style={{ color: (totalFrac > 1.0) ? "var(--cc-over)" : "var(--cc-ink)" }}>
        {clampPct(totalFrac * 100)}
      </span>
    </div>
  </div>
);
                          
                          return (
                            <DraggableStageBar
                              key={dragId}
                              id={dragId}
                              data={{
                                stage: r.stage,
                                sourceDate: cell.key,
                                cellUnits: totalUnits,
                                stageData: {
                                  projects: projects,
                                  row: r,
                                  totalUnits,
                                },
                              }}
                              disabled={false}
                            >
                              {stageBar}
                            </DraggableStageBar>
                          );
                        })}
                        {stageOrderList.length > 4 && (
                          <span className="cc-cell__more">+{stageOrderList.length - 4} stage{stageOrderList.length - 4 > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    )}
                  </DroppableDayCell>
                );
              })}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDrag?.data && (
                <div className="cc-drag-overlay">
                  <span
                    className="cc-drag-overlay__dot"
                    style={{ background: STAGE_META[activeDrag.data.stage as CapacityStage]?.color }}
                  />
                  <span className="cc-drag-overlay__label">
                    {stageName(activeDrag.data.stage)}
                  </span>
                </div>
              )}
            </DragOverlay>
          </section>
        </DndContext>
      ) : (
        <Ledger rows={filtered} effMax={effMax} allocsOf={allocsOf} slots={slots} />
      )}

      {view === "board" && selectedKey && selectedRows.length > 0 && (
        <DayModal
          dayKey={selectedKey}
          rows={selectedRows}
          effMax={effMax}
          allocsOf={allocsOf}
          onClose={() => setSelectedKey(null)}
        />
      )}

     <StageRescheduleDialog
  open={!!dragPending}
  projects={dragPending ? getAvailableProjectsForStage(dragPending.stage, dragPending.sourceDate) : []}
  loading={rescheduling}
  stageName={dragPending ? stageName(dragPending.stage) : ""}
  onConfirm={confirmStageDrag}
  onCancel={() => setDragPending(null)}
/>

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
          {RANGE_OPTIONS.map((g) => (
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
        const isDesign = r.stage === CapacityStage.DESIGN;
        return (
          <div key={r.stage} className="cc-railrow">
            <div className="cc-railrow__top">
              <span className="cc-railrow__name">
                <span className="cc-dot" style={{ background: STAGE_META[r.stage].color }} />
                {stageName(r.stage)}
              </span>
              <span className="cc-railrow__val cc-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {r.over && isDesign && (
                  <span
                    style={{
                      background: "var(--cc-over)",
                      color: "#fff",
                      fontSize: "8.5px",
                      fontWeight: 800,
                      padding: "1.5px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    +{Math.round(((r.used - r.eff) / r.eff) * 100)}% OC
                  </span>
                )}
                <span>{Math.round(r.used)}/{Math.round(r.eff)}</span>
              </span>
            </div>
            <Meter frac={frac} isDesign={isDesign} over={r.over} />
          </div>
        );
      })}
    </div>
    <p className="cc-panel__hint cc-mono">Select a day for its breakdown →</p>
  </div>
);

const MODE_TONE: Record<string, string> = {
  AUTO: "var(--cc-low)", MANUAL: "var(--cc-med)", LOCKED: "var(--cc-over)",
};

const operativeDelivery = (p: any) =>
  p?.finalDelivery || p?.manualDelivery || p?.calculatedDelivery || null;

const DayModal: React.FC<{
  dayKey: string; rows: any[]; effMax: (r: any) => number;
  allocsOf: (r: any) => any[]; onClose: () => void;
}> = ({ dayKey, rows, effMax, allocsOf, onClose }) => {
  const d = dateFromKey(dayKey);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const projects = useMemo(() => {
    const m = new Map<string, any>();
    rows.forEach((r) =>
      allocsOf(r).forEach((a: any) => {
        const p = a.projectStage?.project;
        if (p && !m.has(p.id)) m.set(p.id, p);
      })
    );
    return Array.from(m.values());
  }, [rows, allocsOf]);

  const totalUnits = rows.reduce((s, r) => s + (r.usedCapacity || 0), 0);
  const totalHours = rows.reduce((s, r) => s + (r.usedHours || 0), 0);
  const displayRows = useMemo(() => sortDayRows(rows, allocsOf), [rows, allocsOf]);
  const dayUtil = useMemo(() => {
    const eff = rows.reduce((s, r) => s + effMax(r), 0);
    return eff > 0 ? (totalUnits / eff) * 100 : 0;
  }, [rows, effMax, totalUnits]);

  return (
    <div className="cc-modal" role="dialog" aria-modal="true">
      <div className="cc-modal__scrim" onClick={onClose} />
      <div className="cc-modal__card">
        <div className="cc-modal__head">
          <div className="cc-modal__head-left">
            <span className="cc-modal__ic"><CalendarDays size={16} /></span>
            <div className="cc-modal__date-block">
              <span className="cc-modal__weekday">{d.toLocaleDateString(undefined, { weekday: "long" })}</span>
              <span className="cc-modal__fulldate">
                {d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="cc-modal__ethdate cc-mono">{ethLabel(d)} E.C.</span>
            </div>
          </div>
          <div className="cc-modal__head-right">
            <div className="cc-modal__dayutil" style={{ "--util-heat": heatVar(dayUtil / 100, false, dayUtil > 100) } as React.CSSProperties}>
              <span className="cc-modal__dayutil-val cc-mono">{clampPct(dayUtil)}</span>
              <span className="cc-modal__dayutil-label">Day load</span>
            </div>
            <button className="cc-modal__close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="cc-modal__stats">
          <div className="cc-modal__stat">
            <span className="cc-modal__stat-num cc-mono">{rows.length}</span>
            <span className="cc-modal__stat-label">STAGE{rows.length > 1 ? "S" : ""}</span>
          </div>
          <div className="cc-modal__stat">
            <span className="cc-modal__stat-num cc-mono">{Math.round(totalUnits)}</span>
            <span className="cc-modal__stat-label">UNITS</span>
          </div>
          <div className="cc-modal__stat">
            <span className="cc-modal__stat-num cc-mono">{totalHours.toFixed(1)}</span>
            <span className="cc-modal__stat-label">HOURS</span>
          </div>
          <div className="cc-modal__stat">
            <span className="cc-modal__stat-num cc-mono">{projects.length}</span>
            <span className="cc-modal__stat-label">PROJECT{projects.length > 1 ? "S" : ""}</span>
          </div>
        </div>

        <div className="cc-modal__body">
          {projects.length > 0 && (
            <section className="cc-modal__section">
              <h4 className="cc-modal__sec-title"><Boxes size={13} /> Projects scheduled</h4>
              <div className="cc-projlist">
                {projects.map((p) => {
                  const delivery = operativeDelivery(p);
                  return (
                    <div key={p.id} className="cc-proj">
                      <div className="cc-proj__top">
                        <div className="cc-proj__id">
                          <span className="cc-proj__pi">{p.invoice?.piNumber || "No PI"}</span>
                          <span className="cc-proj__cust">
                            {p.customer?.name || "No customer on file"}
                          </span>
                        </div>
                        <div className="cc-proj__badges">
                          {p.scheduleMode && (
                            <span className="cc-badge" style={{ color: MODE_TONE[p.scheduleMode], borderColor: "currentColor" }}>
                              {p.scheduleMode}
                            </span>
                          )}
                          {p.difficulty && <span className="cc-badge">{p.difficulty}</span>}
                          {p.status && <span className="cc-badge">{stageName(p.status)}</span>}
                        </div>
                      </div>
                      <div className="cc-proj__meta cc-mono">
                        <span>Delivery: {delivery ? new Date(delivery).toLocaleDateString() : "—"}</span>
                        {typeof p.totalProjectQuantity === "number" && <span>{p.totalProjectQuantity} total units</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="cc-modal__section">
            <h4 className="cc-modal__sec-title"><Activity size={13} /> Stage load &amp; allocations</h4>
            <div className="cc-detail__body">
              {displayRows.map((r) => {
                const eff = effMax(r);
                const meta = STAGE_META[r.stage as CapacityStage];
                const allocs = allocsOf(r);
                const totalUnits = allocs.reduce((s: number, a: any) => s + (a.allocatedUnits || 0), 0);
                const totalHours = allocs.reduce((s: number, a: any) => s + (a.allocatedHours || 0), 0);
                const frac = eff > 0 ? totalUnits / eff : 0;
                const over = totalUnits > eff;
                const isDesign = r.stage === CapacityStage.DESIGN;
                
                return (
                  <div key={r.id} className="cc-detail__stage" style={{ "--stage-accent": meta?.color } as React.CSSProperties}>
                    <div className="cc-detail__stageHead">
                      <span className="cc-railrow__name">
                        <span className="cc-dot" style={{ background: meta?.color }} />
                        {stageName(r.stage)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {over && isDesign && (
                          <span
                            style={{
                              background: "var(--cc-over)",
                              color: "#fff",
                              fontSize: "8.5px",
                              fontWeight: 800,
                              padding: "2px 5px",
                              borderRadius: "4px",
                            }}
                          >
                            +{Math.round(((totalUnits - eff) / eff) * 100)}% OC
                          </span>
                        )}
                        <span className={`cc-pill ${over ? "cc-pill--over" : ""}`}>
                          {over ? `${Math.round(frac * 100)}%` : clampPct(frac * 100)}
                        </span>
                      </div>
                    </div>
                    <Meter frac={frac} isDesign={isDesign} over={over} />
                    <div className="cc-detail__nums cc-mono">
                      <span>{totalUnits} / {Math.round(eff)} units</span>
                      <span>{totalHours.toFixed(1)} / {dayHoursOf(r).toFixed(1)} day h</span>
                    </div>
                    {over && isDesign && (
                      <div className="cc-detail__over cc-mono">
                        ⚠ Over by {Math.max(0, Math.round(totalUnits - eff))} units
                      </div>
                    )}
                    {allocs.length > 0 && (
                      <div className="cc-allocs">
                        {allocs.map((a: any) => (
                          <div key={a.id} className="cc-alloc">
                            <span className="cc-alloc__proj">
                              {a.projectStage?.project?.invoice?.piNumber || 
                               a.projectStage?.project?.customer?.name || "—"}
                            </span>
                            <span className="cc-alloc__u cc-mono">{a.allocatedUnits}u · {a.allocatedHours}h</span>
                            {a.isOverCapacity && <span className="cc-alloc__over">OVER</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Ledger: React.FC<{
  rows: any[]; effMax: (r: any) => number; allocsOf: (r: any) => any[];
  slots: Record<string, any>;
}> = ({ rows, effMax, allocsOf, slots }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showAllStagesForDate, setShowAllStagesForDate] = useState(false);

  const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const allPossibleStages = Object.values(ProjectStatus);

  const getProcessedRows = () => {
    let filtered = [...sorted];
    
    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(r => dateKeyOf(r.date) === selectedDate);
    }
    
    // Apply stage filter
    if (selectedStage) {
      filtered = filtered.filter(r => r.stage === selectedStage);
    }
    
    // Show all stages for selected date (only when date is selected and stage is not filtered)
    if (selectedDate && showAllStagesForDate && !selectedStage) {
      const existingStages = new Set(filtered.map(r => r.stage));
      const result = [...filtered];
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
    }
    
    return filtered;
  };

  const finalRows = getProcessedRows();

  // Get unique stages for filter dropdown
  const uniqueStages = Array.from(new Set(rows.map(r => r.stage))).sort((a, b) => 
    allPossibleStages.indexOf(a) - allPossibleStages.indexOf(b)
  );

  // Get unique dates for filter dropdown
  const uniqueDates = Array.from(new Set(rows.map(r => dateKeyOf(r.date)))).sort();

  return (
    <div className="cc-ledger">
      <div className="cc-ledger__filters" style={{ 
        marginBottom: '1rem', 
        padding: '0.75rem', 
        background: 'var(--cc-inset)', 
        borderRadius: '6px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Date Filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>Filter by date:</span>
          <select 
            value={selectedDate || ''} 
            onChange={(e) => {
              const newDate = e.target.value || null;
              setSelectedDate(newDate);
              if (newDate) {
                setShowAllStagesForDate(true);
              } else {
                setShowAllStagesForDate(false);
              }
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
            {uniqueDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </label>

        {/* Stage Filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>Filter by stage:</span>
          <select 
            value={selectedStage || ''} 
            onChange={(e) => {
              const newStage = e.target.value || null;
              setSelectedStage(newStage);
              setOpen({});
            }}
            style={{ 
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--cc-line)',
              background: 'var(--cc-surface)'
            }}
          >
            <option value="">All stages</option>
            {uniqueStages.map(stage => (
              <option key={stage} value={stage}>
                {stageName(stage)}
              </option>
            ))}
          </select>
        </label>

        {/* Show All Stages Checkbox (only visible when date is selected AND no stage filter) */}
        {selectedDate && !selectedStage && (
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

        {/* Clear Filters Button */}
        {(selectedDate || selectedStage) && (
          <button
            onClick={() => {
              setSelectedDate(null);
              setSelectedStage(null);
              setShowAllStagesForDate(false);
              setOpen({});
            }}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              border: '1px solid var(--cc-line)',
              background: 'var(--cc-surface)',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter Summary */}
      {(selectedDate || selectedStage) && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--cc-surface)',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: 'var(--cc-dim)'
        }}>
          Showing {finalRows.length} row(s)
          {selectedDate && <span> · Date: <strong>{selectedDate}</strong></span>}
          {selectedStage && <span> · Stage: <strong>{stageName(selectedStage)}</strong></span>}
        </div>
      )}

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
                  <Meter frac={frac} isDesign={isDesign} over={over} thin />
                  <b className="cc-mono" style={{ color: isZeroRow ? 'var(--cc-dim)' : heatVar(frac, isDesign, over) }}>
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
      
      {/* Empty State */}
      {finalRows.length === 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--cc-dim)',
          background: 'var(--cc-inset)',
          borderRadius: '6px'
        }}>
          No data found for the selected filters.
          {(selectedDate || selectedStage) && (
            <button
              onClick={() => {
                setSelectedDate(null);
                setSelectedStage(null);
                setShowAllStagesForDate(false);
              }}
              style={{
                display: 'block',
                margin: '1rem auto 0',
                padding: '0.5rem 1rem',
                background: 'var(--cc-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
/* ------------------------------------------------------------------ *
 * Scoped styles — Production Control Board
 * ------------------------------------------------------------------ */
const CC_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
.capcal .cc-cell__row--overcapacity {
  border-color: var(--cc-over) !important;
  background: color-mix(in srgb, var(--cc-over) 15%, transparent) !important;
}

.capcal .cc-cell__row--overcapacity .cc-cell__rowpct {
  color: var(--cc-over) !important;
  font-weight: 800;
}

.capcal .cc-cell__row--overcapacity .cc-cell__rowdot {
  background: var(--cc-over) !important;
}

.capcal .cc-over-badge {
  background: color-mix(in srgb, var(--cc-over) 15%, transparent);
  color: var(--cc-over);
  font-size: 8px;
  font-weight: 800;
  padding: 1px 3px;
  border-radius: 3px;
}
.capcal{
  --cc-display:'Inter',ui-sans-serif,system-ui,sans-serif;
  --cc-mono:'DM Mono',ui-monospace,SFMono-Regular,monospace;
  --cc-idle: hsl(var(--muted-foreground)/.35);
  --cc-low:#14b8a6; --cc-med:#f59e0b; --cc-high:#f97316; --cc-crit:#ef4444; --cc-over:#dc2626;
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
.capcal .cc-select{font-family:var(--cc-mono);font-size:13px;padding:8px 12px;border-radius:8px;
  border:1px solid var(--cc-line);background:var(--cc-surface);color:var(--cc-ink);}

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
.capcal .cc-spin{animation:cc-rot 1s linear infinite;}
@keyframes cc-rot{to{transform:rotate(360deg)}}

.capcal .cc-error{display:flex;align-items:center;gap:10px;border:1px solid color-mix(in srgb,var(--cc-over) 40%,transparent);
  background:color-mix(in srgb,var(--cc-over) 8%,transparent);color:var(--cc-over);padding:12px 16px;border-radius:11px;font-size:13px;}

.capcal .cc-telemetry-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4px;}
.capcal .cc-telemetry-header__left{display:flex;align-items:center;gap:8px;}
.capcal .cc-range-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-mono);
  font-size:11.5px;font-weight:600;color:var(--cc-low);padding:5px 12px;border-radius:8px;
  background:color-mix(in srgb,var(--cc-low) 10%,transparent);
  border:1px solid color-mix(in srgb,var(--cc-low) 22%,transparent);}

.capcal .cc-select-wrap{position:relative;display:inline-flex;align-items:center;}
.capcal .cc-select-wrap__icon{position:absolute;left:10px;color:var(--cc-dim);pointer-events:none;z-index:1;}
.capcal .cc-stats-select,.capcal .cc-rail-select{font-family:var(--cc-mono);font-size:11.5px;
  padding:7px 12px 7px 30px;border-radius:9px;border:1px solid var(--cc-line);
  background:var(--cc-surface);color:var(--cc-ink);cursor:pointer;outline:none;}

.capcal .cc-telemetry{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
@media(max-width:880px){.capcal .cc-telemetry{grid-template-columns:repeat(2,1fr);}}
.capcal .cc-tile{border:1px solid var(--cc-line);border-radius:12px;background:var(--cc-surface);padding:14px 16px;
  display:flex;flex-direction:column;gap:8px;animation:cc-rise .5s both;}
.capcal .cc-tile__head{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.04em;color:var(--cc-dim);text-transform:uppercase;}
.capcal .cc-tile__ic{display:inline-flex;color:var(--cc-low);}
.capcal .cc-tile__val{font-size:30px;font-weight:500;line-height:1;}
.capcal .cc-tile__foot{font-size:10.5px;color:var(--cc-dim);}

.capcal .cc-track{height:8px;border-radius:99px;background:var(--cc-inset);overflow:hidden;}
.capcal .cc-track--thin{height:5px;}
.capcal .cc-fill{height:100%;border-radius:99px;transition:width .7s cubic-bezier(.16,1,.3,1);}

.capcal .cc-controls{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:center;}
.capcal .cc-chips{display:flex;gap:6px;flex-wrap:wrap;}
.capcal .cc-chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-mono);font-size:11px;
  padding:6px 11px;border-radius:8px;border:1px solid var(--cc-line);background:var(--cc-surface);color:var(--cc-dim);
  cursor:pointer;transition:.18s;}
.capcal .cc-chip:hover{color:var(--cc-ink);border-color:var(--cc-dim);}
.capcal .cc-chip.is-on{background:var(--cc-ink);color:hsl(var(--background));border-color:var(--cc-ink);}
.capcal .cc-chip.is-on .cc-dot{box-shadow:0 0 0 2px hsl(var(--background));}
.capcal .cc-dot{width:8px;height:8px;border-radius:99px;display:inline-block;flex:none;}
.capcal .cc-right{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.capcal .cc-legend{display:flex;gap:10px;}
.capcal .cc-legend__i{display:inline-flex;align-items:center;gap:5px;font-family:var(--cc-mono);font-size:10px;color:var(--cc-dim);}
.capcal .cc-legend__i i{width:10px;height:10px;border-radius:3px;}
.capcal .cc-seg{display:inline-flex;border:1px solid var(--cc-line);border-radius:9px;overflow:hidden;background:var(--cc-surface);}
.capcal .cc-seg button{display:inline-flex;align-items:center;gap:6px;font-family:var(--cc-display);font-size:12.5px;
  padding:7px 13px;border:0;background:transparent;color:var(--cc-dim);cursor:pointer;}
.capcal .cc-seg button.is-on{background:var(--cc-ink);color:hsl(var(--background));}

.capcal .cc-board{border:1px solid var(--cc-line);border-radius:14px;background:var(--cc-surface);padding:14px;}
.capcal .cc-board__head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.capcal .cc-monthnav{display:flex;align-items:center;gap:10px;}
.capcal .cc-monthnav button{width:30px;height:30px;border-radius:8px;border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-ink);cursor:pointer;display:grid;place-items:center;}
.capcal .cc-monthnav button:hover{background:var(--cc-inset);}
.capcal .cc-monthnav__label{display:flex;flex-direction:column;line-height:1.05;min-width:160px;text-align:center;}
.capcal .cc-month{font-size:18px;font-weight:600;}
.capcal .cc-month__e{font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-today{font-family:var(--cc-mono);font-size:11px;letter-spacing:.08em;padding:7px 13px;border-radius:8px;
  border:1px solid var(--cc-line);background:transparent;color:var(--cc-dim);cursor:pointer;}
.capcal .cc-today--dated{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 16px;}
.capcal .cc-today--dated span:first-child{font-size:12px;font-weight:700;color:var(--cc-ink);}
.capcal .cc-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;}
.capcal .cc-dow span{font-family:var(--cc-mono);font-size:10px;letter-spacing:.12em;color:var(--cc-dim);text-align:center;}
.capcal .cc-dow .cc-dow--off{color:color-mix(in srgb,var(--cc-dim) 55%,transparent);}
.capcal .cc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.capcal .cc-cell{min-height:128px;border:1px solid var(--cc-line);border-radius:10px;background:var(--cc-surface);
  padding:7px;display:flex;flex-direction:column;gap:4px;text-align:left;cursor:default;position:relative;
  transition:transform .18s,box-shadow .18s,border-color .18s;animation:cc-rise .4s both;}
.capcal .cc-cell--active{cursor:pointer;}
.capcal .cc-cell--active:hover{transform:translateY(-2px);box-shadow:0 8px 22px -10px color-mix(in srgb,var(--heat) 60%,transparent);
  border-color:color-mix(in srgb,var(--heat) 55%,var(--cc-line));z-index:2;}
.capcal .cc-cell--out{opacity:.4;}
.capcal .cc-cell--off{background-image:repeating-linear-gradient(45deg,transparent,transparent 6px,var(--cc-inset) 6px,var(--cc-inset) 7px);}
.capcal .cc-cell--today{border-color:var(--cc-ink);box-shadow:inset 0 0 0 1px var(--cc-ink);}
.capcal .cc-cell--sel{border-color:var(--heat);box-shadow:0 0 0 2px color-mix(in srgb,var(--heat) 45%,transparent);z-index:3;}
.capcal .cc-cell__top{display:flex;justify-content:space-between;align-items:center;gap:4px;}
.capcal .cc-cell__dates{display:inline-flex;align-items:baseline;gap:5px;}
.capcal .cc-cell__d{font-size:14px;font-weight:600;color:var(--cc-ink);}
.capcal .cc-cell__ed{font-size:11px;font-weight:800;color:var(--cc-low);}
.capcal .cc-cell__peak{font-size:10px;font-weight:800;color:#fff;padding:0 6px;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.2);}
.capcal .cc-cell__bars{display:flex;flex-direction:column;gap:3px;margin-top:auto;}
.capcal .cc-cell__row{position:relative;display:flex;align-items:center;gap:5px;height:18px;padding:0 6px;border-radius:5px;
  border:1px solid color-mix(in srgb,var(--stage-color) 52%,transparent);
  background:color-mix(in srgb,var(--stage-color) 7%,var(--cc-inset));overflow:hidden;}
.capcal .cc-cell__rowfill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;transition:width .7s cubic-bezier(.16,1,.3,1);}
.capcal .cc-cell__rowdot{position:relative;width:5px;height:5px;border-radius:99px;flex:none;}
.capcal .cc-cell__grip{position:relative;color:var(--cc-dim);flex:none;opacity:.35;}
.capcal .cc-cell__row--draggable .cc-cell__grip{opacity:.35;}
.capcal .cc-cell__row--draggable:hover .cc-cell__grip{opacity:.8;}
.capcal .cc-cell__row--draggable{cursor:grab;}
.capcal .cc-cell__row--static{cursor:default;}
.capcal .cc-cell__rowabbr{position:relative;font-size:9px;font-weight:700;color:var(--cc-ink);
  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.capcal .cc-cell__rowpct{position:relative;font-size:9.5px;font-weight:700;color:var(--cc-ink);}
.capcal .cc-design-over-badge{font-size:8px;font-weight:800;background:color-mix(in srgb,var(--cc-over) 15%,transparent);
  padding:1px 3px;border-radius:3px;}
.capcal .cc-project-count{font-size:7px;color:var(--cc-dim);background:var(--cc-inset);padding:0 3px;border-radius:3px;}
.capcal .cc-cell__more{font-size:9px;color:var(--cc-dim);align-self:flex-start;padding:1px 5px;border-radius:5px;
  border:1px dashed var(--cc-line);background:var(--cc-surface);}
@media(max-width:760px){
  .capcal .cc-cell{min-height:60px;}
  .capcal .cc-cell__bars{display:none;}
}
@keyframes cc-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}

.capcal .cc-panel{border:1px solid var(--cc-line);border-radius:14px;background:var(--cc-surface);overflow:hidden;}
.capcal .cc-panel__head{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid var(--cc-line);
  font-size:10.5px;text-transform:uppercase;color:var(--cc-dim);}
.capcal .cc-railscroll{padding:10px 12px;display:flex;flex-direction:column;gap:10px;max-height:520px;overflow:auto;}
.capcal .cc-railrow__top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
.capcal .cc-railrow__name{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:500;}
.capcal .cc-railrow__val{font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-panel__hint{padding:0 12px 10px;font-size:10px;color:var(--cc-dim);}
.capcal .cc-rail-range{padding:8px 12px;border-bottom:1px solid var(--cc-line);}
.capcal .cc-rail-range .cc-select-wrap{width:100%;}

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
.capcal .cc-lrow__flag{font-size:9px;color:#fff;background:var(--cc-over);padding:1px 5px;border-radius:4px;}
.capcal .cc-lexpand{padding:10px 16px 14px;background:var(--cc-inset);border-bottom:1px solid var(--cc-line);}
.capcal .cc-alloc{display:flex;align-items:center;gap:8px;font-size:11.5px;background:var(--cc-inset);border-radius:8px;padding:6px 9px;}
.capcal .cc-alloc__proj{font-weight:500;}
.capcal .cc-alloc__u{font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-alloc__over{font-size:9px;color:#fff;background:var(--cc-over);padding:2px 6px;border-radius:5px;}
.capcal .cc-alloc__ok{font-size:9px;color:var(--cc-low);}
.capcal .cc-alloc--wide{flex-wrap:wrap;gap:12px;}

.capcal .cc-skeleton,.capcal .cc-empty{border:1px dashed var(--cc-line);border-radius:14px;background:var(--cc-surface);
  padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--cc-dim);text-align:center;}
.capcal .cc-spinner{width:34px;height:34px;border-radius:99px;border:2px solid var(--cc-inset);border-top-color:var(--cc-low);animation:cc-rot .8s linear infinite;}

.capcal .cc-modal{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:20px;}
.capcal .cc-modal__scrim{position:absolute;inset:0;background:rgba(8,10,18,.58);backdrop-filter:blur(5px);animation:cc-fade .22s both;}
.capcal .cc-modal__card{position:relative;width:min(600px,100%);max-height:88vh;display:flex;flex-direction:column;
  background:#ffffff;border:1px solid var(--cc-line);border-radius:18px;overflow:hidden;
  box-shadow:0 40px 100px -28px rgba(0,0,0,.6);animation:cc-pop .28s cubic-bezier(.16,1,.3,1) both;}
@keyframes cc-fade{from{opacity:0}to{opacity:1}}
@keyframes cc-pop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}

.capcal .cc-modal__head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 22px;
  border-bottom:1px solid var(--cc-line);background:linear-gradient(145deg,#ffffff,#f4f5f8);}
.capcal .cc-modal__head-left{display:flex;align-items:center;gap:12px;}
.capcal .cc-modal__ic{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;
  background:color-mix(in srgb,var(--cc-low) 20%,transparent);color:var(--cc-low);}
.capcal .cc-modal__date-block{display:flex;flex-direction:column;gap:1px;}
.capcal .cc-modal__weekday{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--cc-low);font-weight:700;}
.capcal .cc-modal__fulldate{font-size:15px;font-weight:700;color:var(--cc-ink);}
.capcal .cc-modal__ethdate{font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-modal__dayutil{display:flex;flex-direction:column;align-items:center;padding:6px 14px;border-radius:10px;
  background:color-mix(in srgb,var(--util-heat) 12%,transparent);}
.capcal .cc-modal__dayutil-val{font-size:18px;font-weight:800;color:var(--util-heat);}
.capcal .cc-modal__dayutil-label{font-size:8.5px;text-transform:uppercase;color:var(--cc-dim);}
.capcal .cc-modal__close{width:28px;height:28px;border-radius:8px;border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-dim);cursor:pointer;font-size:12px;display:grid;place-items:center;}
.capcal .cc-modal__stats{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--cc-line);}
.capcal .cc-modal__stat{padding:14px 16px;display:flex;flex-direction:column;gap:4px;border-right:1px solid var(--cc-line);background:#ffffff;}
.capcal .cc-modal__stat:last-child{border-right:0;}
.capcal .cc-modal__stat-num{font-size:24px;font-weight:600;color:var(--cc-ink);}
.capcal .cc-modal__stat-label{font-size:8.5px;letter-spacing:.14em;color:var(--cc-dim);font-weight:600;}
.capcal .cc-modal__body{padding:20px 22px;overflow:auto;display:flex;flex-direction:column;gap:24px;background:#ffffff;}
.capcal .cc-modal__sec-title{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--cc-dim);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--cc-line);}
.capcal .cc-projlist{display:flex;flex-direction:column;gap:8px;}
.capcal .cc-proj{border:1px solid var(--cc-line);border-radius:12px;padding:12px 14px;background:var(--cc-inset);}
.capcal .cc-proj__top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}
.capcal .cc-proj__id{display:flex;flex-direction:column;min-width:0;}
.capcal .cc-proj__pi{font-size:14.5px;font-weight:700;color:var(--cc-ink);}
.capcal .cc-proj__cust{font-size:11.5px;color:var(--cc-dim);}
.capcal .cc-proj__badges{display:flex;gap:5px;}
.capcal .cc-badge{font-family:var(--cc-mono);font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid var(--cc-line);color:var(--cc-dim);}
.capcal .cc-proj__meta{display:flex;justify-content:space-between;gap:10px;font-size:10.5px;color:var(--cc-dim);}
.capcal .cc-detail__body{padding:6px 0;display:flex;flex-direction:column;gap:14px;}
.capcal .cc-detail__stage{padding:12px 14px;border:1px solid var(--cc-line);border-radius:11px;background:#ffffff;position:relative;}
.capcal .cc-detail__stage::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--stage-accent);border-radius:0 3px 3px 0;}
.capcal .cc-detail__stageHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.capcal .cc-pill{font-family:var(--cc-mono);font-size:11px;padding:3px 10px;border-radius:8px;background:var(--cc-inset);font-weight:600;}
.capcal .cc-pill--over{background:color-mix(in srgb,var(--cc-over) 18%,transparent);color:var(--cc-over);}
.capcal .cc-detail__nums{display:flex;justify-content:space-between;font-size:10.5px;color:var(--cc-dim);margin-top:6px;}
.capcal .cc-detail__over{margin-top:6px;font-size:10.5px;color:var(--cc-over);}
.capcal .cc-allocs{margin-top:9px;display:flex;flex-direction:column;gap:5px;}
.capcal .cc-alloc--wide{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}

.capcal .cc-drag-overlay{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:10px;
  background:#ffffff;border:1px solid var(--cc-line);box-shadow:0 12px 32px -8px rgba(0,0,0,.28);
  font-size:12px;font-weight:600;color:var(--cc-ink);white-space:nowrap;pointer-events:none;z-index:999;}
.capcal .cc-reschedule-overlay{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;gap:10px;
  background:rgba(255,255,255,.72);backdrop-filter:blur(3px);border-radius:14px;font-size:14px;font-weight:600;pointer-events:none;}

.dark .capcal .cc-cell--today{box-shadow:inset 0 0 0 1px hsl(var(--foreground)/.7);}
.dark .capcal .cc-modal__scrim{background:rgba(0,0,0,.72);}
.dark .capcal .cc-modal__card{background:#0c0e14;}
.dark .capcal .cc-modal__head{background:linear-gradient(145deg,#13161d,#0c0e14);}
.dark .capcal .cc-modal__stat,.dark .capcal .cc-modal__body{background:#0c0e14;}
.dark .capcal .cc-detail__stage{background:#13161d;}
.dark .capcal .cc-badge{background:#13161d;}
.dark .capcal .cc-drag-overlay{background:#1a1d26;border-color:#2a2d36;color:#e8eaed;}
`;

export default ThCapacityCalendar;