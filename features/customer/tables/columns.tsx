'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { ICustomer } from '@/models/customer';
import { CustomerCellAction } from './cell-action';

export const customerColumns: ColumnDef<ICustomer>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ICustomer['name']>()}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'companyName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Company Name' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ICustomer['companyName']>() ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone1',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Primary Phone' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ICustomer['phone1']>() ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone2',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Secondary Phone' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ICustomer['phone2']>() ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'tinNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='TIN Number' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ICustomer['tinNumber']>() ?? '-'}</div>
    ),
    enableColumnFilter: false
  },
  {
    accessorKey: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Address' />
    ),
    cell: ({ cell }) => (
      <div className='max-w-50 truncate'>
        {cell.getValue<ICustomer['address']>() ?? '-'}
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
      const date = cell.getValue<ICustomer['createdAt']>();
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
    cell: ({ row }) => <CustomerCellAction data={row.original} />
  }
];
