/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMinutes } from '@/lib/format';
import { toast } from 'sonner';
import {
  Calendar,
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
  Box,
  CheckCircle,
  Plus,
  Trash2,
  MessageSquare,
  Percent,
  PencilRuler,
  ShoppingCart,
  Cog,
  Sparkles,
  Drill,
} from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel, IProjectStage, IProjectStageWorkLog, StageStatus } from '@/models/Projects';
import { getProjectId } from '@/service/Project';
import { Separator } from '@/components/ui/separator';
import { IProformaInvoice, MaterialIssueStatus } from '@/models/ProformaInvoice';
import { getProformaInvoiceById } from '@/service/ProformaInvoice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { createProjectStageWorkLog, deleteProjectStageWorkLog } from '@/service/projectStageWorkLogService';

// Helper function for image URLs
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/uploads';

export const normalizeImagePath = (path?: string) => {
  if (!path) return '/placeholder-image.jpg';
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${BACKEND_URL}/${cleanPath}`;
};

type BadgeVariant = "link" | "secondary" | "default" | "outline" | "ghost" | "destructive" | null | undefined;

type ProjectDetailProps = {
  id?: string;
  stageType: ProjectStatus.EDGE_BANDING | ProjectStatus.ASSEMBLY | ProjectStatus.CNC| ProjectStatus.CUTTING | ProjectStatus.DELIVERY | ProjectStatus.FINISHING | ProjectStatus.INSTALLATION | ProjectStatus.METAL_WORKS | ProjectStatus.PAINTING;
};

type InputType = 'units' | 'percentage';

// Stage configuration for different project types


export const stageConfigs = {
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
    icon: PencilRuler,
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
    icon: Wrench,
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
};

const UnifiedProjectDetailPage: React.FC<ProjectDetailProps> = ({ id, stageType }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [proformaInvoice, setProformaInvoice] = useState<IProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingWorkLog, setAddingWorkLog] = useState<string | null>(null);
  const [workLogFormData, setWorkLogFormData] = useState<{
    [stageId: string]: {
      doneUnits: string;
      percentage: string;
      inputType: InputType;
      note: string;
      hours: string;
    }
  }>({});
  const [deletingWorkLog, setDeletingWorkLog] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<IProjectStageWorkLog | null>(null);

  const stageConfig = stageConfigs[stageType];
  const currentStageLabel = stageConfig.label;

  // Filter stages based on stageType
  const getFilteredStages = (stages?: IProjectStage[]) => {
    if (!stages) return [];
    return stages.filter(stage => stage.stage === stageType);
  };

  // Get stage status configuration
  const getStageStatusConfig = () => {
    return {
      label: `${currentStageLabel} Stage`,
      variant: 'outline' as BadgeVariant,
      icon: stageConfig.icon,
      color: stageConfig.iconColor,
      description: '',
    };
  };

  // Fetch project data and associated proforma invoice
  const fetchProjectData = useCallback(async () => {
    try {
      if (id) {
        const projectData = await getProjectId(id);
        setProject(projectData);

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

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Handle work log form input change
  const handleWorkLogInputChange = (stageId: string, field: 'doneUnits' | 'percentage' | 'inputType' | 'note' | 'hours', value: string) => {
    setWorkLogFormData(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        inputType: prev[stageId]?.inputType || 'units',
        [field]: value
      }
    }));
  };

  // Calculate units from percentage - Return exact float WITHOUT rounding
  const calculateUnitsFromPercentage = (stage: IProjectStage, percentage: number): number => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    // Return exact float value - NO Math.ceil, NO rounding
    return (percentage / 100) * plannedUnits;
  };

  // Calculate percentage from units
  const calculatePercentageFromUnits = (stage: IProjectStage, units: number): number => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    if (plannedUnits === 0) return 0;
    return (units / plannedUnits) * 100;
  };

  // Validate if adding units would exceed remaining units (with tolerance)
  const validateUnitsNotExceedRemaining = (stage: IProjectStage, unitsToAdd: number): boolean => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    const currentActualUnits = stage.actualWorkUnits || 0;
    const remainingUnits = plannedUnits - currentActualUnits;
    
    if (unitsToAdd > remainingUnits + 0.000001) {
      toast.error(`Cannot add ${unitsToAdd.toFixed(4)} units. Only ${remainingUnits.toFixed(4)} units remaining.`);
      return false;
    }
    return true;
  };

  // Handle add work log submission
  const handleAddWorkLog = async (stageId: string, stage: IProjectStage) => {
    const formData = workLogFormData[stageId];
    if (!formData) {
      toast.error('');
      return;
    }

    let doneUnits: number;
    let enteredPercentage: number | null = null;
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    const currentActualUnits = stage.actualWorkUnits || 0;
    const remainingUnits = plannedUnits - currentActualUnits;

    // Check if stage is already completed (with tolerance)
    if (remainingUnits <= 0.000001) {
      toast.error('Stage is already completed. Cannot add more work logs.');
      return;
    }

    if (formData.inputType === 'percentage') {
      const percentage = Number(formData.percentage);
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        toast.error('Please enter a valid percentage between 1 and 100');
        return;
      }
      
      enteredPercentage = percentage;
      // Calculate exact units from percentage (NO ROUNDING)
      doneUnits = calculateUnitsFromPercentage(stage, percentage);
      
      // Validate percentage doesn't exceed remaining (with tolerance)
      const maxAllowedPercentage = (remainingUnits / plannedUnits) * 100;
      
      if (percentage > maxAllowedPercentage + 0.01) {
        toast.error(`Cannot add ${percentage}%. Only ${maxAllowedPercentage.toFixed(2)}% (${remainingUnits.toFixed(4)} units) remaining.`);
        return;
      }
      
      // If the percentage would slightly exceed remaining, adjust to exactly match remaining
      if (percentage > maxAllowedPercentage && percentage <= maxAllowedPercentage + 0.01) {
        doneUnits = remainingUnits;
        enteredPercentage = (remainingUnits / plannedUnits) * 100;
      }
    } else {
      if (!formData.doneUnits) {
        toast.error('Please enter done units');
        return;
      }
      doneUnits = Number(formData.doneUnits);
      if (isNaN(doneUnits) || doneUnits <= 0) {
        toast.error('Done units must be a positive number');
        return;
      }
      
      // Validate units don't exceed remaining
      if (!validateUnitsNotExceedRemaining(stage, doneUnits)) {
        return;
      }
    }

    setAddingWorkLog(stageId);
    try {
      // Store the entered percentage in the note
      let finalNote = formData.note || '';
      if (enteredPercentage !== null) {
        finalNote = finalNote ? `${finalNote} [Percentage: ${enteredPercentage}%]` : `[Percentage: ${enteredPercentage}%]`;
      }
      
      // Optional hours worked for this entry.
      const parsedHours = formData.hours ? Number(formData.hours) : undefined;

      // Send the exact float value (not rounded)
      await createProjectStageWorkLog({
        projectStageId: stageId,
        doneUnits: doneUnits,
        note: finalNote,
        ...(parsedHours !== undefined && !isNaN(parsedHours) ? { hours: parsedHours } : {}),
      });

      const percentageAdded = (doneUnits / plannedUnits) * 100;
      const successMessage = enteredPercentage !== null 
        ? `Work log added successfully! Added ${enteredPercentage.toFixed(2)}% (${doneUnits.toFixed(4)} units)`
        : `Work log added successfully! Added ${doneUnits.toFixed(4)} units (${percentageAdded.toFixed(2)}%)`;
      
      toast.success(successMessage);
      
      // Clear form data for this stage
      setWorkLogFormData(prev => ({
        ...prev,
        [stageId]: { doneUnits: '', percentage: '', inputType: 'units', note: '', hours: '' }
      }));
      
      // Refresh project data
      await fetchProjectData();
    } catch (error: any) {
      console.error('Error adding work log:', error);
      toast.error(error.response?.data?.message || 'Failed to add work log');
    } finally {
      setAddingWorkLog(null);
    }
  };

  // Handle delete work log
  const handleDeleteWorkLog = async () => {
    if (!selectedWorkLog) return;

    setDeletingWorkLog(selectedWorkLog.id);
    try {
      const response = await deleteProjectStageWorkLog(selectedWorkLog.id);
      
      // Show appropriate success message
      if (response.message && response.message.includes('reverted')) {
        toast.success(response.message);
      } else {
        toast.success('Work log deleted successfully');
      }
      
      setDeleteDialogOpen(false);
      setSelectedWorkLog(null);
      await fetchProjectData();
    } catch (error: any) {
      console.error('Error deleting work log:', error);
      toast.error(error.response?.data?.message || 'Failed to delete work log');
    } finally {
      setDeletingWorkLog(null);
    }
  };

  // Calculate progress for a stage
  const calculateProgress = (stage: IProjectStage) => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    const actualUnits = stage.actualWorkUnits || 0;
    
    if (plannedUnits === 0) return 0;
    return Math.min((actualUnits / plannedUnits) * 100, 100);
  };

  // Check if stage is completed based on work units AND status
  const isStageCompleted = (stage: IProjectStage) => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    const actualUnits = stage.actualWorkUnits || 0;
    // Check both: actual units >= planned OR status is COMPLETED OR finished flag is true
    return actualUnits >= plannedUnits - 0.000001 || stage.status === StageStatus.COMPLETED || stage.finished === true;
  };

  // Get proper stage status display
  const getStageStatusDisplay = (stage: IProjectStage) => {
    const plannedUnits = stage.workUnits || stage.capacityDays || 0;
    const actualUnits = stage.actualWorkUnits || 0;
    
    if (actualUnits >= plannedUnits - 0.000001 || stage.status === StageStatus.COMPLETED || stage.finished === true) {
      return { text: 'Completed', variant: 'default' as const, className: 'bg-green-500' };
    }
    if (stage.status === 'ACTIVE' || stage.status === 'IN_PROGRESS') {
      return { text: 'In Progress', variant: 'outline' as const, className: `${stageConfig.badgeBorder} ${stageConfig.badgeColor}` };
    }
    if (stage.status === 'CANCELLED') {
      return { text: 'Cancelled', variant: 'destructive' as const, className: '' };
    }
    return { text: 'Pending', variant: 'secondary' as const, className: '' };
  };

  // Get status badge for material (view only)
  const getMaterialStatusBadge = (status?: MaterialIssueStatus) => {
    if (!status) return <Badge variant="outline">Pending</Badge>;
    
    switch (status) {
      case MaterialIssueStatus.ISSUED:
        return <Badge className="bg-green-500">Issued</Badge>;
      case MaterialIssueStatus.PARTIALLY:
        return <Badge className="bg-yellow-500">Partially Issued</Badge>;
      case MaterialIssueStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case MaterialIssueStatus.PENDING:
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

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

  const filteredStages = getFilteredStages(project?.stages);
  const hasStage = filteredStages.length > 0;
  
  const projectStatusConfig = project ? getStatusConfig(project.status) : null;
  const difficultyConfig = project ? getDifficultyConfig(project.difficulty) : null;
  const stageStatusConfig = getStageStatusConfig();
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
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading {currentStageLabel.toLowerCase()} project details...</p>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <stageStatusConfig.icon className={`h-4 w-4 ${stageStatusConfig.color}`} />
            <span>{currentStageLabel} Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge variant={stageStatusConfig.variant} className="px-3 py-1 text-sm">
              {stageStatusConfig.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {stageStatusConfig.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Main Content */}
    <div className="space-y-6">
      {/* Stage Card */}
      <Card className={stageConfig.borderColor + " shadow-md"}>
        <CardHeader className={stageConfig.headerBg + " border-b " + stageConfig.headerBorder}>
          <CardTitle className="flex items-center gap-2">
            <stageConfig.icon className={`h-5 w-5 ${stageConfig.iconColor}`} />
            <span className={stageConfig.titleColor}>{currentStageLabel} Stage Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {hasStage ? (
            <div className="space-y-6">
              {filteredStages.map((stage) => {
                const stageConfigForStatus = getStatusConfig(stage.stage);
                const completed = isStageCompleted(stage);
                const progress = calculateProgress(stage);
                const plannedUnits = stage.workUnits || stage.capacityDays || 0;
                const actualUnits = stage.actualWorkUnits || 0;
                const remainingUnits = Math.max(0, plannedUnits - actualUnits);
                const remainingPercentage = plannedUnits > 0 ? (remainingUnits / plannedUnits) * 100 : 0;
                const statusDisplay = getStageStatusDisplay(stage);
                
                return (
                  <div key={stage.id} className="space-y-6">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          completed ? 'bg-green-100' : stageConfig.bgLight
                        }`}>
                          {stageConfigForStatus && <stageConfigForStatus.icon className={`h-5 w-5 md:h-6 md:w-6 ${stageConfigForStatus.color}`} />}
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold">{stageConfigForStatus?.label || currentStageLabel}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">Stage ID: {stage.id.substring(0, 8)}</p>
                        </div>
                      </div>
                      <Badge
                        variant={statusDisplay.variant}
                        className={`px-2 py-1 md:px-3 md:py-1 ${statusDisplay.className}`}
                      >
                        {statusDisplay.text}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                      {/* Left Column - Metrics and Schedule */}
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-3 md:p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Key Metrics</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Duration</span>
                              <span className="font-semibold text-sm md:text-base">{stage.capacityDays} days</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Planned Work Units</span>
                              <span className="font-semibold text-sm md:text-base">{plannedUnits}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Actual Work Units</span>
                              <span className="font-semibold text-sm md:text-base text-blue-600">{actualUnits.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Remaining Units</span>
                              <span className={`font-semibold text-sm md:text-base ${stageConfig.remainingTextColor}`}>{remainingUnits.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Remaining Percentage</span>
                              <span className={`font-semibold text-sm md:text-base ${stageConfig.remainingTextColor}`}>{remainingPercentage.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Scheduling</span>
                              <Badge variant="outline" className="text-xs">
                                {stage.autoSchedule ? 'Auto-scheduled' : 'Manual'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 p-3 md:p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Schedule</h4>
                          <div className="space-y-3">
                            {stage.startDate ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Start Date</p>
                                  <p className="font-medium text-sm md:text-base">{formatDate(stage.startDate)}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Start date not scheduled</p>
                            )}
                            
                            {stage.endDate ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">End Date</p>
                                  <p className="font-medium text-sm md:text-base">{formatDate(stage.endDate)}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">End date not scheduled</p>
                            )}
                            {stage.timeTaken ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Time taken</p>
                                  <p className="font-medium text-sm md:text-base">{formatMinutes(stage.timeTaken)}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Time taken not recorded</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Work Logs and Add Work Log Form */}
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="bg-muted/30 p-3 md:p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Progress</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Completion</span>
                              <span className="font-semibold">{progress.toFixed(2)}%</span>
                            </div>
                            <div className="w-full rounded-full h-2.5 bg-gray-200">
                              <div 
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                  progress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            {completed && (
                              <div className="mt-2 flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Stage Completed! All work units finished.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Work Logs List */}
                        {stage.projectStageWorkLogs && stage.projectStageWorkLogs.length > 0 && (
                          <div className="bg-muted/30 p-3 md:p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Work Log History ({stage.projectStageWorkLogs.length})
                            </h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {stage.projectStageWorkLogs.map((log) => {
                                const logPercentage = calculatePercentageFromUnits(stage, log.doneUnits);
                                
                                // Extract exact percentage from note if it exists
                                let exactPercentage = null;
                                if (log.note) {
                                  const percentageMatch = log.note.match(/\[Percentage: ([\d.]+)%\]/);
                                  if (percentageMatch) {
                                    exactPercentage = parseFloat(percentageMatch[1]);
                                  }
                                }
                                
                                // Clean note (remove the percentage marker if present)
                                let cleanNote = log.note || '';
                                if (exactPercentage !== null) {
                                  cleanNote = cleanNote.replace(/\[Percentage: [\d.]+%\]/, '').trim();
                                }
                                
                                return (
                                  <div key={log.id} className="p-3 rounded-lg border bg-white">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <Badge variant="outline" className="text-xs">
                                            {log.doneUnits.toFixed(4)} units
                                          </Badge>
                                          {exactPercentage !== null ? (
                                            <Badge variant="secondary" className={`text-xs bg-green-100 text-green-700`}>
                                              {exactPercentage.toFixed(2)}% 
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">
                                              {logPercentage.toFixed(2)}%
                                            </Badge>
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(log.createdAt)}
                                          </span>
                                        </div>
                                        {cleanNote && (
                                          <p className="text-sm text-gray-600 mt-1 wrap-break-word">{cleanNote}</p>
                                        )}
                                        {log.doneBy && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            By: {log.doneBy.name}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedWorkLog(log);
                                          setDeleteDialogOpen(true);
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Add Work Log Form - Inline with Units/Percentage Toggle */}
                        {!completed && (
                          <div className="p-4 rounded-lg border bg-white">
                            <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Add Work Log
                            </h4>
                            <div className="space-y-3">
                              {/* Complete All Units Checkbox */}
                              {remainingUnits > 0.000001 && (
                                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <input
                                    type="checkbox"
                                    id={`complete-all-${stage.id}`}
                                    onChange={async (e) => {
                                      if (e.target.checked) {
                                        // Set the done units to remaining units (convert number to string)
                                        handleWorkLogInputChange(stage.id, 'inputType', 'units');
                                        handleWorkLogInputChange(stage.id, 'doneUnits', remainingUnits.toString());
                                        
                                        // Wait a moment for state to update, then submit
                                        setTimeout(async () => {
                                          await handleAddWorkLog(stage.id, stage);
                                          // Uncheck the checkbox after submission
                                          e.target.checked = false;
                                        }, 100);
                                      }
                                    }}
                                    className="h-4 w-4 text-green-600 rounded border-green-300 focus:ring-green-500"
                                  />
                                  <label 
                                    htmlFor={`complete-all-${stage.id}`}
                                    className="text-sm font-medium text-green-700 cursor-pointer flex items-center gap-2"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Complete All Remaining Units ({remainingUnits.toFixed(4)} units / {remainingPercentage.toFixed(2)}%)
                                  </label>
                                </div>
                              )}

                              {/* Input Type Toggle */}
                              <div>
                                <Label className="text-sm font-medium mb-2 block">
                                  Input Method
                                </Label>
                                <ToggleGroup
                                  type="single"
                                  value={workLogFormData[stage.id]?.inputType || 'units'}
                                  onValueChange={(value) => {
                                    if (value) handleWorkLogInputChange(stage.id, 'inputType', value);
                                  }}
                                  className="justify-start flex-wrap"
                                >
                                  <ToggleGroupItem value="units" aria-label="Units" className="text-xs md:text-sm">
                                    <Package className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                    Units
                                  </ToggleGroupItem>
                                  <ToggleGroupItem value="percentage" aria-label="Percentage" className="text-xs md:text-sm">
                                    <Percent className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                    Percentage
                                  </ToggleGroupItem>
                                </ToggleGroup>
                              </div>

                              {/* Units Input */}
                              {(workLogFormData[stage.id]?.inputType || 'units') === 'units' && (
                                <div>
                                  <Label htmlFor={`doneUnits-${stage.id}`} className="text-sm font-medium">
                                    Done Units *
                                  </Label>
                                  <Input
                                    id={`doneUnits-${stage.id}`}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter number of units completed"
                                    value={workLogFormData[stage.id]?.doneUnits || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Validate max value doesn't exceed remaining units
                                      if (value) {
                                        const numValue = Number(value);
                                        if (numValue > remainingUnits + 0.000001) {
                                          toast.error(`Maximum ${remainingUnits.toFixed(4)} units remaining.`);
                                          return;
                                        }
                                      }
                                      handleWorkLogInputChange(stage.id, 'doneUnits', value);
                                    }}
                                    className="mt-1"
                                    disabled={addingWorkLog === stage.id}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Remaining: {remainingUnits.toFixed(4)} units ({remainingPercentage.toFixed(2)}%)
                                  </p>
                                </div>
                              )}

                              {/* Percentage Input */}
                              {(workLogFormData[stage.id]?.inputType || 'units') === 'percentage' && (
                                <div>
                                  <Label htmlFor={`percentage-${stage.id}`} className="text-sm font-medium">
                                    Percentage Complete (%) *
                                  </Label>
                                  <Input
                                    id={`percentage-${stage.id}`}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter percentage completed (e.g., 25.5)"
                                    value={workLogFormData[stage.id]?.percentage || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value) {
                                        const numValue = Number(value);
                                        if (numValue > remainingPercentage + 0.01) {
                                          toast.error(`Maximum ${remainingPercentage.toFixed(2)}% remaining.`);
                                          return;
                                        }
                                      }
                                      handleWorkLogInputChange(stage.id, 'percentage', value);
                                    }}
                                    className="mt-1"
                                    disabled={addingWorkLog === stage.id}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    This will add {workLogFormData[stage.id]?.percentage ? 
                                      calculateUnitsFromPercentage(stage, Number(workLogFormData[stage.id].percentage)).toFixed(4) : 0} units
                                  </p>
                                  <p className={`text-xs ${stageConfig.remainingTextColor} mt-1`}>
                                    Remaining: {remainingPercentage.toFixed(2)}%
                                  </p>
                                </div>
                              )}

                              {/* Note Input */}
                              <div>
                                <Label htmlFor={`note-${stage.id}`} className="text-sm font-medium">
                                  Note (Optional)
                                </Label>
                                <Textarea
                                  id={`note-${stage.id}`}
                                  placeholder="Add any remarks or notes about this work log..."
                                  value={workLogFormData[stage.id]?.note || ''}
                                  onChange={(e) => handleWorkLogInputChange(stage.id, 'note', e.target.value)}
                                  className="mt-1"
                                  rows={3}
                                  disabled={addingWorkLog === stage.id}
                                />
                              </div>

                              <Button
                                onClick={() => handleAddWorkLog(stage.id, stage)}
                                disabled={addingWorkLog === stage.id || 
                                  ((workLogFormData[stage.id]?.inputType || 'units') === 'units' 
                                    ? !workLogFormData[stage.id]?.doneUnits 
                                    : !workLogFormData[stage.id]?.percentage) ||
                                  remainingUnits <= 0.000001
                                }
                                className="w-full"
                              >
                                {addingWorkLog === stage.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Work Log
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <stageConfig.icon className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground text-sm md:text-base">No {currentStageLabel.toLowerCase()} stage information available for this project</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proforma Invoice Card - View Only */}
      {proformaInvoice && (
        <Card>
          <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proforma Invoice Information (View Only)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <Tabs defaultValue="materials" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items" className="text-xs sm:text-sm">Items</TabsTrigger>
                <TabsTrigger value="materials" className="text-xs sm:text-sm">Materials & Stock Information</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="space-y-4 mt-4">
                {proformaInvoice.items && proformaInvoice.items.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-160 md:min-w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">Item</TableHead>
                            <TableHead className="text-xs md:text-sm">Size</TableHead>
                            <TableHead className="text-xs md:text-sm">Quantity</TableHead>
                            <TableHead className="text-xs md:text-sm">Materials</TableHead>
                            <TableHead className="text-xs md:text-sm">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proformaInvoice.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-sm">{item.item?.name || 'N/A'}</TableCell>
                              <TableCell className="text-sm">{item.size || ''}</TableCell>
                              <TableCell className="text-sm">{item.quantity}</TableCell>
                              <TableCell>
                                {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 ? (
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    <Layers className="h-3 w-3" />
                                    {item.proformaItemMaterials.length} material(s)
                                  </Badge>
                                ) : (
                                  'No materials'
                                )}
                              </TableCell>
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground text-sm md:text-base">No items found</p>
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
                            <h4 className="font-semibold text-sm md:text-base">{item.item?.name || ''}</h4>
                            {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                          </div>
                          <div className="p-3 w-full overflow-x-auto">
                            <div className="min-w-[500px] md:min-w-full">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs md:text-sm">Material Name</TableHead>
                                    <TableHead className="text-xs md:text-sm">Color</TableHead>
                                    <TableHead className="text-xs md:text-sm">Size</TableHead>
                                    <TableHead className="text-xs md:text-sm">Required Qty</TableHead>
                                    <TableHead className="text-xs md:text-sm">Additional Qty</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {item.proformaItemMaterials.map((material) => {
                                    return (
                                      <TableRow key={material.id}>
                                        <TableCell className="text-sm">
                                          <p className="font-medium">{material.material?.name || 'N/A'}</p>
                                        </TableCell>
                                        <TableCell className="text-sm">{material.material?.color || 'N/A'}</TableCell>
                                        <TableCell className="text-sm">{material.material?.size || 'N/A'}</TableCell>
                                        <TableCell className="text-sm">
                                          <Badge variant="outline" className="text-xs">{material.quantity} units</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          <Badge variant="outline" className="text-xs">{material?.additionalQuantity || 0} units</Badge>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="font-medium text-sm md:text-base">{project.customer.name || 'N/A'}</p>
              </div>
              {project.customer.phone1 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <p className="font-medium text-sm md:text-base">{project.customer.phone1}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm md:text-base">No customer information available</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requested Delivery</p>
                <p className="text-sm md:text-base">{project.requestedDelivery ? formatDate(project.requestedDelivery) : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calculated Delivery</p>
                <p className="text-sm md:text-base">{project.calculatedDelivery ? formatDate(project.calculatedDelivery) : 'Not calculated'}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Project Duration</p>
              <p className="text-xl md:text-2xl font-bold">{project.totalDays || 0} days</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.createdBy && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-sm md:text-base">{project.createdBy.name}</p>
              </div>
            )}
            {project.updatedBy && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated By</p>
                <p className="text-sm md:text-base">{project.updatedBy.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Work Log</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this work log? This action cannot be undone.
            {selectedWorkLog && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <p className="text-sm">Units: {selectedWorkLog.doneUnits.toFixed(4)}</p>
                {selectedWorkLog.note && <p className="text-sm mt-1 break-words">Note: {selectedWorkLog.note}</p>}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteWorkLog}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            disabled={deletingWorkLog !== null}
          >
            {deletingWorkLog ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
};

export default UnifiedProjectDetailPage;

