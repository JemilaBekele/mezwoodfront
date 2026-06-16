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
import { AlertTriangle, Calendar, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getDeliveryDateComparisonReport } from '@/service/dashboard';

// ==================== Types ====================

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
  comparison: {
    differenceInDays: number;
    whichIsEarlier: string;
    suggestion: string;
  };
  scheduleMode: string;
  difficulty: string;
}

interface NoDeliveryStageProject {
  projectId: string;
  customerName: string;
  customerPhone: string;
  piNumber: string;
  projectStatus: string;
  currentStages: string[];
  calculatedDelivery: string | null;
  manualDelivery: string | null;
  requestedDelivery: string | null;
  scheduleMode: string;
  difficulty: string;
}

interface ReportSummary {
  totalProjectsAnalyzed: number;
  projectsWithMismatch: number;
  projectsWithMissingDates: number;
  projectsWithoutDeliveryStage: number;
}

interface DeliveryDateReport {
  generatedAt: string;
  summary: ReportSummary;
  mismatchedProjects: MismatchedProject[];
  missingDatesProjects: any[];
  noDeliveryStageProjects: NoDeliveryStageProject[];
}

// ==================== Main Component ====================

const DeliveryDateComparisonReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DeliveryDateReport | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getDeliveryDateComparisonReport();
      console.log('Report data:', data);
      setReport(data);
      toast.success('Report refreshed');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch report');
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
        <p>No data available</p>
        <Button onClick={fetchReport} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const { summary, mismatchedProjects, missingDatesProjects, noDeliveryStageProjects } = report;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Delivery Date Comparison Report</h1>
          <p className="text-muted-foreground">
            Check if project delivery dates match stage delivery dates
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generated: {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <Button onClick={fetchReport}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Date Mismatch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.projectsWithMismatch}
            </div>
            <p className="text-xs text-muted-foreground">Projects need attention</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              <Calendar className="inline h-4 w-4 mr-1" />
              Missing Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.projectsWithMissingDates}
            </div>
            <p className="text-xs text-muted-foreground">Incomplete delivery dates</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              No Delivery Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.projectsWithoutDeliveryStage}
            </div>
            <p className="text-xs text-muted-foreground">Delivery stage not created</p>
          </CardContent>
        </Card>
      </div>

      {/* Mismatched Projects Table */}
      {mismatchedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Projects with Date Mismatch
            </CardTitle>
            <CardDescription>
              These projects have different delivery dates in project vs stage
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
                    <TableHead>Difference</TableHead>
                    <TableHead>Earlier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatchedProjects.map((project: MismatchedProject) => (
                    <TableRow key={project.projectId}>
                      <TableCell className="font-medium">{project.customerName}</TableCell>
                      <TableCell>{project.piNumber}</TableCell>
                      <TableCell>
                        {formatDate(project.dates?.projectFinalDelivery)}
                      </TableCell>
                      <TableCell>
                        {formatDate(project.dates?.stageDeliveryDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {project.comparison?.differenceInDays || 0} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {project.comparison?.whichIsEarlier || 'Unknown'}
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

      {/* Missing Dates Table */}
      {missingDatesProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Projects with Missing Dates</CardTitle>
            <CardDescription>
              Either project delivery date or stage delivery date is missing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>PI Number</TableHead>
                    <TableHead>Missing Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingDatesProjects.map((project: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{project.customerName}</TableCell>
                      <TableCell>{project.piNumber}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{project.missingWhat}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Delivery Stage Table */}
      {noDeliveryStageProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Projects without Delivery Stage</CardTitle>
            <CardDescription>
              These projects don&apos;t have a delivery stage created yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>PI Number</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Current Stages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noDeliveryStageProjects.map((project: NoDeliveryStageProject, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{project.customerName}</TableCell>
                      <TableCell>{project.piNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.projectStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {project.currentStages && project.currentStages.length > 0 ? (
                            project.currentStages.map((stage: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {stage}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No stages</span>
                          )}
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

      {/* No Issues State */}
      {summary.projectsWithMismatch === 0 &&
        summary.projectsWithMissingDates === 0 &&
        summary.projectsWithoutDeliveryStage === 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-10 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <h3 className="text-lg font-semibold text-green-700">All Good!</h3>
              <p className="text-green-600">
                All {summary.totalProjectsAnalyzed} projects have matching delivery dates
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default DeliveryDateComparisonReport;