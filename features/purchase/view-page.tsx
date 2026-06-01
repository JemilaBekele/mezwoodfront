import { getPurchaseById } from '@/service/purchase';
import PurchaseForm from './form';
import { IPurchase } from '@/models/purchase';

type TPurchaseViewPageProps = {
  purchaseId: string;
};

export default async function PurchaseViewPage({
  purchaseId
}: TPurchaseViewPageProps) {
  let purchase: IPurchase | null = null;
  let isEdit = false;

  if (purchaseId !== 'new') {
    const data = await getPurchaseById(purchaseId);
    purchase = data as IPurchase;
    isEdit = true;
  }

  return <PurchaseForm initialData={purchase} isEdit={isEdit} />;
}
