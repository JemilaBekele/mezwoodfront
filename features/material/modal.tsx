/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getMaterialId } from '@/service/material';
import { getMaterialCategories } from '@/service/materialcatagory';
import { getUnitsOfMeasure } from '@/service/UnitOfMeasure';

import MaterialForm from './form';
import { IMaterial } from '@/models/material';
import { normalizeImagePath } from '@/lib/norm';

type TMaterialViewPageProps = {
  materialId: string;
};

export default function MaterialViewPage({
  materialId
}: TMaterialViewPageProps) {
  const [loading, setLoading] = useState(true);

  const [material, setMaterial] = useState<IMaterial | null>(null);
  const [pageTitle, setPageTitle] = useState('Create New Material');

  const [categories, setCategories] = useState<any[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load dropdown data
        const [categoriesData, unitsData] = await Promise.all([
          getMaterialCategories(),
          getUnitsOfMeasure()
        ]);

        setCategories(categoriesData || []);
        setUnitsOfMeasure(unitsData || []);

        // Load material when editing
        if (materialId !== 'new') {
          const data = await getMaterialId(materialId);

          if (data) {
            const formattedMaterial: IMaterial = {
              ...data,
              imageUrl:
                typeof data.imageUrl === 'string'
                  ? normalizeImagePath(data.imageUrl)
                  : undefined
            };

            setMaterial(formattedMaterial);
            setPageTitle(
              `Edit Material: ${
                formattedMaterial.name || formattedMaterial.id
              }`
            );
          }
        }
      } catch (error) {
        console.error('Error loading material:', error);
        toast.error('Failed to load material data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [materialId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        Loading...
      </div>
    );
  }

  return (
    <MaterialForm
      initialData={material}
      pageTitle={pageTitle}
      categories={categories}
      unitsOfMeasure={unitsOfMeasure}
      isEdit={materialId !== 'new'}
    />
  );
}