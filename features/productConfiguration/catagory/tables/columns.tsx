'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';

import { ProductCategoryCellAction } from './cell-action';
import { IProductCategory } from '@/models/productConfiguration';

export const productCategoryColumns: ColumnDef<IProductCategory>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Product Category Name' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IProductCategory['name']>()}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IProductCategory['createdAt']>();
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
      <ProductCategoryCellAction data={row.original} />
    )
  }
];