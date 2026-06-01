'use client';

import { getCountCards } from '@/service/invarelDash';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface DashboardCountCards {
  totalProducts: number | null;
  totalCustomers: number | null;
  totalSuppliers: number | null;
  totalPurchases: number | null;
  totalSales: number | null;
  totalStockQuantity: number | null;
}

export default function DashboardCountCardsFetcher({
  children
}: {
  children: (data: DashboardCountCards) => React.ReactNode;
}) {
  const [data, setData] = useState<DashboardCountCards>({
    totalProducts: null,
    totalCustomers: null,
    totalSuppliers: null,
    totalPurchases: null,
    totalSales: null,
    totalStockQuantity: null
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await getCountCards();
        setData(result);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-6'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className='bg-muted h-24 animate-pulse rounded-xl'
          ></div>
        ))}
      </div>
    );
  }

  return <>{children(data)}</>;
}