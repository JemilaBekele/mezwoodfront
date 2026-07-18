/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { ProductSearch } from '@/features/Shop/list';
import { getItemslist } from '@/service/item';
import { getCategories, getSizes, getTypes } from '@/service/productConfiguration';

 // Import your type service

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [itemsData, categoriesData, sizesData, typesData] = await Promise.all([
          getItemslist(),
          getCategories(),
          getSizes(),
          getTypes()
        ]);
        
        setItems(itemsData || []);
        setCategories(categoriesData || []);
        setSizes(sizesData || []);
        setTypes(typesData || []);
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
          <ProductSearch 
            items={items}
            categories={categories}
            sizes={sizes}
            types={types}
          />
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}