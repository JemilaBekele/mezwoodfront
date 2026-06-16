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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { getAllProformaInvoices } from "@/service/ProformaInvoice";
import { proformaInvoiceColumns } from "./tables/columns";
import { useTableQueryParams } from "@/hooks/use-table-query-params";

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

// ─── Main Listing ───────────────────────────────────────────────
export default function ProformaInvoiceListingPage({}: ProformaInvoiceListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  const paymentStatusFilter = searchParams.get("paymentStatus") || "all";
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        const { proformaInvoices } = await getAllProformaInvoices({
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

  const buildQueryStringLocal = useCallback(
    (params: { paymentStatus?: string; page?: string }) => {
      const urlParams = new URLSearchParams();
      if (search) urlParams.set("q", search);
      urlParams.set("page", params.page || "1");
      urlParams.set("limit", limit.toString());
      if (startDate) urlParams.set("startDate", startDate);
      if (endDate) urlParams.set("endDate", endDate);
      urlParams.set("paymentStatus", params.paymentStatus || paymentStatusFilter);
      return `?${urlParams.toString()}`;
    },
    [search, limit, startDate, endDate, paymentStatusFilter]
  );

  const buildStatusFilterUrl = useCallback(
    (paymentStatus: string) => buildQueryStringLocal({ paymentStatus, page: "1" }),
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
    if (search) {
      const s = search.toLowerCase();
      const match =
        item.piNumber?.toLowerCase().includes(s) ||
        item.customer?.name?.toLowerCase().includes(s) ||
        getPaymentStatusDisplayText(item.paymentStatus).toLowerCase().includes(s);
      if (!match) return false;
    }
    if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;
    return true;
  });

  const counts = {
    PENDING: invoicesData.filter((i) => i.paymentStatus === "PENDING").length,
    PARTIAL: invoicesData.filter((i) => i.paymentStatus === "PARTIAL").length,
    PAID: invoicesData.filter((i) => i.paymentStatus === "PAID").length,
    CANCELLED: invoicesData.filter((i) => i.paymentStatus === "CANCELLED").length,
    NONE: invoicesData.filter((i) => i.paymentStatus === "NONE").length,
  };

  const total = invoicesData.length;
  const filteredCount = filteredData.length;
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const hasFilter = paymentStatusFilter !== "all";

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* ── Status Filter Row ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label="All" count={total} icon={Layers} color="slate"
          selected={paymentStatusFilter === "all"} href={buildStatusFilterUrl("all")} />
        <StatusPill label="Pending" count={counts.PENDING} icon={Clock} color="amber"
          selected={paymentStatusFilter === "PENDING"} href={buildStatusFilterUrl("PENDING")} />
        <StatusPill label="Partial" count={counts.PARTIAL} icon={CreditCard} color="orange"
          selected={paymentStatusFilter === "PARTIAL"} href={buildStatusFilterUrl("PARTIAL")} />
        <StatusPill label="Paid" count={counts.PAID} icon={CircleDollarSign} color="emerald"
          selected={paymentStatusFilter === "PAID"} href={buildStatusFilterUrl("PAID")} />
        <StatusPill label="Cancelled" count={counts.CANCELLED} icon={Ban} color="red"
          selected={paymentStatusFilter === "CANCELLED"} href={buildStatusFilterUrl("CANCELLED")} />
        <StatusPill label="Stock" count={counts.NONE} icon={AlertCircle} color="violet"
          selected={paymentStatusFilter === "NONE"} href={buildStatusFilterUrl("NONE")} />

        {/* Active filter clear */}
        {hasFilter && (
          <Link
            href={buildQueryStringLocal({ paymentStatus: "all", page: "1" })}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear · {filteredCount}
          </Link>
        )}
      </div>

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
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}