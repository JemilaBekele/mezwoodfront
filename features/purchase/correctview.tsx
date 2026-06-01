import { getPurchaseById } from '@/service/purchase';
import { IPurchase } from '@/models/purchase';
import { IStockCorrection } from '@/models/StockCorrection';
import PurchaseCorrectionForm from './correction';

type TPurchaseViewPageProps = {
  purchaseId: string;
};

export default async function PurchasecorrectPage({
  purchaseId
}: TPurchaseViewPageProps) {
  let purchase: IPurchase | null = null;
  let initialData: IStockCorrection | null = null;
  let isEdit = false;
  if (purchaseId !== 'new') {
    try {
      purchase = await getPurchaseById(purchaseId);
      isEdit = true;
      // Optionally, transform purchase data into initialData for IStockCorrection
      // For example, map relevant fields if needed
      initialData = {
        storeId: purchase?.storeId || '',
        reason: 'PURCHASE_ERROR', // Default value
        purchaseId: purchaseId,
        items:
          purchase?.items?.map((item) => ({
            productId: item.productId.toString(),
            height: item?.height || 0,
            width: item?.width || 0,
            unitOfMeasureId: item.unitOfMeasureId.toString(),
            quantity: Number(item.quantity)
          })) || [],
        reference: '',
        notes: ''
      } as IStockCorrection;
    } catch {}
  }

  return (
    <PurchaseCorrectionForm
      purchaseId={purchaseId}
      initialData={initialData}
      isEdit={isEdit}
      purchaseData={purchase} // <-- pass original purchase separately
    />
  );
}
