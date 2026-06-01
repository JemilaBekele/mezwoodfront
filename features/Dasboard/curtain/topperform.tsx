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

  DollarSign,
  RefreshCw,
  Crown,
  Medal,
  Star,
  Scissors,
  Factory,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getTopPerformersDashboard,

} from '@/service/workerCommission';
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

// Types
interface Product {
  id: string;
  name: string;
  type: string;
  quantity: number;
  revenue: number;
  meters: number;
}

interface Tailor {
  id: string;
  name: string;
  email: string;
  totalMeters: number;
  totalWorkerMeter: number;
  totalOrders: number;
  totalEarnings: number;
  thickMeters: number;
  thinMeters: number;
}

interface WorkerPerformance {
  id: string;
  name: string;
  email: string;
  totalWidthAssigned: number;
  totalWidthCompleted: number;
  totalHeightAssigned: number;
  totalHeightCompleted: number;
  totalQuantityAssigned: number;
  totalQuantityCompleted: number;
  widthCompletionRate: number;
  logsCount: number;
}

interface TopProductsData {
  topByQuantity: Product[];
  topByRevenue: Product[];
  topByMeters: Product[];
  summary: {
    totalProductsSold: number;
    totalRevenue: number;
    uniqueProducts: number;
  };
}

interface TopTailorsData {
  topByTotalMeters: Tailor[];
  topByWorkerMeter: Tailor[];
  topByEarnings: Tailor[];
  topByOrders: Tailor[];
  summary: {
    totalTailors: number;
    totalMetersAllTailors: number;
    totalEarningsAllTailors: number;
    totalOrdersAllTailors: number;
  };
}

interface WorkerPerformanceData {
  topByWidthCompleted: WorkerPerformance[];
  topByCompletionRate: WorkerPerformance[];
  summary: {
    totalWorkers: number;
    totalWidthCompleted: number;
    totalQuantityCompleted: number;
    totalLogs: number;
  };
}

interface DashboardData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  products: TopProductsData;
  tailors: TopTailorsData;
  workerPerformance: WorkerPerformanceData;
  additionalMetrics: {
    totalOrders: number;
    totalCustomers: number;
  };
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

const TopPerformersDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const fetchDashboardData = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await getTopPerformersDashboard({ startDate, endDate });
      setDashboardData(response.data);
      toast.success('Dashboard data refreshed');
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Top Performers Dashboard</h1>
          <p className="text-muted-foreground">
            Track best selling products, top tailors, and worker performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filter - Single instance for entire dashboard */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-37.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-37.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchDashboardData} className="h-10">
              Apply Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashboardData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboardData.products.summary.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {dashboardData.products.summary.totalProductsSold} products sold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.additionalMetrics.totalOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.additionalMetrics.totalCustomers} unique customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tailor Performance</CardTitle>
                <Scissors className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.tailors.summary.totalMetersAllTailors.toFixed(0)} m
                </div>
                <p className="text-xs text-muted-foreground">
                  By {dashboardData.tailors.summary.totalTailors} tailors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Worker Completion</CardTitle>
                <Factory className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.workerPerformance.summary.totalWidthCompleted.toFixed(0)} m
                </div>
                <p className="text-xs text-muted-foreground">
                  From {dashboardData.workerPerformance.summary.totalLogs} logs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Top Products</TabsTrigger>
              <TabsTrigger value="tailors">Top Tailors</TabsTrigger>
              <TabsTrigger value="workers">Worker Performance</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              {/* Product Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.products.topByQuantity.slice(0, 5).map((product, idx) => (
                        <div key={product.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-50">{product.name}</span>
                          </div>
                          <span className="font-semibold">{product.quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.products.topByRevenue.slice(0, 5).map((product, idx) => (
                        <div key={product.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-50">{product.name}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(product.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Meters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.products.topByMeters.slice(0, 5).map((product, idx) => (
                        <div key={product.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-50">{product.name}</span>
                          </div>
                          <span className="font-semibold">{product.meters.toFixed(0)} m</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products by Revenue</CardTitle>
                  <CardDescription>Highest revenue generating products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.products.topByRevenue.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                        <Bar yAxisId="right" dataKey="quantity" fill="#82ca9d" name="Quantity" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Full Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Products Summary</CardTitle>
                  <CardDescription>Complete list of products sold</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Meters</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.products.topByRevenue.map((product, idx) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getMedalIcon(idx)}
                                <span>#{idx + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.type}</Badge>
                            </TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(product.revenue)}</TableCell>
                            <TableCell>{product.meters > 0 ? `${product.meters.toFixed(0)} m` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tailors Tab */}
            <TabsContent value="tailors" className="space-y-6">
              {/* Tailor Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Total Meters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.tailors.topByTotalMeters.slice(0, 5).map((tailor, idx) => (
                        <div key={tailor.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-45">{tailor.name}</span>
                          </div>
                          <span className="font-semibold">{tailor.totalMeters.toFixed(0)} m</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Worker Meter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.tailors.topByWorkerMeter.slice(0, 5).map((tailor, idx) => (
                        <div key={tailor.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-45">{tailor.name}</span>
                          </div>
                          <span className="font-semibold">{tailor.totalWorkerMeter.toFixed(0)} m</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.tailors.topByEarnings.slice(0, 5).map((tailor, idx) => (
                        <div key={tailor.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-45">{tailor.name}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(tailor.totalEarnings)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.tailors.topByOrders.slice(0, 5).map((tailor, idx) => (
                        <div key={tailor.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-45">{tailor.name}</span>
                          </div>
                          <span className="font-semibold">{tailor.totalOrders} orders</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tailor Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Tailor Performance Comparison</CardTitle>
                  <CardDescription>Top tailors by total meters and earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.tailors.topByTotalMeters.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalMeters" fill="#8884d8" name="Total Meters" />
                        <Bar yAxisId="right" dataKey="totalEarnings" fill="#82ca9d" name="Earnings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Full Tailors Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Tailors Performance</CardTitle>
                  <CardDescription>Complete list of tailors and their metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Tailor Name</TableHead>
                          <TableHead>Total Meters</TableHead>
                          <TableHead>Worker Meter</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Earnings</TableHead>
                          <TableHead>Thick/Thin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.tailors.topByTotalMeters.map((tailor, idx) => (
                          <TableRow key={tailor.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getMedalIcon(idx)}
                                <span>#{idx + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{tailor.name}</TableCell>
                            <TableCell>{tailor.totalMeters.toFixed(0)} m</TableCell>
                            <TableCell>{tailor.totalWorkerMeter.toFixed(0)} m</TableCell>
                            <TableCell>{tailor.totalOrders}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(tailor.totalEarnings)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                T: {tailor.thickMeters.toFixed(0)} / N: {tailor.thinMeters.toFixed(0)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Worker Performance Tab */}
            <TabsContent value="workers" className="space-y-6">
              {/* Worker Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Width Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.workerPerformance.topByWidthCompleted.slice(0, 5).map((worker, idx) => (
                        <div key={worker.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-50">{worker.name}</span>
                          </div>
                          <span className="font-semibold">{worker.totalWidthCompleted.toFixed(0)} m</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top by Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData.workerPerformance.topByCompletionRate.slice(0, 5).map((worker, idx) => (
                        <div key={worker.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx)}
                            <span className="text-sm truncate max-w-50">{worker.name}</span>
                          </div>
                          <span className="font-semibold">{worker.widthCompletionRate}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Worker Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Worker Completion Performance</CardTitle>
                  <CardDescription>Assigned vs Completed meters by worker</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.workerPerformance.topByWidthCompleted.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalWidthAssigned" fill="#ffc658" name="Assigned (m)" />
                        <Bar dataKey="totalWidthCompleted" fill="#0088FE" name="Completed (m)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Full Workers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Workers Performance</CardTitle>
                  <CardDescription>Complete list of workers and their completion metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Worker Name</TableHead>
                          <TableHead>Assigned (m)</TableHead>
                          <TableHead>Completed (m)</TableHead>
                          <TableHead>Completion Rate</TableHead>
                          <TableHead>Logs Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.workerPerformance.topByWidthCompleted.map((worker, idx) => (
                          <TableRow key={worker.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getMedalIcon(idx)}
                                <span>#{idx + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{worker.name}</TableCell>
                            <TableCell>{worker.totalWidthAssigned.toFixed(0)} m</TableCell>
                            <TableCell>{worker.totalWidthCompleted.toFixed(0)} m</TableCell>
                            <TableCell>
                              <Badge variant={worker.widthCompletionRate >= 100 ? "default" : "secondary"}>
                                {worker.widthCompletionRate}%
                              </Badge>
                            </TableCell>
                            <TableCell>{worker.logsCount}</TableCell>
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

export default TopPerformersDashboard;