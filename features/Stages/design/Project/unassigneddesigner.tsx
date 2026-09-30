"use client";

/* eslint-disable react-hooks/error-boundaries */

import { useEffect, useState } from "react";
import { StageCardGrid } from "@/features/Stages/stage-card-grid";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { UnassignedgetdesignProjects } from "@/service/Stages";
import { IProject } from "@/models/Projects";
import { unassignedProjectColumns } from "./tables/unassigend/columns";
import { DesignStatusFilter, useDesignStatusFilter } from "./design-status-filter";

type ProjectListingPageProps = object;

export default function UnDesignProjectListingPage({}: ProjectListingPageProps) {
  const { page, search, limit } = useTableQueryParams(20);
  const { designStatus, select, apply } = useDesignStatusFilter();

  const [projects, setProjects] = useState<IProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await UnassignedgetdesignProjects({
        status: "all",
      });

      setProjects(response.projects || []);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      console.error("Error loading design projects:", err);
      setError("Error loading projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await loadProjects();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const searchedData = projects.filter((project) => {
    const searchLower = search.toLowerCase();

    return (
      project.invoice?.piNumber?.toLowerCase().includes(searchLower) ||
      project.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredData = apply(searchedData);

  const startIndex = (page - 1) * limit;
  const paginatedData = filteredData.slice(startIndex, startIndex + limit);

  return (
    <div className="space-y-4">
      <DesignStatusFilter projects={searchedData} value={designStatus} onChange={select} />
      <StageCardGrid
        compact
        showDesignStatus
        data={paginatedData}
        totalItems={filteredData.length}
        columns={unassignedProjectColumns(loadProjects)} // 👈 pass reload function
      />
    </div>
  );
}