/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Hash, Clock, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IProject, ProjectStatus, DifficultyLevel } from '@/models/Projects';
import { ProjectCellAction } from './cell-action';
import { useRouter } from 'next/navigation';

const statusVariantMap: Record<string, { label: string; className: string }> = {
  NOT_STARTED: {
    label: 'Not Started',
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
};

const difficultyVariantMap: Record<string, { label: string; className: string }> = {
  EASY: {
    label: 'Easy',
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  HARD: {
    label: 'Hard',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
};

export const projectColumns: ColumnDef<IProject>[] = [
  {
    accessorKey: 'invoice.piNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='PI Number' />
    ),
    cell: ({ cell, row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();
      const piNumber = cell.getValue<string>();

      return (
        <button
          className='inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 hover:underline underline-offset-4'
          onClick={() =>
            router.push(`/dashboard/Project/view?id=${row.original?.id}`)
          }
        >
          <Hash className='h-3.5 w-3.5 opacity-50' />
          {piNumber || '-'}
        </button>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'customer.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ cell }) => {
      const name = cell.getValue<string>();
      return (
        <div className='flex items-center gap-2'>
          <div className='flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground'>
            {name ? name.charAt(0) : '?'}
          </div>
          <span className='font-medium'>{name || '-'}</span>
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<ProjectStatus>();
      const variant = statusVariantMap[status] || {
        label: String(status).replace(/_/g, ' '),
        className: 'bg-muted text-muted-foreground border-border',
      };
      return (
        <Badge variant='outline' className={`text-[11px] font-medium capitalize ${variant.className}`}>
          {variant.label}
        </Badge>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'difficulty',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Difficulty' />
    ),
    cell: ({ cell }) => {
      const difficulty = cell.getValue<DifficultyLevel>();
      const key = String(difficulty).toUpperCase();
      const variant = difficultyVariantMap[key] || {
        label: String(difficulty || 'Easy'),
        className: 'bg-muted text-muted-foreground border-border',
      };
      return (
        <Badge variant='outline' className={`text-[11px] font-medium ${variant.className}`}>
          {variant.label}
        </Badge>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'requestedDelivery',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Requested' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date | null>();
      if (!date) return <span className='text-muted-foreground'>-</span>;
      const d = new Date(date);
      return (
        <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
          <CalendarDays className='h-3.5 w-3.5' />
          <span>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      );
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'totalDays',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Days' />
    ),
    cell: ({ cell }) => {
      const value = cell.getValue<number | null>();
      return (
        <div className='flex items-center gap-1.5 text-sm'>
          <Clock className='h-3.5 w-3.5 text-muted-foreground' />
          <span className='font-semibold tabular-nums'>{value ?? 0}</span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: 'totalProjectQuantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Qty' />
    ),
    cell: ({ cell }) => {
      const value = cell.getValue<number | null>();
      return (
        <div className='flex items-center gap-1.5 text-sm'>
          <BarChart3 className='h-3.5 w-3.5 text-muted-foreground' />
          <span className='font-semibold tabular-nums'>{value ?? 0}</span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date>();
      if (!date) return <span className='text-muted-foreground'>-</span>;
      const d = new Date(date);
      return (
        <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
          <CalendarDays className='h-3.5 w-3.5' />
          <span>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      );
    },
    enableColumnFilter: false
  },
  {
    id: 'actions',
    header: () => <span className='sr-only'>Actions</span>,
    cell: ({ row }) => <ProjectCellAction data={row.original} />
  }
];
