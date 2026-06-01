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
import { getLowStockAlerts } from '@/service/invarelDash';
import { AlertTriangle, Package, Search, Filter, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LowStockProduct {
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number;
  warningQuantity: number;
  unitOfMeasure: string;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK';
}

type SortField = 'productName' | 'productCode' | 'currentStock' | 'warningQuantity' | 'status';
type SortOrder = 'asc' | 'desc';

export function LowStockPage() {
  const [lowStockData, setLowStockData] = useState<LowStockProduct[]>([]);
  const [filteredData, setFilteredData] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK'>('ALL');
  const [sortField, setSortField] = useState<SortField>('currentStock');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getLowStockAlerts();
      const products = response?.lowStockProducts || [];
      setLowStockData(products);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching low stock data:', err);
      setError('Failed to load low stock data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...lowStockData];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.productName.toLowerCase().includes(term) ||
          item.productCode.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === 'currentStock' || sortField === 'warningQuantity') {
        aVal = a[sortField];
        bVal = b[sortField];
      } else if (sortField === 'status') {
        // Sort by status priority: OUT_OF_STOCK first then LOW_STOCK
        const statusOrder = { 'OUT_OF_STOCK': 0, 'LOW_STOCK': 1 };
        aVal = statusOrder[a.status];
        bVal = statusOrder[b.status];
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredData(filtered);
  }, [lowStockData, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Helper function to get stock alert colors
  const getStockAlertStyles = (item: LowStockProduct) => {
    if (item.currentStock === 0) {
      return {
        rowBg: 'bg-red-50 dark:bg-red-950/30',
        textColor: 'text-red-700 dark:text-red-300',
        badgeBg: 'bg-red-100 dark:bg-red-900/50',
        badgeText: 'text-red-800 dark:text-red-300',
        statusLabel: 'Out of Stock',
        progressColor: 'bg-red-500',
        iconColor: 'text-red-600'
      };
    }
    
    const percentage = (item.currentStock / item.warningQuantity) * 100;
    if (percentage <= 25) {
      return {
        rowBg: 'bg-red-50 dark:bg-red-950/20',
        textColor: 'text-red-700 dark:text-red-300',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-300',
        statusLabel: 'Critical',
        progressColor: 'bg-red-500',
        iconColor: 'text-red-500'
      };
    } else if (percentage <= 50) {
      return {
        rowBg: 'bg-amber-50 dark:bg-amber-950/20',
        textColor: 'text-amber-700 dark:text-amber-300',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
        badgeText: 'text-amber-800 dark:text-amber-300',
        statusLabel: 'Low',
        progressColor: 'bg-amber-500',
        iconColor: 'text-amber-500'
      };
    } else {
      return {
        rowBg: 'bg-yellow-50 dark:bg-yellow-950/20',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        badgeText: 'text-yellow-800 dark:text-yellow-300',
        statusLabel: 'Warning',
        progressColor: 'bg-yellow-500',
        iconColor: 'text-yellow-500'
      };
    }
  };

  const outOfStockCount = lowStockData.filter(item => item.status === 'OUT_OF_STOCK').length;
  const criticalCount = lowStockData.filter(item => 
    item.status === 'LOW_STOCK' && (item.currentStock / item.warningQuantity) * 100 <= 25
  ).length;
  const lowCount = lowStockData.filter(item => {
    if (item.status === 'LOW_STOCK') {
      const percentage = (item.currentStock / item.warningQuantity) * 100;
      return percentage > 25 && percentage <= 50;
    }
    return false;
  }).length;
  const warningCount = lowStockData.filter(item => {
    if (item.status === 'LOW_STOCK') {
      const percentage = (item.currentStock / item.warningQuantity) * 100;
      return percentage > 50;
    }
    return false;
  }).length;

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading low stock inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold text-red-600">Error Loading Data</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Low Stock Inventory
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage products with stock levels below warning thresholds
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockData.length}</p>
              </div>
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                <Package className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500 dark:border-red-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500 dark:border-amber-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical (&lt;25%)</p>
                <p className="text-2xl font-bold text-amber-600">{criticalCount}</p>
              </div>
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low / Warning</p>
                <p className="text-2xl font-bold">{lowCount + warningCount}</p>
                <p className="text-xs text-muted-foreground">
                  {lowCount} low · {warningCount} warning
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Products Below Warning Level
          </CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {lowStockData.length} products
            {lastUpdated && (
              <span className="ml-2 text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer text-lg font-semibold"
                    onClick={() => handleSort('productName')}
                  >
                    <div className="flex items-center gap-1">
                      Product Name
                      {getSortIcon('productName')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-lg font-semibold"
                    onClick={() => handleSort('productCode')}
                  >
                    <div className="flex items-center gap-1">
                      Product Code
                      {getSortIcon('productCode')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-lg font-semibold"
                    onClick={() => handleSort('currentStock')}
                  >
                    <div className="flex items-center gap-1">
                      Current Stock
                      {getSortIcon('currentStock')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-lg font-semibold"
                    onClick={() => handleSort('warningQuantity')}
                  >
                    <div className="flex items-center gap-1">
                      Warning Level
                      {getSortIcon('warningQuantity')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-lg font-semibold"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => {
                    const styles = getStockAlertStyles(item);
                    const percentage = item.currentStock > 0 
                      ? Math.round((item.currentStock / item.warningQuantity) * 100)
                      : 0;
                    
                    return (
                      <TableRow
                        key={item.productId}
                        className={`hover:bg-muted/50 ${styles.rowBg}`}
                      >
                        <TableCell className={`py-3 text-base font-medium ${styles.textColor}`}>
                          {item.productName}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${styles.textColor}`}>
                          {item.productCode}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${styles.textColor}`}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">
                                {item.currentStock} {item.unitOfMeasure}
                              </span>
                              {item.currentStock === 0 && (
                                <AlertTriangle className={`h-4 w-4 ${styles.iconColor}`} />
                              )}
                            </div>
                            {item.currentStock > 0 && (
                              <div className="w-32">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                  <div 
                                    className={`h-full ${styles.progressColor}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`py-3 text-base ${styles.textColor}`}>
                          {item.warningQuantity} {item.unitOfMeasure}
                        </TableCell>
                        <TableCell className={`py-3 text-base ${styles.textColor}`}>
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles.badgeBg} ${styles.badgeText}`}>
                              {styles.statusLabel}
                            </span>
                            {item.currentStock > 0 && (
                              <span className="text-xs opacity-70">
                                {percentage}% of warning level
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No low stock items found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm || statusFilter !== 'ALL' 
                            ? 'Try adjusting your filters' 
                            : 'All products are above their warning levels'}
                        </p>
                        {(searchTerm || statusFilter !== 'ALL') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('ALL');
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export/Print Actions */}
      {filteredData.length > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => {
              const csv = [
                ['Product Name', 'Product Code', 'Current Stock', 'Unit', 'Warning Level', 'Status', 'Percentage of Warning'],
                ...filteredData.map(item => {
                  const percentage = item.currentStock > 0 
                    ? Math.round((item.currentStock / item.warningQuantity) * 100)
                    : 0;
                  return [
                    item.productName,
                    item.productCode,
                    item.currentStock,
                    item.unitOfMeasure,
                    item.warningQuantity,
                    item.status === 'OUT_OF_STOCK' ? 'Out of Stock' : 
                      (percentage <= 25 ? 'Critical' : (percentage <= 50 ? 'Low' : 'Warning')),
                    `${percentage}%`
                  ];
                })
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `low-stock-report-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export to CSV
          </Button>
        </div>
      )}
    </div>
  );
}