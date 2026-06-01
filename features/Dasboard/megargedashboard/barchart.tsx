/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { getMonthlySalesTrend } from '@/service/invarelDash';

interface MonthlySalesItem {
  month: string;   // e.g., 'Jan', 'Feb'
  sales: number;   // amount of sales
  orders: number;  // number of orders
  fill: string;    // bar color
}

export function MonthlySalesChart({ months = 6 }: { months?: number }) {
  const [chartData, setChartData] = useState<MonthlySalesItem[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data = await getMonthlySalesTrend(months);

        if (data && Array.isArray(data)) {
          // Add a fill color for each month
          const preparedData = data.map((item: any, index: number) => ({
            ...item,
            fill: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9'][index % 6]
          }));

          setChartData(preparedData);

          // Set chartConfig for tooltips
          const config: ChartConfig = {};
          preparedData.forEach((item: any) => {
            config[item.month] = { label: item.month, color: item.fill };
          });
          setChartConfig(config);

          // Summarize
          const totalSales = preparedData.reduce((sum, item) => sum + Number(item.sales), 0);
          const totalOrders = preparedData.reduce((sum, item) => sum + Number(item.orders), 0);

          setTotalAmount(totalSales);
          setTotalOrders(totalOrders);
        }
      } catch (err) {
        toast.error('Failed to load monthly sales trend');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [months]);

  if (loading) {
    return (
      <Card className='flex flex-col'>
        <CardHeader className='items-center pb-0'>
          <CardTitle>Monthly Sales Trend</CardTitle>
          <CardDescription>Loading chart...</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pb-0'>
          <div className='flex h-60 items-center justify-center'>
            <div className='text-muted-foreground'>Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Monthly Sales Trend</CardTitle>
        <CardDescription>Sales amount for the last {months} months</CardDescription>
      </CardHeader>

      <CardContent className='flex-1 pb-0'>
        <ChartContainer config={chartConfig} className='mx-auto h-72 w-full'>
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />

            <XAxis
              dataKey='month'
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
                    chartConfig[name as keyof ChartConfig]?.label || name
                  ]}
                />
              }
            />

            <Bar dataKey='sales' radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 font-medium'>
          Total Sales: {totalAmount.toLocaleString()}
          <TrendingUp className='h-4 w-4' />
        </div>
        <div className='text-muted-foreground'>
          {totalOrders} orders over the last {months} months
        </div>
      </CardFooter>
    </Card>
  );
}