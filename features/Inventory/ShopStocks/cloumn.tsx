'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Store, Layers, CalendarDays } from 'lucide-react';
import { IShopStock, StockStatus } from '@/models/store';

export const shopStockColumns: ColumnDef<IShopStock>[] = [
  {
    accessorKey: 'shopId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Shop' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-1'>
        <Store className='h-4 w-4' />
        {row.original.shop?.name ?? row.original.shopId ?? '-'}
      </div>
    ),
    enableColumnFilter: true
  },

  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Quantity' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>
        {cell.getValue<IShopStock['quantity']>()}
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
      const date = cell.getValue<IShopStock['createdAt']>();
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
