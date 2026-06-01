/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  getLowStockAlerts, 
  getTopPurchaseProducts, 
  getTopSoldProducts, 
  getAgingInventory 
} from '@/service/invarelDash';
import { AlertTriangle, AlertCircle, TrendingUp, Clock, Package, ShoppingCart, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LowStockProduct {
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number;
  warningQuantity: number;
  unitOfMeasure: string;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK';
}

interface TopProduct {
  productId: string;
  productCode: string;
  productName: string;
  totalPurchasedQuantity?: number;
  totalSoldQuantity?: number;
  unitOfMeasure: string;
}

interface AgingInventoryItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitOfMeasure: string;
  movementDate: string;
  daysOld: number;
  location: string;
  invoiceNo: string;
  ageCategory: string;
}

interface AgingSummary {
  fresh: number;
  moderate: number;
  aging: number;
  old: number;
}

interface AgingData {
  agingInventory: AgingInventoryItem[];
  agingSummary: AgingSummary;
  totalAgingItems: number;
}

interface DashboardData {
  lowStock: LowStockProduct[];
  topPurchase: TopProduct[];
  topSold: TopProduct[];
  aging: AgingData;
}

export function TableDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'purchase' | 'sold'>('purchase');

  useEffect(() => {
    async function fetchData() {
      try {
        const [lowStockData, topPurchaseData, topSoldData, agingData] = await Promise.all([
          getLowStockAlerts(),
          getTopPurchaseProducts(10),
          getTopSoldProducts(10),
          getAgingInventory(20)
        ]);

        setDashboardData({
          lowStock: lowStockData?.lowStockProducts || [],
          topPurchase: topPurchaseData || [],
          topSold: topSoldData || [],
          aging: agingData || { agingInventory: [], agingSummary: { fresh: 0, moderate: 0, aging: 0, old: 0 }, totalAgingItems: 0 }
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold text-red-600">Error Loading Data</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="text-muted-foreground">No inventory data found.</p>
        </div>
      </div>
    );
  }

  const { lowStock, topPurchase, topSold, aging } = dashboardData;

  // Helper function to get stock alert colors
  const getStockAlertColors = (item: LowStockProduct) => {
    if (item.currentStock === 0) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-l-4 border-l-red-500 dark:border-l-red-400',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-300',
        status: 'Out of Stock',
        iconColor: 'text-red-600 dark:text-red-400'
      };
    }

    const percentage = (item.currentStock / item.warningQuantity) * 100;
    if (percentage <= 25) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-l-4 border-l-red-500 dark:border-l-red-400',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-300',
        status: 'Critical',
        iconColor: 'text-red-600 dark:text-red-400'
      };
    } else if (percentage <= 50) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
        badgeText: 'text-amber-800 dark:text-amber-300',
        status: 'Low',
        iconColor: 'text-amber-600 dark:text-amber-400'
      };
    } else {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-l-4 border-l-yellow-500 dark:border-l-yellow-400',
        badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        badgeText: 'text-yellow-800 dark:text-yellow-300',
        status: 'Warning',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }
  };

  // Helper function to get aging alert colors
  const getAgingAlertColors = (daysOld: number) => {
    if (daysOld >= 365) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-l-4 border-l-red-500 dark:border-l-red-400',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-300',
        label: 'Very Old (>1 year)'
      };
    }
    if (daysOld >= 180) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
        badgeText: 'text-amber-800 dark:text-amber-300',
        label: 'Old (6-12 months)'
      };
    }
    if (daysOld >= 90) {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-l-4 border-l-yellow-500 dark:border-l-yellow-400',
        badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        badgeText: 'text-yellow-800 dark:text-yellow-300',
        label: 'Aging (3-6 months)'
      };
    }
    if (daysOld >= 30) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-l-4 border-l-blue-500 dark:border-l-blue-400',
        badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
        badgeText: 'text-blue-800 dark:text-blue-300',
        label: 'Recent (1-3 months)'
      };
    }
    return {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-l-4 border-l-green-500 dark:border-l-green-400',
      badgeBg: 'bg-green-100 dark:bg-green-900/30',
      badgeText: 'text-green-800 dark:text-green-300',
      label: 'New (<1 month)'
    };
  };

  // Calculate summary stats
  const lowStockCount = lowStock.length;
  const outOfStockCount = lowStock.filter(item => item.status === 'OUT_OF_STOCK').length;
  const criticalStockCount = lowStock.filter(item => 
    item.status === 'LOW_STOCK' && (item.currentStock / item.warningQuantity) * 100 <= 25
  ).length;

  const totalTopPurchaseQuantity = topPurchase.reduce((sum, item) => sum + (item.totalPurchasedQuantity || 0), 0);
  const totalTopSoldQuantity = topSold.reduce((sum, item) => sum + (item.totalSoldQuantity || 0), 0);

  return (
    <div className='@container/dashboard space-y-6 p-4'>
      {/* Stats Cards Row */}
   

      {/* Two Column Layout for Alerts */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Left Column: Low Stock Items */}
        <Card className='@container/card h-full'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-xl flex items-center gap-2'>
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Alerts {lowStockCount}
            </CardTitle>
            <CardDescription className='text-base'>
              Items below warning quantity level
                  <div className='text-2xl font-bold'></div>
            <p className='text-xs text-muted-foreground'>
              {outOfStockCount} out of stock, {criticalStockCount} critical
            </p>
            </CardDescription>
          </CardHeader>
            
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-lg font-semibold'>
                      Product Name
                    </TableHead>
                    <TableHead className='text-lg font-semibold'>
                      Product Code
                    </TableHead>
                    <TableHead className='text-lg font-semibold'>
                      Current Stock
                    </TableHead>
                    <TableHead className='text-lg font-semibold'>
                      Warning Level
                    </TableHead>
                    <TableHead className='text-lg font-semibold'>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.length > 0 ? (
                    lowStock.map((item, index) => {
                      const colors = getStockAlertColors(item);
                      const percentage = (item.currentStock / item.warningQuantity) * 100;

                      return (
                        <TableRow
                          key={`${item.productId}-${index}`}
                          className={`hover:bg-muted/50 ${colors.bg} ${colors.border}`}
                        >
                          <TableCell className={`py-3 text-base font-medium ${colors.text}`}>
                            <div className="flex items-center gap-2">
                              {item.productName}
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors.badgeBg} ${colors.badgeText}`}>
                                {colors.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={`py-3 text-base ${colors.text}`}>
                            {item.productCode}
                          </TableCell>
                          <TableCell className={`py-3 text-base ${colors.text}`}>
                            <div className="flex items-center gap-2">
                              {item.currentStock} {item.unitOfMeasure}
                              {item.currentStock === 0 && (
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={`py-3 text-base ${colors.text}`}>
                            {item.warningQuantity} {item.unitOfMeasure}
                          </TableCell>
                          <TableCell className={`py-3 text-base ${colors.text}`}>
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors.badgeBg} ${colors.badgeText}`}>
                                {colors.status}
                              </span>
                              {item.currentStock > 0 && (
                                <div className="text-xs opacity-70">
                                  {Math.round(percentage)}% of warning level
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='py-8 text-center text-lg'
                      >
                        No low stock items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Top Products with Tabs */}
        <div className='space-y-6'>
          {/* Top Products Tabs */}
          <Card className='@container/card'>
            <CardHeader className='pb-3'>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className='text-xl flex items-center gap-2'>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Products
                  </CardTitle>
                  <CardDescription className='text-base'>
                    Most purchased and sold products
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'purchase' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('purchase')}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Most Purchased
                  </Button>
                  <Button
                    variant={activeTab === 'sold' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('sold')}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Most Sold
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='text-lg font-semibold'>
                        #
                      </TableHead>
                      <TableHead className='text-lg font-semibold'>
                        Product Name
                      </TableHead>
                      <TableHead className='text-lg font-semibold'>
                        Product Code
                      </TableHead>
                      <TableHead className='text-lg font-semibold'>
                        {activeTab === 'purchase' ? 'Total Purchased' : 'Total Sold'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activeTab === 'purchase' ? topPurchase : topSold).length > 0 ? (
                      (activeTab === 'purchase' ? topPurchase : topSold).map((item, index) => {
                        const quantity = activeTab === 'purchase' 
                          ? item.totalPurchasedQuantity || 0 
                          : item.totalSoldQuantity || 0;
                        const isTop3 = index < 3;

                        return (
                          <TableRow
                            key={`${item.productId}-${index}`}
                            className='hover:bg-muted/50'
                          >
                            <TableCell className='py-3 text-base font-medium'>
                              <div className="flex items-center gap-2">
                                {index + 1}
                                {isTop3 && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
                                    TOP {index + 1}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className='py-3 text-base font-medium'>
                              {item.productName}
                            </TableCell>
                            <TableCell className='py-3 text-base'>
                              {item.productCode}
                            </TableCell>
                            <TableCell className='py-3 text-base font-semibold'>
                              {quantity.toLocaleString()} {item.unitOfMeasure}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className='py-8 text-center text-lg'
                        >
                          No {activeTab === 'purchase' ? 'purchase' : 'sold'} data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Aging Summary Cards */}
          {/* <div className='grid grid-cols-4 gap-4'>
            <Card className='bg-green-50 dark:bg-green-950/20'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                  {aging.agingSummary.fresh}
                </div>
                <p className='text-xs text-muted-foreground'>Fresh</p>
                <p className='text-xs text-green-600 dark:text-green-400'>&lt;30 days</p>
              </CardContent>
            </Card>
            <Card className='bg-blue-50 dark:bg-blue-950/20'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {aging.agingSummary.moderate}
                </div>
                <p className='text-xs text-muted-foreground'>Moderate</p>
                <p className='text-xs text-blue-600 dark:text-blue-400'>31-90 days</p>
              </CardContent>
            </Card>
            <Card className='bg-yellow-50 dark:bg-yellow-950/20'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
                  {aging.agingSummary.aging}
                </div>
                <p className='text-xs text-muted-foreground'>Aging</p>
                <p className='text-xs text-yellow-600 dark:text-yellow-400'>91-180 days</p>
              </CardContent>
            </Card>
            <Card className='bg-red-50 dark:bg-red-950/20'>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                  {aging.agingSummary.old}
                </div>
                <p className='text-xs text-muted-foreground'>Old</p>
                <p className='text-xs text-red-600 dark:text-red-400'>&gt;180 days</p>
              </CardContent>
            </Card>
          </div> */}
        </div>
      </div>

      {/* Aging Report - Full Width */}
      {/* <Card className='@container/card'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Clock className="h-5 w-5 text-purple-500" />
            Aging Inventory Report
          </CardTitle>
          <CardDescription className='text-base'>
            Items by days in inventory with location tracking
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-lg font-semibold'>
                    Product Name
                  </TableHead>
                  <TableHead className='text-lg font-semibold'>
                    Product Code
                  </TableHead>
                  <TableHead className='text-lg font-semibold'>
                    Quantity
                  </TableHead>
                  <TableHead className='text-lg font-semibold'>
                    Days in Inventory
                  </TableHead>
                  <TableHead className='text-lg font-semibold'>
                    Location
                  </TableHead>
                  <TableHead className='text-lg font-semibold'>
                    Invoice No
                  </TableHead>
                  <TableHead className='text-lg font-semibold'>
                    Movement Date
                  </TableHead>
                  <TableHead className='text-lg font-semibold'>
                    Age Category
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aging.agingInventory.length > 0 ? (
                  aging.agingInventory.map((item, index) => {
                    const colors = getAgingAlertColors(item.daysOld);

                    return (
                      <TableRow
                        key={`${item.productId}-${index}`}
                        className={`hover:bg-muted/50 ${colors.bg} ${colors.border}`}
                      >
                        <TableCell className={`py-3 text-base font-medium ${colors.text}`}>
                          {item.productName}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${colors.text}`}>
                          {item.productCode}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${colors.text}`}>
                          {item.quantity.toLocaleString()} {item.unitOfMeasure}
                        </TableCell>
                        <TableCell className={`py-3 text-base font-medium ${colors.text}`}>
                          <div className="flex items-center gap-2">
                            {item.daysOld} days
                            {item.daysOld >= 180 && (
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                            {item.daysOld >= 90 && item.daysOld < 180 && (
                              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`py-3 text-base ${colors.text}`}>
                          {item.location}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${colors.text}`}>
                          {item.invoiceNo}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${colors.text}`}>
                          {new Date(item.movementDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${colors.text}`}>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors.badgeBg} ${colors.badgeText}`}>
                            {colors.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className='py-8 text-center text-lg'>
                      No aging report data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}