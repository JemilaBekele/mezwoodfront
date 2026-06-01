'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { IStoreStock, StockStatus } from '@/models/store';

export const storeStockColumns: ColumnDef<IStoreStock>[] = [
  {
    accessorKey: 'store',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Store' />
    ),
    cell: ({ row }) => <div>{row.original.store?.name ?? '-'}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Product' />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.batch?.product?.name ??
          row.original.batch?.productId ??
          '-'}
      </div>
    )
  },


  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Quantity' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>
        {cell.getValue<IStoreStock['quantity']>()}
      </div>
    )
  },
  {
    accessorKey: 'unitOfMeasureId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title=' Unit' />
    ),
    cell: ({ row }) => <div>{row.original.unitOfMeasure?.name ?? '-'}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<StockStatus>();
      return (
        <div
          className={`font-medium ${
            status === 'Available'
              ? 'text-green-600'
              : status === 'Reserved'
                ? 'text-yellow-600'
                : status === 'Sold'
                  ? 'text-red-600'
                  : status === 'Damaged'
                    ? 'text-gray-500'
                    : 'text-blue-600'
          }`}
        >
          {status}
        </div>
      );
    }
  },

  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IStoreStock['createdAt']>();
      return (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false
  }
];
