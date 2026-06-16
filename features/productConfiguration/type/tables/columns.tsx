'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';

import { IProductType } from '@/models/productConfiguration';
import { ProductTypeCellAction } from './cell-action';

export const productTypeColumns: ColumnDef<IProductType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Product Type Name' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IProductType['name']>()}</div>
    ),
    enableColumnFilter: true
  },

  // ✅ CATEGORY COLUMN
  {
    accessorKey: 'size.category.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.size?.category?.name || '-'}
      </div>
    ),
    enableColumnFilter: true
  },

  // ✅ SIZE COLUMN
  {
    accessorKey: 'size.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Size' />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.size?.name || '-'}
      </div>
    ),
    enableColumnFilter: true
  },

  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IProductType['createdAt']>();
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
    cell: ({ row }) => (
      <ProductTypeCellAction data={row.original} />
    )
  }
];