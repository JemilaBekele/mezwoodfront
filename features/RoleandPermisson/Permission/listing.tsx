"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IRolePermission } from '@/service/roleService';
import { getAllRolePermissions } from "@/service/roleService";
import { rolePermissionColumns } from "./tables/columns";

type PermissionListingPageProps = object;

export default function RolePermissionListingPage({}: PermissionListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const [rolePermissions, setRolePermissions] = useState<IRolePermission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRolePermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllRolePermissions({
          page,
          limit,
          startDate,
          endDate
        });

        if (cancelled) {
          return;
        }

        setRolePermissions(response.rolePermissions || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading permissions list.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRolePermissions();

    return () => {
      cancelled = true;
    };
  }, [limit, page, startDate, endDate]);

  if (loading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Client-side search filter on role name or permission name
  const searchLower = search.toLowerCase();
  const filteredData = rolePermissions.filter(
    (perm) =>
      perm.role?.name.toLowerCase().includes(searchLower) ||
      (perm.permission?.name?.toLowerCase() ?? "").includes(searchLower)
  );

  // Client-side pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={rolePermissionColumns}
    />
  );
}