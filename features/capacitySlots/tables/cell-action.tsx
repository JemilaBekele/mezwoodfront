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

import { ICapacityLot } from '@/models/CapacityLot';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { Edit } from 'lucide-react';
import CapacitySlotForm from '../form';
import { deleteCapacitySlot } from '@/service/CapacityLot';

interface CellActionProps {
  data: ICapacityLot;
}

export const CapacitySlotCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Capacity Slot ID is missing. Cannot delete slot.');
      return;
    }

    setLoading(true);
    try {
      await deleteCapacitySlot(data.id);
      toast.success('Capacity Slot deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch (error) {
      toast.error('Error deleting capacity slot. Please try again.');
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

      {/* Edit capacity slot modal */}
      <Modal
        title='Edit Capacity Slot'
        description='Update the capacity slot details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <CapacitySlotForm
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
            requiredPermission={PERMISSIONS.CAPACITY_SLOT.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <Edit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>
          <PermissionGuard
            requiredPermission={PERMISSIONS.CAPACITY_SLOT.DELETE.name}
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
