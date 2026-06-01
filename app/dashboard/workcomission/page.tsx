'use client';

import { useEffect, useState } from 'react';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import WorkerCommissionReportWrapper from '@/features/worker/view';
import { getShopallapi } from '@/service/shop';
import { IShop } from '@/models/shop';

export default function Page() {
  const [shops, setShops] = useState<IShop[] | null>(null); // ✅ Fixed: Added proper type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // ✅ Fixed: Added proper type

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const data = await getShopallapi();
        setShops(data);
      } catch (err) {
        console.error('Error fetching shops:', err);
        // ✅ Fixed: Handle unknown error type safely
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  if (loading) {
    return (
      <PageContainer scrollable>
        <div className='flex-1 space-y-4'>
          <FormCardSkeleton />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600">Error</h3>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ✅ Fixed: Only render if shops is not null
  if (!shops) {
    return (
      <PageContainer scrollable>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">No shops found</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <WorkerCommissionReportWrapper shops={shops} />
      </div>
    </PageContainer>
  );
}