'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CalendarClock, CheckCircle2, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { getOverviewInsights, IOverviewInsights } from '@/service/overviewInsights';

const formatETB = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0
  }).format(amount || 0);

const stageLabel = (stage: string) =>
  stage
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Single series -> one hue (same blue as the monthly payments chart)
const pipelineConfig = {
  count: { label: 'Projects', color: '#2563eb' }
} satisfies ChartConfig;

// ─── Delivery status (status colors, always with icon + label) ──
function DeliveryHealth({ delivery }: { delivery: IOverviewInsights['delivery'] }) {
  const total = delivery.openProjects || 1;
  const segments = [
    {
      key: 'overdue',
      label: 'Overdue',
      value: delivery.overdue,
      bar: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      icon: AlertTriangle
    },
    {
      key: 'week',
      label: 'Due in 7 days',
      value: delivery.dueThisWeek,
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      icon: CalendarClock
    },
    {
      key: 'later',
      label: 'On schedule',
      value: delivery.later + delivery.noDate,
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Status</CardTitle>
        <CardDescription>
          {delivery.openProjects} open projects vs. requested delivery date
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Part-to-whole meter, 2px gaps between segments */}
        <div className='flex h-3 w-full gap-0.5 overflow-hidden rounded-full'>
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.key}
                className={`${s.bar} h-full first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${(s.value / total) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ))}
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {segments.map((s) => (
            <div key={s.key}>
              <div className={`flex items-center gap-1 text-xs font-medium ${s.text}`}>
                <s.icon className='h-3.5 w-3.5' />
                {s.label}
              </div>
              <div className='text-2xl font-semibold tabular-nums'>{s.value}</div>
              <div className='text-xs text-muted-foreground'>
                {Math.round((s.value / total) * 100)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Production pipeline (magnitude per stage) ──────────────────
function Pipeline({ pipeline }: { pipeline: IOverviewInsights['pipeline'] }) {
  const data = pipeline.map((p) => ({ stage: stageLabel(p.stage), count: p.count }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Pipeline</CardTitle>
        <CardDescription>Open projects by current stage</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>No open projects</p>
        ) : (
          <ChartContainer
            config={pipelineConfig}
            className='w-full'
            style={{ height: Math.max(data.length * 32, 120) }}
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout='vertical'
              margin={{ left: 8, right: 32 }}
              barCategoryGap={4}
            >
              <CartesianGrid horizontal={false} strokeOpacity={0.4} />
              <YAxis
                dataKey='stage'
                type='category'
                tickLine={false}
                axisLine={false}
                width={90}
                tick={{ fontSize: 12 }}
              />
              <XAxis type='number' hide allowDecimals={false} />
              <ChartTooltip cursor={{ fillOpacity: 0.1 }} content={<ChartTooltipContent />} />
              <Bar dataKey='count' fill='var(--color-count)' radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey='count'
                  position='right'
                  className='fill-muted-foreground'
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Collections (paid vs outstanding on PIs) ───────────────────
function Collections({ collections }: { collections: IOverviewInsights['collections'] }) {
  const paidPct = collections.totalValue
    ? Math.round((collections.totalPaid / collections.totalValue) * 100)
    : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Collection</CardTitle>
        <CardDescription>
          {collections.invoiceCount} proforma invoices (cancelled excluded)
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <div className='text-sm text-muted-foreground'>Outstanding balance</div>
          <div className='text-3xl font-semibold tabular-nums'>{formatETB(collections.outstanding)}</div>
        </div>
        <div className='space-y-1.5'>
          <div className='flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-l-full bg-[#2563eb]'
              style={{ width: `${paidPct}%` }}
              title={`Paid: ${formatETB(collections.totalPaid)}`}
            />
          </div>
          <div className='flex justify-between text-xs'>
            <span>
              <span className='font-medium'>{paidPct}% paid</span>{' '}
              <span className='text-muted-foreground'>{formatETB(collections.totalPaid)}</span>
            </span>
            <span className='text-muted-foreground'>of {formatETB(collections.totalValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Lists ──────────────────────────────────────────────────────
function MostOverdue({ items }: { items: IOverviewInsights['mostOverdue'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Overdue Projects</CardTitle>
        <CardDescription>Past the requested delivery date</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>No overdue projects</p>
        ) : (
          <ul className='divide-y text-sm'>
            {items.map((p) => (
              <li key={p.projectId} className='flex items-center justify-between gap-3 py-2'>
                <div className='min-w-0'>
                  <Link
                    href={`/dashboard/Project/view?id=${p.projectId}`}
                    className='font-medium hover:underline'
                  >
                    {p.piNumber}
                  </Link>
                  <span className='text-muted-foreground'> · {p.customerName}</span>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span>{stageLabel(p.stage)}</span>
                    {p.customerPhone && (
                      <span className='inline-flex items-center gap-1'>
                        <Phone className='h-3 w-3' />
                        {p.customerPhone}
                      </span>
                    )}
                  </div>
                </div>
                <span className='inline-flex shrink-0 items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400'>
                  <AlertTriangle className='h-3.5 w-3.5' />
                  {p.daysLate} days late
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TopDebtors({ items }: { items: IOverviewInsights['topDebtors'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Balances to Collect</CardTitle>
        <CardDescription>Customers with the largest unpaid PI balance</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>Nothing outstanding</p>
        ) : (
          <ul className='divide-y text-sm'>
            {items.map((d) => (
              <li key={d.customerId} className='flex items-center justify-between gap-3 py-2'>
                <div className='min-w-0'>
                  <div className='truncate font-medium'>{d.customerName}</div>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span>
                      {d.invoiceCount} PI{d.invoiceCount > 1 ? 's' : ''}
                    </span>
                    {d.customerPhone && (
                      <span className='inline-flex items-center gap-1'>
                        <Phone className='h-3 w-3' />
                        {d.customerPhone}
                      </span>
                    )}
                  </div>
                </div>
                <span className='shrink-0 font-semibold tabular-nums'>{formatETB(d.balance)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section ────────────────────────────────────────────────────
export function OverviewInsights() {
  const [data, setData] = useState<IOverviewInsights | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getOverviewInsights()
      .then(setData)
      .catch((err) => {
        console.error('Error loading overview insights:', err);
        setError(true);
      });
  }, []);

  if (error) return null;

  if (!data) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-56 w-full' />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <DeliveryHealth delivery={data.delivery} />
        <Collections collections={data.collections} />
        <div className='md:col-span-2 lg:col-span-1 lg:row-span-2'>
          <Pipeline pipeline={data.pipeline} />
        </div>
        <MostOverdue items={data.mostOverdue} />
        <TopDebtors items={data.topDebtors} />
      </div>
    </div>
  );
}
