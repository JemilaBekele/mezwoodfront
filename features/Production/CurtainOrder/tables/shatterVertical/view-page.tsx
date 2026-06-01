import { toast } from 'sonner';

import { ICurtainOrder } from '@/models/curtainType';
import {  getshatterCurtainOrderById } from '@/service/Curtain';
import ShatterCurtainMeasurementForm from './form';

type TCurtainMeasurementViewPageProps = {
  orderId: string;
};

export default async function ShatterCurtainMeasurementViewPage({
  orderId,
}: TCurtainMeasurementViewPageProps) {
  let curtainOrder: ICurtainOrder | null = null;
  let pageTitle = 'Add Curtain Measurements';

  // Curtain order MUST exist
  try {
    const data = await getshatterCurtainOrderById(orderId);
    curtainOrder = data ?? null;
    if (!curtainOrder) {
      throw new Error('Curtain order not found');
    }

    pageTitle = `Curtain Measurements – Order `;
  }  catch (error) {
    console.error('Error loading curtain order', error);
  }

  return (
    <ShatterCurtainMeasurementForm
      orderId={orderId}
      curtainOrder={curtainOrder}
      pageTitle={pageTitle}
    />
  );
}
