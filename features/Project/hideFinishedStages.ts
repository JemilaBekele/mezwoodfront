/**
 * Completed / cancelled stages are hidden from the capacity calendars: their
 * remaining capacity is already released by the backend on completion, and the
 * past days they consumed would only clutter the board. Each day row's load is
 * reduced by the hidden units so its % reflects the work still to do. Rows left
 * with no visible allocations are dropped.
 */
const allocsOf = (r: any): any[] =>
  r.projectStageCapacityAllocations || r.projectStage_capacityAllocations || [];

const isFinishedAllocation = (a: any) => {
  const ps = a?.projectStage;
  return !!ps && (ps.finished || ps.status === 'COMPLETED' || ps.status === 'CANCELLED');
};

export const hideFinishedStages = (rows: any[]): any[] =>
  rows.flatMap((r) => {
    const allocs = allocsOf(r);
    const hidden = allocs.filter(isFinishedAllocation);
    if (hidden.length === 0) return [r];
    const kept = allocs.filter((a) => !isFinishedAllocation(a));
    if (kept.length === 0) return [];
    const hiddenUnits = hidden.reduce((s, a) => s + (a.allocatedUnits || 0), 0);
    const hiddenHours = hidden.reduce((s, a) => s + (a.allocatedHours || 0), 0);
    const usedCapacity = Math.max(0, (r.usedCapacity || 0) - hiddenUnits);
    return [{
      ...r,
      projectStageCapacityAllocations: kept,
      usedCapacity,
      usedHours: Math.max(0, (r.usedHours || 0) - hiddenHours),
      overCapacityUsed: Math.min(
        r.overCapacityUsed || 0,
        Math.max(0, usedCapacity - (r.maxCapacity || 0)),
      ),
    }];
  });
