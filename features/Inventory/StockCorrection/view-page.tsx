import { getStockCorrectionById } from '@/service/StockCorrection';
import StockCorrectionForm from './form';
import { IStockCorrection } from '@/models/StockCorrection';

type TStockCorrectionViewPageProps = {
  stockCorrectionId: string;
};

export default async function StockCorrectionViewPage({
  stockCorrectionId
}: TStockCorrectionViewPageProps) {
  let stockCorrection: IStockCorrection | null = null;

  if (stockCorrectionId !== 'new') {
    const data = await getStockCorrectionById(stockCorrectionId);
    stockCorrection = data as IStockCorrection;
  }

  return (
    <StockCorrectionForm
      initialData={stockCorrection}
      isEdit={stockCorrectionId !== 'new'}
    />
  );
}
