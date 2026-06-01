'use client';

import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

import { getPaymentBarChart } from '@/service/invarelDash';

interface PaymentChartItem {
  name: string;
  value: number;
  amount: number;
  fill: string;
}

interface PaymentChartResponse {
  chartData: PaymentChartItem[];
  summary: {
    totalOrders: number;
    totalAmount: number;
  };
}

export function PaymentStatusChart() {
  const [chartData, setChartData] = useState<PaymentChartItem[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data: PaymentChartResponse = await getPaymentBarChart();

        if (data) {
          setChartData(data.chartData);

          const updatedConfig: ChartConfig = {};

          data.chartData.forEach((item) => {
            updatedConfig[item.name] = {
              label: item.name,
              color: item.fill
            };
          });

          setChartConfig(updatedConfig);
          setTotalAmount(Number(data.summary.totalAmount));
          setTotalOrders(data.summary.totalOrders);
        }
      } catch {
        toast.error(
          'Failed to load payment chart data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) {
    return (
      <Card className='flex flex-col'>
        <CardHeader className='items-center pb-0'>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Loading chart...</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pb-0'>
          <div className='flex aspect-square max-h-62.5 items-center justify-center'>
            <div className='text-muted-foreground'>
              Loading...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Payment Status</CardTitle>
        <CardDescription>
          Payment distribution overview
        </CardDescription>
      </CardHeader>

      <CardContent className='flex-1 pb-0'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto h-75 w-full'
        >
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey='name'
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()}`,
                    chartConfig[name as keyof ChartConfig]?.label ||
                      name
                  ]}
                />
              }
            />

            <Bar dataKey='amount' radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          Total Amount: 
          {totalAmount.toLocaleString()}
          <TrendingUp className='h-4 w-4' />
        </div>

        <div className='text-muted-foreground leading-none'>
          {totalOrders} orders across{' '}
          {chartData.filter((item) => item.value > 0).length}{' '}
          payment statuses
        </div>
      </CardFooter>
    </Card>
  );
}