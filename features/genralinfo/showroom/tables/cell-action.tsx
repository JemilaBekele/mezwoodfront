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

import { deleteShowroom } from '@/service/showroom';
import { IShowroom } from '@/models/showroom';

import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { Edit } from 'lucide-react';
import ShowroomForm from '../form';

interface CellActionProps {
  data: IShowroom;
}

export const ShowroomCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Showroom ID is missing. Cannot delete showroom.');
      return;
    }

    setLoading(true);
    try {
      await deleteShowroom(data.id);
      toast.success('Showroom deleted successfully');
      router.refresh();
      setOpen(false);
    } catch (error) {
      toast.error('Error deleting showroom. Please try again.');
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
        title="Edit Showroom"
        description="Update the showroom details below."
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <ShowroomForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <PermissionGuard requiredPermission={PERMISSIONS.SHOWROOM.UPDATE.name}>
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <Edit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard requiredPermission={PERMISSIONS.SHOWROOM.DELETE.name}>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <IconTrash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};