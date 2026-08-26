/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

import { toast } from 'sonner';
import { getMonthlyBreakdown } from '@/service/dashboard';

interface MonthlyBreakdownItem {
  month: number;
  monthName: string;
  proformaPaid: number;
  sellPaid: number;
  totalPaid: number;
}

const chartConfig = {
  sellPaid: {
    label: 'Sell Payments',
    color: '#2563eb'
  },
  proformaPaid: {
    label: 'Proforma Payments',
    color: '#f97316'
  }
} satisfies ChartConfig;

export function MonthlySalesPIBarChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalSellPaid, setTotalSellPaid] = useState(0);
  const [totalProformaPaid, setTotalProformaPaid] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: MonthlyBreakdownItem[] =
          await getMonthlyBreakdown();

        const formattedData = data.map((item) => ({
          month: item.monthName.slice(0, 3),
          sellPaid: item.sellPaid,
          proformaPaid: item.proformaPaid,
          totalPaid: item.totalPaid
        }));

        setChartData(formattedData);

        const sellTotal = data.reduce(
          (sum, item) => sum + item.sellPaid,
          0
        );

        const proformaTotal = data.reduce(
          (sum, item) => sum + item.proformaPaid,
          0
        );

        setTotalSellPaid(sellTotal);
        setTotalProformaPaid(proformaTotal);
      } catch (error) {
        console.error(error);

        toast.error(
          'Failed to load monthly payments chart'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Payments Overview</CardTitle>
          <CardDescription>
            Loading chart data...
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className='flex h-87.5 items-center justify-center'>
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Payments Overview</CardTitle>

        <CardDescription>
          Monthly payments received from Sell and Proforma invoices
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className='h-87.5 w-full'
        >
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey='month'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />

            <YAxis tickLine={false} axisLine={false} />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />

       

            {/* Bar for Sell Payments */}
            <Bar
              dataKey='sellPaid'
              fill='var(--color-sellPaid)'
              radius={4}
            />

            {/* Bar for Proforma Payments */}
            <Bar
              dataKey='proformaPaid'
              fill='var(--color-proformaPaid)'
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className='flex-col items-start gap-2 text-sm'>
        <div className='flex items-center gap-2 font-medium leading-none'>
          Payments received for the year
          <TrendingUp className='h-4 w-4' />
        </div>

        <div className='text-muted-foreground leading-none'>
          Total Sell Payments: {totalSellPaid.toLocaleString()} | Total Proforma Payments: {totalProformaPaid.toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
}