/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Filter,
  X,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Building2,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { toast } from 'sonner';
import { ICapacityReport } from '@/models/CapacityLot';
import { getCapacityReport } from '@/service/CapacityLot';

// Stage Chart Component using Recharts with ChartContainer
const StageChart = ({ data, title }: { data: any[]; title: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const chartConfig = {
    value: {
      label: 'Capacity Change',
      color: 'var(--primary)'
    }
  } satisfies ChartConfig;

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-xs text-muted-foreground">Increase</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-xs text-muted-foreground">Decrease</span>
          </div>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-32 w-full">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
            fontSize={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={10}
            domain={[-maxValue * 1.2, maxValue * 1.2]}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
            content={
              <ChartTooltipContent
                className="w-40"
                nameKey="value"
                formatter={(value) => {
                  const numericValue = typeof value === 'number' ? value : Number(value);
                  const displayValue = Number.isNaN(numericValue) ? '' : `${numericValue > 0 ? '+' : ''}${numericValue}`;
                  return [displayValue, 'Change'];
                }}
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  });
                }}
              />
            }
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            fill="var(--primary)"
          >
            {data.map((entry, index) => (
              <Bar
                key={index}
                dataKey="value"
                fill={entry.value >= 0 ? '#22c55e' : '#ef4444'}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
};

// Cumulative Chart Component with ChartContainer
const CumulativeChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const chartConfig = {
    value: {
      label: 'Cumulative Capacity',
      color: 'var(--primary)'
    }
  } satisfies ChartConfig;

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Cumulative Trend</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-xs text-muted-foreground">Cumulative</span>
          </div>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-32 w-full">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
            fontSize={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={10}
            domain={[0, maxValue * 1.2]}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
            content={
              <ChartTooltipContent
                className="w-40"
                nameKey="value"
                formatter={(value) => [
                  `${value}`,
                  'Cumulative'
                ]}
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  });
                }}
              />
            }
          />
          <Bar
            dataKey="value"
            fill="url(#cumulativeGradient)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export function CapacityReportPage() {
  const [report, setReport] = useState<ICapacityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Toggle stage expansion
  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) {
        newSet.delete(stage);
      } else {
        newSet.add(stage);
      }
      return newSet;
    });
  };

  // Fetch capacity report
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params: { startDate?: string; endDate?: string } = {};
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await getCapacityReport(params);
      setReport(data);
      
      // Auto-expand first 2 stages by default
      if (data.stages.length > 0) {
        const initialExpanded = new Set<string>();
        data.stages.slice(0, 2).forEach(stage => initialExpanded.add(stage.stage));
        setExpandedStages(initialExpanded);
      }
    } catch (error) {
      console.error('Error fetching capacity report:', error);
      toast.error('Failed to load capacity report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Apply filters
  const applyFilters = () => {
    fetchReport();
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => {
      fetchReport();
    }, 100);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!report) return;

    const stageData = report.stages.map((stage) => ({
      'Stage': stage.stage,
      'Days': stage.days,
      'Current Capacity': stage.currentCapacity,
      'Initial Capacity': stage.initialCapacity,
      'Final Capacity': stage.finalCapacity,
      'Capacity Change': stage.capacityChange,
      'Working Hours': stage.workingHours,
      'Parallel Slots': stage.parallelSlots,
      'Total Capacity Hours': stage.totalCapacityHours,
      'History Count': stage.historyCount,
    }));

    const worksheet = utils.json_to_sheet(stageData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Capacity Report');
    writeFile(workbook, `capacity-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export completed successfully');
  };

  // Get trend icon
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  // Get trend badge variant
  const getTrendBadgeVariant = (change: number) => {
    if (change > 0) return 'default';
    if (change < 0) return 'destructive';
    return 'outline';
  };

  // Prepare chart data for a stage
  const getStageChartData = (stage: any) => {
    const changes = stage.recentChanges
      .filter((h: any) => h.action === 'UPDATED')
      .slice(-10)
      .map((h: any) => ({
        label: new Date(h.createdAt).toISOString(),
        value: (h.newCapacity || 0) - (h.oldCapacity || 0)
      }));

    return changes;
  };

  // Prepare cumulative chart data
  const getCumulativeChartData = (stage: any) => {
    let cumulative = stage.initialCapacity || 0;
    const data = stage.recentChanges
      .filter((h: any) => h.action === 'UPDATED')
      .slice(-10)
      .map((h: any) => {
        cumulative += (h.newCapacity || 0) - (h.oldCapacity || 0);
        return {
          label: new Date(h.createdAt).toISOString(),
          value: cumulative
        };
      });

    return data;
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm text-gray-500">Try adjusting your filters</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Capacity Progress Report</h1>
          <p className="text-muted-foreground">
            Track and analyze company capacity across all stages with visual insights
          </p>
        </div>
     
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter capacity report by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      

      {/* Date Range Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Report generated: {new Date(report.generatedAt).toLocaleString()}</span>
        {report.dateRange.startDate && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <span>From: {new Date(report.dateRange.startDate).toLocaleDateString()}</span>
          </>
        )}
        {report.dateRange.endDate && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <span>To: {new Date(report.dateRange.endDate).toLocaleDateString()}</span>
          </>
        )}
      </div>

      {/* Stages with Graphs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Stage-wise Capacity Analysis</h2>
        {report.stages.map((stage) => {
          const chartData = getStageChartData(stage);
          const cumulativeData = getCumulativeChartData(stage);
          const isExpanded = expandedStages.has(stage.stage);

          return (
            <Card key={stage.stage} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleStage(stage.stage)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-medium">
                        {stage.stage}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Capacity: {stage.currentCapacity}
                      </span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(stage.capacityChange)}
                        <Badge variant={getTrendBadgeVariant(stage.capacityChange)}>
                          {stage.capacityChange > 0 ? '+' : ''}{stage.capacityChange}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stage.historyCount} changes
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-4 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Individual Changes Chart */}
                    <Card>
                      <CardContent className="pt-4">
                        <StageChart 
                          data={chartData} 
                          title="Individual Capacity Changes"
                        />
                      </CardContent>
                    </Card>

                    {/* Cumulative Changes Chart */}
                    {/* <Card>
                      <CardContent className="pt-4">
                        <CumulativeChart data={cumulativeData} />
                      </CardContent>
                    </Card> */}
                  </div>

                  {/* Detailed Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Days</p>
                      <p className="font-medium">{stage.days}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Working Hours</p>
                      <p className="font-medium">{stage.workingHours}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Parallel Slots</p>
                      <p className="font-medium">{stage.parallelSlots}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Capacity Hours</p>
                      <p className="font-medium">{stage.totalCapacityHours}</p>
                    </div>
                  </div>

                  {/* Recent Changes Table */}
                  {stage.recentChanges.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-2">Recent Changes</p>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead className="text-right">From</TableHead>
                              <TableHead className="text-right">To</TableHead>
                              <TableHead className="text-right">Change</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stage.recentChanges.slice(0, 5).map((change: any) => (
                              <TableRow key={change.id}>
                                <TableCell>
                                  {new Date(change.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={change.action === 'CREATED' ? 'default' : 'outline'}>
                                    {change.action}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {change.oldCapacity ?? '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {change.newCapacity ?? '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={change.newCapacity > change.oldCapacity ? 'text-green-600' : 'text-red-600'}>
                                    {change.newCapacity > change.oldCapacity ? '+' : ''}
                                    {(change.newCapacity || 0) - (change.oldCapacity || 0)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Capacity Trend Table */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Trend</CardTitle>
          <CardDescription>
            Recent capacity changes across all stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.capacityTrend.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Cumulative Change</TableHead>
                    <TableHead>Changed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.capacityTrend.map((trend, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(trend.date).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{trend.stage}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getTrendIcon(trend.change)}
                          <span className={trend.change > 0 ? 'text-green-600' : trend.change < 0 ? 'text-red-600' : ''}>
                            {trend.change > 0 ? '+' : ''}{trend.change}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {trend.cumulativeChange}
                      </TableCell>
                      <TableCell>{trend.changedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No capacity trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}