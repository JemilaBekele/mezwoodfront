/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { IconDotsVertical } from '@tabler/icons-react';
import { Eye, Pencil, Trash2, GanttChart } from 'lucide-react';

import { IProject } from '@/models/Projects';
import { deleteProject } from '@/service/Project';
import { ProjectScheduleModal } from './project-schedule-modal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

interface ProjectCellActionProps {
  data: IProject;
}

export const ProjectCellAction: React.FC<ProjectCellActionProps> = ({
  data,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Project ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await deleteProject(data.id);
      setDeleteOpen(false);
      router.refresh();
      toast.success('Project deleted successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Error deleting project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      <ProjectScheduleModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        projectId={data.id}
        onSuccess={() => router.refresh()}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-44'>
          <DropdownMenuLabel className='text-xs font-medium text-muted-foreground'>
            Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.VIEW.name}>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/Project/view?id=${data.id}`)}
              className='gap-2'
            >
              <Eye className='h-4 w-4 text-muted-foreground' />
              View Details
            </DropdownMenuItem>
          </PermissionGuard>

          {/* <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.UPDATE.name}>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/Project/${data.id}`)}
              className='gap-2'
            >
              <Pencil className='h-4 w-4 text-muted-foreground' />
              Edit
            </DropdownMenuItem>
          </PermissionGuard> */}

          <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.VIEW.name}>
            {data.stages && data.stages.length > 0 && (
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/Project/gantt?id=${data.id}`)}
                className='gap-2'
              >
                <GanttChart className='h-4 w-4 text-muted-foreground' />
                Gantt Chart
              </DropdownMenuItem>
            )}
          </PermissionGuard>

          <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.DELETE.name}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className='gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400'
            >
              <Trash2 className='h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
