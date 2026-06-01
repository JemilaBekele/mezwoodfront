/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import {
  DollarSign,
  Home,
  Printer,
  Loader2,
  CreditCard,
  CheckCircle,
  Receipt,
  Wallet,
  Package,
  Calculator,

  UserCheck,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertModal } from '@/components/modal/alert-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { getUnpaidWorkerCommissionsReport, markWorkerCommissionAsPaid } from '@/service/workerCommission';

interface MeasurementDetail {
  logId: string;
  assignedWidth: number;
  assignedHeight: number;
  assignedQuantity: number;
  completedWidth: number;
  completedHeight: number;
  completedQuantity: number;
  totalArea: number;
  status: string;
  note: string;
  completedAt: string;
}

interface OriginalMeasurement {
  width: number;
  height: number;
  quantity: number;
  curtainSize: number | string;
  totalArea: number;
}

interface MeasurementCommission {
  measurementId: string;
  roomName: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  shopName?: string;
  commissionAmount: number;
  totalWorkerMeter?: number;
  workerBase?: number;
  percentage?: number;
  completedAt: string;
  measurementDetails: MeasurementDetail[];
  originalMeasurement: OriginalMeasurement;
  logs: any[];
}

interface WorkerCommissionData {
  workerId: string;
  workerName: string;
  workerType: 'THICK' | 'THIN';
  totalUnpaidAmount: number;
  totalMeasurementsCompleted: number;
  totalCurtainOrders: number;
  totalCurtainOrdersList: string[];
  measurements: MeasurementCommission[];
}

interface SummaryData {
  totalUnpaidAmount: number;
  totalWorkers: number;
  totalMeasurements: number;
  totalCurtainOrders: number;
  reportDate: string;
  percentageUsed?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    summary: SummaryData;
    workers: WorkerCommissionData[];
  };
}

interface WorkerCommissionReportProps {
  shopId: string;
}

const WorkerCommissionReport: React.FC<WorkerCommissionReportProps> = ({ shopId }) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [workers, setWorkers] = useState<WorkerCommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<WorkerCommissionData | null>(null);
  
  const [commissionPercentage, setCommissionPercentage] = useState<number>(2);
  
  // Multi-select states
  const [selectedThickWorkers, setSelectedThickWorkers] = useState<Set<string>>(new Set());
  const [selectedThinWorkers, setSelectedThinWorkers] = useState<Set<string>>(new Set());
  const [isBulkPaymentModalOpen, setIsBulkPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [filterWorkerType, setFilterWorkerType] = useState<'THICK' | 'THIN'>('THICK');
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWorkerDetailModalOpen, setIsWorkerDetailModalOpen] = useState(false);
  const [selectedWorkerForPayment, setSelectedWorkerForPayment] = useState<{
    workerId: string;
    workerName: string;
    workerType: string;
    amount: number;
  } | null>(null);

  // Separate workers by type
  const thickWorkers = workers.filter(w => w.workerType === 'THICK' && w.totalUnpaidAmount > 0);
  const thinWorkers = workers.filter(w => w.workerType === 'THIN' && w.totalUnpaidAmount > 0);

  // Calculate totals for selected workers
  const getSelectedTotalAmount = () => {
    let total = 0;
    selectedThickWorkers.forEach(workerId => {
      const worker = thickWorkers.find(w => w.workerId === workerId);
      if (worker) total += worker.totalUnpaidAmount;
    });
    selectedThinWorkers.forEach(workerId => {
      const worker = thinWorkers.find(w => w.workerId === workerId);
      if (worker) total += worker.totalUnpaidAmount;
    });
    return total;
  };

  const getSelectedCount = () => {
    return selectedThickWorkers.size + selectedThinWorkers.size;
  };

  const toggleThickWorker = (workerId: string) => {
    const newSet = new Set(selectedThickWorkers);
    if (newSet.has(workerId)) {
      newSet.delete(workerId);
    } else {
      newSet.add(workerId);
    }
    setSelectedThickWorkers(newSet);
  };

  const toggleThinWorker = (workerId: string) => {
    const newSet = new Set(selectedThinWorkers);
    if (newSet.has(workerId)) {
      newSet.delete(workerId);
    } else {
      newSet.add(workerId);
    }
    setSelectedThinWorkers(newSet);
  };

  const selectAllThick = () => {
    if (selectedThickWorkers.size === thickWorkers.length) {
      setSelectedThickWorkers(new Set());
    } else {
      setSelectedThickWorkers(new Set(thickWorkers.map(w => w.workerId)));
    }
  };

  const selectAllThin = () => {
    if (selectedThinWorkers.size === thinWorkers.length) {
      setSelectedThinWorkers(new Set());
    } else {
      setSelectedThinWorkers(new Set(thinWorkers.map(w => w.workerId)));
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        startDate,
        endDate,
        workerPercent: commissionPercentage,
      };
      
     
      
      const response: ApiResponse = await getUnpaidWorkerCommissionsReport(params);
      
      if (response.success && response.data) {
        setSummary(response.data.summary);
        setWorkers(response.data.workers || []);
      } else {
        setWorkers([]);
        setSummary(null);
      }
    } catch (error: any) {
      console.error('Error fetching worker commission data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch worker commission data');
      setWorkers([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, commissionPercentage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = () => {
    fetchData();
    // Clear selections when filters change
    setSelectedThickWorkers(new Set());
    setSelectedThinWorkers(new Set());
  };

  const handleViewWorkerDetails = (worker: WorkerCommissionData) => {
    setSelectedWorker(worker);
    setIsWorkerDetailModalOpen(true);
  };

  const handleMarkAsPaid = (worker: WorkerCommissionData) => {
    setSelectedWorkerForPayment({
      workerId: worker.workerId,
      workerName: worker.workerName,
      workerType: worker.workerType,
      amount: worker.totalUnpaidAmount
    });
    setIsPaymentModalOpen(true);
  };

  const handleBulkPayment = () => {
    if (getSelectedCount() === 0) {
      toast.error('Please select at least one worker to pay');
      return;
    }
    setIsBulkPaymentModalOpen(true);
  };

  const handleConfirmBulkPayment = async () => {
    setSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process Thick workers
      for (const workerId of selectedThickWorkers) {
        const worker = thickWorkers.find(w => w.workerId === workerId);
        if (worker) {
          try {
            for (const measurement of worker.measurements) {
              await markWorkerCommissionAsPaid({
                workerId: worker.workerId,
                workerType: 'THICK',
                measurementId: measurement.measurementId,
                amount: measurement.commissionAmount
              });
            }
            successCount++;
          } catch (error) {
            console.error(`Failed to pay thick worker ${worker.workerName}:`, error);
            errorCount++;
          }
        }
      }

      // Process Thin workers
      for (const workerId of selectedThinWorkers) {
        const worker = thinWorkers.find(w => w.workerId === workerId);
        if (worker) {
          try {
            for (const measurement of worker.measurements) {
              await markWorkerCommissionAsPaid({
                workerId: worker.workerId,
                workerType: 'THIN',
                measurementId: measurement.measurementId,
                amount: measurement.commissionAmount
              });
            }
            successCount++;
          } catch (error) {
            console.error(`Failed to pay thin worker ${worker.workerName}:`, error);
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully paid ${successCount} worker(s). Total: ${formatCurrency(getSelectedTotalAmount())}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to pay ${errorCount} worker(s)`);
      }

      setIsBulkPaymentModalOpen(false);
      setSelectedThickWorkers(new Set());
      setSelectedThinWorkers(new Set());
      fetchData();
    } catch (error: any) {
      console.error('Error in bulk payment:', error);
      toast.error(error.response?.data?.message || 'Failed to process bulk payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedWorkerForPayment) return;
    
    setSubmitting(true);
    try {
      const worker = workers.find(w => w.workerId === selectedWorkerForPayment.workerId);
      if (worker) {
        for (const measurement of worker.measurements) {
          await markWorkerCommissionAsPaid({
            workerId: selectedWorkerForPayment.workerId,
            workerType: selectedWorkerForPayment.workerType,
            measurementId: measurement.measurementId,
            amount: measurement.commissionAmount
          });
        }
      }
      
      toast.success(`Successfully paid ${formatCurrency(selectedWorkerForPayment.amount)} to ${selectedWorkerForPayment.workerName}`);
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error marking payment:', error);
      toast.error(error.response?.data?.message || 'Failed to mark payment');
    } finally {
      setSubmitting(false);
    }
  };

  const totalUnpaidAmount = workers.reduce((sum, w) => sum + (w.totalUnpaidAmount || 0), 0);
  const totalWorkersCount = workers.length;
  const totalMeasurementsCount = workers.reduce((sum, w) => sum + (w.totalMeasurementsCompleted || 0), 0);
  const totalCurtainOrdersCount = workers.reduce((sum, w) => sum + (w.totalCurtainOrders || 0), 0);

  if (loading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading worker commission report...</p>
      </div>
    );
  }

 return (
  <div className="container mx-auto space-y-6 p-4 md:p-8 bg-background text-foreground">

    {/* Header */}
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Worker Commission Report
        </h1>
        <p className="text-muted-foreground mt-1">
          Calculate and manage worker commissions based on totalWorkerMeter and percentage
        </p>
      </div>

      <Button onClick={() => window.print()} variant="outline">
        <Printer className="mr-2 h-4 w-4" />
        Print Report
      </Button>
    </div>

    {/* Main Payment Summary */}
    <Card
      className={`
        border-2 shadow-sm transition-colors
        ${
          totalUnpaidAmount > 0
            ? 'border-yellow-400/40 bg-card'
            : 'border-green-400/40 bg-card'
        }
      `}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DollarSign
            className={`h-6 w-6 ${
              totalUnpaidAmount > 0
                ? 'text-yellow-500'
                : 'text-green-500'
            }`}
          />

          <span className="text-foreground">Payment Summary</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">

          {/* Total Amount */}
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="mb-2 text-sm text-muted-foreground">
              Total Amount to Pay
            </p>

            <p
              className={`text-4xl font-bold ${
                totalUnpaidAmount > 0
                  ? 'text-yellow-500'
                  : 'text-green-500'
              }`}
            >
              {formatCurrency(totalUnpaidAmount)}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Based on {commissionPercentage}% commission rate
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-3">

            <div className="flex justify-between rounded-xl border border-border bg-card p-3">
              <span className="font-medium text-muted-foreground">
                Number of Workers:
              </span>
              <span className="font-bold text-foreground">
                {totalWorkersCount}
              </span>
            </div>

            <div className="flex justify-between rounded-xl border border-border bg-card p-3">
              <span className="font-medium text-muted-foreground">
                Total Measurements:
              </span>
              <span className="font-bold text-foreground">
                {totalMeasurementsCount}
              </span>
            </div>

            <div className="flex justify-between rounded-xl border border-border bg-card p-3">
              <span className="font-medium text-muted-foreground">
                Curtain Orders:
              </span>
              <span className="font-bold text-foreground">
                {totalCurtainOrdersCount}
              </span>
            </div>

            <div className="flex justify-between rounded-xl border border-border bg-card p-3">
              <span className="font-medium text-muted-foreground">
                Commission Rate:
              </span>
              <span className="font-bold text-foreground">
                {commissionPercentage}%
              </span>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>

    {/* Bulk Payment Bar */}
    {getSelectedCount() > 0 && (
      <Card className="bg-muted border border-border">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">

            <div className="flex items-center gap-4">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">
                {getSelectedCount()} worker(s) selected
              </span>
              <span className="text-lg font-bold text-primary">
                Total: {formatCurrency(getSelectedTotalAmount())}
              </span>
            </div>

            <Button className="bg-primary hover:bg-primary/90">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Selected Workers
            </Button>

          </div>
        </CardContent>
      </Card>
    )}

    {/* Filters */}
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-lg">Commission Settings & Filters</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">

          <div className="space-y-2">
            <Label>Worker Type</Label>
            <Select value={filterWorkerType} onValueChange={(v: any) => setFilterWorkerType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select worker type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THICK">Thick Curtain Workers</SelectItem>
                <SelectItem value="THIN">Thin Curtain Workers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Commission Percentage (%)</Label>
            <Input
              type="number"
              value={commissionPercentage}
              onChange={(e) => setCommissionPercentage(parseFloat(e.target.value) || 0)}
              className="font-bold"
            />
          </div>

        </div>

        <div className="mt-4 flex justify-end">
          <Button className="gap-2">
            <Calculator className="h-4 w-4" />
            Calculate Commission
          </Button>
        </div>
      </CardContent>
    </Card>

      {/* Thick Workers Section */}
   {/* Thick Workers Section */}
{thickWorkers.length > 0 && (
  <Card>
    <CardHeader className='bg-blue-50 dark:bg-blue-950/30'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <CardTitle className='text-lg flex items-center gap-2'>
          <Package className='h-5 w-5' />
          Thick Curtain Workers ({thickWorkers.length})
        </CardTitle>
        <Badge variant="default" className='text-sm'>
          Total: {formatCurrency(thickWorkers.reduce((sum, w) => sum + w.totalUnpaidAmount, 0))}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className='pt-4'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>Select</TableHead>
              <TableHead>Worker Name</TableHead>
              <TableHead>Measurements</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead className='text-right'>Amount to Pay</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thickWorkers.map((worker) => (
              <TableRow 
                key={worker.workerId} 
                className={
                  selectedThickWorkers.has(worker.workerId) 
                    ? 'bg-blue-50 dark:bg-blue-950/50' 
                    : ''
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedThickWorkers.has(worker.workerId)}
                    onCheckedChange={() => toggleThickWorker(worker.workerId)}
                  />
                </TableCell>
                <TableCell className='font-medium'>{worker.workerName}</TableCell>
                <TableCell>{worker.totalMeasurementsCompleted || 0}</TableCell>
                <TableCell>{worker.totalCurtainOrders || 0}</TableCell>
                <TableCell className='text-right font-bold'>
                  {formatCurrency(worker.totalUnpaidAmount || 0)}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewWorkerDetails(worker)}
                    >
                      <Receipt className='mr-2 h-4 w-4' />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(worker)}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    >
                      <CreditCard className='mr-2 h-4 w-4' />
                      Pay Now
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
)}

{/* Thin Workers Section */}
{thinWorkers.length > 0 && (
  <Card>
    <CardHeader className='bg-purple-50 dark:bg-purple-950/30'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <CardTitle className='text-lg flex items-center gap-2'>
          <Home className='h-5 w-5' />
          Thin Curtain Workers ({thinWorkers.length})
        </CardTitle>
        <Badge variant="secondary" className='text-sm'>
          Total: {formatCurrency(thinWorkers.reduce((sum, w) => sum + w.totalUnpaidAmount, 0))}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className='pt-4'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>Select</TableHead>
              <TableHead>Worker Name</TableHead>
              <TableHead>Measurements</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead className='text-right'>Amount to Pay</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thinWorkers.map((worker) => (
              <TableRow 
                key={worker.workerId} 
                className={
                  selectedThinWorkers.has(worker.workerId) 
                    ? 'bg-purple-50 dark:bg-purple-950/50' 
                    : ''
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedThinWorkers.has(worker.workerId)}
                    onCheckedChange={() => toggleThinWorker(worker.workerId)}
                  />
                </TableCell>
                <TableCell className='font-medium'>{worker.workerName}</TableCell>
                <TableCell>{worker.totalMeasurementsCompleted || 0}</TableCell>
                <TableCell>{worker.totalCurtainOrders || 0}</TableCell>
                <TableCell className='text-right font-bold'>
                  {formatCurrency(worker.totalUnpaidAmount || 0)}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewWorkerDetails(worker)}
                    >
                      <Receipt className='mr-2 h-4 w-4' />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(worker)}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    >
                      <CreditCard className='mr-2 h-4 w-4' />
                      Pay Now
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
)}

{/* No Workers Message */}
{thickWorkers.length === 0 && thinWorkers.length === 0 && workers.length > 0 && (
  <Card>
    <CardContent className='py-8 text-center'>
      <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-3' />
      <p className='text-muted-foreground'>All workers have been paid for the selected period.</p>
    </CardContent>
  </Card>
)}

{workers.length === 0 && (
  <Card>
    <CardContent className='py-12 text-center'>
      <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
      <h3 className='text-lg font-semibold mb-2'>No Payments Due</h3>
      <p className='text-muted-foreground'>
        All worker commissions have been paid for the selected period.
      </p>
    </CardContent>
  </Card>
)}
      {/* Worker Details Modal */}
      <Modal
        isOpen={isWorkerDetailModalOpen}
        onClose={() => setIsWorkerDetailModalOpen(false)}
        title={`Payment Details - ${selectedWorker?.workerName || ''}`}
        description={`Amount to pay: ${formatCurrency(selectedWorker?.totalUnpaidAmount || 0)}`}
        size="xl"
      >
        {selectedWorker && (
          <div className='space-y-6 py-4'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-6 text-center'>
              <p className='text-sm text-muted-foreground mb-2'>Total Amount to Pay</p>
              <p className='text-4xl font-bold text-green-600'>
                {formatCurrency(selectedWorker.totalUnpaidAmount)}
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                {selectedWorker.workerType === 'THICK' ? 'Thick Curtain' : 'Thin Curtain'} Worker
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-md'>Commission Calculation Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {selectedWorker.measurements.map((measurement, idx) => (
                    <div key={idx} className='border-b pb-3 last:border-0'>
                      <p className='font-semibold'>{measurement.roomName || 'Room'} - Order: {measurement.orderNumber?.slice(-8)}</p>
                      <div className='grid grid-cols-3 gap-2 mt-2 text-sm'>
                        <div>
                          <p className='text-muted-foreground'>Total Worker Meter</p>
                          <p className='font-medium'>{measurement.totalWorkerMeter || 0} m</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground'>Worker Base (÷2)</p>
                          <p className='font-medium'>{measurement.workerBase || (measurement.totalWorkerMeter || 0) / 2} m</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground'>Commission ({measurement.percentage || commissionPercentage}%)</p>
                          <p className='font-medium text-green-600'>{formatCurrency(measurement.commissionAmount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="measurements">
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
              
              <TabsContent value="measurements" className='space-y-4'>
                {selectedWorker.measurements.map((measurement) => (
                  <Card key={measurement.measurementId}>
                    <CardHeader>
                      <CardTitle className='text-sm'>{measurement.roomName}</CardTitle>
                      <p className='text-xs text-muted-foreground'>Customer: {measurement.customerName} | Shop: {measurement.shopName}</p>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <div>
                          <p className='text-muted-foreground'>Original Size</p>
                          <p>{measurement.originalMeasurement?.width}m x {measurement.originalMeasurement?.height}m</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground'>Completed</p>
                          <p>{measurement.measurementDetails[0]?.completedWidth}m x {measurement.measurementDetails[0]?.completedHeight}m</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardContent className='pt-4'>
                    {selectedWorker.totalCurtainOrdersList.map((orderId) => (
                      <div key={orderId} className='border-b py-2'>
                        <p className='font-medium'>Order ID: {orderId.slice(-8)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Modal>

      {/* Single Payment Confirmation Modal */}
      <AlertModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
        loading={submitting}
        title="Confirm Payment"
        description={`Pay ${formatCurrency(selectedWorkerForPayment?.amount || 0)} to ${selectedWorkerForPayment?.workerName}?`}
        confirmText="Confirm Payment"
        cancelText="Cancel"
        variant="default"
      />

      {/* Bulk Payment Confirmation Modal */}
      <AlertModal
        isOpen={isBulkPaymentModalOpen}
        onClose={() => setIsBulkPaymentModalOpen(false)}
        onConfirm={handleConfirmBulkPayment}
        loading={submitting}
        title="Confirm Bulk Payment"
        description={`Pay ${formatCurrency(getSelectedTotalAmount())} to ${getSelectedCount()} selected worker(s)? This action cannot be undone.`}
        confirmText="Confirm Bulk Payment"
        cancelText="Cancel"
        variant="default"
      />
    </div>
  );
};

export default WorkerCommissionReport;