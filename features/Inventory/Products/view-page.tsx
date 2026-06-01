import { getProductById } from '@/service/Product';
import ProductForm from './form';
import { IProduct } from '@/models/Product';
import { getCategories, getColours } from '@/service/Category';
import { getUnitsOfMeasure } from '@/service/UnitOfMeasure';
import { normalizeImagePath } from '@/lib/norm';
import { toast } from 'sonner';
import { getShopallapi } from '@/service/shop';
import { getCurtainTypes } from '@/service/curtainType'; // 👈 import curtain types service

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  let product: IProduct | null = null;
  let combinedProductData: IProduct | null = null;
  let pageTitle = 'Create New Product';

  if (productId !== 'new') {
    try {
      const data = await getProductById(productId);
      product = data as IProduct | null;

      if (product) {
        combinedProductData = {
          ...product,
          imageUrl:
            typeof product?.imageUrl === 'string'
              ? normalizeImagePath(product.imageUrl)
              : undefined
        };

        pageTitle = `Edit Product: ${product?.name || product.id}`;
      }
    } catch  {
      toast.error('Error loading product');
    }
  }

  // Fetch all dropdown data in parallel including curtain types
  const [categories, unitsOfMeasure, shops, colours] = await Promise.all([
    getCategories(),
    getUnitsOfMeasure(),
    getShopallapi(),
    getColours(),
  ]);

  return (
    <ProductForm
      initialData={combinedProductData}
      pageTitle={pageTitle}
      categories={categories}
      unitsOfMeasure={unitsOfMeasure}
      shops={shops}
      colours={colours}
    />
  );
}