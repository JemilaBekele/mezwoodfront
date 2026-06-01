import { PaymentStatusChart } from '@/features/Dasboard/megargedashboard/chart';
import { delay } from '@/lib/delay';

export default async function BarStats() {
  await delay(1000);

  return <PaymentStatusChart />;
}
