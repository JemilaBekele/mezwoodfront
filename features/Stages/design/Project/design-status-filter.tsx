'use client';

import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { Filter } from 'lucide-react';
import { DesignStatus, IProject } from '@/models/Projects';

export const DESIGN_STATUS_LABELS: Record<DesignStatus, string> = {
  INITIATED: 'Initiated',
  MODELING: 'Modeling',
  DRAFTING: 'Drafting',
  CUTLIST: 'Cutlist',
  BOQ: 'BOQ',
  DESIGN_FINISHED: 'Design Finished',
  FINISHED: 'Finished',
};

export const DESIGN_STATUS_CLASSES: Record<DesignStatus, string> = {
  INITIATED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MODELING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DRAFTING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  CUTLIST: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  BOQ: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  DESIGN_FINISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FINISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// Order shown in the filter (workflow order)
const DESIGN_STATUS_ORDER: DesignStatus[] = [
  DesignStatus.INITIATED,
  DesignStatus.MODELING,
  DesignStatus.DRAFTING,
  DesignStatus.CUTLIST,
  DesignStatus.BOQ,
  DesignStatus.DESIGN_FINISHED,
  DesignStatus.FINISHED,
];

// Selected design status, kept in the URL (?designStatus=MODELING); 'all' when none
export function useDesignStatusFilter() {
  const [designStatus, setDesignStatus] = useQueryState(
    'designStatus',
    parseAsString.withOptions({ shallow: true }).withDefault('all')
  );
  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const select = (value: string) => {
    setDesignStatus(value === 'all' ? null : value);
    setPage(null);
  };

  const apply = (projects: IProject[]) =>
    designStatus === 'all' ? projects : projects.filter((p) => p.designStatus === designStatus);

  return { designStatus, select, apply };
}

export function DesignStatusBadge({ status }: { status?: DesignStatus | string | null }) {
  if (!status) return null;
  const label = DESIGN_STATUS_LABELS[status as DesignStatus] || String(status).replace(/_/g, ' ');
  const cls = DESIGN_STATUS_CLASSES[status as DesignStatus] || 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function DesignStatusFilter({
  projects,
  value,
  onChange,
}: {
  projects: IProject[];
  value: string;
  onChange: (value: string) => void;
}) {
  const countOf = (status: DesignStatus) => projects.filter((p) => p.designStatus === status).length;

  const chip = (key: string, label: string, count: number, cls?: string) => {
    const selected = value === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted'
        }`}
      >
        {label}
        <span
          className={`rounded-full px-1.5 text-[10px] font-semibold ${
            selected ? 'bg-primary-foreground/20' : cls || 'bg-muted text-muted-foreground'
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" /> Design Status:
      </span>
      {chip('all', 'All', projects.length)}
      {DESIGN_STATUS_ORDER.map((status) =>
        chip(status, DESIGN_STATUS_LABELS[status], countOf(status), DESIGN_STATUS_CLASSES[status])
      )}
    </div>
  );
}
