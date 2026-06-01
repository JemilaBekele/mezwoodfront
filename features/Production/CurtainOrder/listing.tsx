/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import Link from "next/link";
import { getAllCurtainOrders } from "@/service/Curtain";
import { curtainOrderColumns } from "./tables/columns";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

// Import the actual type from your service or models
import type { ICurtainOrder } from "@/models/curtainType"; // Adjust the import path as needed

type CurtainOrdersListingPageProps = object;

// Use the imported ICurtainOrder type instead of defining a local one
// If you can't import it, extend it or use it directly

function StatusCard({
  title,
  count,
  selected = false,
  href,
  value,
  variant = 'default'
}: {
  title: string;
  count: number;
  selected?: boolean;
  href: string;
  value?: string;
  variant?: 'default' | 'pending' | 'completed' | 'delivered' | 'cancelled' | 'paid';
}) {
  const variantStyles = {
    default: 'border-border bg-card',
    pending:
      'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20',
    completed:
      'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
    delivered:
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
    cancelled:
      'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
    paid:
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
  };

  const selectedStyles = selected
    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
    : '';

  return (
    <Link href={href}>
      <Card
        className={`cursor-pointer transition-all hover:shadow-sm p-2 ${variantStyles[variant]} ${selectedStyles}`}
      >
        <CardHeader className='p-0 pb-1'>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value={value || ''} className="h-3 w-3" />
            <Label className='text-xs font-medium cursor-pointer'>
              {title}
            </Label>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className='flex items-center justify-between'>
            <div className='text-sm font-semibold'>{count}</div>
            {selected && <Check className='h-3 w-3 text-primary' />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Helper function to flatten curtain order data for Excel export
// Use ICurtainOrder type here
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
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get filters from URL
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit')) || 10;
  const curtainStatusFilter = searchParams.get('curtainStatus') || 'all';
  const paymentStatusFilter = searchParams.get('paymentStatus') || 'all';

  // Use the imported ICurtainOrder type
  const [curtainOrders, setCurtainOrders] = useState<ICurtainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build query string for filter links
  const buildQueryString = (
    curtainStatus: string,
    paymentStatus: string
  ) => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', limit.toString());
    if (search) params.set('q', search);
    params.set('curtainStatus', curtainStatus);
    params.set('paymentStatus', paymentStatus);
    return `?${params.toString()}`;
  };

  useEffect(() => {
    let cancelled = false;

    const loadCurtainOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllCurtainOrders({ page, limit });

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

  // Calculate status counts
  const curtainCounts = useMemo(() => ({
    PENDING: curtainOrders.filter(i => i.curtainStatus === 'PENDING').length,
    COMPLETED: curtainOrders.filter(i => i.curtainStatus === 'COMPLETED').length,
    DELIVERED: curtainOrders.filter(i => i.curtainStatus === 'DELIVERED').length,
    CANCELLED: curtainOrders.filter(i => i.curtainStatus === 'CANCELLED').length
  }), [curtainOrders]);

  const paymentCounts = useMemo(() => ({
    PENDING: curtainOrders.filter(i => i.paymentStatus === 'PENDING').length,
    PAID: curtainOrders.filter(i => i.paymentStatus === 'PAID').length
  }), [curtainOrders]);

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

      {/* Curtain Status Filters */}
      <RadioGroup className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatusCard
            title="All Curtains"
            count={curtainOrders.length}
            selected={curtainStatusFilter === 'all'}
            href={buildQueryString('all', paymentStatusFilter)}
          />
          <StatusCard
            title="Pending"
            count={curtainCounts.PENDING}
            variant="pending"
            selected={curtainStatusFilter === 'PENDING'}
            href={buildQueryString('PENDING', paymentStatusFilter)}
          />
          <StatusCard
            title="Completed"
            count={curtainCounts.COMPLETED}
            variant="completed"
            selected={curtainStatusFilter === 'COMPLETED'}
            href={buildQueryString('COMPLETED', paymentStatusFilter)}
          />
          <StatusCard
            title="Delivered"
            count={curtainCounts.DELIVERED}
            variant="delivered"
            selected={curtainStatusFilter === 'DELIVERED'}
            href={buildQueryString('DELIVERED', paymentStatusFilter)}
          />
          <StatusCard
            title="Cancelled"
            count={curtainCounts.CANCELLED}
            variant="cancelled"
            selected={curtainStatusFilter === 'CANCELLED'}
            href={buildQueryString('CANCELLED', paymentStatusFilter)}
          />
        </div>
      </RadioGroup>

      {/* Payment Status Filters */}
      <RadioGroup>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatusCard
            title="All Payments"
            count={curtainOrders.length}
            selected={paymentStatusFilter === 'all'}
            href={buildQueryString(curtainStatusFilter, 'all')}
          />
          <StatusCard
            title="Pending"
            count={paymentCounts.PENDING}
            variant="pending"
            selected={paymentStatusFilter === 'PENDING'}
            href={buildQueryString(curtainStatusFilter, 'PENDING')}
          />
          <StatusCard
            title="Paid"
            count={paymentCounts.PAID}
            variant="paid"
            selected={paymentStatusFilter === 'PAID'}
            href={buildQueryString(curtainStatusFilter, 'PAID')}
          />
        </div>
      </RadioGroup>

      {/* Data Table */}
      <DataTable
        data={paginatedData as any} // Use 'as any' as a temporary fix if types don't match
        totalItems={filteredData.length}
        columns={curtainOrderColumns}
      />
    </div>
  );
}