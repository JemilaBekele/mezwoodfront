'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import { ICapacityLot } from '@/models/CapacityLot';
import CapacitySlotForm from './form'; // Make sure the path is correct

interface CapacitySlotModalProps {
  initialData?: ICapacityLot | null;
  pageTitle?: string;
}

export default function CapacitySlotModal({
  initialData = null,
  pageTitle = 'Add New Capacity Slot'
}: CapacitySlotModalProps) {
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
        {initialData ? 'Edit Capacity Slot' : 'Add New Capacity Slot'}
      </button>

      <Modal
        title={initialData ? 'Edit Capacity Slot' : pageTitle}
        description={
          initialData
            ? 'Update the capacity slot details below.'
            : 'Fill in the details below to add a new capacity slot.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <CapacitySlotForm
          closeModal={handleModalClose}
          initialData={initialData}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
