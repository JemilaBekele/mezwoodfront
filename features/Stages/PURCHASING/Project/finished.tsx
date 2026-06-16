"use client";

/* eslint-disable react-hooks/error-boundaries */

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { getpurchasingProjects } from "@/service/Stages";
import { projectColumns } from "./tables/columns";
import { IProject } from "@/models/Projects";

type ProjectListingPageProps = object;

export default function FinshPurchaseProjectListingPage(
  {}: ProjectListingPageProps
) {
  const { page, search, limit } = useTableQueryParams();

  const [projects, setProjects] = useState<IProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getpurchasingProjects({
          status: "finished",
        });

        if (cancelled) return;

        setProjects(response.projects || []);
        setTotalCount(response.totalCount || 0);
      } catch (err) {
        console.error("Error loading purchasing projects:", err);

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
  }, []);

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const filteredData = projects.filter((project) => {
    const searchLower = search.toLowerCase();

    return (
      project.invoice?.piNumber?.toLowerCase().includes(searchLower) ||
      project.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={filteredData.length}
      columns={projectColumns}
    />
  );
}