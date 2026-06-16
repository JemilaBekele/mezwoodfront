'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';

import { IBank } from '@/models/bank';
import BankForm from './form';

interface BankModalProps {
  initialData?: IBank | null;
  pageTitle?: string;
}

export default function BankModal({
  initialData = null,
  pageTitle = 'Add New Bank'
}: BankModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={handleModalOpen}
        className={
          buttonVariants({ variant: 'default' }) +
          ' text-xs md:text-sm'
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {initialData ? 'Edit Bank' : 'Add New Bank'}
      </button>

      <Modal
        title={initialData ? 'Edit Bank' : pageTitle}
        description={
          initialData
            ? 'Update the bank details below.'
            : 'Fill in the details below to add a new bank.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size="xl"
      >
        <BankForm
          closeModal={handleModalClose}
          initialData={initialData}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
