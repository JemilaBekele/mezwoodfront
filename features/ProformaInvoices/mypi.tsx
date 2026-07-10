
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Ban,
  Check,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileText,
  Layers,
  X,
  FileCheck,
  Send,
  RefreshCw,
  ThumbsUp,
  CheckCircle,
  FileX,
  Loader2,
} from "lucide-react";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import {  getAllProformaInvoicesmy } from "@/service/ProformaInvoice";
import { proformaInvoiceColumns } from "./tables/columns";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { Badge } from "@/components/ui/badge";

type ProformaInvoiceListingPageProps = object;

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

// ─── Status Row Header ──────────────────────────────────────────
function StatusRowHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
    </div>
  );
}

// ─── Main Listing ───────────────────────────────────────────────
export default function ProformaInvoicemyListingPage({}: ProformaInvoiceListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  const paymentStatusFilter = searchParams.get("paymentStatus") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        const { proformaInvoices } = await getAllProformaInvoicesmy({
          page,
          limit,
          search,
        });

        if (cancelled) return;
        setInvoicesData(proformaInvoices || []);
      } catch {
        if (!cancelled) {
          setError("Error loading proforma invoices. Please try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInvoices();
    return () => { cancelled = true; };
  }, [endDate, limit, page, search, startDate]);

  // ── Helpers ──────────────────────────────────────────────────
  const getPaymentStatusDisplayText = useCallback((status: string): string => {
    const map: Record<string, string> = {
      PENDING: "Pending", PARTIAL: "Partial", PAID: "Paid",
      CANCELLED: "Cancelled", NONE: "None",
    };
    return map[status] || "Unknown";
  }, []);

  const getStatusDisplayText = useCallback((status: string): string => {
    const map: Record<string, string> = {
      PENDING_ST: "Pending",
      APPROVED_ST: "Approved (ST)",
      SENT_TO_CLIENT: "Sent to Client",
      REVISION: "Revision",
      APPROVED_CLIENT: "Approved (Client)",
      APPROVED_CREATE_PROJECT: "Approved (Project)",
      CANCELLED: "Cancelled",
    };
    return map[status] || status || "Unknown";
  }, []);

  const buildQueryStringLocal = useCallback(
    (params: { paymentStatus?: string; status?: string; page?: string }) => {
      const urlParams = new URLSearchParams();
      if (search) urlParams.set("q", search);
      urlParams.set("page", params.page || "1");
      urlParams.set("limit", limit.toString());
      if (startDate) urlParams.set("startDate", startDate);
      if (endDate) urlParams.set("endDate", endDate);
      urlParams.set("paymentStatus", params.paymentStatus || paymentStatusFilter);
      urlParams.set("status", params.status || statusFilter);
      return `?${urlParams.toString()}`;
    },
    [search, limit, startDate, endDate, paymentStatusFilter, statusFilter]
  );

  const buildPaymentStatusFilterUrl = useCallback(
    (paymentStatus: string) => buildQueryStringLocal({ paymentStatus, page: "1" }),
    [buildQueryStringLocal]
  );

  const buildStatusFilterUrl = useCallback(
    (status: string) => buildQueryStringLocal({ status, page: "1" }),
    [buildQueryStringLocal]
  );

  // ── Loading & Error ──────────────────────────────────────────
  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-950/20">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────
  const filteredData = invoicesData.filter((item) => {
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      const match =
        item.piNumber?.toLowerCase().includes(s) ||
        item.customer?.name?.toLowerCase().includes(s) ||
        getPaymentStatusDisplayText(item.paymentStatus).toLowerCase().includes(s) ||
        getStatusDisplayText(item.status).toLowerCase().includes(s);
      if (!match) return false;
    }
    
    // Payment status filter
    if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;
    
    // Status filter
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    
    return true;
  });

  // ── Counts ──────────────────────────────────────────────────
  const paymentStatusCounts = {
    PENDING: invoicesData.filter((i) => i.paymentStatus === "PENDING").length,
    PARTIAL: invoicesData.filter((i) => i.paymentStatus === "PARTIAL").length,
    PAID: invoicesData.filter((i) => i.paymentStatus === "PAID").length,
    CANCELLED: invoicesData.filter((i) => i.paymentStatus === "CANCELLED").length,
    NONE: invoicesData.filter((i) => i.paymentStatus === "NONE").length,
  };

  const statusCounts = {
    PENDING_ST: invoicesData.filter((i) => i.status === "PENDING_ST").length,
    APPROVED_ST: invoicesData.filter((i) => i.status === "APPROVED_ST").length,
    SENT_TO_CLIENT: invoicesData.filter((i) => i.status === "SENT_TO_CLIENT").length,
    REVISION: invoicesData.filter((i) => i.status === "REVISION").length,
    APPROVED_CLIENT: invoicesData.filter((i) => i.status === "APPROVED_CLIENT").length,
    APPROVED_CREATE_PROJECT: invoicesData.filter((i) => i.status === "APPROVED_CREATE_PROJECT").length,
    CANCELLED: invoicesData.filter((i) => i.status === "CANCELLED").length,
  };

  const total = invoicesData.length;
  const filteredCount = filteredData.length;
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const hasFilter = paymentStatusFilter !== "all" || statusFilter !== "all";

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Payment Status Row ────────────────────────────── */}
      <div className="space-y-2">
        <StatusRowHeader title="Payment Status" icon={CircleDollarSign} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill 
            label="All" 
            count={total} 
            icon={Layers} 
            color="slate"
            selected={paymentStatusFilter === "all" && statusFilter === "all"} 
            href={buildQueryStringLocal({ paymentStatus: "all", status: "all", page: "1" })} 
          />
          <StatusPill 
            label="Pending" 
            count={paymentStatusCounts.PENDING} 
            icon={Clock} 
            color="amber"
            selected={paymentStatusFilter === "PENDING"} 
            href={buildPaymentStatusFilterUrl("PENDING")} 
          />
          <StatusPill 
            label="Partial" 
            count={paymentStatusCounts.PARTIAL} 
            icon={CreditCard} 
            color="orange"
            selected={paymentStatusFilter === "PARTIAL"} 
            href={buildPaymentStatusFilterUrl("PARTIAL")} 
          />
          <StatusPill 
            label="Paid" 
            count={paymentStatusCounts.PAID} 
            icon={CircleDollarSign} 
            color="emerald"
            selected={paymentStatusFilter === "PAID"} 
            href={buildPaymentStatusFilterUrl("PAID")} 
          />
          <StatusPill 
            label="Cancelled" 
            count={paymentStatusCounts.CANCELLED} 
            icon={Ban} 
            color="red"
            selected={paymentStatusFilter === "CANCELLED"} 
            href={buildPaymentStatusFilterUrl("CANCELLED")} 
          />
          <StatusPill 
            label="Stock" 
            count={paymentStatusCounts.NONE} 
            icon={AlertCircle} 
            color="violet"
            selected={paymentStatusFilter === "NONE"} 
            href={buildPaymentStatusFilterUrl("NONE")} 
          />
        </div>
      </div>

      {/* ── Document Status Row ────────────────────────────── */}
      <div className="space-y-2">
        <StatusRowHeader title="Document Status" icon={FileCheck} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill 
            label="All" 
            count={total} 
            icon={Layers} 
            color="slate"
            selected={statusFilter === "all" && paymentStatusFilter === "all"} 
            href={buildQueryStringLocal({ status: "all", paymentStatus: "all", page: "1" })} 
          />
          <StatusPill 
            label="Pending" 
            count={statusCounts.PENDING_ST} 
            icon={Loader2} 
            color="amber"
            selected={statusFilter === "PENDING_ST"} 
            href={buildStatusFilterUrl("PENDING_ST")} 
          />
          <StatusPill 
            label="Approved ST" 
            count={statusCounts.APPROVED_ST} 
            icon={Check} 
            color="blue"
            selected={statusFilter === "APPROVED_ST"} 
            href={buildStatusFilterUrl("APPROVED_ST")} 
          />
          <StatusPill 
            label="Sent to Client" 
            count={statusCounts.SENT_TO_CLIENT} 
            icon={Send} 
            color="purple"
            selected={statusFilter === "SENT_TO_CLIENT"} 
            href={buildStatusFilterUrl("SENT_TO_CLIENT")} 
          />
          <StatusPill 
            label="Revision" 
            count={statusCounts.REVISION} 
            icon={RefreshCw} 
            color="orange"
            selected={statusFilter === "REVISION"} 
            href={buildStatusFilterUrl("REVISION")} 
          />
          <StatusPill 
            label="Approved Client" 
            count={statusCounts.APPROVED_CLIENT} 
            icon={ThumbsUp} 
            color="teal"
            selected={statusFilter === "APPROVED_CLIENT"} 
            href={buildStatusFilterUrl("APPROVED_CLIENT")} 
          />
          <StatusPill 
            label="Approved Project" 
            count={statusCounts.APPROVED_CREATE_PROJECT} 
            icon={CheckCircle} 
            color="emerald"
            selected={statusFilter === "APPROVED_CREATE_PROJECT"} 
            href={buildStatusFilterUrl("APPROVED_CREATE_PROJECT")} 
          />
          <StatusPill 
            label="Cancelled" 
            count={statusCounts.CANCELLED} 
            icon={FileX} 
            color="red"
            selected={statusFilter === "CANCELLED"} 
            href={buildStatusFilterUrl("CANCELLED")} 
          />
        </div>
      </div>

      {/* ── Active Filters & Clear ──────────────────────────── */}
      {hasFilter && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {paymentStatusFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Payment: {getPaymentStatusDisplayText(paymentStatusFilter)}
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Status: {getStatusDisplayText(statusFilter)}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              ({filteredCount} results)
            </span>
          </div>
          <Link
            href={buildQueryStringLocal({ paymentStatus: "all", status: "all", page: "1" })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Link>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────── */}
      {total === 0 && !hasFilter ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No invoices yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &quot;New Invoice&quot; to get started.
          </p>
        </div>
      ) : (
        <DataTable
          data={paginatedData}
          totalItems={filteredCount}
          columns={proformaInvoiceColumns}
          currentPage={page}
          itemsPerPage={limit}
          searchValue={search}
          paymentStatusFilter={paymentStatusFilter}
          statusFilter={statusFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}