'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Phone, Truck, User } from 'lucide-react';

import { DeliveryEstimationCellAction } from './cell-action';
import { IDeliveryEstimation } from '@/models/delivery-estimation';

export const deliveryEstimationColumns: ColumnDef<IDeliveryEstimation>[] = [


  {
    accessorKey: 'customerName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ cell }) => (
      <div className='flex items-center gap-2 font-medium'>
        <User className='h-4 w-4 text-muted-foreground' />
        {cell.getValue<IDeliveryEstimation['customerName']>() || '-'}
      </div>
    ),
    enableColumnFilter: true,
  },

  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone' />
    ),
    cell: ({ cell }) => (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Phone className='h-4 w-4' />
        {cell.getValue<IDeliveryEstimation['phone']>() || '-'}
      </div>
    ),
    enableColumnFilter: true,
  },

  {
    accessorKey: 'difficulty',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Difficulty' />
    ),
    cell: ({ cell }) => (
      <span className='capitalize'>
        {cell.getValue<IDeliveryEstimation['difficulty']>()}
      </span>
    ),
    enableColumnFilter: true,
  },

  // {
  //   accessorKey: 'totalQuantity',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Quantity' />
  //   ),
  //   cell: ({ cell }) => (
  //     <div className='text-center font-medium'>
  //       {cell.getValue<IDeliveryEstimation['totalQuantity']>()}
  //     </div>
  //   ),
  //   enableColumnFilter: false,
  // },

  {
    accessorKey: 'estimatedDays',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Est. Days' />
    ),
    cell: ({ cell }) => (
      <div className='text-center'>
        {cell.getValue<IDeliveryEstimation['estimatedDays']>()}
      </div>
    ),
    enableColumnFilter: false,
  },

  {
    accessorKey: 'estimatedDelivery',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Delivery Date' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IDeliveryEstimation['estimatedDelivery']>();
      return (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <Truck className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false,
  },
  //   {
  //   accessorKey: 'holdUntil',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Hold Until' />
  //   ),
  //   cell: ({ cell }) => {
  //     const date = cell.getValue<IDeliveryEstimation['holdUntil']>();
  //     return (
  //       <div className='text-muted-foreground flex items-center gap-1 text-sm'>
  //         <Truck className='h-4 w-4' />
  //         {date ? new Date(date).toLocaleDateString() : '-'}
  //       </div>
  //     );
  //   },
  //   enableColumnFilter: false,
  // },



  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IDeliveryEstimation['createdAt']>();
      return (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false,
  },

  {
    id: 'actions',
    cell: ({ row }) => (
      <DeliveryEstimationCellAction data={row.original} />
    ),
  },
];
