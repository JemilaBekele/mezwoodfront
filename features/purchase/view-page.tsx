'use client';

import { useEffect, useState } from 'react';
import { getPurchaseById } from '@/service/purchase';
import PurchaseForm from './form';
import { IPurchase } from '@/models/purchase';

type TPurchaseViewPageProps = {
  purchaseId: string;
};

export default function PurchaseViewPage({
  purchaseId
}: TPurchaseViewPageProps) {
  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [loading, setLoading] = useState(purchaseId !== 'new');

  const isEdit = purchaseId !== 'new';

  useEffect(() => {
    const fetchPurchase = async () => {
      if (!isEdit) {
        setLoading(false);
        return;
      }

      try {
        const data = await getPurchaseById(purchaseId);
        setPurchase(data as IPurchase);
      } catch (error) {
        console.error('Failed to fetch purchase:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [purchaseId, isEdit]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <PurchaseForm initialData={purchase} isEdit={isEdit} />;
}