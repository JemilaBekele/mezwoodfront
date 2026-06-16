/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDeliveryEstimationId } from '@/service/delivery-estimation';
import { IDeliveryEstimation } from '@/models/delivery-estimation';
import DeliveryEstimationForm from './form';

type TDeliveryEstimationViewPageProps = {
  deliveryEstimationId: string;
};

// Helper function to sanitize the data before passing to client component
function sanitizeDeliveryEstimation(data: any): IDeliveryEstimation | null {
  if (!data) return null;
  
  return {
    ...data,
    // Convert customerName from object to string if needed
    customerName: data.customerName 
      ? (typeof data.customerName === 'object' 
          ? (data.customerName as any)?.name || (data.customerName as any)?.id || ''
          : data.customerName)
      : null,
    // Convert createdBy to just the name string if it's an object
    createdBy: data.createdBy
      ? (typeof data.createdBy === 'object'
          ? (data.createdBy as any)?.name || (data.createdBy as any)?.email || ''
          : data.createdBy)
      : null,
    // Convert updatedBy similarly
    updatedBy: data.updatedBy
      ? (typeof data.updatedBy === 'object'
          ? (data.updatedBy as any)?.name || (data.updatedBy as any)?.email || ''
          : data.updatedBy)
      : null,
  };
}

export default async function DeliveryEstimationViewPage({
  deliveryEstimationId
}: TDeliveryEstimationViewPageProps) {
  let deliveryEstimation: IDeliveryEstimation | null = null;

  if (deliveryEstimationId !== 'new') {
    const data = await getDeliveryEstimationId(deliveryEstimationId);
    // Sanitize the data before passing to client component
    deliveryEstimation = sanitizeDeliveryEstimation(data);
  }

  return (
    <DeliveryEstimationForm
      initialData={deliveryEstimation}
      isEdit={deliveryEstimationId !== 'new'}
    />
  );
}