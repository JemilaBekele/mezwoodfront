import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ProformaInvoiceDetailPage from '@/features/ProformaInvoices/detail';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Proforma Invoice detail page'
};

type PageProps = {
  searchParams: Promise<{ id?: string }>; // Update to reflect searchParams as a Promise
};

export default async function LeasePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams; // Await searchParams
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProformaInvoiceDetailPage id={resolvedSearchParams.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
