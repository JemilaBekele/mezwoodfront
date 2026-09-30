"use client";

import { useSearchParams } from "next/navigation";

export const useTableQueryParams = (defaultLimit = 10) => {
  const searchParams = useSearchParams();

  return {
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || defaultLimit,
    search: searchParams.get("q") || "",
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  };
};
