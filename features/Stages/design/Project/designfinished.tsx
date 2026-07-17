/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateEth, formatMinutes, formatTimeEth, formatTimeGregorian } from '@/lib/format';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Loader2,
  TrendingUp,
  Settings,
  Truck,
  Home,
  Hammer,
  Paintbrush,
  Scissors,
  CalendarDays,
  User,
  Award,
  BarChart3,
  Layers,
  Package,
  Wrench,
  PenTool,
  Ruler,
  ListChecks,
  FileCheck,
  Eye,
  Box,
  Download,
  Image as ImageIcon,
  History,
  FileWarning,
  CheckCircle,
  Package2,
  Plus,
} from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel, IProjectStage, DesignStatus, IProjectLog, StageStatus, WorkShift } from '@/models/Projects';
import { getProjectId, updateProjectDesignStatus } from '@/service/Project';
import { Separator } from '@/components/ui/separator';
import { IProformaInvoice, } from '@/models/ProformaInvoice';
import { getProformaInvoiceById } from '@/service/ProformaInvoice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { normalizeImagePath } from '@/lib/norm';

// Helper function for image URLs


type BadgeVariant = "link" | "secondary" | "default" | "outline" | "ghost" | "destructive" | null | undefined;

type ProjectDetailProps = {
  id?: string;
};

const FinDesignProjectDetailPage: React.FC<ProjectDetailProps> = ({ id }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [proformaInvoice, setProformaInvoice] = useState<IProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingDesign, setUpdatingDesign] = useState(false);
  const [autoFinishTriggered, setAutoFinishTriggered] = useState(false);
  const router = useRouter();

  // Filter stages to only show DESIGN stage
  const getDesignStages = (stages?: IProjectStage[]) => {
    if (!stages) return [];
    return stages.filter(stage => stage.stage === ProjectStatus.DESIGN);
  };

  // Get design status configuration
const getDesignStatusConfig = (status?: DesignStatus) => {
  const config: Record<
    DesignStatus,
    {
      label: string;
      variant: BadgeVariant;
      icon: any;
      color: string;
      description: string;
    }
  > = {
    [DesignStatus.INITIATED]: {
      label: 'Initiated',
      variant: 'secondary',
      icon: PenTool,
      color: 'text-gray-500',
      description: 'Design process has been initiated',
    },
    [DesignStatus.MODELING]: {
      label: '3D Modeling',
      variant: 'outline',
      icon: PenTool,
      color: 'text-purple-500',
      description: 'Creating 3D models and visualizations',
    },
    [DesignStatus.DRAFTING]: {
      label: 'Technical Drafting',
      variant: 'outline',
      icon: Ruler,
      color: 'text-blue-500',
      description: 'Creating technical drawings and specifications',
    },
    [DesignStatus.CUTLIST]: {
      label: 'Cut List',
      variant: 'outline',
      icon: Scissors,
      color: 'text-amber-500',
      description: 'Generating cut lists for manufacturing',
    },
    [DesignStatus.BOQ]: {
      label: 'Bill of Quantities',
      variant: 'outline',
      icon: ListChecks,
      color: 'text-green-500',
      description: 'Preparing bill of quantities and material lists',
    },
    [DesignStatus.DESIGN_FINISHED]: {
      label: 'Design Finished',
      variant: 'default',
      icon: FileCheck,
      color: 'text-emerald-500',
      description: 'Design phase completed but awaiting final approval or stock check',
    },
    [DesignStatus.FINISHED]: {
      label: 'Finished',
      variant: 'default',
      icon: CheckCircle,
      color: 'text-green-600',
      description: 'Project fully completed',
    },
  };

  return status ? config[status] : null;
};

  // Fetch project data and associated proforma invoice
  const fetchProjectData = React.useCallback(async () => {
    try {
      if (id) {
        const projectData = await getProjectId(id);
        setProject(projectData);

        if (projectData.invoice?.id) {
          try {
            const invoice = await getProformaInvoiceById(projectData.invoice.id);
            setProformaInvoice(invoice);
          } catch (error) {
            console.error('Error fetching proforma invoice:', error);
          }
        }
      }
    } catch (error: any) {
      toast.error('Failed to fetch project details');
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  /* =========================
      UPDATE DESIGN STATUS
  ========================= */
  const handleDesignUpdate = async (stage: DesignStatus) => {
    if (!project) return;

    const confirmChange = window.confirm(
      `Are you sure you want to change design status to "${stage.replace('_', ' ')}"?`
    );

    if (!confirmChange) return;

    try {
      setUpdatingDesign(true);
      await updateProjectDesignStatus(project.id, stage);
      await fetchProjectData();
      toast.success(`Design status updated to ${stage.replace('_', ' ')} successfully`);
    } catch (error: any) {
      console.error(error.message);
      toast.error(error.message || 'Failed to update design status');
    } finally {
      setUpdatingDesign(false);
    }
  };

  // Auto-finish design when work units mismatch
  useEffect(() => {
    const shouldAutoFinishDesign = () => {
      if (!project) return false;
      
      // Don't auto-finish if already triggered
      if (autoFinishTriggered) {
        return false;
      }

      const designStages = getDesignStages(project.stages);
      if (designStages.length === 0) {
        return false;
      }

      // Check if any design stage has work units != actual work units
      // This is the primary validation - regardless of design status
      const hasMismatch = designStages.some(stage => 
        stage.workUnits !== undefined && 
        stage.actualWorkUnits !== undefined && 
        stage.workUnits !== stage.actualWorkUnits &&
        stage.actualWorkUnits !== null &&
        stage.actualWorkUnits > 0 // Only auto-finish if actual work units are set
      );

  
      
      return hasMismatch;
    };

    if (project && !loading && !updatingDesign && !autoFinishTriggered) {
      const shouldAutoFinish = shouldAutoFinishDesign();
   
      
      if (shouldAutoFinish) {
        setAutoFinishTriggered(true);
        
        const autoFinish = async () => {
          try {
            setUpdatingDesign(true);
            await updateProjectDesignStatus(project.id, DesignStatus.FINISHED);
            await fetchProjectData();
        
            setAutoFinishTriggered(false);
          } catch (error: any) {
            setAutoFinishTriggered(false);
           
          } finally {
            setUpdatingDesign(false);
          }
        };
        autoFinish();
      }
    }
  }, [project, loading, autoFinishTriggered, updatingDesign, fetchProjectData]);

  // Status badge configuration
  const getStatusConfig = (status: ProjectStatus) => {
    const config: Record<ProjectStatus, { 
      label: string; 
      variant: BadgeVariant; 
      icon: any; 
      color: string;
    }> = {
      [ProjectStatus.INVOICE]: {
        label: 'Invoice',
        variant: 'secondary',
        icon: FileText,
        color: 'text-gray-500',
      },
      [ProjectStatus.DESIGN]: {
        label: 'Design',
        variant: 'default',
        icon: Settings,
        color: 'text-blue-500',
      },
      [ProjectStatus.PURCHASING]: {
        label: 'Purchasing',
        variant: 'outline',
        icon: Package,
        color: 'text-purple-500',
      },
      [ProjectStatus.CUTTING]: {
        label: 'Cutting',
        variant: 'default',
        icon: Scissors,
        color: 'text-amber-500',
      },
      [ProjectStatus.EDGE_BANDING]: {
        label: 'Edge Banding',
        variant: 'outline',
        icon: Layers,
        color: 'text-teal-500',
      },
      [ProjectStatus.PAINTING]: {
        label: 'Painting',
        variant: 'default',
        icon: Paintbrush,
        color: 'text-indigo-500',
      },
      [ProjectStatus.ASSEMBLY]: {
        label: 'Assembly',
        variant: 'outline',
        icon: Hammer,
        color: 'text-orange-500',
      },
      [ProjectStatus.FINISHING]: {
        label: 'Finishing',
        variant: 'default',
        icon: Award,
        color: 'text-yellow-500',
      },
      [ProjectStatus.DELIVERY]: {
        label: 'Delivery',
        variant: 'outline',
        icon: Truck,
        color: 'text-green-500',
      },
      [ProjectStatus.INSTALLATION]: {
        label: 'Installation',
        variant: 'default',
        icon: Home,
        color: 'text-emerald-500',
      }, 
      [ProjectStatus.METAL_WORKS]: {
        label: 'Metal Works',
        variant: 'outline',
        icon: Wrench,
        color: 'text-zinc-500',
      },
      [ProjectStatus.CNC]: {
        label: 'CNC',
        variant: 'outline',
        icon: Wrench,
        color: 'text-zinc-500',
      },
    };
    return config[status];
  };

  // Difficulty badge configuration
  const getDifficultyConfig = (difficulty: DifficultyLevel) => {
    const config: Record<DifficultyLevel, { 
      label: string; 
      variant: BadgeVariant; 
      icon: any; 
      color: string;
    }> = {
      [DifficultyLevel.EASY]: {
        label: 'Easy',
        variant: 'default',
        icon: TrendingUp,
        color: 'text-green-500',
      },
      [DifficultyLevel.MEDIUM]: {
        label: 'Medium',
        variant: 'outline',
        icon: BarChart3,
        color: 'text-yellow-500',
      },
      [DifficultyLevel.HARD]: {
        label: 'Hard',
        variant: 'destructive',
        icon: BarChart3,
        color: 'text-red-500',
      },
    };
    return config[difficulty];
  };



  // Group project logs by date
  const getGroupedLogs = (logs?: IProjectLog[]) => {
    if (!logs) return {};
    const grouped: { [key: string]: IProjectLog[] } = {};
    logs.forEach(log => {
      const date = formatDate(log.createdAt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    return grouped;
  };

  // Filtered stages for display
  const designStages = getDesignStages(project?.stages);
  const hasDesignStage = designStages.length > 0;
  const groupedLogs = getGroupedLogs(project?.projectLogs);
  const hasLogs = project?.projectLogs && project.projectLogs.length > 0;
  
  const projectStatusConfig = project ? getStatusConfig(project.status) : null;
  const difficultyConfig = project ? getDifficultyConfig(project.difficulty) : null;
  const designStatusConfig = project?.designStatus ? getDesignStatusConfig(project.designStatus) : null;
const formatDescription = (text: string, limit = 80) => {
  if (text.length <= limit) return text;

  const firstLine = text.slice(0, limit);
  const secondLine = text.slice(limit);

  return (
    <>
      {firstLine}
      <br />
      {secondLine}
    </>
  );
};
const calculateStageProgress = (stage: any) => {
  if (!stage.workUnits || stage.workUnits === 0) return 0;
  const actualUnits = stage.actualWorkUnits || 0;
  return Math.round((actualUnits / stage.workUnits) * 100);
};
  const hasStages = project?.stages && project.stages.length > 0;
  const getStageStatusConfig = (status: StageStatus) => {
    const config: Record<StageStatus, { label: string; variant: BadgeVariant; color: string }> = {
      [StageStatus.ACTIVE]: {
        label: 'Active',
        variant: 'default',
        color: 'text-blue-500',
      },
      [StageStatus.IN_PROGRESS]: {
        label: 'In Progress',
        variant: 'outline',
        color: 'text-yellow-500',
      },
      [StageStatus.COMPLETED]: {
        label: 'Completed',
        variant: 'default',
        color: 'text-green-500',
      },
      [StageStatus.CANCELLED]: {
        label: 'Cancelled',
        variant: 'destructive',
        color: 'text-red-500',
      },
    };
    return config[status];
  };


  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading design project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {projectStatusConfig && (
                <>
                  <projectStatusConfig.icon className={`h-4 w-4 ${projectStatusConfig.color}`} />
                  <span>Project Status</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectStatusConfig && (
              <Badge variant={projectStatusConfig.variant} className="px-3 py-1 text-sm">
                {projectStatusConfig.label}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Difficulty Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {difficultyConfig && (
                <>
                  <difficultyConfig.icon className={`h-4 w-4 ${difficultyConfig.color}`} />
                  <span>Difficulty</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {difficultyConfig && (
              <Badge variant={difficultyConfig.variant} className="px-3 py-1 text-sm">
                {difficultyConfig.label}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Design Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {designStatusConfig ? (
                <>
                  <designStatusConfig.icon className={`h-4 w-4 ${designStatusConfig.color}`} />
                  <span>Design Status</span>
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4 text-blue-500" />
                  <span>Design Status</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
        
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Design Stage Focus */}
      <div className="space-y-6">
        {/* Design Stage Card */}
        <Card className="border-blue-200 shadow-md">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span className="text-blue-900">Design Stage Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {hasDesignStage ? (
              <div className="space-y-6">
                {designStages.map((stage) => {
                  const stageConfig = getStatusConfig(stage.stage);
                  const isActive = stage.status === 'ACTIVE' || stage.status === 'IN_PROGRESS';
                  const isCompleted = stage.status === 'COMPLETED';
                  const hasMismatch = stage.workUnits !== undefined && 
                                      stage.actualWorkUnits !== undefined && 
                                      stage.workUnits !== stage.actualWorkUnits;
                  
                  return (
                    <div key={stage.id} className="space-y-6">
                      {/* Stage Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-100' : 
                            isActive ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              stageConfig && <stageConfig.icon className={`h-6 w-6 ${stageConfig.color}`} />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{stageConfig?.label || 'Design'}</h3>
                            <p className="text-sm text-muted-foreground">Stage ID: {stage.id.substring(0, 8)}</p>
                          </div>
                        </div>
                        <Badge
                          variant={isCompleted ? 'default' : isActive ? 'outline' : 'secondary'}
                          className={`px-3 py-1 ${
                            isCompleted ? 'bg-green-500' : 
                            isActive ? 'border-blue-500 text-blue-700' : ''
                          }`}
                        >
                          {isCompleted ? 'Completed' : 
                           isActive ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>


                      {/* Stage Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Key Metrics */}
                        <div className="space-y-4">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Key Metrics</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Duration</span>
                                <span className="font-semibold">{stage.capacityDays} days</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Work Units</span>
                                <span className={`font-semibold ${hasMismatch ? 'text-amber-600' : 'text-green-600'}`}>
                                  {stage.workUnits || 0}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Actual Units</span>
                                <span className={`font-semibold ${hasMismatch ? 'text-amber-600' : 'text-green-600'}`}>
                                  {stage.actualWorkUnits || 0}
                                </span>
                              </div>
                              {hasMismatch && (
                                <div className="flex justify-between items-center text-xs text-amber-600">
                                  <span>Difference</span>
                                  <span className="font-medium">
                                    {Math.abs((stage.actualWorkUnits || 0) - (stage.workUnits || 0))} units
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Scheduling</span>
                                <Badge variant="outline" className="text-xs">
                                  {stage.autoSchedule ? 'Auto-scheduled' : 'Manual'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Schedule */}
                        <div className="space-y-4">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Schedule</h4>
                            <div className="space-y-3">
                              {stage.startDate ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Start Date</p>
                                    <p className="font-medium">{formatDate(stage.startDate)}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Start date not scheduled</p>
                              )}
                              
                              {stage.endDate ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">End Date</p>
                                    <p className="font-medium">{formatDate(stage.endDate)}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">End date not scheduled</p>
                              )}

                              {stage.startDate && stage.endDate && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Duration</p>
                                      <p className="font-medium">
                                        {Math.ceil((new Date(stage.endDate).getTime() - new Date(stage.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No design stage information available for this project</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proforma Invoice Card */}
      {/* Add Tabs for Stages and Proforma Invoice */}
            <Tabs defaultValue="proforma" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="proforma" className="text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Proforma Invoice
                  </TabsTrigger>
                  <TabsTrigger value="stages" className="text-sm">
                    <Package2 className="h-4 w-4 mr-2" />
                    Stages
                  </TabsTrigger>
                
                </TabsList>
   
           {/* Stages Tab Content */}
           <TabsContent value="stages" className="mt-4">
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-4">
                 <div className="flex items-center gap-2">
                   <CardTitle className="flex items-center gap-2 text-base">
                     <Package2 className="h-4 w-4 text-muted-foreground" />
                     Stages
                   </CardTitle>
                   {hasStages && (
                     <Badge variant="secondary" className="text-xs">{project.stages!.length}</Badge>
                   )}
                 </div>
               
               </CardHeader>
               <CardContent>
                 {hasStages ? (
                   <>
                     {/* Summary Strip */}
                     <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                       {[
                         { label: 'Planned Units', value: project.stages!.reduce((s, st) => s + (st.workUnits || 0), 0), color: '' },
                         { label: 'Actual Units', value: project.stages!.reduce((s, st) => s + (st.actualWorkUnits || 0), 0), color: 'text-emerald-600' },
                         { label: 'Time Taken', value: formatMinutes(project.stages!.reduce((s, st) => s + (st.timeTaken || 0), 0)), color: 'text-blue-600' },
                         { label: 'Total Duration', value: `${project.totalDays || 0} days`, color: 'text-primary' },
                       ].map((stat) => (
                         <div key={stat.label} className="rounded-lg border bg-muted/20 px-3 py-2 text-center">
                           <p className={`text-base font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                           <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                         </div>
                       ))}
                     </div>
   
                     {/* Mobile View */}
                     <div className="space-y-3 md:hidden">
                       {project.stages!.map((stage) => {
                         const stageConfig = getStatusConfig(stage.stage);
                         const stageStatusConfig = getStageStatusConfig(stage.status);
                         const stageProgress = calculateStageProgress(stage);
   
                         return (
                           <div key={stage.id} className="rounded-lg border p-4 space-y-3">
                             <div className="flex items-start justify-between">
                               <div className="flex items-center gap-2">
                                 <stageConfig.icon className={`h-4 w-4 ${stageConfig.color}`} />
                                 <h4 className="font-semibold text-sm">{stageConfig.label}</h4>
                               </div>
                               <Badge variant={stageStatusConfig.variant as any} className="text-[11px]">
                                 {stageStatusConfig.label}
                               </Badge>
                             </div>
   
                             <div className="grid grid-cols-2 gap-2">
                               {[
                                 { label: 'Duration', value: `${stage.capacityDays} day${stage.capacityDays !== 1 ? 's' : ''}` },
                                 { label: 'Scheduling', value: stage.autoSchedule ? 'Auto' : 'Manual' },
                                 { label: 'Planned', value: stage.workUnits || 0 },
                                 { label: 'Actual', value: stage.actualWorkUnits || 0 },
                               ].map((item) => (
                                 <div key={item.label} className="rounded-md bg-muted/40 px-2.5 py-1.5">
                                   <p className="text-[10px] text-muted-foreground">{item.label}</p>
                                   <p className="text-sm font-medium">{item.value}</p>
                                 </div>
                               ))}
                             </div>
   
                             {stage.workUnits && stage.workUnits > 0 && (
                               <div className="space-y-1">
                                 <div className="flex items-center justify-between text-[11px]">
                                   <span className="text-muted-foreground">Completion</span>
                                   <span className="font-semibold">{stageProgress}%</span>
                                 </div>
                                 <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                   <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${stageProgress}%` }} />
                                 </div>
                               </div>
                             )}
   
                             {stage.startDate && stage.endDate && (
                               <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                                 <p>{formatDate(stage.startDate)} → {formatDate(stage.endDate)}</p>
                                 <p className="text-[10px] italic">{formatDateEth(stage.startDate)} → {formatDateEth(stage.endDate)}</p>
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
   
                     {/* Desktop Table */}
                     <div className="hidden md:block overflow-x-auto rounded-lg border">
                       <Table>
                         <TableHeader>
                           <TableRow className="bg-muted/30">
                             <TableHead className="text-xs font-semibold py-2">Stage</TableHead>
                             <TableHead className="text-xs font-semibold py-2">Status</TableHead>
                             <TableHead className="text-xs font-semibold py-2">Shift</TableHead>
                             <TableHead className="text-xs font-semibold py-2">Days</TableHead>
                             <TableHead className="text-xs font-semibold py-2 text-right">Plan</TableHead>
                             <TableHead className="text-xs font-semibold py-2 text-right">Actual</TableHead>
                             <TableHead className="text-xs font-semibold py-2">Time</TableHead>
                             <TableHead className="text-xs font-semibold py-2">Sched</TableHead>
                             <TableHead className="text-xs font-semibold py-2">Start</TableHead>
                             <TableHead className="text-xs font-semibold py-2">End</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {project.stages!.map((stage) => {
                             const stageConfig = getStatusConfig(stage.stage);
                             const stageStatusConfig = getStageStatusConfig(stage.status);
   
                             const getShiftLabel = (shift?: WorkShift | null) => {
                               switch (shift) {
                                 case WorkShift.MORNING: return 'Morning';
                                 case WorkShift.AFTERNOON: return 'Afternoon';
                                 case WorkShift.FULL_DAY: return 'Full Day';
                                 case WorkShift.CUSTOM: return 'Custom';
                                 default: return '';
                               }
                             };
   
                             return (
                               <TableRow key={stage.id} className="hover:bg-muted/20">
                                 <TableCell className="py-1.5">
                                   <div className="flex items-center gap-1.5">
                                     <stageConfig.icon className={`h-3 w-3 ${stageConfig.color}`} />
                                     <span className="text-xs font-medium">{stageConfig.label}</span>
                                   </div>
                                 </TableCell>
                                 <TableCell className="py-1.5">
                                   <Badge variant={stageStatusConfig.variant} className="text-[10px] h-5">
                                     {stageStatusConfig.label}
                                   </Badge>
                                 </TableCell>
                                 <TableCell className="py-1.5">
                                   <div className="flex flex-col">
                                     <span className="text-xs">{getShiftLabel(stage.shift)}</span>
                                     {stage.shift === WorkShift.CUSTOM && stage.customStartTime && stage.customEndTime && (
                                       <span className="text-[10px] text-muted-foreground">
                                         {formatTimeGregorian(stage.customStartTime)} - {formatTimeGregorian(stage.customEndTime)}
                                       </span>
                                     )}
                                   </div>
                                 </TableCell>
                                 <TableCell className="py-1.5 tabular-nums text-xs">{stage.capacityDays}d</TableCell>
                                 <TableCell className="py-1.5 text-right tabular-nums text-xs font-medium">{stage.workUnits || 0}</TableCell>
                                 <TableCell className="py-1.5 text-right tabular-nums text-xs font-medium">{stage.actualWorkUnits || 0}</TableCell>
                                 <TableCell className="py-1.5">
                                   {stage.timeTaken !== undefined && stage.timeTaken !== null ? (
                                     <span className="text-xs tabular-nums">{formatMinutes(stage.timeTaken)}</span>
                                   ) : (
                                     <span className="text-xs text-muted-foreground">—</span>
                                   )}
                                 </TableCell>
                                 <TableCell className="py-1.5">
                                   <span className={`text-xs ${stage.autoSchedule ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                     {stage.autoSchedule ? 'Auto' : 'Manual'}
                                   </span>
                                 </TableCell>
                                 <TableCell className="py-1.5">
                                   <div className="flex flex-col gap-0.5">
                                     <span className="text-xs">{stage.startDate ? formatDate(stage.startDate) : '—'}</span>
                                     {stage.startDate && (
                                       <span className="text-[10px] text-muted-foreground italic">{formatDateEth(stage.startDate)}</span>
                                     )}
                                     {stage.startDateTime && (
                                       <div className="flex items-center gap-1.5">
                                         <span className="text-[10px] text-muted-foreground">{formatTimeGregorian(stage.startDateTime)}</span>
                                         <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{formatTimeEth(stage.startDateTime)}</span>
                                       </div>
                                     )}
                                   </div>
                                 </TableCell>
                                 <TableCell className="py-1.5">
                                   <div className="flex flex-col gap-0.5">
                                     <span className="text-xs">{stage.endDate ? formatDate(stage.endDate) : '—'}</span>
                                     {stage.endDate && (
                                       <span className="text-[10px] text-muted-foreground italic">{formatDateEth(stage.endDate)}</span>
                                     )}
                                     {stage.endDateTime && (
                                       <div className="flex items-center gap-1.5">
                                         <span className="text-[10px] text-muted-foreground">{formatTimeGregorian(stage.endDateTime)}</span>
                                         <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{formatTimeEth(stage.endDateTime)}</span>
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
                   </>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-16 text-center">
                     <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                       <Package2 className="h-7 w-7 text-muted-foreground/60" />
                     </div>
                     <h3 className="mt-4 text-sm font-semibold">No stages created</h3>
                     <p className="mt-1 text-xs text-muted-foreground">Add stages to track project progress</p>
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
   
           {/* Proforma Invoice Tab Content */}
           <TabsContent value="proforma" className="mt-4">
             {proformaInvoice ? (
               <Card>
                 <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between">
                   <CardTitle className="flex items-center gap-2">
                     <FileText className="h-5 w-5" />
                     Proforma Invoice Information
                   </CardTitle>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() =>
                       router.push(`/dashboard/Stage/Design/adissional/${proformaInvoice.id}`)
                     }
                     className="w-full sm:w-auto"
                   >
                     Update PI
                   </Button>
                 </CardHeader>
                   <CardContent className="space-y-6">
                           {/* Basic Info */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                               <p className="text-sm font-medium text-muted-foreground">PI Number</p>
                               <p className="font-medium text-sm md:text-base">{proformaInvoice.piNumber}</p>
                             </div>
                             <div>
                               <p className="text-sm font-medium text-muted-foreground">Status</p>
                               <Badge variant="outline" className="mt-1 text-sm">
                                 {proformaInvoice.status.replace(/_/g, ' ')}
                               </Badge>
                             </div>
                           </div>
               
                           {/* Tabs for organizing content */}
                           <Tabs defaultValue="items" className="w-full">
                             <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                               <TabsTrigger value="items" className="text-xs sm:text-sm">Products</TabsTrigger>
                               <TabsTrigger value="materials" className="text-xs sm:text-sm">Materials</TabsTrigger>
                               <TabsTrigger value="images" className="text-xs sm:text-sm">Images</TabsTrigger>
                               <TabsTrigger value="attachments" className="text-xs sm:text-sm">Attachments</TabsTrigger>
                                               <TabsTrigger value="attachments" className="text-xs sm:text-sm">Description</TabsTrigger>
               
                             </TabsList>
               
                             {/* Items Tab */}
                             <TabsContent value="items" className="space-y-4 mt-4">
                               {proformaInvoice.items && proformaInvoice.items.length > 0 ? (
                                 <div className="space-y-4">
                                   {/* Mobile View - Cards */}
                                   <div className="space-y-3 md:hidden">
                                     {proformaInvoice.items.map((item) => (
                                       <div key={item.id} className="border rounded-lg p-3">
                                         <div className="flex justify-between items-start mb-2">
                                           <div className="flex-1 min-w-0">
                                             <h4 className="font-semibold text-sm">{item?.item?.name || ''}</h4>
                                             {item.size && item.size !== "" && (
                                               <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                                             )}
                                           </div>
                                           <Badge variant="outline" className="text-xs shrink-0 ml-2">Qty: {item.quantity}</Badge>
                                         </div>
               
                                         {/* Item Images - No description */}
                                         {item.images && item.images.length > 0 && (
                                           <div className="mt-2">
                                             <div className="flex gap-2 flex-wrap">
                                               {item.images.slice(0, 3).map((img) => (
                                                 <div key={img.id} className="relative w-10 h-10 rounded-md overflow-hidden border">
                                                   <Image
                                                     src={normalizeImagePath(img.imageUrl) || '/placeholder-image.jpg'}
                                                     alt="Item"
                                                     fill
                                                     className="object-cover"
                                                   />
                                                 </div>
                                               ))}
                                               {item.images.length > 3 && (
                                                 <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                                   <Plus className="h-3 w-3" />
                                                   <span className="text-[10px]">+{item.images.length - 3}</span>
                                                 </div>
                                               )}
                                             </div>
                                           </div>
                                         )}
               
                                         {/* Materials Count */}
                                         {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 && (
                                           <div className="mt-2 flex items-center gap-2">
                                             <Layers className="h-3 w-3 text-muted-foreground" />
                                             <span className="text-xs text-muted-foreground">
                                               {item.proformaItemMaterials.length} material(s)
                                             </span>
                                           </div>
                                         )}
                                             <TableCell>
                                                                         <div className="space-y-1">
                                                                           <p className="font-medium text-sm">{formatDescription(item.description)}</p>
                                                                           {item.additionalDescription && (
                                                                             <p className="text-xs text-muted-foreground">
                                                                               {formatDescription(item.additionalDescription)}
                                                                             </p>
                                                                           )}
                                                                         </div>
                                                                       </TableCell>
                                       </div>
                                     ))}
                                   </div>
               
                                   {/* Desktop View - Table */}
                                   <div className="hidden md:block w-full overflow-x-auto">
                                     <div className="min-w-full">
                                       <Table>
                                         <TableHeader>
                                           <TableRow>
                                             <TableHead className="text-sm">Product</TableHead>
                                             <TableHead className="text-sm">Size</TableHead>
                                             <TableHead className="text-sm">Quantity</TableHead>
                                             <TableHead className="text-sm">Images</TableHead>
                                             <TableHead className="text-sm">Materials</TableHead>
                                           </TableRow>
                                         </TableHeader>
                                         <TableBody>
                                           {proformaInvoice.items.map((item) => (
                                             <TableRow key={item.id}>
                                               <TableCell className="text-sm font-medium">{item?.item?.name || ''}</TableCell>
                                               <TableCell className="text-sm">{item.size && item.size !== "" ? item.size : ''}</TableCell>
                                               <TableCell className="text-sm">{item.quantity}</TableCell>
                                               <TableCell>
                                                 {item.images && item.images.length > 0 ? (
                                                   <div className="flex gap-1">
                                                     {item.images.slice(0, 2).map((img) => (
                                                       <div key={img.id} className="relative w-8 h-8 rounded overflow-hidden border cursor-pointer"
                                                            onClick={() => window.open(normalizeImagePath(img.imageUrl), '_blank')}>
                                                         <Image
                                                           src={normalizeImagePath(img.imageUrl) || '/placeholder-image.jpg'}
                                                           alt="Item"
                                                           fill
                                                           className="object-cover"
                                                         />
                                                       </div>
                                                     ))}
                                                     {item.images.length > 2 && (
                                                       <span className="text-xs text-muted-foreground">+{item.images.length - 2}</span>
                                                     )}
                                                   </div>
                                                 ) : (
                                                   <span className="text-sm text-muted-foreground">No images</span>
                                                 )}
                                               </TableCell>
                                               <TableCell>
                                                 {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 ? (
                                                   <Badge variant="outline" className="flex items-center gap-1">
                                                     <Layers className="h-3 w-3" />
                                                     {item.proformaItemMaterials.length}
                                                   </Badge>
                                                 ) : (
                                                   <span className="text-sm text-muted-foreground">None</span>
                                                 )}
                                               </TableCell>
                                             </TableRow>
                                           ))}
                                         </TableBody>
                                       </Table>
                                     </div>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="text-center py-8">
                                   <Package className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50" />
                                   <p className="mt-4 text-muted-foreground text-sm md:text-base">No items found</p>
                                 </div>
                               )}
                             </TabsContent>
               
                             {/* Materials Tab */}
                             <TabsContent value="materials" className="space-y-4 mt-4">
                               {proformaInvoice.items && proformaInvoice.items.some(item => item.proformaItemMaterials && item.proformaItemMaterials.length > 0) ? (
                                 <div className="space-y-4">
                                   {proformaInvoice.items.map((item) => {
                                     if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return null;
                                     
                                     return (
                                       <div key={item.id} className="border rounded-lg overflow-hidden">
                                         <div className="bg-muted/30 p-3 border-b">
                                           <h4 className="font-semibold text-sm md:text-base">{item?.item?.name || ''}</h4>
                                           {item.size && item.size !== "" && (
                                             <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                                           )}
                                         </div>
                                         <div className="p-3 w-full overflow-x-auto">
                                           <div className="min-w-125 md:min-w-full">
                                             <Table>
                                               <TableHeader>
                                                 <TableRow>
                                                   <TableHead className="text-xs md:text-sm">Material</TableHead>
                                                   <TableHead className="text-xs md:text-sm">Color</TableHead>
                                                   <TableHead className="text-xs md:text-sm">Size</TableHead>
                                                   <TableHead className="text-xs md:text-sm">Qty</TableHead>
                                                   <TableHead className="text-xs md:text-sm">Add. Qty</TableHead>
                                                   <TableHead className="text-xs md:text-sm">Note</TableHead>
                                                 </TableRow>
                                               </TableHeader>
                                               <TableBody>
                                                 {item.proformaItemMaterials.map((material) => (
                                                   <TableRow key={material.id}>
                                                     <TableCell className="text-sm">
                                                       <p className="font-medium">
                                                         {material.material?.name || ''}
                                                       </p>
                                                     </TableCell>
                                                     <TableCell className="text-sm">{material.material?.color || ''}</TableCell>
                                                     <TableCell className="text-sm">{material.material?.size || ''}</TableCell>
                                                     <TableCell className="text-sm">
                                                       <Badge variant="outline" className="text-xs">{material.quantity}</Badge>
                                                     </TableCell>
                                                     <TableCell className="text-sm">
                                                       <Badge variant="outline" className="text-xs">{material?.additionalQuantity || 0}</Badge>
                                                     </TableCell>
                                                     <TableCell className="text-sm">
                                                       {material.note && material.note !== "" ? (
                                                         <p className="text-sm line-clamp-2">{material.note}</p>
                                                       ) : (
                                                         <span className="text-muted-foreground text-sm">-</span>
                                                       )}
                                                     </TableCell>
                                                   </TableRow>
                                                 ))}
                                               </TableBody>
                                             </Table>
                                           </div>
                                         </div>
                                       </div>
                                     );
                                   })}
                                 </div>
                               ) : (
                                 <div className="text-center py-8">
                                   <Box className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50" />
                                   <p className="mt-4 text-muted-foreground text-sm md:text-base">No materials found</p>
                                 </div>
                               )}
                             </TabsContent>
               
                             {/* Images Tab - Removed descriptions */}
                             <TabsContent value="images" className="space-y-4 mt-4">
                               {proformaInvoice.items && proformaInvoice.items.some(item => item.images && item.images.length > 0) ? (
                                 <div className="space-y-6">
                                   {proformaInvoice.items.map((item) => {
                                     if (!item.images || item.images.length === 0) return null;
                                     
                                     return (
                                       <div key={item.id} className="border rounded-lg overflow-hidden">
                                         <div className="bg-muted/30 p-3 border-b">
                                           <h4 className="font-semibold text-sm md:text-base">{item?.item?.name || ''}</h4>
                                           {item.size && item.size !== "" && (
                                             <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                                           )}
                                         </div>
                                         <div className="p-3 md:p-4">
                                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                                             {item.images.map((image) => (
                                               <div key={image.id} className="space-y-2">
                                                 <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer group"
                                                      onClick={() => window.open(normalizeImagePath(image.imageUrl), '_blank')}>
                                                   <Image
                                                     src={normalizeImagePath(image.imageUrl) || '/placeholder-image.jpg'}
                                                     alt={item?.item?.name || 'Item image'}
                                                     fill
                                                     className="object-cover transition-transform group-hover:scale-105"
                                                   />
                                                 </div>
                                                 <p className="text-[10px] text-muted-foreground text-center">
                                                   {formatDate(image.createdAt)}
                                                 </p>
                                               </div>
                                             ))}
                                           </div>
                                         </div>
                                       </div>
                                     );
                                   })}
                                 </div>
                               ) : (
                                 <div className="text-center py-8">
                                   <ImageIcon className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50" />
                                   <p className="mt-4 text-muted-foreground text-sm md:text-base">No images found for any items</p>
                                 </div>
                               )}
                             </TabsContent>
               
                             {/* Attachments Tab */}
                             <TabsContent value="attachments" className="space-y-4 mt-4">
                               {proformaInvoice.attachments && proformaInvoice.attachments.length > 0 ? (
                                 <div className="grid grid-cols-1 gap-3">
                                   {proformaInvoice.attachments.map((attachment) => (
                                     <div key={attachment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                                       <div className="flex items-center gap-3 flex-1 min-w-0">
                                         <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                         <div className="flex-1 min-w-0">
                                           <a 
                                             href={normalizeImagePath(attachment.fileUrl)} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             className="text-sm text-blue-600 hover:underline break-all"
                                           >
                                             {attachment.fileUrl.split('/').pop() || 'View Attachment'}
                                           </a>
                                           {attachment.createdAt && (
                                             <p className="text-xs text-muted-foreground mt-1">
                                               Added: {formatDate(attachment.createdAt)}
                                             </p>
                                           )}
                                         </div>
                                       </div>
                                       <div className="flex gap-2 shrink-0">
                                         <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => window.open(normalizeImagePath(attachment.fileUrl), '_blank')}
                                           className="h-8 w-8 p-0"
                                         >
                                           <Eye className="h-4 w-4" />
                                         </Button>
                                         <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => {
                                             const link = document.createElement('a');
                                             link.href = normalizeImagePath(attachment.fileUrl) || '';
                                             link.download = attachment.fileUrl.split('/').pop() || 'attachment';
                                             link.click();
                                           }}
                                           className="h-8 w-8 p-0"
                                         >
                                           <Download className="h-4 w-4" />
                                         </Button>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <div className="text-center py-8">
                                   <FileText className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50" />
                                   <p className="mt-4 text-muted-foreground text-sm md:text-base">No attachments found</p>
                                 </div>
                               )}
                             </TabsContent>
                           </Tabs>
                         </CardContent>
               </Card>
             ) : (
               <Card>
                 <CardContent className="py-12 text-center">
                   <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                   <p className="mt-4 text-muted-foreground">No proforma invoice found for this project</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>
         </Tabs>

        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.customer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{project.customer.name || ''}</p>
                </div>
                {project.customer.phone1 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact</p>
                    <p className="font-medium">{project.customer.phone1}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No customer information available</p>
            )}
          </CardContent>
        </Card>

        {/* Project Timeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested Delivery</p>
                  <p>{project.requestedDelivery ? formatDate(project.requestedDelivery) : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Calculated Delivery</p>
                  <p>{project.calculatedDelivery ? formatDate(project.calculatedDelivery) : 'Not calculated'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Project Duration</p>
                <p className="text-2xl font-bold">{project.totalDays || 0} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personnel Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.createdBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p>{project.createdBy.name}</p>
                </div>
              )}
              {project.updatedBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated By</p>
                  <p>{project.updatedBy.name}</p>
                </div>
              )}
              {project.designBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Designer</p>
                  <p>{project.designBy.name}</p>
                  {project.designBy.email && (
                    <p className="text-xs text-muted-foreground">{project.designBy.email}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Logs Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Project Activity Logs
              {hasLogs && (
                <Badge variant="secondary" className="ml-2">
                  {project.projectLogs?.length} entries
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasLogs ? (
              <div className="space-y-6">
                {Object.entries(groupedLogs).map(([date, logs]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-sm text-muted-foreground">{date}</h4>
                      <Separator className="flex-1" />
                    </div>
                    <div className="space-y-3 pl-4">
                      {logs.map((log, index) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                          <div className="shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <FileWarning className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{log.note}</p>
                            <div className="flex items-center gap-4 mt-2">
                              {log.createdBy && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{log.createdBy.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No activity logs available for this project</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinDesignProjectDetailPage;