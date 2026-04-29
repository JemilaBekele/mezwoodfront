"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";

import type { IProforma } from "@/models/proforma";
import { getAllProformas } from "@/service/proforma";
import { proformaColumns } from "./tables/columns";

type ProformaListingPageProps = object;

export default function ProformaListingPage({}: ProformaListingPageProps) {
  const { page, search, limit } = useTableQueryParams();

  const [proformas, setProformas] = useState<IProforma[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProformas = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllProformas({ page, limit });

        if (cancelled) return;

        setProformas(response.proformas || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading proformas.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProformas();

    return () => {
      cancelled = true;
    };
  }, [limit, page]);

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // 🔍 Filter by customer instead of supplier
  const filteredData = proformas.filter((item) =>
    item?.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={proformaColumns}
    />
  );
}