import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { DeliveryEstimationFromPIPage } from '@/features/ProformaInvoices/deliveryesti';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Proforma Invoice detail page'
};

type PageProps = {
  searchParams: Promise<{ piId?: string }>; // Update to reflect searchParams as a Promise
};

export default async function LeasePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams; // Await searchParams
  const piId = resolvedSearchParams.piId ?? '';

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <DeliveryEstimationFromPIPage piId={piId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
