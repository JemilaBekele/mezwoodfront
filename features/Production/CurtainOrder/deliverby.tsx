/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { getdeliverbyByCreator } from "@/service/Curtain";
import DeliveryPlannerPage from "./deliveryplan";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

// Import the actual type from your service or models
import type { ICurtainOrder } from "@/models/curtainType"; // Adjust the import path as needed
import { DelivercurtainOrderColumns } from "./deliver";

type CurtainOrdersListingPageProps = object;

// Helper function to flatten curtain order data for Excel export
const flattenCurtainOrdersData = (orders: ICurtainOrder[]) => {
  return orders.map((order) => ({
    'Order ID': (order as any)._id || (order as any).id,
    'Customer Name': (order as any).customer?.name || '-',
    'Customer Phone': (order as any).customer?.phone || '-',
    'Curtain Status': order.curtainStatus,
    'Payment Status': order.paymentStatus,
    'Remark': (order as any).remark || '-',
    'Created At': (order as any).createdAt ? new Date((order as any).createdAt).toLocaleDateString() : '-',
  }));
};

const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns
  const maxWidth = 50;
  const colWidths: any = {};
  Object.keys(data[0] || {}).forEach((key) => {
    let maxLength = key.length;
    data.forEach((row) => {
      const value = row[key]?.toString() || '';
      maxLength = Math.max(maxLength, value.length);
    });
    colWidths[key] = Math.min(maxLength, maxWidth);
  });
  
  worksheet['!cols'] = Object.values(colWidths).map((width: any) => ({ wch: width }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Curtain Orders Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export default function CurtainOrdersListingPage({}: CurtainOrdersListingPageProps) {
  const searchParams = useSearchParams();
  
  // Get filters from URL
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit')) || 10;
  const curtainStatusFilter = searchParams.get('curtainStatus') || 'all';
  const paymentStatusFilter = searchParams.get('paymentStatus') || 'all';

  const [curtainOrders, setCurtainOrders] = useState<ICurtainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCurtainOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getdeliverbyByCreator({ page, limit });

        if (cancelled) return;

        setCurtainOrders(response.curtainOrders || []);
      } catch (loadError) {
        console.error("Error loading curtain orders:", loadError);
        if (!cancelled) {
          setError("Error loading curtain orders. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCurtainOrders();
    return () => { cancelled = true; };
  }, [limit, page]);

  // Filter data based on search and status filters
  const filteredData = useMemo(() => {
    let data = [...curtainOrders];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter((order) =>
        (order as any).customer?.name?.toLowerCase().includes(searchLower) ||
        (order as any).remark?.toLowerCase().includes(searchLower)
      );
    }

    // Curtain Status filter
    if (curtainStatusFilter !== 'all') {
      data = data.filter(
        (item) => item.curtainStatus === curtainStatusFilter
      );
    }

    // Payment Status filter
    if (paymentStatusFilter !== 'all') {
      data = data.filter(
        (item) => item.paymentStatus === paymentStatusFilter
      );
    }

    return data;
  }, [curtainOrders, search, curtainStatusFilter, paymentStatusFilter]);

  // Paginate data
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Prepare data for export
  const exportData = useMemo(() => {
    if (filteredData.length === 0) return [];
    return flattenCurtainOrdersData(filteredData);
  }, [filteredData]);

  const handleExportExcel = () => {
    if (exportData.length === 0) {
      alert('No data to export');
      return;
    }
    exportToExcel(exportData, `curtain-orders-${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="mb-4 flex gap-2">
        <Button onClick={handleExportExcel} variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Delivery Planner Component */}
      <DeliveryPlannerPage />

      {/* Data Table */}
      <DataTable
        data={paginatedData as any}
        totalItems={filteredData.length}
        columns={DelivercurtainOrderColumns}
      />
    </div>
  );
}