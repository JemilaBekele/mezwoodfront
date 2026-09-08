/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Calendar, 
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getCompletedProjectsReport } from '@/service/dashboard';

// ==================== Types ====================

interface DateComparisons {
  projectVsStage?: {
    differenceInDays: number;
    whichIsEarlier: string;
    suggestion: string;
  };
  requestedVsStage?: {
    differenceInDays: number;
    whichIsEarlier: string;
    suggestion: string;
  };
  newRequestedVsStage?: {
    differenceInDays: number;
    whichIsEarlier: string;
    suggestion: string;
  };
}

interface MismatchedProject {
  projectId: string;
  customerName: string;
  customerPhone: string;
  piNumber: string;
  projectStatus: string;
  dates: {
    calculatedDelivery: string | null;
    manualDelivery: string | null;
    requestedDelivery: string | null;
    newRequestedDelivery: string | null;
    projectFinalDelivery: string;
    stageDeliveryDate: string;
    projectEndDate: string | null;
  };
  dateComparisons: DateComparisons;
  scheduleMode: string;
  difficulty: string;
}

interface ReportSummary {
  totalProjectsAnalyzed: number;
  projectsWithMismatch: number;
}

interface DeliveryDateReport {
  generatedAt: string;
  summary: ReportSummary;
  mismatchedProjects: MismatchedProject[];
}

// ==================== Main Component ====================

const CompletedProjectsReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DeliveryDateReport | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getCompletedProjectsReport();
      setReport(data);
      toast.success('Report refreshed');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Calculate days difference between two dates
  const getDaysDiff = (date1: string | null, date2: string | null) => {
    if (!date1 || !date2) return null;
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
      return Math.ceil(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  // Get status icon based on comparison
  const getStatusIcon = (diff: number | null | undefined, whichIsEarlier?: string) => {
    if (diff === null || diff === undefined) return <Minus className="h-4 w-4 text-gray-400" />;
    
    // If stage is earlier -> bad (delayed)
    if (whichIsEarlier?.toLowerCase().includes('stage')) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    // If project/requested is earlier -> good
    if (whichIsEarlier?.toLowerCase().includes('project') || 
        whichIsEarlier?.toLowerCase().includes('requested')) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Get badge color based on comparison
  const getBadgeVariant = (whichIsEarlier?: string) => {
    if (!whichIsEarlier) return 'outline';
    if (whichIsEarlier.toLowerCase().includes('stage')) return 'destructive';
    if (whichIsEarlier.toLowerCase().includes('project') || 
        whichIsEarlier.toLowerCase().includes('requested')) return 'default';
    return 'outline';
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!report?.mismatchedProjects) return [];

    return report.mismatchedProjects.map(project => {
      const { dateComparisons, dates } = project;
      const projectVsStage = dateComparisons?.projectVsStage;
      const requestedVsStage = dateComparisons?.requestedVsStage;
      const newRequestedVsStage = dateComparisons?.newRequestedVsStage;

      // Calculate planned vs actual
      const plannedEnd = dates.projectFinalDelivery;
      const actualEnd = dates.projectEndDate;
      const plannedVsActualDiff = getDaysDiff(plannedEnd, actualEnd);

      return {
        name: project.customerName || 'Unknown',
        customerName: project.customerName || 'Unknown',
        piNumber: project.piNumber || 'N/A',
        projectId: project.projectId,
        plannedVsStage: projectVsStage?.differenceInDays || 0,
        plannedVsStageLabel: projectVsStage?.whichIsEarlier || 'Same',
        requestedVsStage: requestedVsStage?.differenceInDays || 0,
        requestedVsStageLabel: requestedVsStage?.whichIsEarlier || 'Same',
        newRequestedVsStage: newRequestedVsStage?.differenceInDays || 0,
        newRequestedVsStageLabel: newRequestedVsStage?.whichIsEarlier || 'Same',
        plannedVsActual: plannedVsActualDiff || 0,
        plannedEnd: formatDate(plannedEnd),
        actualEnd: formatDate(actualEnd),
        requestedEnd: formatDate(dates.requestedDelivery),
        newRequestedEnd: formatDate(dates.newRequestedDelivery),
        stageEnd: formatDate(dates.stageDeliveryDate),
      };
    });
  };

  const chartData = prepareChartData();

  // Summary stats
  const totalProjects = report?.summary?.totalProjectsAnalyzed || 0;
  const mismatchCount = report?.summary?.projectsWithMismatch || 0;
  const matchCount = totalProjects - mismatchCount;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground mb-4">No data available</p>
        <Button onClick={fetchReport}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Completed Projects Report
          </h1>
          <p className="text-muted-foreground">
            Compare planned vs actual delivery dates with customer requests
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Chart
          </Button>
          <Button onClick={fetchReport} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              On Track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{matchCount}</div>
            <p className="text-xs text-muted-foreground">Projects with matching dates</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Mismatches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mismatchCount}</div>
            <p className="text-xs text-muted-foreground">Projects with date mismatches</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              <BarChart3 className="inline h-4 w-4 mr-1" />
              Total Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Completed projects analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Date Comparison Overview</CardTitle>
            <CardDescription>
              Visual comparison of planned, actual, and requested delivery dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Days Difference', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-4 border rounded-lg shadow-lg">
                          <p className="font-bold">{data.customerName}</p>
                          <p className="text-sm text-muted-foreground">PI: {data.piNumber}</p>
                          <hr className="my-2" />
                          <p className="text-sm">
                            <span className="font-medium">Planned:</span> {data.plannedEnd}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Actual:</span> {data.actualEnd}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Stage:</span> {data.stageEnd}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Requested:</span> {data.requestedEnd}
                          </p>
                          {data.newRequestedEnd !== 'Not set' && (
                            <p className="text-sm">
                              <span className="font-medium">New Requested:</span> {data.newRequestedEnd}
                            </p>
                          )}
                          <hr className="my-2" />
                          <p className="text-sm">
                            <span className="font-medium">Planned vs Stage:</span>{' '}
                            <span className={data.plannedVsStage > 0 ? 'text-red-500' : 'text-green-500'}>
                              {data.plannedVsStage} days {data.plannedVsStageLabel}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Planned vs Actual:</span>{' '}
                            <span className={data.plannedVsActual > 0 ? 'text-red-500' : 'text-green-500'}>
                              {data.plannedVsActual} days
                            </span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="plannedVsStage" 
                    name="Planned vs Stage" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.plannedVsStage > 0 ? '#ef4444' : '#22c55e'}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="plannedVsActual" 
                    name="Planned vs Actual" 
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.plannedVsActual > 0 ? '#f59e0b' : '#22c55e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Delayed (Stage later than planned)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>On Time (Stage earlier or equal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Actual differs from planned</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Date Details</CardTitle>
            <CardDescription>
              {mismatchCount} projects with date mismatches out of {totalProjects} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.mismatchedProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>PI #</TableHead>
                      <TableHead>Planned End</TableHead>
                      <TableHead>Actual End</TableHead>
                      <TableHead>Stage End</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>New Requested</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.mismatchedProjects.map((project) => {
                      const { dateComparisons, dates } = project;
                      const plannedVsStage = dateComparisons?.projectVsStage;
                      const plannedVsActual = getDaysDiff(
                        dates.projectFinalDelivery,
                        dates.projectEndDate
                      );

                      return (
                        <TableRow key={project.projectId}>
                          <TableCell className="font-medium">
                            {project.customerName || 'Unknown'}
                          </TableCell>
                          <TableCell>{project.piNumber || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {formatDate(dates.projectFinalDelivery)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={dates.projectEndDate ? 'default' : 'outline'}
                              className="font-mono"
                            >
                              {formatDate(dates.projectEndDate)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {formatDate(dates.stageDeliveryDate)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {dates.requestedDelivery ? (
                              <Badge variant="secondary" className="font-mono">
                                {formatDate(dates.requestedDelivery)}
                              </Badge>
                            ) : 'Not set'}
                          </TableCell>
                          <TableCell>
                            {dates.newRequestedDelivery ? (
                              <Badge variant="secondary" className="font-mono bg-purple-100 text-purple-700">
                                {formatDate(dates.newRequestedDelivery)}
                              </Badge>
                            ) : 'Not set'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {/* Planned vs Stage */}
                              {plannedVsStage && (
                                <div className="flex items-center gap-1 text-xs">
                                  {getStatusIcon(plannedVsStage.differenceInDays, plannedVsStage.whichIsEarlier)}
                                  <Badge variant={getBadgeVariant(plannedVsStage.whichIsEarlier) as any} className="text-xs">
                                    {plannedVsStage.differenceInDays}d {plannedVsStage.whichIsEarlier}
                                  </Badge>
                                </div>
                              )}
                              {/* Planned vs Actual */}
                              {plannedVsActual !== null && (
                                <div className="flex items-center gap-1 text-xs">
                                  {plannedVsActual > 0 ? (
                                    <TrendingDown className="h-3 w-3 text-yellow-500" />
                                  ) : plannedVsActual < 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Minus className="h-3 w-3 text-gray-400" />
                                  )}
                                  <Badge variant={plannedVsActual === 0 ? 'outline' : 'secondary'} className="text-xs">
                                    {plannedVsActual}d {plannedVsActual > 0 ? 'late' : plannedVsActual < 0 ? 'early' : 'on time'}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <h3 className="text-lg font-semibold text-green-700">All Projects on Track!</h3>
                <p className="text-green-600">
                  All {totalProjects} completed projects have matching dates
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompletedProjectsReport;