'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { BankCellAction } from './cell-action';
import { format } from 'date-fns';
import { IBank } from '@/models/bank';

export const bankColumns: ColumnDef<IBank>[] = [
  {
    accessorKey: 'bankName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bank Name" />
    ),
    cell: ({ row }) => <div>{row.original.bankName}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'accountNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account Number" />
    ),
    cell: ({ row }) => <div>{row.original.accountNumber}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div>{format(new Date(row.original.createdAt), 'yyyy-MM-dd')}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) => (
      <div>{format(new Date(row.original.updatedAt), 'yyyy-MM-dd')}</div>
    ),
    enableColumnFilter: true
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <BankCellAction data={row.original} />
  }
];
