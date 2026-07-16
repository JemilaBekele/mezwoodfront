/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateEth, formatTimeEth, formatTimeGregorian } from '@/lib/format';
import { toast } from 'sonner';
import {
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
  Package2,
  CheckCircle,
  CalendarDays,
  User,
  Award,
  BarChart3,
  Layers,
  Package,
  Wrench,
  Timer,
  Lock,
  History,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IProject, ProjectStatus, DifficultyLevel, StageStatus, WorkShift, ScheduleMode, IScheduleHistory } from '@/models/Projects';
import { getProjectId, setProjectScheduleMode, getProjectScheduleHistory } from '@/service/Project';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Define the variant type to match your Badge component
type BadgeVariant = "link" | "secondary" | "default" | "outline" | "ghost" | "destructive" | null | undefined;

type ProjectDetailProps = {
  id?: string;
};

// Helper function to format minutes to readable time
const formatMinutes = (minutes?: number) => {
  if (!minutes && minutes !== 0) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

// Helper function to calculate stage progress
const calculateStageProgress = (stage: any) => {
  if (!stage.workUnits || stage.workUnits === 0) return 0;
  const actualUnits = stage.actualWorkUnits || 0;
  return Math.round((actualUnits / stage.workUnits) * 100);
};

const ProjectDetailPage: React.FC<ProjectDetailProps> = ({ id }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<IScheduleHistory[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [modeBusy, setModeBusy] = useState(false);
  const router = useRouter();

  // Fetch project data function - moved outside useEffect
 const fetchProjectData = useCallback(async () => {
  try {
    if (id) {
      const projectData = await getProjectId(id);
      setProject(projectData);
    }
  } catch (error: any) {
    toast.error('Failed to fetch project details');
    console.error('Error fetching project:', error);
  } finally {
    setLoading(false);
  }
}, [id]);

  // Change AUTO/MANUAL/LOCKED schedule mode, then refresh.
  const changeScheduleMode = useCallback(
    async (mode: ScheduleMode) => {
      if (!id) return;
      setModeBusy(true);
      try {
        await setProjectScheduleMode(id, mode);
        toast.success(`Schedule mode set to ${mode}`);
        await fetchProjectData();
      } catch (e: any) {
        toast.error(e.message || 'Failed to change schedule mode');
      } finally {
        setModeBusy(false);
      }
    },
    [id, fetchProjectData],
  );

  // Load the schedule/delivery audit trail.
  const loadHistory = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getProjectScheduleHistory(id);
      setHistory(res.history || []);
      setHistoryOpen(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load schedule history');
    }
  }, [id]);

  // Fetch project data on mount and when id changes
  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData, id]);

  // Status badge configuration - with proper typing
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

  // Stage status badge configuration
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


/** Render a date cell with both Gregorian and Ethiopian on separate lines. */
const DualDate: React.FC<{ date?: string | Date | null; className?: string }> = ({ date, className }) => {
  if (!date) return <span className={className ?? 'text-xs'}>—</span>;
  const ethDate = formatDateEth(date);
  return (
    <div className="flex flex-col">
      <span className={className ?? 'text-xs'}>{formatDate(date)}</span>
      {ethDate && <span className="text-[10px] text-muted-foreground italic">{ethDate}</span>}
    </div>
  );
};

/** Render a time with both Gregorian (AM/PM) and Ethiopian local time. */
const DualTime: React.FC<{ date?: string | Date | null }> = ({ date }) => {
  if (!date) return null;
  const ethTime = formatTimeEth(date);
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground">{formatTimeGregorian(date)}</span>
      {ethTime && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{ethTime}</span>}
    </div>
  );
};
  // Difficulty badge configuration - with proper typing
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

  // Calculate project progress based on stage completion
  const calculateProjectProgress = () => {
    if (!project?.stages || project.stages.length === 0) return 0;
    
    const completedStages = project.stages.filter(stage => 
      stage.status === StageStatus.COMPLETED
    ).length;
    
    return Math.round((completedStages / project.stages.length) * 100);
  };

  // Calculate overall work progress
  const calculateWorkProgress = () => {
    if (!project?.stages || project.stages.length === 0) return 0;
    
    let totalWorkUnits = 0;
    let totalActualWorkUnits = 0;
    
    project.stages.forEach(stage => {
      totalWorkUnits += stage.workUnits || 0;
      totalActualWorkUnits += stage.actualWorkUnits || 0;
    });
    
    if (totalWorkUnits === 0) return 0;
    return Math.round((totalActualWorkUnits / totalWorkUnits) * 100);
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return '₦0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!project?.calculatedDelivery) return null;
    
    const today = new Date();
    const deliveryDate = new Date(project.calculatedDelivery);
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

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

  const statusConfig = getStatusConfig(project.status);
  const difficultyConfig = getDifficultyConfig(project.difficulty);
  const progress = calculateProjectProgress();
  const workProgress = calculateWorkProgress();
  const daysRemaining = calculateDaysRemaining();
  const hasStages = project.stages && project.stages.length > 0;

  return (
    <div className="mx-auto w-full space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.push('/dashboard/Project')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">
                {project.invoice?.piNumber || `Project #${project.id.substring(0, 8)}`}
              </h2>
              <Badge variant={statusConfig.variant as any} className="text-[10px] h-5">
                <statusConfig.icon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">{difficultyConfig.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {project.customer?.name || 'No customer'} · {formatDate(project.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasStages && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => router.push(`/dashboard/Project/gantt?id=${project.id}`)}>
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Gantt</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => router.push(`/dashboard/Project/${project.id}`)}>
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {[
          { label: 'Duration', value: `${project.totalDays || 0}d`, sub: daysRemaining !== null ? `${daysRemaining} left` : undefined, subWarn: daysRemaining !== null && daysRemaining < 7 },
          { label: 'Progress', value: `${progress}%`, progress: true },
          { label: 'Work', value: `${project.stages?.reduce((s, st) => s + (st.actualWorkUnits || 0), 0) || 0}/${project.stages?.reduce((s, st) => s + (st.workUnits || 0), 0) || 0}` },
          { label: 'Stages', value: `${project.stages?.filter(s => s.status === StageStatus.COMPLETED).length || 0}/${project.stages?.length || 0}` },
          { label: 'Work %', value: `${workProgress}%`, workProgress: true },
          { label: 'Difficulty', value: difficultyConfig.label, icon: difficultyConfig.icon, iconColor: difficultyConfig.color },
        ].map((stat: any) => (
          <div key={stat.label} className="rounded-lg border bg-card px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <div className="mt-1 flex items-center gap-1">
              {stat.icon && <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />}
              <span className="text-sm font-bold tabular-nums">{stat.value}</span>
            </div>
            {stat.progress && (
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            {stat.workProgress && (
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${workProgress}%` }} />
              </div>
            )}
            {stat.sub && (
              <p className={`text-[10px] ${stat.subWarn ? 'text-amber-500' : 'text-muted-foreground'}`}>{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Detail Panels ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Customer & Invoice */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Customer & Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.customer ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {project.customer.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{project.customer.name || 'N/A'}</p>
                  {project.customer.companyName && (
                    <p className="truncate text-xs text-muted-foreground">{project.customer.companyName}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No customer assigned</p>
            )}
            {project.invoice && (
              <div className="space-y-1.5 rounded-md bg-muted/40 p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-mono font-medium">{project.invoice.piNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold tabular-nums text-primary">{formatCurrency(project.invoice.total)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-bold tabular-nums text-amber-600">{formatCurrency(project.invoice.balance)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline / Delivery */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {/* Operative date — precedence: Final > Manual > Calculated. This is
                the date that actually governs the project. */}
            {(() => {
              const operative = project.finalDelivery
                ? { label: 'Final', value: project.finalDelivery }
                : project.manualDelivery
                ? { label: 'Manual', value: project.manualDelivery }
                : project.calculatedDelivery
                ? { label: 'Calculated', value: project.calculatedDelivery }
                : null;
              return (
                <div className="flex items-center justify-between rounded-md bg-primary/5 px-2 py-1.5 text-xs">
                  <span className="font-medium text-primary">
                    Operative{operative ? ` (${operative.label})` : ''}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {operative ? formatDate(operative.value) : 'Pending'}
                    </span>
                    {operative && (
                      <p className="text-[10px] text-muted-foreground italic">{formatDateEth(operative.value)}</p>
                    )}
                  </div>
                </div>
              );
            })()}
            {[
              { label: 'Requested', value: project.requestedDelivery ? formatDate(project.requestedDelivery) : 'Not set', ethValue: project.requestedDelivery ? formatDateEth(project.requestedDelivery) : '', note: 'customer ask' },
              { label: 'Calculated', value: project.calculatedDelivery ? formatDate(project.calculatedDelivery) : 'Pending', ethValue: project.calculatedDelivery ? formatDateEth(project.calculatedDelivery) : '', note: 'auto-scheduled' },
              ...(project.manualDelivery ? [{ label: 'Manual', value: formatDate(project.manualDelivery), ethValue: formatDateEth(project.manualDelivery), note: 'override' }] : []),
              ...(project.finalDelivery ? [{ label: 'Final', value: formatDate(project.finalDelivery), ethValue: formatDateEth(project.finalDelivery), note: 'committed' }] : []),
              { label: 'Created', value: formatDate(project.createdAt), ethValue: formatDateEth(project.createdAt), note: '' },
              { label: 'Updated', value: formatDate(project.updatedAt), ethValue: formatDateEth(project.updatedAt), note: '' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {row.label}
                  {row.note ? <span className="ml-1 text-[10px] opacity-60">· {row.note}</span> : null}
                </span>
                <div className="text-right">
                  <span className="font-medium">{row.value}</span>
                  {row.ethValue && <p className="text-[10px] text-muted-foreground italic">{row.ethValue}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Schedule mode + audit trail */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Schedule Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Current</span>
              <Badge
                variant={
                  project.scheduleMode === ScheduleMode.LOCKED
                    ? 'destructive'
                    : project.scheduleMode === ScheduleMode.MANUAL
                    ? 'outline'
                    : 'default'
                }
              >
                {project.scheduleMode || 'AUTO'}
              </Badge>
            </div>
            <div className="flex gap-1.5">
              {[ScheduleMode.AUTO, ScheduleMode.MANUAL, ScheduleMode.LOCKED].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={(project.scheduleMode || ScheduleMode.AUTO) === m ? 'default' : 'outline'}
                  disabled={modeBusy || (project.scheduleMode || ScheduleMode.AUTO) === m}
                  onClick={() => changeScheduleMode(m)}
                  className="flex-1 text-[11px]"
                >
                  {m === ScheduleMode.AUTO ? 'Auto' : m === ScheduleMode.MANUAL ? 'Manual' : 'Lock'}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              LOCKED keeps automatic jobs away from a confirmed date. MANUAL stops the nightly
              refresh but still allows explicit edits.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-[11px]"
              onClick={loadHistory}
            >
              <History className="mr-1 h-3 w-3" />
              {historyOpen ? 'Refresh history' : 'Show schedule history'}
            </Button>
            {historyOpen && (
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">No history yet.</p>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="rounded border border-border/50 px-2 py-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {h.event}
                          {h.stage ? ` · ${h.stage}` : ''}
                        </span>
                        <span className="opacity-60">{formatDate(h.createdAt)}</span>
                      </div>
                      {h.reason ? <p className="opacity-70">{h.reason}</p> : null}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personnel */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { label: 'Created By', person: project.createdBy },
              { label: 'Updated By', person: project.updatedBy },
              { label: 'Prepared By', person: project.invoice?.preparedBy },
              { label: 'Approved By', person: project.invoice?.approvedBy },
            ].filter(item => item.person).map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold uppercase">
                  {item.person?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{item.person?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <Tabs defaultValue="stages" className="space-y-3">
        <TabsList className="h-8 w-full justify-start gap-0 rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="stages" className="h-8 gap-1.5 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Package2 className="h-3.5 w-3.5" />
            Stages
          </TabsTrigger>
          <TabsTrigger value="timeline" className="h-8 gap-1.5 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <CalendarDays className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="invoice" className="h-8 gap-1.5 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <FileText className="h-3.5 w-3.5" />
            Invoice
          </TabsTrigger>
        </TabsList>

        {/* ── Timeline Tab ──────────────────────────────── */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Project Timeline
              </CardTitle>
              {hasStages && (
                <p className="text-xs text-muted-foreground">{project.stages!.length} stages</p>
              )}
            </CardHeader>
            <CardContent>
              {hasStages ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {[
                      { label: 'Total', value: project.stages!.length, color: '' },
                      { label: 'Completed', value: project.stages!.filter(s => s.status === StageStatus.COMPLETED).length, color: 'text-emerald-600' },
                      { label: 'In Progress', value: project.stages!.filter(s => s.status === StageStatus.IN_PROGRESS).length, color: 'text-amber-600' },
                      { label: 'Active', value: project.stages!.filter(s => s.status === StageStatus.ACTIVE).length, color: 'text-blue-600' },
                      { label: 'Days', value: project.stages!.reduce((t, s) => t + s.capacityDays, 0), color: '' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border bg-muted/20 p-3 text-center">
                        <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Vertical Step Tracker */}
                  <div className="relative pl-8">
                    {/* Vertical line */}
                    <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />

                    {project.stages!.map((stage, index) => {
                      const stageConfig = getStatusConfig(stage.stage);
                      const stageStatusConfig = getStageStatusConfig(stage.status);
                      const isCompleted = stage.status === StageStatus.COMPLETED;
                      const isActive = stage.status === StageStatus.ACTIVE || stage.status === StageStatus.IN_PROGRESS;
                      const stageProgress = calculateStageProgress(stage);
                      const isLast = index === project.stages!.length - 1;

                      return (
                        <div key={stage.id} className={`relative flex gap-4 ${!isLast ? 'pb-8' : ''}`}>
                          {/* Step indicator */}
                          <div className="absolute -left-8 flex h-8 w-8 shrink-0 items-center justify-center">
                            <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                              isCompleted
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : isActive
                                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                                : 'border-muted bg-background text-muted-foreground'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <span className="text-[10px] font-bold">{index + 1}</span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className={`flex-1 rounded-lg border p-4 transition-colors ${
                            isActive ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800/40 dark:bg-blue-950/20' : ''
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <stageConfig.icon className={`h-4 w-4 shrink-0 ${stageConfig.color}`} />
                                  <h4 className="font-semibold truncate">{stageConfig.label}</h4>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span>{stage.capacityDays} day{stage.capacityDays !== 1 ? 's' : ''}</span>
                                  {stage.startDate && stage.endDate && (
                                    <div className="flex flex-col">
                                      <span>{formatDate(stage.startDate)} → {formatDate(stage.endDate)}</span>
                                      <span className="text-[10px] italic">{formatDateEth(stage.startDate)} → {formatDateEth(stage.endDate)}</span>
                                    </div>
                                  )}
                                  {stage.timeTaken !== undefined && stage.timeTaken !== null && (
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-3 w-3" />
                                      {formatMinutes(stage.timeTaken)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge variant={stageStatusConfig.variant as any} className="shrink-0 text-[11px]">
                                {stageStatusConfig.label}
                              </Badge>
                            </div>

                            {/* Progress bar */}
                            {stage.workUnits && stage.workUnits > 0 && (
                              <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground">{(stage.actualWorkUnits || 0)}/{stage.workUnits} units</span>
                                  <span className="font-semibold">{stageProgress}%</span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${stageProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                    <CalendarDays className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">No timeline stages</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Stages will appear here once created</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Stages Tab ───────────────────────────────── */}
        <TabsContent value="stages">
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
              {hasStages && (
                <Button
                  onClick={() => router.push(`/dashboard/Project/stage?id=${project.id}`)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Manage
                </Button>
              )}
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
                            {/* variant types from getStageStatusConfig may include values not in Badge's strict union; cast to any */}
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
                              default: return 'N/A';
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

        {/* ── Invoice Tab ──────────────────────────────── */}
        <TabsContent value="invoice">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Associated Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.invoice ? (
                <div className="space-y-6">
                  {/* Invoice Summary */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                    {/* Left: Details */}
                    <div className="md:col-span-3 space-y-3">
                      {[
                        { label: 'Invoice #', value: project.invoice.piNumber || 'N/A', mono: true },
                        { label: 'Status', value: project.invoice.status, badge: true },
                        { label: 'Subtotal', value: formatCurrency(project.invoice.subtotal) },
                        { label: 'VAT (16%)', value: formatCurrency(project.invoice.vat) },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between rounded-md bg-muted/40 px-3.5 py-2.5">
                          <span className="text-xs text-muted-foreground">{row.label}</span>
                          {row.badge ? (
                            <Badge variant="outline" className="text-[11px]">{row.value}</Badge>
                          ) : (
                            <span className={`text-sm font-medium tabular-nums ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Right: Payment Overview */}
                    <div className="md:col-span-2 flex flex-col justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Total</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{formatCurrency(project.invoice.total)}</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-600 font-medium">Paid</span>
                          <span className="font-bold tabular-nums text-emerald-600">{formatCurrency(project.invoice.amountPaid)}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${project.invoice.total > 0 ? (project.invoice.amountPaid / project.invoice.total) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-600 font-medium">Balance</span>
                          <span className="font-bold tabular-nums text-amber-600">{formatCurrency(project.invoice.balance)}</span>
                        </div>
                      </div>
                      {project.invoice.amountDate && (
                        <p className="mt-3 text-[11px] text-muted-foreground">Last payment: {formatDate(project.invoice.amountDate)}</p>
                      )}
                    </div>
                  </div>

                  {/* Line Items */}
                  {project.invoice.items && project.invoice.items.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Line Items ({project.invoice.items.length})
                      </h4>
                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                                                          <TableHead className="font-semibold">Item</TableHead>

                              <TableHead className="font-semibold text-right">Qty</TableHead>
                              <TableHead className="font-semibold text-right">Unit Price</TableHead>
                              <TableHead className="font-semibold text-right">Amount</TableHead>

                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {project.invoice.items.slice(0, 5).map((item, index) => (
                              <TableRow key={index} className="hover:bg-muted/20">
                               <TableCell className="">{item.item?.name}</TableCell>
                               <TableCell className="text-right tabular-nums text-sm">{item.quantity}</TableCell>
                               <TableCell className="text-right tabular-nums text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                               <TableCell className="text-right tabular-nums text-sm font-medium">{formatCurrency(item.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {project.invoice.items.length > 5 && (
                          <div className="border-t bg-muted/10 px-4 py-2.5 text-center">
                            <p className="text-xs text-muted-foreground">
                              Showing 5 of {project.invoice.items.length} items
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                    <FileText className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">No invoice linked</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Invoice details will appear once associated</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
 
    </div>
  );
};

export default ProjectDetailPage;