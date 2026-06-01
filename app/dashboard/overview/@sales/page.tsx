import { MonthlySalesChart } from '@/features/Dasboard/megargedashboard/barchart';
import { delay } from '@/lib/delay';

export default async function Sales() {
  await delay(3000);
  return <MonthlySalesChart />;
}
