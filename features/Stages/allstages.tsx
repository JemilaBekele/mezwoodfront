'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/error-boundaries */
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from '@/components/ui/table/newdatatable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CalendarDays,
  CalendarClock,
  Layers,
  Check,
  X,
  FolderOpen,
  Gauge,
  Activity,
  Palette,
  Ruler,
  FileText,
  PenTool,
  Grid,
  Package,
  ListChecks,
  CheckCircle,
  Signal,
  BarChart3,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';
import { IProject, ProjectStatus, DesignStatus, DifficultyLevel } from '@/models/Projects';
import { useMemo, useCallback, useState } from 'react';

interface StageProjectListingProps {
  projects: IProject[];
  projectColumns: any;
  stageName: string;
  emptyStateMessages?: {
    today?: string;
    tomorrow?: string;
    other?: string;
  };
}

// ─── Compact Status Pill ────────────────────────────────────────
function StatusPill({
  label,
  count,
  icon: Icon,
  selected,
  href,
  color,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  href: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    slate: "text-muted-foreground",
    amber: "text-amber-600 dark:text-amber-400",
    orange: "text-orange-600 dark:text-orange-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    violet: "text-violet-600 dark:text-violet-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    teal: "text-teal-600 dark:text-teal-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    pink: "text-pink-600 dark:text-pink-400",
    green: "text-green-600 dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    gray: "text-gray-600 dark:text-gray-400",
    lime: "text-lime-600 dark:text-lime-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <Link href={href} aria-label={`Filter: ${label}`}>
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-150 hover:bg-muted/50 ${
          selected
            ? "border-primary/30 bg-primary/5 shadow-sm"
            : "border-transparent bg-muted/30"
        }`}
      >
        <Icon className={`h-3.5 w-3.5 ${colorMap[color]}`} />
        <span className="font-semibold tabular-nums">{count}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
        {selected && <Check className="h-3 w-3 text-primary ml-auto" />}
      </div>
    </Link>
  );
}

// ─── Status Configs ──────────────────────────────────────────────
const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  INVOICE: { label: "Invoice", icon: FileText, color: "amber" },
  DESIGN: { label: "Design", icon: Ruler, color: "blue" },
  PURCHASING: { label: "Purchasing", icon: Package, color: "violet" },
  METAL_WORKS: { label: "Metal Works", icon: Gauge, color: "gray" },
  CNC: { label: "CNC", icon: Activity, color: "cyan" },
  CUTTING: { label: "Cutting", icon: Grid, color: "orange" },
  EDGE_BANDING: { label: "Edge Banding", icon: Layers, color: "teal" },
  ASSEMBLY: { label: "Assembly", icon: Layers, color: "indigo" },
  PAINTING: { label: "Painting", icon: Palette, color: "pink" },
  FINISHING: { label: "Finishing", icon: CheckCircle, color: "green" },
  DELIVERY: { label: "Delivery", icon: Package, color: "purple" },
  INSTALLATION: { label: "Installation", icon: Layers, color: "yellow" },
};

const DESIGN_STATUS_CONFIG: Record<DesignStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  INITIATED: { label: "Initiated", icon: PenTool, color: "amber" },
  MODELING: { label: "Modeling", icon: BarChart3, color: "blue" },
  DRAFTING: { label: "Drafting", icon: Ruler, color: "cyan" },
  CUTLIST: { label: "Cutlist", icon: Grid, color: "violet" },
  BOQ: { label: "BOQ", icon: ListChecks, color: "indigo" },
    DESIGN_FINISHED: {
    label: "Design Finished",
    icon: CheckCheck, // or BadgeCheck
    color: "green",
  },
  FINISHED: { label: "Finished", icon: CheckCircle, color: "emerald" },
};

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  EASY: { label: "Easy", icon: Signal, color: "green" },
  MEDIUM: { label: "Medium", icon: Signal, color: "amber" },
  HARD: { label: "Hard", icon: Signal, color: "red" },
};

// ─── Helper Functions ──────────────────────────────────────────
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

function sortByDeliveryDate(projects: IProject[]): IProject[] {
  return [...projects].sort((a, b) => {
    const dateA = a.calculatedDelivery ? new Date(a.calculatedDelivery).getTime() : Infinity;
    const dateB = b.calculatedDelivery ? new Date(b.calculatedDelivery).getTime() : Infinity;
    return dateA - dateB;
  });
}

// ─── Main Component ─────────────────────────────────────────────
export function StageProjectListing({
  projects,
  projectColumns,
  stageName,
  emptyStateMessages = {
    today: 'No projects due today',
    tomorrow: 'No projects due tomorrow',
    other: 'No other projects found'
  }
}: StageProjectListingProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || 10);
  const statusFilter = searchParams.get('status') || 'all';
  const designStatusFilter = searchParams.get('designStatus') || 'all';
  const difficultyFilter = searchParams.get('difficulty') || 'all';

  const [activeTab, setActiveTab] = useState<"status" | "design" | "difficulty">("status");

  // ── Helpers ──────────────────────────────────────────────────
  const getStatusDisplayText = useCallback((status: string): string => {
    return PROJECT_STATUS_CONFIG[status as ProjectStatus]?.label || status || "Unknown";
  }, []);

  const getDesignStatusDisplayText = useCallback((status: string): string => {
    return DESIGN_STATUS_CONFIG[status as DesignStatus]?.label || status || "None";
  }, []);

  const getDifficultyDisplayText = useCallback((level: string): string => {
    return DIFFICULTY_CONFIG[level as DifficultyLevel]?.label || level || "None";
  }, []);

  const buildQueryStringLocal = useCallback(
    (params: { status?: string; designStatus?: string; difficulty?: string; page?: string }) => {
      const urlParams = new URLSearchParams(searchParams.toString());
      if (params.status !== undefined) urlParams.set('status', params.status);
      if (params.designStatus !== undefined) urlParams.set('designStatus', params.designStatus);
      if (params.difficulty !== undefined) urlParams.set('difficulty', params.difficulty);
      if (params.page) urlParams.set('page', params.page);
      return `?${urlParams.toString()}`;
    },
    [searchParams]
  );

  const buildFilterUrl = useCallback(
    (filterType: "status" | "designStatus" | "difficulty", value: string) => {
      const params: any = { page: "1" };
      params[filterType] = value;
      return buildQueryStringLocal(params);
    },
    [buildQueryStringLocal]
  );

  // ── Filter Projects ──────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      if (search) {
        const s = search.toLowerCase();
        const match =
          project.invoice?.piNumber?.toLowerCase().includes(s) ||
          project.customer?.name?.toLowerCase().includes(s) ||
          getStatusDisplayText(project.status).toLowerCase().includes(s) ||
          getDesignStatusDisplayText(project.designStatus || '').toLowerCase().includes(s) ||
          getDifficultyDisplayText(project.difficulty).toLowerCase().includes(s);
        if (!match) return false;
      }

      // Status filter
      if (statusFilter !== "all" && project.status !== statusFilter) return false;

      // Design status filter
      if (designStatusFilter !== "all" && project.designStatus !== designStatusFilter) return false;

      // Difficulty filter
      if (difficultyFilter !== "all" && project.difficulty !== difficultyFilter) return false;

      return true;
    });
  }, [projects, search, statusFilter, designStatusFilter, difficultyFilter, getStatusDisplayText, getDesignStatusDisplayText, getDifficultyDisplayText]);

  // ── Categorize by Delivery Date ─────────────────────────────
  const { todayProjects, tomorrowProjects, otherProjects } = useMemo(() => {
    const todayProjects = sortByDeliveryDate(
      filteredProjects.filter((project) => project.calculatedDelivery && isToday(new Date(project.calculatedDelivery)))
    );

    const tomorrowProjects = sortByDeliveryDate(
      filteredProjects.filter((project) => project.calculatedDelivery && isTomorrow(new Date(project.calculatedDelivery)))
    );

    const otherProjects = sortByDeliveryDate(
      filteredProjects.filter((project) => {
        if (!project.calculatedDelivery) return true;
        const deliveryDate = new Date(project.calculatedDelivery);
        return !isToday(deliveryDate) && !isTomorrow(deliveryDate);
      })
    );

    return { todayProjects, tomorrowProjects, otherProjects };
  }, [filteredProjects]);

  // ── Counts for Filters ──────────────────────────────────────
  const statusCounts = useMemo(() => {
    return Object.keys(PROJECT_STATUS_CONFIG).reduce(
      (acc, statusKey) => {
        acc[statusKey as ProjectStatus] = filteredProjects.filter(
          (p) => p.status === statusKey
        ).length;
        return acc;
      },
      {} as Record<ProjectStatus, number>
    );
  }, [filteredProjects]);

  const designStatusCounts = useMemo(() => {
    return Object.keys(DESIGN_STATUS_CONFIG).reduce(
      (acc, statusKey) => {
        acc[statusKey as DesignStatus] = filteredProjects.filter(
          (p) => p.designStatus === statusKey
        ).length;
        return acc;
      },
      {} as Record<DesignStatus, number>
    );
  }, [filteredProjects]);

  const difficultyCounts = useMemo(() => {
    return Object.keys(DIFFICULTY_CONFIG).reduce(
      (acc, levelKey) => {
        acc[levelKey as DifficultyLevel] = filteredProjects.filter(
          (p) => p.difficulty === levelKey
        ).length;
        return acc;
      },
      {} as Record<DifficultyLevel, number>
    );
  }, [filteredProjects]);

  const total = filteredProjects.length;
  const hasFilter = statusFilter !== "all" || designStatusFilter !== "all" || difficultyFilter !== "all";

  // ── Get tab badge ───────────────────────────────────────────
  const getTabBadge = (tabKey: "status" | "design" | "difficulty") => {
    const filterValue = {
      status: statusFilter,
      design: designStatusFilter,
      difficulty: difficultyFilter,
    }[tabKey];
    
    if (filterValue !== "all") {
      const label = {
        status: getStatusDisplayText(filterValue),
        design: getDesignStatusDisplayText(filterValue),
        difficulty: getDifficultyDisplayText(filterValue),
      }[tabKey];
      return ` (${label})`;
    }
    return "";
  };

  // ── Render Table ─────────────────────────────────────────────
  const renderProjectTable = (projectsList: IProject[], totalItems: number) => {
    const startIndex = (page - 1) * limit;
    const paginatedData = projectsList.slice(startIndex, startIndex + limit);

    return (
      <DataTable
        data={paginatedData}
        totalItems={totalItems}
        columns={projectColumns}
        currentPage={page}
        itemsPerPage={limit}
        searchValue={search}
        statusFilter={statusFilter}
        designStatusFilter={designStatusFilter}
        difficultyFilter={difficultyFilter}
      />
    );
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Stats Cards ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Today&apos;s Work</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{todayProjects.length}</p>
          <p className="text-xs text-muted-foreground">Due for delivery today</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">Tomorrow&apos;s Work</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{tomorrowProjects.length}</p>
          <p className="text-xs text-muted-foreground">Due for delivery tomorrow</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">Other Projects</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{otherProjects.length}</p>
          <p className="text-xs text-muted-foreground">Due later</p>
        </div>
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────── */}
      <Tabs 
        defaultValue="status" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "status" | "design" | "difficulty")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Project Status</span>
            <span className="ml-1 text-xs text-muted-foreground">{getTabBadge("status")}</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            <span>Design Status</span>
            <span className="ml-1 text-xs text-muted-foreground">{getTabBadge("design")}</span>
          </TabsTrigger>
          <TabsTrigger value="difficulty" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Difficulty</span>
            <span className="ml-1 text-xs text-muted-foreground">{getTabBadge("difficulty")}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Project Status Tab ────────────────────────────── */}
        <TabsContent value="status" className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label="All"
              count={total}
              icon={Layers}
              color="slate"
              selected={statusFilter === "all"}
              href={buildFilterUrl("status", "all")}
            />
            {Object.entries(PROJECT_STATUS_CONFIG).map(([statusKey, config]) => (
              <StatusPill
                key={statusKey}
                label={config.label}
                count={statusCounts[statusKey as ProjectStatus] || 0}
                icon={config.icon}
                color={config.color}
                selected={statusFilter === statusKey}
                href={buildFilterUrl("status", statusKey)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Design Status Tab ─────────────────────────────── */}
        <TabsContent value="design" className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label="All"
              count={total}
              icon={Layers}
              color="slate"
              selected={designStatusFilter === "all"}
              href={buildFilterUrl("designStatus", "all")}
            />
            {Object.entries(DESIGN_STATUS_CONFIG).map(([statusKey, config]) => (
              <StatusPill
                key={statusKey}
                label={config.label}
                count={designStatusCounts[statusKey as DesignStatus] || 0}
                icon={config.icon}
                color={config.color}
                selected={designStatusFilter === statusKey}
                href={buildFilterUrl("designStatus", statusKey)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Difficulty Tab ─────────────────────────────────── */}
        <TabsContent value="difficulty" className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label="All"
              count={total}
              icon={Layers}
              color="slate"
              selected={difficultyFilter === "all"}
              href={buildFilterUrl("difficulty", "all")}
            />
            {Object.entries(DIFFICULTY_CONFIG).map(([levelKey, config]) => (
              <StatusPill
                key={levelKey}
                label={config.label}
                count={difficultyCounts[levelKey as DifficultyLevel] || 0}
                icon={config.icon}
                color={config.color}
                selected={difficultyFilter === levelKey}
                href={buildFilterUrl("difficulty", levelKey)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Active Filters & Clear ──────────────────────────── */}
      {hasFilter && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Status: {getStatusDisplayText(statusFilter)}
              </Badge>
            )}
            {designStatusFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Design: {getDesignStatusDisplayText(designStatusFilter)}
              </Badge>
            )}
            {difficultyFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Difficulty: {getDifficultyDisplayText(difficultyFilter)}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              ({total} results)
            </span>
          </div>
          <Link
            href={buildQueryStringLocal({ status: "all", designStatus: "all", difficulty: "all", page: "1" })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Link>
        </div>
      )}

      {/* ── Delivery Date Tabs ───────────────────────────────── */}
      <Tabs defaultValue={todayProjects.length > 0 ? 'today' : tomorrowProjects.length > 0 ? 'tomorrow' : 'other'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today ({todayProjects.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow ({tomorrowProjects.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({otherProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayProjects.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
              <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{emptyStateMessages.today}</p>
            </div>
          ) : (
            renderProjectTable(todayProjects, todayProjects.length)
          )}
        </TabsContent>

        <TabsContent value="tomorrow" className="space-y-4">
          {tomorrowProjects.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
              <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{emptyStateMessages.tomorrow}</p>
            </div>
          ) : (
            renderProjectTable(tomorrowProjects, tomorrowProjects.length)
          )}
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          {otherProjects.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
              <CalendarClock className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{emptyStateMessages.other}</p>
            </div>
          ) : (
            renderProjectTable(otherProjects, otherProjects.length)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}