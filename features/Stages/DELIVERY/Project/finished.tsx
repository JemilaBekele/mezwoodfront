"use client";

/* eslint-disable react-hooks/error-boundaries */

import { useEffect, useState } from "react";
import { StageCardGrid } from "@/features/Stages/stage-card-grid";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { getdeliveryProjects } from "@/service/Stages";
import { projectColumns } from "../Project/tables/columns";
import { IProject } from "@/models/Projects";
import { SellPaymentStatus } from "@/models/Sell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectListingPageProps = object;

export default function FinisheddeliveryProjectListingPage(
  {}: ProjectListingPageProps
) {
  const { page, search, limit } = useTableQueryParams(20);

  const [projects, setProjects] = useState<IProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<SellPaymentStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getdeliveryProjects({
          status: "finished",
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
  }, []);

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const filteredData = projects.filter((project) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      project.invoice?.piNumber?.toLowerCase().includes(searchLower) ||
      project.customer?.name?.toLowerCase().includes(searchLower);

    const matchesPaymentStatus =
      paymentStatus === "all" || project.invoice?.paymentStatus === paymentStatus;

    return matchesSearch && matchesPaymentStatus;
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <Select
        value={paymentStatus}
        onValueChange={(value) => setPaymentStatus(value as SellPaymentStatus | "all")}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payment Status</SelectItem>
          {Object.values(SellPaymentStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <StageCardGrid
        data={paginatedData}
        totalItems={filteredData.length}
        columns={projectColumns}
      />
    </div>
  );
}