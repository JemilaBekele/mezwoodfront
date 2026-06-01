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

import { deleteBranch } from '@/service/branch';
import { IBranch } from '@/models/Branch';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { Edit } from 'lucide-react';
import BranchForm from '../form';

interface CellActionProps {
  data: IBranch;
}

export const BranchCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Branch ID is missing. Cannot delete branch.');
      return;
    }

    setLoading(true);
    try {
      await deleteBranch(data.id);
      toast.success('Branch deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch (error) {
      toast.error('Error deleting branch. Please try again.');
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

      {/* Edit branch modal */}
      <Modal
        title='Edit Branch'
        description='Update the branch details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <BranchForm
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
          <PermissionGuard requiredPermission={PERMISSIONS.BRANCH.UPDATE.name}>
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <Edit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>
          <PermissionGuard requiredPermission={PERMISSIONS.BRANCH.DELETE.name}>
            <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
