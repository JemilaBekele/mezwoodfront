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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Coffee,
  Download,
  RefreshCw,
  CreditCard,
  Banknote,
  Landmark,

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
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  AreaChart,
  Area,
} from 'recharts';
import { getInvoiceReport } from '@/service/expence';

// Types
interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  note: string | null;
  orderCode: string;
  customerName: string;
  createdBy: string | null;
}

interface PurchaseItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  height: number | null;
  width: number | null;
  unitOfMeasure: string;
}

interface Purchase {
  id: string;
  invoiceNo: string;
  supplierName: string;
  storeName: string;
  grandTotal: number;
  subTotal: number;
  purchaseDate: string;
  paymentStatus: string;
  notes: string | null;
  createdBy: string | null;
  totalProducts: number;
  items: PurchaseItem[];
}

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  createdBy: string | null;
}

interface ChartData {
  daily: any[];
  weekly: any[];
  monthly: any[];
  paymentMethods: any[];
  expenseCategories: any[];
  topSuppliers: any[];
  cumulativeProfit: any[];
  paymentTrends: any[];
  purchaseTrends: any[];
  profitMargins: any[];
  comparison: {
    labels: string[];
    datasets: {
      income: number[];
      expenses: number[];
      profit: number[];
    };
  };
  kpi: {
    averageDailyIncome: number;
    averageDailyExpense: number;
    profitMargin: number;
    bestDay: any;
    worstDay: any;
  };
}

interface ReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalPurchases: number;
    netProfit: number;
    startDate: string;
    endDate: string;
    paymentsByMethod: Record<string, number>;
    expensesByDate: Record<string, number>;
    counts: {
      totalPayments: number;
      totalPurchases: number;
      totalExpenses: number;
    };
  };
  curtainPayments: Payment[];
  purchases: Purchase[];
  expenses: Expense[];
  charts: ChartData;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const InvoiceReport: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await getInvoiceReport({ startDate, endDate });
      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownload = () => {
    if (!reportData) return;
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `invoice_report_${startDate}_to_${endDate}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Report downloaded');
  };

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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <Banknote className="h-4 w-4" />;
      case 'TELEBIRR': return <CreditCard className="h-4 w-4" />;
      case 'TRANSFER': return <Landmark className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-100 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Invoice Report</h1>
          <p className="text-muted-foreground">
            Financial report with payments, purchases, and expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchReport}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
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
            <Button onClick={fetchReport} className="h-10">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.summary.totalIncome)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {reportData.summary.counts.totalPayments} payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.summary.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {reportData.summary.counts.totalExpenses} expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(reportData.summary.totalPurchases)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {reportData.summary.counts.totalPurchases} purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${reportData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.summary.netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margin: {reportData.charts.kpi.profitMargin}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Info */}
             <Card>
  <CardHeader>
    <CardTitle>Report Summary</CardTitle>
    <CardDescription>
      {formatDate(reportData.summary.startDate)} -{' '}
      {formatDate(reportData.summary.endDate)}
    </CardDescription>
  </CardHeader>

  <CardContent>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      
      {/* Income */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/20">
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          Income
        </p>

        <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-300">
          {formatCurrency(reportData.summary.totalIncome)}
        </p>
      </div>

      {/* Expenses */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          Expenses + Purchases
        </p>

        <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
          {formatCurrency(
            reportData.summary.totalExpenses +
              reportData.summary.totalPurchases
          )}
        </p>
      </div>

      {/* Profit */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Net Profit
        </p>

        <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
          {formatCurrency(reportData.summary.netProfit)}
        </p>
      </div>

    </div>
  </CardContent>
</Card>

              {/* Monthly Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Financial Overview</CardTitle>
                  <CardDescription>Income vs Expenses vs Profit by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.charts.monthly}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthName" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="income" fill="#10b981" name="Income" />
                        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                        <Bar dataKey="purchases" fill="#f59e0b" name="Purchases" />
                        <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cumulative Profit Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Cumulative Profit Trend</CardTitle>
                  <CardDescription>Accumulated profit over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.charts.cumulativeProfit}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Area type="monotone" dataKey="cumulativeProfit" stroke="#8884d8" fill="#8884d8" name="Cumulative Profit" />
                        <Area type="monotone" dataKey="dailyProfit" stroke="#82ca9d" fill="#82ca9d" name="Daily Profit" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods & Expense Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Income distribution by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={reportData.charts.paymentMethods}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {reportData.charts.paymentMethods.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense Categories</CardTitle>
                    <CardDescription>Expense distribution by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={reportData.charts.expenseCategories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {reportData.charts.expenseCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Suppliers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Suppliers</CardTitle>
                  <CardDescription>Top 10 suppliers by purchase amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.charts.topSuppliers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="value" fill="#8884d8" name="Purchase Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Transactions
                  </CardTitle>
                  <CardDescription>
                    Total: {formatCurrency(reportData.summary.totalIncome)} from {reportData.summary.counts.totalPayments} payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Order Code</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Recorded By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.curtainPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>{payment.customerName}</TableCell>
                            <TableCell>{payment.orderCode}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getPaymentMethodIcon(payment.paymentMethod)}
                                <span>{payment.paymentMethod || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{payment.note || '-'}</TableCell>
                            <TableCell>{payment.createdBy || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="purchases" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Purchase Transactions
                  </CardTitle>
                  <CardDescription>
                    Total: {formatCurrency(reportData.summary.totalPurchases)} from {reportData.summary.counts.totalPurchases} purchases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.purchases.map((purchase) => (
                      <Card key={purchase.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">Invoice: {purchase.invoiceNo}</h3>
                            <p className="text-sm text-muted-foreground">
                              Supplier: {purchase.supplierName} | Store: {purchase.storeName}
                            </p>
                          </div>
                          <Badge variant={purchase.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                            {purchase.paymentStatus}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p>{formatDate(purchase.purchaseDate)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Grand Total</p>
                            <p className="font-medium text-orange-600">{formatCurrency(purchase.grandTotal)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Items</p>
                            <p>{purchase.totalProducts} products</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created By</p>
                            <p>{purchase.createdBy || '-'}</p>
                          </div>
                        </div>

                        {purchase.items.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium mb-2">Items:</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Quantity</TableHead>
                                  <TableHead>Unit Price</TableHead>
                                  <TableHead>Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {purchase.items.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>{item.quantity} {item.unitOfMeasure}</TableCell>
                                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        
                        {purchase.notes && (
                          <p className="text-sm text-muted-foreground mt-3">Note: {purchase.notes}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Expense Transactions
                  </CardTitle>
                  <CardDescription>
                    Total: {formatCurrency(reportData.summary.totalExpenses)} from {reportData.summary.counts.totalExpenses} expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                          <TableCell className="font-medium">{expense.title}</TableCell>
                          <TableCell>{expense.description || '-'}</TableCell>
                          <TableCell className="font-medium text-red-600">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>{expense.createdBy || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default InvoiceReport;