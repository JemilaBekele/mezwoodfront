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

import CurtainOrderForm from '../form';
import { ICurtainOrder } from '@/models/curtainType';
import { deleteCurtainOrder } from '@/service/Curtain';

interface CurtainOrderCellActionProps {
  data: ICurtainOrder;
}

export const CurtainOrderCellAction: React.FC<CurtainOrderCellActionProps> = ({
  data
}) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Curtain Order ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await deleteCurtainOrder(data.id);
      toast.success('Curtain order deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch (error) {
      toast.error('Failed to delete curtain order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete Confirmation */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Edit Curtain Order */}
      <Modal
        title='Edit Curtain Order'
        description='Update curtain order details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <CurtainOrderForm
          initialData={data}
          isEdit
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Actions */}
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
            requiredPermission={PERMISSIONS.CURTAIN_ORDER.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='mr-2 h-4 w-4' />
              Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.VIEW.name}>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/CurtainOrder/view?id=${data.id}`)
              }
            >
              <IconEdit className='mr-2 h-4 w-4' /> View
            </DropdownMenuItem>
          </PermissionGuard>
          <PermissionGuard
            requiredPermission={PERMISSIONS.CURTAIN_ORDER.DELETE.name}
          >
            <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
              <IconTrash className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
