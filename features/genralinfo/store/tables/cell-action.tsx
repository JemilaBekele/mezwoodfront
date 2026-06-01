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

import { deleteStore } from '@/service/store';
import { IStore } from '@/models/store';

import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { Edit } from 'lucide-react';
import StoreForm from '../form'; // Ensure the path is correct

interface CellActionProps {
  data: IStore;
}

export const StoreCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Store ID is missing. Cannot delete store.');
      return;
    }

    setLoading(true);
    try {
      await deleteStore(data.id);
      toast.success('Store deleted successfully');
      router.refresh();
      setOpen(false);
    } catch  {
      toast.error('Error deleting store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <Modal
        title='Edit Store'
        description='Update the store details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <StoreForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <PermissionGuard requiredPermission={PERMISSIONS.STORE.UPDATE.name}>
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <Edit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>
          <PermissionGuard requiredPermission={PERMISSIONS.STORE.UPDATE.name}>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
