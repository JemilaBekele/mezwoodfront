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
} from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel, IProjectStage, DesignStatus, IProjectLog } from '@/models/Projects';
import { getProjectId } from '@/service/Project';
import { Separator } from '@/components/ui/separator';
import { IProformaInvoice, IProformaInvoiceItem, IProformaInvoiceItemImage, IProformaItemMaterial, IProformaInvoiceBank } from '@/models/ProformaInvoice';
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
  // Remove any leading slashes to prevent double slashes in URL
  const cleanPath = normalizedPath.replace(/^\/+/, '');
  return `${BACKEND_URL}/${cleanPath}`;
};

// Define the variant type to match your Badge component
type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

type ProjectDetailProps = {
  id?: string;
};

const DesignProjectDetailPage: React.FC<ProjectDetailProps> = ({ id }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [proformaInvoice, setProformaInvoice] = useState<IProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Filter stages to only show DESIGN stage
  const getDesignStages = (stages?: IProjectStage[]) => {
    if (!stages) return [];
    return stages.filter(stage => stage.stage === ProjectStatus.DESIGN);
  };

  // Get design status configuration - NOW INCLUDING INITIATED
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
            // Don't show error to user, just log it
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

  // Status badge configuration - simplified for design team
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

  // Filtered stages for display
  const designStages = getDesignStages(project?.stages);
  const hasDesignStage = designStages.length > 0;
  const groupedLogs = getGroupedLogs(project?.projectLogs);
  const hasLogs = project?.projectLogs && project.projectLogs.length > 0;
  
  // Get project status config for design stage
  const projectStatusConfig = project ? getStatusConfig(project.status) : null;
  const difficultyConfig = project ? getDifficultyConfig(project.difficulty) : null;
  const designStatusConfig = project?.designStatus ? getDesignStatusConfig(project.designStatus) : null;

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
                  
                  return (
                    <div key={stage.id} className="space-y-6">
                      {/* Stage Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-100' : 
                            isActive ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {stageConfig && <stageConfig.icon className={`h-6 w-6 ${stageConfig.color}`} />}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{stageConfig?.label || 'Design'}</h3>
                            <p className="text-sm text-muted-foreground">Stage ID: {stage.id.substring(0, 8)}</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            isCompleted
                              ? 'default'
                              : isActive
                              ? 'outline'
                              : 'secondary'
                          }
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
                                <span className="font-semibold">{stage.workUnits || 0}</span>
                              </div>
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

    

        {/* Proforma Invoice Card - With Images */}
        {proformaInvoice && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Proforma Invoice Information
              </CardTitle>
              {/* Update Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/Stage/Design/${proformaInvoice.id}`)
                }
              >
                Update PI
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
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

              {/* Tabs for organizing content */}
              <Tabs defaultValue="items" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>

                {/* Items Tab */}
                <TabsContent value="items" className="space-y-4 mt-4">
                  {proformaInvoice.items && proformaInvoice.items.length > 0 ? (
                    <div className="space-y-4">
                      {/* Mobile View */}
                      <div className="space-y-4 md:hidden">
                        {proformaInvoice.items.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-base">{item.description}</h4>
                                {item.size && item.size !== "" && (
                                  <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                                )}
                                {item.additionalDescription && item.additionalDescription !== "" && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.additionalDescription}</p>
                                )}
                              </div>
                              <Badge variant="outline">Qty: {item.quantity}</Badge>
                            </div>

                            {/* Item Images Preview */}
                            {item.images && item.images.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-muted-foreground mb-2">Item Images:</p>
                                <div className="flex gap-2 flex-wrap">
                                  {item.images.slice(0, 3).map((img) => (
                                    <div key={img.id} className="relative w-16 h-16 rounded-md overflow-hidden border">
                                      <Image
                                        src={normalizeImagePath(img.imageUrl) || '/placeholder-image.jpg'}
                                        alt="Item"
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ))}
                                  {item.images.length > 3 && (
                                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                      <Plus className="h-4 w-4" />
                                      <span className="text-xs">+{item.images.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Materials Count */}
                            {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {item.proformaItemMaterials.length} material(s) • {getItemMaterialsTotal(item)} total units
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
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
                                    {item.additionalDescription && item.additionalDescription !== "" && (
                                      <p className="text-xs text-muted-foreground">
                                        {item.additionalDescription}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{item.size && item.size !== "" ? item.size : 'N/A'}</TableCell>
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
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">No items found</p>
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
                              <h4 className="font-semibold">{item.description}</h4>
                              {item.size && item.size !== "" && (
                                <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                              )}
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
                                      <TableCell>
                                        {material.material?.color || 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {material.material?.size || 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{material.quantity} units</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{material?.additionalQuantity || 0} units</Badge>
                                      </TableCell>
                                      <TableCell>
                                        {material.note && material.note !== "" ? (
                                          <p className="text-sm line-clamp-2">{material.note}</p>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">No note</span>
                                        )}
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

                {/* Images Tab - New Tab for Item Images */}
                <TabsContent value="images" className="space-y-4 mt-4">
                  {proformaInvoice.items && proformaInvoice.items.some(item => item.images && item.images.length > 0) ? (
                    <div className="space-y-6">
                      {proformaInvoice.items.map((item) => {
                        if (!item.images || item.images.length === 0) return null;
                        
                        return (
                          <div key={item.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 p-3 border-b">
                              <h4 className="font-semibold">{item.description}</h4>
                              {item.size && item.size !== "" && (
                                <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                              )}
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

                {/* Attachments Tab */}
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

        {/* Customer Information Card - Limited View */}
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

        {/* Project Timeline Summary - Limited View */}
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

export default DesignProjectDetailPage;