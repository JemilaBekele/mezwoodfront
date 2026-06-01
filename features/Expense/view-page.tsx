'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import { IExpense } from '@/models/Expense';
import ExpenseForm from './form';

interface ExpenseModalProps {
  initialData?: IExpense | null;
  pageTitle?: string;
  onSuccess?: () => void; // Add this prop
}

export default function ExpenseModal({
  initialData = null,
  pageTitle = 'Add New Expense',
  onSuccess // Receive the callback
}: ExpenseModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleModalOpen = () => setIsModalOpen(true);

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.refresh(); // Keep this if you still want server refresh
    onSuccess?.(); // Call the refetch callback if provided
  };

  return (
    <>
      <button
        onClick={handleModalOpen}
        className={
          buttonVariants({ variant: 'default' }) + ' text-xs md:text-sm'
        }
      >
        <Plus className='mr-2 h-4 w-4' />
        {initialData ? 'Edit Expense' : 'Add New Expense'}
      </button>

      <Modal
        title={initialData ? 'Edit Expense' : pageTitle}
        description={
          initialData
            ? 'Update the expense details below.'
            : 'Fill in the details below to add a new expense.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <ExpenseForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}