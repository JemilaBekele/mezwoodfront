'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';

import CurtainForm from './form'; // adjust path if needed
import { ICurtainOrder } from '@/models/curtainType';

interface CurtainModalProps {
  initialData?: ICurtainOrder | null;
  pageTitle?: string;
}

export default function CurtainModal({
  initialData = null,
  pageTitle = 'Add New Curtain'
}: CurtainModalProps) {
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
        className={
          buttonVariants({ variant: 'default' }) + ' text-xs md:text-sm'
        }
      >
        <Plus className='mr-2 h-4 w-4' />
        {initialData ? 'Edit Curtain' : 'Add New Curtain'}
      </button>

      <Modal
        title={initialData ? 'Edit Curtain' : pageTitle}
        description={
          initialData
            ? 'Update the curtain details below.'
            : 'Fill in the details below to add a new curtain.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <CurtainForm
          closeModal={handleModalClose}
          initialData={initialData}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
