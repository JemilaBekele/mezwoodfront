'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { IExpense } from '@/models/Expense';
import { ExpenseCellAction } from './cell-action';

export const expenseColumns: ColumnDef<IExpense>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Expense Title' />
    ),
    cell: ({ cell }) => (
      <div className="font-medium">
        {cell.getValue<IExpense['title']>()}
      </div>
    ),
    enableColumnFilter: true
  },

  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    cell: ({ cell }) => {
      const amount = cell.getValue<IExpense['amount']>();
      return (
        <div className="flex items-center gap-1 text-sm font-medium">
          {amount ? amount.toLocaleString() : 0}
        </div>
      );
    },
    enableColumnFilter: false
  },

  {
    accessorKey: 'expenseDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Expense Date' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IExpense['expenseDate']>();
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
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: ({ cell }) => (
      <div className="text-sm text-muted-foreground">
        {cell.getValue<IExpense['description']>() || '-'}
      </div>
    ),
    enableColumnFilter: false
  },

  {
    accessorKey: 'createdBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created By' />
    ),
    cell: ({ cell }) => {
      const employee = cell.getValue<IExpense['createdBy']>();
      return (
        <div className="text-sm">
          {employee?.name || '-'}
        </div>
      );
    },
    enableColumnFilter: false
  },

  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IExpense['createdAt']>();
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
    cell: ({ row }) => <ExpenseCellAction data={row.original} />
  }
];