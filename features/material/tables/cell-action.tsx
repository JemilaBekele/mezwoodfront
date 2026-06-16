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
import { AlertModal } from '@/components/modal/alert-modal';

import { IMaterial } from '@/models/material';
import { deleteMaterial } from '@/service/material';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react';
import { Edit } from 'lucide-react';

interface CellActionProps {
  data: IMaterial;
}

export const MaterialCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Material ID is missing. Cannot delete.');
      return;
    }

    setLoading(true);
    try {
      await deleteMaterial(data.id);
      toast.success('Material deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error deleting material.');
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

      {/* Edit material modal
      <Modal
        title="Edit Material"
        description="Update material details below."
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <MaterialForm
          initialData={data}
          isEdit
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal> */}

      {/* Actions dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <PermissionGuard requiredPermission={PERMISSIONS.MATERIAL.UPDATE.name}>

          <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Update
          </DropdownMenuItem>
          </PermissionGuard>
                                <PermissionGuard requiredPermission={PERMISSIONS.MATERIAL.VIEW.name}>

 <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/Material/view?id=${data.id}`)
              }
            >
              <IconEdit className='mr-2 h-4 w-4' /> View
            </DropdownMenuItem>
          </PermissionGuard>

                                  <PermissionGuard requiredPermission={PERMISSIONS.MATERIAL.DELETE.name}>

          <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>

                    </PermissionGuard>

        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
