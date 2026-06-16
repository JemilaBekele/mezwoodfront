import { MonthlySalesPIBarChart } from '@/features/Dasboard/main/chart';
import { delay } from '@/lib/delay';

export default async function BarStats() {
  await delay(1000);

  return <MonthlySalesPIBarChart />;
}
