'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { SellCellAction } from './cell-action';
import { ISell, SaleStatus } from '@/models/Sell';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const getSaleStatusColor = (status: SaleStatus) => {
  switch (status) {
    case SaleStatus.APPROVED:
      return 'bg-blue-500 text-white';
    case SaleStatus.NOT_APPROVED:
      return 'bg-gray-500 text-white';
    case SaleStatus.PARTIALLY_DELIVERED:
      return 'bg-orange-500 text-white';
    case SaleStatus.DELIVERED:
      return 'bg-green-600 text-white';
    case SaleStatus.CANCELLED:
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

// Add payment status colors
const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-600 text-white';
    case 'PARTIAL':
      return 'bg-yellow-500 text-white';
    case 'PENDING':
      return 'bg-red-400 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};
export const sellColumns: ColumnDef<ISell>[] = [
  {
    accessorKey: 'saleDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order Date' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<ISell['saleDate']>();
      return (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false
  },
    {
     accessorKey: 'invoiceNo',
     header: ({ column }) => (
       <DataTableColumnHeader column={column} title='Order No' />
     ),
     cell: ({ cell, row }) => {
       // eslint-disable-next-line react-hooks/rules-of-hooks
       const router = useRouter();
       const invoiceNo = cell.getValue<ISell['invoiceNo']>();
       
       return (
         <div 
           className='cursor-pointer hover:text-primary hover:underline'
           onClick={() => router.push(`/dashboard/UserBasedSell/view?id=${row.original.id}`)}
         >
           {invoiceNo}
         </div>
       );
     },
     enableColumnFilter: true
   },
  {
    accessorKey: 'customer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISell['customer']>()?.name ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
     {
    accessorKey: 'createdBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Seller' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISell['createdBy']>()?.name ?? '-'}</div>
    ),
    enableColumnFilter: true
  },

  {
    accessorKey: 'totalProducts',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Products' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISell['totalProducts']>()}</div>,
    enableColumnFilter: false
  },
  {
    accessorKey: 'grandTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISell['grandTotal']>()}</div>,
    enableColumnFilter: false
  },
    {
    accessorKey: 'balance',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Balance' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISell['balance']>()}</div>,
    enableColumnFilter: false
  },

  {
    accessorKey: 'saleStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sale Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<SaleStatus>();
      return (
        <Badge className={`${getSaleStatusColor(status)}`}>{status}</Badge>
      );
    },
    enableColumnFilter: true
  },
    {
    accessorKey: 'paymentStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Payment Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      return (
        <Badge className={`${getPaymentStatusColor(status)} px-2 py-1`}>
          {status || 'PENDING'}
        </Badge>
      );
    },
    enableColumnFilter: true
  },
  {
    id: 'actions',
    cell: ({ row }) => <SellCellAction data={row.original} />
  }
];
