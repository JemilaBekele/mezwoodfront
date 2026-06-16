'use client';

import { useEffect, useState } from 'react';
import { getStockCorrectionById } from '@/service/StockCorrection';
import StockCorrectionForm from './form';
import { IStockCorrection } from '@/models/StockCorrection';

type TStockCorrectionViewPageProps = {
  stockCorrectionId: string;
};

export default function StockCorrectionViewPage({
  stockCorrectionId
}: TStockCorrectionViewPageProps) {
  const [stockCorrection, setStockCorrection] =
    useState<IStockCorrection | null>(null);
  const [loading, setLoading] = useState(stockCorrectionId !== 'new');

  const isEdit = stockCorrectionId !== 'new';

  useEffect(() => {
    const fetchStockCorrection = async () => {
      if (!isEdit) {
        setLoading(false);
        return;
      }

      try {
        const data = await getStockCorrectionById(stockCorrectionId);
        setStockCorrection(data as IStockCorrection);
      } catch (error) {
        console.error('Failed to fetch stock correction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockCorrection();
  }, [stockCorrectionId, isEdit]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <StockCorrectionForm
      initialData={stockCorrection}
      isEdit={isEdit}
    />
  );
}