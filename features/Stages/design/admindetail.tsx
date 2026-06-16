/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
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
  Plus,
  History,
  FileWarning,
  ShoppingCart,
  Cog,
  Sparkles,
  Drill,
} from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel, IProjectStage, DesignStatus, IProjectLog } from '@/models/Projects';
import { getProjectId } from '@/service/Project';
import { Separator } from '@/components/ui/separator';
import { IProformaInvoice, IProformaInvoiceItem, IProformaItemMaterial } from '@/models/ProformaInvoice';
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

// Helper function for image URLs
const BACKEND_URL = 'http://localhost:5000';

export const normalizeImagePath = (path?: string) => {
  if (!path) return undefined;
  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.startsWith('http')) {
    return normalizedPath;
  }
  const cleanPath = normalizedPath.replace(/^\/+/, '');
  return `${BACKEND_URL}/${cleanPath}`;
};

type BadgeVariant = "link" | "secondary" | "default" | "outline" | "ghost" | "destructive" | null | undefined;

type ProjectDetailProps = {
  id?: string;
};

// Stage configuration for all stages
const stageConfigs: Record<ProjectStatus, {
  label: string;
  icon: any;
  color: string;
  borderColor: string;
  headerBg: string;
  headerBorder: string;
  titleColor: string;
  iconColor: string;
  badgeColor: string;
  badgeBorder: string;
  bgLight: string;
  remainingTextColor: string;
}> = {
  [ProjectStatus.INVOICE]: {
    label: "Invoice",
    icon: FileText,
    color: "blue",
    borderColor: "border-blue-200 dark:border-blue-800",
    headerBg: "bg-blue-50 dark:bg-blue-950/40",
    headerBorder: "border-blue-100 dark:border-blue-900",
    titleColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeColor: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-500 dark:border-blue-700",
    bgLight: "bg-blue-100 dark:bg-blue-900/40",
    remainingTextColor: "text-blue-600 dark:text-blue-400",
  },
  [ProjectStatus.DESIGN]: {
    label: "Design",
    icon: PenTool,
    color: "purple",
    borderColor: "border-purple-200 dark:border-purple-800",
    headerBg: "bg-purple-50 dark:bg-purple-950/40",
    headerBorder: "border-purple-100 dark:border-purple-900",
    titleColor: "text-purple-900 dark:text-purple-100",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeColor: "text-purple-700 dark:text-purple-300",
    badgeBorder: "border-purple-500 dark:border-purple-700",
    bgLight: "bg-purple-100 dark:bg-purple-900/40",
    remainingTextColor: "text-purple-600 dark:text-purple-400",
  },
  [ProjectStatus.PURCHASING]: {
    label: "Purchasing",
    icon: ShoppingCart,
    color: "amber",
    borderColor: "border-amber-200 dark:border-amber-800",
    headerBg: "bg-amber-50 dark:bg-amber-950/40",
    headerBorder: "border-amber-100 dark:border-amber-900",
    titleColor: "text-amber-900 dark:text-amber-100",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeColor: "text-amber-700 dark:text-amber-300",
    badgeBorder: "border-amber-500 dark:border-amber-700",
    bgLight: "bg-amber-100 dark:bg-amber-900/40",
    remainingTextColor: "text-amber-600 dark:text-amber-400",
  },
  [ProjectStatus.CUTTING]: {
    label: "Cutting",
    icon: Scissors,
    color: "red",
    borderColor: "border-red-200 dark:border-red-800",
    headerBg: "bg-red-50 dark:bg-red-950/40",
    headerBorder: "border-red-100 dark:border-red-900",
    titleColor: "text-red-900 dark:text-red-100",
    iconColor: "text-red-600 dark:text-red-400",
    badgeColor: "text-red-700 dark:text-red-300",
    badgeBorder: "border-red-500 dark:border-red-700",
    bgLight: "bg-red-100 dark:bg-red-900/40",
    remainingTextColor: "text-red-600 dark:text-red-400",
  },
  [ProjectStatus.EDGE_BANDING]: {
    label: "Edge Banding",
    icon: Layers,
    color: "teal",
    borderColor: "border-teal-200 dark:border-teal-800",
    headerBg: "bg-teal-50 dark:bg-teal-950/40",
    headerBorder: "border-teal-100 dark:border-teal-900",
    titleColor: "text-teal-900 dark:text-teal-100",
    iconColor: "text-teal-600 dark:text-teal-400",
    badgeColor: "text-teal-700 dark:text-teal-300",
    badgeBorder: "border-teal-500 dark:border-teal-700",
    bgLight: "bg-teal-100 dark:bg-teal-900/40",
    remainingTextColor: "text-teal-600 dark:text-teal-400",
  },
  [ProjectStatus.ASSEMBLY]: {
    label: "Assembly",
    icon: Hammer,
    color: "orange",
    borderColor: "border-orange-200 dark:border-orange-800",
    headerBg: "bg-orange-50 dark:bg-orange-950/40",
    headerBorder: "border-orange-100 dark:border-orange-900",
    titleColor: "text-orange-900 dark:text-orange-100",
    iconColor: "text-orange-600 dark:text-orange-400",
    badgeColor: "text-orange-700 dark:text-orange-300",
    badgeBorder: "border-orange-500 dark:border-orange-700",
    bgLight: "bg-orange-100 dark:bg-orange-900/40",
    remainingTextColor: "text-orange-600 dark:text-orange-400",
  },
  [ProjectStatus.PAINTING]: {
    label: "Painting",
    icon: Paintbrush,
    color: "pink",
    borderColor: "border-pink-200 dark:border-pink-800",
    headerBg: "bg-pink-50 dark:bg-pink-950/40",
    headerBorder: "border-pink-100 dark:border-pink-900",
    titleColor: "text-pink-900 dark:text-pink-100",
    iconColor: "text-pink-600 dark:text-pink-400",
    badgeColor: "text-pink-700 dark:text-pink-300",
    badgeBorder: "border-pink-500 dark:border-pink-700",
    bgLight: "bg-pink-100 dark:bg-pink-900/40",
    remainingTextColor: "text-pink-600 dark:text-pink-400",
  },
  [ProjectStatus.FINISHING]: {
    label: "Finishing",
    icon: Sparkles,
    color: "emerald",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    headerBg: "bg-emerald-50 dark:bg-emerald-950/40",
    headerBorder: "border-emerald-100 dark:border-emerald-900",
    titleColor: "text-emerald-900 dark:text-emerald-100",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-500 dark:border-emerald-700",
    bgLight: "bg-emerald-100 dark:bg-emerald-900/40",
    remainingTextColor: "text-emerald-600 dark:text-emerald-400",
  },
  [ProjectStatus.DELIVERY]: {
    label: "Delivery",
    icon: Truck,
    color: "sky",
    borderColor: "border-sky-200 dark:border-sky-800",
    headerBg: "bg-sky-50 dark:bg-sky-950/40",
    headerBorder: "border-sky-100 dark:border-sky-900",
    titleColor: "text-sky-900 dark:text-sky-100",
    iconColor: "text-sky-600 dark:text-sky-400",
    badgeColor: "text-sky-700 dark:text-sky-300",
    badgeBorder: "border-sky-500 dark:border-sky-700",
    bgLight: "bg-sky-100 dark:bg-sky-900/40",
    remainingTextColor: "text-sky-600 dark:text-sky-400",
  },
  [ProjectStatus.INSTALLATION]: {
    label: "Installation",
    icon: Drill,
    color: "indigo",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    headerBg: "bg-indigo-50 dark:bg-indigo-950/40",
    headerBorder: "border-indigo-100 dark:border-indigo-900",
    titleColor: "text-indigo-900 dark:text-indigo-100",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badgeColor: "text-indigo-700 dark:text-indigo-300",
    badgeBorder: "border-indigo-500 dark:border-indigo-700",
    bgLight: "bg-indigo-100 dark:bg-indigo-900/40",
    remainingTextColor: "text-indigo-600 dark:text-indigo-400",
  },
  [ProjectStatus.METAL_WORKS]: {
    label: "Metal Works",
    icon: Cog,
    color: "slate",
    borderColor: "border-slate-200 dark:border-slate-800",
    headerBg: "bg-slate-50 dark:bg-slate-950/40",
    headerBorder: "border-slate-100 dark:border-slate-900",
    titleColor: "text-slate-900 dark:text-slate-100",
    iconColor: "text-slate-600 dark:text-slate-400",
    badgeColor: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-500 dark:border-slate-700",
    bgLight: "bg-slate-100 dark:bg-slate-900/40",
    remainingTextColor: "text-slate-600 dark:text-slate-400",
  },
  [ProjectStatus.CNC]: {
    label: "CNC",
    icon: Cog,
    color: "zinc",
    borderColor: "border-zinc-200 dark:border-zinc-800",
    headerBg: "bg-zinc-50 dark:bg-zinc-950/40",
    headerBorder: "border-zinc-100 dark:border-zinc-900",
    titleColor: "text-zinc-900 dark:text-zinc-100",
    iconColor: "text-zinc-600 dark:text-zinc-400",
    badgeColor: "text-zinc-700 dark:text-zinc-300",
    badgeBorder: "border-zinc-500 dark:border-zinc-700",
    bgLight: "bg-zinc-100 dark:bg-zinc-900/40",
    remainingTextColor: "text-zinc-600 dark:text-zinc-400",
  },
};

const AdminProjectDetailPage: React.FC<ProjectDetailProps> = ({ id }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [proformaInvoice, setProformaInvoice] = useState<IProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get all stages (no filtering)
  const getAllStages = (stages?: IProjectStage[]) => {
    if (!stages) return [];
    return stages;
  };

  // Get design status configuration
  const getDesignStatusConfig = (status?: DesignStatus) => {
    const config: Record<DesignStatus, { 
      label: string; 
      variant: BadgeVariant; 
      icon: any; 
      color: string;
      description: string;
    }> = {
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
      [DesignStatus.FINISHED]: {
        label: 'Design Finished',
        variant: 'default',
        icon: FileCheck,
        color: 'text-emerald-500',
        description: 'Design work completed',
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
        console.log('Fetched project data:', projectData);

        // Fetch proforma invoice if available
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

  // Fetch project data on mount and when id changes
  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

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

  // Calculate total materials for an item
  const getItemMaterialsTotal = (item: IProformaInvoiceItem) => {
    if (!item.materials || item.materials.length === 0) return 0;
    return item.materials.reduce((total, material) => total + material.quantity, 0);
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

  // All stages for display
  const allStages = getAllStages(project?.stages);
  const hasStages = allStages.length > 0;
  const groupedLogs = getGroupedLogs(project?.projectLogs);
  const hasLogs = project?.projectLogs && project.projectLogs.length > 0;
  
  // Get project status config
  const projectStatusConfig = project ? getStatusConfig(project.status) : null;
  const difficultyConfig = project ? getDifficultyConfig(project.difficulty) : null;
  const designStatusConfig = project?.designStatus ? getDesignStatusConfig(project.designStatus) : null;

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading project details...</p>
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

  // Get stage status
  const getStageStatusDisplay = (stage: IProjectStage) => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    const actualUnits = stage.actualWorkUnits || 0;
    
    if (actualUnits >= plannedUnits - 0.000001 || stage.status === 'COMPLETED' || stage.finished === true) {
      return { text: 'Completed', variant: 'default' as const, className: 'bg-green-500' };
    }
    if (stage.status === 'ACTIVE' || stage.status === 'IN_PROGRESS') {
      return { text: 'In Progress', variant: 'outline' as const, className: '' };
    }
    if (stage.status === 'CANCELLED') {
      return { text: 'Cancelled', variant: 'destructive' as const, className: '' };
    }
    return { text: 'Pending', variant: 'secondary' as const, className: '' };
  };

  // Calculate progress for a stage
  const calculateProgress = (stage: IProjectStage) => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    const actualUnits = stage.actualWorkUnits || 0;
    
    if (plannedUnits === 0) return 0;
    return Math.min((actualUnits / plannedUnits) * 100, 100);
  };

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
            <div className="space-y-2">
              {designStatusConfig ? (
                <>
                  <Badge variant={designStatusConfig.variant} className="px-3 py-1 text-sm">
                    {designStatusConfig.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {designStatusConfig.description}
                  </p>
                  {project.designFinished && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Finished: {formatDate(project.designFinished)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    Not Started
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Design work has not begun yet
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - All Stages */}
      <div className="space-y-6">
        {/* All Stages Card */}
        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900/40 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <span className="text-slate-900 dark:text-slate-100">All Project Stages</span>
              {hasStages && (
                <Badge variant="secondary" className="ml-2">
                  {allStages.length} stages
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {hasStages ? (
              <div className="space-y-8">
                {allStages.map((stage) => {
                  const stageConfig = stageConfigs[stage.stage];
                  const statusDisplay = getStageStatusDisplay(stage);
                  const progress = calculateProgress(stage);
                  const plannedUnits = stage.workUnits || stage.capacityDays || 0;
                  const actualUnits = stage.actualWorkUnits || 0;
                  const remainingUnits = Math.max(0, plannedUnits - actualUnits);
                  const remainingPercentage = plannedUnits > 0 ? (remainingUnits / plannedUnits) * 100 : 0;
                  
                  if (!stageConfig) return null;
                  
                  return (
                    <div key={stage.id} className={`border rounded-lg ${stageConfig.borderColor} shadow-sm overflow-hidden`}>
                      {/* Stage Header */}
                      <div className={`${stageConfig.headerBg} border-b ${stageConfig.headerBorder} p-4`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stageConfig.bgLight}`}>
                              <stageConfig.icon className={`h-5 w-5 ${stageConfig.iconColor}`} />
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${stageConfig.titleColor}`}>
                                {stageConfig.label}
                              </h3>
                              <p className="text-sm text-muted-foreground">Stage ID: {stage.id.substring(0, 8)}</p>
                            </div>
                          </div>
                          <Badge
                            variant={statusDisplay.variant}
                            className={`px-3 py-1 ${statusDisplay.className}`}
                          >
                            {statusDisplay.text}
                          </Badge>
                        </div>
                      </div>

                      {/* Stage Content */}
                      <div className="p-4 space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-semibold">{progress.toFixed(2)}%</span>
                          </div>
                          <div className="w-full rounded-full h-2.5 bg-muted">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-300 ${
                                progress >= 100 ? 'bg-green-600' : stageConfig.iconColor.replace('text-', 'bg-')
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stage Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">Planned Units</p>
                            <p className="text-lg font-semibold">{plannedUnits}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">Actual Units</p>
                            <p className="text-lg font-semibold text-blue-600">{actualUnits.toFixed(4)}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">Remaining Units</p>
                            <p className={`text-lg font-semibold ${stageConfig.remainingTextColor}`}>
                              {remainingUnits.toFixed(4)}
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">Remaining %</p>
                            <p className={`text-lg font-semibold ${stageConfig.remainingTextColor}`}>
                              {remainingPercentage.toFixed(2)}%
                            </p>
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Start Date</p>
                            <p className="font-medium">{stage.startDate ? formatDate(stage.startDate) : 'Not scheduled'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">End Date</p>
                            <p className="font-medium">{stage.endDate ? formatDate(stage.endDate) : 'Not scheduled'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-medium">{stage.capacityDays} days</p>
                          </div>
                        </div>

                        {/* Work Logs */}
                        {stage.projectStageWorkLogs && stage.projectStageWorkLogs.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <History className="h-4 w-4" />
                              Work Logs ({stage.projectStageWorkLogs.length})
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {stage.projectStageWorkLogs.map((log) => (
                                <div key={log.id} className="bg-muted/20 p-2 rounded-lg text-sm">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <Badge variant="outline" className="text-xs">
                                        {log.doneUnits.toFixed(4)} units
                                      </Badge>
                                      {log.note && (
                                        <p className="text-xs text-muted-foreground mt-1">{log.note}</p>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(log.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No stages found for this project</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proforma Invoice Card */}
        {proformaInvoice && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Proforma Invoice Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/Stage/Design/${proformaInvoice.id}`)}
              >
                Update PI
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PI Number</p>
                  <p className="font-medium">{proformaInvoice.piNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1">
                    {proformaInvoice.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="items" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-4 mt-4">
                  {proformaInvoice.items && proformaInvoice.items.length > 0 ? (
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Images</TableHead>
                            <TableHead>Materials</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proformaInvoice.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">{item.description}</p>
                                  {item.additionalDescription && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.additionalDescription}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{item.size || 'N/A'}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
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
                                  'No images'
                                )}
                              </TableCell>
                              <TableCell>
                                {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 ? (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    {item.proformaItemMaterials.length} material(s)
                                  </Badge>
                                ) : (
                                  'No materials'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">No items found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="materials" className="space-y-4 mt-4">
                  {proformaInvoice.items && proformaInvoice.items.some(item => item.proformaItemMaterials && item.proformaItemMaterials.length > 0) ? (
                    <div className="space-y-4">
                      {proformaInvoice.items.map((item) => {
                        if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return null;
                        
                        return (
                          <div key={item.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 p-3 border-b">
                              <h4 className="font-semibold">{item.description}</h4>
                              {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                            </div>
                            <div className="p-3">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Material Name</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Additional Qty</TableHead>
                                    <TableHead>Note</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {item.proformaItemMaterials.map((material) => (
                                    <TableRow key={material.id}>
                                      <TableCell>
                                        <p className="font-medium">
                                          {material.material?.name || 'N/A'}
                                        </p>
                                      </TableCell>
                                      <TableCell>{material.material?.color || 'N/A'}</TableCell>
                                      <TableCell>{material.material?.size || 'N/A'}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{material.quantity} units</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{material?.additionalQuantity || 0} units</Badge>
                                      </TableCell>
                                      <TableCell>
                                        {material.note || <span className="text-muted-foreground text-sm">No note</span>}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Box className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">No materials found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="images" className="space-y-4 mt-4">
                  {proformaInvoice.items && proformaInvoice.items.some(item => item.images && item.images.length > 0) ? (
                    <div className="space-y-6">
                      {proformaInvoice.items.map((item) => {
                        if (!item.images || item.images.length === 0) return null;
                        
                        return (
                          <div key={item.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 p-3 border-b">
                              <h4 className="font-semibold">{item.description}</h4>
                              {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {item.images.map((image) => (
                                  <div key={image.id} className="space-y-2">
                                    <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer group"
                                         onClick={() => window.open(normalizeImagePath(image.imageUrl), '_blank')}>
                                      <Image
                                        src={normalizeImagePath(image.imageUrl) || '/placeholder-image.jpg'}
                                        alt={`Item image for ${item.description}`}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                      Added: {formatDate(image.createdAt)}
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
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">No images found for any items</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="space-y-4 mt-4">
                  {proformaInvoice.attachments && proformaInvoice.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {proformaInvoice.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <a 
                                href={normalizeImagePath(attachment.fileUrl)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
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
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(normalizeImagePath(attachment.fileUrl), '_blank')}
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
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">No attachments found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

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
                  <p className="font-medium">{project.customer.name || 'N/A'}</p>
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

        {/* Project Activity Logs */}
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
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                          <div className="flex-shrink-0 mt-0.5">
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

export default AdminProjectDetailPage;