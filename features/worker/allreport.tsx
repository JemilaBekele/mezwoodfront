/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, User, Hash, Calendar, Package, Home, Users, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWorkerDetailedReport } from '@/service/workerCommission';
import { toast } from 'sonner';
import { getAllEmploy } from '@/service/employee';

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

interface Log {
  logId: string;
  assignedWidth: number;
  assignedHeight: number;
  assignedQuantity: number;
  completedAt: string;
}

interface DetailedMeasurement {
  measurementId: string;
  roomName: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  shopName?: string;
  completedDate: string;
  totalWorkerMeter: number;
  measurementDetails: MeasurementDetail[];
  originalMeasurement: OriginalMeasurement;
  logs: Log[];
}

interface DetailedWorkerData {
  worker: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  workerType: 'THICK' | 'THIN';
  summary: {
    totalMeasurements: number;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  };
  measurements: DetailedMeasurement[];
}

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

const WorkerReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<DetailedWorkerData | null>(null);
  
  const [workerType, setWorkerType] = useState<'THICK' | 'THIN'>('THICK');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Fetch all workers on component mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const data = await getAllEmploy();
      const workersList = Array.isArray(data) ? data : [];
      setWorkers(workersList);
    } catch (error: any) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to fetch workers list');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleViewWorkerDetails = async () => {
    if (!selectedWorkerId) {
      toast.error('Please select a worker');
      return;
    }

    try {
      setLoading(true);
      const response = await getWorkerDetailedReport({
        workerId: selectedWorkerId,
        workerType,
        startDate,
        endDate,
      });
      
      if (response.success && response.data) {
        setSelectedWorker(response.data);
      } else {
        toast.error(response.message || 'No data found for this worker');
        setSelectedWorker(null);
      }
    } catch (error: any) {
      console.error('Error fetching worker details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch worker details');
      setSelectedWorker(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Get selected worker name for display
  const getSelectedWorkerName = () => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    return worker ? worker.name : '';
  };

  if (loadingWorkers) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading workers list...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header */}
      <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <User className='h-8 w-8' />
            Worker Detailed Report
          </h1>
          <p className='text-muted-foreground mt-1'>
            View detailed work reports for thick and thin curtain workers
          </p>
        </div>
        {selectedWorker && (
          <Button onClick={handlePrint} variant="outline">
            <Printer className='mr-2 h-4 w-4' />
            Print Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='space-y-2'>
              <Label>Select Worker</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Worker Type</Label>
              <Select value={workerType} onValueChange={(v: any) => setWorkerType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THICK">Thick Curtain Worker</SelectItem>
                  <SelectItem value="THIN">Thin Curtain Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className='space-y-2'>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className='space-y-2'>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className='mt-4 flex justify-end'>
            <Button 
              onClick={handleViewWorkerDetails} 
              className="gap-2"
              disabled={loading || !selectedWorkerId}
            >
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Calendar className='h-4 w-4' />
              )}
              {loading ? 'Loading...' : 'View Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No Worker Selected State */}
      {!selectedWorkerId && !selectedWorker && (
        <Card>
          <CardContent className='py-12 text-center'>
            <Users className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Select a Worker</h3>
            <p className='text-muted-foreground'>
              Please select a worker from the dropdown above to view their detailed work report.
            </p>
            {workers.length === 0 && (
              <p className='text-sm text-red-500 mt-2'>
                No workers found in the system.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search executed but no data */}
      {selectedWorkerId && !selectedWorker && !loading && (
        <Card>
          <CardContent className='py-12 text-center'>
            <AlertCircle className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No Data Found</h3>
            <p className='text-muted-foreground'>
              No work records found for {getSelectedWorkerName()} in the selected date range.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Worker Report Content - Displayed directly on page */}
      {selectedWorker && (
        <div className='space-y-6'>
          {/* Worker Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <User className='h-4 w-4' />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Name:</span>
                    <span className='font-medium'>{selectedWorker.worker.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Email:</span>
                    <span>{selectedWorker.worker.email || 'N/A'}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Phone:</span>
                    <span>{selectedWorker.worker.phone || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <Package className='h-4 w-4' />
                  Work Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Total Measurements:</span>
                    <span className='font-bold'>{selectedWorker.summary.totalMeasurements}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Worker Type:</span>
                    <Badge variant={selectedWorker.workerType === 'THICK' ? 'default' : 'secondary'}>
                      {selectedWorker.workerType === 'THICK' ? 'Thick Curtain' : 'Thin Curtain'}
                    </Badge>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Report Period:</span>
                    <span className='text-sm'>
                      {selectedWorker.summary.dateRange?.startDate 
                        ? new Date(selectedWorker.summary.dateRange.startDate).toLocaleDateString() 
                        : 'N/A'} 
                      {' to '}
                      {selectedWorker.summary.dateRange?.endDate 
                        ? new Date(selectedWorker.summary.dateRange.endDate).toLocaleDateString() 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Measurements Table */}
          <Card>
            <CardHeader>
              <CardTitle className='text-md flex items-center gap-2'>
                <Hash className='h-4 w-4' />
                Measurements ({selectedWorker.measurements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room / Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Total Meter</TableHead>
                      <TableHead>Completed Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedWorker.measurements.length > 0 ? (
                      selectedWorker.measurements.map((measurement) => (
                        <TableRow key={measurement.measurementId}>
                          <TableCell>
                            <div>
                              <p className='font-medium'>{measurement.roomName || 'N/A'}</p>
                            
                            </div>
                          </TableCell>
                          <TableCell>{measurement.customerName || 'N/A'}</TableCell>
                          <TableCell>{measurement.shopName || 'N/A'}</TableCell>
                          <TableCell>{measurement.totalWorkerMeter || 0} m</TableCell>
                          <TableCell className='text-sm'>
                            {new Date(measurement.completedDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center py-8'>
                          <p className='text-muted-foreground'>No measurements found for this worker in the selected period</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed View Tabs - Only show if there are measurements */}
          {selectedWorker.measurements.length > 0 && (
            <Tabs defaultValue="details">
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="details">Measurement Details</TabsTrigger>
                <TabsTrigger value="logs">Worker Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className='space-y-4'>
                {selectedWorker.measurements.map((measurement) => (
                  <Card key={measurement.measurementId}>
                    <CardHeader>
                      <CardTitle className='text-sm'>
                        {measurement.roomName} 
                      </CardTitle>
                      <p className='text-xs text-muted-foreground'>
                        Customer: {measurement.customerName || 'N/A'} | Shop: {measurement.shopName || 'N/A'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <p className='text-sm font-medium mb-2'>Original Measurement</p>
                          <div className='space-y-1 text-sm'>
                            <p>Width: {measurement.originalMeasurement?.width || 0} m</p>
                            <p>Height: {measurement.originalMeasurement?.height || 0} m</p>
                            <p>Quantity: {measurement.originalMeasurement?.quantity || 0}</p>
                            <p>Curtain Size: {measurement.originalMeasurement?.curtainSize || 'N/A'}</p>
                            <p>Total Area: {measurement.originalMeasurement?.totalArea || 0} m²</p>
                          </div>
                        </div>
                        <div>
                          <p className='text-sm font-medium mb-2'>Completed Work</p>
                          {measurement.measurementDetails.length > 0 ? (
                            <div className='space-y-1 text-sm'>
                              <p>Completed Width: {measurement.measurementDetails[0]?.completedWidth || 0} m</p>
                              <p>Completed Height: {measurement.measurementDetails[0]?.completedHeight || 0} m</p>
                              <p>Completed Quantity: {measurement.measurementDetails[0]?.completedQuantity || 0}</p>
                              <p>Status: 
                                <Badge variant="outline" className='ml-2'>
                                  {measurement.measurementDetails[0]?.status}
                                </Badge>
                              </p>
                              {measurement.measurementDetails[0]?.note && (
                                <p className='text-muted-foreground'>Note: {measurement.measurementDetails[0].note}</p>
                              )}
                            </div>
                          ) : (
                            <p className='text-sm text-muted-foreground'>No completed work data available</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardContent className='pt-4'>
                    {selectedWorker.measurements.flatMap((measurement) => 
                      measurement.logs.map((log, idx) => (
                        <div key={`${measurement.measurementId}-${idx}`} className='border-b py-3 last:border-0'>
                          <div className='flex justify-between items-start mb-2'>
                            <p className='font-medium'>{measurement.roomName}</p>
                            <p className='text-xs text-muted-foreground'>
                              {new Date(log.completedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className='grid grid-cols-3 gap-2 text-sm'>
                            <div>
                              <p className='text-muted-foreground'>Assigned Width</p>
                              <p className='font-medium'>{log.assignedWidth || 0} m</p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Assigned Height</p>
                              <p className='font-medium'>{log.assignedHeight || 0} m</p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Assigned Quantity</p>
                              <p className='font-medium'>{log.assignedQuantity || 0}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {selectedWorker.measurements.flatMap(m => m.logs).length === 0 && (
                      <p className='text-center text-muted-foreground py-8'>No logs available for this worker</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerReport;