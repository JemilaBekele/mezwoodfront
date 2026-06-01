/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { WorkerPaymentApi, WorkerPaymentReport, WorkerPaymentFilters } from '@/service/work';
import { format, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export function WorkerPaymentDashboard() {
  const [startDate, setStartDate] = useState(() => format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [filters, setFilters] = useState<WorkerPaymentFilters>({
    includePaid: true,
    includeUnpaid: true,
    workerType: 'ALL',
  });
  const [reportData, setReportData] = useState<WorkerPaymentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WorkerPaymentApi.getWorkerPaymentReport(startDate, endDate, filters);
      setReportData(data);
    } catch (err) {
      setError('Failed to load worker payment report. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (measurementId: string, workerType: 'THIN' | 'THICK') => {
    try {
      await WorkerPaymentApi.markWorkerAsPaid(measurementId, workerType);
      toast.success('Worker payment marked as paid successfully');
      fetchReport();
    } catch (err) {
      toast.error('Failed to mark worker as paid');
    }
  };

  const handleExport = () => {
    if (!reportData) return;
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `worker-payment-report-${startDate}-to-${endDate}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Report exported successfully');
  };

  const handleApplyFilters = () => {
    fetchReport();
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({ includePaid: true, includeUnpaid: true, workerType: 'ALL' });
    setStartDate(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const getPaymentStatusColors = (isPaid: boolean) => {
    return isPaid
      ? {
          bg: 'bg-green-50 dark:bg-green-950/20',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-l-4 border-l-green-500',
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
          icon: CheckCircle,
          iconColor: 'text-green-600 dark:text-green-400',
        }
      : {
          bg: 'bg-red-50 dark:bg-red-950/20',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-l-4 border-l-red-500',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
          icon: XCircle,
          iconColor: 'text-red-600 dark:text-red-400',
        };
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const safeFormatDate = (date?: string | Date, pattern: string = 'PPP') => {
    const d = date ? new Date(date) : null;
    return d && isValid(d) ? format(d, pattern) : '-';
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center">Loading...</div>;
  if (error) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-red-600">Error Loading Data</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchReport} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    </div>
  );
  if (!reportData) return <div>No Data Available</div>;

  const { summary, workers, measurements } = reportData;

  return (
    <div className="@container/dashboard space-y-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Worker Payment Report</h1>
          <p className="text-muted-foreground">
            {safeFormatDate(reportData.dateRange?.start)} - {safeFormatDate(reportData.dateRange?.end)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={fetchReport}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

        {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Worker Type</label>
                <Select
                  value={filters.workerType}
                  onValueChange={(value: any) =>
                    setFilters({ ...filters, workerType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Workers</SelectItem>
                    <SelectItem value="THIN">Thin Workers</SelectItem>
                    <SelectItem value="THICK">Thick Workers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.includePaid}
                      onChange={(e) =>
                        setFilters({ ...filters, includePaid: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.includeUnpaid}
                      onChange={(e) =>
                        setFilters({ ...filters, includeUnpaid: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <span>Unpaid</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUniqueWorkers}</div>
            <p className="text-xs text-muted-foreground">
              {workers.thin.length} Thin · {workers.thick.length} Thick
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalWorkerAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Paid: {formatCurrency(summary.totalPaidAmount)} · Unpaid: {formatCurrency(summary.totalUnpaidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalWorkerJobs}</div>
            <p className="text-xs text-muted-foreground">
              Across {summary.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meters</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalWorkerMeters.toLocaleString()} m
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalMeasurements} measurements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="workers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workers">Workers Summary</TabsTrigger>
          <TabsTrigger value="measurements">All Measurements</TabsTrigger>
          <TabsTrigger value="thin">Thin Workers</TabsTrigger>
          <TabsTrigger value="thick">Thick Workers</TabsTrigger>
        </TabsList>

        {/* Workers Summary Tab */}
        <TabsContent value="workers" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Thin Workers */}
            <Card>
              <CardHeader>
                <CardTitle>Thin Workers</CardTitle>
                <CardDescription>
                  {workers.thin.length} workers · Total: {formatCurrency(summary.totalThinWorkerAmount)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Meters</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.thin.length > 0 ? (
                      workers.thin.map((worker) => {
                        const isFullyPaid = worker.paidAmount > 0 && worker.unpaidAmount === 0;
                        const isPartiallyPaid = worker.paidAmount > 0 && worker.unpaidAmount > 0;
                        const colors = getPaymentStatusColors(isFullyPaid);
                        const Icon = colors.icon;
                        
                        return (
                          <TableRow
                            key={worker.workerId}
                            className={`hover:bg-muted/50 ${colors.bg}`}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{worker.workerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {worker.workerPhone || 'No phone'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{worker.totalJobs}</TableCell>
                            <TableCell>{worker.totalMeters.toLocaleString()} m</TableCell>
                            <TableCell>{formatCurrency(worker.totalAmount)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${colors.iconColor}`} />
                                <span className={colors.text}>
                                  {isFullyPaid ? 'Fully Paid' : isPartiallyPaid ? 'Partial' : 'Unpaid'}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center">
                          No thin workers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Thick Workers */}
            <Card>
              <CardHeader>
                <CardTitle>Thick Workers</CardTitle>
                <CardDescription>
                  {workers.thick.length} workers · Total: {formatCurrency(summary.totalThickWorkerAmount)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Meters</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.thick.length > 0 ? (
                      workers.thick.map((worker) => {
                        const isFullyPaid = worker.paidAmount > 0 && worker.unpaidAmount === 0;
                        const isPartiallyPaid = worker.paidAmount > 0 && worker.unpaidAmount > 0;
                        const colors = getPaymentStatusColors(isFullyPaid);
                        const Icon = colors.icon;
                        
                        return (
                          <TableRow
                            key={worker.workerId}
                            className={`hover:bg-muted/50 ${colors.bg}`}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{worker?.workerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {worker?.workerPhone || 'No phone'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{worker.totalJobs}</TableCell>
                            <TableCell>{worker.totalMeters.toLocaleString()} m</TableCell>
                            <TableCell>{formatCurrency(worker.totalAmount)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${colors.iconColor}`} />
                                <span className={colors.text}>
                                  {isFullyPaid ? 'Fully Paid' : isPartiallyPaid ? 'Partial' : 'Unpaid'}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center">
                          No thick workers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Measurements Tab */}
        <TabsContent value="measurements">
          <Card>
            <CardHeader>
              <CardTitle>All Worker Measurements</CardTitle>
              <CardDescription>
                {measurements.length} individual worker assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Meters</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurements.length > 0 ? (
                    measurements.map((measurement, idx) => {
                      const colors = getPaymentStatusColors(measurement.isPaid);
                      const Icon = colors.icon;
                      
                      return (
                        <TableRow key={`${measurement.measurementId}-${idx}`} className={colors.bg}>
                          <TableCell className="font-medium">
                            {measurement.workerName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {measurement.workerType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {measurement.orderId.slice(-8)}
                          </TableCell>
                          <TableCell>{measurement.roomName}</TableCell>
                          <TableCell>{measurement.totalWorkerMeter} m</TableCell>
                          <TableCell>{formatCurrency(measurement.workerPrice)}</TableCell>
                          <TableCell>
                            <Badge className={colors.badge}>
                              <Icon className="mr-1 h-3 w-3" />
                              {measurement.isPaid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {measurement.paidDate ? format(new Date(measurement.paidDate), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {!measurement.isPaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(measurement.measurementId, measurement.workerType)}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center">
                        No measurements found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thin Workers Detail Tab */}
        <TabsContent value="thin">
          <Card>
            <CardHeader>
              <CardTitle>Thin Workers Detail</CardTitle>
              <CardDescription>
                Detailed job breakdown for thin workers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Meters</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.thin.length > 0 ? (
                    workers.thin.flatMap((worker) =>
                      worker.jobs.map((job, idx) => {
                        const colors = getPaymentStatusColors(job.paid);
                        const Icon = colors.icon;
                        
                        return (
                          <TableRow key={`${worker.workerId}-${idx}`} className={colors.bg}>
                            <TableCell className="font-medium">
                              {worker.workerName}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {job.orderId.slice(-8)}
                            </TableCell>
                            <TableCell>{job.roomName}</TableCell>
                            <TableCell>{job.productName || '-'}</TableCell>
                            <TableCell>{job.meter} m</TableCell>
                            <TableCell>{formatCurrency(job.amount)}</TableCell>
                            <TableCell>
                              <Badge className={colors.badge}>
                                <Icon className="mr-1 h-3 w-3" />
                                {job.paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {job.paidDate ? format(new Date(job.paidDate), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              {!job.paid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsPaid(job.measurementId, 'THIN')}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center">
                        No thin worker jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thick Workers Detail Tab */}
        <TabsContent value="thick">
          <Card>
            <CardHeader>
              <CardTitle>Thick Workers Detail</CardTitle>
              <CardDescription>
                Detailed job breakdown for thick workers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Meters</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.thick.length > 0 ? (
                    workers.thick.flatMap((worker) =>
                      worker.jobs.map((job, idx) => {
                        const colors = getPaymentStatusColors(job.paid);
                        const Icon = colors.icon;
                        
                        return (
                          <TableRow key={`${worker.workerId}-${idx}`} className={colors.bg}>
                            <TableCell className="font-medium">
                              {worker.workerName}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {job.orderId.slice(-8)}
                            </TableCell>
                            <TableCell>{job.roomName}</TableCell>
                            <TableCell>{job.productName || '-'}</TableCell>
                            <TableCell>{job.meter} m</TableCell>
                            <TableCell>{formatCurrency(job.amount)}</TableCell>
                            <TableCell>
                              <Badge className={colors.badge}>
                                <Icon className="mr-1 h-3 w-3" />
                                {job.paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {job.paidDate ? format(new Date(job.paidDate), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              {!job.paid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsPaid(job.measurementId, 'THICK')}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center">
                        No thick worker jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Total Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalPaidAmount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Unpaid Amount</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalUnpaidAmount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid Jobs</p>
              <p className="text-2xl font-bold">
                {summary.paidThinWorkers + summary.paidThickWorkers}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Unpaid Jobs</p>
              <p className="text-2xl font-bold">
                {summary.unpaidThinWorkers + summary.unpaidThickWorkers}
              </p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
            <div className="flex justify-between items-center">
              <span>
                Generated at {format(new Date(reportData.generatedAt), 'PPP p')}
              </span>
              <span>
                Generated by: {reportData.generatedBy}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
        <div className="flex justify-between items-center">
          <span>Generated at {safeFormatDate(reportData.generatedAt, 'PPP p')}</span>
          <span>Generated by: {reportData.generatedBy || '-'}</span>
        </div>
      </div>
    </div>
  );
}
