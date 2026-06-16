/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * StageAllocationCalendar — a lean, view-only month calendar scoped to ONE
 * stage. Embedded on each stage's page to show that stage's daily capacity
 * allocation (units, % of capacity, per-project breakdown). No drag, no
 * reschedule — pure read-only. Helpers mirror features/Project/calander.tsx.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDailyStageCapacities } from "@/service/Category";
import { getAllCapacitySlots } from "@/service/CapacityLot";

/* ------------------------------------------------------------------ *
 * Constants & helpers (mirror calander.tsx)
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
const OVERCAPACITY_FACTOR = 1.25;

// Per-stage color + display label (covers all 11 workflow stages).
const STAGE_META: Record<string, { color: string; label: string }> = {
  DESIGN: { color: "#8b5cf6", label: "Design" },
  PURCHASING: { color: "#a855f7", label: "Purchasing" },
  METAL_WORKS: { color: "#3b82f6", label: "Metal Works" },
  CNC: { color: "#06b6d4", label: "CNC" },
  CUTTING: { color: "#f59e0b", label: "Cutting" },
  EDGE_BANDING: { color: "#10b981", label: "Edge Banding" },
  ASSEMBLY: { color: "#ef4444", label: "Assembly" },
  PAINTING: { color: "#ec4899", label: "Painting" },
  FINISHING: { color: "#6366f1", label: "Finishing" },
  DELIVERY: { color: "#14b8a6", label: "Delivery" },
  INSTALLATION: { color: "#64748b", label: "Installation" },
};
// Time-based stages have no daily capacity allocations.
const TIME_BASED = new Set(["PURCHASING", "INSTALLATION"]);

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

const dateKeyOf = (raw: any): string =>
  typeof raw === "string" ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
const keyOf = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const dateFromKey = (key: string) => new Date(`${key}T12:00:00`);

const dayHoursOf = (r: any) => r.maxHours || r.workingHours || 7.5;
const dayFrac = (r: any) => (dayHoursOf(r) > 0 ? (r.usedHours || 0) / dayHoursOf(r) : 0);
// True ratio vs the 100% base (uncapped).
const rowFrac = (r: any, eff: number) => {
  if (eff > 0) return (r.usedCapacity || 0) / eff;
  return dayFrac(r);
};

// Heat ramp → hex (self-contained; mirrors calander.tsx --cc-* vars).
const heatColor = (frac: number) => {
  if (frac > OVERCAPACITY_FACTOR + 0.0001) return "#7f1d1d"; // violation
  if (frac > 1.0001) return "#dc2626"; // over
  if (frac >= 0.9) return "#ef4444";
  if (frac >= 0.75) return "#f97316";
  if (frac >= 0.5) return "#f59e0b";
  if (frac > 0) return "#14b8a6";
  return "transparent";
};

// Effective daily ceiling — identical logic to calander.tsx effMax.
const effMaxOf = (r: any, slots: Record<string, any>) => {
  const lot = slots[r.stage] || { parallelSlots: 1, workingHours: 7.5, capacity: 0 };
  const stored = r.maxCapacity || 0;
  const slotsN = lot.parallelSlots || 1;
  const whpd = r.workingHours || lot.workingHours || 7.5;
  const shift = r.shift || "CUSTOM";
  const sh = shift === "CUSTOM" ? whpd : SHIFT_HOURS[shift] || whpd;
  const lotEff = (lot.capacity || 0) * (sh / whpd) * slotsN;
  if (stored > 0) {
    if (slotsN > 1 && lotEff > 0 && stored < lotEff * 0.6) return lotEff;
    return stored;
  }
  return lotEff > 0 ? lotEff : stored;
};

const projectLabelOf = (a: any) =>
  a?.projectStage?.project?.invoice?.piNumber ||
  a?.projectStage?.project?.customer?.name ||
  "Unassigned";

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */
const StageAllocationCalendar: React.FC<{ stage: string; title?: string }> = ({ stage, title }) => {
  const meta = STAGE_META[stage] || { color: "#64748b", label: stage.replace(/_/g, " ") };
  const [rows, setRows] = useState<any[]>([]);
  const [slots, setSlots] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [caps, lotRes] = await Promise.all([
          getAllDailyStageCapacities(),
          getAllCapacitySlots().catch(() => ({ capacitySlots: [] })),
        ]);
        if (cancelled) return;
        const map: Record<string, any> = {};
        ((lotRes as any)?.capacitySlots || []).forEach((l: any) => {
          map[l.stage] = {
            parallelSlots: l.parallelSlots || 1,
            workingHours: l.workingHours || 7.5,
            capacity: l.capacity || 0,
          };
        });
        setSlots(map);
        setRows(Array.isArray(caps) ? caps : []);
      } catch (e) {
        if (!cancelled) setError("Failed to load allocation data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // One DailyStageCapacity row per (stage, day) → index this stage by day.
  const byDay = useMemo(() => {
    const m: Record<string, any> = {};
    rows.forEach((r) => { if (r.stage === stage) m[dateKeyOf(r.date)] = r; });
    return m;
  }, [rows, stage]);

  const weeks = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDow = first.getDay();
    const cells: { key: string; day: number; inMonth: boolean; date: Date }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(cursor.y, cursor.m, 1 - startDow + i);
      cells.push({ key: keyOf(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: d.getMonth() === cursor.m, date: d });
    }
    const w: (typeof cells)[] = [];
    for (let i = 0; i < 6; i += 1) w.push(cells.slice(i * 7, i * 7 + 7));
    return w;
  }, [cursor]);

  const todayKey = useMemo(() => { const n = new Date(); return keyOf(n.getFullYear(), n.getMonth(), n.getDate()); }, []);

  // Month totals (in-month days only).
  const totals = useMemo(() => {
    let units = 0; let activeDays = 0; let overDays = 0;
    Object.entries(byDay).forEach(([k, r]) => {
      const d = dateFromKey(k);
      if (d.getMonth() !== cursor.m || d.getFullYear() !== cursor.y) return;
      const u = (r as any).usedCapacity || 0;
      if (u > 0) { units += u; activeDays += 1; }
      const eff = effMaxOf(r, slots);
      if (rowFrac(r, eff) > 1.0001) overDays += 1;
    });
    return { units: Math.round(units * 100) / 100, activeDays, overDays };
  }, [byDay, cursor, slots]);

  const monthGreg = `${MONTHS[cursor.m]} ${cursor.y}`;
  const monthEth = ethLabel(new Date(cursor.y, cursor.m, 15));
  const goPrev = useCallback(() => setCursor((c) => { const d = new Date(c.y, c.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; }), []);
  const goNext = useCallback(() => setCursor((c) => { const d = new Date(c.y, c.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; }), []);
  const goToday = useCallback(() => { const n = new Date(); setCursor({ y: n.getFullYear(), m: n.getMonth() }); }, []);

  const selectedRow = selectedKey ? byDay[selectedKey] : null;

  /* ----- Time-based stages have no daily capacity allocations ----- */
  if (TIME_BASED.has(stage)) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          <h3 className="text-sm font-semibold">{title || `${meta.label} — allocation`}</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {meta.label} is a time-based stage — it is scheduled by elapsed time and has no daily capacity allocation to display.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          <div className="leading-tight">
            <h3 className="text-sm font-semibold">{title || `${meta.label} — allocation`}</h3>
            <p className="text-xs text-muted-foreground">
              {monthGreg} · <span className="tabular-nums">{monthEth} E.C.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
            <span><b className="text-foreground tabular-nums">{totals.units}</b> units</span>
            <span><b className="text-foreground tabular-nums">{totals.activeDays}</b> active days</span>
            <span className={totals.overDays > 0 ? "text-red-600" : ""}>
              <b className="tabular-nums">{totals.overDays}</b> over
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={goToday}>Today</Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading allocations…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="p-3">
          {/* Weekday header */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{w}</div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((cell) => {
              const r = byDay[cell.key];
              const isSunday = cell.date.getDay() === 0;
              const eff = r ? effMaxOf(r, slots) : 0;
              const frac = r ? rowFrac(r, eff) : 0;
              const units = r ? (r.usedCapacity || 0) : 0;
              const isToday = cell.key === todayKey;
              const isSel = cell.key === selectedKey;
              const over = frac > 1.0001;
              const violation = frac > OVERCAPACITY_FACTOR + 0.001;
              return (
                <button
                  type="button"
                  key={cell.key}
                  onClick={() => r && setSelectedKey(isSel ? null : cell.key)}
                  className={[
                    "flex min-h-[64px] flex-col rounded-lg border p-1.5 text-left transition",
                    cell.inMonth ? "" : "opacity-40",
                    isSunday ? "bg-muted/40" : "",
                    isToday ? "ring-2 ring-primary/50" : "",
                    isSel ? "border-primary" : "border-border",
                    r ? "cursor-pointer hover:border-primary/60" : "cursor-default",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isToday ? "text-primary" : ""}`}>{cell.day}</span>
                    <span className="text-[9px] text-muted-foreground">{gregorianToEthiopian(cell.date).date}</span>
                  </div>
                  {r && units > 0 && (
                    <div className="mt-auto">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold tabular-nums">{Math.round(units * 100) / 100}u</span>
                        <span
                          className="rounded px-1 text-[9px] font-bold text-white"
                          style={{ background: heatColor(frac) }}
                        >
                          {over ? `${Math.round(frac * 100)}%` : `${Math.min(Math.round(frac * 100), 100)}%`}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(frac, 1) * 100}%`, background: heatColor(frac) }} />
                        {violation && <span className="sr-only">violation</span>}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected-day detail */}
          {selectedRow && (
            <div className="mt-3 rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {dateFromKey(selectedKey as string).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  <span className="text-xs text-muted-foreground">· {ethLabel(dateFromKey(selectedKey as string))} E.C.</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedKey(null)}><X className="h-3.5 w-3.5" /></Button>
              </div>
              {(() => {
                const eff = effMaxOf(selectedRow, slots);
                const used = selectedRow.usedCapacity || 0;
                const frac = rowFrac(selectedRow, eff);
                const allocs = (selectedRow.projectStageCapacityAllocations || []) as any[];
                return (
                  <>
                    <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span><b className="text-foreground tabular-nums">{Math.round(used * 100) / 100}</b> / {Math.round(eff)} units</span>
                      <span style={{ color: frac > 1.0001 ? heatColor(frac) : undefined }}>
                        <b className="tabular-nums">{Math.round(frac * 100)}%</b> of capacity
                      </span>
                      {frac > OVERCAPACITY_FACTOR + 0.001 && (
                        <span className="rounded px-1 text-[10px] font-bold text-white" style={{ background: "#7f1d1d" }}>OVER 125%</span>
                      )}
                    </div>
                    {allocs.length > 0 ? (
                      <ul className="space-y-1">
                        {allocs.map((a, i) => (
                          <li key={i} className="flex items-center justify-between rounded border bg-card px-2 py-1 text-xs">
                            <span className="truncate font-medium">{projectLabelOf(a)}</span>
                            <span className="tabular-nums text-muted-foreground">{Math.round((a.allocatedUnits || 0) * 100) / 100} units</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No project allocations recorded for this day.</p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StageAllocationCalendar;
