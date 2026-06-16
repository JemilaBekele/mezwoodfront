'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { ItemCellAction } from './cell-action';
import { format } from 'date-fns';
import { IItem } from '@/models/item';

export const itemColumns: ColumnDef<IItem>[] = [
  // 🧾 Name
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Item Name" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    enableColumnFilter: true,
  },

  // 🖼️ Image
  {
    accessorKey: 'imageUrl',
    header: 'Image',
    cell: ({ row }) =>
      row.original.imageUrl ? (
        <img
          src={row.original.imageUrl}
          alt={row.original.name}
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <span className="text-muted-foreground">No image</span>
      ),
  },

  // 🎨 Color
  {
    accessorKey: 'color',
    header: 'Color',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.color ? (
          <>
            <span
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: row.original.color }}
            />
            <span>{row.original.color}</span>
          </>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },

  // 📂 Category
  {
    accessorKey: 'category.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => (
      <div>{row.original.category?.name || '-'}</div>
    ),
    enableColumnFilter: true,
  },

  // 🧩 Type
  {
    accessorKey: 'type.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <div>{row.original.type?.name || '-'}</div>
    ),
    enableColumnFilter: true,
  },

  // 📏 Size
  {
    accessorKey: 'size.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => (
      <div>{row.original.size?.name || '-'}</div>
    ),
    enableColumnFilter: true,
  },

  // 💰 Price
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.original.price}</div>
    ),
  },

  // 📦 Stock
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const stock = row.original.stock || 0;

      return (
        <span
          className={`font-medium ${
            stock <= 0
              ? 'text-red-600'
              : stock < 10
              ? 'text-yellow-600'
              : 'text-green-600'
          }`}
        >
          {stock}
        </span>
      );
    },
  },

  // ⏰ Created At
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div>{format(new Date(row.original.createdAt), 'yyyy-MM-dd')}</div>
    ),
  },

  // ⚙️ Actions
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ItemCellAction data={row.original} />,
  },
];