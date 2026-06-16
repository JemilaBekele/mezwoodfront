"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { ITransfer } from "@/models/transfer";
import { getAllTransfers } from "@/service/transfer";
import { transferColumns } from "./tables/columns";

type TransferListingPageProps = object;

export default function TransferListingPage({}: TransferListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTransfers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllTransfers({
          page,
          limit
        });

        if (cancelled) {
          return;
        }

        setTransfers(response.data || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading transfer records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTransfers();

    return () => {
      cancelled = true;
    };
  }, [endDate, limit, page, startDate]);

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const filteredData = transfers.filter((item) => {
    const searchTerm = search?.toLowerCase() || "";

    const reference = item?.reference?.toLowerCase() || "";
    const status = item?.status?.toLowerCase() || "";

    return (
      reference.includes(searchTerm) ||
      status.includes(searchTerm)
    );
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={transferColumns}
    />
  );
}
