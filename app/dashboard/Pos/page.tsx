/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { ProductSearch } from '@/features/Shop/list';
import { getItemslist } from '@/service/item';

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemsData = await getItemslist();
        setItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.SELL.CREATE.name}>
      <PageContainer scrollable>
        <div className='flex-1 space-y-4'>
          <ProductSearch items={items} />
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}