'use client';

import { getDashboardCounts } from '@/service/dashboard';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ReportCountCards {
  totalCustomers: number | null;
  totalSuppliers: number | null;
  totalApprovedFinishedProjects: number | null;
  totalProjectsInProcess: number | null;
}

export default function ReportCountCardsFetcher({
  children
}: {
  children: (data: ReportCountCards) => React.ReactNode;
}) {
  const [data, setData] = useState<ReportCountCards>({
    totalCustomers: null,
    totalSuppliers: null,
    totalApprovedFinishedProjects: null,
    totalProjectsInProcess: null
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportCounts = async () => {
      try {
        const result = await getDashboardCounts();
        setData(result);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load report statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchReportCounts();
  }, []);

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
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