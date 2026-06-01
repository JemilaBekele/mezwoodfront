'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IEmployee } from '@/models/employee';
import { deleteUser } from '@/service/employee';
import { resetUserPassword } from '@/service/employee'; // import your reset API here
import {
  IconEdit,
  IconDotsVertical,
  IconTrash,
  IconKey
} from '@tabler/icons-react'; // IconKey for reset password
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { EmployeeViewModal } from './employee-view-modal';

interface CellActionProps {
  data: IEmployee;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('User ID (_id) is missing. Cannot delete user.');
      return;
    }
    setLoading(true);
    try {
      await deleteUser(data.id);
      setOpen(false);
      toast.success('User deleted successfully');
    } catch  {
      toast.error('Error deleting user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    const newPassword = window.prompt('Enter new password for user:');
    if (!newPassword || newPassword.trim().length < 6) {
      toast.error('Password is required and must be at least 6 characters.');
      return;
    }
    if (!data?.id) {
      toast.error('User ID is missing. Cannot reset password.');
      return;
    }
    setLoading(true);
    try {
      await resetUserPassword(data.id, newPassword.trim());
      toast.success('Password reset successfully');
    } catch  {
      toast.error('Error resetting password. Please try again.');
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
      <EmployeeViewModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        data={data}
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

          <PermissionGuard
            requiredPermission={PERMISSIONS.Employee.UPDATE.name}
          >
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/employee/${data.id}`)}
            >
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard requiredPermission={PERMISSIONS.Employee.VIEW.name}>
            <DropdownMenuItem onClick={() => setViewOpen(true)}>
              <IconEdit className='mr-2 h-4 w-4' /> View
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.Employee.CHANGE_PASSWORD.name}
          >
            <DropdownMenuItem onClick={onResetPassword}>
              <IconKey className='mr-2 h-4 w-4' /> Reset Password
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.Employee.DELETE.name}
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
