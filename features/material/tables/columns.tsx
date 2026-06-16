'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { MaterialCellAction } from './cell-action';
import { IMaterial } from '@/models/material';
import { Package } from 'lucide-react';

// Extended interface to include stock information
interface MaterialWithStock extends IMaterial {
  currentStock?: number;
}

export const materialColumns: ColumnDef<MaterialWithStock>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Material Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.name}
      </div>
    ),
    enableColumnFilter: true,
  },
  {
    accessorKey: 'materialType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.materialType?.name || '—'}
      </div>
    ),
    accessorFn: (row) => row.materialType?.name,
  },
  {
    accessorKey: 'color',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Color" />
    ),
    cell: ({ row }) => <div>{row.original.color || '—'}</div>,
  },
  {
    accessorKey: 'size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => <div>{row.original.size || '—'}</div>,
  },

  // 🧱 Material Types
{
  id: 'materialTypes',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Material Types" />
  ),
  cell: ({ row }) => {
    const { plainMDF, laminatedMDF, wood, metal, accessory, other } = row.original;

    const types = [];

    if (plainMDF) types.push('Plain MDF');
    if (laminatedMDF) types.push('Laminated MDF');
    if (wood) types.push('Wood');
    if (metal) types.push('Metal');
    if (accessory) types.push('Accessory'); // ✅ New
    if (other) types.push('Other'); // ✅ New

    return <div>{types.length ? types.join(', ') : '-'}</div>;
  },
},


  // 📦 Stock Value
  {
    id: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const stock = row.original.currentStock ?? 0;
      
      return (
        <div className="flex items-center gap-1.5">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {stock} 
          </span>
        </div>
      );
    },
    accessorFn: (row) => row.currentStock,
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <MaterialCellAction data={row.original} />,
  },
];