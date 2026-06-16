'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';

import { IProductType } from '@/models/productConfiguration';
import ProductTypeForm from './form';

interface ProductTypeModalProps {
  initialData?: IProductType | null;
  pageTitle?: string;
}

export default function ProductTypeModal({
  initialData = null,
  pageTitle = 'Add New Product Type'
}: ProductTypeModalProps) {
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
        {initialData ? 'Edit Product Type' : 'Add New Product Type'}
      </button>

      <Modal
        title={initialData ? 'Edit Product Type' : pageTitle}
        description={
          initialData
            ? 'Update the product type details below.'
            : 'Fill in the details below to add a new product type.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <ProductTypeForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}