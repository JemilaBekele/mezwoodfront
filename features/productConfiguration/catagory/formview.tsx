'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';

import { IProductCategory } from '@/models/productConfiguration';
import ProductCategoryForm from './form';

interface ProductCategoryModalProps {
  initialData?: IProductCategory | null;
  pageTitle?: string;
}

export default function ProductCategoryModal({
  initialData = null,
  pageTitle = ''
}: ProductCategoryModalProps) {
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
        <Plus  />
      </button>

      <Modal
        title={initialData ? 'Edit Product Category' : pageTitle}
        description={
          initialData
            ? 'Update the product category details below.'
            : 'Fill in the details below to add a new product category.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <ProductCategoryForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}