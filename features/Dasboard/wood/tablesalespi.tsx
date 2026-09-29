/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Download,
  Filter,
  X,
  Eye,
  FileText,
  ShoppingCart,
  Calculator,
  FileSpreadsheet,
  Phone,
  Loader2
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  getAllProformaInvoicesAndSales,
  IProformaSalesResponse
} from '@/service/item';
import { getAllEmploy } from '@/service/employee';
import { getCustomer } from '@/service/customer';
import { IProformaInvoice, PIStatus } from '@/models/ProformaInvoice';
import { ISell, SaleStatus, SellPaymentStatus } from '@/models/Sell';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface IEmployee {
  id: string;
  email: string;
  name?: string;
}

interface ICustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// FIXED: Type guards - More specific to prevent cross-identification
const isProformaInvoice = (item: any): item is IProformaInvoice => {
  // Check by type property first, then by presence of piNumber (proforma has piNumber, sale has invoiceNo)
  return item.type === 'PROFORMA' || (item.piNumber && !item.invoiceNo);
};

const isSale = (item: any): item is ISell => {
  // Check by type property first, then by presence of invoiceNo (sale has invoiceNo, proforma has piNumber)
  return item.type === 'SALE' ;
};

// ─── Money helpers (proforma: total / amountPaid, sale: grandTotal / totalPaid) ──
const getTotal = (item: any): number =>
  Number(isProformaInvoice(item) ? item.total : item.grandTotal) || 0;

const getPaid = (item: any): number =>
  Number(item.totalPaid ?? item.amountPaid) || 0;

const getBalance = (item: any): number =>
  item.balance !== undefined && item.balance !== null
    ? Number(item.balance) || 0
    : getTotal(item) - getPaid(item);

// Proforma rows carry piNumber (the API also mirrors it into invoiceNo), sales carry invoiceNo
const getInvoiceNo = (item: any): string => item.piNumber || item.invoiceNo || '';

const getCustomerPhone = (item: any): string =>
  [item.customer?.phone1, item.customer?.phone2].filter(Boolean).join(' / ');

const formatETB = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount);

export const getCombinedColumns = (router: any): ColumnDef<any>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type || (isProformaInvoice(row.original) ? 'PROFORMA' : 'SALE');
      return (
        <Badge variant={type === 'PROFORMA' ? 'outline' : 'default'}>
          {type === 'PROFORMA' ? (
            <FileText className='mr-1 h-3 w-3' />
          ) : (
            <ShoppingCart className='mr-1 h-3 w-3' />
          )}
          {type}
        </Badge>
      );
    }
  },
  {
    id: 'invoiceNo',
    accessorFn: (row) => getInvoiceNo(row),
    header: 'Invoice No',
    cell: ({ row }) => <div className='font-medium'>{getInvoiceNo(row.original) || '-'}</div>
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.createdAt
        ? new Date(row.original.createdAt)
        : null;
      return <div>{date ? date.toLocaleDateString('en-GB') : '-'}</div>;
    }
  },
  {
    id: 'customer',
    accessorFn: (row) => row.customer?.name || '',
    header: 'Customer',
    cell: ({ row }) => {
      const phone = getCustomerPhone(row.original);
      return (
        <div>
          <div>{row.original.customer?.name || '-'}</div>
          {phone && (
            <div className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
              <Phone className='h-3 w-3' />
              {phone}
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'total',
    accessorFn: (row) => getTotal(row),
    header: ({ column }) => (
      <Button
        variant='ghost'
        className='ml-auto flex'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Total Amount
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='text-right font-medium'>{formatETB(getTotal(row.original))}</div>
    )
  },
  {
    id: 'totalPaid',
    accessorFn: (row) => getPaid(row),
    header: ({ column }) => (
      <Button
        variant='ghost'
        className='ml-auto flex'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Total Paid
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='text-right font-medium text-green-700 dark:text-green-400'>
        {formatETB(getPaid(row.original))}
      </div>
    )
  },
  {
    id: 'balance',
    accessorFn: (row) => getBalance(row),
    header: ({ column }) => (
      <Button
        variant='ghost'
        className='ml-auto flex'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Balance
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const balance = getBalance(row.original);
      return (
        <div
          className={`text-right font-medium ${
            balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
          }`}
        >
          {formatETB(balance)}
        </div>
      );
    }
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment Status',
    cell: ({ row }) => {
      const status = row.original.paymentStatus as SellPaymentStatus;
      const getStatusVariant = (status: SellPaymentStatus) => {
        switch (status) {
          case SellPaymentStatus.PAID:
            return 'default';
          case SellPaymentStatus.PARTIAL:
            return 'secondary';
          case SellPaymentStatus.PENDING:
            return 'outline';
          case SellPaymentStatus.CANCELLED:
            return 'destructive';
          default:
            return 'outline';
        }
      };

      return (
        <Badge variant={getStatusVariant(status)}>
          {status?.replace(/_/g, ' ') || 'PENDING'}
        </Badge>
      );
    }
  },
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => {
    let status = '';
    if (isProformaInvoice(row.original)) {
      status = row.original.status;
      const getProformaStatusVariant = (status: PIStatus) => {
        switch (status) {
          case PIStatus.APPROVED_CLIENT:
          case PIStatus.APPROVED_CREATE_PROJECT:
          case PIStatus.APPROVED_ST:
            return 'default';
          case PIStatus.SENT_TO_CLIENT:
            return 'secondary';
          case PIStatus.PENDING_ST:
            return 'outline';
          case PIStatus.REVISION:
            return 'secondary';
          case PIStatus.CANCELLED:
            return 'destructive';
          default:
            return 'outline';
        }
      };
      return (
        <Badge variant={getProformaStatusVariant(status as PIStatus)}>
          {status?.replace(/_/g, ' ') || '-'}
        </Badge>
      );
    } else {
      status = row.original.status;
      const getSaleStatusVariant = (status: SaleStatus) => {
        switch (status) {
          case SaleStatus.DELIVERED:
            return 'default';
          case SaleStatus.APPROVED:
            return 'secondary';
          case SaleStatus.PARTIALLY_DELIVERED:
            return 'secondary';
          case SaleStatus.NOT_APPROVED:
            return 'outline';
          case SaleStatus.CANCELLED:
            return 'destructive';
          default:
            return 'outline';
        }
      };
      return (
        <Badge variant={getSaleStatusVariant(status as SaleStatus)}>
          {status?.replace(/_/g, ' ') || '-'}
        </Badge>
      );
    }
  }
},
  {
    id: 'createdBy',
    accessorFn: (row) =>
      (isProformaInvoice(row) ? row.preparedBy?.name : row.createdBy?.name) || '',
    header: 'Created By',
    cell: ({ row }) => {
      const createdBy = isProformaInvoice(row.original)
        ? row.original.preparedBy
        : row.original.createdBy;
      return <div>{createdBy?.name || '-'}</div>;
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {isSale(item) && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/Sell/view?id=${item.id}`)
                  }
                >
                  <Eye className='mr-2 h-4 w-4' />
                  View Sale
                </DropdownMenuItem>

              </>
            )}
          {  isProformaInvoice(item) && (
              <>

                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/ProformaInvoice/view?id=${item.id}`)
                  }
                >
                  View PI
                </DropdownMenuItem>
              </>
            )}

          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

// Filters the server query uses - only changed by "Apply Filters" / "Clear Filters"
interface IAppliedFilters {
  type: 'proforma' | 'sale' | 'all';
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  seller: string;
  customer: string;
  searchTerm: string;
}

const EMPTY_FILTERS: IAppliedFilters = {
  type: 'all',
  startDate: '',
  endDate: '',
  status: 'all',
  paymentStatus: 'all',
  seller: 'all',
  customer: 'all',
  searchTerm: ''
};

const buildQuery = (f: IAppliedFilters, page: number, limit: number) => {
  const filters: any = { type: f.type, page, limit };
  if (f.startDate) filters.startDate = f.startDate;
  if (f.endDate) filters.endDate = f.endDate;
  if (f.status !== 'all') filters.status = f.status;
  if (f.paymentStatus !== 'all') filters.paymentStatus = f.paymentStatus;
  if (f.seller !== 'all') filters.createdById = f.seller;
  if (f.customer !== 'all') filters.customerId = f.customer;
  if (f.searchTerm.trim()) filters.searchTerm = f.searchTerm.trim();
  return filters;
};

export function ProformaSalesDataTable() {
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [summary, setSummary] = useState<IProformaSalesResponse['summary'] | null>(null);

  // Filter form states (what the user is editing)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filters actually sent to the server
  const [appliedFilters, setAppliedFilters] = useState<IAppliedFilters>(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 20;

  // Table type filter (on the loaded page)
  const [tableTypeFilter, setTableTypeFilter] = useState<'all' | 'PROFORMA' | 'SALE'>('all');

  // Commission calculation states
  const [commissionPercent, setCommissionPercent] = useState<number>(2);
  const [commissionResult, setCommissionResult] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Dropdown data
  const [sellers, setSellers] = useState<IEmployee[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);

  const columns = React.useMemo(() => getCombinedColumns(router), [router]);

  const filteredData = React.useMemo(() => {
    if (tableTypeFilter === 'PROFORMA') return data.filter((item) => isProformaInvoice(item));
    if (tableTypeFilter === 'SALE') return data.filter((item) => isSale(item));
    return data;
  }, [data, tableTypeFilter]);

  // Load dropdown data once
  useEffect(() => {
    Promise.all([getAllEmploy(), getCustomer()])
      .then(([employeesData, customersData]) => {
        setSellers(employeesData || []);
        setCustomers(customersData || []);
      })
      .catch((error) => {
        console.error('Error fetching dropdown data:', error);
        toast.error('Failed to load sellers and customers');
      });
  }, []);

  // Fetch whenever the applied filters or the page change
  useEffect(() => {
    let cancelled = false;
    const fetchCombinedData = async () => {
      try {
        setLoading(true);
        const response: IProformaSalesResponse = await getAllProformaInvoicesAndSales(
          buildQuery(appliedFilters, currentPage, itemsPerPage)
        );
        if (cancelled) return;
        if ((response as any).success === false) {
          toast.error((response as any).error || 'Failed to fetch data');
        }
        setData(response.data || []);
        setSummary(response.summary);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.totalItems || 0);
        setRowSelection({});
      } catch (error) {
        console.error('Error fetching combined data:', error);
        if (!cancelled) {
          toast.error('Failed to fetch data');
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCombinedData();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, currentPage]);

  // Apply filters
  const applyFilters = () => {
    setAppliedFilters({
      type: selectedType as IAppliedFilters['type'],
      startDate,
      endDate,
      status: selectedStatus,
      paymentStatus: selectedPaymentStatus,
      seller: selectedSeller,
      customer: selectedCustomer,
      searchTerm
    });
    setCurrentPage(1);
    setTableTypeFilter('all');
    setCommissionResult(0);
    setTotalAmount(0);
  };

  // Clear all filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    setSelectedSeller('all');
    setSelectedCustomer('all');
    setSearchTerm('');
    setCommissionPercent(2);
    setCommissionResult(0);
    setTotalAmount(0);
    setTableTypeFilter('all');
    setAppliedFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  // Commission on the total of ALL records of the applied seller (every page)
  const calculateCommission = useCallback(() => {
    if (!selectedSeller || selectedSeller === 'all') {
      toast.info('Please select a seller to calculate commission');
      return;
    }
    if (appliedFilters.seller !== selectedSeller) {
      toast.info('Click "Apply Filters" first so the list shows this seller');
      return;
    }
    const total = Number(summary?.totalAmount) || 0;
    if (total === 0) {
      toast.warning('No documents found for the selected seller');
      setTotalAmount(0);
      setCommissionResult(0);
      return;
    }
    const commission = (total * commissionPercent) / 100;
    setTotalAmount(total);
    setCommissionResult(commission);
    toast.success(`Commission calculated: ${formatETB(commission)}`);
  }, [selectedSeller, appliedFilters.seller, summary, commissionPercent]);

  // Export ALL records that match the applied filters (not only the current page)
  const exportToExcel = async () => {
    try {
      setExporting(true);
      const response = await getAllProformaInvoicesAndSales(
        buildQuery(appliedFilters, 1, Math.max(totalItems, 1))
      );
      let rows: any[] = response.data || [];
      if (tableTypeFilter === 'PROFORMA') rows = rows.filter((item) => isProformaInvoice(item));
      if (tableTypeFilter === 'SALE') rows = rows.filter((item) => isSale(item));

      if (rows.length === 0) {
        toast.warning('No records to export');
        return;
      }

      const exportData = rows.map((item) => ({
        'Type': isProformaInvoice(item) ? 'PROFORMA' : 'SALE',
        'Invoice No': getInvoiceNo(item) || '-',
        'Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-',
        'Customer': item.customer?.name || '-',
        'Customer Phone': getCustomerPhone(item) || '-',
        'Total Amount': getTotal(item),
        'Total Paid': getPaid(item),
        'Balance': getBalance(item),
        'Payment Status': item.paymentStatus?.replace(/_/g, ' ') || '-',
        'Status': item.status?.replace(/_/g, ' ') || '-',
        'Created By':
          (isProformaInvoice(item) ? item.preparedBy?.name : item.createdBy?.name) || '-'
      }));

      // Totals row
      exportData.push({
        'Type': 'TOTAL',
        'Invoice No': '',
        'Date': '',
        'Customer': '',
        'Customer Phone': '',
        'Total Amount': rows.reduce((sum, item) => sum + getTotal(item), 0),
        'Total Paid': rows.reduce((sum, item) => sum + getPaid(item), 0),
        'Balance': rows.reduce((sum, item) => sum + getBalance(item), 0),
        'Payment Status': '',
        'Status': '',
        'Created By': ''
      });

      const worksheet = utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 24 }, { wch: 22 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 18 }
      ];
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Proforma & Sales Data');
      writeFile(workbook, `proforma-sales-data-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${rows.length} records`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection
    }
  });

  // Totals of the rows shown on this page
  const pageTotals = React.useMemo(
    () =>
      filteredData.reduce(
        (acc, item) => ({
          total: acc.total + getTotal(item),
          paid: acc.paid + getPaid(item),
          balance: acc.balance + getBalance(item)
        }),
        { total: 0, paid: 0, balance: 0 }
      ),
    [filteredData]
  );

  // Get counts for filter buttons using the fixed type guards
  const proformaCount = data.filter(item => isProformaInvoice(item)).length;
  const saleCount = data.filter(item => isSale(item)).length;

  return (
    <div className='w-full space-y-4'>
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <CardTitle>Filters & Search</CardTitle>
              <CardDescription>
                Filter proforma invoices and sales by various criteria
              </CardDescription>
            </div>

            {/* Summary - totals of all filtered records */}
            {summary && (
              <div className='grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3'>
                <div>
                  <p className='text-muted-foreground'>Total Amount</p>
                  <p className='font-semibold'>{formatETB(Number(summary.totalAmount) || 0)}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Total Paid</p>
                  <p className='font-semibold text-green-700 dark:text-green-400'>
                    {formatETB(Number(summary.totalPaid) || 0)}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Balance</p>
                  <p className='font-semibold text-red-600 dark:text-red-400'>
                    {formatETB(Number(summary.totalBalance) || 0)}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Proforma</p>
                  <p className='font-semibold'>{summary.proformaCount}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Sales</p>
                  <p className='font-semibold'>{summary.salesCount}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Total</p>
                  <p className='text-lg font-bold text-blue-700 dark:text-blue-400'>{summary.totalCount}</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <Label htmlFor='type'>Document Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder='Select Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='proforma'>Proforma Invoices</SelectItem>
                  <SelectItem value='sale'>Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='start-date'>Start Date</Label>
              <Input
                id='start-date'
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='end-date'>End Date</Label>
              <Input
                id='end-date'
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
              <Input
                id='search'
                placeholder='Invoice no, customer or phone...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyFilters();
                }}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='payment-status'>Payment Status</Label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder='Payment Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='PARTIAL'>Partial</SelectItem>
                  <SelectItem value='PAID'>Paid</SelectItem>
                  <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Document Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='PENDING_ST'>Proforma: Pending</SelectItem>
                  <SelectItem value='APPROVED_ST'>Proforma: Approved</SelectItem>
                  <SelectItem value='SENT_TO_CLIENT'>Proforma: Sent to Client</SelectItem>
                  <SelectItem value='REVISION'>Proforma: Revision</SelectItem>
                  <SelectItem value='APPROVED_CLIENT'>Proforma: Client Approved</SelectItem>
                  <SelectItem value='APPROVED_CREATE_PROJECT'>Proforma: Approved create project</SelectItem>
                  <SelectItem value='NOT_APPROVED'>Sale: Not Approved</SelectItem>
                  <SelectItem value='APPROVED'>Sale: Approved</SelectItem>
                  <SelectItem value='PARTIALLY_DELIVERED'>Sale: Partially Delivered</SelectItem>
                  <SelectItem value='DELIVERED'>Sale: Delivered</SelectItem>
                  <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='seller'>Created By</Label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger>
                  <SelectValue placeholder='Select User' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Users</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name || seller.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='customer'>Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder='Select Customer' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Commission Calculator Section with Calculate Button */}
          <div className='flex flex-wrap items-center justify-between gap-4 rounded-lg p-4'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Label htmlFor='commission' className='font-semibold'>
                  Commission %
                </Label>
                <Input
                  id='commission'
                  type='number'
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  className='w-24'
                  min='0'
                  max='100'
                  step='0.5'
                />
              </div>
              <Button
                onClick={calculateCommission}
                disabled={!selectedSeller || selectedSeller === 'all' || loading}
                className='bg-green-600 hover:bg-green-700'
              >
                <Calculator className='mr-2 h-4 w-4' />
                Calculate Commission
              </Button>
            </div>

            {/* Commission Result Badge */}
            {commissionResult > 0 && (
              <div className='flex items-center gap-3'>
                <div className='text-sm text-muted-foreground'>
                  Total Amount: {formatETB(totalAmount)}
                </div>
                <Badge variant='secondary' className='px-3 py-1 text-sm'>
                  Commission: {formatETB(commissionResult)}
                </Badge>
              </div>
            )}
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button onClick={applyFilters} disabled={loading}>
              <Filter className='mr-2 h-4 w-4' />
              Apply Filters
            </Button>
            <Button variant='outline' onClick={clearFilters}>
              <X className='mr-2 h-4 w-4' />
              Clear Filters
            </Button>
            <Button
              variant='outline'
              onClick={exportToExcel}
              disabled={exporting || loading || totalItems === 0}
            >
              {exporting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Download className='mr-2 h-4 w-4' />
              )}
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Proforma Invoices & Sales</CardTitle>
              <CardDescription>
                View and manage all proforma invoices and sales in one place
              </CardDescription>
            </div>
            <div className='text-sm text-muted-foreground'>
              Showing {filteredData.length} of {totalItems} records
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Type Filter Buttons */}
          <div className='mb-4 flex items-center gap-2 border-b pb-2'>
            <Button
              variant={tableTypeFilter === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setTableTypeFilter('all')}
              className='gap-2'
            >
              <FileSpreadsheet className='h-4 w-4' />
              All ({data.length})
            </Button>
            <Button
              variant={tableTypeFilter === 'PROFORMA' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setTableTypeFilter('PROFORMA')}
              className='gap-2'
            >
              <FileText className='h-4 w-4' />
              Proforma ({proformaCount})
            </Button>
            <Button
              variant={tableTypeFilter === 'SALE' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setTableTypeFilter('SALE')}
              className='gap-2'
            >
              <ShoppingCart className='h-4 w-4' />
              Sales ({saleCount})
            </Button>
          </div>

          <div className='flex items-center py-4'>
            <Input
              placeholder='Quick filter by invoice, customer or phone...'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === '') {
                  setAppliedFilters((prev) => ({ ...prev, searchTerm: '' }));
                  setCurrentPage(1);
                }
              }}
              className='max-w-sm'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters();
                }
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='ml-auto'>
                  Columns <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className='capitalize'
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  <>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {/* Page totals row */}
                    <TableRow className='bg-muted/50 font-semibold'>
                      {table.getVisibleLeafColumns().map((column) => (
                        <TableCell key={column.id} className='text-right'>
                          {column.id === 'type' && <span className='float-left'>Page total</span>}
                          {column.id === 'total' && formatETB(pageTotals.total)}
                          {column.id === 'totalPaid' && formatETB(pageTotals.paid)}
                          {column.id === 'balance' && formatETB(pageTotals.balance)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between space-x-2 py-4'>
              <div className='text-sm text-muted-foreground'>
                Page {currentPage} of {totalPages}
              </div>
              <div className='space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
