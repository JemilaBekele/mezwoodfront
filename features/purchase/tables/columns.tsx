'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { PurchaseCellAction } from './cell-action';
import { IPurchase, PaymentStatus } from '@/models/purchase';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export const purchaseColumns: ColumnDef<IPurchase>[] = [
  {
    accessorKey: 'invoiceNo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Invoice No' />
    ),
    cell: ({ cell, row }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const router = useRouter();
    const invoiceNo = cell.getValue<IPurchase['invoiceNo']>();
    
    return (
      <div 
        className='font-medium cursor-pointer hover:text-primary hover:underline'
        onClick={() => router.push(`/dashboard/purchase/view?id=${row.original.id}`)}
      >
        {invoiceNo}
      </div>
    );
  },
    enableColumnFilter: true
  },
  {
    accessorKey: 'supplier',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Supplier' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IPurchase['supplier']>()?.name || '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'store',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Store' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IPurchase['store']>()?.name || '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'purchaseDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Purchase Date' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IPurchase['purchaseDate']>();
      return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>;
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Payment Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<PaymentStatus>();

      const statusColors: Record<PaymentStatus, string> = {
        APPROVED: 'bg-green-500 text-white',
        PENDING: 'bg-yellow-500 text-white',
        REJECTED: 'bg-blue-500 text-white'
      };

      return <Badge className={statusColors[status]}>{status}</Badge>;
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'grandTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Price' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>{cell.getValue<number>().toFixed(2)}</div>
    )
  },
  {
    accessorKey: 'totalProducts',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Product' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>{cell.getValue<number>()}</div>
    )
  },

  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <PurchaseCellAction data={row.original} />
  }
];
