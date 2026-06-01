'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import MovementTypeForm from './form'; // Adjust path if needed
import { IMovementType } from '@/models/curtainType';

interface MovementTypeModalProps {
  initialData?: IMovementType | null;
  pageTitle?: string;
}

export default function MovementTypeModal({
  initialData = null,
  pageTitle = 'Add New Movement Type'
}: MovementTypeModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => {
    setIsModalOpen(false);
    router.refresh(); // Refresh page on modal close
  };

  return (
    <>
      <button
        onClick={handleModalOpen}
        className={buttonVariants({ variant: 'default' }) + ' text-xs md:text-sm'}
      >
        <Plus className='mr-2 h-4 w-4' />
        {initialData ? 'Edit Movement Type' : 'Add New Movement Type'}
      </button>

      <Modal
        title={initialData ? 'Edit Movement Type' : pageTitle}
        description={
          initialData
            ? 'Update the movement type details below.'
            : 'Fill in the details below to add a new movement type.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <MovementTypeForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
