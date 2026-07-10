/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { toast } from 'sonner';

import { getItemId } from '@/service/item';
import {
  getSizesview,
  getTypesview,
  getCategoriesview
} from '@/service/productConfiguration';

import { normalizeImagePath } from '@/lib/norm';
import { IItem } from '@/models/item';
import ItemForm from './form';

type TItemViewPageProps = {
  itemId: string;
};

type ItemFormInitialData = ComponentProps<typeof ItemForm>['initialData'];

export default function ItemViewPage({
  itemId
}: TItemViewPageProps) {
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('Create New Item');

  const [item, setItem] = useState<ItemFormInitialData>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load dropdowns
        const [categoriesData, sizesData, typesData] =
          await Promise.all([
            getCategoriesview(),
            getSizesview(),
            getTypesview()
          ]);

        setCategories(categoriesData || []);
        setSizes(sizesData || []);
        setTypes(typesData || []);

        // Load item if editing
        if (itemId !== 'new') {
          const data = await getItemId(itemId);

          if (data) {
            const formattedItem = {
              ...data,
              imageUrl:
                typeof data.imageUrl === 'string'
                  ? normalizeImagePath(data.imageUrl)
                  : undefined
            } as ItemFormInitialData;

            setItem(formattedItem);
            setPageTitle(
              `Edit Item`
            );
          }
        }
      } catch (error) {
        console.error(error);
        toast.error('Error loading item');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        Loading...
      </div>
    );
  }

  return (
    <ItemForm
      initialData={item}
      pageTitle={pageTitle}
      categories={categories}
      sizes={sizes}
      types={types}
      isEdit={itemId !== 'new'}
    />
  );
}