'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IStore } from '@/models/store';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { StoreCellAction } from './cell-action';

export const storeColumns: ColumnDef<IStore>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.original.name}</div>,
    enableColumnFilter: true
  },

  {
    accessorKey: 'isMain',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Main Store" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.isMain ? 'Yes' : 'No'}
      </div>
    ),
    enableColumnFilter: true
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <StoreCellAction data={row.original} />
  }
];