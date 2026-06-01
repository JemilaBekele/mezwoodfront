'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import ColourForm from './form'; // Adjust path if needed
import { IColour } from '@/models/Category';

interface ColourModalProps {
  initialData?: IColour | null;
  pageTitle?: string;
}

export default function ColourModal({
  initialData = null,
  pageTitle = 'Add New Colour'
}: ColourModalProps) {
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
        {initialData ? 'Edit Colour' : 'Add New Colour'}
      </button>

      <Modal
        title={initialData ? 'Edit Colour' : pageTitle}
        description={
          initialData
            ? 'Update the colour details below.'
            : 'Fill in the details below to add a new colour.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <ColourForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
