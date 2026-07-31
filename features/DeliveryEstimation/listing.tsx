
"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";

import type { IDeliveryEstimation } from "@/models/delivery-estimation";
import { getAllDeliveryEstimations } from "@/service/delivery-estimation";

import { deliveryEstimationColumns } from "./tables/columns";

type DeliveryEstimationsListingPageProps = object;

export default function DeliveryEstimationsListingPage(
  {}: DeliveryEstimationsListingPageProps,
) {
  const { page, search, limit } = useTableQueryParams();

  const [estimations, setEstimations] = useState<IDeliveryEstimation[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDeliveryEstimations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllDeliveryEstimations({
          page,
          limit,
        });

        if (cancelled) {
          return;
        }

        setEstimations(response.estimations || []);
        setTotalCount(response.totalCount || 0);
      } catch (error) {
        console.error("Error loading delivery estimations:", error);

        if (!cancelled) {
          setError(
            "Error loading delivery estimations. Please try again later.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDeliveryEstimations();

    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  if (loading) {
    return (
      <DataTableSkeleton
        columnCount={5}
        rowCount={8}
        filterCount={2}
      />
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  const filteredData = estimations.filter((item) =>
    [
      item.customerName,
      item.phone,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = filteredData.slice(
    startIndex,
    endIndex,
  );

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={deliveryEstimationColumns}
    />
  );
}

