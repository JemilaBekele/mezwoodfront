"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { IExpense } from "@/models/Expense";
import { getAllExpenses } from "@/service/expence";
import { expenseColumns } from "./tables/columns";

interface ExpensesListingPageProps {
  refreshTrigger?: number;
}

export default function ExpensesListingPage({ refreshTrigger = 0 }: ExpensesListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadExpenses = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getAllExpenses({
          page,
          limit,
          search
        });

        if (cancelled) {
          return;
        }

        setExpenses(result.expenses || []);
        setTotalCount(result.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading expenses. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadExpenses();

    return () => {
      cancelled = true;
    };
  }, [limit, page, search, refreshTrigger]);

  if (loading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Client-side search filter on title
  const searchLower = search.toLowerCase();
  const filteredData = expenses.filter((item: IExpense) =>
    item.title?.toLowerCase().includes(searchLower)
  );

  // Client-side pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={expenseColumns}
    />
  );
}