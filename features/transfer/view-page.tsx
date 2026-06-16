'use client';

import { useEffect, useState } from 'react';
import { getTransferById } from '@/service/transfer';
import TransferForm from './form';
import { ITransfer } from '@/models/transfer';

type TTransferViewPageProps = {
  transferId: string;
};

export default function TransferViewPage({
  transferId
}: TTransferViewPageProps) {
  const [transfer, setTransfer] = useState<ITransfer | null>(null);
  const [loading, setLoading] = useState(transferId !== 'new');

  const isEdit = transferId !== 'new';

  useEffect(() => {
    const fetchTransfer = async () => {
      if (!isEdit) {
        setLoading(false);
        return;
      }

      try {
        const data = await getTransferById(transferId);
        setTransfer(data as ITransfer);
      } catch (error) {
        console.error('Failed to fetch transfer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [transferId, isEdit]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <TransferForm initialData={transfer} isEdit={isEdit} />;
}