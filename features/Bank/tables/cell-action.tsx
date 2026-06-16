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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { AlertModal } from '@/components/modal/alert-modal';

import { IBank } from '@/models/bank';
import { deleteBank } from '@/service/bank';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { Edit } from 'lucide-react';
import BankForm from '../form';

interface CellActionProps {
  data: IBank;
}

export const BankCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Bank ID is missing. Cannot delete.');
      return;
    }

    setLoading(true);
    try {
      await deleteBank(data.id);
      toast.success('Bank deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error deleting bank.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete confirmation */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Edit bank modal */}
      <Modal
        title="Edit Bank"
        description="Update bank details below."
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <BankForm
          initialData={data}
          isEdit
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Actions */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
  <PermissionGuard
            requiredPermission={PERMISSIONS.BANK.UPDATE.name}
          >
          <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Update
          </DropdownMenuItem></PermissionGuard>
  <PermissionGuard
            requiredPermission={PERMISSIONS.BANK.DELETE.name}
          >
          <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem></PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
