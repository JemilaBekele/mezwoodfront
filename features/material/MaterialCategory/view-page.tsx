'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import { IMaterialCategory } from '@/models/materialCategory';
import MaterialCategoryForm from './form'; // Make sure this points to your MaterialCategoryForm

interface MaterialCategoryModalProps {
  initialData?: IMaterialCategory | null;
  pageTitle?: string;
}

export default function MaterialCategoryModal({
  initialData = null,
  pageTitle = 'Add New Material Category'
}: MaterialCategoryModalProps) {
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
        {initialData ? 'Edit Material Category' : 'Add New Material Category'}
      </button>

      <Modal
        title={initialData ? 'Edit Material Category' : pageTitle}
        description={
          initialData
            ? 'Update the material category details below.'
            : 'Fill in the details below to add a new material category.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <MaterialCategoryForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
