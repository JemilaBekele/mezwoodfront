'use client';

import PageContainer from '@/components/layout/page-container';
import DashboardCountCardsFetcher from '@/features/Dasboard/megargedashboard/card';

import {
  IconPackage,
  IconUsers,
  IconTruck,
  IconShoppingCart,
  IconCurrency,
  IconStack
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
import { TableDashboard } from '@/features/Dasboard/megargedashboard/table';
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
             <DashboardCountCardsFetcher>
      {({
        totalProducts,
        totalCustomers,
        totalSuppliers,
        totalPurchases,
        totalSales,
        totalStockQuantity
      }) => {

        const statCards = [
          {
            title: "Total Products",
            value: totalProducts,
            description: "Available products",
            subtext: "Inventory items",
            icon: <IconPackage />
          },
          {
            title: "Customers",
            value: totalCustomers,
            description: "Total customers",
            subtext: "Registered buyers",
            icon: <IconUsers />
          },
          {
            title: "Suppliers",
            value: totalSuppliers,
            description: "Total suppliers",
            subtext: "Vendor partners",
            icon: <IconTruck />
          },
          {
            title: "Total Purchases",
            value: totalPurchases,
            description: "Purchases made",
            subtext: "Stock added",
            icon: <IconShoppingCart />
          },
          {
            title: "Total Sales",
            value: totalSales,
            description: "Sales completed",
            subtext: "Products sold",
            icon: <IconCurrency />
          },
          {
            title: "Stock Quantity",
            value: totalStockQuantity,
            description: "Available stock",
            subtext: "Across inventory",
            icon: <IconStack />
          }
        ];

        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6 
          *:data-[slot=card]:bg-linear-to-t 
          *:data-[slot=card]:from-primary/5 
          *:data-[slot=card]:to-card 
          dark:*:data-[slot=card]:bg-card 
          *:data-[slot=card]:shadow-xs">

            {statCards.map((card, index) => (
              <Card key={index} className="@container/card">
                <CardHeader>
                  <CardDescription>{card.title}</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {card.value ?? 0}
                  </CardTitle>

                  <CardAction>
                    <Badge variant="outline">
                      {card.icon}
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <span className="font-medium">
                    {card.description}
                  </span>
                  <span className="text-muted-foreground">
                    {card.subtext}
                  </span>
                </CardFooter>
              </Card>
            ))}

          </div>
        );
      }}
    </DashboardCountCardsFetcher>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales parallel routes */}
            {sales}
          </div>
          {/* <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div> */}
        </div>

        <div>
                                  <TableDashboard/>

        </div>
      </div>
    </PageContainer></OverviewPermissionShell>
  );
}
