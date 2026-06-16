/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Crown,
  Medal,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  ShoppingCart,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { getCompleteStaticReport } from '@/service/dashboard';

// ==================== Types ====================

interface ItemAnalysis {
  rank: number;
  itemId: string;
  itemName: string;
  category: string;
  type: string;
  size: string;
  color: string;
  price: number;
  imageUrl?: string;
  totalQuantity?: number;
  totalRevenue?: number;
  totalRequestedQuantity?: number;
  totalValue?: number;
  orderCount?: number;
  piCount?: number;
  uniqueCustomers: number;
  customerList: string[];
}

interface ItemSalesAnalysis {
  type: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalItemsSold: number;
    totalRevenue: number;
    uniqueItemsSold: number;
    averageItemValue: number;
    totalOrders: number;
  };
  topByQuantity: ItemAnalysis[];
  topByRevenue: ItemAnalysis[];
  allItems: ItemAnalysis[];
  generatedAt: Date;
}

interface CreatorAnalysis {
  rank: number;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  totalRevenue?: number;
  totalSales?: number;
  totalItemsSold?: number;
  totalValue?: number;
  totalPI?: number;
  totalItemsRequested?: number;
  percentageOfTotal: number;
  sales?: any[];
  proformas?: any[];
}

interface SalesCreatorAnalysis {
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    totalSales: number;
    activeSalesPeople: number;
    averageSaleValue: number;
  };
  topByRevenue: CreatorAnalysis[];
  topBySalesCount: CreatorAnalysis[];
  allCreators: CreatorAnalysis[];
  generatedAt: Date;
}

interface PICreatorAnalysis {
  period: { startDate: string; endDate: string };
  summary: {
    totalProformaValue: number;
    totalProformas: number;
    activePreparers: number;
    averageProformaValue: number;
  };
  topByValue: CreatorAnalysis[];
  topByPICount: CreatorAnalysis[];
  allPreparers: CreatorAnalysis[];
  generatedAt: Date;
}

interface ProformaItemsAnalysis {
  type: string;
  source: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalRequestedQuantity: number;
    totalRequestedValue: number;
    uniqueItemsRequested: number;
    averageItemValue: number;
    totalOrders: number;
  };
  topByQuantity: ItemAnalysis[];
  topByRevenue: ItemAnalysis[];
  allItems: ItemAnalysis[];
  generatedAt: Date;
}

interface ComparisonItem {
  itemName: string;
  requestedQuantity: number;
  soldQuantity: number;
  conversionRate: number | string;
  gap: number;
}

interface CompleteStaticReportData {
  reportDate: Date;
  period: { startDate: string; endDate: string };
  itemSalesAnalysis: ItemSalesAnalysis;
  salesByCreatorAnalysis: SalesCreatorAnalysis;
  proformaByCreatorAnalysis: PICreatorAnalysis;
  proformaItemsAnalysis: ProformaItemsAnalysis;
  executiveSummary: {
    totalRevenueFromSales: number;
    totalProformaValue: number;
    revenueConversionRate: string;
    totalItemsSold: number;
    totalItemsRequested: number;
    quantityConversionRate: string;
    topSellingItemByQuantity: { name: string; quantity: number; revenue: number } | null;
    topRequestedItemByQuantity: { name: string; quantity: number; value: number } | null;
    topSellingItemByRevenue: { name: string; revenue: number; quantity: number } | null;
    topRequestedItemByValue: { name: string; value: number; quantity: number } | null;
    topSalesPerson: { name: string; revenue: number; salesCount: number; percentageOfTotal: number } | null;
    topPIPreparer: { name: string; value: number; piCount: number; percentageOfTotal: number } | null;
    averageOrderValue: number;
    averageProformaValue: number;
    uniqueCustomers: number;
  };
  comparisonAnalysis: {
    top5ItemsComparison: ComparisonItem[];
    summary: {
      totalGapQuantity: number;
      averageConversionRate: string;
    };
  };
  generatedAt: Date;
}

// ==================== Helper Components ====================

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}> = ({ title, value, description, icon, trend, color = 'blue' }) => (
  <Card className={`border-l-4 border-l-${color}-500`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(trend)}% from target</span>
        </div>
      )}
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

const getMedalIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 1:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 2:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <Star className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// ==================== Main Component ====================

const CompleteStaticReportDashboard: React.FC = () => {
  // State
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportData, setReportData] = useState<CompleteStaticReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('combined');

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompleteStaticReport({
        startDate,
        endDate,
      });
      setReportData(data);
      toast.success('Report data refreshed');
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error(error.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Combine sales and PI data into a single array
  const getCombinedSalesData = () => {
    if (!reportData) return [];
    
    const salesPeople = new Map();
    
    // Add sales data
    reportData.salesByCreatorAnalysis.allCreators.forEach(creator => {
      salesPeople.set(creator.creatorId, {
        id: creator.creatorId,
        name: creator.creatorName,
        email: creator.creatorEmail,
        totalRevenue: creator.totalRevenue || 0,
        totalSales: creator.totalSales || 0,
        totalItemsSold: creator.totalItemsSold || 0,
        totalPIValue: 0,
        totalPICount: 0,
        totalItemsRequested: 0,
        rank: creator.rank,
        percentageOfTotal: creator.percentageOfTotal
      });
    });
    
    // Add PI data
    reportData.proformaByCreatorAnalysis.allPreparers.forEach(preparer => {
      if (salesPeople.has(preparer.creatorId)) {
        const existing = salesPeople.get(preparer.creatorId);
        existing.totalPIValue = preparer.totalValue || 0;
        existing.totalPICount = preparer.totalPI || 0;
        existing.totalItemsRequested = preparer.totalItemsRequested || 0;
        salesPeople.set(preparer.creatorId, existing);
      } else {
        salesPeople.set(preparer.creatorId, {
          id: preparer.creatorId,
          name: preparer.creatorName,
          email: preparer.creatorEmail,
          totalRevenue: 0,
          totalSales: 0,
          totalItemsSold: 0,
          totalPIValue: preparer.totalValue || 0,
          totalPICount: preparer.totalPI || 0,
          totalItemsRequested: preparer.totalItemsRequested || 0,
          rank: preparer.rank,
          percentageOfTotal: preparer.percentageOfTotal
        });
      }
    });
    
    return Array.from(salesPeople.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const getCombinedItemData = () => {
    if (!reportData) return [];
    
    const items = new Map();
    
    // Add sales item data
    reportData.itemSalesAnalysis.allItems.forEach(item => {
      items.set(item.itemId, {
        id: item.itemId,
        name: item.itemName,
        category: item.category,
        type: item.type,
        size: item.size,
        color: item.color,
        price: item.price,
        soldQuantity: item.totalQuantity || 0,
        soldRevenue: item.totalRevenue || 0,
        requestedQuantity: 0,
        requestedValue: 0,
        piCount: 0,
        uniqueCustomers: item.uniqueCustomers,
        totalCombined: (item.totalRevenue || 0) // This will be updated when PI data is added
      });
    });
    
    // Add PI item data
    reportData.proformaItemsAnalysis.allItems.forEach(item => {
      if (items.has(item.itemId)) {
        const existing = items.get(item.itemId);
        existing.requestedQuantity = item.totalRequestedQuantity || 0;
        existing.requestedValue = item.totalValue || 0;
        existing.piCount = item.piCount || 0;
        existing.totalCombined = (existing.soldRevenue || 0) + (item.totalValue || 0);
        items.set(item.itemId, existing);
      } else {
        items.set(item.itemId, {
          id: item.itemId,
          name: item.itemName,
          category: item.category,
          type: item.type,
          size: item.size,
          color: item.color,
          price: item.price,
          soldQuantity: 0,
          soldRevenue: 0,
          requestedQuantity: item.totalRequestedQuantity || 0,
          requestedValue: item.totalValue || 0,
          piCount: item.piCount || 0,
          uniqueCustomers: 0,
          totalCombined: item.totalValue || 0
        });
      }
    });
    
    return Array.from(items.values()).sort((a, b) => b.totalCombined - a.totalCombined);
  };

  // Calculate totals for the summary
  const totalSalesRevenue = reportData?.executiveSummary.totalRevenueFromSales || 0;
  const totalPIValue = reportData?.executiveSummary.totalProformaValue || 0;
  const totalCombinedRevenue = totalSalesRevenue + totalPIValue;

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const combinedSalesData = getCombinedSalesData();
  const combinedItemData = getCombinedItemData();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Complete Business Intelligence Report</h1>
          <p className="text-muted-foreground">
            Executive summary, sales analysis, proforma tracking, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchReportData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-40">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchReportData} className="h-10">
              Apply Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Summary Cards - Updated with Total Sales Revenue, Total PI Value, and Combined Total */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Sales Revenue"
              value={formatCurrency(totalSalesRevenue)}
              description="Revenue from completed sales"
              icon={<DollarSign className="h-4 w-4 text-green-600" />}
              color="green"
            />
            <MetricCard
              title="Total PI Value"
              value={formatCurrency(totalPIValue)}
              description="Value from proforma invoices"
              icon={<FileText className="h-4 w-4 text-purple-600" />}
              color="purple"
            />
            <MetricCard
              title="Total Combined Value"
              value={formatCurrency(totalCombinedRevenue)}
              description="Sales Revenue + PI Value"
              icon={<Calculator className="h-4 w-4 text-blue-600" />}
              color="blue"
            />
          </div>

          {/* Top Performers Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Top Sales Person</CardTitle>
                <Award className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                {reportData.executiveSummary.topSalesPerson ? (
                  <>
                    <div className="text-lg font-bold">{reportData.executiveSummary.topSalesPerson.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(reportData.executiveSummary.topSalesPerson.revenue)} from {reportData.executiveSummary.topSalesPerson.salesCount} sales
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Top PI Preparer</CardTitle>
                <UserCheck className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                {reportData.executiveSummary.topPIPreparer ? (
                  <>
                    <div className="text-lg font-bold">{reportData.executiveSummary.topPIPreparer.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(reportData.executiveSummary.topPIPreparer.value)} from {reportData.executiveSummary.topPIPreparer.piCount} PIs
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Combined Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="combined" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                Combined Analysis (Sales & PI)
              </TabsTrigger>
              <TabsTrigger 
                value="items"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                Combined Item Analysis
              </TabsTrigger>
            </TabsList>

            {/* Combined Sales and PI Tab */}
            <TabsContent value="combined" className="space-y-6 mt-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-r rounded-t-lg border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        Sales & Proforma Performance by Person
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Period: {reportData.period.startDate} - {reportData.period.endDate}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white/50">
                      {combinedSalesData.length} people
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader >
                        <TableRow>
                          <TableHead className="w-20">Rank</TableHead>
                          <TableHead>Person Name</TableHead>
                          <TableHead className="text-right">Total Sales Revenue</TableHead>
                          <TableHead className="text-right">Total Sales Count</TableHead>
                          <TableHead className="text-right">Total PI Value</TableHead>
                          <TableHead className="text-right">Total PI Count</TableHead>
                          <TableHead className="text-right">Total Sales + PI Count</TableHead>

                          <TableHead className="text-right">Sales + PI Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedSalesData.map((person, idx) => (
                          <TableRow key={person.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getMedalIcon(idx)}
                                <span className="font-mono text-sm">#{idx + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{person.name}</TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {formatCurrency(person.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {person.totalSales} <span className="text-xs text-muted-foreground">sales</span>
                            </TableCell>
                          
                            <TableCell className="text-right text-purple-600 font-semibold">
                              {formatCurrency(person.totalPIValue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {person.totalPICount} <span className="text-xs text-muted-foreground"></span>
                            </TableCell>
                           <TableCell className="text-right text-blue-600 font-bold">
                              {person.totalSales + person.totalPICount}
                            </TableCell>
                            <TableCell className="text-right text-blue-600 font-bold">
                              {formatCurrency(person.totalRevenue + person.totalPIValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Combined Item Analysis Tab */}
            <TabsContent value="items" className="space-y-6 mt-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-r from-green-50 to-orange-50 rounded-t-lg border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        Combined Item Analysis (Sales & Proforma)
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Period: {reportData.period.startDate} - {reportData.period.endDate}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white/50">
                      {combinedItemData.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-20">Rank</TableHead>
                          <TableHead>Item Name</TableHead>
                       
                          <TableHead className="text-right">Stock Quantity</TableHead>
                          <TableHead className="text-right">Stock Revenue</TableHead>
                          <TableHead className="text-right">Project Quantity</TableHead>
                          <TableHead className="text-right">Project Value</TableHead>
                          <TableHead className="text-right">Total Stock + Project Quantity</TableHead>

                          <TableHead className="text-right">Stock + Project Value</TableHead>
                         
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedItemData.map((item, idx) => {
                          const conversionRate = item.requestedQuantity > 0 
                            ? ((item.soldQuantity / item.requestedQuantity) * 100).toFixed(1)
                            : '0';
                          return (
                            <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getMedalIcon(idx)}
                                  <span className="font-mono text-sm">#{idx + 1}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                           
                           
                              <TableCell className="text-right font-semibold text-blue-600">
                                {formatNumber(item.soldQuantity)} <span className="text-xs text-muted-foreground">units</span>
                              </TableCell>
                              <TableCell className="text-right text-green-600">
                                {formatCurrency(item.soldRevenue)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-orange-600">
                                {formatNumber(item.requestedQuantity)} <span className="text-xs text-muted-foreground">units</span>
                              </TableCell>
                              <TableCell className="text-right text-purple-600">
                                {formatCurrency(item.requestedValue)}
                              </TableCell>
                                  <TableCell className="text-right text-blue-600 font-bold">
                                {item.requestedQuantity + item.soldQuantity}
                              </TableCell>
                              <TableCell className="text-right text-blue-600 font-bold">
                                {formatCurrency(item.soldRevenue + item.requestedValue)}
                              </TableCell>
                           
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CompleteStaticReportDashboard;