'use client';

import PageContainer from '@/components/layout/page-container';
import ReportCountCardsFetcher from '@/features/report/count';


import {
  IconUsers,
  IconTruck,

  IconClock,
  IconCheck
} from '@tabler/icons-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardAction
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import React from 'react';
import { OverviewPermissionShell } from './overview-shell';

export default function OverViewLayout({
  sales,
  bar_stats
}: {
  sales: React.ReactNode;
  bar_stats: React.ReactNode;
}) {
  return (
    <OverviewPermissionShell>
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back 👋
          </h2>
        </div>
        <div>
           <ReportCountCardsFetcher>
  {({
    totalCustomers,
    totalSuppliers,
    totalApprovedFinishedProjects,
    totalProjectsInProcess
  }) => {
    const statCards = [
      {
        title: 'Total Customers',
        value: totalCustomers,
        description: 'Registered customers',
        subtext: 'Total buyers',
        icon: <IconUsers />
      },
      {
        title: 'Total Suppliers',
        value: totalSuppliers,
        description: 'Supplier partners',
        subtext: 'Active vendors',
        icon: <IconTruck />
      },
      {
        title: 'Finished Projects',
        value: totalApprovedFinishedProjects,
        description: 'Approved & completed',
        subtext: 'All stages finished',
        icon: <IconCheck />  // or <IconCircleCheck /> if available
      },
      {
        title: 'Projects In Process',
        value: totalProjectsInProcess,
        description: 'Ongoing projects',
        subtext: 'In progress',
        icon: <IconClock />
      }
    ];

    return (
      <div
        className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4
        *:data-[slot=card]:bg-linear-to-t
        *:data-[slot=card]:from-primary/5
        *:data-[slot=card]:to-card
        dark:*:data-[slot=card]:bg-card
        *:data-[slot=card]:shadow-xs'
      >
        {statCards.map((card, index) => (
          <Card key={index} className='@container/card'>
            <CardHeader>
              <CardDescription>
                {card.title}
              </CardDescription>

              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {card.value ?? 0}
              </CardTitle>

              <CardAction>
                <Badge variant='outline'>
                  {card.icon}
                </Badge>
              </CardAction>
            </CardHeader>

            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <span className='font-medium'>
                {card.description}
              </span>

              <span className='text-muted-foreground'>
                {card.subtext}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }}
</ReportCountCardsFetcher>
        </div>

          <div >
            {/* sales parallel routes */}
            {sales}
          </div>
          {/* <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div> */}

        
      </div>
    </PageContainer></OverviewPermissionShell>
  );
}
