/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2,
  Save,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IProject, IProjectStage, ProjectStatus, StageStatus } from '@/models/Projects';
import { getProjectId, updateProjectStage, deleteProjectStage } from '@/service/Project';
import { CapacityStage, ICapacityLot, IDailyStageCapacity } from '@/models/CapacityLot';
import { getCapacitySlots } from '@/service/CapacityLot';
import { getAllDailyStageCapacities } from '@/service/Category';

interface StageFormData {
  id?: string;
  stage: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  capacityDays: number;
  autoSchedule?: boolean;
  isNew?: boolean;
  workUnits?: number;
  actualWorkUnits?: number;
  timeTaken?: number;
  status?: StageStatus;
  finished?: boolean;
}

interface DateCapacityInfo {
  date: string;
  usedCapacity: number;
  maxCapacity: number;
  usedHours: number;
  maxHours: number;
  overCapacityUsed: number;
  overHoursCapacityUsed: number;
  availableCapacity: number;
  availableHours: number;
  isOverCapacity: boolean;
}

type StageUpdatePageProps = {
  id?: string;
  embedded?: boolean;
};

// Working hours per day
const WORKING_HOURS_PER_DAY = 7.5;

// Helper function to format minutes to readable time
const formatMinutes = (minutes?: number) => {
  if (!minutes && minutes !== 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

// Set default working hours (8:00 AM to 5:00 PM)
const setDefaultWorkingHours = (date: Date | null): Date | null => {
  if (!date) return null;
  const newDate = new Date(date);
  newDate.setHours(8, 0, 0, 0);
  return newDate;
};

const safeFormatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'Not set';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  return `${formatDate(dateObj.toISOString())} ${dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const timeInputValue = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) return '08:00';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const withDatePart = (current: Date | null, nextDate?: Date): Date | null => {
  if (!nextDate) return current;
  const next = new Date(nextDate);
  const base = current && !isNaN(current.getTime()) ? current : setDefaultWorkingHours(next);
  next.setHours(base?.getHours() ?? 8, base?.getMinutes() ?? 0, 0, 0);
  return next;
};

const withTimePart = (current: Date | null, value: string): Date | null => {
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return current;
  const next = current ? new Date(current) : setDefaultWorkingHours(new Date());
  next?.setHours(hours, minutes, 0, 0);
  return next;
};

const approximateEndDate = (stage: StageFormData): Date | null => {
  if (!stage.startDate) return null;
  return new Date(stage.startDate.getTime() + (stage.timeTaken || 0) * 60000);
};

const timeParts = (minutes?: number) => ({
  hours: Math.floor((minutes || 0) / 60),
  minutes: (minutes || 0) % 60,
});

// Safe stage display name formatter
const getStageDisplayName = (stage: ProjectStatus | string | null | undefined): string => {
  if (!stage) return 'Unknown Stage';
  const stageStr = String(stage);
  return stageStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Convert ProjectStatus to CapacityStage
const toCapacityStage = (stage: ProjectStatus): CapacityStage => {
  return stage as unknown as CapacityStage;
};

const ProjectStageUpdatePage: React.FC<StageUpdatePageProps> = ({ id, embedded = false }) => { 
  const router = useRouter();  
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<StageFormData[]>([]);
  const [saving, setSaving] = useState(false);

  // Unified add/edit dialog state
  const emptyStage: StageFormData = {
    stage: ProjectStatus.DESIGN,
    startDate: null,
    endDate: null,
    capacityDays: 1,
    timeTaken: 0,
    isNew: true,
    workUnits: 0,
  };
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<StageFormData>(emptyStage);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<StageFormData | null>(null);
  const [deleteDownstream, setDeleteDownstream] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Capacity data states
  const [capacityLots, setCapacityLots] = useState<ICapacityLot[]>([]);
  const [dailyCapacities, setDailyCapacities] = useState<Map<string, IDailyStageCapacity[]>>(new Map());
  const [loadingCapacity, setLoadingCapacity] = useState(false);
  const [dateValidationWarnings, setDateValidationWarnings] = useState<Map<string, DateCapacityInfo[]>>(new Map());
  

  // Check if user can edit
  const canEdit = true;

  // Check if a stage is finished/completed (cannot be edited)
  const isStageFinished = (stage: StageFormData) => {
    return stage.status === StageStatus.COMPLETED || stage.finished === true;
  };

  // Fetch capacity data
  const fetchCapacityData = useCallback(async () => {
    try {
      setLoadingCapacity(true);
      const [slots, allCapacities] = await Promise.all([
        getCapacitySlots(),
        getAllDailyStageCapacities()
      ]);
      setCapacityLots(slots);
      
      // Group daily capacities by stage
      const capacitiesByStage = new Map<string, IDailyStageCapacity[]>();
      allCapacities.forEach(capacity => {
        const existing = capacitiesByStage.get(capacity.stage) || [];
        existing.push(capacity);
        capacitiesByStage.set(capacity.stage, existing);
      });
      setDailyCapacities(capacitiesByStage);
    } catch (error) {
      console.error('Failed to fetch capacity data:', error);
    } finally {
      setLoadingCapacity(false);
    }
  }, []);

  // Fetch project data and stages
  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      if (id) {
        const projectData = await getProjectId(id);
        setProject(projectData);
        
        if (projectData.stages && projectData.stages.length > 0) {
          const formattedStages = projectData.stages.map((stage: IProjectStage) => {
            const startDateObj = stage.startDateTime
              ? new Date(stage.startDateTime)
              : stage.startDate
                ? new Date(stage.startDate)
                : null;
            const endDateObj = stage.endDateTime
              ? new Date(stage.endDateTime)
              : stage.endDate
                ? new Date(stage.endDate)
                : null;
            
            return {
              id: stage.id,
              stage: stage.stage,
              startDate: startDateObj,
              endDate: endDateObj,
              capacityDays: stage.capacityDays || 1,
              autoSchedule: stage.autoSchedule || false,
              isNew: false,
              workUnits: stage.workUnits ?? undefined,
              actualWorkUnits: stage.actualWorkUnits ?? undefined,
              timeTaken: stage.timeTaken ?? undefined,
              status: stage.status,
              finished: stage.finished,
            };
          });
          setStages(formattedStages);
        } else {
          setStages([]);
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
    fetchCapacityData();
  }, [fetchProjectData, fetchCapacityData]);


  // Validate date range against capacity
  const validateDateRangeCapacity = useCallback(async (
    stage: ProjectStatus,
    startDate: Date | null,
    endDate: Date | null
  ): Promise<{ valid: boolean; warnings: DateCapacityInfo[] }> => {
    if (!startDate || !endDate) {
      return { valid: true, warnings: [] };
    }

    const capacityStage = toCapacityStage(stage);
    const stageCapacities = dailyCapacities.get(capacityStage) || [];
    const capacityLot = capacityLots.find(lot => lot.stage === capacityStage);
    
    const maxCapacity = capacityLot?.capacity || 1;
    const maxHours = WORKING_HOURS_PER_DAY;
    
    const warnings: DateCapacityInfo[] = [];
    let hasOverCapacity = false;
    
    // Get all dates in range
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDateTime) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const capacityForDate = stageCapacities.find(
        cap => new Date(cap.date).toISOString().split('T')[0] === dateStr
      );
      
      const usedCapacity = capacityForDate?.usedCapacity || 0;
      const usedHours = capacityForDate?.usedHours || 0;
      const overCapacityUsed = capacityForDate?.overCapacityUsed || 0;
      const overHoursCapacityUsed = capacityForDate?.overHoursCapacityUsed || 0;
      
      const availableCapacity = maxCapacity - usedCapacity;
      const availableHours = maxHours - usedHours;
      
      const isOverCapacity = availableCapacity <= 0 || availableHours <= 0;
      if (isOverCapacity) {
        hasOverCapacity = true;
      }
      
      warnings.push({
        date: dateStr,
        usedCapacity,
        maxCapacity,
        usedHours,
        maxHours,
        overCapacityUsed,
        overHoursCapacityUsed,
        availableCapacity: Math.max(0, availableCapacity),
        availableHours: Math.max(0, availableHours),
        isOverCapacity
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      valid: !hasOverCapacity,
      warnings
    };
  }, [dailyCapacities, capacityLots]);

  // Validate dates when they change
  const validateAndShowWarnings = useCallback(async (
    stageId: string,
    stageType: ProjectStatus,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    if (!startDate || !endDate) {
      setDateValidationWarnings(prev => {
        const newMap = new Map(prev);
        newMap.delete(stageId);
        return newMap;
      });
      return true;
    }
    
    const { valid, warnings } = await validateDateRangeCapacity(stageType, startDate, endDate);
    
    if (warnings.length > 0) {
      setDateValidationWarnings(prev => {
        const newMap = new Map(prev);
        newMap.set(stageId, warnings);
        return newMap;
      });
      
      if (!valid) {
        const overCapacityDates = warnings.filter(w => w.isOverCapacity);
        if (overCapacityDates.length > 0) {
          toast.warning(`⚠️ Capacity warning for ${getStageDisplayName(stageType)}`, {
            description: `Dates with over-capacity: ${overCapacityDates.map(w => w.date).join(', ')}. The stage may still be scheduled but could cause delays.`,
            duration: 5000,
          });
        }
      }
    } else {
      setDateValidationWarnings(prev => {
        const newMap = new Map(prev);
        newMap.delete(stageId);
        return newMap;
      });
    }
    
    return valid;
  }, [validateDateRangeCapacity]);

  // Available stages for selection
  const availableStages = Object.values(ProjectStatus).map(status => ({
    value: status,
    label: getStageDisplayName(status),
  }));

  // Calculate stage progress
  const calculateStageProgress = (stage: StageFormData) => {
    if (!stage.workUnits || stage.workUnits === 0) return 0;
    const actualUnits = stage.actualWorkUnits || 0;
    return Math.round((actualUnits / stage.workUnits) * 100);
  };

  // Calculate efficiency (actual time vs planned time)
  const calculateEfficiency = (stage: StageFormData) => {
    if (!stage.timeTaken || !stage.capacityDays) return null;
    const plannedMinutes = stage.capacityDays * WORKING_HOURS_PER_DAY * 60;
    const efficiency = (plannedMinutes / stage.timeTaken) * 100;
    return Math.min(Math.round(efficiency), 200);
  };

  // Calculate capacity days from dates
  const calculateCapacityDays = (startDate: Date | null, endDate: Date | null): number => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  // Perform actual stage update
  const performStageUpdate = async (stage: StageFormData): Promise<boolean> => {
    if (!project?.id) {
      toast.error('Project ID not found');
      return false;
    }

    try {
      setSaving(true);
      const startDateTime = stage.startDate;
      
      const isTempStage = !stage.id || stage.isNew || stage.id.startsWith('temp-');
      
      // Prepare data based on whether it's a new stage or update
      const dataToSend: any = {
        projectId: project.id,
        stageName: stage.stage,
        allowOverCapacity: false,
        customDates: {
          startDate: startDateTime?.toISOString(),
        },
        timeTakenMinutes: Math.max(0, Math.round(stage.timeTaken || 0)),
        createManualWorkLog: true,
        manualOverride: true, // FORCE manual override to use custom dates
        isNewStage: isTempStage,
      };

      // Only include workUnits for NEW stages (create operation)
      if (isTempStage || stage.isNew) {
        dataToSend.newQuantity = stage.workUnits || 0;
      }

      await updateProjectStage(dataToSend);
      toast.success(stage.isNew ? 'Stage added successfully' : 'Stage updated successfully');

      await fetchProjectData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stage');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Handle stage update (used by both add and edit dialogs)
  const handleUpdateStage = async (stage: StageFormData): Promise<boolean> => {
    if (!canEdit) {
      toast.error('You do not have permission to edit stages');
      return false;
    }

    if (isStageFinished(stage)) {
      toast.error('Cannot edit a finished/completed stage');
      return false;
    }

    if (!stage.startDate) {
      toast.error('Please select a start date and time');
      return false;
    }

    const startDateTime = stage.startDate;

    if (!startDateTime || isNaN(startDateTime.getTime())) {
      toast.error('Invalid start date');
      return false;
    }

    if (stage.timeTaken === undefined || stage.timeTaken === null || stage.timeTaken < 0) {
      toast.error('Please enter valid time took');
      return false;
    }

    // Validate work units for new stages
    if (stage.isNew && (!stage.workUnits || stage.workUnits <= 0)) {
      toast.error('Please enter the number of work units for the new stage');
      return false;
    }

    const endDateTime = approximateEndDate(stage);

    // Validate capacity before updating
    const isValid = await validateAndShowWarnings(
      stage.id ?? 'new',
      stage.stage,
      stage.startDate,
      endDateTime
    );

    if (!isValid) {
      const confirmed = window.confirm(
        '⚠️ Warning: Some selected dates are at or over capacity.\n\n' +
        'The stage may experience delays or conflicts with existing work.\n\n' +
        'Do you want to proceed anyway?'
      );
      if (!confirmed) {
        return false;
      }
    }

    return performStageUpdate(stage);
  };

  // Open the dialog in add mode
  const openAddDialog = () => {
    if (!canEdit) {
      toast.error('You do not have permission to add stages');
      return;
    }
    setForm({ ...emptyStage, workUnits: 0 });
    setFormMode('add');
    setFormOpen(true);
  };

  // Open the dialog in edit mode for an existing stage
  const openEditDialog = (stage: StageFormData) => {
    if (!canEdit) {
      toast.info('You can only view stage information');
      return;
    }
    if (isStageFinished(stage)) {
      toast.error('Cannot edit a finished/completed stage');
      return;
    }
    // Remove workUnits from edit mode as they shouldn't be editable
    const { workUnits, ...stageWithoutWorkUnits } = stage;
    setForm({ ...stageWithoutWorkUnits, isNew: false });
    setFormMode('edit');
    setFormOpen(true);
  };

  // Update the dialog draft, recomputing derived end date / capacity days
  const updateForm = (patch: Partial<StageFormData>) => {
    setForm(prev => {
      const next = { ...prev, ...patch };
      next.endDate = approximateEndDate(next);
      next.capacityDays = calculateCapacityDays(next.startDate, next.endDate);
      return next;
    });
  };

  // Save the dialog (add or edit) to the backend
  const handleSaveForm = async () => {
    const draft: StageFormData =
      formMode === 'add'
        ? { ...form, id: `temp-${stages.length}-${form.stage}`, isNew: true }
        : form;
    const ok = await handleUpdateStage(draft);
    if (ok) setFormOpen(false);
  };

  // Handle delete stage - open confirmation dialog
  const handleDeleteClick = (stage: StageFormData) => {
    if (!canEdit) {
      toast.error('You do not have permission to remove stages');
      return;
    }

    if (isStageFinished(stage)) {
      toast.error('Cannot remove a finished/completed stage');
      return;
    }

    setStageToDelete(stage);
    setDeleteDownstream(false);
    setDeleteDialogOpen(true);
  };

  // Perform actual delete
  const performDelete = async () => {
    if (!project?.id || !stageToDelete) {
      toast.error('Missing project or stage information');
      return;
    }

    try {
      setDeleting(true);
      
      await deleteProjectStage({
        projectId: project.id,
        stageName: stageToDelete.stage,
        deleteDownstream: deleteDownstream,
      });

      toast.success(
        deleteDownstream
          ? `Stage ${getStageDisplayName(stageToDelete.stage)} and downstream stages deleted successfully`
          : `Stage ${getStageDisplayName(stageToDelete.stage)} deleted successfully`
      );

      // Remove validation warnings for this stage
      if (stageToDelete.id) {
        setDateValidationWarnings(prev => {
          const newMap = new Map(prev);
          newMap.delete(stageToDelete.id!);
          return newMap;
        });
      }

      // Refresh project data
      await fetchProjectData();
      
      // Close dialog
      setDeleteDialogOpen(false);
      setStageToDelete(null);
      setDeleteDownstream(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete stage');
    } finally {
      setDeleting(false);
    }
  };

  // Get existing stage values for filtering
  const existingStageValues = stages.map(stage => stage.stage);

  // Calculate totals
  const completedStages = stages.filter(s => s.status === StageStatus.COMPLETED || s.finished === true).length;
  const inProgressStages = stages.filter(s => s.status === StageStatus.IN_PROGRESS).length;
  const pendingStages = stages.filter(s => (!s.status || s.status !== StageStatus.COMPLETED) && !s.finished).length;
  const totalTimeLogged = stages.reduce((total, stage) => total + (stage.timeTaken || 0), 0);

  // Get downstream stages for the delete warning
  const getDownstreamStages = (stageId: string): string[] => {
    const stageIndex = stages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return [];
    return stages
      .slice(stageIndex + 1)
      .map(s => getStageDisplayName(s.stage));
  };

  // Render a single stage table row
  const renderStageRow = (
    stage: StageFormData,
    isFinished: boolean,
    efficiency: number | null,
    hasOverCapacity: boolean
  ) => {
    const progress = calculateStageProgress(stage);
    return (
      <TableRow
        key={stage.id}
        className={cn(
          'hover:bg-muted/20',
          isFinished && 'bg-muted/30',
          hasOverCapacity && !isFinished && 'border-l-2 border-l-yellow-500'
        )}
      >
        {/* Stage */}
        <TableCell className="py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{getStageDisplayName(stage.stage)}</span>
            {isFinished && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
            {hasOverCapacity && !isFinished && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
            )}
          </div>
        </TableCell>

        {/* Start */}
        <TableCell className="whitespace-nowrap py-1.5 text-xs tabular-nums">
          {safeFormatDateTime(stage.startDate)}
        </TableCell>

        {/* Calc. End */}
        <TableCell className="whitespace-nowrap py-1.5 text-xs tabular-nums text-muted-foreground">
          {safeFormatDateTime(approximateEndDate(stage) || stage.endDate)}
        </TableCell>

        {/* Time Took */}
        <TableCell className="whitespace-nowrap py-1.5 text-xs tabular-nums">
          {formatMinutes(stage.timeTaken)}
        </TableCell>

        {/* Progress */}
        <TableCell className="py-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">{progress}%</span>
          </div>
          {stage.actualWorkUnits !== undefined && stage.workUnits ? (
            <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
              {stage.actualWorkUnits} / {stage.workUnits} units
            </div>
          ) : null}
        </TableCell>

        {/* Efficiency */}
        <TableCell className="py-1.5">
          {efficiency ? (
            <Badge variant={efficiency >= 100 ? 'default' : 'destructive'} className="h-5 px-1.5 text-[10px] tabular-nums">
              {efficiency}%
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Status */}
        <TableCell className="py-1.5">
          <Badge
            variant={
              stage.status === StageStatus.COMPLETED || stage.finished
                ? 'default'
                : stage.status === StageStatus.IN_PROGRESS
                  ? 'secondary'
                  : 'outline'
            }
            className="h-5 px-1.5 text-[10px]"
          >
            {stage.status || (stage.finished ? 'COMPLETED' : 'PENDING')}
          </Badge>
        </TableCell>

        {/* Actions */}
        <TableCell className="py-1.5 text-right">
          <div className="flex justify-end gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEditDialog(stage)}
              disabled={isFinished || !canEdit}
              title={isFinished ? 'Finished stages cannot be edited' : 'Edit stage'}
              className="h-7 w-7"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            {canEdit && !isFinished && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDeleteClick(stage)}
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete stage"
                        disabled={(stage.actualWorkUnits ?? 0) > 0}

              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Shared form fields for the add/edit dialog
  const renderStageFormFields = () => {
    const isAddMode = formMode === 'add';
    
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Stage Type</Label>
          {formMode === 'edit' ? (
            <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium">
              {getStageDisplayName(form.stage)}
            </div>
          ) : (
            <Select value={form.stage} onValueChange={(value: ProjectStatus) => updateForm({ stage: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {availableStages
                  .filter((status) => !existingStageValues.includes(status.value))
                  .map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Work Units - ONLY shown in ADD mode */}
        {isAddMode && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Work Units <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="Enter number of work units"
              value={form.workUnits || ''}
              onChange={(e) => updateForm({ workUnits: parseInt(e.target.value, 10) || 0 })}
              className="h-9"
            />
            <p className="text-[10px] text-muted-foreground">
              The estimated amount of work required for this stage
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-9 w-full justify-start text-left text-xs font-normal',
                    !form.startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {form.startDate && !isNaN(form.startDate.getTime())
                      ? safeFormatDateTime(form.startDate)
                      : 'Pick date'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.startDate || undefined}
                  onSelect={(date) => updateForm({ startDate: withDatePart(form.startDate, date) })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Start Time</Label>
            <Input
              type="time"
              value={timeInputValue(form.startDate)}
              onChange={(e) => updateForm({ startDate: withTimePart(form.startDate, e.target.value) })}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Time Took</Label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              value={timeParts(form.timeTaken).hours}
              onChange={(e) =>
                updateForm({ timeTaken: (parseInt(e.target.value, 10) || 0) * 60 + timeParts(form.timeTaken).minutes })
              }
              className="h-9 w-16"
            />
            <span className="text-xs text-muted-foreground">hr</span>
            <Input
              type="number"
              min="0"
              max="59"
              value={timeParts(form.timeTaken).minutes}
              onChange={(e) =>
                updateForm({
                  timeTaken: timeParts(form.timeTaken).hours * 60 + Math.min(59, parseInt(e.target.value, 10) || 0),
                })
              }
              className="h-9 w-16"
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Calculated end</span>
          <span className="font-medium tabular-nums">{safeFormatDateTime(approximateEndDate(form))}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading project stages...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="mt-4 text-muted-foreground">Project not found</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canAddStage = canEdit && existingStageValues.length < availableStages.length;

const stagesTable = (
  <div className="overflow-x-auto rounded-md border">
    {/* Mobile card view - visible on small screens */}
    <div className="block sm:hidden divide-y divide-border">
      {stages.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No stages found for this project
        </div>
      ) : (
        stages.map((stage) => {
          const isFinished = isStageFinished(stage);
          const efficiency = calculateEfficiency(stage);
          const warnings = dateValidationWarnings.get(stage.id || '');
          const hasOverCapacity = warnings?.some((w) => w.isOverCapacity) || false;
          const progress = calculateStageProgress(stage);
          
          return (
            <div key={stage.id} className="p-3 space-y-2">
              {/* Stage header with status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {getStageDisplayName(stage.stage)}
                  </span>
                  {isFinished && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  {hasOverCapacity && !isFinished && (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                  )}
                </div>
                <Badge
                  variant={
                    stage.status === StageStatus.COMPLETED || stage.finished
                      ? 'default'
                      : stage.status === StageStatus.IN_PROGRESS
                        ? 'secondary'
                        : 'outline'
                  }
                  className="h-5 px-1.5 text-[10px] shrink-0"
                >
                  {stage.status || (stage.finished ? 'COMPLETED' : 'PENDING')}
                </Badge>
              </div>

              {/* Stage details grid */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Start:</span>
                  <span className="ml-1 font-mono text-[10px]">
                    {safeFormatDateTime(stage.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">End:</span>
                  <span className="ml-1 font-mono text-[10px]">
                    {safeFormatDateTime(approximateEndDate(stage) || stage.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="ml-1 font-mono text-[10px]">
                    {formatMinutes(stage.timeTaken)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Eff.:</span>
                  <span className="ml-1 font-mono text-[10px]">
                    {efficiency ? `${efficiency}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full bg-primary transition-all" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                    {progress}%
                  </span>
                </div>
                {stage.actualWorkUnits !== undefined && stage.workUnits ? (
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {stage.actualWorkUnits} / {stage.workUnits} units
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1 pt-1 border-t border-border/50">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(stage)}
                  disabled={isFinished || !canEdit}
                  title={isFinished ? 'Finished stages cannot be edited' : 'Edit stage'}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                {canEdit && !isFinished && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(stage)}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete stage"
                    disabled={(stage.actualWorkUnits ?? 0) > 0 }
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* Desktop table view - hidden on small screens */}
    <div className="hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="h-8 py-0 text-xs font-semibold">Stage</TableHead>
            <TableHead className="h-8 py-0 text-xs font-semibold">Start</TableHead>
            <TableHead className="h-8 py-0 text-xs font-semibold">Calc. End</TableHead>
            <TableHead className="h-8 py-0 text-xs font-semibold">Time</TableHead>
            <TableHead className="h-8 py-0 text-xs font-semibold">Progress</TableHead>
            <TableHead className="h-8 py-0 text-xs font-semibold">Eff.</TableHead>
            <TableHead className="h-8 py-0 text-xs font-semibold">Status</TableHead>
            <TableHead className="h-8 py-0 text-right text-xs font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No stages found for this project
              </TableCell>
            </TableRow>
          ) : (
            stages.map((stage) => {
              const isFinished = isStageFinished(stage);
              const efficiency = calculateEfficiency(stage);
              const warnings = dateValidationWarnings.get(stage.id || '');
              const hasOverCapacity = warnings?.some((w) => w.isOverCapacity) || false;

              return renderStageRow(stage, isFinished, efficiency, hasOverCapacity);
            })
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);

return (
  <div className={embedded ? 'min-w-0 space-y-3' : 'min-w-0 w-full space-y-3 p-2 sm:p-4'}>
    {!embedded && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-sm sm:text-base font-bold tracking-tight">Manage Project Stages</h1>
              <Badge variant="outline" className="h-5 shrink-0 text-[10px]">{getStageDisplayName(project.status)}</Badge>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" />
              <span className="truncate">Finished stages cannot be edited or removed</span>
            </p>
          </div>
        </div>
        {canAddStage && (
          <Button size="sm" variant="outline" className="h-7 shrink-0 gap-1.5 text-xs w-full sm:w-auto" onClick={openAddDialog}>
            <Plus className="h-3.5 w-3.5" /> Add Stage
          </Button>
        )}
      </div>
    )}

    {/* Stats strip - responsive grid */}
    {!embedded && (
      <div className="grid grid-cols-2 gap-2 xs:grid-cols-3 sm:grid-cols-5">
        {[
          { label: 'Total', value: stages.length },
          { label: 'Completed', value: completedStages, color: 'text-emerald-600' },
          { label: 'In Progress', value: inProgressStages, color: 'text-blue-600' },
          { label: 'Pending', value: pendingStages, color: 'text-amber-600' },
          { label: 'Time Logged', value: formatMinutes(totalTimeLogged) },
        ].map((stat: any) => (
          <div key={stat.label} className="rounded-md border bg-card px-2 py-1.5 sm:px-3">
            <p className="text-[8px] xs:text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {stat.label}
            </p>
            <p className={`mt-0.5 text-xs sm:text-sm font-bold tabular-nums ${stat.color || ''}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    )}

    {/* Stages Table */}
    {embedded ? (
      <>
        {canAddStage && (
          <div className="mb-2 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {stages.length} stage{stages.length !== 1 ? 's' : ''}
            </p>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs w-full xs:w-auto" onClick={openAddDialog}>
              <Plus className="h-3 w-3" /> Add Stage
            </Button>
          </div>
        )}
        {stagesTable}
      </>
    ) : (
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 px-3 py-2">
          <CardTitle className="text-xs font-semibold">Project Stages</CardTitle>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {stages.length} total
          </span>
        </CardHeader>
        <CardContent className="px-2 sm:px-3 pb-3">
          {stagesTable}
        </CardContent>
      </Card>
    )}

    {/* Add / Edit Stage Dialog */}
    <Dialog open={formOpen} onOpenChange={setFormOpen}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base">
            {formMode === 'add' ? 'Add New Stage' : `Edit ${getStageDisplayName(form.stage)}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {formMode === 'add'
              ? 'Enter the stage details and estimated work units.'
              : 'Update the schedule and logged time. Work units cannot be modified after creation.'}
          </DialogDescription>
        </DialogHeader>
        {renderStageFormFields()}
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => setFormOpen(false)} disabled={saving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveForm} disabled={saving || !form.startDate || !form.stage || (formMode === 'add' && (!form.workUnits || form.workUnits <= 0))} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : formMode === 'add' ? (
              <Plus className="mr-1.5 h-4 w-4" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {formMode === 'add' ? 'Add Stage' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Stage Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm sm:text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            Delete Stage
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs space-y-2">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {stageToDelete ? getStageDisplayName(stageToDelete.stage) : ''}
              </span>
              ?
            </p>
            
            {stageToDelete && getDownstreamStages(stageToDelete.id || '').length > 0 && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                      Warning: This stage has downstream stages
                    </p>
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-400/80 wrap-break-word">
                      Deleting this stage will affect:{' '}
                      {getDownstreamStages(stageToDelete.id || '').join(', ')}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="deleteDownstream"
                        checked={deleteDownstream}
                        onChange={(e) => setDeleteDownstream(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                      />
                      <label htmlFor="deleteDownstream" className="text-[10px] font-medium text-yellow-800 dark:text-yellow-300">
                        Also delete all downstream stages
                      </label>
                    </div>
                    <p className="mt-1 text-[10px] text-yellow-600 dark:text-yellow-400/70">
                      {deleteDownstream
                        ? 'All stages after this one will be permanently removed.'
                        : 'Downstream stages will be rescheduled to fill the gap.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stageToDelete && getDownstreamStages(stageToDelete.id || '').length === 0 && (
              <p className="text-[10px] text-muted-foreground">
                This action cannot be undone. The stage will be permanently removed along with all its capacity allocations.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={performDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Stage'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Action Buttons */}
    {!embedded && (
      <div className="flex flex-col-reverse xs:flex-row justify-end gap-2 border-t pt-3">
        <Button variant="outline" size="sm" className="h-7 text-xs w-full xs:w-auto" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button size="sm" className="h-7 text-xs w-full xs:w-auto" variant="secondary" onClick={fetchProjectData}>
          Refresh
        </Button>
      </div>
    )}
  </div>
);
};

export default ProjectStageUpdatePage;