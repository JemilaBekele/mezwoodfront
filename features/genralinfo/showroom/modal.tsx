'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import { IShowroom } from '@/models/showroom';
import ShowroomForm from './form';

interface ShowroomModalProps {
  initialData?: IShowroom | null;
  pageTitle?: string;
}

export default function ShowroomModal({
  initialData = null,
  pageTitle = 'Add New Showroom'
}: ShowroomModalProps) {
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
          buttonVariants({ variant: 'default' }) + ' text-xs md:text-sm'
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {initialData ? 'Edit Showroom' : 'Add New Showroom'}
      </button>

      <Modal
        title={initialData ? 'Edit Showroom' : pageTitle}
        description={
          initialData
            ? 'Update the showroom details below.'
            : 'Fill in the details below to add a new showroom.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size="xl"
      >
        <ShowroomForm
          closeModal={handleModalClose}
          initialData={initialData}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}