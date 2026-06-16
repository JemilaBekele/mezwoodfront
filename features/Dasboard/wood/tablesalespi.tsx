/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
  FileSpreadsheet
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
    accessorKey: 'invoiceNo',
    header: 'Invoice No',
    cell: ({ row }) => {
      const invoiceNo = isProformaInvoice(row.original) 
        ? row.original.piNumber 
        : row.original.invoiceNo;
      return <div className='font-medium'>{invoiceNo || '-'}</div>;
    }
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
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const customer = row.original.customer;
      return <div>{customer?.name || '-'}</div>;
    }
  },
  {
    accessorKey: 'total',
    header: () => <div className='text-right'>Total Amount</div>,
    cell: ({ row }) => {
      let amount = 0;
      if (isProformaInvoice(row.original)) {
        amount = row.original.total || 0;
      } else {
        amount = row.original.grandTotal || 0;
      }
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(amount);
      return <div className='text-right font-medium'>{formatted}</div>;
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
    accessorKey: 'preparedBy',
    header: 'Created By',
    cell: ({ row }) => {
      let createdBy = null;
      if (isProformaInvoice(row.original)) {
        createdBy = row.original.preparedBy;
      } else {
        createdBy = row.original.createdBy;
      }
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

export function ProformaSalesDataTable() {
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [summary, setSummary] = useState<any>(null);

  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 20;

  // Table filter states
  const [tableTypeFilter, setTableTypeFilter] = useState<'all' | 'PROFORMA' | 'SALE'>('all');
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Commission calculation states
  const [commissionPercent, setCommissionPercent] = useState<number>(2);
  const [commissionResult, setCommissionResult] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Dropdown data
  const [sellers, setSellers] = useState<IEmployee[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);

  const columns = getCombinedColumns(router);

  // Apply table type filter to data
  useEffect(() => {
    if (tableTypeFilter === 'all') {
      setFilteredData(data);
    } else if (tableTypeFilter === 'PROFORMA') {
      const filtered = data.filter(item => isProformaInvoice(item));
      setFilteredData(filtered);
    } else {
      const filtered = data.filter(item => isSale(item));
      setFilteredData(filtered);
    }
  }, [data, tableTypeFilter]);

  // Calculate total amount and commission for both Proforma and Sales
  const calculateCommission = useCallback(() => {
    if (!selectedSeller || selectedSeller === 'all') {
      toast.info('Please select a seller to calculate commission');
      setCommissionResult(0);
      setTotalAmount(0);
      return;
    }

    setIsCalculating(true);

    // Filter data by selected seller (use filteredData based on table filter)
    const filteredDataBySeller = filteredData.filter((item) => {
      if (isProformaInvoice(item)) {
        // For Proforma invoices, check preparedBy
        return item.preparedBy?.id === selectedSeller;
      } else if (isSale(item)) {
        // For Sales, check createdBy
        return item.createdBy?.id === selectedSeller;
      }
      return false;
    });

    if (filteredDataBySeller.length === 0) {
      toast.warning(`No documents found for the selected seller`);
      setTotalAmount(0);
      setCommissionResult(0);
      setIsCalculating(false);
      return;
    }

    // Calculate total amount from both Proforma and Sales
    const total = filteredDataBySeller.reduce((sum, item) => {
      let amount = 0;
      if (isProformaInvoice(item)) {
        amount = item.total || 0;
      } else if (isSale(item)) {
        amount = item.grandTotal || 0;
      }
      return sum + amount;
    }, 0);

    setTotalAmount(total);
    
    // Calculate commission
    const commission = (total * commissionPercent) / 100;
    setCommissionResult(commission);
    
    setIsCalculating(false);
    
    // Show success message
    toast.success(`Commission calculated: ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB'
    }).format(commission)}`);
    
  }, [filteredData, selectedSeller, commissionPercent]);

  // Define fetchCombinedData with proper dependencies
  const fetchCombinedData = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {
        type: selectedType as 'proforma' | 'sale' | 'all',
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (selectedStatus && selectedStatus !== 'all') filters.status = selectedStatus;
      if (selectedPaymentStatus && selectedPaymentStatus !== 'all') filters.paymentStatus = selectedPaymentStatus;
      if (selectedSeller && selectedSeller !== 'all') filters.createdById = selectedSeller;
      if (selectedCustomer && selectedCustomer !== 'all') filters.customerId = selectedCustomer;
      if (searchTerm) filters.searchTerm = searchTerm;

      const response: IProformaSalesResponse = await getAllProformaInvoicesAndSales(filters);
      
      setData(response.data);
      setSummary(response.summary);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
      
      // Reset commission when new data is loaded
      setCommissionResult(0);
      setTotalAmount(0);
      setTableTypeFilter('all'); // Reset table filter when new data loads
    } catch (error) {
      console.error('Error fetching combined data:', error);
      toast.error('Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType, currentPage, startDate, endDate, selectedStatus, selectedPaymentStatus, selectedSeller, selectedCustomer, searchTerm]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [employeesData, customersData] = await Promise.all([
          getAllEmploy(),
          getCustomer()
        ]);

        setSellers(employeesData || []);
        setCustomers(customersData || []);
        
        // Fetch initial combined data
        await fetchCombinedData();
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchCombinedData]);

  // Apply filters
  const applyFilters = async () => {
    setCurrentPage(1);
    await fetchCombinedData();
  };

  // Clear all filters
  const clearFilters = async () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    setSelectedSeller('all');
    setSelectedCustomer('all');
    setSearchTerm('');
    setCurrentPage(1);
    setCommissionPercent(2);
    setCommissionResult(0);
    setTotalAmount(0);
    setTableTypeFilter('all');
    
    setTimeout(async () => {
      await fetchCombinedData();
    }, 100);
  };

  // Handle page change
  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await fetchCombinedData();
  };

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredData;
    
    const exportData = dataToExport.map((item) => {
      const isProforma = isProformaInvoice(item);
      return {
        'Type': isProforma ? 'PROFORMA' : 'SALE',
        'Invoice No': isProforma ? (item as IProformaInvoice).piNumber : (item as ISell).invoiceNo,
        'Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-',
        'Customer': item.customer?.name || '-',
        'Total Amount': isProforma ? (item as IProformaInvoice).total : (item as ISell).grandTotal,
        'Payment Status': item.paymentStatus?.replace(/_/g, ' ') || '-',
        'Status': isProforma ? (item as IProformaInvoice).status : (item as ISell).saleStatus,
        'Created By': isProforma 
          ? (item as IProformaInvoice).preparedBy?.name 
          : (item as ISell).createdBy?.name || '-'
      };
    });

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Proforma & Sales Data');
    writeFile(workbook, `proforma-sales-data-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export completed successfully');
  };

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });
const totalAmountFromAllItems = React.useMemo(() => {
  return filteredData.reduce((sum, item) => {
    let amount = 0;
    if (isProformaInvoice(item)) {
      amount = item.total || 0;
    } else if (isSale(item)) {
      amount = item.grandTotal || 0;
    }
    return sum + amount;
  }, 0);
}, [filteredData]);
  // Get counts for filter buttons using the fixed type guards
  const proformaCount = data.filter(item => isProformaInvoice(item)).length;
  const saleCount = data.filter(item => isSale(item)).length;

  return (
    <div className='w-full space-y-4'>
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Filters & Search</CardTitle>
              <CardDescription>
                Filter proforma invoices and sales by various criteria
              </CardDescription>
            </div>
            
            {/* Summary and Commission Section */}
            <div className='flex items-center gap-6'>
              {/* Summary Section */}
             {summary && (
  <div className='flex items-center gap-4'>
    <div className='flex flex-col items-end'>
      <div className='text-sm font-medium text-gray-600'>
        Total Amount: {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'ETB'
        }).format(totalAmountFromAllItems)}  {/* ← Changed here */}
      </div>
      <div className='text-sm font-medium text-gray-600'>
        Proforma: {summary.proformaCount}
      </div>
      <div className='text-sm font-medium text-gray-600'>
        Sales: {summary.salesCount}
      </div>
      <div className='text-lg font-bold text-blue-700'>
        Total: {summary.totalCount}
      </div>
    </div>
  </div>
)}
              
         
            </div>
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
                placeholder='Search by invoice or customer...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  <SelectItem value='UNPAID'>Unpaid</SelectItem>
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
                  <SelectItem value='APPROVED_CREATE_PROJECT'>Proforma: Approved create project</SelectItem>
                  <SelectItem value='PENDING_ST'>Proforma: Pending</SelectItem>
                  <SelectItem value='APPROVED_ST'>Proforma: Approved</SelectItem>
                  <SelectItem value='SENT_TO_CLIENT'>Proforma: Sent to Client</SelectItem>
                  <SelectItem value='APPROVED_CLIENT'>Proforma: Client Approved</SelectItem>
                  <SelectItem value='NOT_APPROVED'>Sale: Not Approved</SelectItem>
                  <SelectItem value='APPROVED'>Sale: Approved</SelectItem>
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
          <div className='flex items-center justify-between gap-4 p-4  rounded-lg'>
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
                disabled={isCalculating || !selectedSeller || selectedSeller === 'all' || loading}
                className='bg-green-600 hover:bg-green-700'
              >
                <Calculator className='mr-2 h-4 w-4' />
                {isCalculating ? 'Calculating...' : 'Calculate Commission'}
              </Button>
            </div>
            
            {/* Commission Result Badge */}
            {commissionResult > 0 && (
              <div className='flex items-center gap-3'>
                <div className='text-sm text-gray-600'>
                  Total Amount: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ETB'
                  }).format(totalAmount)}
                </div>
                <Badge variant='secondary' className='text-sm px-3 py-1'>
                  Commission: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ETB'
                  }).format(commissionResult)}
                </Badge>
              </div>
            )}
          </div>

          <div className='flex gap-2'>
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
              disabled={data.length === 0}
            >
              <Download className='mr-2 h-4 w-4' />
              Export Excel
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
            <div className='text-sm text-gray-500'>
              Showing {filteredData.length} of {totalItems} records
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Type Filter Buttons */}
          <div className='flex items-center gap-2 mb-4 pb-2 border-b'>
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
              placeholder='Quick filter by invoice...'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === '') {
                  applyFilters();
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

          <div className='overflow-hidden rounded-md border'>
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      {loading ? 'Loading...' : 'No results found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between space-x-2 py-4'>
              <div className='text-muted-foreground text-sm'>
                Page {currentPage} of {totalPages}
              </div>
              <div className='space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(currentPage + 1)}
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