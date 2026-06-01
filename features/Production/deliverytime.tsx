/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Calendar,
  Loader2,
  Clock,
  TrendingUp,
  Filter,
  Package,
  User,
  CreditCard,
  Ruler,
  Truck
} from 'lucide-react';
import { getEstimatedCurtainDeliveryTime } from '@/service/Curtain';
import { DatePicker } from '@/components/DatePicker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

// Define the order type based on the API response
interface Order {
  id: string;
  code: string | null;
  curtainStatus: string;
  paymentStatus: string;
  customer: {
    id: string;
    name: string;
  };
  movementType?: {
    id: string;
    name: string;
  };
  isSiteMeasured: boolean;
  siteMeasurePrice?: string;
  remark?: string | null;
  totalAmount: string;
  balance: string;
  totalPaid: string;
  deliveryDeadline: string;
  createdAt: string;
}

interface DeliveryReport {
  success: boolean;
  averageDays: number;
  estimatedDate: string;
  totalOrdersUsed: number;
  orders: Order[];
}

const DeliveryCurtainOrderReport = () => {
  // Date filter states - Default: start date is today, end date is 30 days from start date
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    return new Date(); // Today
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from today
    return date;
  });
  
  // Report states
  const [estimatedDelivery, setEstimatedDelivery] = useState<DeliveryReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Fetch estimated delivery time report based on date filter
  const fetchEstimatedDelivery = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoadingReport(true);
    try {
      const result = await getEstimatedCurtainDeliveryTime(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      console.log('Estimated Delivery Result:', result);
      if (result.success) {
        setEstimatedDelivery(result);
        toast.success('Report loaded successfully');
      } else {
        toast.error('Failed to load report');
      }
    } catch (error) {
      console.error('Error fetching estimated delivery:', error);
      toast.error('Error fetching delivery report');
    } finally {
      setLoadingReport(false);
    }
  }, [startDate, endDate, setLoadingReport, setEstimatedDelivery]);

  // Auto-fetch on initial load
  useEffect(() => {
    fetchEstimatedDelivery();
  }, [fetchEstimatedDelivery]);

  // Handle date filter apply
  const handleApplyFilter = () => {
    fetchEstimatedDelivery();
  };

  // Handle reset filters - resets to today and 30 days from today
  const handleResetFilters = () => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    setStartDate(today);
    setEndDate(futureDate);
  };

  // Helper function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'default'; // changed from 'success' to 'default'
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    return status === 'PAID' ? 'default' : 'secondary';
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <TrendingUp className='text-primary' />
            Curtain Delivery Time Report
          </h1>
          <p className='text-muted-foreground mt-1'>
            Analyze average delivery times based on historical order data
          </p>
        </div>
      </div>

      {/* Date Filter Card */}
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-xl font-bold'>
            <Filter className='text-primary h-5 w-5' />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
            <div className='flex-1'>
              <label className='text-sm font-medium mb-2 block'>Start Date</label>
              <DatePicker
                selectedDate={startDate}
                onSelect={async (date, options) => {
                  setStartDate(date);
                }}
              />
            </div>
            <div className='flex-1'>
              <label className='text-sm font-medium mb-2 block'>End Date</label>
              <DatePicker
                selectedDate={endDate}
                onSelect={async (date, options) => {
                  setEndDate(date);
                }}
              />
            </div>
            <div className='flex gap-2'>
              <Button onClick={handleApplyFilter} disabled={loadingReport}>
                {loadingReport ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Calendar className='mr-2 h-4 w-4' />
                )}
                Apply Filter
              </Button>
              <Button variant='outline' onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-xl font-bold'>
            <Clock className='text-primary h-5 w-5' />
            Delivery Time Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReport ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <span className='ml-2 text-muted-foreground'>Loading report...</span>
            </div>
          ) : estimatedDelivery ? (
            <div className='space-y-6'>
              {/* Stats Cards */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                <Card>
                  <CardContent className='pt-6'>
                    <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                      <Clock className='h-4 w-4' />
                      <span className='text-sm'>Average Delivery Time</span>
                    </div>
                    <div className='text-3xl font-bold'>
                      {estimatedDelivery.averageDays} days
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className='pt-6'>
                    <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                      <Calendar className='h-4 w-4' />
                      <span className='text-sm'>Estimated Delivery Date</span>
                    </div>
                    <div className='text-3xl font-bold'>
                      {formatDate(estimatedDelivery.estimatedDate)}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Based on selected date range
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className='pt-6'>
                    <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                      <TrendingUp className='h-4 w-4' />
                      <span className='text-sm'>Orders Analyzed</span>
                    </div>
                    <div className='text-3xl font-bold'>
                      {estimatedDelivery.totalOrdersUsed}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Orders in selected date range
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Date Range Info */}
              <div className='rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20'>
                <div className='flex items-start gap-3'>
                  <Calendar className='h-5 w-5 text-blue-600 mt-0.5' />
                  <div>
                    <p className='font-medium text-blue-800 dark:text-blue-200'>
                      Analysis Period
                    </p>
                    <p className='text-sm text-blue-700 dark:text-blue-300'>
                      From {formatDate(startDate?.toISOString() || '')} to {formatDate(endDate?.toISOString() || '')}
                    </p>
                    <p className='text-sm text-blue-700 dark:text-blue-300 mt-1'>
                      Based on {estimatedDelivery.totalOrdersUsed} completed orders, 
                      the average delivery time is {estimatedDelivery.averageDays} days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              {estimatedDelivery.orders && estimatedDelivery.orders.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold flex items-center gap-2'>
                    <Package className='h-5 w-5' />
                    Orders in this Period
                  </h3>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Code</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Delivery Deadline</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estimatedDelivery.orders.map((order) => (
                          <TableRow key={order.code || order.id}>
                            <TableCell className='font-medium'>
                              {order.code || order.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(order.curtainStatus)}>
                                {order.curtainStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPaymentStatusBadge(order.paymentStatus)}>
                                {order.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                            <TableCell>{formatDate(order.deliveryDeadline)}</TableCell>
                            <TableCell>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleViewOrder(order)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='text-center py-12 text-muted-foreground'>
              <Clock className='h-12 w-12 mx-auto mb-3 opacity-50' />
              <p>No report data available</p>
              <p className='text-sm mt-1'>
                Try adjusting your date range filter
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto'>
            <CardHeader>
              <CardTitle className='flex justify-between items-center'>
                <span>Order Details</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowOrderModal(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Order Information */}
                <div className='space-y-3'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <Package className='h-4 w-4' />
                    Order Information
                  </h4>
                  <div className='space-y-2 text-sm'>
                    <p><span className='font-medium'>Customer:</span> {selectedOrder.customer?.name}</p>
                    {selectedOrder.movementType && (
                      <p><span className='font-medium'>Movement Type:</span> {selectedOrder.movementType.name}</p>
                    )}
                    <p><span className='font-medium'>Site Measured:</span> {selectedOrder.isSiteMeasured ? 'Yes' : 'No'}</p>
                    {selectedOrder.siteMeasurePrice && (
                      <p><span className='font-medium'>Site Measure Price:</span> {parseFloat(selectedOrder.siteMeasurePrice).toFixed(2)}</p>
                    )}
                    {selectedOrder.remark && (
                      <p><span className='font-medium'>Remarks:</span> {selectedOrder.remark}</p>
                    )}
                  </div>
                </div>

                {/* Financial Information */}
                <div className='space-y-3'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <CreditCard className='h-4 w-4' />
                    Financial Information
                  </h4>
                  <div className='rounded-lg border p-3 space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Total Amount:</span>
                      <span>{parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className='flex justify-between'>
                      <span className='font-medium'>Total Paid:</span>
                      <span className='text-green-600'>{parseFloat(selectedOrder.totalPaid).toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Balance:</span>
                      <span className={parseFloat(selectedOrder.balance) > 0 ? 'text-red-600' : 'text-green-600'}>
                        {parseFloat(selectedOrder.balance).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className='flex justify-between'>
                      <span className='font-medium'>Payment Status:</span>
                      <Badge variant={getPaymentStatusBadge(selectedOrder.paymentStatus)}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className='space-y-3'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <Truck className='h-4 w-4' />
                    Status Information
                  </h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='font-medium'>Order Status:</span>
                      <Badge variant={getStatusBadge(selectedOrder.curtainStatus)}>
                        {selectedOrder.curtainStatus}
                      </Badge>
                    </div>
                    <p><span className='font-medium'>Delivery Deadline:</span> {formatDate(selectedOrder.deliveryDeadline)}</p>
                    <p><span className='font-medium'>Created At:</span> {formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DeliveryCurtainOrderReport;