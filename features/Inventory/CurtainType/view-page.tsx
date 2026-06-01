'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import CurtainTypeForm from './form'; // Adjust path if needed
import { ICurtainType } from '@/models/curtainType';

interface CurtainTypeModalProps {
  initialData?: ICurtainType | null;
  pageTitle?: string;
}

export default function CurtainTypeModal({
  initialData = null,
  pageTitle = 'Add New Curtain Type'
}: CurtainTypeModalProps) {
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
        {initialData ? 'Edit Curtain Type' : 'Add New Curtain Type'}
      </button>

      <Modal
        title={initialData ? 'Edit Curtain Type' : pageTitle}
        description={
          initialData
            ? 'Update the curtain type details below.'
            : 'Fill in the details below to add a new curtain type.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <CurtainTypeForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
