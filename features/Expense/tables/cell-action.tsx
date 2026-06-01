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

import {
  deleteExpense
} from '@/service/expence';

import { IExpense } from '@/models/Expense';

import { PermissionGuard } from '@/components/PermissionGuard';

import { PERMISSIONS } from '@/stores/permissions';

import {
  IconDotsVertical,
  IconTrash,
  IconEdit
} from '@tabler/icons-react';

import ExpenseForm from '../form';

interface ExpenseCellActionProps {
  data: IExpense;
}

export const ExpenseCellAction: React.FC<
  ExpenseCellActionProps
> = ({ data }) => {
  const [loading, setLoading] = useState(false);

  const [openDeleteModal, setOpenDeleteModal] =
    useState(false);

  const [openEditModal, setOpenEditModal] =
    useState(false);

  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error(
        'Expense ID is missing. Cannot delete expense.'
      );

      return;
    }

    setLoading(true);

    try {
      await deleteExpense(data.id);

      toast.success('Expense deleted successfully');

      router.refresh();

      setOpenDeleteModal(false);
    } catch {
      toast.error(
        'Error deleting expense. Please try again.'
      );
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
        title='Edit Expense'
        description='Update the expense details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <ExpenseForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Actions */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
          >
            <span className='sr-only'>
              Open menu
            </span>

            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>
            Actions
          </DropdownMenuLabel>

          {/* <PermissionGuard
            requiredPermission={
              PERMISSIONS.EXPENSE.UPDATE.name
            }
          > */}
            <DropdownMenuItem
              onClick={() => setOpenEditModal(true)}
            >
              <IconEdit className='mr-2 h-4 w-4' />
              Update
            </DropdownMenuItem>
          {/* </PermissionGuard> */}

          {/* <PermissionGuard
            requiredPermission={
              PERMISSIONS.EXPENSE.DELETE.name
            }
          > */}
            <DropdownMenuItem
              onClick={() =>
                setOpenDeleteModal(true)
              }
            >
              <IconTrash className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          {/* </PermissionGuard> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};