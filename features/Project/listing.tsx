"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { getProjects } from "@/service/Project";
import { projectColumns } from "./tables/columns";
import { AlertCircle, FolderOpen } from "lucide-react";
import type { IProject } from "@/models/Projects";

type ProjectListingPageProps = object;

export default function ProjectListingPage(
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

        const response = await getProjects({
          page,
          limit,
          search
        });

        if (cancelled) return;

        setProjects(response.projects || []);
        setTotalCount(response.totalCount || 0);
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
  }, [page, limit, search]);

  if (loading) {
    return (
      <DataTableSkeleton
        columnCount={8}
        rowCount={8}
        filterCount={2}
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-950/20">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  const filteredData = projects.filter((project) => {
    const searchLower = search.toLowerCase();

    return (
      project.invoice?.piNumber
        ?.toLowerCase()
        .includes(searchLower) ||
      project.customer?.name
        ?.toLowerCase()
        .includes(searchLower)
    );
  });

  if (filteredData.length === 0 && !search) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <FolderOpen className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">
          No projects yet
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Projects will appear here once created from approved
          proforma invoices.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      data={filteredData}
      totalItems={totalCount}
      columns={projectColumns}
    />
  );
}