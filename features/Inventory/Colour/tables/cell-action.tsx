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
import ColourForm from '../form'; // Make sure you have a ColourForm component
import { IColour } from '@/models/Category';
import { deleteColour } from '@/service/Category';

interface ColourCellActionProps {
  data: IColour;
}

export const ColourCellAction: React.FC<ColourCellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Colour ID is missing. Cannot delete colour.');
      return;
    }

    setLoading(true);
    try {
      await deleteColour(data.id);
      toast.success('Colour deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Error deleting colour. Please try again.');
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

      {/* Edit colour modal */}
      <Modal
        title='Edit Colour'
        description='Update the colour details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <ColourForm
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
            requiredPermission={PERMISSIONS.COLOUR.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.COLOUR.DELETE.name}
          >
            <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
          {/* </PermissionGuard> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
