/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hash,
  ImageOff,
  CalendarDays,
  Clock,
  GanttChart,
  Trash2,
  Phone,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { addNewRequestedDeliveryDate, deleteProject, getProjects, type ProjectCounts } from "@/service/Project";
import { AlertModal } from "@/components/modal/alert-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGuard } from "@/components/PermissionGuard";
import { PERMISSIONS } from "@/stores/permissions";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeImagePath } from "@/lib/norm";
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

// ─── Project Card (image list) ──────────────────────────────────
const BADGE_COLOR_CLASS: Record<string, string> = {
  slate: "bg-muted text-muted-foreground border-border",
  amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  violet: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  teal: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  pink: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  green: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
};

const formatShortDate = (value?: string | Date | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

function ProjectCard({
  project,
  onDeleted,
  onUpdated,
}: {
  project: IProject;
  onDeleted: (id: string) => void;
  onUpdated: (id: string, changes: Partial<IProject>) => void;
}) {
  const router = useRouter();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState("");

  const onConfirmDelete = async () => {
    setActionLoading(true);
    try {
      await deleteProject(project.id);
      setDeleteOpen(false);
      toast.success("Project deleted successfully");
      onDeleted(project.id);
    } catch (error: any) {
      toast.error(error?.message || "Error deleting project");
    } finally {
      setActionLoading(false);
    }
  };

  const onAddRequestedDeliveryDate = async () => {
    if (!newDeliveryDate) {
      toast.error("Please select a requested delivery date.");
      return;
    }
    setActionLoading(true);
    try {
      const result = await addNewRequestedDeliveryDate(project.id, newDeliveryDate);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message || "Requested delivery date added successfully");
      onUpdated(project.id, { newRequestedDelivery: newDeliveryDate });
      setDeliveryDateOpen(false);
      setNewDeliveryDate("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add requested delivery date");
    } finally {
      setActionLoading(false);
    }
  };
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // All images of the project's PI items (IProformaInvoiceItemImage)
  const images = useMemo(() => {
    const list: { url: string; label: string }[] = [];
    (project.invoice?.items || []).forEach((piItem) => {
      const label = piItem.itemname || piItem.item?.name || piItem.description || "";
      (piItem.images || []).forEach((img) => {
        const url = normalizeImagePath(img.imageUrl);
        if (url) list.push({ url, label });
      });
    });
    return list;
  }, [project.invoice?.items]);

  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (!isHovering || !hasMultipleImages) return;
    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovering, hasMultipleImages, images.length]);

  const step = (setter: React.Dispatch<React.SetStateAction<number>>, dir: 1 | -1) =>
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setter((prev) => (prev + dir + images.length) % images.length);
    };

  // Swipe left/right on touch screens to scroll through images
  const swipeHandlers = (setter: React.Dispatch<React.SetStateAction<number>>) => ({
    onTouchStart: (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchStartX === null || !hasMultipleImages) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) {
        setter((prev) => (prev + (diff < 0 ? 1 : -1) + images.length) % images.length);
      }
      setTouchStartX(null);
    },
  });

  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const statusLabel = statusConfig?.label || String(project.status || "-").replace(/_/g, " ");
  const statusCls = BADGE_COLOR_CLASS[statusConfig?.color || "slate"] || BADGE_COLOR_CLASS.slate;

  const difficultyKey = String(project.difficulty || "").toUpperCase() as DifficultyLevel;
  const difficultyConfig = DIFFICULTY_CONFIG[difficultyKey];
  const difficultyCls = BADGE_COLOR_CLASS[difficultyConfig?.color || "slate"] || BADGE_COLOR_CLASS.slate;

  const designConfig = project.designStatus ? DESIGN_STATUS_CONFIG[project.designStatus] : undefined;

  const customerName = project.customer?.name;
  const customerPhone = [
    project.customer?.phone1 || project.invoice?.customer?.phone1,
    project.customer?.phone2 || project.invoice?.customer?.phone2,
  ].filter(Boolean).join(" / ");
  const designerName = project.designBy?.name;
  const requested = formatShortDate(project.requestedDelivery);
  const newRequested = formatShortDate(project.newRequestedDelivery);
  const items = project.invoice?.items || [];
  const viewUrl = `/dashboard/Project/view?id=${project.id}`;
  const canView = hasPermission(PERMISSIONS.PROJECT.VIEW.name);
  const hasStages = (project._count?.stages ?? project.stages?.length ?? 0) > 0;

  return (
    <>
      <div
        className="group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
          {images.length > 0 ? (
            <div
              className="relative h-full w-full cursor-pointer"
              onClick={() => {
                setModalIndex(imageIndex);
                setIsModalOpen(true);
              }}
              {...swipeHandlers(setImageIndex)}
            >
              <Image
                src={images[imageIndex]?.url}
                alt={images[imageIndex]?.label || project.invoice?.piNumber || "Project image"}
                fill
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Image count badge */}
              {hasMultipleImages && (
                <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                  {imageIndex + 1} / {images.length}
                </div>
              )}

              {/* Dot indicators - one per image, click to jump */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-1/2 flex max-w-[90%] -translate-x-1/2 items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                  {images.slice(0, 10).map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex(index);
                      }}
                      aria-label={`Show image ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        index === imageIndex ? "w-3 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                  {images.length > 10 && (
                    <span className="text-[10px] font-medium leading-none text-white">
                      +{images.length - 10}
                    </span>
                  )}
                </div>
              )}

              {hasMultipleImages && isHovering && (
                <>
                  <button
                    onClick={step(setImageIndex, -1)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={step(setImageIndex, 1)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/50">
              <ImageOff className="h-8 w-8" />
              <span className="mt-1 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            {canView ? (
              <Link
                href={viewUrl}
                className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline underline-offset-4"
              >
                <Hash className="h-3.5 w-3.5 opacity-40" />
                {project.invoice?.piNumber || "-"}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-base font-semibold">
                <Hash className="h-3.5 w-3.5 opacity-40" />
                {project.invoice?.piNumber || "-"}
              </span>
            )}
          </div>

          {/* Customer & Designer */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                {customerName ? customerName.charAt(0) : "?"}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Customer</p>
                <p className="truncate text-sm font-medium">{customerName || "-"}</p>
                {customerPhone && (
                  <p className="inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    {customerPhone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                {designerName ? designerName.charAt(0) : "?"}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Design by</p>
                <p className="truncate text-sm font-medium">{designerName || "-"}</p>
              </div>
            </div>
          </div>

          {/* Status / Difficulty / Design status */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={`text-[11px] font-medium ${statusCls}`}>
              {statusLabel}
            </Badge>
            <Badge variant="outline" className={`text-[11px] font-medium ${difficultyCls}`}>
              {difficultyConfig?.label || String(project.difficulty || "Easy")}
            </Badge>
            {designConfig && (
              <Badge variant="outline" className="text-[11px] font-medium">
                {designConfig.label}
              </Badge>
            )}
          </div>

          {/* Item descriptions */}
          {items.length > 0 && (
            <div className="space-y-1 border-t pt-2">
              {items.slice(0, 3).map((piItem) => (
                <div key={piItem.id} className="flex justify-between gap-2 text-xs">
                  <span className="line-clamp-1 text-muted-foreground">
                    {piItem.itemname || piItem.item?.name || piItem.description || "-"}
                  </span>
                  <span className="shrink-0 tabular-nums">x{piItem.quantity}</span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-muted-foreground">+{items.length - 3} more items</p>
              )}
            </div>
          )}

          {/* Requested delivery */}
          <div className="border-t pt-2 text-xs">
            <p className="mb-1 text-muted-foreground">Requested delivery</p>
            {!requested && !newRequested ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {requested && (
                  <span className={`inline-flex items-center gap-1 ${newRequested ? "text-muted-foreground line-through" : "font-medium"}`}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    {requested}
                  </span>
                )}
                {newRequested && (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {newRequested}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Days / Qty / Created */}
          <div className="mt-auto grid grid-cols-3 gap-1 border-t pt-2 text-xs">
            <div>
              <p className="text-muted-foreground">Days</p>
              <p className="inline-flex items-center gap-1 font-semibold tabular-nums">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {project.totalDays ?? 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Qty</p>
              <p className="inline-flex items-center gap-1 font-semibold tabular-nums">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                {project.totalProjectQuantity ?? 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatShortDate(project.createdAt) || "-"}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full flex-wrap gap-2 pt-1">
            <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.VIEW.name} fallback="hide">
              <button
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted/70"
                onClick={() => router.push(viewUrl)}
              >
                <Eye className="h-3.5 w-3.5" /> View
              </button>
            </PermissionGuard>

            {hasStages && (
              <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.VIEW.name} fallback="hide">
                <button
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                  onClick={() => router.push(`/dashboard/Project/gantt?id=${project.id}`)}
                >
                  <GanttChart className="h-3.5 w-3.5" /> Gantt
                </button>
              </PermissionGuard>
            )}

            <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.UPDATE.name} fallback="hide">
              <button
                className="flex items-center justify-center rounded-lg bg-amber-100 px-2 py-1.5 text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                onClick={() => setDeliveryDateOpen(true)}
                aria-label="Requested delivery date"
                title="Requested Delivery Date"
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </button>
            </PermissionGuard>

            <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.DELETE.name} fallback="hide">
              <button
                className="flex items-center justify-center rounded-lg bg-red-100 px-2 py-1.5 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        loading={actionLoading}
      />

      {/* Requested Delivery Date Modal */}
      <Dialog
        open={deliveryDateOpen}
        onOpenChange={(open) => {
          if (!actionLoading) {
            setDeliveryDateOpen(open);
            if (!open) setNewDeliveryDate("");
          }
        }}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>New Requested Delivery Date</DialogTitle>
            <DialogDescription>
              Select the new requested delivery date for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor={`newDeliveryDate-${project.id}`}>Delivery Date</Label>
            <Input
              id={`newDeliveryDate-${project.id}`}
              type="date"
              value={newDeliveryDate}
              onChange={(e) => setNewDeliveryDate(e.target.value)}
              disabled={actionLoading}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeliveryDateOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onAddRequestedDeliveryDate}
              disabled={actionLoading || !newDeliveryDate}
            >
              {actionLoading ? "Saving..." : "Save Date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image modal */}
      {isModalOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm dark:bg-black/90"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative mx-4 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white transition-colors hover:text-gray-300"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="overflow-hidden rounded-lg bg-background">
              <div className="relative aspect-video w-full bg-black" {...swipeHandlers(setModalIndex)}>
                <Image
                  src={images[modalIndex]?.url}
                  alt={images[modalIndex]?.label || "Project image"}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={step(setModalIndex, -1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={step(setModalIndex, 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                  {modalIndex + 1} / {images.length}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">#{project.invoice?.piNumber}</h3>
                {images[modalIndex]?.label && (
                  <p className="mt-1 text-sm text-muted-foreground">{images[modalIndex].label}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Listing ───────────────────────────────────────────────
// Every filter, the paging and the button counts are computed by the backend
// (GET /projects). The page only renders what comes back.
export default function ProjectListingPage({}: ProjectListingPageProps) {
  const router = useRouter();
  const { page, search } = useTableQueryParams();
  const searchParams = useSearchParams();
  // Always show 20 projects per page (ignores ?limit=10 left in the URL by other tables/filters)
  const limit = 20;
  const statusFilter = searchParams.get("status") || "all";
  const designStatusFilter = searchParams.get("designStatus") || "all";
  const difficultyFilter = searchParams.get("difficulty") || "all";
  const designerFilter = searchParams.get("designer") || "all";

  // ── Date filters ──────────────────────────────────────────────
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const startDate = startDateParam ? new Date(startDateParam) : null;
  const endDate = endDateParam ? new Date(endDateParam) : null;

  // ── Debounced search: wait until typing pauses before calling the API ──
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const [projects, setProjects] = useState<IProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [counts, setCounts] = useState<ProjectCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"status" | "design" | "difficulty">("status");
  const [exporting, setExporting] = useState(false);
  const [designers, setDesigners] = useState<{ id: string; name: string }[]>([]);

  // ── Filters as API query params ───────────────────────────────
  // Dates cover whole days in the user's timezone: From = 00:00, To = 23:59:59.
  const filterParams = useMemo(() => {
    const toIso = (value: string | null, endOfDay: boolean) => {
      if (!value) return undefined;
      const date = new Date(value);
      if (isNaN(date.getTime())) return undefined;
      if (endOfDay) date.setHours(23, 59, 59, 999);
      else date.setHours(0, 0, 0, 0);
      return date.toISOString();
    };
    return {
      search: debouncedSearch.trim() || undefined,
      status: statusFilter !== "all" ? (statusFilter as ProjectStatus) : undefined,
      designStatus: designStatusFilter !== "all" ? (designStatusFilter as DesignStatus) : undefined,
      difficulty: difficultyFilter !== "all" ? (difficultyFilter as DifficultyLevel) : undefined,
      designById: designerFilter !== "all" ? designerFilter : undefined,
      startDate: toIso(startDateParam, false),
      endDate: toIso(endDateParam, true),
      sortBy: "requestedDelivery",
      sortOrder: "asc" as const,
    };
  }, [debouncedSearch, statusFilter, designStatusFilter, difficultyFilter, designerFilter, startDateParam, endDateParam]);

  // ── Load Projects ──
  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getProjects({ ...filterParams, page, limit });

        if (cancelled) return;

        setProjects(response.projects);
        setTotalCount(response.total);
        setTotalPages(response.totalPages);
        setCounts(response.counts ?? null);
        setDesigners(response.designers);
        setHasLoaded(true);
      } catch (err: any) {
        console.error("Error loading projects:", err);

        if (!cancelled) {
          setError(
            err?.code === "ECONNABORTED"
              ? "The server took too long to respond while loading projects."
              : "Could not load projects. Please check your connection and try again."
          );
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
  }, [filterParams, page, limit, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

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

  // ── Export Projects ──────────────────────────────────────────
  // Fetches every project matching the current filters from the backend —
  // not just the page on screen.
  const handleExport = async () => {
    try {
      setExporting(true);

      const { projects: filteredProjects } = await getProjects({ ...filterParams, all: true });

      if (filteredProjects.length === 0) {
        toast.error("No projects to export. Please adjust your filters.");
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
      toast.error("Failed to export projects. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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

  // ── Error box with Retry ─────────────────────────────────────
  const errorBox = error && (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 py-10 text-center dark:border-red-800/40 dark:bg-red-950/20">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
      <Button variant="outline" size="sm" onClick={retry} disabled={loading} className="gap-2">
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Retry
      </Button>
    </div>
  );

  // ── Loading & Error (first load) ─────────────────────────────
  if (!hasLoaded) {
    if (error) return errorBox;
    return <DataTableSkeleton columnCount={8} rowCount={8} filterCount={3} />;
  }

  const total = counts?.all ?? 0;
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
                router.push(buildFilterUrl("designer", value));
              }}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Designers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designers</SelectItem>
                {designers.map((designer) => (
                  <SelectItem key={designer.id} value={designer.id}>
                    {designer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
          )}
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting || totalCount === 0}
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
                count={counts?.status[statusKey as ProjectStatus] ?? 0}
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
                count={counts?.designStatus[statusKey as DesignStatus] ?? 0}
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
                count={counts?.difficulty[levelKey as DifficultyLevel] ?? 0}
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
                Designer: {designers.find((d) => d.id === designerFilter)?.name || designerFilter}
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
              ({totalCount} results)
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

      {/* ── Error / Empty States ──────────────────────────────── */}
      {error ? (
        errorBox
      ) : totalCount === 0 && !search && !hasFilter ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <FolderOpen className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Projects will appear here once created from approved proforma invoices.
          </p>
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No matching projects</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your filters to see more results.
          </p>
        </div>
      ) : (
        <div className={loading ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
          <p className="mb-4 text-sm text-muted-foreground">
            Showing {totalCount > 0 ? (page - 1) * limit + 1 : 0}-
            {Math.min(page * limit, totalCount)} of {totalCount} projects
          </p>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDeleted={retry}
                onUpdated={(id, changes) =>
                  setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)))
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
              {page > 1 ? (
                <Button variant="outline" asChild>
                  <Link href={buildQueryStringLocal({ page: String(page - 1) })}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>Previous</Button>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5 || page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} asChild>
                    <Link href={buildQueryStringLocal({ page: String(pageNum) })}>{pageNum}</Link>
                  </Button>
                );
              })}
              {page < totalPages ? (
                <Button variant="outline" asChild>
                  <Link href={buildQueryStringLocal({ page: String(page + 1) })}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>Next</Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
