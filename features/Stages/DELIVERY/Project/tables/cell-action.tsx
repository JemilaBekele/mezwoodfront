/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  IconEdit,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconPlus,
} from '@tabler/icons-react';

import { IProject, IProjectStage, ProjectStatus } from '@/models/Projects';
import { createProjectStageWorkLog } from '@/service/projectStageWorkLogService';
import { toast } from 'sonner';
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
import { Loader2, Package, Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ProjectCellActionProps {
  data: IProject;
  onRefresh?: () => void;
}

type InputType = 'units' | 'percentage';

// Helper to get the DELIVERY Works stage
function getMetalWorksStage(project: IProject): IProjectStage | undefined {
  return project.stages?.find(
    (stage: IProjectStage) => stage.stage === ProjectStatus.DELIVERY
  );
}

// Calculate units from percentage
function calculateUnitsFromPercentage(stage: IProjectStage, percentage: number): number {
  const plannedUnits = stage.workUnits || stage.capacityDays || 0;
  return (percentage / 100) * plannedUnits;
}

export const ProjectCellAction: React.FC<ProjectCellActionProps> = ({
  data,
  onRefresh,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  
  // Form state
  const [inputType, setInputType] = useState<InputType>('units');
  const [doneUnits, setDoneUnits] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [hours, setHours] = useState<string>('');

  const stage = getMetalWorksStage(data);
  const plannedUnits = stage?.workUnits || stage?.capacityDays || 0;
  const actualUnits = stage?.actualWorkUnits || 0;
  const remainingUnits = Math.max(0, plannedUnits - actualUnits);
  const remainingPercentage = plannedUnits > 0 ? (remainingUnits / plannedUnits) * 100 : 0;
  const isCompleted = remainingUnits <= 0.000001;

  const resetForm = () => {
    setInputType('units');
    setDoneUnits('');
    setPercentage('');
    setNote('');
    setHours('');
  };

  const handleAddWorkLog = async () => {
    if (!stage) {
      toast.error('No DELIVERY Works stage found for this project');
      return;
    }

    let doneUnitsValue: number;
    let enteredPercentage: number | null = null;

    if (remainingUnits <= 0.000001) {
      toast.info('Stage is already completed');
      setShowAddDialog(false);
      return;
    }

    if (inputType === 'percentage') {
      const percentageValue = Number(percentage);
      if (isNaN(percentageValue) || percentageValue <= 0 || percentageValue > 100) {
        toast.error('Please enter a valid percentage between 1 and 100');
        return;
      }
      
      enteredPercentage = percentageValue;
      doneUnitsValue = calculateUnitsFromPercentage(stage, percentageValue);
      
      // Validate percentage doesn't exceed remaining
      const maxAllowedPercentage = (remainingUnits / plannedUnits) * 100;
      if (percentageValue > maxAllowedPercentage + 0.01) {
        toast.error(`Cannot add ${percentageValue}%. Only ${maxAllowedPercentage.toFixed(2)}% (${remainingUnits.toFixed(4)} units) remaining.`);
        return;
      }
      
      // If the percentage would slightly exceed remaining, adjust to exactly match remaining
      if (percentageValue > maxAllowedPercentage && percentageValue <= maxAllowedPercentage + 0.01) {
        doneUnitsValue = remainingUnits;
        enteredPercentage = (remainingUnits / plannedUnits) * 100;
      }
    } else {
      if (!doneUnits) {
        toast.error('Please enter done units');
        return;
      }
      doneUnitsValue = Number(doneUnits);
      if (isNaN(doneUnitsValue) || doneUnitsValue <= 0) {
        toast.error('Done units must be a positive number');
        return;
      }
      
      // Validate units don't exceed remaining
      if (doneUnitsValue > remainingUnits + 0.000001) {
        toast.error(`Cannot add ${doneUnitsValue.toFixed(4)} units. Only ${remainingUnits.toFixed(4)} units remaining.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Store the entered percentage in the note
      let finalNote = note || '';
      if (enteredPercentage !== null) {
        finalNote = finalNote ? `${finalNote} [Percentage: ${enteredPercentage}%]` : `[Percentage: ${enteredPercentage}%]`;
      }
      
      // Optional hours worked for this entry
      const parsedHours = hours ? Number(hours) : undefined;

      await createProjectStageWorkLog({
        projectStageId: stage.id,
        doneUnits: doneUnitsValue,
        note: finalNote,
        ...(parsedHours !== undefined && !isNaN(parsedHours) ? { hours: parsedHours } : {}),
      });

      const percentageAdded = (doneUnitsValue / plannedUnits) * 100;
      const successMessage = enteredPercentage !== null 
        ? `Work log added successfully! Added ${enteredPercentage.toFixed(2)}% (${doneUnitsValue.toFixed(4)} units)`
        : `Work log added successfully! Added ${doneUnitsValue.toFixed(4)} units (${percentageAdded.toFixed(2)}%)`;
      
      toast.success(successMessage);
      
      resetForm();
      setShowAddDialog(false);
      
      // Refresh the data
      if (onRefresh) {
        onRefresh();
      }
      
      router.refresh();
    } catch (error: any) {
      console.error('Error adding work log:', error);
      toast.error(error.response?.data?.message || 'Failed to add work log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteAll = async () => {
    if (!stage) {
      toast.error('No DELIVERY Works stage found for this project');
      return;
    }

    if (remainingUnits <= 0.000001) {
      toast.info('Stage is already completed');
      setShowCompleteDialog(false);
      return;
    }

    setIsCompletingAll(true);
    try {
      await createProjectStageWorkLog({
        projectStageId: stage.id,
        doneUnits: remainingUnits,
        note: `Complete all remaining units (${remainingUnits.toFixed(4)} units)`,
      });

      toast.success(`Successfully completed all remaining units (${remainingUnits.toFixed(4)} units)`);
      setShowCompleteDialog(false);
      
      if (onRefresh) {
        onRefresh();
      }
      
      router.refresh();
    } catch (error: any) {
      console.error('Error completing all units:', error);
      toast.error(error.response?.data?.message || 'Failed to complete all units');
    } finally {
      setIsCompletingAll(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/Stage/delivery/view?id=${data.id}`)
            }
          >
            <IconEdit className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {stage && !isCompleted && (
            <>
              <DropdownMenuItem
                onClick={() => setShowAddDialog(true)}
                className="text-blue-600 focus:text-blue-600"
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Work Log
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowCompleteDialog(true)}
                className="text-green-600 focus:text-green-600"
              >
                <IconCheck className="mr-2 h-4 w-4" />
                Complete All Units ({remainingUnits.toFixed(2)} remaining)
              </DropdownMenuItem>
            </>
          )}

          {stage && isCompleted && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              <IconCheck className="mr-2 h-4 w-4" />
              Already Completed
            </DropdownMenuItem>
          )}

          {!stage && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              <IconX className="mr-2 h-4 w-4" />
              No DELIVERY Works Stage
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Work Log Dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        setShowAddDialog(open);
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Work Log</AlertDialogTitle>
            <AlertDialogDescription>
              Add a new work log entry for {data.invoice?.piNumber || 'this project'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Project Info Summary */}
            <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project:</span>
                <span className="font-medium">{data.invoice?.piNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{data.customer?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-orange-600">
                  {remainingUnits.toFixed(4)} units ({remainingPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Input Type Toggle */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Input Method
              </Label>
              <ToggleGroup
                type="single"
                value={inputType}
                onValueChange={(value) => {
                  if (value === 'units' || value === 'percentage') {
                    setInputType(value);
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="units" aria-label="Units">
                  <Package className="h-4 w-4 mr-2" />
                  Units
                </ToggleGroupItem>
                <ToggleGroupItem value="percentage" aria-label="Percentage">
                  <Percent className="h-4 w-4 mr-2" />
                  Percentage
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Units Input */}
            {inputType === 'units' && (
              <div>
                <Label htmlFor="doneUnits" className="text-sm font-medium">
                  Done Units *
                </Label>
                <Input
                  id="doneUnits"
                  type="number"
                  step="0.01"
                  placeholder="Enter number of units completed"
                  value={doneUnits}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const numValue = Number(value);
                      if (numValue > remainingUnits + 0.000001) {
                        toast.error(`Maximum ${remainingUnits.toFixed(4)} units remaining.`);
                        return;
                      }
                    }
                    setDoneUnits(value);
                  }}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Remaining: {remainingUnits.toFixed(4)} units ({remainingPercentage.toFixed(2)}%)
                </p>
              </div>
            )}

            {/* Percentage Input */}
            {inputType === 'percentage' && (
              <div>
                <Label htmlFor="percentage" className="text-sm font-medium">
                  Percentage Complete (%) *
                </Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  placeholder="Enter percentage completed (e.g., 25.5)"
                  value={percentage}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const numValue = Number(value);
                      if (numValue > remainingPercentage + 0.01) {
                        toast.error(`Maximum ${remainingPercentage.toFixed(2)}% remaining.`);
                        return;
                      }
                    }
                    setPercentage(value);
                  }}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will add {percentage ? 
                    calculateUnitsFromPercentage(stage!, Number(percentage)).toFixed(4) : 0} units
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Remaining: {remainingPercentage.toFixed(2)}%
                </p>
              </div>
            )}

         

            {/* Note Input */}
            <div>
              <Label htmlFor="note" className="text-sm font-medium">
                Note (Optional)
              </Label>
              <Textarea
                id="note"
                placeholder="Add any remarks or notes about this work log..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddWorkLog}
              disabled={isSubmitting || 
                (inputType === 'units' ? !doneUnits : !percentage) ||
                remainingUnits <= 0.000001
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Work Log
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete All Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete All Remaining Units</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to complete all remaining work units for this project&apos;s DELIVERY Works stage?
              <div className="mt-4 p-4 bg-muted rounded-md space-y-2">
               
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{data.customer?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining Units:</span>
                  <span className="font-medium text-orange-600">{remainingUnits.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Planned Units:</span>
                  <span className="font-medium">{plannedUnits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Progress:</span>
                  <span className="font-medium text-blue-600">
                    {plannedUnits > 0 ? ((actualUnits / plannedUnits) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress After:</span>
                  <span className="font-medium text-green-600">100%</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-red-600">
                This action cannot be undone. All remaining units will be marked as completed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteAll}
              className="bg-green-600 hover:bg-green-700"
              disabled={isCompletingAll}
            >
              {isCompletingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Complete All Units
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};