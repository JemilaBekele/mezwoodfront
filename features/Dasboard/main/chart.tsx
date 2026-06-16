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
  proforma: {
    gain: number;
    paid: number;
    outstanding: number;
    collectionRate: string | number;
  };
  sales: {
    gain: number;
    paid: number;
    outstanding: number;
    collectionRate: string | number;
  };
  combined: {
    gain: number;
    paid: number;
    outstanding: number;
    collectionRate: string | number;
  };
}

const chartConfig = {
  sales: {
    label: 'Sales',
    color: '#2563eb'
  },
  proforma: {
    label: 'Proforma',
    color: '#f97316'
  },
  total: {
    label: 'Total (Sales + PI)',
    color: '#10b981'
  }
} satisfies ChartConfig;

export function MonthlySalesPIBarChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalSales, setTotalSales] = useState(0);
  const [totalPI, setTotalPI] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: MonthlyBreakdownItem[] =
          await getMonthlyBreakdown();

        const formattedData = data.map((item) => ({
          month: item.monthName.slice(0, 3),
          sales: item.sales.gain,
          proforma: item.proforma.gain,
          total: item.sales.gain + item.proforma.gain, // Add total bar
          salesPaid: item.sales.paid,
          proformaPaid: item.proforma.paid
        }));

        setChartData(formattedData);

        const salesTotal = data.reduce(
          (sum, item) => sum + item.sales.gain,
          0
        );

        const piTotal = data.reduce(
          (sum, item) => sum + item.proforma.gain,
          0
        );

        setTotalSales(salesTotal);
        setTotalPI(piTotal);
      } catch (error) {
        console.error(error);

        toast.error(
          'Failed to load monthly sales and proforma chart'
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
          <CardTitle>Monthly Sales vs Proforma</CardTitle>
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
        <CardTitle>Monthly Sales vs Proforma</CardTitle>

        <CardDescription>
          Comparison of monthly sales, PI revenue, and total
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

            <Legend />

            {/* Bar for Sales */}
            <Bar
              dataKey='sales'
              fill='var(--color-sales)'
              radius={4}
            />

            {/* Bar for Proforma */}
            <Bar
              dataKey='proforma'
              fill='var(--color-proforma)'
              radius={4}
            />

            {/* Bar for Total (Sales + PI) */}
            <Bar
              dataKey='total'
              fill='var(--color-total)'
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className='flex-col items-start gap-2 text-sm'>
        <div className='flex items-center gap-2 font-medium leading-none'>
          Revenue overview for the year
          <TrendingUp className='h-4 w-4' />
        </div>

        <div className='text-muted-foreground leading-none'>
          Total Sales: {totalSales.toLocaleString()} | Total PI: {totalPI.toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
}