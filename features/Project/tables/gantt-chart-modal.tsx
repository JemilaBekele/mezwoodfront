/* eslint-disable @typescript-eslint/no-explicit-any */
// features/Project/gantt-chart-page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { format, parseISO, differenceInDays, addDays, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, Calendar, ArrowLeft, Filter, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { IProjectStage, ProjectStatus, StageStatus, IProject, DesignStatus } from '@/models/Projects';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getAllDailyStageCapacities } from '@/service/Category';
import { IDailyStageCapacity, ICapacityLot } from '@/models/CapacityLot';
import { getCapacitySlots } from '@/service/CapacityLot';

const WORKING_HOURS_PER_DAY = 7.5;

interface GanttChartPageProps {
  projectId: string;
  projectName?: string;
  stages: IProjectStage[];
  projectData: IProject;
}

interface FilterOptions {
  stages: ProjectStatus[];
  statuses: StageStatus[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchTerm: string;
  showCompleted: boolean;
  showOverdue: boolean;
}

interface WorkProgress {
  totalWorkUnits: number;
  completedWorkUnits: number;
  progressPercentage: number;
  remainingWorkUnits: number;
}

export const GanttChartPage: React.FC<GanttChartPageProps> = ({
  projectId,
  projectName,
  stages,
  projectData,
}) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isLoading, setIsLoading] = useState(false);
  const [chartHeight, setChartHeight] = useState(400);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    stages: [],
    statuses: [],
    dateRange: { start: null, end: null },
    searchTerm: '',
    showCompleted: true,
    showOverdue: true,
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Capacity tracking states
  const [capacityMap, setCapacityMap] = useState<Map<string, Map<string, any>>>(new Map());
  const [loadingCapacity, setLoadingCapacity] = useState(false);
  const capacityDataFetched = React.useRef(false);

  // --- Helper Functions ---

  const isDateTakenByCurrentProject = useCallback((stageId: string, date: Date): boolean => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage || !stage.startDate || !stage.endDate) return false;
    const stageStart = parseISO(stage.startDate);
    const stageEnd = parseISO(stage.endDate);
    const checkDate = new Date(date);
    return isWithinInterval(checkDate, { start: stageStart, end: stageEnd });
  }, [stages]);

  // Fetch capacity data
  const fetchCapacityData = useCallback(async () => {
    if (capacityDataFetched.current) return;
    try {
      setLoadingCapacity(true);
      const [capacitiesResult, slotsResult] = await Promise.all([
        getAllDailyStageCapacities(),
        getCapacitySlots()
      ]);
      const capacities = Array.isArray(capacitiesResult) ? capacitiesResult : [];
      const slots = Array.isArray(slotsResult) ? slotsResult : [];
      
      const newCapacityMap = new Map<string, Map<string, any>>();
      capacities.forEach(capacity => {
        if (!capacity) return;
        const stageKey = capacity.stage;
        const dateKey = new Date(capacity.date).toISOString().split('T')[0];
        const capacityLot = slots.find(lot => lot?.stage === capacity.stage);
        const maxCapacity = capacityLot?.capacity || 1;
        const maxHours = 7.5;
        const availableCapacity = maxCapacity - (capacity.usedCapacity || 0);
        const availableHours = maxHours - (capacity.usedHours || 0);
        
        if (!newCapacityMap.has(stageKey)) {
          newCapacityMap.set(stageKey, new Map());
        }
        const stageMap = newCapacityMap.get(stageKey);
        if (stageMap) {
          stageMap.set(dateKey, {
            date: dateKey,
            stage: stageKey,
            usedCapacity: capacity.usedCapacity || 0,
            maxCapacity,
            usedHours: capacity.usedHours || 0,
            maxHours,
            availableCapacity: Math.max(0, availableCapacity),
            availableHours: Math.max(0, availableHours),
            isOverCapacity: availableCapacity < 0 || availableHours < 0,
          });
        }
      });
      setCapacityMap(newCapacityMap);
      capacityDataFetched.current = true;
    } catch (error) {
      console.error('Failed to fetch capacity data:', error);
    } finally {
      setLoadingCapacity(false);
    }
  }, []);

  const getCapacityInfoForStageAndDate = useCallback((stage: ProjectStatus, date: Date, currentStageId?: string): any | null => {
    const stageKey = stage as string;
    const dateKey = format(date, 'yyyy-MM-dd');
    const stageCapacityMap = capacityMap.get(stageKey);
    const baseInfo = stageCapacityMap?.get(dateKey) || null;
    
    if (!baseInfo) {
      return {
        date: dateKey,
        stage: stageKey,
        usedCapacity: 0,
        maxCapacity: 1,
        usedHours: 0,
        maxHours: 7.5,
        availableCapacity: 1,
        availableHours: 7.5,
        isOverCapacity: false,
        isDateTakenByProject: currentStageId ? isDateTakenByCurrentProject(currentStageId, date) : false
      };
    }
    
    const isTakenByCurrentProject = currentStageId ? isDateTakenByCurrentProject(currentStageId, date) : false;
    return {
      ...baseInfo,
      isDateTakenByProject: isTakenByCurrentProject,
      availableCapacity: isTakenByCurrentProject ? baseInfo.availableCapacity + 1 : baseInfo.availableCapacity,
      isOverCapacity: !isTakenByCurrentProject && baseInfo.isOverCapacity
    };
  }, [capacityMap, isDateTakenByCurrentProject]);

  const checkDateRangeCapacity = useCallback((stage: ProjectStatus, startDate: Date, endDate: Date, stageId?: string): { hasConflict: boolean; conflictDates: string[] } => {
    const conflictDates: string[] = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    while (currentDate <= end) {
      const capacityInfo = getCapacityInfoForStageAndDate(stage, currentDate, stageId);
      if (capacityInfo && capacityInfo.isOverCapacity && !capacityInfo.isDateTakenByProject) {
        conflictDates.push(format(currentDate, 'yyyy-MM-dd'));
      }
      currentDate = addDays(currentDate, 1);
    }
    return { hasConflict: conflictDates.length > 0, conflictDates };
  }, [getCapacityInfoForStageAndDate]);

  // --- Color Helpers ---
  const getStageColor = useCallback((stage: ProjectStatus): string => {
    const colorMap: Record<ProjectStatus, string> = {
      [ProjectStatus.INVOICE]: '#6B7280',
      [ProjectStatus.DESIGN]: '#3B82F6',
      [ProjectStatus.PURCHASING]: '#8B5CF6',
      [ProjectStatus.METAL_WORKS]: '#A855F7',
      [ProjectStatus.CNC]: '#EC4899',
      [ProjectStatus.CUTTING]: '#F59E0B',
      [ProjectStatus.EDGE_BANDING]: '#14B8A6',
      [ProjectStatus.PAINTING]: '#6366F1',
      [ProjectStatus.ASSEMBLY]: '#F97316',
      [ProjectStatus.FINISHING]: '#EAB308',
      [ProjectStatus.DELIVERY]: '#10B981',
      [ProjectStatus.INSTALLATION]: '#047857',
    };
    return colorMap[stage] || '#6B7280';
  }, []);

  const darkenColor = useCallback((color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }, []);

  const formatStageName = useCallback((stage: ProjectStatus): string => {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // --- Progress Calculations ---
  const calculateStageProgress = useCallback((stage: IProjectStage): number => {
    if (stage.workUnits && stage.workUnits > 0) {
      const actualWorkUnits = stage.actualWorkUnits || 0;
      return Math.min(100, Math.round((actualWorkUnits / stage.workUnits) * 100));
    }
    if (stage.timeTaken && stage.timeTaken > 0 && stage.capacityDays) {
      const capacityHours = stage.capacityDays * WORKING_HOURS_PER_DAY;
      return Math.min(100, Math.round((stage.timeTaken / capacityHours) * 100));
    }
    if (stage.startDate && stage.endDate) {
      const start = parseISO(stage.startDate);
      const end = parseISO(stage.endDate);
      const now = new Date();
      if (now <= start) return 0;
      if (now >= end) return stage.finished ? 100 : 0;
      const totalDuration = differenceInDays(end, start);
      const elapsedDuration = differenceInDays(now, start);
      return Math.round((elapsedDuration / totalDuration) * 100);
    }
    if (stage.finished || stage.status === StageStatus.COMPLETED) return 100;
    return 0;
  }, []);

  const calculateStageWorkProgress = useCallback((stage: IProjectStage): WorkProgress => {
    const totalWorkUnits = stage.workUnits || 0;
    const actualWorkUnits = stage.actualWorkUnits || 0;
    const completedWorkUnits = Math.min(actualWorkUnits, totalWorkUnits);
    let progressPercentage = 0;
    if (totalWorkUnits > 0) {
      progressPercentage = Math.round((completedWorkUnits / totalWorkUnits) * 100);
    } else if (stage.finished || stage.status === StageStatus.COMPLETED) {
      progressPercentage = 100;
    }
    return { totalWorkUnits, completedWorkUnits, progressPercentage, remainingWorkUnits: Math.max(0, totalWorkUnits - completedWorkUnits) };
  }, []);

  const calculateProjectWorkProgress = useCallback((): WorkProgress => {
    let totalWorkUnits = 0, completedWorkUnits = 0;
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
      const finishedStages = stages.filter(s => s.finished || s.status === StageStatus.COMPLETED).length;
      progressPercentage = Math.round((finishedStages / stages.length) * 100);
    }
    return { totalWorkUnits, completedWorkUnits, progressPercentage, remainingWorkUnits: totalWorkUnits - completedWorkUnits };
  }, [stages]);

  const isDesignComplete = useCallback((): boolean => {
    return projectData?.designStatus === DesignStatus.FINISHED || !!projectData?.designFinished;
  }, [projectData]);

  const calculateOverallProjectCompletion = useCallback((): number => {
    const workProgress = calculateProjectWorkProgress();
    const designComplete = isDesignComplete();
    let completion = designComplete ? 20 : 0;
    completion += (workProgress.progressPercentage * 0.8);
    return Math.min(100, Math.round(completion));
  }, [calculateProjectWorkProgress, isDesignComplete]);

  const isProjectTrulyFinished = useCallback((): boolean => {
    const workProgress = calculateProjectWorkProgress();
    const allStagesFinished = stages.every(stage => 
      stage.finished || stage.status === StageStatus.COMPLETED ||
      (stage.workUnits && stage.actualWorkUnits && stage.actualWorkUnits >= stage.workUnits)
    );
    return allStagesFinished && isDesignComplete() && workProgress.progressPercentage === 100;
  }, [stages, calculateProjectWorkProgress, isDesignComplete]);

  const isStageOverdue = useCallback((stage: IProjectStage): boolean => {
    if (stage.finished || stage.status === StageStatus.COMPLETED) return false;
    if (!stage.endDate) return false;
    const workProgress = calculateStageWorkProgress(stage);
    const endDate = parseISO(stage.endDate);
    const isDateOverdue = endDate < new Date();
    if (workProgress.progressPercentage === 100) return false;
    return isDateOverdue;
  }, [calculateStageWorkProgress]);

  // --- Convert Stages to Gantt Tasks ---
  const convertStagesToTasks = useCallback((): Task[] => {
    if (!stages || stages.length === 0) return [];
    const ganttTasks: Task[] = [];
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    stages.forEach(stage => {
      if (stage.startDate && stage.endDate) {
        const start = parseISO(stage.startDate);
        const end = parseISO(stage.endDate);
        if (!earliestDate || start < earliestDate) earliestDate = start;
        if (!latestDate || end > latestDate) latestDate = end;
      }
    });

    if (!earliestDate || !latestDate) {
      earliestDate = new Date();
      latestDate = addDays(earliestDate, 30);
    }

    const startDate = earliestDate || new Date();
    const endDate = latestDate || addDays(startDate, 30);

    // Project Task
    const projectTask: Task = {
      start: startDate,
      end: endDate,
      name: projectName || `Project ${projectId.substring(0, 8)}...`,
      id: 'project',
      type: 'project',
      progress: calculateOverallProjectCompletion(),
      hideChildren: false,
      styles: { 
        backgroundColor: '#1E40AF', 
        backgroundSelectedColor: '#1E3A8A',
        progressColor: '#3B82F6',
        progressSelectedColor: '#2563EB'
      },
    };
    ganttTasks.push(projectTask);

    // Stage Tasks
    stages.forEach((stage, index) => {
      let stageStartDate: Date, stageEndDate: Date;
      if (stage.startDate && stage.endDate) {
        stageStartDate = parseISO(stage.startDate);
        stageEndDate = parseISO(stage.endDate);
      } else {
        const daysFromStart = stages.slice(0, index).reduce((sum, s) => sum + (s.capacityDays || 1), 0);
        stageStartDate = addDays(startDate, daysFromStart);
        stageEndDate = addDays(stageStartDate, stage.capacityDays || 1);
      }

      const capacityCheck = checkDateRangeCapacity(stage.stage, stageStartDate, stageEndDate, stage.id);
      const stageProgress = calculateStageProgress(stage);
      const stageColor = getStageColor(stage.stage);
      const isOverdue = isStageOverdue(stage);
      const isFinished = stage.finished || stage.status === StageStatus.COMPLETED;
      const hasCapacityWarning = capacityCheck.hasConflict && !isFinished;

      const task: Task = {
        start: stageStartDate,
        end: stageEndDate,
        name: formatStageName(stage.stage),
        id: stage.id,
        type: 'task',
        progress: stageProgress,
        project: 'project',
        styles: {
          backgroundColor: hasCapacityWarning ? '#F59E0B' : (isFinished ? '#10B981' : (isOverdue ? '#EF4444' : stageColor)),
          backgroundSelectedColor: hasCapacityWarning ? '#D97706' : (isFinished ? '#059669' : (isOverdue ? '#DC2626' : darkenColor(stageColor, 20))),
          progressColor: hasCapacityWarning ? '#B45309' : (isFinished ? '#047857' : (isOverdue ? '#B91C1C' : darkenColor(stageColor, 40))),
          progressSelectedColor: hasCapacityWarning ? '#92400E' : (isFinished ? '#065F46' : (isOverdue ? '#991B1B' : darkenColor(stageColor, 60))),
        },
      };
      ganttTasks.push(task);
    });

    return ganttTasks;
  }, [stages, projectId, projectName, getStageColor, darkenColor, formatStageName, calculateStageProgress, calculateOverallProjectCompletion, isStageOverdue, checkDateRangeCapacity]);

  // --- Filter Functions ---
  const applyFilters = useCallback((tasksToFilter: Task[], originalStages: IProjectStage[]) => {
    const filtered = [...tasksToFilter];
    const stageTasks = filtered.filter(task => task.id !== 'project');
    const projectTask = filtered.find(task => task.id === 'project');
    
    let filteredStageTasks = stageTasks;
    
    if (filterOptions.stages.length > 0) {
      filteredStageTasks = filteredStageTasks.filter(task => {
        const stage = originalStages.find(s => s.id === task.id);
        return stage && filterOptions.stages.includes(stage.stage);
      });
    }
    
    if (filterOptions.statuses.length > 0) {
      filteredStageTasks = filteredStageTasks.filter(task => {
        const stage = originalStages.find(s => s.id === task.id);
        return stage && filterOptions.statuses.includes(stage.status);
      });
    }
    
    if (filterOptions.dateRange.start || filterOptions.dateRange.end) {
      filteredStageTasks = filteredStageTasks.filter(task => {
        let valid = true;
        if (filterOptions.dateRange.start) {
          valid = valid && isAfter(task.start, filterOptions.dateRange.start!);
        }
        if (filterOptions.dateRange.end) {
          valid = valid && isBefore(task.start, filterOptions.dateRange.end!);
        }
        return valid;
      });
    }
    
    if (filterOptions.searchTerm) {
      filteredStageTasks = filteredStageTasks.filter(task =>
        task.name.toLowerCase().includes(filterOptions.searchTerm.toLowerCase())
      );
    }
    
    if (!filterOptions.showCompleted) {
      filteredStageTasks = filteredStageTasks.filter(task => {
        const stage = originalStages.find(s => s.id === task.id);
        return stage && stage.status !== StageStatus.COMPLETED && !stage.finished;
      });
    }
    
    if (!filterOptions.showOverdue) {
      filteredStageTasks = filteredStageTasks.filter(task => {
        const stage = originalStages.find(s => s.id === task.id);
        return stage && !isStageOverdue(stage);
      });
    }
    
    const result = [];
    if (projectTask && filteredStageTasks.length > 0) {
      result.push(projectTask);
    }
    result.push(...filteredStageTasks);
    return result;
  }, [filterOptions, isStageOverdue]);

  const updateActiveFilters = useCallback(() => {
    const active: string[] = [];
    if (filterOptions.stages.length > 0) active.push(`${filterOptions.stages.length} stage(s)`);
    if (filterOptions.statuses.length > 0) active.push(`${filterOptions.statuses.length} status(es)`);
    if (filterOptions.dateRange.start || filterOptions.dateRange.end) active.push('Date range');
    if (filterOptions.searchTerm) active.push(`Search: ${filterOptions.searchTerm}`);
    if (!filterOptions.showCompleted) active.push('Hide completed');
    if (!filterOptions.showOverdue) active.push('Hide overdue');
    setActiveFilters(active);
  }, [filterOptions]);

  const clearFilters = useCallback(() => {
    setFilterOptions({
      stages: [],
      statuses: [],
      dateRange: { start: null, end: null },
      searchTerm: '',
      showCompleted: true,
      showOverdue: true,
    });
    setFilterDialogOpen(false);
    toast.info('All filters cleared');
  }, []);

  // --- Handlers ---
  const handleTaskClick = useCallback((task: Task) => {
    const clickedStage = stages.find(stage => stage.id === task.id);
    if (clickedStage) {
      const workProgress = calculateStageWorkProgress(clickedStage);
      const capacityCheck = checkDateRangeCapacity(
        clickedStage.stage, 
        parseISO(clickedStage.startDate!), 
        parseISO(clickedStage.endDate!),
        clickedStage.id
      );
      
      let description = `Progress: ${workProgress.progressPercentage}% | Status: ${clickedStage.status}`;
      if (capacityCheck.hasConflict) {
        description += ` | ⚠️ Conflict on: ${capacityCheck.conflictDates.join(', ')}`;
        toast.warning(`⚠️ Capacity conflict for ${task.name}`, {
          description: `Conflicts with OTHER projects on: ${capacityCheck.conflictDates.join(', ')}`,
          duration: 4000,
        });
      } else {
        toast.info(`Stage: ${task.name}`, {
          description,
          duration: 3000,
        });
      }
    } else {
      const overallProgress = calculateOverallProjectCompletion();
      const workProgress = calculateProjectWorkProgress();
      toast.info(`Project: ${task.name}`, {
        description: `Progress: ${overallProgress}% | Design: ${isDesignComplete() ? '✓ Complete' : 'In Progress'}`,
        duration: 3000,
      });
    }
  }, [stages, calculateStageWorkProgress, calculateOverallProjectCompletion, calculateProjectWorkProgress, isDesignComplete, checkDateRangeCapacity]);

  const handleZoomIn = useCallback(() => {
    const viewModes = [ViewMode.Hour, ViewMode.QuarterDay, ViewMode.HalfDay, ViewMode.Day, ViewMode.Week, ViewMode.Month, ViewMode.Year];
    const currentIndex = viewModes.indexOf(viewMode);
    if (currentIndex < viewModes.length - 1) {
      setViewMode(viewModes[currentIndex + 1]);
    }
  }, [viewMode]);

  const handleZoomOut = useCallback(() => {
    const viewModes = [ViewMode.Hour, ViewMode.QuarterDay, ViewMode.HalfDay, ViewMode.Day, ViewMode.Week, ViewMode.Month, ViewMode.Year];
    const currentIndex = viewModes.indexOf(viewMode);
    if (currentIndex > 0) {
      setViewMode(viewModes[currentIndex - 1]);
    }
  }, [viewMode]);

  const handleApplyFilters = useCallback(() => {
    const filtered = applyFilters(tasks, stages);
    setFilteredTasks(filtered);
    setFilterDialogOpen(false);
    updateActiveFilters();
    toast.success('Filters applied');
  }, [applyFilters, tasks, stages, updateActiveFilters]);

  // --- Statistics ---
  const statistics = useMemo(() => {
    if (!stages || stages.length === 0) return null;
    const completed = stages.filter(stage => 
      stage.status === StageStatus.COMPLETED || 
      (stage.workUnits && stage.actualWorkUnits && stage.actualWorkUnits >= stage.workUnits)
    ).length;
    const inProgress = stages.filter(stage => 
      stage.status === StageStatus.IN_PROGRESS &&
      !(stage.workUnits && stage.actualWorkUnits && stage.actualWorkUnits >= stage.workUnits)
    ).length;
    const active = stages.filter(stage => stage.status === StageStatus.ACTIVE).length;
    const overdue = stages.filter(stage => isStageOverdue(stage)).length;
    const capacityConflicts = stages.filter(stage => {
      if (stage.startDate && stage.endDate) {
        const capacityCheck = checkDateRangeCapacity(stage.stage, parseISO(stage.startDate), parseISO(stage.endDate), stage.id);
        return capacityCheck.hasConflict && stage.status !== StageStatus.COMPLETED && !stage.finished;
      }
      return false;
    }).length;
    const totalDuration = stages.reduce((sum, stage) => sum + (stage.capacityDays || 1), 0);
    const workProgress = calculateProjectWorkProgress();
    return { completed, inProgress, active, overdue, capacityConflicts, totalDuration, workProgress };
  }, [stages, isStageOverdue, calculateProjectWorkProgress, checkDateRangeCapacity]);

  // --- Effects ---
  useEffect(() => {
    if (stages && stages.length > 0) {
      fetchCapacityData();
      setIsLoading(true);
      try {
        const ganttTasks = convertStagesToTasks();
        setTasks(ganttTasks);
        setFilteredTasks(ganttTasks);
        const newHeight = Math.min(600, Math.max(300, stages.length * 50 + 100));
        setChartHeight(newHeight);
      } catch (error) {
        toast.error('Failed to generate Gantt chart');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [stages, fetchCapacityData, convertStagesToTasks]);

  useEffect(() => {
    if (tasks.length > 0) {
      const filtered = applyFilters(tasks, stages);
      setFilteredTasks(filtered);
    }
  }, [filterOptions, tasks, stages, applyFilters]);

  // --- Render ---
  return (
    <TooltipProvider>
      <div className="mx-auto w-full space-y-4">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight">Project Timeline</h1>
                {isProjectTrulyFinished() && (
                  <Badge className="bg-emerald-600 text-white text-xs h-6 gap-1">
                    <CheckCircle className="h-3 w-3" /> Complete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-md">
                {projectName || `Project ${projectId.substring(0, 8)}...`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => setFilterDialogOpen(true)} variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" /> Filter
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-5 w-5 p-0 justify-center text-xs">{activeFilters.length}</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* ===== ACTIVE FILTERS ===== */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="text-xs">{filter}</Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-7 text-xs gap-1">
              <X className="h-3 w-3" /> Clear All
            </Button>
          </div>
        )}

       

        {/* ===== GANTT CHART ===== */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Timeline</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  {filteredTasks.length - 1} stages · View-only
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                  <SelectTrigger className="h-9 w-[110px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ViewMode.Day}>Day</SelectItem>
                    <SelectItem value={ViewMode.Week}>Week</SelectItem>
                    <SelectItem value={ViewMode.Month}>Month</SelectItem>
                    <SelectItem value={ViewMode.Year}>Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t mt-3">
              <span className="text-xs font-medium text-muted-foreground">Status:</span>
              {[
                { color: 'bg-emerald-500', label: 'Completed' },
                { color: 'bg-blue-500', label: 'In Progress' },
                { color: 'bg-red-500', label: 'Overdue' },
                { color: 'bg-amber-500', label: 'Capacity Warning' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`h-3 w-3 rounded-sm ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
              <span className="text-xs font-medium text-muted-foreground ml-1">Stage Types:</span>
              {Object.values(ProjectStatus).slice(0, 4).map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: getStageColor(status) }} />
                  <span className="text-xs text-muted-foreground">{formatStageName(status)}</span>
                </div>
              ))}
              {Object.values(ProjectStatus).length > 4 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs h-5 px-1.5">+{Object.values(ProjectStatus).length - 4}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {Object.values(ProjectStatus).slice(4).map((status) => (
                        <div key={status} className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: getStageColor(status) }} />
                          <span className="text-xs">{formatStageName(status)}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {loadingCapacity ? (
              <div className="flex items-center justify-center h-80 gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading capacity data…</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-80 gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading chart…</span>
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="gantt-container overflow-x-auto rounded-lg border" style={{ height: `${chartHeight}px` }}>
                <Gantt
                  tasks={filteredTasks}
                  viewMode={viewMode}
                  listCellWidth="200px"
                  columnWidth={80}
                  rowHeight={50}
                  fontSize="14px"
                  barFill={70}
                  onSelect={handleTaskClick}
                  locale="en-US"
                  todayColor="rgba(59, 130, 246, 0.1)"
                  barCornerRadius={4}
                  barProgressColor={darkenColor('#3B82F6', 40)}
                  barProgressSelectedColor={darkenColor('#3B82F6', 60)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-muted-foreground rounded-lg border border-dashed">
                <Calendar className="h-12 w-12 mb-3" />
                <p className="text-sm font-medium">No stages match your filters</p>
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== FILTER DIALOG ===== */}
        <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filter Gantt Chart</DialogTitle>
              <DialogDescription>Apply filters to customize your project timeline view</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Search Stages</Label>
                <Input
                  placeholder="Search by stage name..."
                  value={filterOptions.searchTerm}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Filter by Stage Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.values(ProjectStatus).map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Checkbox
                        id={`stage-${stage}`}
                        checked={filterOptions.stages.includes(stage)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterOptions(prev => ({ ...prev, stages: [...prev.stages, stage] }));
                          } else {
                            setFilterOptions(prev => ({ ...prev, stages: prev.stages.filter(s => s !== stage) }));
                          }
                        }}
                      />
                      <Label htmlFor={`stage-${stage}`} className="text-sm">{formatStageName(stage)}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Filter by Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(StageStatus).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filterOptions.statuses.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterOptions(prev => ({ ...prev, statuses: [...prev.statuses, status] }));
                          } else {
                            setFilterOptions(prev => ({ ...prev, statuses: prev.statuses.filter(s => s !== status) }));
                          }
                        }}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm">{status}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-completed"
                      checked={filterOptions.showCompleted}
                      onCheckedChange={(checked) => setFilterOptions(prev => ({ ...prev, showCompleted: checked as boolean }))}
                    />
                    <Label htmlFor="show-completed">Show completed stages</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-overdue"
                      checked={filterOptions.showOverdue}
                      onCheckedChange={(checked) => setFilterOptions(prev => ({ ...prev, showOverdue: checked as boolean }))}
                    />
                    <Label htmlFor="show-overdue">Show overdue stages</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={clearFilters}>Clear All</Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};