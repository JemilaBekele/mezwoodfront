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

import { deleteSize } from '@/service/productConfiguration';
import { ISize } from '@/models/productConfiguration';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash, IconEdit } from '@tabler/icons-react';
import SizeForm from '../form';

interface SizeCellActionProps {
  data: ISize;
}

export const SizeCellAction: React.FC<SizeCellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Size ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await deleteSize(data.id);
      toast.success('Size deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Error deleting size');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete Modal */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Edit Modal */}
      <Modal
        title='Edit Size'
        description='Update the size details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <SizeForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Dropdown */}
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
            requiredPermission={PERMISSIONS.SIZE.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.SIZE.DELETE.name}
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