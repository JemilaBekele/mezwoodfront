'use client';

import { useEffect, useState } from 'react';
import { getSupplierById } from '@/service/supplier';
import SupplierForm from './form';
import { ISupplier } from '@/models/supplier';

type TSupplierViewPageProps = {
  supplierId: string;
};

export default function SupplierViewPage({
  supplierId
}: TSupplierViewPageProps) {
  const [supplier, setSupplier] = useState<ISupplier | null>(null);
  const [loading, setLoading] = useState(supplierId !== 'new');

  const isEdit = supplierId !== 'new';
  const pageTitle = isEdit
    ? 'Edit Supplier'
    : 'Create New Supplier';

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!isEdit) {
        setLoading(false);
        return;
      }

      try {
        const data = await getSupplierById(supplierId);
        setSupplier(data as ISupplier);
      } catch (error) {
        console.error('Failed to fetch supplier:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId, isEdit]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <SupplierForm
      initialData={supplier}
      pageTitle={pageTitle}
    />
  );
}