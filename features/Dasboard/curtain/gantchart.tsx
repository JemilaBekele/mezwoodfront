/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { format, parseISO, differenceInDays, isWithinInterval } from 'date-fns';
import { ICurtainOrder } from '@/models/curtainType';
import { getPendingCurtainOrders } from '@/service/Curtain';
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {

  RefreshCw,
  Filter,
  User,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Search,
  ZoomIn,
  ZoomOut,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// Status type based on ICurtainOrder
type CurtainStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

// Status color mapping
const statusColors: Record<CurtainStatus, string> = {
  'PENDING': '#f59e0b', // Amber for pending
  'COMPLETED': '#10b981', // Green for completed
  'CANCELLED': '#ef4444', // Red for cancelled
};

// Status icons mapping
const statusIcons: Record<CurtainStatus, any> = {
  'PENDING': Hourglass,
  'COMPLETED': CheckCircle2,
  'CANCELLED': AlertCircle,
};

// Status display names
const statusDisplayNames: Record<CurtainStatus, string> = {
  'PENDING': 'Pending',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Cancelled',
};

// Priority mapping (based on days remaining)
const getPriorityFromDays = (daysRemaining: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (daysRemaining < 0) return 'HIGH';
  if (daysRemaining <= 2) return 'HIGH';
  if (daysRemaining <= 5) return 'MEDIUM';
  return 'LOW';
};

// Priority colors
const priorityColors: Record<string, string> = {
  'HIGH': '#ef4444',
  'MEDIUM': '#f59e0b',
  'LOW': '#10b981',
};

interface PendingCurtainGanttProps {
  initialOrders?: ICurtainOrder[];
}

export const PendingCurtainGantt: React.FC<PendingCurtainGanttProps> = ({
  initialOrders,
}) => {
  const router = useRouter();
  const [orders, setOrders] = useState<ICurtainOrder[]>(initialOrders || []);
  const [loading, setLoading] = useState(!initialOrders);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartHeight, setChartHeight] = useState(500);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<CurtainStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);
  const [dateRange, ] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Fetch orders if not provided
  useEffect(() => {
    if (!initialOrders) {
      fetchOrders();
    }
  }, [initialOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getPendingCurtainOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch curtain orders', {
        description: 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    toast.success('Orders refreshed successfully');
  };

  // Calculate days remaining until deadline
  const getDaysRemaining = useCallback((deadline: string | Date): number => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Get status badge variant based on days remaining
  const getUrgencyBadge = useCallback((daysRemaining: number) => {
    if (daysRemaining < 0) return { variant: 'destructive' as const, label: 'Overdue' };
    if (daysRemaining <= 2) return { variant: 'destructive' as const, label: 'Urgent' };
    if (daysRemaining <= 5) return { variant: 'default' as const, label: 'Due Soon' };
    return { variant: 'secondary' as const, label: 'On Track' };
  }, []);

  // Calculate order progress (based on time elapsed vs total duration)
  const calculateOrderProgress = useCallback((order: ICurtainOrder): number => {
    if (!order.issueDate || !order.deliveryDeadline) return 0;
    
    const start = parseISO(order.issueDate.toString());
    const end = parseISO(order.deliveryDeadline.toString());
    const now = new Date();
    
    if (now <= start) return 0;
    if (now >= end) return 100;
    
    const totalDuration = differenceInDays(end, start);
    const elapsedDuration = differenceInDays(now, start);
    return Math.round((elapsedDuration / totalDuration) * 100);
  }, []);

  // Get customer full details
  const getCustomerDetails = useCallback((order: ICurtainOrder) => {
    const customer = order.customer;
    if (!customer) return null;
    
    return {
      name: customer.name || 'Unknown Customer',
      address: customer.address,
      companyName: customer.companyName,
    };
  }, []);

  // Get order display name
  const getOrderDisplayName = useCallback((order: ICurtainOrder): string => {
    const customerName = order.customer?.name || 'Unknown';
    const orderId = order.id?.substring(0, 8) || 'New';
    return `${customerName} - ${order.curtainStatus || 'Curtain'} (${orderId})`;
  }, []);

  // Format date safely
  const formatDate = useCallback((date: string | Date | undefined): Date | null => {
    if (!date) return null;
    try {
      return new Date(date);
    } catch {
      return null;
    }
  }, []);

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const customerName = order.customer?.name?.toLowerCase() || '';
        const orderId = order.id?.toLowerCase() || '';
        const curtainType = order.curtainStatus?.toLowerCase() || '';
        
        const matchesSearch = 
          customerName.includes(query)||
          orderId.includes(query) ||
          curtainType.includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && order.curtainStatus !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && order.deliveryDeadline) {
        const daysRemaining = getDaysRemaining(order.deliveryDeadline);
        const priority = getPriorityFromDays(daysRemaining);
        if (priority !== priorityFilter) return false;
      }

      // Completed/Cancelled filters
      if (!showCompleted && order.curtainStatus === 'COMPLETED') return false;
      if (!showCancelled && order.curtainStatus === 'CANCELLED') return false;

      // Date range filter
      if (dateRange.start && dateRange.end && order.deliveryDeadline) {
        const deadline = new Date(order.deliveryDeadline);
        const isWithinRange = isWithinInterval(deadline, { 
          start: dateRange.start, 
          end: dateRange.end 
        });
        if (!isWithinRange) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, priorityFilter, showCompleted, showCancelled, dateRange, getDaysRemaining]);

  // Compute Gantt tasks - MODIFIED: Changed all tasks to type 'task' instead of 'project'
  const computeTasks = useCallback((): Task[] => {
    if (!filteredOrders || filteredOrders.length === 0) return [];

    const ganttTasks: Task[] = [];

    filteredOrders.forEach((order, index) => {
      const orderId = `order-${order.id || index}`;
      
      const startDate = formatDate(order.issueDate);
      const endDate = formatDate(order.deliveryDeadline);
      
      if (!startDate || !endDate) return;

      const daysRemaining = getDaysRemaining(endDate);
      const priority = getPriorityFromDays(daysRemaining);
      const progress = calculateOrderProgress(order);
      const isSelected = selectedOrders.has(orderId);

      // Main order task - CHANGED: type from 'project' to 'task' to remove expand/collapse arrows
      const orderTask: Task = {
        start: startDate,
        end: endDate,
        name: getOrderDisplayName(order),
        id: orderId,
        type: 'task', // Changed from 'project' to 'task'
        progress: progress,
        styles: {
          backgroundColor: isSelected ? '#1E3A8A' : priorityColors[priority],
          backgroundSelectedColor: '#1E3A8A',
          progressColor: statusColors[order.curtainStatus as CurtainStatus] || '#f59e0b',
          progressSelectedColor: '#2563EB',
        },
        dependencies: [],
      };
      ganttTasks.push(orderTask);
    });

    return ganttTasks;
  }, [filteredOrders, selectedOrders, formatDate, getDaysRemaining, calculateOrderProgress, getOrderDisplayName]);

  // Handle task click - MODIFIED: Removed expansion logic
  const handleTaskClick = useCallback((task: Task) => {
    if (task.id.startsWith('order-')) {
      const order = orders.find(o => `order-${o.id}` === task.id);
      if (order) {
        const daysRemaining = order.deliveryDeadline ? getDaysRemaining(order.deliveryDeadline) : 0;
        const urgency = getUrgencyBadge(daysRemaining);
        
        toast.info(`Order: ${task.name}`, {
          description: `Status: ${order.curtainStatus} • ${urgency.label} • Progress: ${task.progress}%`,
          action: {
            label: 'View Details',
            onClick: () => router.push(`/dashboard/CurtainOrder/view?id=${order.id}`)
          }
        });
      }
    }
  }, [orders, getDaysRemaining, getUrgencyBadge, router]);

  // Handle order selection
  const handleSelectOrder = useCallback((orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  }, [selectedOrders]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const viewModes = [
      ViewMode.Day,
      ViewMode.Week,
      ViewMode.Month,
      ViewMode.Year,
    ];
    const currentIndex = viewModes.indexOf(viewMode);
    if (currentIndex < viewModes.length - 1) {
      setViewMode(viewModes[currentIndex + 1]);
    }
  }, [viewMode]);

  const handleZoomOut = useCallback(() => {
    const viewModes = [
      ViewMode.Day,
      ViewMode.Week,
      ViewMode.Month,
      ViewMode.Year,
    ];
    const currentIndex = viewModes.indexOf(viewMode);
    if (currentIndex > 0) {
      setViewMode(viewModes[currentIndex - 1]);
    }
  }, [viewMode]);

  // Update tasks when dependencies change
  useEffect(() => {
    if (orders.length > 0) {
      const ganttTasks = computeTasks();
      setTasks(ganttTasks);
      
      // Adjust chart height
      const totalTasks = ganttTasks.length;
      const newHeight = Math.min(800, Math.max(400, totalTasks * 35 + 100));
      setChartHeight(newHeight);
    }
  }, [orders, filteredOrders, selectedOrders, computeTasks]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.curtainStatus === 'PENDING').length;
    const completedOrders = orders.filter(o => o.curtainStatus === 'COMPLETED').length;
    const cancelledOrders = orders.filter(o => o.curtainStatus === 'CANCELLED').length;
    
    const overdueOrders = orders.filter(o => 
      o.deliveryDeadline && getDaysRemaining(o.deliveryDeadline) < 0 && o.curtainStatus === 'PENDING'
    ).length;
    
    const urgentOrders = orders.filter(o => 
      o.deliveryDeadline && 
      getDaysRemaining(o.deliveryDeadline) <= 2 && 
      getDaysRemaining(o.deliveryDeadline) >= 0 &&
      o.curtainStatus === 'PENDING'
    ).length;

    const totalQuantity = orders.reduce((sum, o) => sum + (0), 0);
    const avgProgress = orders.reduce((sum, o) => sum + calculateOrderProgress(o), 0) / totalOrders;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      overdueOrders,
      urgentOrders,
      totalQuantity,
      avgProgress: Math.round(avgProgress),
    };
  }, [orders, getDaysRemaining, calculateOrderProgress]);

  // Get all unique statuses
  const allStatuses: CurtainStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-125 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Curtain Orders Timeline</h1>
          <p className="text-muted-foreground">
            Track and manage curtain production schedules
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="min-w-25"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters & Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name, email, phone, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ViewMode.Day}>Day View</SelectItem>
                  <SelectItem value={ViewMode.Week}>Week View</SelectItem>
                  <SelectItem value={ViewMode.Month}>Month View</SelectItem>
                  <SelectItem value={ViewMode.Year}>Year View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CurtainStatus | 'ALL')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {allStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {statusDisplayNames[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value="HIGH">High Priority</SelectItem>
                    <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                    <SelectItem value="LOW">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                />
                <Label htmlFor="show-completed" className="text-sm">Show Completed</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-cancelled"
                  checked={showCancelled}
                  onCheckedChange={(checked) => setShowCancelled(checked as boolean)}
                />
                <Label htmlFor="show-cancelled" className="text-sm">Show Cancelled</Label>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Production Timeline</CardTitle>
          <CardDescription>
            Click on order bars to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div 
              className="gantt-container overflow-x-auto border rounded-lg"
              style={{ height: `${chartHeight}px` }}
            >
              <Gantt
                tasks={tasks}
                viewMode={viewMode}
                listCellWidth="250px"
                columnWidth={80}
                rowHeight={35}
                fontSize="12px"
                barFill={70}
                barCornerRadius={2}
                onSelect={handleTaskClick}
                locale="en-US"
                todayColor="rgba(239, 68, 68, 0.1)"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground border rounded-lg">
              <Package className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders List Summary */}
      {filteredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders Summary</CardTitle>
            <CardDescription>
              Detailed list of all curtain orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredOrders.map((order, index) => {
                const orderId = `order-${order.id || index}`;
                const isSelected = selectedOrders.has(orderId);
                const daysRemaining = order.deliveryDeadline ? getDaysRemaining(order.deliveryDeadline) : 0;
                const urgency = getUrgencyBadge(daysRemaining);
                const customer = getCustomerDetails(order);
                const StatusIcon = statusIcons[order.curtainStatus as CurtainStatus] || Hourglass;

                return (
                  <div
                    key={order.id || index}
                    className={`p-4 border rounded-md transition-all hover:bg-muted/50 ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{customer?.name || 'Unknown'}</h3>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {order.curtainStatus || 'Curtain'}
                            </Badge>
                            <Badge variant={urgency.variant}>
                              {urgency.label}
                            </Badge>
                            <Badge
                              style={{ 
                                backgroundColor: statusColors[order.curtainStatus as CurtainStatus],
                                color: 'white'
                              }}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusDisplayNames[order.curtainStatus as CurtainStatus]}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm">
                            {customer?.companyName && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{customer.companyName}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Order ID: {order.id?.substring(0, 8)}...</span>
                            {order.issueDate && (
                              <span>Issued: {format(new Date(order.issueDate), 'MMM dd, yyyy')}</span>
                            )}
                            {order.deliveryDeadline && (
                              <span className={daysRemaining < 0 ? 'text-red-600 font-medium' : ''}>
                                Deadline: {format(new Date(order.deliveryDeadline), 'MMM dd, yyyy')}
                                {daysRemaining < 0 && ` (${Math.abs(daysRemaining)} days overdue)`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                      
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/curtain-orders/${order.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelectOrder(orderId)}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Orders Actions */}
      {selectedOrders.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedOrders.size} order(s) selected</p>
                <p className="text-sm text-muted-foreground">
                  Perform bulk actions on selected orders
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info('Bulk update status feature coming soon!');
                  }}
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info('Assign to team feature coming soon!');
                  }}
                >
                  Assign To
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedOrders(new Set());
                    toast.success('Selection cleared');
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PendingCurtainGantt;