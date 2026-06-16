

import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ItemViewPage from '@/features/Item/view';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : item '
};

type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ItemViewPage itemId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
