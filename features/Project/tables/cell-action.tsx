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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { IconDotsVertical } from '@tabler/icons-react';
import {
  Eye,
  Trash2,
  GanttChart,
  CalendarDays,
} from 'lucide-react';

import { IProject } from '@/models/Projects';
import {
  deleteProject,
  addNewRequestedDeliveryDate,
} from '@/service/Project';

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

  // Requested delivery date modal
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');

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

  const onAddRequestedDeliveryDate = async () => {
    if (!data?.id) {
      toast.error('Project ID is missing.');
      return;
    }

    if (!newDeliveryDate) {
      toast.error('Please select a requested delivery date.');
      return;
    }

    setLoading(true);

    try {
      const result = await addNewRequestedDeliveryDate(
        data.id,
        newDeliveryDate
      );

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.message || 'Requested delivery date added successfully'
      );

      setDeliveryDateOpen(false);
      setNewDeliveryDate('');

      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.message || 'Failed to add requested delivery date'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete Modal */}
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Project Schedule Modal */}
      <ProjectScheduleModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        projectId={data.id}
        onSuccess={() => router.refresh()}
      />

      {/* Requested Delivery Date Modal */}
      <Dialog
        open={deliveryDateOpen}
        onOpenChange={(open) => {
          if (!loading) {
            setDeliveryDateOpen(open);

            if (!open) {
              setNewDeliveryDate('');
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Requested Delivery Date</DialogTitle>

            <DialogDescription>
              Select the new requested delivery date for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newDeliveryDate">
                Delivery Date
              </Label>

              <Input
                id="newDeliveryDate"
                type="date"
                value={newDeliveryDate}
                onChange={(e) =>
                  setNewDeliveryDate(e.target.value)
                }
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeliveryDateOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={onAddRequestedDeliveryDate}
              disabled={loading || !newDeliveryDate}
            >
              {loading ? 'Saving...' : 'Save Date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actions Dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Actions
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* View */}
          <PermissionGuard
            requiredPermission={PERMISSIONS.PROJECT.VIEW.name}
          >
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/dashboard/Project/view?id=${data.id}`
                )
              }
              className="gap-2"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
              View Details
            </DropdownMenuItem>
          </PermissionGuard>

          {/* Gantt */}
          <PermissionGuard
            requiredPermission={PERMISSIONS.PROJECT.VIEW.name}
          >
            {data.stages && data.stages.length > 0 && (
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/dashboard/Project/gantt?id=${data.id}`
                  )
                }
                className="gap-2"
              >
                <GanttChart className="h-4 w-4 text-muted-foreground" />
                Gantt Chart
              </DropdownMenuItem>
            )}
          </PermissionGuard>

          {/* Requested Delivery Date */}
          <PermissionGuard
            requiredPermission={PERMISSIONS.PROJECT.VIEW.name}
          >
            <DropdownMenuItem
              onClick={() => setDeliveryDateOpen(true)}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Requested Delivery Date
            </DropdownMenuItem>
          </PermissionGuard>

          {/* Delete */}
          <PermissionGuard
            requiredPermission={PERMISSIONS.PROJECT.DELETE.name}
          >
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};