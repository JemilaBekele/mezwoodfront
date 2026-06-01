/* eslint-disable react-hooks/error-boundaries */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Package,
  User,
  MapPin,
  Phone,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Truck,
  CalendarDays,
  Sun,
  Moon,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getEstimatedCurtainDeliveryTime } from '@/service/Curtain';
import { formatCurrency } from '@/lib/format';

interface Order {
  id: string;
  code: string | null;
  curtainStatus: string;
  paymentStatus: string;
  customer: {
    id: string;
    name: string;
    phone1?: string;
    address?: string;
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

interface DeliveryPlan {
  date: string;
  orders: Order[];
  count: number;
  totalValue: number;
}

interface EstimatedDeliveryResponse {
  success: boolean;
  averageDays?: number;
  estimatedDate?: string;
  totalOrdersUsed?: number;
  orders: Order[];
  message?: string;
}

const DeliveryPlannerPage: React.FC = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');

  const fetchDeliveryPlan = useCallback(async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await getEstimatedCurtainDeliveryTime(
        today.toISOString().split('T')[0],
        tomorrow.toISOString().split('T')[0]
      );
      
      // Handle the actual API response structure
      if (result && result.orders) {
        setOrders(result.orders);
        if (result.message) {
          toast.info(result.message);
        }
      } else if (result && result.success === false) {
        toast.error(result.message || 'Failed to load delivery plan');
        setOrders([]);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching delivery plan:', error);
      toast.error('Error fetching delivery schedule');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryPlan();
    setRefreshing(false);
    toast.success('Delivery plan refreshed');
  };

  useEffect(() => {
    fetchDeliveryPlan();
  }, [fetchDeliveryPlan]);

  // Separate orders into today and tomorrow
  const getOrdersByDate = useCallback((dateType: 'today' | 'tomorrow') => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = dateType === 'today' ? today : tomorrow;
    
    const filteredOrders = orders.filter(order => {
      if (!order.deliveryDeadline) return false;
      const orderDate = new Date(order.deliveryDeadline);
      return orderDate.toDateString() === targetDate.toDateString();
    });
    
    const totalValue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
    
    return {
      orders: filteredOrders,
      count: filteredOrders.length,
      totalValue: totalValue,
    };
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDeliveryTime = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return { text: 'Today', className: 'text-red-600 font-semibold' };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { text: 'Tomorrow', className: 'text-orange-600 font-semibold' };
    } else {
      return { text: format(date, 'MMM dd, yyyy'), className: 'text-muted-foreground' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const todayPlan = getOrdersByDate('today');
  const tomorrowPlan = getOrdersByDate('tomorrow');
  const currentPlan = activeTab === 'today' ? todayPlan : tomorrowPlan;
  const tabTitle = activeTab === 'today' ? "Today's Deliveries" : "Tomorrow's Deliveries";
  const tabIcon = activeTab === 'today' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Delivery Planner</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Plan and manage curtain deliveries for today and tomorrow
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayPlan.count}</div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(todayPlan.totalValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tomorrow's Deliveries</CardTitle>
            <CalendarDays className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tomorrowPlan.count}</div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(tomorrowPlan.totalValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Upcoming</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayPlan.count + tomorrowPlan.count}</div>
            <p className="text-xs text-muted-foreground">
              Total Value: {formatCurrency(todayPlan.totalValue + tomorrowPlan.totalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'today' | 'tomorrow')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Today's Deliveries
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Tomorrow's Deliveries
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {tabIcon}
                {tabTitle}
              </CardTitle>
              <CardDescription>
                {currentPlan.count} orders scheduled for delivery
                {currentPlan.count > 0 && ` • Total value: ${formatCurrency(currentPlan.totalValue)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan.orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">No Deliveries Scheduled</p>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'today' 
                      ? "You don't have any deliveries scheduled for today" 
                      : "You don't have any deliveries scheduled for tomorrow"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentPlan.orders.map((order) => {
                    const deliveryInfo = formatDeliveryTime(order.deliveryDeadline);
                    return (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            {/* Order Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  {order.code || `Order ${order.id.slice(0, 8)}`}
                                </h3>
                                {getStatusBadge(order.curtainStatus)}
                                {getPaymentBadge(order.paymentStatus)}
                                <Badge variant="outline" className={deliveryInfo.className}>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {deliveryInfo.text}
                                </Badge>
                              </div>

                              {/* Customer Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{order.customer?.name || 'N/A'}</span>
                                </div>
                                {order.customer?.phone1 && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{order.customer.phone1}</span>
                                  </div>
                                )}
                                {order.customer?.address && (
                                  <div className="flex items-center gap-2 col-span-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{order.customer.address}</span>
                                  </div>
                                )}
                              </div>

                              {/* Order Details */}
                              <div className="flex flex-wrap gap-4 text-sm">
                                {order.movementType && (
                                  <div>
                                    <span className="text-muted-foreground">Movement:</span>
                                    <span className="ml-1">{order.movementType.name}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground">Site Measured:</span>
                                  <span className="ml-1">{order.isSiteMeasured ? 'Yes' : 'No'}</span>
                                </div>
                                {order.remark && (
                                  <div>
                                    <span className="text-muted-foreground">Note:</span>
                                    <span className="ml-1 text-muted-foreground">{order.remark}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Financial Info */}
                            <div className="flex flex-col items-start md:items-end gap-2">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-xl font-bold text-green-600">
                                  {formatCurrency(parseFloat(order.totalAmount) || 0)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Balance</p>
                                <p className={`font-semibold ${parseFloat(order.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatCurrency(parseFloat(order.balance) || 0)}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/CurtainOrder/view?id=${order.id}`)}
                                className="mt-2"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

  
    </div>
  );
};

export default DeliveryPlannerPage;