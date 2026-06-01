'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { ISupplier } from '@/models/supplier';
import { SupplierCellAction } from './cell-action';

export const supplierColumns: ColumnDef<ISupplier>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Company Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISupplier['name']>()}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'contactName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Contact Name' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISupplier['contactName']>() ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISupplier['phone']>() ?? '-'}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISupplier['email']>() ?? '-'}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'country',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Country' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISupplier['country']>() ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'tinNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='TIN Number' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISupplier['tinNumber']>() ?? '-'}</div>
    ),
    enableColumnFilter: false
  },
  {
    accessorKey: 'notes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Notes' />
    ),
    cell: ({ cell }) => (
      <div className='max-w-50 truncate'>
        {cell.getValue<ISupplier['notes']>() ?? '-'}
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
      const date = cell.getValue<ISupplier['createdAt']>();
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
    cell: ({ row }) => <SupplierCellAction data={row.original} />
  }
];
