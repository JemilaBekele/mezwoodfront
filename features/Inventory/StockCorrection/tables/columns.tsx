'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Hash } from 'lucide-react';
import { StockCorrectionCellAction } from './cell-action';
import {
  IStockCorrection,
  StockCorrectionStatus
} from '@/models/StockCorrection';
import { useRouter } from 'next/navigation';

// Helper function to get reason display text
const getReasonText = (reason: string) => {
  switch (reason) {
    case 'PURCHASE_ERROR':
      return 'Purchase Error';
    case 'TRANSFER_ERROR':
      return 'Transfer Error';
    case 'EXPIRED':
      return 'Expired';
    case 'DAMAGED':
      return 'Damaged';
    case 'MANUAL_ADJUSTMENT':
      return 'Manual Adjustment';
    default:
      return reason;
  }
};

export const stockCorrectionColumns: ColumnDef<IStockCorrection>[] = [
 {
    accessorKey: 'shortCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Short Code' />
    ),
    cell: ({ cell, row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();
      const shortCode = cell.getValue<IStockCorrection['shortCode']>();
      
      return (
        <div 
          className='flex items-center gap-1 cursor-pointer hover:text-primary hover:underline'
          onClick={() => router.push(`/dashboard/StockCorrection/view?id=${row.original.id}`)}
        >
          <Hash className='h-3 w-3 text-gray-500' />
          <span className='font-medium'>{shortCode ?? '-'}</span>
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'reference',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reference' />
    ),
    cell: ({ cell }) => {
      const reference = cell.getValue<IStockCorrection['reference']>();
      return (
        <div className='max-w-32 truncate' title={reference || ''}>
          {reference || '-'}
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reason' />
    ),
    cell: ({ cell }) => {
      const reason = cell.getValue<IStockCorrection['reason']>();
      return (
        <div className='max-w-32 truncate' title={getReasonText(reason)}>
          {getReasonText(reason)}
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<IStockCorrection['status']>();
      return (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            status === StockCorrectionStatus.APPROVED
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              : status === StockCorrectionStatus.REJECTED
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
          }`}
        >
          {status}
        </span>
      );
    },
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'store',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Location' />
    ),
    cell: ({ row }) => {
      const store = row.original.store;
      const shop = row.original.shop;
      
      if (store) {
        return (
          <div className='max-w-32 truncate' title={`Store: ${store.name}`}>
            <span className='text-sm text-gray-600 dark:text-gray-400'>Store: </span>
            {store.name}
          </div>
        );
      } else if (shop) {
        return (
          <div className='max-w-32 truncate' title={`Shop: ${shop.name}`}>
            <span className='text-sm text-gray-600 dark:text-gray-400'>Shop: </span>
            {shop.name}
          </div>
        );
      }
      return <div className='text-gray-400'>-</div>;
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IStockCorrection['createdAt']>();
      return (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false,
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue('createdAt')).getTime();
      const dateB = new Date(rowB.getValue('createdAt')).getTime();
      return dateA - dateB;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <StockCorrectionCellAction data={row.original} />,
    enableColumnFilter: false,
    enableSorting: false
  }
];