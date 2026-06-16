/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { AlertModal } from '@/components/modal/alert-modal';

import {
  IconDotsVertical,
  IconRefresh,
} from '@tabler/icons-react';

import { IProject, ProjectStatus } from '@/models/Projects';
import { updateProjectStatus } from '@/service/Project';

interface ProjectCellActionProps {
  data: IProject;
}

export const StatsProjectCellAction: React.FC<ProjectCellActionProps> = ({
  data,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<ProjectStatus | null>(null);

  /* ===============================
     CONFIRM STATUS CHANGE
  =============================== */
  const onConfirmStatusChange = async () => {
    if (!data?.id || !nextStatus) {
      toast.error('Invalid project status update.');
      return;
    }

    setLoading(true);
    try {
      await updateProjectStatus(data.id, nextStatus);
      toast.success(`Project status updated to ${nextStatus}`);
      router.refresh();
      setConfirmOpen(false);
      setNextStatus(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update project status');
    } finally {
      setLoading(false);
    }
  };

  const onAskConfirmation = (status: ProjectStatus) => {
    setNextStatus(status);
    setConfirmOpen(true);
  };

  return (
    <>
      {/* CONFIRMATION MODAL */}
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmStatusChange}
        loading={loading}
        title="Confirm Status Change"
        description={`Are you sure you want to change the project status to "${nextStatus}"?`}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuLabel>Status</DropdownMenuLabel>

          {/* STATUS ACTIONS */}
          {Object.values(ProjectStatus).map((status) =>
            status !== data.status ? (
              <DropdownMenuItem
                key={status}
                onClick={() => onAskConfirmation(status)}
              >
                <IconRefresh className="mr-2 h-4 w-4" />
                Mark as {status}
              </DropdownMenuItem>
            ) : null
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
