/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Box,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel, IProjectStage } from '@/models/Projects';
import { getProjectId } from '@/service/Project';
import { Separator } from '@/components/ui/separator';
import { IProformaInvoice, IProformaItemMaterial, MaterialIssueStatus } from '@/models/ProformaInvoice';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getMaterialStockById } from '@/service/StockCorrection';
import { updateProformaMaterialStatus } from '@/service/material';
import { getAllEmploy } from '@/service/employee';
import { Input } from '@/components/ui/input';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

// Helper function for image URLs


type BadgeVariant = "link" | "secondary" | "default" | "outline" | "ghost" | "destructive" | null | undefined;

type ProjectDetailProps = {
  id?: string;
};

// Interface for stock data from API
interface MaterialStockData {
  materialId: string;
  materialName: string;
  totalQuantity: number;
}

interface MaterialStockInfo {
  [key: string]: {
    available: number;
    loading: boolean;
    error?: string;
  };
}

// Interface for user data
interface UserData {
  id: string;
  name: string;
  email: string;
}

// Interface for items that need to be purchased
interface PurchaseNeededItem {
  materialId: string;
  materialName: string;
  color: string;
  size: string;
  requiredQuantity: number;
  alreadyIssued: number;
  remainingNeeded: number;
  availableStock: number;
  shortfall: number;
  unit: string;
  itemDescription: string;
}

const PurchaseProjectDetailPage: React.FC<ProjectDetailProps> = ({ id }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [proformaInvoice, setProformaInvoice] = useState<IProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // State for material stock information
  const [materialStockInfo, setMaterialStockInfo] = useState<MaterialStockInfo>({});
  
  // State for material issue dialog
  const [selectedMaterial, setSelectedMaterial] = useState<IProformaItemMaterial | null>(null);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stockData, setStockData] = useState<MaterialStockData | null>(null);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  
  // New state for partial issuance
  const [givenQuantity, setGivenQuantity] = useState<number>(0);
  const [additionalQuantity, setAdditionalQuantity] = useState<number>(0);
  const [issueType, setIssueType] = useState<'full' | 'partial'>('full');

  // State for purchase needed items
  const [purchaseNeededItems, setPurchaseNeededItems] = useState<PurchaseNeededItem[]>([]);
  const [loadingPurchaseNeeded, setLoadingPurchaseNeeded] = useState(false);

  // Fetch users for givenTo dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getAllEmploy();
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  // Calculate items that need to be purchased based on stock availability - FIXED to include additional quantity
  const calculatePurchaseNeededItems = useCallback(async (materials: IProformaItemMaterial[]) => {
    if (!materials || materials.length === 0) return;

    setLoadingPurchaseNeeded(true);
    const neededItems: PurchaseNeededItem[] = [];

    for (const material of materials) {
      try {
        // Get stock data for this material
        const stockData = await getMaterialStockById(material.materialId);
        const availableStock = stockData?.totalQuantity || 0;
        
        const alreadyIssued = material.givenquantity || 0;
        // FIX: Total required = quantity + additionalQuantity
        const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
        const remainingNeeded = totalRequired - alreadyIssued;
        
        // Calculate shortfall (if stock is less than remaining needed)
        const shortfall = remainingNeeded > availableStock ? remainingNeeded - availableStock : 0;
        
        // Only add to purchase list if there's a shortfall
        if (shortfall > 0) {
          neededItems.push({
            materialId: material.materialId,
            materialName: material.material?.name || 'Unknown Material',
            color: material.material?.color || '',
            size: material.material?.size || '',
            requiredQuantity: totalRequired,
            alreadyIssued: alreadyIssued,
            remainingNeeded: remainingNeeded,
            availableStock: availableStock,
            shortfall: shortfall,
            unit: 'units',
            itemDescription: material.note || ''
          });
        }
      } catch (error) {
        console.error(`Error fetching stock for material ${material.materialId}:`, error);
      }
    }

    setPurchaseNeededItems(neededItems);
    setLoadingPurchaseNeeded(false);
  }, []);

  // Fetch stock for all materials
  const fetchStockForMaterials = useCallback(async (materials: IProformaItemMaterial[]) => {
    if (!materials || materials.length === 0) return;

    const stockPromises = materials.map(async (material) => {
      if (!material.materialId) return;

      const materialKey = material.id;
      
      // Skip if already loading or if we already have stock info
      if (materialStockInfo[materialKey]?.loading || materialStockInfo[materialKey]?.available !== undefined) return;

      // Set loading state
      setMaterialStockInfo(prev => ({
        ...prev,
        [materialKey]: { available: 0, loading: true }
      }));

      try {
        const stockData = await getMaterialStockById(material.materialId);
        
        setMaterialStockInfo(prev => ({
          ...prev,
          [materialKey]: { 
            available: stockData?.totalQuantity || 0, 
            loading: false 
          }
        }));
      } catch (error) {
        console.error('Error fetching stock:', error);
        setMaterialStockInfo(prev => ({
          ...prev,
          [materialKey]: { 
            available: 0, 
            loading: false,
            error: 'Failed to load stock'
          }
        }));
      }
    });

    await Promise.all(stockPromises);
  }, [materialStockInfo]);

  // Filter stages to only show PURCHASING stage
  const getPurchasingStages = (stages?: IProjectStage[]) => {
    if (!stages) return [];
    return stages.filter(stage => stage.stage === ProjectStatus.PURCHASING);
  };

  // Get purchasing status configuration
  const getPurchasingStatusConfig = () => {
    return {
      label: 'Purchasing Stage',
      variant: 'outline' as BadgeVariant,
      icon: ShoppingCart,
      color: 'text-purple-500',
      description: 'Procurement and material sourcing in progress',
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
            
            // Collect all materials from the invoice
            const allMaterials: IProformaItemMaterial[] = [];
            invoice.items?.forEach(item => {
              if (item.proformaItemMaterials && item.proformaItemMaterials.length > 0) {
                allMaterials.push(...item.proformaItemMaterials);
              }
            });
            
            // Fetch stock for all materials
            if (allMaterials.length > 0) {
              await fetchStockForMaterials(allMaterials);
              // Calculate purchase needed items
              await calculatePurchaseNeededItems(allMaterials);
            }
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
  }, [id, fetchStockForMaterials, calculatePurchaseNeededItems]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Handle material issue button click - Check stock first
  const handleIssueMaterialClick = async (material: IProformaItemMaterial) => {
    setSelectedMaterial(material);
    setIsCheckingStock(true);
    setIsIssueDialogOpen(true);
    // Reset form values
    setIssueType('full');
    setGivenQuantity(0);
    setAdditionalQuantity(0);
    setSelectedUserId('');

    try {
      const stock = await getMaterialStockById(material.materialId);
      setStockData(stock);
      
      const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
      const availableQuantity = stock?.totalQuantity || 0;
      if (availableQuantity < totalRequired) {
        toast.error(`Insufficient stock! Available: ${availableQuantity}, Required: ${totalRequired}`);
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      toast.error('Failed to check stock availability');
    } finally {
      setIsCheckingStock(false);
    }
  };

  // Handle confirm issue
  const handleConfirmIssue = async () => {
    if (!selectedMaterial || !selectedUserId) {
      toast.error('Please select a user to issue the material to');
      return;
    }

    const totalRequired = (selectedMaterial.quantity || 0) + (selectedMaterial.additionalQuantity || 0);
    const alreadyIssued = selectedMaterial.givenquantity || 0;
    const remainingNeeded = totalRequired - alreadyIssued;

    let totalGiven = 0;
    let status = MaterialIssueStatus.ISSUED;
    let givenQty = 0;
    let additionalQty = 0;

    if (issueType === 'full') {
      // Full issuance - issue all remaining needed
      totalGiven = remainingNeeded;
      givenQty = remainingNeeded;
      status = MaterialIssueStatus.ISSUED;
    } else {
      // Partial issuance
      totalGiven = givenQuantity + additionalQuantity;
      
      if (totalGiven <= 0) {
        toast.error('Please enter a valid quantity to issue');
        return;
      }
      
      if (totalGiven > remainingNeeded) {
        toast.error(`Total quantity (${totalGiven}) cannot exceed remaining needed (${remainingNeeded})`);
        return;
      }
      
      givenQty = givenQuantity;
      additionalQty = additionalQuantity;
      status = totalGiven >= remainingNeeded ? MaterialIssueStatus.ISSUED : MaterialIssueStatus.PARTIALLY;
    }

    // Check if stock is sufficient
    if (stockData && totalGiven > stockData.totalQuantity) {
      toast.error(`Insufficient stock! Available: ${stockData.totalQuantity}, Required: ${totalGiven}`);
      return;
    }

    setIsProcessing(true);
    try {
      await updateProformaMaterialStatus(
        selectedMaterial.id,
        status,
        selectedUserId,
        givenQty,
        additionalQty
      );
      
      const successMessage = status === MaterialIssueStatus.PARTIALLY 
        ? `Material partially issued successfully. Total given: ${totalGiven} units`
        : `Material issued successfully. Total given: ${totalGiven} units`;
      toast.success(successMessage);
      setIsIssueDialogOpen(false);
      setSelectedMaterial(null);
      setSelectedUserId('');
      setStockData(null);
      setGivenQuantity(0);
      setAdditionalQuantity(0);
      
      // Refresh the project data to update UI
      await fetchProjectData();
    } catch (error: any) {
      console.error('Error issuing material:', error);
      toast.error(error?.response?.data?.message || 'Failed to issue material');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel material
  const handleCancelMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to cancel this material issue?')) {
      return;
    }

    setIsProcessing(true);
    try {
      await updateProformaMaterialStatus(
        materialId,
        MaterialIssueStatus.CANCELLED
      );
      
      toast.success('Material cancelled successfully');
      await fetchProjectData();
    } catch (error: any) {
      console.error('Error cancelling material:', error);
      toast.error(error?.response?.data?.message || 'Failed to cancel material');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status badge for material
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

  // Get stock display for material - FIXED to include additional quantity
  const getStockDisplay = (material: IProformaItemMaterial) => {
    const stockInfo = materialStockInfo[material.id];
    
    if (!stockInfo) {
      return <span className="text-xs text-muted-foreground">Loading...</span>;
    }
    
    if (stockInfo.loading) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }
    
    if (stockInfo.error) {
      return <span className="text-xs text-red-500">Error</span>;
    }
    
    // FIX: Total required = quantity + additionalQuantity
    const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
    const alreadyIssued = material.givenquantity || 0;
    const remainingNeeded = totalRequired - alreadyIssued;
    const isSufficient = stockInfo.available >= remainingNeeded;
    
    return (
      <div className="space-y-1">
        <span className={`text-xs font-medium ${isSufficient ? 'text-green-600' : 'text-red-600'}`}>
          {stockInfo.available} units available
        </span>
      </div>
    );
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

  const purchasingStages = getPurchasingStages(project?.stages);
  const hasPurchasingStage = purchasingStages.length > 0;
  
  const projectStatusConfig = project ? getStatusConfig(project.status) : null;
  const difficultyConfig = project ? getDifficultyConfig(project.difficulty) : null;
  const purchasingStatusConfig = getPurchasingStatusConfig();

  // Calculate total shortfall
  const totalShortfall = purchaseNeededItems.reduce((sum, item) => sum + item.shortfall, 0);
  const hasItemsToPurchase = purchaseNeededItems.length > 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading purchasing project details...</p>
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
      {/* ========== SECTION 1: ITEMS NEED TO PURCHASE - SIMPLE LIST ========== */}
    {/* ========== SECTION 1: ITEMS NEED TO PURCHASE - ONLY SHOW IF ITEMS EXIST ========== */}
{hasItemsToPurchase && (
  <Card className="border-2 border-red-200 shadow-lg dark:border-red-800">
    <CardHeader className="bg-red-50 border-b border-red-200 dark:bg-red-950 dark:border-red-800">
      <CardTitle className="flex items-center gap-2 text-2xl font-bold text-red-700 dark:text-red-400">
        <ShoppingCart className="h-6 w-6" />
        ITEMS NEED TO PURCHASE
        <Badge variant="destructive" className="ml-2">
          {purchaseNeededItems.length} item(s)
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">
      {loadingPurchaseNeeded ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <p>Checking stock levels...</p>
        </div>
      ) : (
        <>
          {/* Summary Banner */}
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 border-l-4 border-yellow-500 dark:bg-yellow-950 dark:border-yellow-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                Need to purchase {purchaseNeededItems.length} item(s) - Total Quantity: {totalShortfall} units
              </span>
            </div>
          </div>

          {/* Simple Purchase List Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800">
                  <TableHead className="font-bold">Material Name</TableHead>
                  <TableHead className="font-bold">Color</TableHead>
                  <TableHead className="font-bold">Size</TableHead>
                  <TableHead className="font-bold text-right">Required</TableHead>
                  <TableHead className="font-bold text-right">Issued</TableHead>
                  <TableHead className="font-bold text-right">Remaining</TableHead>
                  <TableHead className="font-bold text-right">Stock Available</TableHead>
                  <TableHead className="font-bold text-right">TO BUY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseNeededItems.map((item, index) => (
                  <TableRow key={index} className="hover:bg-red-50 dark:hover:bg-red-950/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-red-500 dark:text-red-400" />
                        {item.materialName}
                      </div>
                    </TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell className="text-right">{item.requiredQuantity}</TableCell>
                    <TableCell className="text-right">{item.alreadyIssued}</TableCell>
                    <TableCell className="text-right text-orange-600 dark:text-orange-400 font-medium">
                      {item.remainingNeeded}
                    </TableCell>
                    <TableCell className="text-right text-blue-600 dark:text-blue-400">
                      {item.availableStock}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="text-base px-3 py-1">
                        {item.shortfall}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </CardContent>
  </Card>
)}

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <purchasingStatusConfig.icon className={`h-4 w-4 ${purchasingStatusConfig.color}`} />
              <span>Purchasing Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={purchasingStatusConfig.variant} className="px-3 py-1 text-sm">
                {purchasingStatusConfig.label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {purchasingStatusConfig.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Purchasing Stage Card */}
        <Card className="border-purple-200 shadow-md">
          <CardHeader className="bg-purple-50 border-b border-purple-100">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <span className="text-purple-900">Purchasing Stage Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {hasPurchasingStage ? (
              <div className="space-y-6">
                {purchasingStages.map((stage) => {
                  const stageConfig = getStatusConfig(stage.stage);
                  const isActive = stage.status === 'ACTIVE' || stage.status === 'IN_PROGRESS';
                  const isCompleted = stage.status === 'COMPLETED';
                  
                  return (
                    <div key={stage.id} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-100' : 
                            isActive ? 'bg-purple-100' : 'bg-gray-100'
                          }`}>
                            {stageConfig && <stageConfig.icon className={`h-6 w-6 ${stageConfig.color}`} />}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{stageConfig?.label || 'Purchasing'}</h3>
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
                            isActive ? 'border-purple-500 text-purple-700' : ''
                          }`}
                        >
                          {isCompleted ? 'Completed' : 
                           isActive ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No purchasing stage information available for this project</p>
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

              <Tabs defaultValue="materials" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="materials">Materials & Stock Management</TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-4 mt-4">
                  {proformaInvoice.items && proformaInvoice.items.length > 0 ? (
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Items</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Materials</TableHead>
                            <TableHead>Description</TableHead>

                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proformaInvoice.items.map((item) => (
                            <TableRow key={item.id}>
                                                         <TableCell>{item.item?.name || ''}</TableCell>

                              <TableCell>{item.size || ''}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
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
                              <h4 className="font-semibold">{item.item?.name || ''}</h4>
              {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
            </div>
            <div className="p-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Required Qty</TableHead>
                    <TableHead>Additional Qty</TableHead>
                    <TableHead>Issued Qty</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Available Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue History</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.proformaItemMaterials.map((material) => {
                    const stockInfo = materialStockInfo[material.id];
                    const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
                    const givenQuantity = material.givenquantity || 0;
                    const remainingNeeded = totalRequired - givenQuantity;
                    
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <p className="font-medium">{material.material?.name || ''}</p>
                        </TableCell>
                        <TableCell>{material.material?.color || ''}</TableCell>
                        <TableCell>{material.material?.size || ''}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{material.quantity} units</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{material?.additionalQuantity || 0} units</Badge>
                        </TableCell>
                        <TableCell>
                          {givenQuantity > 0 ? (
                            <span className="text-sm font-medium text-green-600">
                              {givenQuantity} units
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${remainingNeeded > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {remainingNeeded} units
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStockDisplay(material)}
                        </TableCell>
                        <TableCell>
                          {getMaterialStatusBadge(material.status)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2 min-w-50">
                            {material.materialIssues && material.materialIssues.length > 0 ? (
                              material.materialIssues.map((issue, idx) => (
                                <div key={issue.id} className="text-xs border-b pb-1 last:border-0">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-blue-500" />
                                    <span className="font-medium">{issue.issuedBy?.name || 'Unknown'}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="font-medium">{issue.givenTo?.name || ''}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {issue.quantity} units
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {new Date(issue.issuedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {issue.note && (
                                    <p className="text-muted-foreground mt-1 truncate max-w-50">
                                      {issue.note}
                                    </p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No issues recorded</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                                  <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.ISSUE_STOCK_MATERIALS.name}>

                          <div className="flex gap-2">
                            {(
                              material.status === MaterialIssueStatus.PENDING ||
                              material.status === MaterialIssueStatus.PARTIALLY ||
                              (
                                material.status === MaterialIssueStatus.ISSUED &&
                                (material.givenquantity || 0) < 
                                ((material.quantity || 0) + (material.additionalQuantity || 0))
                              )
                            ) && (
                              <Button
                                size="sm"
                                onClick={() => handleIssueMaterialClick(material)}
                                className="gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {material.status === MaterialIssueStatus.PARTIALLY || material.status === MaterialIssueStatus.ISSUED
                                  ? 'Issue More'
                                  : 'Issue'}
                              </Button>
                            )}
                          </div>
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Material Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Material</DialogTitle>
            <DialogDescription>
              Review stock availability and assign material to a worker.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Material Details</Label>
              <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Material:</span> {selectedMaterial?.material?.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Required Quantity:</span> {(selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)} units
                </p>
                <p className="text-sm">
                  <span className="font-medium">Base Quantity:</span> {selectedMaterial?.quantity || 0} units
                </p>
                <p className="text-sm">
                  <span className="font-medium">Additional Quantity:</span> {selectedMaterial?.additionalQuantity || 0} units
                </p>
                {(selectedMaterial?.givenquantity || 0) > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Already Issued:</span> {selectedMaterial?.givenquantity} units
                  </p>
                )}
                {selectedMaterial?.material?.color && (
                  <p className="text-sm">
                    <span className="font-medium">Color:</span> {selectedMaterial.material.color}
                  </p>
                )}
                {selectedMaterial?.material?.size && (
                  <p className="text-sm">
                    <span className="font-medium">Size:</span> {selectedMaterial.material.size}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issue Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="full"
                    checked={issueType === 'full'}
                    onChange={(e) => setIssueType(e.target.value as 'full' | 'partial')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Full Issue</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="partial"
                    checked={issueType === 'partial'}
                    onChange={(e) => setIssueType(e.target.value as 'full' | 'partial')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Partial Issue</span>
                </label>
              </div>
            </div>

            {issueType === 'partial' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="givenQuantity">Given Quantity *</Label>
                  <Input
                    id="givenQuantity"
                    type="number"
                    min={0}
                    value={givenQuantity}
                    onChange={(e) => setGivenQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity to issue"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Total to Issue:</p>
                  <p className="text-lg font-bold text-blue-600">
                    {givenQuantity + additionalQuantity} units
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Stock Availability</Label>
              {isCheckingStock ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Checking stock...</span>
                </div>
              ) : stockData ? (
                <div className={`p-3 rounded-lg border ${
                  stockData.totalQuantity >= (issueType === 'full' 
                    ? ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)
                    : givenQuantity + additionalQuantity)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available Stock:</span>
                    <span className={`text-lg font-bold ${
                      stockData.totalQuantity >= (issueType === 'full'
                        ? ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)
                        : givenQuantity + additionalQuantity)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {stockData.totalQuantity} units
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <p className="text-sm text-yellow-600">Unable to fetch stock information</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Assign To (Worker/Department) *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user to assign material" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsIssueDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmIssue}
              disabled={
                isProcessing ||
                !selectedUserId ||
                !stockData ||
                (issueType === 'partial' && (givenQuantity + additionalQuantity) <= 0) ||
                (issueType === 'full' && ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0) - (selectedMaterial?.givenquantity || 0)) <= 0) ||
                (issueType === 'full' 
                  ? ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)
                  : givenQuantity + additionalQuantity) > (stockData?.totalQuantity || 0)
              }
              className="gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseProjectDetailPage;