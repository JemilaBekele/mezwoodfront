import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ProformaViewPage from '@/features/proforma/view-page';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard :  Proforma'
};

type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProformaViewPage proformaId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
