'use client';

import { ICurtainOrder } from '@/models/curtainType';
import { getthikthinCurtainOrderById } from '@/service/Curtain';
import CurtainMeasurementForm from './form';
import { useEffect, useState } from 'react';

type TCurtainMeasurementViewPageProps = {
  orderId: string;
};

export default function CurtainMeasurementViewPage({
  orderId,
}: TCurtainMeasurementViewPageProps) {
  const [curtainOrder, setCurtainOrder] = useState<ICurtainOrder | null>(null);
  const [pageTitle, setPageTitle] = useState('Add Curtain Measurements');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurtainOrder() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getthikthinCurtainOrderById(orderId);
        const orderData = data ?? null;
        
        if (!orderData) {
          throw new Error('Curtain order not found');
        }
        
        setCurtainOrder(orderData);
        setPageTitle(`Curtain Measurements – Order`);
      } catch (err) {
        console.error('Error loading curtain order', err);
        setError(err instanceof Error ? err.message : 'Failed to load curtain order');
        setCurtainOrder(null);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchCurtainOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading curtain order...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 dark:text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!curtainOrder) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 dark:text-red-400">
          Curtain order not found
        </div>
      </div>
    );
  }

  return (
    <CurtainMeasurementForm
      orderId={orderId}
      curtainOrder={curtainOrder}
      pageTitle={pageTitle}
    />
  );
}