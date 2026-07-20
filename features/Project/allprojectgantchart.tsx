// features/Project/all-projects-gantt-chart.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { format, parseISO, differenceInDays, addDays, startOfDay, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, Calendar, Filter, Search, Download, Eye, EyeOff, Layers, CheckCircle } from 'lucide-react';
import { IProject, IProjectStage, ProjectStatus, DesignStatus, StageStatus } from '@/models/Projects';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AllProjectsGanttChartProps {
  projects: IProject[];
}

interface WorkProgress {
  totalWorkUnits: number;
  completedWorkUnits: number;
  progressPercentage: number;
  remainingWorkUnits: number;
}

export const AllProjectsGanttChart: React.FC<AllProjectsGanttChartProps> = ({
  projects,
}) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartHeight, setChartHeight] = useState(600);
  const [showCompletedProjects, setShowCompletedProjects] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Helper to check if a stage is actually complete based on work units or finished flag
const isStageActuallyComplete = useCallback((stage: IProjectStage): boolean => {
  // 1. Explicitly marked as finished
  if (stage.finished === true || stage.status === StageStatus.COMPLETED) return true;
  
  // 2. Work units based completion (most reliable)
  if (stage.workUnits !== undefined && stage.workUnits !== null && stage.workUnits > 0) {
    const actualWorkUnits = stage.actualWorkUnits || 0;
    if (actualWorkUnits >= stage.workUnits) return true;
  }
  
  return false;
}, []);

  // Get current project status from the project.status field
  const getProjectCurrentStatus = useCallback((project: IProject): ProjectStatus => {
    // First priority: Use the project's main status field
    if (project.status) {
      return project.status;
    }
    
    // Fallback: Try to find the current stage based on stage status
    if (project.stages && project.stages.length > 0) {
      // Find the first stage that is not complete - this is the current stage
      const currentStage = project.stages.find(stage => !isStageActuallyComplete(stage));
      if (currentStage) return currentStage.stage;
      
      // If all stages are complete, return the last stage
      return project.stages[project.stages.length - 1].stage;
    }
    
    return ProjectStatus.INVOICE;
  }, [isStageActuallyComplete]);

  // Calculate work progress for a project
  const calculateProjectWorkProgress = useCallback((stages: IProjectStage[]): WorkProgress => {
    let totalWorkUnits = 0;
    let completedWorkUnits = 0;
    
    stages.forEach(stage => {
      const workUnits = stage.workUnits || 0;
      const actualWorkUnits = stage.actualWorkUnits || 0;
      
      totalWorkUnits += workUnits;
      completedWorkUnits += Math.min(actualWorkUnits, workUnits);
    });
    
    let progressPercentage = 0;
    if (totalWorkUnits > 0) {
      progressPercentage = Math.round((completedWorkUnits / totalWorkUnits) * 100);
    } else if (stages.length > 0) {
      // If no work units defined, use finished status
      const finishedStages = stages.filter(s => isStageActuallyComplete(s)).length;
      progressPercentage = Math.round((finishedStages / stages.length) * 100);
    }
    
    return {
      totalWorkUnits,
      completedWorkUnits,
      progressPercentage,
      remainingWorkUnits: totalWorkUnits - completedWorkUnits
    };
  }, [isStageActuallyComplete]);

  // Check if design is complete
  const isDesignComplete = useCallback((project: IProject): boolean => {
    return project?.designStatus === DesignStatus.FINISHED || !!project?.designFinished;
  }, []);

  // Calculate overall project completion (design + work)
  const calculateOverallProjectCompletion = useCallback((project: IProject): number => {
    const workProgress = calculateProjectWorkProgress(project.stages || []);
    const designComplete = isDesignComplete(project);
    
    // Design phase is 20% of project, work is 80%
    let completion = 0;
    if (designComplete) {
      completion += 20;
    }
    
    completion += (workProgress.progressPercentage * 0.8);
    
    return Math.min(100, Math.round(completion));
  }, [calculateProjectWorkProgress, isDesignComplete]);

  // Check if project is truly finished
  const isProjectTrulyFinished = useCallback((project: IProject): boolean => {
    const workProgress = calculateProjectWorkProgress(project.stages || []);
    const allStagesFinished = (project.stages || []).every(stage => isStageActuallyComplete(stage));
    
    return allStagesFinished && isDesignComplete(project) && workProgress.progressPercentage === 100;
  }, [calculateProjectWorkProgress, isDesignComplete, isStageActuallyComplete]);

  // Calculate individual stage progress (based on work units)
  const calculateStageProgress = useCallback((stage: IProjectStage): number => {
    // Priority 1: If stage has work units, use that for progress
    if (stage.workUnits && stage.workUnits > 0) {
      const actualWorkUnits = stage.actualWorkUnits || 0;
      return Math.min(100, Math.round((actualWorkUnits / stage.workUnits) * 100));
    }
    
    // Priority 2: If stage has time taken, use that
    if (stage.timeTaken && stage.timeTaken > 0 && stage.capacityDays) {
      const capacityHours = stage.capacityDays * 8;
      return Math.min(100, Math.round((stage.timeTaken / capacityHours) * 100));
    }
    
    // Priority 3: Use date-based progress as fallback
    if (stage.startDate && stage.endDate) {
      const start = parseISO(stage.startDate);
      const end = parseISO(stage.endDate);
      const now = new Date();
      
      if (now <= start) return 0;
      if (now >= end) return isStageActuallyComplete(stage) ? 100 : 0;
      
      const totalDuration = differenceInDays(end, start);
      const elapsedDuration = differenceInDays(now, start);
      return Math.round((elapsedDuration / totalDuration) * 100);
    }
    
    // Priority 4: Check if stage is marked as finished
    if (isStageActuallyComplete(stage)) return 100;
    
    return 0;
  }, [isStageActuallyComplete]);

  // Check if stage is overdue - Only non-completed stages can be overdue
  const isStageOverdue = useCallback((stage: IProjectStage): boolean => {
    // If stage is already finished or completed, it's NOT overdue
    if (isStageActuallyComplete(stage)) {
      return false;
    }
    
    // If stage is cancelled, not overdue
    if (stage.status === StageStatus.CANCELLED) {
      return false;
    }
    
    // If no end date, can't determine overdue
    if (!stage.endDate) {
      return false;
    }
    
    const endDate = parseISO(stage.endDate);
    const today = startOfDay(new Date());
    
    // Only mark as overdue if end date is in the past AND stage is not complete
    return endDate < today;
  }, [isStageActuallyComplete]);

  // Get stage display status
  const getStageDisplayStatus = useCallback((stage: IProjectStage): { isOverdue: boolean; isComplete: boolean; isActive: boolean } => {
    const isComplete = isStageActuallyComplete(stage);
    const isActive = stage.status === StageStatus.ACTIVE || stage.status === StageStatus.IN_PROGRESS;
    
    let isOverdue = false;
    if (!isComplete && stage.endDate) {
      const endDate = parseISO(stage.endDate);
      const today = startOfDay(new Date());
      isOverdue = endDate < today;
    }
    
    return { isOverdue, isComplete, isActive };
  }, [isStageActuallyComplete]);

  // Color mapping for different stages
  const getStageColor = useCallback((stage: ProjectStatus): string => {
    const colorMap: Record<ProjectStatus, string> = {
      [ProjectStatus.INVOICE]: '#6B7280',
      [ProjectStatus.DESIGN]: '#3B82F6',
      [ProjectStatus.PURCHASING]: '#8B5CF6',
      [ProjectStatus.METAL_WORKS]: '#A855F7',
      [ProjectStatus.CNC]: '#EC4899',
      [ProjectStatus.CUTTING]: '#F59E0B',
      [ProjectStatus.EDGE_BANDING]: '#14B8A6',
      [ProjectStatus.ASSEMBLY]: '#F97316',
      [ProjectStatus.PAINTING]: '#6366F1',
      [ProjectStatus.FINISHING]: '#EAB308',
      [ProjectStatus.DELIVERY]: '#10B981',
      [ProjectStatus.INSTALLATION]: '#047857',
    };
    return colorMap[stage] || '#6B7280';
  }, []);

  // Helper function to darken colors
  const darkenColor = useCallback((color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
  }, []);

  // Format stage name for display
  const formatStageName = useCallback((stage: ProjectStatus): string => {
    return stage
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Get PI Number from invoice
  const getPINumber = useCallback((project: IProject): string => {
    return project.invoice?.piNumber || `Proj-${project.id.substring(0, 8)}...`;
  }, []);

  // Get project display name (PI Number + Client)
  const getProjectDisplayName = useCallback((project: IProject): string => {
    const piNumber = getPINumber(project);
    const clientName = project.customer?.companyName?.substring(0, 20) || '';
    
    if (clientName) {
      return `${piNumber} - ${clientName}`;
    }
    return piNumber;
  }, [getPINumber]);

  // Get client name
  const getClientName = useCallback((project: IProject): string => {
    return project.customer?.name || '';
  }, []);

  // Get project dates
  const getProjectDates = useCallback((project: IProject): { startDate?: Date; endDate?: Date } => {
    // Try to get dates from project stages first
    if (project.stages && project.stages.length > 0) {
      const stageDates = project.stages.filter(s => s.startDate && s.endDate);
      if (stageDates.length > 0) {
        const startDates = stageDates.map(s => parseISO(s.startDate!));
        const endDates = stageDates.map(s => parseISO(s.endDate!));
        const startDate = new Date(Math.min(...startDates.map(d => d.getTime())));
        const endDate = new Date(Math.max(...endDates.map(d => d.getTime())));
        return { startDate, endDate };
      }
    }
    
    // Fallback to delivery dates
    if (project.requestedDelivery) {
      const startDate = new Date();
      const endDate = parseISO(project.requestedDelivery);
      return { startDate, endDate };
    }
    
    if (project.calculatedDelivery) {
      const startDate = new Date();
      const endDate = parseISO(project.calculatedDelivery);
      return { startDate, endDate };
    }
    
    if (project.manualDelivery) {
      const startDate = new Date();
      const endDate = parseISO(project.manualDelivery);
      return { startDate, endDate };
    }
    
    return {};
  }, []);

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const piNumber = getPINumber(project).toLowerCase();
        const clientName = getClientName(project).toLowerCase();
        const projectId = project.id.toLowerCase();
        
        const matchesSearch = 
          piNumber.includes(query) ||
          clientName.includes(query) ||
          projectId.includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter - use the actual project status from project.status
      if (selectedStatuses.length > 0) {
        const projectStatus = getProjectCurrentStatus(project);
        if (!projectStatus || !selectedStatuses.includes(projectStatus)) {
          return false;
        }
      }

      // Completed projects filter
      const isCompleted = isProjectTrulyFinished(project);
      if (!showCompletedProjects && isCompleted) return false;

      // Date range filter
      if (dateRange.start && dateRange.end) {
        const projectDates = getProjectDates(project);
        
        if (!projectDates.startDate || !projectDates.endDate) return false;
        
        const isWithinRange = isWithinInterval(projectDates.startDate, { 
          start: dateRange.start, 
          end: dateRange.end 
        }) || isWithinInterval(projectDates.endDate, { 
          start: dateRange.start, 
          end: dateRange.end 
        });
        
        if (!isWithinRange) return false;
      }

      return true;
    });
  }, [projects, searchQuery, selectedStatuses, showCompletedProjects, dateRange, getPINumber, getClientName, getProjectDates, isProjectTrulyFinished, getProjectCurrentStatus]);

  // Function to compute tasks directly
  const computeTasksDirectly = useCallback((): Task[] => {
    if (!filteredProjects || filteredProjects.length === 0) return [];

    const ganttTasks: Task[] = [];
    let allDates: Date[] = [];

    // First pass: collect all dates to find overall range
    filteredProjects.forEach((project: IProject) => {
      const projectDates: { startDate?: Date; endDate?: Date } = getProjectDates(project);
      if (projectDates.startDate && projectDates.endDate) {
        allDates.push(projectDates.startDate, projectDates.endDate);
      }
      
      project.stages?.forEach((stage: IProjectStage) => {
        if (stage.startDate && stage.endDate) {
          allDates.push(parseISO(stage.startDate), parseISO(stage.endDate));
        }
      });
    });

    if (allDates.length === 0) {
      allDates = [new Date(), addDays(new Date(), 30)];
    }

    const earliestDate: Date = startOfDay(new Date(Math.min(...allDates.map((d: Date) => d.getTime()))));

    // Process each project
    filteredProjects.forEach((project: IProject, projectIndex: number) => {
      const projectId: string = `project-${project.id}`;
      const isExpanded: boolean = expandedProjects.has(projectId);
      const isSelected: boolean = selectedProjects.has(projectId);
      const isFinished = isProjectTrulyFinished(project);
      const projectStatus = getProjectCurrentStatus(project);
      
      // Determine project dates
      const projectDates: { startDate?: Date; endDate?: Date } = getProjectDates(project);
      let projectStartDate: Date;
      let projectEndDate: Date;
      
      if (projectDates.startDate && projectDates.endDate) {
        projectStartDate = projectDates.startDate;
        projectEndDate = projectDates.endDate;
      } else {
        // Fallback to overall range
        projectStartDate = addDays(earliestDate, projectIndex * 10);
        projectEndDate = addDays(projectStartDate, 30);
      }

      // Calculate project progress based on work units and design
      const projectProgress = calculateOverallProjectCompletion(project);

      // Add project as main task
      const projectTask: Task = {
        start: projectStartDate,
        end: projectEndDate,
        name: getProjectDisplayName(project),
        id: projectId,
        type: 'project',
        progress: projectProgress,
        hideChildren: !isExpanded,
        styles: { 
          backgroundColor: isFinished ? '#059669' : (isSelected ? '#1E3A8A' : '#1E40AF'), 
          backgroundSelectedColor: '#1E3A8A',
          progressColor: '#3B82F6',
          progressSelectedColor: '#2563EB'
        },
        dependencies: [],
      };
      ganttTasks.push(projectTask);

      // Add stages as subtasks if expanded
      if (isExpanded && project.stages && project.stages.length > 0) {
        // Keep stages in their original order (as defined in the database)
        const sortedStages: IProjectStage[] = [...project.stages];

        // Create stage tasks
        sortedStages.forEach((stage: IProjectStage, stageIndex: number) => {
          let stageStartDate: Date;
          let stageEndDate: Date;
          
          if (stage.startDate && stage.endDate) {
            stageStartDate = parseISO(stage.startDate);
            stageEndDate = parseISO(stage.endDate);
          } else {
            // Estimate dates if not available
            const daysFromStart: number = sortedStages.slice(0, stageIndex).reduce((sum: number, s: IProjectStage) => sum + (s.capacityDays || 1), 0);
            stageStartDate = addDays(projectStartDate, daysFromStart);
            stageEndDate = addDays(stageStartDate, stage.capacityDays || 1);
          }

          const stageProgress = calculateStageProgress(stage);
          const stageColor = getStageColor(stage.stage);
          const isStageOverdueFlag = isStageOverdue(stage);
          const isStageFinished = isStageActuallyComplete(stage);
          const isCurrentStage = stage.stage === projectStatus && !isStageFinished;

          const stageTask: Task = {
            start: stageStartDate,
            end: stageEndDate,
            name: `${formatStageName(stage.stage)}${isCurrentStage ? ' (Current)' : ''} - ${getPINumber(project)}`,
            id: `${projectId}-stage-${stage.id}`,
            type: 'task',
            progress: stageProgress,
            project: projectId,
            dependencies: [],
            styles: {
              backgroundColor: isStageFinished ? '#10B981' : (isStageOverdueFlag ? '#EF4444' : stageColor),
              backgroundSelectedColor: isStageFinished ? '#059669' : (isStageOverdueFlag ? '#DC2626' : darkenColor(stageColor, 20)),
              progressColor: isStageFinished ? '#047857' : (isStageOverdueFlag ? '#B91C1C' : darkenColor(stageColor, 40)),
              progressSelectedColor: isStageFinished ? '#065F46' : (isStageOverdueFlag ? '#991B1B' : darkenColor(stageColor, 60)),
            },
          };

          ganttTasks.push(stageTask);
        });
      }
    });

    return ganttTasks;
  }, [filteredProjects, expandedProjects, selectedProjects, getProjectDates, getProjectDisplayName, calculateOverallProjectCompletion, calculateStageProgress, getStageColor, formatStageName, getPINumber, darkenColor, isStageOverdue, isProjectTrulyFinished, getProjectCurrentStatus, isStageActuallyComplete]);

  // Handle task click
  const handleTaskClick = useCallback((task: Task) => {
    if (task.id.startsWith('project-')) {
      const projectId = task.id.replace('project-', '');
      const project = projects.find(p => p.id === projectId);
      
      if (project) {
        const workProgress = calculateProjectWorkProgress(project.stages || []);
        const designComplete = isDesignComplete(project);
        const overallProgress = calculateOverallProjectCompletion(project);
        const currentStatus = getProjectCurrentStatus(project);
        
        // Toggle expansion
        if (expandedProjects.has(task.id)) {
          const newExpanded = new Set(expandedProjects);
          newExpanded.delete(task.id);
          setExpandedProjects(newExpanded);
        } else {
          const newExpanded = new Set(expandedProjects);
          newExpanded.add(task.id);
          setExpandedProjects(newExpanded);
        }
        
        toast.info(`Project: ${task.name}`, {
          description: `Status: ${formatStageName(currentStatus)} | Overall: ${overallProgress}% | Work: ${workProgress.progressPercentage}% | Design: ${designComplete ? 'Complete' : 'In Progress'}`,
          duration: 3000,
        });
      }
    } else if (task.id.includes('-stage-')) {
      const [projectId, stageId] = task.id.split('-stage-');
      const actualProjectId = projectId.replace('project-', '');
      const project = projects.find(p => p.id === actualProjectId);
      const stage = project?.stages?.find(s => s.id === stageId);
      
      if (stage) {
        const stageWorkProgress = stage.workUnits ? {
          completed: stage.actualWorkUnits || 0,
          total: stage.workUnits
        } : null;
        
        toast.info(`Stage: ${task.name}`, {
          description: `Progress: ${task.progress}% | Work: ${stageWorkProgress ? `${stageWorkProgress.completed}/${stageWorkProgress.total} units` : ''} | Status: ${stage.status}`,
          duration: 3000,
          action: {
            label: 'View Project',
            onClick: () => router.push(`/dashboard/Project/view?id=${actualProjectId}`)
          }
        });
      }
    }
  }, [expandedProjects, projects, router, calculateProjectWorkProgress, isDesignComplete, calculateOverallProjectCompletion, getProjectCurrentStatus, formatStageName]);

  // Handle status filter toggle
  const handleStatusToggle = useCallback((status: ProjectStatus) => {
    const newStatuses = [...selectedStatuses];
    const index = newStatuses.indexOf(status);
    if (index > -1) {
      newStatuses.splice(index, 1);
    } else {
      newStatuses.push(status);
    }
    setSelectedStatuses(newStatuses);
  }, [selectedStatuses]);

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

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const csvData = filteredProjects.map(project => {
      const workProgress = calculateProjectWorkProgress(project.stages || []);
      const overallProgress = calculateOverallProjectCompletion(project);
      const designComplete = isDesignComplete(project);
      const isFinished = isProjectTrulyFinished(project);
      const currentStatus = getProjectCurrentStatus(project);
      
      return {
        'PI Number': getPINumber(project),
        'Project ID': project.id,
        'Client': getClientName(project),
        'Current Status': formatStageName(currentStatus),
        'Difficulty': project.difficulty,
        'Design Status': project.designStatus || 'Not Started',
        'Design Complete': designComplete ? 'Yes' : 'No',
        'Overall Progress': `${overallProgress}%`,
        'Work Progress': `${workProgress.progressPercentage}%`,
        'Completed Work Units': workProgress.completedWorkUnits,
        'Total Work Units': workProgress.totalWorkUnits,
        'Remaining Work Units': workProgress.remainingWorkUnits,
        'Project Complete': isFinished ? 'Yes' : 'No',
        'Requested Delivery': project.requestedDelivery || '',
        'Calculated Delivery': project.calculatedDelivery || '',
        'Manual Delivery': project.manualDelivery || '',
        'Total Days': project.totalDays || 0,
        'Total Quantity': project.totalProjectQuantity || 0,
        'Total Stages': project.stages?.length || 0,
        'Created At': project.createdAt,
        'Updated At': project.updatedAt,
      };
    });

    if (csvData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvHeaders = Object.keys(csvData[0] || {}).join(',');
    const csvRows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${csvHeaders}\n${csvRows}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-gantt-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast.success('Projects exported to CSV');
  }, [filteredProjects, calculateProjectWorkProgress, calculateOverallProjectCompletion, isDesignComplete, isProjectTrulyFinished, getPINumber, getClientName, getProjectCurrentStatus, formatStageName]);

  // Initialize tasks
  useEffect(() => {
    if (projects) {
      setIsLoading(true);
      try {
        const ganttTasks = computeTasksDirectly();
        setTasks(ganttTasks);
        
        // Adjust chart height based on number of tasks
        const totalTasks = ganttTasks.length;
        const newHeight = Math.min(800, Math.max(400, totalTasks * 40 + 100));
        setChartHeight(newHeight);
      } catch (error) {
        toast.error('Failed to generate Gantt chart');
        console.error('Error generating Gantt chart:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [projects, filteredProjects, expandedProjects, selectedProjects, computeTasksDirectly]);

  // Calculate statistics based on work progress
  const statistics = useMemo(() => {
    if (!projects || projects.length === 0) return null;

    const totalProjects = projects.length;
    const trulyFinishedProjects = projects.filter(p => isProjectTrulyFinished(p)).length;
    const designCompleteProjects = projects.filter(p => isDesignComplete(p)).length;
    
    const activeProjects = projects.filter(p => {
      const isFinished = isProjectTrulyFinished(p);
      return !isFinished;
    }).length;

    const overdueProjects = projects.filter(p => {
      if (isProjectTrulyFinished(p)) return false;
      
      // Check if any incomplete stage is overdue
      return p.stages?.some(stage => {
        if (isStageActuallyComplete(stage)) return false;
        if (stage.status === StageStatus.CANCELLED) return false;
        if (!stage.endDate) return false;
        const endDate = parseISO(stage.endDate);
        return endDate < new Date();
      }) || false;
    }).length;

    const totalStages = projects.reduce((sum, p) => sum + (p.stages?.length || 0), 0);
    const totalWorkUnits = projects.reduce((sum, p) => {
      const workProgress = calculateProjectWorkProgress(p.stages || []);
      return sum + workProgress.totalWorkUnits;
    }, 0);
    const completedWorkUnits = projects.reduce((sum, p) => {
      const workProgress = calculateProjectWorkProgress(p.stages || []);
      return sum + workProgress.completedWorkUnits;
    }, 0);
    
    const avgProgress = projects.reduce((sum, p) => 
      sum + calculateOverallProjectCompletion(p), 0) / totalProjects;

    return {
      totalProjects,
      activeProjects,
      trulyFinishedProjects,
      designCompleteProjects,
      overdueProjects,
      totalStages,
      totalWorkUnits,
      completedWorkUnits,
      avgProgress: Math.round(avgProgress),
      overallWorkProgress: totalWorkUnits > 0 ? Math.round((completedWorkUnits / totalWorkUnits) * 100) : 0,
    };
  }, [projects, calculateProjectWorkProgress, calculateOverallProjectCompletion, isDesignComplete, isProjectTrulyFinished, isStageActuallyComplete]);

  // Get unique statuses from all projects (from project.status field)
  const allStatuses = useMemo(() => {
    const statuses = new Set<ProjectStatus>();
    projects.forEach(project => {
      if (project.status) {
        statuses.add(project.status);
      }
      // Also add from stages for completeness
      project.stages?.forEach(stage => {
        statuses.add(stage.stage);
      });
    });
    return Array.from(statuses);
  }, [projects]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">All Projects Gantt Chart</h1>
          <p className="text-muted-foreground">
            Overview of all projects with work-based progress tracking
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Separator />

      {/* Basic Statistics */}
      {statistics && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Projects</p>
                <p className="text-2xl font-bold">{statistics.totalProjects}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.activeProjects}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statistics.trulyFinishedProjects}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Design Ready</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.designCompleteProjects}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{statistics.overdueProjects}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Stages</p>
                <p className="text-2xl font-bold">{statistics.totalStages}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Avg Progress</p>
                <p className="text-2xl font-bold">{statistics.avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PI Number, Client, or Project ID..."
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
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-completed"
                  checked={showCompletedProjects}
                  onCheckedChange={(checked) => setShowCompletedProjects(checked as boolean)}
                />
                <Label htmlFor="show-completed" className="text-sm">Show Completed</Label>
              </div>
              
              {/* Status Filters - using actual project statuses */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex flex-wrap gap-2">
                  {allStatuses.map(status => (
                    <Badge
                      key={status}
                      variant={selectedStatuses.includes(status) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleStatusToggle(status)}
                      style={{
                        backgroundColor: selectedStatuses.includes(status) ? getStageColor(status) : undefined,
                      }}
                    >
                      {formatStageName(status)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} projects
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Expand/collapse all projects
                    if (expandedProjects.size === filteredProjects.length) {
                      setExpandedProjects(new Set());
                    } else {
                      const allProjectIds = filteredProjects.map(p => `project-${p.id}`);
                      setExpandedProjects(new Set(allProjectIds));
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  <Layers className="h-4 w-4" />
                  {expandedProjects.size === filteredProjects.length ? 'Collapse All' : 'Expand All'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-green-600 rounded-sm" />
              <span className="text-sm">Completed Project</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-blue-700 rounded-sm" />
              <span className="text-sm">Active Project</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-green-500 rounded-sm" />
              <span className="text-sm">Completed Stage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-red-500 rounded-sm" />
              <span className="text-sm">Overdue Stage</span>
            </div>
            {Object.values(ProjectStatus).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{ backgroundColor: getStageColor(status) }}
                />
                <span className="text-sm">{formatStageName(status)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projects Timeline</CardTitle>
          <CardDescription>
            Progress based on actual work units completed | Click on project bars to expand/collapse stage details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Generating Gantt chart...</span>
            </div>
          ) : tasks.length > 0 ? (
            <div 
              className="gantt-container overflow-x-auto border rounded-lg"
              style={{ height: `${chartHeight}px` }}
            >
              <Gantt
                tasks={tasks}
                viewMode={viewMode}
                listCellWidth="250px"
                columnWidth={80}
                rowHeight={40}
                fontSize="12px"
                barFill={70}
                barCornerRadius={2}
                onSelect={handleTaskClick}
                locale="en-US"
                todayColor="rgba(59, 130, 246, 0.1)"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground border rounded-lg">
              <Calendar className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects List Summary */}
      {filteredProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projects Summary</CardTitle>
            <CardDescription>
              List of all projects with work-based progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProjects.map(project => {
                const projectProgress = calculateOverallProjectCompletion(project);
                const workProgress = calculateProjectWorkProgress(project.stages || []);
                const currentStatus = getProjectCurrentStatus(project);
                const isExpanded = expandedProjects.has(`project-${project.id}`);
                const isSelected = selectedProjects.has(`project-${project.id}`);
                const projectDates = getProjectDates(project);
                const piNumber = getPINumber(project);
                const designComplete = isDesignComplete(project);
                const isFinished = isProjectTrulyFinished(project);

                return (
                  <div
                    key={project.id}
                    className={`p-4 border rounded-md transition-all hover:bg-muted/50 ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    } ${isFinished ? 'bg-green-50/30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleTaskClick({ id: `project-${project.id}` } as Task)}
                        >
                          {isExpanded ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{piNumber}</h3>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {getClientName(project)}
                            </Badge>
                            <Badge
                              style={{ backgroundColor: getStageColor(currentStatus) }}
                              className="text-white"
                            >
                              {formatStageName(currentStatus)}
                            </Badge>
                            {designComplete && currentStatus !== ProjectStatus.DESIGN && (
                              <Badge variant="default" className="bg-purple-600">
                                Design Ready
                              </Badge>
                            )}
                            {isFinished && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Project ID: {project.id.substring(0, 8)}... • 
                            {projectDates.startDate && ` Start: ${format(projectDates.startDate, 'MMM dd, yyyy')}`}
                            {projectDates.endDate && ` → End: ${format(projectDates.endDate, 'MMM dd, yyyy')}`}
                          </p>
                          {workProgress.totalWorkUnits > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Work: {workProgress.completedWorkUnits}/{workProgress.totalWorkUnits} units completed
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{projectProgress}%</span>
                          </div>
                          <Progress value={projectProgress} className="h-2" />
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {project.stages?.length || 0} stages
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Work: {workProgress.progressPercentage}% complete
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/Project/view?id=${project.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded stages view */}
                    {isExpanded && project.stages && project.stages.length > 0 && (
                      <div className="mt-4 pl-9 border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Project Stages:</h4>
                        <div className="space-y-2">
                          {project.stages.map((stage) => {
                            const stageProgress = calculateStageProgress(stage);
                            const { isOverdue, isComplete, isActive } = getStageDisplayStatus(stage);
                            const isCurrentStage = stage.stage === currentStatus && !isComplete;
                            
                            const showAsComplete = isComplete;
                            const showAsOverdue = isOverdue && !showAsComplete;
                            
                            return (
                              <div 
                                key={stage.id} 
                                className={`flex items-center justify-between text-sm p-2 rounded 
                                  ${showAsOverdue ? 'bg-red-50 border-l-4 border-red-500' : ''} 
                                  ${isCurrentStage && !showAsComplete ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                                  ${showAsComplete ? 'bg-green-50' : ''}
                                `}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ 
                                      backgroundColor: showAsComplete 
                                        ? '#10B981' 
                                        : (showAsOverdue ? '#EF4444' : getStageColor(stage.stage))
                                    }}
                                  />
                                  <span className={isCurrentStage && !showAsComplete ? 'font-semibold' : ''}>
                                    {formatStageName(stage.stage)}
                                    {isCurrentStage && !showAsComplete && ' (Current)'}
                                    {showAsComplete && ' ✓'}
                                  </span>
                                  {showAsOverdue && (
                                    <Badge variant="destructive" className="text-xs">
                                      Overdue
                                    </Badge>
                                  )}
                                  {showAsComplete && (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      Complete
                                    </Badge>
                                  )}
                                  {!showAsComplete && !showAsOverdue && isActive && (
                                    <Badge variant="outline" className="text-xs bg-yellow-100">
                                      In Progress
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  {stage.workUnits && stage.workUnits > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      Units: {stage.actualWorkUnits || 0}/{stage.workUnits}
                                    </span>
                                  )}
                                  
                                  {stage.timeTaken && stage.timeTaken > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      Time: {stage.timeTaken}h
                                    </span>
                                  )}
                                  
                                  <span className="text-muted-foreground text-xs">
                                    {stage.startDate && stage.endDate ? (
                                      <>
                                        {format(parseISO(stage.startDate), 'MMM dd')} → 
                                        {format(parseISO(stage.endDate), 'MMM dd')}
                                        {showAsOverdue && ` (Overdue by ${differenceInDays(new Date(), parseISO(stage.endDate))} days)`}
                                      </>
                                    ) : 'Not scheduled'}
                                  </span>
                                  <div className="w-24">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>{stageProgress}%</span>
                                    </div>
                                    <Progress value={stageProgress} className="h-1" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Projects Actions */}
      {selectedProjects.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedProjects.size} project(s) selected</p>
                <p className="text-sm text-muted-foreground">
                  Perform bulk actions on selected projects
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info('Bulk edit feature coming soon!');
                  }}
                >
                  Bulk Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info('Export selected feature coming soon!');
                  }}
                >
                  Export Selected
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedProjects(new Set());
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