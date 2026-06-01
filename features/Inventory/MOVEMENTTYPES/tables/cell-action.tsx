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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { AlertModal } from '@/components/modal/alert-modal';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash, IconEdit } from '@tabler/icons-react';

import MovementTypeForm from '../form'; // Make sure you create this form
import { IMovementType } from '@/models/curtainType';
import { deleteMovementType } from '@/service/curtainType';

interface MovementTypeCellActionProps {
  data: IMovementType;
}

export const MovementTypeCellAction: React.FC<MovementTypeCellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Movement Type ID is missing. Cannot delete.');
      return;
    }

    setLoading(true);
    try {
      await deleteMovementType(data.id);
      toast.success('Movement Type deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Error deleting movement type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete confirmation modal */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Edit movement type modal */}
      <Modal
        title='Edit Movement Type'
        description='Update the movement type details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <MovementTypeForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Action dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <PermissionGuard
            requiredPermission={PERMISSIONS.MOVEMENT_TYPE.UPDATE.name}
          >
          <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
            <IconEdit className='mr-2 h-4 w-4' /> Update
          </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.MOVEMENT_TYPE.DELETE.name}
          >
          <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
            <IconTrash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
