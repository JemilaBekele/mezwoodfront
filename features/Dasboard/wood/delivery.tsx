// components/DeliveryDateComparisonReport.tsx

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
import { AlertTriangle, Calendar, CheckCircle, RefreshCw, Clock } from 'lucide-react';
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

// Backward compatibility for old data structure
interface LegacyComparison {
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
  comparison?: LegacyComparison; // For backward compatibility
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

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryDateComparisonReport();
      console.log('Fetched report:', data);
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

  const getComparisonBadgeColor = (type: string) => {
    switch (type) {
      case 'project_stage_mismatch':
        return 'destructive';
      case 'requested_stage_mismatch':
        return 'warning';
      case 'requested_project_mismatch':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getComparisonLabel = (type: string) => {
    switch (type) {
      case 'project_stage_mismatch':
        return 'Project vs Stage';
      case 'requested_stage_mismatch':
        return 'Requested vs Stage';
      case 'requested_project_mismatch':
        return 'Requested vs Project';
      default:
        return type;
    }
  };

  // Get color for "Earlier" badge based on which date is earlier
  const getEarlierBadgeColor = (whichIsEarlier: string, comparisonType?: string) => {
    if (!whichIsEarlier) return 'secondary';
    
    const lower = whichIsEarlier.toLowerCase();
    
    // For Project vs Stage comparison
    if (comparisonType === 'project_stage_mismatch' || !comparisonType) {
      // If Stage is earlier -> Bad (red) - Stage is ahead of project
      if (lower.includes('stage')) {
        return 'destructive';
      }
      // If Project is earlier -> Warning (yellow) - Project is ahead of stage
      if (lower.includes('project')) {
        return 'warning';
      }
    }
    
    // For Requested vs Stage comparison
    if (comparisonType === 'requested_stage_mismatch') {
      // If Stage is earlier than requested -> Bad (red) - Stage is ahead of customer request
      if (lower.includes('stage')) {
        return 'destructive';
      }
      // If Requested is earlier than stage -> Warning (yellow) - Customer wants it earlier
      if (lower.includes('requested')) {
        return 'warning';
      }
    }
    
    // For Requested vs Project comparison
    if (comparisonType === 'requested_project_mismatch') {
      // If Project is earlier than requested -> Info (blue) - Project is ahead of customer request
      if (lower.includes('project')) {
        return 'info';
      }
      // If Requested is earlier than project -> Warning (yellow) - Customer wants it earlier
      if (lower.includes('requested')) {
        return 'warning';
      }
    }
    
    // Default fallback
    return 'secondary';
  };

  // Helper to get comparisons array from project
  const getComparisons = (project: MismatchedProject): Comparison[] => {
    // If comparisons array exists, use it
    if (project.comparisons && project.comparisons.length > 0) {
      return project.comparisons;
    }
    
    // If legacy comparison object exists, convert to array
    if (project.comparison) {
      return [{
        type: 'project_stage_mismatch',
        differenceInDays: project.comparison.differenceInDays,
        whichIsEarlier: project.comparison.whichIsEarlier,
      }];
    }
    
    return [];
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

  // Safely access report properties with fallbacks
  const summary = report.summary || {
    totalProjectsAnalyzed: 0,
    projectsWithMismatch: 0,
    projectsWithRequestedDeliveryMismatch: 0,
    totalMismatches: 0,
  };
  
  const mismatchedProjects = report.mismatchedProjects || [];
  const requestedDeliveryMismatchProjects = report.requestedDeliveryMismatchProjects || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Delivery Date Comparison Report</h1>
          <p className="text-muted-foreground">
            Check if project delivery dates match stage delivery dates and customer requests
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}
          </p>
        </div>
        <Button onClick={fetchReport}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Color Legend */}
      {/* <Card className="border-0 bg-muted/50">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">Stage Earlier</Badge>
              <span className="text-muted-foreground">Stage is ahead (needs attention)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="destructive" className="text-xs">Project/Requested Earlier</Badge>
              <span className="text-muted-foreground">Project/Requested is ahead</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="destructive" className="text-xs">Project Ahead of Request</Badge>
              <span className="text-muted-foreground">Project delivery is earlier than requested</span>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Date Mismatches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.projectsWithMismatch || 0}
            </div>
            <p className="text-xs text-muted-foreground">Projects with mismatched dates</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              <Clock className="inline h-4 w-4 mr-1" />
              Requested Date Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.projectsWithRequestedDeliveryMismatch || 0}
            </div>
            <p className="text-xs text-muted-foreground">Customer requested date mismatches</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              Total Mismatches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalMismatches || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total comparison mismatches found</p>
          </CardContent>
        </Card>
      </div>

      {/* Mismatched Projects Table */}
      {mismatchedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Projects with Date Mismatches
            </CardTitle>
            <CardDescription>
              These projects have mismatches between project, stage, or requested delivery dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>PI Number</TableHead>
                    <TableHead>Project Date</TableHead>
                    <TableHead>Stage Date</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Mismatch Type</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Earlier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatchedProjects.map((project: MismatchedProject) => {
                    const comparisons = getComparisons(project);
                    return (
                      <TableRow key={project.projectId}>
                        <TableCell className="font-medium">{project.customerName || 'N/A'}</TableCell>
                        <TableCell>{project.piNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {formatDate(project.dates?.projectFinalDelivery)}
                        </TableCell>
                        <TableCell>
                          {formatDate(project.dates?.stageDeliveryDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(project.dates?.requestedDelivery)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {comparisons.length > 0 ? (
                              comparisons.map((comp, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={getComparisonBadgeColor(comp.type) as any}
                                  className="text-xs"
                                >
                                  {getComparisonLabel(comp.type)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">Project vs Stage</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {comparisons.length > 0 ? (
                              comparisons.map((comp, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {comp.differenceInDays || 0} days
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {project.comparison?.differenceInDays || 0} days
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {comparisons.length > 0 ? (
                              comparisons.map((comp, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={getEarlierBadgeColor(comp.whichIsEarlier, comp.type) as any}
                                  className="text-xs"
                                >
                                  {comp.whichIsEarlier || 'N/A'}
                                </Badge>
                              ))
                            ) : (
                              <Badge 
                                variant={getEarlierBadgeColor(project.comparison?.whichIsEarlier || '') as any}
                                className="text-xs"
                              >
                                {project.comparison?.whichIsEarlier || 'N/A'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requested Delivery Mismatch Projects Table */}
      {requestedDeliveryMismatchProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Requested Delivery Date Issues
            </CardTitle>
            <CardDescription>
              Customer requested delivery dates that don&apos;t match stage delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>PI Number</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Stage Date</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Earlier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestedDeliveryMismatchProjects.map((project: RequestedDeliveryMismatchProject) => (
                    <TableRow key={project.projectId}>
                      <TableCell className="font-medium">{project.customerName || 'N/A'}</TableCell>
                      <TableCell>{project.piNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {formatDate(project.dates?.requestedDelivery)}
                      </TableCell>
                      <TableCell>
                        {formatDate(project.dates?.stageDeliveryDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-xs">
                          {project.comparison?.requestedVsStage?.differenceInDays || 0} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getEarlierBadgeColor(
                            project.comparison?.requestedVsStage?.whichIsEarlier || '',
                            'requested_stage_mismatch'
                          ) as any}
                          className="text-xs"
                        >
                          {project.comparison?.requestedVsStage?.whichIsEarlier || 'N/A'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues State */}
      {summary.projectsWithMismatch === 0 && 
       (summary.projectsWithRequestedDeliveryMismatch === 0 || !summary.projectsWithRequestedDeliveryMismatch) && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-10 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-green-700">All Good!</h3>
            <p className="text-green-600">
              All {summary.totalProjectsAnalyzed || 0} projects have matching delivery dates
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliveryDateComparisonReport;