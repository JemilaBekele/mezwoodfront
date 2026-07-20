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
  AlertTriangle,
  RefreshCw,
  Crown,
  Medal,
  Star,
  Package,
  ShoppingCart,
  TrendingUp,
  FileText,
  Box,
  Ruler,
  Palette,
  Eye,
  Handshake,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getCombinedReport } from '@/service/dashboard';

// ==================== Types ====================

interface LowStockMaterial {
  id: string;
  name: string;
  color: string;
  size: string;
  materialType: string;
  unitOfMeasure: string;
  totalStock: number;
  warningStockLevel: number;
  effectiveThreshold: number;
  isUsingOverride?: boolean;
  plainMDF?: boolean;
  laminatedMDF?: boolean;
  wood?: boolean;
  metal?: boolean;
  accessory?: boolean;
  other?: boolean;
  imageUrl?: string;
  locations: { quantity: number; type: string }[];
}

interface LowStockReport {
  threshold: string | number;
  totalLowStockMaterials: number;
  criticalCount: number;
  warningCount: number;
  lowStockMaterials: LowStockMaterial[];
  generatedAt: Date;
}

interface TopPurchasedItem {
  materialId: string;
  materialName: string;
  category: string;
  unit: string;
  totalQuantity: number;
  totalValue: number;
  purchaseCount: number;
  averagePrice: number;
  suppliers: string[];
}

interface TopPurchasedReport {
  limit: number;
  period: { startDate: string; endDate: string };
  totalItems: number;
  topPurchasedItems: TopPurchasedItem[];
  generatedAt: Date;
}

interface TopSoldProduct {
  itemId: string;
  itemName: string;
  category: string;
  type: string;
  size: string;
  color: string;
  price: number;
  imageUrl?: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

interface TopSoldReport {
  limit: number;
  period: { startDate: string; endDate: string };
  totalSoldItems: number;
  topSoldProducts: TopSoldProduct[];
  generatedAt: Date;
}

interface TopRequestedProduct {
  itemId: string;
  itemName: string;
  category: string;
  type: string;
  size: string;
  color: string;
  price: number;
  imageUrl?: string;
  totalRequestedQuantity: number;
  totalValue: number;
  piCount: number;
}

interface TopRequestedReport {
  limit: number;
  period: { startDate: string; endDate: string };
  source: string;
  totalRequestedItems: number;
  topRequestedProducts: TopRequestedProduct[];
  generatedAt: Date;
}

// Combined product performance interface
interface ProductPerformance {
  itemId: string;
  itemName: string;
  category: string;
  type: string;
  size: string;
  color: string;
  price: number;
  imageUrl?: string;
  totalSoldQuantity: number;
  totalRevenue: number;
  orderCount: number;
  totalRequestedQuantity: number;
  totalRequestedValue: number;
  piCount: number;
  demandGap: number; // Requested - Sold
  conversionRate: number; // Sold / Requested * 100
}

interface CombinedReportData {
  lowStockReport: LowStockReport;
  topPurchasedItemsReport: TopPurchasedReport;
  topSoldProductsReport: TopSoldReport;
  topRequestedProductsReport: TopRequestedReport;
  reportDate: Date;
  summary: {
    totalLowStockMaterials: number;
    criticalMaterials: number;
    warningMaterials: number;
    topPurchasedCount: number;
    topSoldCount: number;
    topRequestedCount: number;
  };
  insights?: {
    urgentRestockCount: number;
    needsAttentionCount: number;
    urgentMaterials: { id: string; name: string; stock: number; warningLevel: number }[];
  };
}

// ==================== Main Component ====================

const CombinedReportDashboard: React.FC = () => {
  // State
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(null);
  const [topItemsLimit, setTopItemsLimit] = useState<number>(10);
  const [reportData, setReportData] = useState<CombinedReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('lowStock');
  const [performanceSortBy, setPerformanceSortBy] = useState<'sold' | 'requested' | 'gap' | 'conversion'>('sold');

  const fetchReportData = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const data = await getCombinedReport({
        lowStockThreshold: lowStockThreshold === null ? undefined : lowStockThreshold,
        topItemsLimit,
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
  }, [startDate, endDate, lowStockThreshold, topItemsLimit]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

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

  const getStockBadgeVariant = (stock: number, warningLevel: number) => {
    if (stock === 0) return "destructive";
    if (stock <= warningLevel / 2) return "destructive";
    if (stock <= warningLevel) return "default";
    return "secondary";
  };

  const getMaterialTypeIcon = (material: LowStockMaterial) => {
    if (material.wood) return "🪵";
    if (material.metal) return "⚙️";
    if (material.accessory) return "🔧";
    return "📦";
  };

  const getConversionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Combine sold and requested products into performance report
  const getProductPerformanceReport = (): ProductPerformance[] => {
    if (!reportData) return [];

    const soldMap = new Map<string, TopSoldProduct>();
    const requestedMap = new Map<string, TopRequestedProduct>();

    // Map sold products
    reportData.topSoldProductsReport.topSoldProducts.forEach(product => {
      soldMap.set(product.itemId, product);
    });

    // Map requested products
    reportData.topRequestedProductsReport.topRequestedProducts.forEach(product => {
      requestedMap.set(product.itemId, product);
    });

    // Get all unique product IDs
    const allProductIds = new Set([...soldMap.keys(), ...requestedMap.keys()]);

    const performanceData: ProductPerformance[] = [];

    allProductIds.forEach(itemId => {
      const sold = soldMap.get(itemId);
      const requested = requestedMap.get(itemId);

      const totalSoldQuantity = sold?.totalQuantity || 0;
      const totalRequestedQuantity = requested?.totalRequestedQuantity || 0;
      const demandGap = totalRequestedQuantity - totalSoldQuantity;
      const conversionRate = totalRequestedQuantity > 0 
        ? (totalSoldQuantity / totalRequestedQuantity) * 100 
        : 0;

      performanceData.push({
        itemId,
        itemName: sold?.itemName || requested?.itemName || 'Unknown',
        category: sold?.category || requested?.category || 'Uncategorized',
        type: sold?.type || requested?.type || '',
        size: sold?.size || requested?.size || '',
        color: sold?.color || requested?.color || '',
        price: sold?.price || requested?.price || 0,
        imageUrl: sold?.imageUrl || requested?.imageUrl,
        totalSoldQuantity,
        totalRevenue: sold?.totalRevenue || 0,
        orderCount: sold?.orderCount || 0,
        totalRequestedQuantity,
        totalRequestedValue: requested?.totalValue || 0,
        piCount: requested?.piCount || 0,
        demandGap,
        conversionRate,
      });
    });

    // Sort based on selected criteria
    switch (performanceSortBy) {
      case 'sold':
        return performanceData.sort((a, b) => b.totalSoldQuantity - a.totalSoldQuantity);
      case 'requested':
        return performanceData.sort((a, b) => b.totalRequestedQuantity - a.totalRequestedQuantity);
      case 'gap':
        return performanceData.sort((a, b) => b.demandGap - a.demandGap);
      case 'conversion':
        return performanceData.sort((a, b) => b.conversionRate - a.conversionRate);
      default:
        return performanceData.sort((a, b) => b.totalSoldQuantity - a.totalSoldQuantity);
    }
  };

  // Chart data for performance comparison
  const getPerformanceChartData = () => {
    const performanceData = getProductPerformanceReport();
    return performanceData.slice(0, 8).map((item) => ({
      name: item.itemName.length > 20 ? item.itemName.substring(0, 20) + '...' : item.itemName,
      sold: item.totalSoldQuantity,
      requested: item.totalRequestedQuantity,
      gap: item.demandGap,
    }));
  };

  // Prepare chart data
  const getTopSoldChartData = () => {
    if (!reportData) return [];
    return reportData.topSoldProductsReport.topSoldProducts.slice(0, 8).map((item) => ({
      name: item.itemName.length > 20 ? item.itemName.substring(0, 20) + '...' : item.itemName,
      quantity: item.totalQuantity,
      revenue: item.totalRevenue,
    }));
  };

  const getTopPurchasedChartData = () => {
    if (!reportData) return [];
    return reportData.topPurchasedItemsReport.topPurchasedItems.slice(0, 8).map((item) => ({
      name: item.materialName.length > 20 ? item.materialName.substring(0, 20) + '...' : item.materialName,
      quantity: item.totalQuantity,
      value: item.totalValue,
    }));
  };

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

  const performanceData = getProductPerformanceReport();
  const performanceChartData = getPerformanceChartData();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Combined Business Report</h1>
          <p className="text-muted-foreground">
            Material stock alerts, top purchased materials, and product performance analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchReportData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          
            <div>
              <Label htmlFor="topItemsLimit">Top Items Limit</Label>
              <Input
                id="topItemsLimit"
                type="number"
                min="1"
                max="50"
                value={topItemsLimit}
                onChange={(e) => setTopItemsLimit(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Materials</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.summary.totalLowStockMaterials}
                </div>
                <div className="text-xs text-muted-foreground space-x-2">
                  <span className="text-red-600">Critical: {reportData.summary.criticalMaterials}</span>
                  <span>•</span>
                  <span className="text-yellow-600">Warning: {reportData.summary.warningMaterials}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Using {typeof reportData.lowStockReport.threshold === 'string' ? 'per-material thresholds' : `global threshold: ${reportData.lowStockReport.threshold}`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Top Purchased Materials</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.topPurchasedCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique materials purchased
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products Sold</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.topSoldCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique products with sales
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Products with Demand</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {performanceData.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceData.filter(p => p.demandGap > 0).length} have unmet demand
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Urgent Restock Alert */}
          {reportData.insights && reportData.insights.urgentRestockCount > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Urgent Restock Needed
                </CardTitle>
                <CardDescription className="text-red-600">
                  {reportData.insights.urgentRestockCount} materials are completely out of stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {reportData.insights.urgentMaterials.slice(0, 5).map((material) => (
                    <Badge key={material.id} variant="destructive">
                      {material.name}
                    </Badge>
                  ))}
                  {reportData.insights.urgentRestockCount > 5 && (
                    <Badge variant="outline">
                      +{reportData.insights.urgentRestockCount - 5} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lowStock">Low Stock Materials</TabsTrigger>
              <TabsTrigger value="purchased">Top Purchased</TabsTrigger>
              <TabsTrigger value="performance">Product Performance</TabsTrigger>
            </TabsList>

            {/* Low Stock Tab */}
            <TabsContent value="lowStock" className="space-y-6">
              {reportData.lowStockReport.lowStockMaterials.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <Package className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <h3 className="text-lg font-semibold">No Low Stock Materials</h3>
                    <p className="text-muted-foreground">
                      All materials are above their warning thresholds
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Low Stock Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Critical Stock (0 units)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {reportData.lowStockReport.lowStockMaterials.filter(m => m.totalStock === 0).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Below Half Threshold</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-500">
                          {reportData.lowStockReport.lowStockMaterials.filter(
                            m => m.totalStock > 0 && m.totalStock <= m.warningStockLevel / 2
                          ).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Near Threshold</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                          {reportData.lowStockReport.lowStockMaterials.filter(
                            m => m.totalStock > m.warningStockLevel / 2 && m.totalStock <= m.warningStockLevel
                          ).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Low Stock Materials Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Low Stock Materials</CardTitle>
                      <CardDescription>
                        Materials with stock ≤ their warning threshold
                        {typeof reportData.lowStockReport.threshold === 'number' && 
                          ` (Global threshold: ${reportData.lowStockReport.threshold})`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Material Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Current Stock</TableHead>
                              <TableHead>Warning Level</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Locations</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.lowStockReport.lowStockMaterials.map((material, idx) => (
                              <TableRow key={material.id}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <span>{getMaterialTypeIcon(material)}</span>
                                    {material.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{material.materialType}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Ruler className="h-3 w-3" />
                                    {material.size}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Palette className="h-3 w-3" />
                                    {material.color}
                                  </div>
                                </TableCell>
                                <TableCell>{material.unitOfMeasure}</TableCell>
                                <TableCell className="font-semibold">
                                  {formatNumber(material.totalStock)}
                                </TableCell>
                                <TableCell>{material.warningStockLevel}</TableCell>
                                <TableCell>
                                  <Badge variant={getStockBadgeVariant(material.totalStock, material.warningStockLevel)}>
                                    {material.totalStock === 0 ? 'Out of Stock' : 
                                     material.totalStock <= material.warningStockLevel / 2 ? 'Critical' : 'Low'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {material.locations.map((loc, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {loc.type}: {loc.quantity}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Top Purchased Tab */}
            <TabsContent value="purchased" className="space-y-6">
              {/* Top Purchased Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Purchased Materials by Quantity</CardTitle>
                  <CardDescription>
                    Period: {reportData.topPurchasedItemsReport.period.startDate} - {reportData.topPurchasedItemsReport.period.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getTopPurchasedChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip 
                          formatter={(value: any, name: string) => 
                            name === 'value' ? formatCurrency(value) : `${formatNumber(value)} units`
                          }
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="quantity" fill="#3b82f6" name="Quantity" />
                        <Bar yAxisId="right" dataKey="value" fill="#22c55e" name="Total Value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Purchased Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Purchased Materials</CardTitle>
                  <CardDescription>Most frequently purchased items from suppliers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Material Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Total Quantity</TableHead>
                          <TableHead>Total Value</TableHead>
                          <TableHead>Avg Price</TableHead>
                          <TableHead>Purchases</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.topPurchasedItemsReport.topPurchasedItems.map((item, idx) => (
                          <TableRow key={item.materialId}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getMedalIcon(idx)}
                                <span>#{idx + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.materialName}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{formatNumber(item.totalQuantity)} {item.unit}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(item.totalValue)}</TableCell>
                            <TableCell>{formatCurrency(item.averagePrice)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.purchaseCount} orders</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Combined Product Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Handshake className="h-5 w-5" />
                    Demand vs Sales Analysis
                  </CardTitle>
                  <CardDescription>
                    Compare requested quantity (from proforma invoices) vs actual sales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any, name: string) => {
                            if (name === 'gap') return `${formatNumber(Math.abs(value))} units`;
                            return `${formatNumber(value)} units`;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="requested" fill="#8b5cf6" name="Requested Quantity (PI)" />
                        <Bar dataKey="sold" fill="#22c55e" name="Actual Sold Quantity" />
                        <Bar dataKey="gap" fill="#ef4444" name="Unmet Demand" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sort Controls */}
              <div className="flex justify-end gap-2">
                <Button
                  variant={performanceSortBy === 'sold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPerformanceSortBy('sold')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Sort by Most Sold
                </Button>
                <Button
                  variant={performanceSortBy === 'requested' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPerformanceSortBy('requested')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Sort by Most Requested
                </Button>
             
              </div>

              {/* Combined Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Performance Analysis</CardTitle>
                  <CardDescription>
                    Comparison of requested vs sold quantities to identify demand gaps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Stock</TableHead>
                      
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceData.slice(0, topItemsLimit).map((product, idx) => (
                          <TableRow key={product.itemId}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getMedalIcon(idx)}
                                <span>#{idx + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.itemName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.category}</Badge>
                            </TableCell>
                            <TableCell>{product.size}</TableCell>
                            <TableCell className="text-purple-600 font-semibold">
                              {formatNumber(product.totalRequestedQuantity)} units
                              {product.piCount > 0 && (
                                <span className="text-xs text-muted-foreground block">
                                  ({product.piCount} PIs)
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-green-600 font-semibold">
                              {formatNumber(product.totalSoldQuantity)} units
                              {product.orderCount > 0 && (
                                <span className="text-xs text-muted-foreground block">
                                  ({product.orderCount} orders)
                                </span>
                              )}
                            </TableCell>
                        
                          </TableRow>
                        ))}
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

export default CombinedReportDashboard;