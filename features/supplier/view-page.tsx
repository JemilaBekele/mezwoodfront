import { getSupplierById } from '@/service/supplier';
import SupplierForm from './form';
import { ISupplier } from '@/models/supplier';

type TSupplierViewPageProps = {
  supplierId: string;
};

export default async function SupplierViewPage({
  supplierId
}: TSupplierViewPageProps) {
  let supplier: ISupplier | null = null;
  let pageTitle = 'Create New Supplier';

  if (supplierId !== 'new') {
    const data = await getSupplierById(supplierId);
    supplier = data as ISupplier;
    pageTitle = 'Edit Supplier';
  }

  return <SupplierForm initialData={supplier} pageTitle={pageTitle} />;
}
