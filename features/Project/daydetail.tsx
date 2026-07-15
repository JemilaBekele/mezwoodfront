/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Boxes,
  CalendarDays,
  Clock,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapacityStage } from "@/models/CapacityLot";
import { getAllDailyStageCapacities } from "@/service/Category";
import { getAllCapacitySlots } from "@/service/CapacityLot";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

// Helper functions
const ETHIOPIAN_MONTHS = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume",
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

const SHIFT_HOURS: Record<string, number> = {
  MORNING: 4, AFTERNOON: 3.5, FULL_DAY: 7.5, CUSTOM: 7.5,
};

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

const dayHoursOf = (r: any) => r.maxHours || r.workingHours || 7.5;

const clampPct = (v: number) => `${Math.min(Math.round(v), 100)}%`;

const heatVar = (frac: number, isDesignStage: boolean = false, over: boolean = false) => {
  if (isDesignStage && (over || frac > 1.0001)) return "var(--cc-over)";
  if (frac > 1.25) return "var(--cc-violation)";
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

const allocationStartMs = (a: any) =>
  new Date(a.startDateTime || a.customStartTime || a.allocationDate).getTime();

const earliestAllocationStart = (r: any, allocsOf: (r: any) => any[]) => {
  const starts = allocsOf(r).map(allocationStartMs).filter(Number.isFinite);
  return starts.length ? Math.min(...starts) : Number.MAX_SAFE_INTEGER;
};

const sortDayRows = (rows: any[], allocsOf: (r: any) => any[]) => {
  const STAGE_SORT = new Map<string, number>(STAGE_ORDER.map((s, i) => [s, i]));
  return [...rows].sort((a, b) => {
    const byStart = earliestAllocationStart(a, allocsOf) - earliestAllocationStart(b, allocsOf);
    if (byStart !== 0) return byStart;
    return (STAGE_SORT.get(a.stage) ?? 999) - (STAGE_SORT.get(b.stage) ?? 999);
  });
};

const MODE_TONE: Record<string, string> = {
  AUTO: "var(--cc-low)", MANUAL: "var(--cc-med)", LOCKED: "var(--cc-over)",
};

const operativeDelivery = (p: any) =>
  p?.finalDelivery || p?.manualDelivery || p?.calculatedDelivery || null;

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
export default function DayDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract date from URL pathname
  const dateParam = useMemo(() => {
    // URL pattern: /dashboard/capacityday/2026-06-15
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    // Validate date format YYYY-MM-DD
    if (lastPart && /^\d{4}-\d{2}-\d{2}$/.test(lastPart)) {
      return lastPart;
    }
    return null;
  }, [pathname]);
  
  const [rows, setRows] = useState<any[]>([]);
  const [slots, setSlots] = useState<Record<string, { parallelSlots: number; workingHours: number; capacity: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Log for debugging
  useEffect(() => {
    console.log("Date param:", dateParam);
    console.log("Pathname:", pathname);
  }, [dateParam, pathname]);

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

  const allocsOf = useCallback((r: any) =>
    r.projectStageCapacityAllocations || r.projectStage_capacityAllocations || [], []);

  // Filter rows for the selected date
  const dayRows = useMemo(() => {
    if (!dateParam) return [];
    const filtered = rows.filter((r) => dateKeyOf(r.date) === dateParam);
    console.log(`Filtering for date ${dateParam}, found ${filtered.length} rows`);
    return filtered;
  }, [rows, dateParam]);

  const displayRows = useMemo(() => sortDayRows(dayRows, allocsOf), [dayRows, allocsOf]);

  const projects = useMemo(() => {
    const m = new Map<string, any>();
    dayRows.forEach((r) =>
      allocsOf(r).forEach((a: any) => {
        const p = a.projectStage?.project;
        if (p && !m.has(p.id)) m.set(p.id, p);
      })
    );
    return Array.from(m.values());
  }, [dayRows, allocsOf]);

  const totalUnits = dayRows.reduce((s, r) => s + (r.usedCapacity || 0), 0);
  const totalHours = dayRows.reduce((s, r) => s + (r.usedHours || 0), 0);
  const dayUtil = useMemo(() => {
    const eff = dayRows.reduce((s, r) => s + effMax(r), 0);
    return eff > 0 ? (totalUnits / eff) * 100 : 0;
  }, [dayRows, effMax, totalUnits]);

  const d = dateParam ? dateFromKey(dateParam) : new Date();

  if (!dateParam) {
    return (
      <PageContainer scrollable={false}>
        <div className="flex flex-1 flex-col space-y-4">
          <div className="flex items-start justify-between">
            <Heading title="Invalid Date" description="No date specified" />
            <Button variant="outline" onClick={() => router.push("/dashboard/capacitycalendar")} className="gap-2">
              <ArrowLeft size={16} /> Back to Calendar
            </Button>
          </div>
          <Separator />
          <div className="day-detail-empty">
            <CalendarDays size={48} />
            <h2>Invalid date parameter</h2>
            <p>Please select a valid date from the calendar.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <div className="">
        <div className="flex items-start justify-between">
          <Heading 
            title={`Day Details: ${d.toLocaleDateString()}`} 
            description={`Capacity and allocation details for ${dateParam}`} 
          />
          <Button variant="outline" onClick={() => router.push("/dashboard/capacitycalendar")} className="gap-2">
            <ArrowLeft size={16} /> Back to Calendar
          </Button>
        </div>
        <Separator />

        {loading ? (
          <div className="day-detail-loading">
            <div className="cc-spinner" />
            <p>Loading day details...</p>
          </div>
        ) : error || dayRows.length === 0 ? (
          <div className="day-detail-empty">
            <CalendarDays size={48} />
            <h2>No data found for this date</h2>
            <p>{error || `No capacity allocations for ${dateParam}`}</p>
            <Button onClick={() => router.push("/dashboard/capacity")}>Return to Calendar</Button>
          </div>
        ) : (
          <div >
            <div className="day-detail-card">
              <div className="day-detail-head">
                <div className="day-detail-head-left">
                  <span className="day-detail-ic"><CalendarDays size={24} /></span>
                  <div className="day-detail-date-block">
                    <span className="day-detail-weekday">{d.toLocaleDateString(undefined, { weekday: "long" })}</span>
                    <span className="day-detail-fulldate">
                      {d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="day-detail-ethdate cc-mono">{ethLabel(d)} E.C.</span>
                  </div>
                </div>
                <div className="day-detail-dayutil" style={{ "--util-heat": heatVar(dayUtil / 100, false, dayUtil > 100) } as React.CSSProperties}>
                  <span className="day-detail-dayutil-val cc-mono">{clampPct(dayUtil)}</span>
                  <span className="day-detail-dayutil-label">Day load</span>
                </div>
              </div>

              <div className="day-detail-stats">
                <div className="day-detail-stat">
                  <span className="day-detail-stat-num cc-mono">{dayRows.length}</span>
                  <span className="day-detail-stat-label">STAGE{dayRows.length > 1 ? "S" : ""}</span>
                </div>
                <div className="day-detail-stat">
                  <span className="day-detail-stat-num cc-mono">{Math.round(totalUnits)}</span>
                  <span className="day-detail-stat-label">UNITS</span>
                </div>
                <div className="day-detail-stat">
                  <span className="day-detail-stat-num cc-mono">{totalHours.toFixed(1)}</span>
                  <span className="day-detail-stat-label">HOURS</span>
                </div>
                <div className="day-detail-stat">
                  <span className="day-detail-stat-num cc-mono">{projects.length}</span>
                  <span className="day-detail-stat-label">PROJECT{projects.length > 1 ? "S" : ""}</span>
                </div>
              </div>

              <div className="day-detail-body">
                {projects.length > 0 && (
                  <section className="day-detail-section">
                    <h4 className="day-detail-section-title"><Boxes size={16} /> Projects scheduled</h4>
                    <div className="day-detail-projlist">
                      {projects.map((p) => {
                        const delivery = operativeDelivery(p);
                        return (
                          <div key={p.id} className="day-detail-proj">
                            <div className="day-detail-proj-top">
                              <div className="day-detail-proj-id">
                                <span className="day-detail-proj-pi">{p.invoice?.piNumber || "No PI"}</span>
                                <span className="day-detail-proj-cust">
                                  {p.customer?.name || "No customer on file"}
                                </span>
                              </div>
                              <div className="day-detail-proj-badges">
                                {p.scheduleMode && (
                                  <span className="day-detail-badge" style={{ color: MODE_TONE[p.scheduleMode], borderColor: "currentColor" }}>
                                    {p.scheduleMode}
                                  </span>
                                )}
                                {p.difficulty && <span className="day-detail-badge">{p.difficulty}</span>}
                                {p.status && <span className="day-detail-badge">{stageName(p.status)}</span>}
                              </div>
                            </div>
                            <div className="day-detail-proj-meta cc-mono">
                              <span>Delivery: {delivery ? new Date(delivery).toLocaleDateString() : "—"}</span>
                              {typeof p.totalProjectQuantity === "number" && <span>{p.totalProjectQuantity} total units</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="day-detail-section">
                  <h4 className="day-detail-section-title"><Activity size={16} /> Stage load &amp; allocations</h4>
                  <div className="day-detail-stage-list">
                    {displayRows.map((r) => {
                      const eff = effMax(r);
                      const meta = STAGE_META[r.stage as CapacityStage];
                      const allocs = allocsOf(r);
                      const totalUnitsForStage = allocs.reduce((s: number, a: any) => s + (a.allocatedUnits || 0), 0);
                      const totalHoursForStage = allocs.reduce((s: number, a: any) => s + (a.allocatedHours || 0), 0);
                      const frac = eff > 0 ? totalUnitsForStage / eff : 0;
                      const over = totalUnitsForStage > eff;
                      const isDesign = r.stage === CapacityStage.DESIGN;
                      
                      return (
                        <div key={r.id} className="day-detail-stage" style={{ "--stage-accent": meta?.color } as React.CSSProperties}>
                          <div className="day-detail-stage-head">
                            <span className="day-detail-stage-name">
                              <span className="cc-dot" style={{ background: meta?.color }} />
                              {stageName(r.stage)}
                            </span>
                            <div className="day-detail-stage-badge-group">
                              {over && isDesign && (
                                <span className="day-detail-stage-over-badge">
                                  +{Math.round(((totalUnitsForStage - eff) / eff) * 100)}% OC
                                </span>
                              )}
                              <span className={`day-detail-pill ${over ? "day-detail-pill-over" : ""}`}>
                                {over ? `${Math.round(frac * 100)}%` : clampPct(frac * 100)}
                              </span>
                            </div>
                          </div>
                          <Meter frac={frac} isDesign={isDesign} over={over} />
                          <div className="day-detail-stage-nums cc-mono">
                            <span>{totalUnitsForStage} / {Math.round(eff)} units</span>
                            <span>{totalHoursForStage.toFixed(1)} / {dayHoursOf(r).toFixed(1)} day h</span>
                          </div>
                          {over && isDesign && (
                            <div className="day-detail-stage-over cc-mono">
                              ⚠ Over by {Math.max(0, Math.round(totalUnitsForStage - eff))} units
                            </div>
                          )}
                          {allocs.length > 0 && (
                            <div className="day-detail-allocs">
                              {allocs.map((a: any) => (
                                <div key={a.id} className="day-detail-alloc">
                                  <span className="day-detail-alloc-proj">
                                    {a.projectStage?.project?.invoice?.piNumber || 
                                      "—"}
                                      <span className="flex day-detail-proj-cust">
                                  { a.projectStage?.project?.customer?.name || ""}
                                </span>
                                  </span>
                                  <span className="day-detail-alloc-units cc-mono">{a.allocatedUnits}u · {a.allocatedHours}h</span>
                                  {a.isOverCapacity && <span className="day-detail-alloc-over">OVER</span>}
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
        )}
      </div>

      <style>{PAGE_STYLES}</style>
    </>
  );
}


const PAGE_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

.day-detail-content {
  max-width: 900px;
  margin: 0 auto;
}

.day-detail-card {
  background: var(--cc-surface);
  border: 1px solid var(--cc-line);
  border-radius: 18px;
  overflow: hidden;
}

.day-detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--cc-line);
  background: linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted)/.3));
}

.day-detail-head-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.day-detail-ic {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--cc-low) 20%, transparent);
  color: var(--cc-low);
}

.day-detail-date-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-detail-weekday {
  font-size: 11px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--cc-low);
  font-weight: 700;
}

.day-detail-fulldate {
  font-size: 18px;
  font-weight: 700;
  color: var(--cc-ink);
}

.day-detail-ethdate {
  font-size: 11.5px;
  color: var(--cc-dim);
}

.day-detail-dayutil {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 18px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--util-heat) 12%, transparent);
}

.day-detail-dayutil-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--util-heat);
}

.day-detail-dayutil-label {
  font-size: 9px;
  text-transform: uppercase;
  color: var(--cc-dim);
}

.day-detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--cc-line);
}

.day-detail-stat {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--cc-line);
  background: var(--cc-surface);
}

.day-detail-stat:last-child {
  border-right: 0;
}

.day-detail-stat-num {
  font-size: 28px;
  font-weight: 600;
  color: var(--cc-ink);
}

.day-detail-stat-label {
  font-size: 9px;
  letter-spacing: .14em;
  color: var(--cc-dim);
  font-weight: 600;
}

.day-detail-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.day-detail-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--cc-dim);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--cc-line);
}

.day-detail-projlist {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.day-detail-proj {
  border: 1px solid var(--cc-line);
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--cc-inset);
}

.day-detail-proj-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.day-detail-proj-id {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.day-detail-proj-pi {
  font-size: 15px;
  font-weight: 700;
  color: var(--cc-ink);
}

.day-detail-proj-cust {
  font-size: 12px;
  color: var(--cc-dim);
}

.day-detail-proj-badges {
  display: flex;
  gap: 6px;
}

.day-detail-badge {
  font-family: var(--cc-mono);
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 7px;
  border: 1px solid var(--cc-line);
  color: var(--cc-dim);
}

.day-detail-proj-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--cc-dim);
  margin-top: 8px;
}

.day-detail-stage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-detail-stage {
  padding: 14px 16px;
  border: 1px solid var(--cc-line);
  border-radius: 13px;
  background: var(--cc-surface);
  position: relative;
}

.day-detail-stage::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--stage-accent);
  border-radius: 0 3px 3px 0;
}

.day-detail-stage-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.day-detail-stage-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.day-detail-stage-badge-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.day-detail-stage-over-badge {
  background: var(--cc-over);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 5px;
}

.day-detail-pill {
  font-family: var(--cc-mono);
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 8px;
  background: var(--cc-inset);
  font-weight: 600;
}

.day-detail-pill-over {
  background: color-mix(in srgb, var(--cc-over) 18%, transparent);
  color: var(--cc-over);
}

.day-detail-stage-nums {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--cc-dim);
  margin-top: 8px;
}

.day-detail-stage-over {
  margin-top: 8px;
  font-size: 11px;
  color: var(--cc-over);
}

.day-detail-allocs {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-detail-alloc {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  background: var(--cc-inset);
  border-radius: 8px;
  padding: 6px 10px;
}

.day-detail-alloc-proj {
  font-weight: 500;
}

.day-detail-alloc-units {
  font-size: 10.5px;
  color: var(--cc-dim);
}

.day-detail-alloc-over {
  font-size: 9px;
  color: #fff;
  background: var(--cc-over);
  padding: 2px 6px;
  border-radius: 5px;
}

.day-detail-loading, .day-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  text-align: center;
  color: var(--cc-dim);
}

.cc-spinner {
  width: 40px;
  height: 40px;
  border-radius: 99px;
  border: 2px solid var(--cc-inset);
  border-top-color: var(--cc-low);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cc-dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  display: inline-block;
  flex: none;
}

.cc-track {
  height: 8px;
  border-radius: 99px;
  background: var(--cc-inset);
  overflow: hidden;
}

.cc-track--thin {
  height: 5px;
}

.cc-fill {
  height: 100%;
  border-radius: 99px;
  transition: width .7s cubic-bezier(.16,1,.3,1);
}

@media (max-width: 640px) {
  .day-detail-head {
    flex-direction: column;
    text-align: center;
  }
  
  .day-detail-head-left {
    flex-direction: column;
    text-align: center;
  }
  
  .day-detail-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;