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
  Layers,
  Package,
  Truck,
  X,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ISell, SaleStatus } from "@/models/Sell";
import { SellPaymentStatus } from "@/models/Sell";
import { getUserSells } from "@/service/Sell";
import { sellColumns } from "./tables/columns";
import { useTableQueryParams } from "@/hooks/use-table-query-params";

type SellListingPageProps = object;

// ─── Compact Status Pill ────────────────────────────────────────
export function StatusPill({
  label,
  count,
  icon: Icon,
  selected,
  href,
  color,
  needsAttention = false,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  href: string;
  color: string;
  needsAttention?: boolean;
}) {
  const colorMap: Record<string, string> = {
    slate: "text-muted-foreground",
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    orange: "text-orange-600 dark:text-orange-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    violet: "text-violet-600 dark:text-violet-400",
  };

  return (
    <Link href={href} aria-label={`Filter: ${label}`}>
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-150 hover:bg-muted/50 ${
          selected
            ? "border-primary/30 bg-primary/5 shadow-sm"
            : "border-transparent bg-muted/30"
        } ${needsAttention && count > 0 ? "animate-pulse ring-1 ring-amber-200 dark:ring-amber-800" : ""}`}
      >
        <Icon className={`h-3.5 w-3.5 ${colorMap[color]}`} />
        <span className="font-semibold tabular-nums">{count}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
        {selected && <Check className="h-3 w-3 text-primary ml-auto" />}
        {needsAttention && count > 0 && (
          <span className="ml-1 flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Main Listing ───────────────────────────────────────────────
export default function UserSellListingPage({}: SellListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  const saleStatusFilter = searchParams.get("saleStatus") || "all";
  const paymentStatusFilter = searchParams.get("paymentStatus") || "all";
  const employeeFilter = searchParams.get("employee") || "all";
  const [activeTab, setActiveTab] = useState<"sale" | "payment">("sale");
  const [salesData, setSalesData] = useState<ISell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSalesPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const salesResponse = await getUserSells();

        if (cancelled) {
          return;
        }

        setSalesData(salesResponse.data || []);
      } catch {
        if (!cancelled) {
          setError("Error loading sells. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSalesPage();

    return () => {
      cancelled = true;
    };
  }, [endDate, limit, page, startDate]);

  // ── Helpers ──────────────────────────────────────────────────
  const getSaleStatusDisplayText = useCallback((status: SaleStatus): string => {
    const map: Record<string, string> = {
      APPROVED: "Approved",
      NOT_APPROVED: "Not Approved",
      PARTIALLY_DELIVERED: "Partial Delivery",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return map[status] || "Unknown";
  }, []);

  const getPaymentStatusDisplayText = useCallback((status: SellPaymentStatus): string => {
    const map: Record<string, string> = {
      PENDING: "Pending",
      PARTIAL: "Partial",
      PAID: "Paid",
      CANCELLED: "Cancelled",
    };
    return map[status] || "Unknown";
  }, []);

  const buildQueryStringLocal = useCallback(
    (params: {
      saleStatus?: string;
      paymentStatus?: string;
      employee?: string;
      page?: string;
    }) => {
      const urlParams = new URLSearchParams();
      if (search) urlParams.set("q", search);
      urlParams.set("page", params.page || "1");
      urlParams.set("limit", limit.toString());
      if (startDate) urlParams.set("startDate", startDate);
      if (endDate) urlParams.set("endDate", endDate);
      urlParams.set("saleStatus", params.saleStatus || saleStatusFilter);
      urlParams.set("paymentStatus", params.paymentStatus || paymentStatusFilter);
      urlParams.set("employee", params.employee || employeeFilter);
      return `?${urlParams.toString()}`;
    },
    [search, limit, startDate, endDate, saleStatusFilter, paymentStatusFilter, employeeFilter]
  );

  const buildStatusFilterUrl = useCallback(
    (saleStatus: string, paymentStatus: string, employee?: string) =>
      buildQueryStringLocal({
        saleStatus,
        paymentStatus,
        employee: employee || employeeFilter,
        page: "1",
      }),
    [buildQueryStringLocal, employeeFilter]
  );

  // ── Loading & Error ──────────────────────────────────────────
  if (loading) {
    return <DataTableSkeleton columnCount={7} rowCount={8} filterCount={3} />;
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
  const filteredData = salesData.filter((item) => {
    if (search) {
      const s = search.toLowerCase();
      const match =
        item.invoiceNo?.toLowerCase().includes(s) ||
        item.customer?.name?.toLowerCase().includes(s) ||
        item.createdBy?.name?.toLowerCase().includes(s) ||
        getSaleStatusDisplayText(item.saleStatus).toLowerCase().includes(s) ||
        getPaymentStatusDisplayText(item.paymentStatus).toLowerCase().includes(s);
      if (!match) return false;
    }
    if (saleStatusFilter !== "all" && item.saleStatus !== saleStatusFilter) return false;
    if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;
    if (employeeFilter !== "all" && item.createdBy?.id !== employeeFilter) return false;
    return true;
  });

  // Sale status counts
  const saleStatusCounts = {
    APPROVED: salesData.filter((i) => i.saleStatus === "APPROVED").length,
    NOT_APPROVED: salesData.filter((i) => i.saleStatus === "NOT_APPROVED").length,
    PARTIALLY_DELIVERED: salesData.filter((i) => i.saleStatus === "PARTIALLY_DELIVERED").length,
    DELIVERED: salesData.filter((i) => i.saleStatus === "DELIVERED").length,
    CANCELLED: salesData.filter((i) => i.saleStatus === "CANCELLED").length,
  };

  // Payment status counts
  const paymentStatusCounts = {
    PENDING: salesData.filter((i) => i.paymentStatus === "PENDING").length,
    PARTIAL: salesData.filter((i) => i.paymentStatus === "PARTIAL").length,
    PAID: salesData.filter((i) => i.paymentStatus === "PAID").length,
    CANCELLED: salesData.filter((i) => i.paymentStatus === "CANCELLED").length,
  };

  const totalSells = salesData.length;
  const filteredCount = filteredData.length;
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const hasFilter = saleStatusFilter !== "all" || paymentStatusFilter !== "all" || employeeFilter !== "all";

  // Employee options (unique creators)
  const employeeOptions = Array.from(
    new Map(salesData.map((item) => [item.createdBy?.id, item.createdBy?.name])).entries()
  )
    .filter(([id]) => id)
    .map(([id, name]) => ({ id: id!, name: name || "Unknown" }));

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Sales Management</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total: {totalSells}</span>
          <span className="h-4 w-px bg-border" />
          <span>Showing: {filteredCount}</span>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sale" | "payment")}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="sale">Sale Status</TabsTrigger>
          <TabsTrigger value="payment">Payment Status</TabsTrigger>
        </TabsList>

        <TabsContent value="sale" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label="All"
              count={totalSells}
              icon={Layers}
              color="slate"
              selected={saleStatusFilter === "all"}
              href={buildStatusFilterUrl("all", paymentStatusFilter)}
            />
            <StatusPill
              label="Approved"
              count={saleStatusCounts.APPROVED}
              icon={Check}
              color="blue"
              selected={saleStatusFilter === "APPROVED"}
              href={buildStatusFilterUrl("APPROVED", paymentStatusFilter)}
            />
            <StatusPill
              label="Not Approved"
              count={saleStatusCounts.NOT_APPROVED}
              icon={AlertCircle}
              color="amber"
              selected={saleStatusFilter === "NOT_APPROVED"}
              href={buildStatusFilterUrl("NOT_APPROVED", paymentStatusFilter)}
              needsAttention={saleStatusCounts.NOT_APPROVED > 0}
            />
            <StatusPill
              label="Partial Delivery"
              count={saleStatusCounts.PARTIALLY_DELIVERED}
              icon={Package}
              color="orange"
              selected={saleStatusFilter === "PARTIALLY_DELIVERED"}
              href={buildStatusFilterUrl("PARTIALLY_DELIVERED", paymentStatusFilter)}
            />
            <StatusPill
              label="Delivered"
              count={saleStatusCounts.DELIVERED}
              icon={Truck}
              color="green"
              selected={saleStatusFilter === "DELIVERED"}
              href={buildStatusFilterUrl("DELIVERED", paymentStatusFilter)}
            />
            <StatusPill
              label="Cancelled"
              count={saleStatusCounts.CANCELLED}
              icon={Ban}
              color="red"
              selected={saleStatusFilter === "CANCELLED"}
              href={buildStatusFilterUrl("CANCELLED", paymentStatusFilter)}
            />
          </div>

          {/* Employee filter */}
          {employeeOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-xs font-medium text-muted-foreground mr-1">Employee:</span>
              <StatusPill
                label="All"
                count={salesData.length}
                icon={User}
                color="slate"
                selected={employeeFilter === "all"}
                href={buildStatusFilterUrl(saleStatusFilter, paymentStatusFilter, "all")}
              />
              {employeeOptions.map((emp) => (
                <StatusPill
                  key={emp.id}
                  label={emp.name}
                  count={salesData.filter((i) => i.createdBy?.id === emp.id).length}
                  icon={User}
                  color="violet"
                  selected={employeeFilter === emp.id}
                  href={buildStatusFilterUrl(saleStatusFilter, paymentStatusFilter, emp.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label="All"
              count={totalSells}
              icon={Layers}
              color="slate"
              selected={paymentStatusFilter === "all"}
              href={buildStatusFilterUrl(saleStatusFilter, "all")}
            />
            <StatusPill
              label="Pending"
              count={paymentStatusCounts.PENDING}
              icon={Clock}
              color="yellow"
              selected={paymentStatusFilter === "PENDING"}
              href={buildStatusFilterUrl(saleStatusFilter, "PENDING")}
              needsAttention={paymentStatusCounts.PENDING > 0}
            />
            <StatusPill
              label="Partial"
              count={paymentStatusCounts.PARTIAL}
              icon={CreditCard}
              color="orange"
              selected={paymentStatusFilter === "PARTIAL"}
              href={buildStatusFilterUrl(saleStatusFilter, "PARTIAL")}
            />
            <StatusPill
              label="Paid"
              count={paymentStatusCounts.PAID}
              icon={CircleDollarSign}
              color="emerald"
              selected={paymentStatusFilter === "PAID"}
              href={buildStatusFilterUrl(saleStatusFilter, "PAID")}
            />
            <StatusPill
              label="Cancelled"
              count={paymentStatusCounts.CANCELLED}
              icon={Ban}
              color="red"
              selected={paymentStatusFilter === "CANCELLED"}
              href={buildStatusFilterUrl(saleStatusFilter, "CANCELLED")}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Active Filter Clear ────────────────────────────── */}
      {hasFilter && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Filters Applied
            </Badge>
            {saleStatusFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Sale: {getSaleStatusDisplayText(saleStatusFilter as SaleStatus)}
              </Badge>
            )}
            {paymentStatusFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Payment: {getPaymentStatusDisplayText(paymentStatusFilter as SellPaymentStatus)}
              </Badge>
            )}
            {employeeFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Employee: {employeeOptions.find((e) => e.id === employeeFilter)?.name || "Unknown"}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {filteredCount} result{filteredCount === 1 ? "" : "s"}
            </span>
          </div>
          <Link
            href={buildQueryStringLocal({
              saleStatus: "all",
              paymentStatus: "all",
              employee: "all",
              page: "1",
            })}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear All
          </Link>
        </div>
      )}

      {/* ── Attention Alerts ─────────────────────────────────── */}
      {saleStatusCounts.NOT_APPROVED > 0 && activeTab === "sale" && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">{saleStatusCounts.NOT_APPROVED}</span> sale
            {saleStatusCounts.NOT_APPROVED === 1 ? "" : "s"} waiting for approval.
          </p>
        </div>
      )}

      {paymentStatusCounts.PENDING > 0 && activeTab === "payment" && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800/40 dark:bg-yellow-950/20">
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">{paymentStatusCounts.PENDING}</span> sale
            {paymentStatusCounts.PENDING === 1 ? "" : "s"} with pending payment.
          </p>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────── */}
      {totalSells === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Package className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No sales yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sales will appear here once created.
          </p>
        </div>
      ) : (
        <DataTable
          data={paginatedData}
          totalItems={filteredCount}
          columns={sellColumns}
          currentPage={page}
          itemsPerPage={limit}
          searchValue={search}
          statusFilter={saleStatusFilter}
          paymentStatusFilter={paymentStatusFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}