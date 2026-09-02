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
import { AlertTriangle, CheckCircle, RefreshCw, Clock, CalendarDays, Bell, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getDeliveryDateComparisonReport } from '@/service/dashboard';

// ==================== Types ====================

interface Comparison {
  type: string;
  projectDeliveryDate?: string;
  stageDeliveryDate?: string;
  requestedDeliveryDate?: string;
  differenceInDays: number;
  whichIsEarlier: string;
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
    projectFinalDelivery: string;
    stageDeliveryDate: string;
  };
  comparisons?: Comparison[];
  comparison?: {
    differenceInDays: number;
    whichIsEarlier: string;
  };
  scheduleMode: string;
  difficulty: string;
}

interface RequestedDeliveryMismatchProject {
  projectId: string;
  customerName: string;
  customerPhone: string;
  piNumber: string;
  projectStatus: string;
  dates: {
    calculatedDelivery: string | null;
    manualDelivery: string | null;
    requestedDelivery: string | null;
    projectFinalDelivery: string;
    stageDeliveryDate: string;
  };
  comparison: {
    requestedVsStage: {
      differenceInDays: number;
      whichIsEarlier: string;
    };
  };
  scheduleMode: string;
  difficulty: string;
}

interface ReportSummary {
  totalProjectsAnalyzed: number;
  projectsWithMismatch: number;
  projectsWithRequestedDeliveryMismatch?: number;
  totalMismatches?: number;
}

interface DeliveryDateReport {
  generatedAt: string;
  summary: ReportSummary;
  mismatchedProjects: MismatchedProject[];
  requestedDeliveryMismatchProjects?: RequestedDeliveryMismatchProject[];
}

// ==================== Main Component ====================

const DeliveryDateComparisonReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DeliveryDateReport | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: 'requestedDate' | 'stageDate' | 'customerName' | 'status';
    direction: 'asc' | 'desc';
  }>({
    key: 'requestedDate',
    direction: 'asc', // Ascending = earliest first
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryDateComparisonReport();
      console.log('Fetched report:', data);
      console.log('Mismatched projects:', data.mismatchedProjects);
      console.log('Requested delivery mismatch projects:', data.requestedDeliveryMismatchProjects);
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
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // ==================== SORTING LOGIC ====================
  
  const handleSort = (key: 'requestedDate' | 'stageDate' | 'customerName' | 'status') => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: 'requestedDate' | 'stageDate' | 'customerName' | 'status') => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  const sortProjects = (projects: any[]) => {
    return [...projects].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'requestedDate':
          aValue = a.dates?.requestedDelivery ? new Date(a.dates.requestedDelivery).getTime() : 0;
          bValue = b.dates?.requestedDelivery ? new Date(b.dates.requestedDelivery).getTime() : 0;
          break;
        case 'stageDate':
          aValue = a.dates?.stageDeliveryDate ? new Date(a.dates.stageDeliveryDate).getTime() : 0;
          bValue = b.dates?.stageDeliveryDate ? new Date(b.dates.stageDeliveryDate).getTime() : 0;
          break;
        case 'customerName':
          aValue = (a.customerName || '').toLowerCase();
          bValue = (b.customerName || '').toLowerCase();
          break;
        case 'status':
          const getStatusValue = (p: any) => {
            const status = getDateComparisonStatus(
              p.dates?.stageDeliveryDate,
              p.dates?.requestedDelivery
            );
            const order = { 'in-time': 0, 'warning': 1, 'delayed': 2, 'unknown': 3 };
            return order[status.status] ?? 3;
          };
          aValue = getStatusValue(a);
          bValue = getStatusValue(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // ==================== END SORTING LOGIC ====================

  // ==================== COLOR CODING LOGIC ====================
  
  /**
   * Get warning status based on days until requested date
   * @param requestedDate - The customer requested delivery date
   * @returns { isWarning: boolean, warningMessage: string, warningLevel: 'none' | 'approaching' | 'overdue' }
   */
  const getRequestDateWarning = (requestedDate: string | null | undefined) => {
    if (!requestedDate) {
      return { isWarning: false, warningMessage: '', warningLevel: 'none' as const };
    }

    try {
      const requested = new Date(requestedDate);
      const today = new Date();
      // Reset time to compare dates only
      today.setHours(0, 0, 0, 0);
      requested.setHours(0, 0, 0, 0);

      if (isNaN(requested.getTime())) {
        return { isWarning: false, warningMessage: '', warningLevel: 'none' as const };
      }

      const diffTime = requested.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Overdue: Requested date is in the past
      if (diffDays < 0) {
        return {
          isWarning: true,
          warningMessage: `Overdue by ${Math.abs(diffDays)} days`,
          warningLevel: 'overdue' as const,
        };
      }

      // Approaching: Requested date is within 7 days
      if (diffDays <= 7) {
        return {
          isWarning: true,
          warningMessage: `${diffDays} days remaining`,
          warningLevel: 'approaching' as const,
        };
      }

      // All good: More than 7 days remaining
      return {
        isWarning: false,
        warningMessage: `${diffDays} days remaining`,
        warningLevel: 'none' as const,
      };
    } catch (error) {
      return { isWarning: false, warningMessage: '', warningLevel: 'none' as const };
    }
  };

  const getDateComparisonStatus = (
    stageDate: string | null | undefined,
    requestedDate: string | null | undefined
  ) => {
    const defaultStatus = {
      status: 'unknown' as const,
      color: 'bg-gray-100 text-gray-600',
      label: 'Unknown',
      badgeVariant: 'secondary' as const,
    };

    if (!stageDate || !requestedDate) {
      return defaultStatus;
    }

    try {
      const stage = new Date(stageDate);
      const requested = new Date(requestedDate);
      
      if (isNaN(stage.getTime()) || isNaN(requested.getTime())) {
        return defaultStatus;
      }

      // Check warning status for requested date
      const warning = getRequestDateWarning(requestedDate);

      // If stage > requested (delayed)
      if (stage > requested) {
        return {
          status: 'delayed' as const,
          color: 'bg-red-100 text-red-800 border-red-300',
          label: '❌ Delayed',
          badgeVariant: 'destructive' as const,
        };
      }

      // If stage <= requested (in time) but requested date is approaching or overdue
      if (stage <= requested) {
        if (warning.isWarning && warning.warningLevel === 'overdue') {
          return {
            status: 'delayed' as const,
            color: 'bg-red-100 text-red-800 border-red-300',
            label: '⚠️ Overdue!',
            badgeVariant: 'destructive' as const,
          };
        }
        if (warning.isWarning && warning.warningLevel === 'approaching') {
          return {
            status: 'warning' as const,
            color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            label: '⚠️ Approaching Deadline',
            badgeVariant: 'secondary' as const,
          };
        }
        return {
          status: 'in-time' as const,
          color: 'bg-green-100 text-green-800 border-green-300',
          label: '✅ In Time',
          badgeVariant: 'default' as const,
        };
      }

      return defaultStatus;
    } catch (error) {
      return defaultStatus;
    }
  };

  const getStatusBadge = (status: 'in-time' | 'delayed' | 'warning' | 'unknown') => {
    switch (status) {
      case 'in-time':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">In Time</Badge>;
      case 'delayed':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Delayed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Warning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusDotColor = (status: 'in-time' | 'delayed' | 'warning' | 'unknown') => {
    switch (status) {
      case 'in-time':
        return 'bg-green-500';
      case 'delayed':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getEarlierBadgeColor = (whichIsEarlier: string) => {
    if (!whichIsEarlier) return 'secondary';
    
    const lower = whichIsEarlier.toLowerCase();
    
    if (lower.includes('stage')) {
      return 'destructive';
    }
    if (lower.includes('requested')) {
      return 'secondary';
    }
    
    return 'secondary';
  };

  const getWarningBadgeColor = (warningLevel: 'none' | 'approaching' | 'overdue') => {
    switch (warningLevel) {
      case 'overdue':
        return 'destructive';
      case 'approaching':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // ==================== END COLOR CODING LOGIC ====================

  // Helper to extract stage vs requested comparison from project
  const getStageVsRequestedComparison = (project: any): { differenceInDays: number; whichIsEarlier: string } | null => {
    // Check if project has requestedVsStage in comparison
    if (project.comparison?.requestedVsStage) {
      return {
        differenceInDays: project.comparison.requestedVsStage.differenceInDays || 0,
        whichIsEarlier: project.comparison.requestedVsStage.whichIsEarlier || '',
      };
    }

    // Check if project has comparisons array with requested_stage_mismatch
    if (project.comparisons && Array.isArray(project.comparisons)) {
      const comp = project.comparisons.find((c: any) => c.type === 'requested_stage_mismatch');
      if (comp) {
        return {
          differenceInDays: comp.differenceInDays || 0,
          whichIsEarlier: comp.whichIsEarlier || '',
        };
      }
    }

    // Check if project has legacy comparison (treat as stage vs requested)
    if (project.comparison && typeof project.comparison === 'object') {
      if ('differenceInDays' in project.comparison && 'whichIsEarlier' in project.comparison) {
        return {
          differenceInDays: project.comparison.differenceInDays || 0,
          whichIsEarlier: project.comparison.whichIsEarlier || '',
        };
      }
    }

    return null;
  };

  // Build the list of projects to display
  const getDisplayProjects = (): any[] => {
    const displayProjects: any[] = [];

    // First, try to use requestedDeliveryMismatchProjects if available
    if (report?.requestedDeliveryMismatchProjects && report.requestedDeliveryMismatchProjects.length > 0) {
      return report.requestedDeliveryMismatchProjects;
    }

    // Otherwise, filter mismatchedProjects for those with stage vs requested mismatch
    if (report?.mismatchedProjects) {
      report.mismatchedProjects.forEach(project => {
        // Check if this project has a stage vs requested comparison
        const hasComparison = getStageVsRequestedComparison(project) !== null;
        
        // Also check if we can derive the comparison from dates
        if (hasComparison || (project.dates?.stageDeliveryDate && project.dates?.requestedDelivery)) {
          // Only include if stage and requested dates are different
          const stage = project.dates?.stageDeliveryDate;
          const requested = project.dates?.requestedDelivery;
          
          if (stage && requested && new Date(stage).getTime() !== new Date(requested).getTime()) {
            displayProjects.push(project);
          }
        }
      });
    }

    return displayProjects;
  };

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

  // Safely access report properties
  const summary = report.summary || {
    totalProjectsAnalyzed: 0,
    projectsWithMismatch: 0,
    projectsWithRequestedDeliveryMismatch: 0,
    totalMismatches: 0,
  };
  
  const displayProjects = getDisplayProjects();
  const sortedProjects = sortProjects(displayProjects);

  // Calculate counts for summary cards
  const inTimeCount = displayProjects.filter((p: any) => {
    const status = getDateComparisonStatus(
      p.dates?.stageDeliveryDate,
      p.dates?.requestedDelivery
    );
    return status.status === 'in-time';
  }).length;

  const delayedCount = displayProjects.filter((p: any) => {
    const status = getDateComparisonStatus(
      p.dates?.stageDeliveryDate,
      p.dates?.requestedDelivery
    );
    return status.status === 'delayed';
  }).length;

  const warningCount = displayProjects.filter((p: any) => {
    const status = getDateComparisonStatus(
      p.dates?.stageDeliveryDate,
      p.dates?.requestedDelivery
    );
    return status.status === 'warning';
  }).length;

  const totalAnalyzed = summary.totalProjectsAnalyzed || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Delivery Date Comparison Report</h1>
          <p className="text-muted-foreground">
            Check if stage delivery dates match customer requested delivery dates
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : ''}
          </p>
        </div>
        <Button onClick={fetchReport}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Legend */}
      <Card className="border-0 bg-muted/50">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium">Status Legend:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">In Time (Stage &lt;= Requested)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Warning (Deadline approaching)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Delayed (Stage &gt; Requested or Overdue)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              In Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inTimeCount}
            </div>
            <p className="text-xs text-muted-foreground">Stage date meets requested date</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              <Bell className="inline h-4 w-4 mr-1" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {warningCount}
            </div>
            <p className="text-xs text-muted-foreground">Deadline approaching (&lt;= 7 days)</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {delayedCount}
            </div>
            <p className="text-xs text-muted-foreground">Stage date exceeds requested date</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              <CalendarDays className="inline h-4 w-4 mr-1" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {totalAnalyzed}
            </div>
            <p className="text-xs text-muted-foreground">Projects analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      {displayProjects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Stage vs Requested Date Comparison
            </CardTitle>
            <CardDescription>
              {displayProjects.length} project{displayProjects.length > 1 ? 's' : ''} with stage and requested delivery date comparison
              {sortConfig.key === 'requestedDate' && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Sorted by requested date: {sortConfig.direction === 'asc' ? 'earliest first' : 'latest first'})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('customerName')}
                    >
                      Customer {getSortIcon('customerName')}
                    </TableHead>
                    <TableHead>PI Number</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('stageDate')}
                    >
                      Stage Date {getSortIcon('stageDate')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort('requestedDate')}
                    >
                      Requested Date {getSortIcon('requestedDate')}
                    </TableHead>
                    <TableHead>Days Until Requested</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Earlier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project: any) => {
                    const comparison = getStageVsRequestedComparison(project);
                    const differenceInDays = comparison?.differenceInDays || 0;
                    const whichIsEarlier = comparison?.whichIsEarlier || '';
                    
                    const status = getDateComparisonStatus(
                      project.dates?.stageDeliveryDate,
                      project.dates?.requestedDelivery
                    );

                    const warning = getRequestDateWarning(project.dates?.requestedDelivery);
                    
                    return (
                      <TableRow key={project.projectId} className={status.color}>
                        <TableCell className="font-medium">{project.customerName || 'N/A'}</TableCell>
                        <TableCell>{project.piNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${getStatusDotColor(status.status)}`} />
                            {getStatusBadge(status.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(project.dates?.stageDeliveryDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(project.dates?.requestedDelivery)}
                        </TableCell>
                        <TableCell>
                          {warning.isWarning ? (
                            <Badge 
                              variant={getWarningBadgeColor(warning.warningLevel) as any}
                              className="text-xs"
                            >
                              {warning.warningMessage}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {warning.warningMessage || 'N/A'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={status.status === 'delayed' ? 'destructive' : status.status === 'warning' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {Math.abs(differenceInDays)} days {differenceInDays > 0 ? 'late' : differenceInDays < 0 ? 'early' : 'same'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getEarlierBadgeColor(whichIsEarlier) as any}
                            className="text-xs"
                          >
                            {whichIsEarlier || 'Same date'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-10 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-green-700">All Good!</h3>
            <p className="text-green-600">
              All {totalAnalyzed} projects have matching stage and requested delivery dates
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliveryDateComparisonReport;