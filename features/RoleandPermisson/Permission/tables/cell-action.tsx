'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { deleteRolePermission, IRolePermission } from '@/service/roleService';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

interface CellActionProps {
  data: IRolePermission;
}

export const RolePermissionCellAction: React.FC<CellActionProps> = ({
  data
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Role-Permission ID is missing. Cannot delete.');
      return;
    }

    setLoading(true);
    try {
      await deleteRolePermission(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Role-Permission link deleted successfully.');
    } catch (error) {
      toast.error('Error deleting role-permission link. Please try again.');
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
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {/* 
            If you have an update page for role-permission link, adjust the URL below.
            Otherwise, you can remove this menu item or replace it with something else.
          */}
          <PermissionGuard
            requiredPermission={PERMISSIONS.ROLE_PERMISSION.DELETE.name}
          >
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
