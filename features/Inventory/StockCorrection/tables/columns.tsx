'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { StockCorrectionCellAction } from './cell-action';
import {
  IStockCorrection,
  StockCorrectionStatus
} from '@/models/StockCorrection';

export const stockCorrectionColumns: ColumnDef<IStockCorrection>[] = [
  {
    accessorKey: 'reference',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reference' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IStockCorrection['reference']>() ?? '-'}</div>
    ),
    enableColumnFilter: true
  },

  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reason' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IStockCorrection['reason']>()}</div>
    ),
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
              ? 'bg-green-100 text-green-700'
              : status === StockCorrectionStatus.REJECTED
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {status}
        </span>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'notes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Notes' />
    ),
    cell: ({ cell }) => (
      <div className='max-w-50 truncate'>
        {cell.getValue<IStockCorrection['notes']>() ?? '-'}
      </div>
    ),
    enableColumnFilter: false
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
    enableColumnFilter: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <StockCorrectionCellAction data={row.original} />
  }
];
