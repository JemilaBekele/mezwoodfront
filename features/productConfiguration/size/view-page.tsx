'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';

import { ISize } from '@/models/productConfiguration';
import SizeForm from './form';

interface SizeModalProps {
  initialData?: ISize | null;
  pageTitle?: string;
}

export default function SizeModal({
  initialData = null,
  pageTitle = 'Add New Size'
}: SizeModalProps) {
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
        <Plus className='mr-2 h-4 w-4' />
        {initialData ? 'Edit Size' : 'Add New Size'}
      </button>

      <Modal
        title={initialData ? 'Edit Size' : pageTitle}
        description={
          initialData
            ? 'Update the size details below.'
            : 'Fill in the details below to add a new size.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <SizeForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}