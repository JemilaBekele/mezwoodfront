/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  Layers,
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
  CheckCheck,
  XCircle,
  User,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { getProjects } from "@/service/Project";
import { projectColumns } from "./tables/columns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IProject, ProjectStatus, DesignStatus, DifficultyLevel } from "@/models/Projects";
import { IEmployee } from "@/models/employee";
import * as XLSX from 'xlsx';

type ProjectListingPageProps = object;

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
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    color: "emerald",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "red",
  },
};

const DESIGN_STATUS_CONFIG: Record<
  DesignStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  INITIATED: { label: "Initiated", icon: PenTool, color: "amber" },
  MODELING: { label: "Modeling", icon: BarChart3, color: "blue" },
  DRAFTING: { label: "Drafting", icon: Ruler, color: "cyan" },
  CUTLIST: { label: "Cutlist", icon: Grid, color: "violet" },
  BOQ: { label: "BOQ", icon: ListChecks, color: "indigo" },
  DESIGN_FINISHED: {
    label: "Design Finished",
    icon: CheckCheck,
    color: "green",
  },
  FINISHED: { label: "Finished", icon: CheckCircle, color: "emerald" },
};

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  EASY: { label: "Easy", icon: Signal, color: "green" },
  MEDIUM: { label: "Medium", icon: Signal, color: "amber" },
  HARD: { label: "Hard", icon: Signal, color: "red" },
};

// ─── Tab Config ──────────────────────────────────────────────────
const TAB_CONFIG = {
  status: {
    label: "Project Status",
    icon: FolderOpen,
    filter: "status",
    config: PROJECT_STATUS_CONFIG,
    getDisplayText: (value: string) => 
      PROJECT_STATUS_CONFIG[value as ProjectStatus]?.label || value || "Unknown",
  },
  design: {
    label: "Design Status",
    icon: PenTool,
    filter: "designStatus",
    config: DESIGN_STATUS_CONFIG,
    getDisplayText: (value: string) => 
      DESIGN_STATUS_CONFIG[value as DesignStatus]?.label || value || "None",
  },
  difficulty: {
    label: "Difficulty",
    icon: BarChart3,
    filter: "difficulty",
    config: DIFFICULTY_CONFIG,
    getDisplayText: (value: string) => 
      DIFFICULTY_CONFIG[value as DifficultyLevel]?.label || value || "None",
  },
} as const;

// ─── Main Listing ───────────────────────────────────────────────
export default function ProjectListingPage({}: ProjectListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const designStatusFilter = searchParams.get("designStatus") || "all";
  const difficultyFilter = searchParams.get("difficulty") || "all";
  const designerFilter = searchParams.get("designer") || "all";
  
  // ── Date filters ──────────────────────────────────────────────
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const startDate = startDateParam ? new Date(startDateParam) : null;
  const endDate = endDateParam ? new Date(endDateParam) : null;

  const [projects, setProjects] = useState<IProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "design" | "difficulty">("status");
  const [exporting, setExporting] = useState(false);
  const [designers, setDesigners] = useState<IEmployee[]>([]);

  // ── Load Projects ──
  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Don't send search to API - we'll handle it client-side
        const response = await getProjects();

        if (cancelled) return;

        setProjects(response.projects || []);
        setTotalCount(response.totalCount || 0);
        
        // Extract unique designers from projects
        const uniqueDesigners = response.projects
          ?.filter((p: IProject) => p.designBy)
          .map((p: IProject) => p.designBy as IEmployee)
          .filter((designer: IEmployee, index: number, self: IEmployee[]) => 
            self.findIndex((d: IEmployee) => d.id === designer.id) === index
          ) || [];
        setDesigners(uniqueDesigners);
      } catch (err) {
        console.error("Error loading projects:", err);

        if (!cancelled) {
          setError("Error loading projects. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  // ── Export Projects ──────────────────────────────────────────
  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Get filtered data based on current filters
      const filteredProjects = projects.filter((project) => {
        // Status filter
        if (statusFilter !== "all" && project.status !== statusFilter) return false;
        
        // Design status filter
        if (designStatusFilter !== "all" && project.designStatus !== designStatusFilter) return false;
        
        // Difficulty filter
        if (difficultyFilter !== "all" && project.difficulty !== difficultyFilter) return false;
        
        // Designer filter
        if (designerFilter !== "all" && project.designById !== designerFilter) return false;
        
        // Date range filter - filter by createdAt
        if (startDate || endDate) {
          const projectDate = project.createdAt ? new Date(project.createdAt) : null;
          if (!projectDate) return false;
          
          // Set time to start of day for proper comparison
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (projectDate < start) return false;
          }
          
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (projectDate > end) return false;
          }
        }
        
        // Search filter
        if (search) {
          const s = search.toLowerCase().trim();
          if (s === '') return true;
          
          const invoiceNumber = project.invoice?.piNumber || project.invoice?.id || '';
          const customerName = project.customer?.name || '';
          const statusText = getStatusDisplayText(project.status);
          const designStatusText = getDesignStatusDisplayText(project.designStatus || '');
          const difficultyText = getDifficultyDisplayText(project.difficulty);
          const designerName = project.designBy?.name || '';
          
          const match =
            String(invoiceNumber).toLowerCase().includes(s) ||
            String(customerName).toLowerCase().includes(s) ||
            statusText.toLowerCase().includes(s) ||
            designStatusText.toLowerCase().includes(s) ||
            difficultyText.toLowerCase().includes(s) ||
            designerName.toLowerCase().includes(s);
          
          if (!match) return false;
        }
        
        return true;
      });

      if (filteredProjects.length === 0) {
        setError("No projects to export. Please adjust your filters.");
        return;
      }

      // Prepare data for Excel
      const exportData = filteredProjects.map((project) => ({
        'Invoice Number': project.invoice?.piNumber || project.invoice?.id || '',
        'Customer Name': project.customer?.name || '',
                'Requested Delivery': project.requestedDelivery ? new Date(project.requestedDelivery).toLocaleDateString() : '',
        'Status': getStatusDisplayText(project.status),
        'Designer': project.designBy?.name || '',
        'Created By': project.createdBy?.name || '',
        'Created At': project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '',
        'Updated At': project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '',
        'Total Project Quantity': project.totalProjectQuantity || 0,
        'Total Days': project.totalDays || 0,
        'Calculated Delivery': project.calculatedDelivery ? new Date(project.calculatedDelivery).toLocaleDateString() : '',
               'Design Status': getDesignStatusDisplayText(project.designStatus || ''),
        'Difficulty': getDifficultyDisplayText(project.difficulty),
      }));

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns (optional)
      const maxWidth = 20;
      const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));
      worksheet['!cols'] = wscols;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
      
      // Generate file and download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projects_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Error exporting projects:", err);
      setError("Failed to export projects. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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
    (params: { status?: string; designStatus?: string; difficulty?: string; designer?: string; page?: string }) => {
      const urlParams = new URLSearchParams();
      if (search) urlParams.set("q", search);
      urlParams.set("page", params.page || "1");
      urlParams.set("limit", limit.toString());
      urlParams.set("status", params.status || statusFilter);
      urlParams.set("designStatus", params.designStatus || designStatusFilter);
      urlParams.set("difficulty", params.difficulty || difficultyFilter);
      urlParams.set("designer", params.designer || designerFilter);
      
      // Preserve date filters
      if (startDateParam) urlParams.set("startDate", startDateParam);
      if (endDateParam) urlParams.set("endDate", endDateParam);
      
      return `?${urlParams.toString()}`;
    },
    [search, limit, statusFilter, designStatusFilter, difficultyFilter, designerFilter, startDateParam, endDateParam]
  );

  const buildFilterUrl = useCallback(
    (filterType: "status" | "designStatus" | "difficulty" | "designer", value: string) => {
      const params: any = { page: "1" };
      params[filterType] = value;
      return buildQueryStringLocal(params);
    },
    [buildQueryStringLocal]
  );

  // ── Loading & Error ──────────────────────────────────────────
  if (loading) {
    return <DataTableSkeleton columnCount={8} rowCount={8} filterCount={3} />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-950/20">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // ── Client-side filtering ──────────────────────────────────
  const filteredData = projects.filter((project) => {
    // Search filter - client side
    if (search) {
      const s = search.toLowerCase().trim();
      if (s === '') return true;
      
      const invoiceNumber = project.invoice?.piNumber || project.invoice?.id || '';
      const customerName = project.customer?.name || '';
      const statusText = getStatusDisplayText(project.status);
      const designStatusText = getDesignStatusDisplayText(project.designStatus || '');
      const difficultyText = getDifficultyDisplayText(project.difficulty);
      const designerName = project.designBy?.name || '';
      
      const match =
        String(invoiceNumber).toLowerCase().includes(s) ||
        String(customerName).toLowerCase().includes(s) ||
        statusText.toLowerCase().includes(s) ||
        designStatusText.toLowerCase().includes(s) ||
        difficultyText.toLowerCase().includes(s) ||
        designerName.toLowerCase().includes(s);
      
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== "all" && project.status !== statusFilter) return false;

    // Design status filter
    if (designStatusFilter !== "all" && project.designStatus !== designStatusFilter) return false;

    // Difficulty filter
    if (difficultyFilter !== "all" && project.difficulty !== difficultyFilter) return false;

    // Designer filter
    if (designerFilter !== "all" && project.designById !== designerFilter) return false;

    // ── Date range filter ──────────────────────────────────────
    if (startDate || endDate) {
      const projectDate = project.createdAt ? new Date(project.createdAt) : null;
      if (!projectDate) return false;
      
      // Set time to start of day for proper comparison
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (projectDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (projectDate > end) return false;
      }
    }

    return true;
  });

  // ── Counts ──────────────────────────────────────────────────
  const statusCounts = Object.keys(PROJECT_STATUS_CONFIG).reduce(
    (acc, statusKey) => {
      acc[statusKey as ProjectStatus] = projects.filter(
        (p) => p.status === statusKey
      ).length;
      return acc;
    },
    {} as Record<ProjectStatus, number>
  );

  const designStatusCounts = Object.keys(DESIGN_STATUS_CONFIG).reduce(
    (acc, statusKey) => {
      acc[statusKey as DesignStatus] = projects.filter(
        (p) => p.designStatus === statusKey
      ).length;
      return acc;
    },
    {} as Record<DesignStatus, number>
  );

  const difficultyCounts = Object.keys(DIFFICULTY_CONFIG).reduce(
    (acc, levelKey) => {
      acc[levelKey as DifficultyLevel] = projects.filter(
        (p) => p.difficulty === levelKey
      ).length;
      return acc;
    },
    {} as Record<DifficultyLevel, number>
  );

  const total = projects.length;
  const filteredCount = filteredData.length;
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const hasFilter = statusFilter !== "all" || designStatusFilter !== "all" || difficultyFilter !== "all" || designerFilter !== "all" || !!startDate || !!endDate;

  // ── Get counts for tab badges ──────────────────────────────
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

  // ── Format date for display ──────────────────────────────────
  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Header with Designer Filter and Export ────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select
              value={designerFilter}
              onValueChange={(value) => {
                const url = buildFilterUrl("designer", value);
                window.location.href = url;
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Designers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designers</SelectItem>
                {designers.map((designer) => {
                  const designerId = designer.id ?? designer.name ?? "unknown-designer";

                  return (
                    <SelectItem key={designerId} value={designerId}>
                      {designer.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          onClick={handleExport}
          disabled={exporting || projects.length === 0}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {exporting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          <span>Export to Excel</span>
        </Button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
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
            {designerFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Designer: {projects.find(p => p.designById === designerFilter)?.designBy?.name || designerFilter}
              </Badge>
            )}
            {startDate && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                From: {formatDateDisplay(startDate)}
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                To: {formatDateDisplay(endDate)}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              ({filteredCount} results)
            </span>
          </div>
          <Link
            href={buildQueryStringLocal({ status: "all", designStatus: "all", difficulty: "all", designer: "all", page: "1" })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Link>
        </div>
      )}

      {/* ── Empty States ──────────────────────────────────────── */}
      {filteredData.length === 0 && !search && !hasFilter ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <FolderOpen className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Projects will appear here once created from approved proforma invoices.
          </p>
        </div>
      ) : filteredData.length === 0 && (search || hasFilter) ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No matching projects</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your filters to see more results.
          </p>
        </div>
      ) : (
        <DataTable
          data={paginatedData}
          totalItems={filteredCount}
          columns={projectColumns}
          currentPage={page}
          itemsPerPage={limit}
          searchValue={search}
          statusFilter={statusFilter}
          designStatusFilter={designStatusFilter}
          difficultyFilter={difficultyFilter}
          designerFilter={designerFilter}
        />
      )}
    </div>
  );
}