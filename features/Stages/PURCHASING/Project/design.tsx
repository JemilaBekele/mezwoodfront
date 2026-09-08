/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Calendar,
  Users,
  FileText,
  Loader2,
  TrendingUp,
  CalendarDays,
  User,
  BarChart3,
  Layers,
  Package,
  Box,
  ShoppingCart,
  AlertCircle,
  Eye,
  X,
  Image as ImageIcon,
  ChevronRight,
  CheckCircle,
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
import { normalizeImagePath } from '@/lib/norm';
import Image from 'next/image';
import { getStatusConfig } from '../../unifay';
import { Textarea } from '@/components/ui/textarea';

// Skeleton Loader Component
const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
);

const SkeletonTable = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 mb-3">
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
);

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
  imageUrl?: string;
}

const PurchaseProjectDetailPage: React.FC<ProjectDetailProps> = ({ id }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [proformaInvoice, setProformaInvoice] = useState<IProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);

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
  
  // State for image preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // State for issuance
  const [givenQuantity, setGivenQuantity] = useState<number>(0);
  const [issueType, setIssueType] = useState<'full' | 'partial'>('full');
  const [issueNote, setIssueNote] = useState<string>('');

  // State for purchase needed items
  const [purchaseNeededItems, setPurchaseNeededItems] = useState<PurchaseNeededItem[]>([]);
  const [loadingPurchaseNeeded, setLoadingPurchaseNeeded] = useState(false);

  // Function to handle image preview
  const handleImageClick = (imageUrl: string, name: string) => {
    setPreviewImage({ url: imageUrl, name });
    setIsPreviewOpen(true);
  };

  // Function to close image preview
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewImage(null);
  };

  // Helper function to get material image with fallback
  const getMaterialImage = (material: IProformaItemMaterial) => {
    if (material.material?.imageUrl) {
      return normalizeImagePath(material.material.imageUrl);
    }
    return null;
  };

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

  // Calculate items that need to be purchased based on stock availability
  const calculatePurchaseNeededItems = useCallback(async (materials: IProformaItemMaterial[]) => {
    if (!materials || materials.length === 0) return;

    setLoadingPurchaseNeeded(true);
    const neededItems: PurchaseNeededItem[] = [];

    for (const material of materials) {
      try {
        const stockData = await getMaterialStockById(material.materialId);
        const availableStock = stockData?.totalQuantity || 0;
        
        const alreadyIssued = material.givenquantity || 0;
        const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
        const remainingNeeded = totalRequired - alreadyIssued;
        const shortfall = remainingNeeded > availableStock ? remainingNeeded - availableStock : 0;
        
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
            itemDescription: material.note || '',
            imageUrl: material.material?.imageUrl || '',
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
      
      if (materialStockInfo[materialKey]?.loading || materialStockInfo[materialKey]?.available !== undefined) return;

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
        console.log(projectData)
        setProject(projectData);

        if (projectData.invoice?.id) {
          try {
            const invoice = await getProformaInvoiceById(projectData.invoice.id);
            setProformaInvoice(invoice);
            
            const allMaterials: IProformaItemMaterial[] = [];
            invoice.items?.forEach(item => {
              if (item.proformaItemMaterials && item.proformaItemMaterials.length > 0) {
                allMaterials.push(...item.proformaItemMaterials);
              }
            });
            
            if (allMaterials.length > 0) {
              await fetchStockForMaterials(allMaterials);
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

  // Handle material issue button click
  const handleIssueMaterialClick = async (material: IProformaItemMaterial) => {
    setSelectedMaterial(material);
    setIsCheckingStock(true);
    setIsIssueDialogOpen(true);
    setIssueType('full');
    setGivenQuantity(0);
    setSelectedUserId('');
    setIssueNote('');

    try {
      const stock = await getMaterialStockById(material.materialId);
      setStockData(stock);
      
      const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
      const alreadyIssued = material.givenquantity || 0;
      const remainingNeeded = totalRequired - alreadyIssued;
      const availableQuantity = stock?.totalQuantity || 0;
      
      if (availableQuantity < remainingNeeded) {
        toast.warning(`Low stock! Available: ${availableQuantity}, Remaining needed: ${remainingNeeded}`);
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      toast.error('Failed to check stock availability');
    } finally {
      setIsCheckingStock(false);
    }
  };

  // Handle confirm issue - UPDATED to match API signature
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

    if (issueType === 'full') {
      totalGiven = remainingNeeded;
      status = MaterialIssueStatus.ISSUED;
    } else {
      totalGiven = givenQuantity;
      
      if (totalGiven <= 0) {
        toast.error('Please enter a valid quantity to issue');
        return;
      }
      
      if (totalGiven > remainingNeeded) {
        toast.error(`Quantity (${totalGiven}) cannot exceed remaining needed (${remainingNeeded})`);
        return;
      }
      
      status = totalGiven >= remainingNeeded ? MaterialIssueStatus.ISSUED : MaterialIssueStatus.PARTIALLY;
    }

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
        totalGiven,
        undefined,
      );
      
      toast.success(`Material issued successfully. Total given: ${totalGiven} units`);
      setIsIssueDialogOpen(false);
      setSelectedMaterial(null);
      setSelectedUserId('');
      setStockData(null);
      setGivenQuantity(0);
      setIssueNote('');
      
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
        MaterialIssueStatus.CANCELLED,
        undefined,
        0,
        undefined,
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
        return <Badge className="bg-green-500 text-white">Fully Issued</Badge>;
      case MaterialIssueStatus.PARTIALLY:
        return <Badge className="bg-yellow-500 text-white">Partially Issued</Badge>;
      case MaterialIssueStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case MaterialIssueStatus.PENDING:
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Get stock display for material
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
    
    const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
    const alreadyIssued = material.givenquantity || 0;
    const remainingNeeded = totalRequired - alreadyIssued;
    const isSufficient = stockInfo.available >= remainingNeeded;
    
    return (
      <div className="space-y-1">
        <span className={`text-xs font-medium ${isSufficient ? 'text-green-600' : 'text-red-600'}`}>
          {stockInfo.available} units available
        </span>
        {!isSufficient && (
          <span className="text-xs text-red-500 block">
            Shortfall: {remainingNeeded - stockInfo.available} units
          </span>
        )}
      </div>
    );
  };

  // Check if all materials are issued
  const areAllMaterialsIssued = useCallback(() => {
    if (!proformaInvoice?.items) return false;
    
    const allMaterials: IProformaItemMaterial[] = [];
    proformaInvoice.items.forEach(item => {
      if (item.proformaItemMaterials) {
        allMaterials.push(...item.proformaItemMaterials);
      }
    });
    
    if (allMaterials.length === 0) return true;
    
    for (const material of allMaterials) {
      const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
      const alreadyIssued = material.givenquantity || 0;
      
      if (alreadyIssued < totalRequired) {
        return false;
      }
    }
    
    return true;
  }, [proformaInvoice]);

  // Calculate issuance progress
  const getIssuanceProgress = useCallback(() => {
    if (!proformaInvoice?.items) return { total: 0, issued: 0, percentage: 0 };
    
    const allMaterials: IProformaItemMaterial[] = [];
    proformaInvoice.items.forEach(item => {
      if (item.proformaItemMaterials) {
        allMaterials.push(...item.proformaItemMaterials);
      }
    });
    
    if (allMaterials.length === 0) return { total: 0, issued: 0, percentage: 100 };
    
    let totalRequired = 0;
    let totalIssued = 0;
    
    for (const material of allMaterials) {
      totalRequired += (material.quantity || 0) + (material.additionalQuantity || 0);
      totalIssued += material.givenquantity || 0;
    }
    
    return {
      total: totalRequired,
      issued: totalIssued,
      percentage: totalRequired > 0 ? Math.round((totalIssued / totalRequired) * 100) : 100
    };
  }, [proformaInvoice]);

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

  const hasItemsToPurchase = purchaseNeededItems.length > 0;
  const allIssued = areAllMaterialsIssued();
  const progress = getIssuanceProgress();

  // Show loading state with skeleton
  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-96" />
        <SkeletonTable />
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
    <div className="space-y-6 p-4">
      {/* ========== SECTION 1: ITEMS NEED TO PURCHASE ========== */}
      {hasItemsToPurchase && (
        <Card className="border-2 border-red-200 shadow-lg dark:border-red-800">
          <CardHeader className="bg-red-50 border-b border-red-200 dark:bg-red-950 dark:border-red-800">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-red-700 dark:text-red-400">
              <ShoppingCart className="h-6 w-6" />
              ITEMS NEED TO PURCHASE
              <Badge variant="destructive" className="ml-2">
                {purchaseNeededItems.length} material(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 overflow-visible">
            {loadingPurchaseNeeded ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>Checking stock levels...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-lg bg-yellow-50 p-4 border-l-4 border-yellow-500 dark:bg-yellow-950 dark:border-yellow-600">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                      Need to purchase {purchaseNeededItems.length} material type(s)
                    </span>
                    <Badge variant="destructive" className="ml-2">
                      Total: {purchaseNeededItems.reduce((sum, item) => sum + (item.shortfall || 0), 0)} units
                    </Badge>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 dark:bg-gray-800">
                        <TableHead className="font-bold">Image</TableHead>
                        <TableHead className="font-bold">Material Name</TableHead>
                        <TableHead className="font-bold">Color</TableHead>
                        <TableHead className="font-bold">Size</TableHead>
                        <TableHead className="font-bold text-right">Required</TableHead>
                        <TableHead className="font-bold text-right">Issued</TableHead>
                        <TableHead className="font-bold text-right">Remaining</TableHead>
                        <TableHead className="font-bold text-right">Stock</TableHead>
                        <TableHead className="font-bold text-right">TO BUY</TableHead>
                        <TableHead className="font-bold text-center">Used In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseNeededItems.map((item, index) => {
                        const imageUrl = item.imageUrl ? normalizeImagePath(item.imageUrl) : null;
                        
                        return (
                          <TableRow key={index} className="hover:bg-red-50 dark:hover:bg-red-950/50">
                            <TableCell>
                              {imageUrl ? (
                                <div className="relative group">
                                  <div className="relative h-16 w-16 rounded overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0">
                                    <Image
                                      src={imageUrl}
                                      alt="Material"
                                      fill
                                      className="object-cover"
                                      sizes="64px"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md border-2 border-white dark:border-gray-800 p-0 z-10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageClick(imageUrl, item.materialName);
                                    }}
                                    title="Preview image"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-red-500 dark:text-red-400" />
                                {item.materialName}
                              </div>
                            </TableCell>
                            <TableCell>{item.color}</TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.requiredQuantity}
                            </TableCell>
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
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[9px]">
                                {item.itemDescription || 'N/A'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== SECTION 2: MATERIAL ISSUANCE PROGRESS ========== */}
      <Card className="border-2 border-green-200 shadow-lg dark:border-green-800">
        <CardHeader className="bg-green-50 border-b border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-700 dark:text-green-400">
            <CheckCircle className="h-6 w-6" />
            Material Issuance Status
            <Badge className={allIssued ? 'bg-green-500' : 'bg-yellow-500'} variant="default">
              {allIssued ? 'All Issued ✓' : 'Pending Issuance'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Issuance Progress</span>
              <span className="text-sm font-bold">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {progress.issued} units issued
              </span>
              <span className="text-xs text-muted-foreground">
                {progress.total} units total
              </span>
            </div>
          </div>

          {/* Materials List with Issue Buttons */}
          <div className="space-y-4">
            {proformaInvoice?.items?.map((item) => {
              if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return null;
              
              return (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b">
                    <h4 className="font-semibold text-sm flex items-center justify-between">
                      <span>
                        {item?.item?.name || item?.itemname || item?.category?.name || 'Unnamed Item'}
                        {item.size && item.size !== "" && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Size: {item.size}
                          </Badge>
                        )}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {item.proformaItemMaterials.length} material(s)
                      </Badge>
                    </h4>
                  </div>
                  <div className="p-3 w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Material</TableHead>
                          <TableHead className="text-xs">Image</TableHead>
                          <TableHead className="text-xs">Color</TableHead>
                          <TableHead className="text-xs">Size</TableHead>
                          <TableHead className="text-xs text-right">Required</TableHead>
                          <TableHead className="text-xs text-right">Issued</TableHead>
                          <TableHead className="text-xs text-right">Remaining</TableHead>
                          <TableHead className="text-xs">Stock</TableHead>
                          <TableHead className="text-xs">Status / Issues</TableHead>
                          <TableHead className="text-xs text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.proformaItemMaterials.map((material) => {
                          const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
                          const alreadyIssued = material.givenquantity || 0;
                          const remaining = totalRequired - alreadyIssued;
                          const isFullyIssued = remaining <= 0;
                          const materialImage = getMaterialImage(material);
                          
                          return (
                            <TableRow key={material.id} className={isFullyIssued ? 'bg-green-50 dark:bg-green-950/30' : ''}>
                              <TableCell className="text-sm">
                                <p className="font-medium">{material.material?.name || ''}</p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {materialImage ? (
                                  <div className="relative group">
                                    <div className="relative h-12 w-12 rounded overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0 cursor-pointer">
                                      <Image
                                        src={materialImage}
                                        alt={material.material?.name || 'Material'}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                      <div 
                                        className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center"
                                        onClick={() => handleImageClick(materialImage, material.material?.name || 'Material')}
                                      >
                                        <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {material.material?.color ? (
                                  <span className="flex items-center gap-1.5">
                                    <span 
                                      className="inline-block w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0" 
                                      style={{ backgroundColor: material.material.color.toLowerCase() }}
                                    />
                                    {material.material.color}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{material.material?.size || '-'}</TableCell>
                              <TableCell className="text-sm text-right font-semibold">
                                {totalRequired}
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                {alreadyIssued > 0 ? (
                                  <Badge variant="secondary" className="text-xs">
                                    {alreadyIssued}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                {remaining > 0 ? (
                                  <span className="text-orange-600 font-medium">{remaining}</span>
                                ) : (
                                  <span className="text-green-600 font-medium">✓</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {getStockDisplay(material)}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-col gap-1">
                                  {getMaterialStatusBadge(material.status)}
                                  {material.materialIssues && material.materialIssues.length > 0 ? (
                                    <div className="space-y-2 mt-1">
                                      {material.materialIssues.map((issue, index) => (
                                        <div key={issue.id || index} className="border-l-2 border-primary/20 pl-2">
                                          {issue.givenTo && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                              <User className="h-3 w-3" />
                                              <span className="font-medium">Accepter:</span> {issue.givenTo.name}
                                            </span>
                                          )}
                                          {issue.issuedBy && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                              <User className="h-3 w-3" />
                                              <span className="font-medium">Issued By:</span> {issue.issuedBy.name}
                                            </span>
                                          )}
                                          {issue.issuedAt && (
                                            <span className="text-[10px] text-muted-foreground">
                                              📅 {formatDate(issue.issuedAt)}
                                            </span>
                                          )}
                                          {issue.quantity && (
                                            <span className="text-[10px] text-muted-foreground">
                                              📦 Qty: {issue.quantity} units
                                            </span>
                                          )}
                                          {issue.note && (
                                            <span className="text-[10px] text-muted-foreground block truncate max-w-37.5">
                                              📝 {issue.note}
                                            </span>
                                          )}
                                          {index < material.materialIssues.length - 1 && (
                                            <div className="border-b border-dashed border-gray-200 dark:border-gray-700 my-1" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No issues recorded</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-center">
                                {remaining > 0 && material.status !== MaterialIssueStatus.CANCELLED ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8"
                                    onClick={() => handleIssueMaterialClick(material)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      'Issue'
                                    )}
                                  </Button>
                                ) : material.status === MaterialIssueStatus.CANCELLED ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Cancelled
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    Done
                                  </Badge>
                                )}
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
        </CardContent>
      </Card>

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
                {allIssued ? 'Completed ✓' : purchasingStatusConfig.label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {allIssued ? 'All materials have been issued' : purchasingStatusConfig.description}
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
              <span className="text-purple-900">Stock Management Stage Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {hasPurchasingStage ? (
              <div className="space-y-6">
                {purchasingStages.map((stage) => {
                  const stageConfig = getStatusConfig(stage.stage);
                  const isActive = stage.status === 'ACTIVE' || stage.status === 'IN_PROGRESS';
                  const isCompleted = stage.status === 'COMPLETED' || allIssued;
                  
                  return (
                    <div key={stage.id} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            {stageConfig && <stageConfig.icon className={`h-6 w-6 ${stageConfig.color}`} />}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{stageConfig?.label || 'Purchasing'}</h3>
                            <p className="text-sm text-muted-foreground">Stage ID: {stage.id.substring(0, 8)}</p>
                          </div>
                        </div>
                        <Badge
                          variant={isCompleted ? 'default' : isActive ? 'outline' : 'secondary'}
                          className={`px-3 py-1 ${isCompleted ? 'bg-green-500' : isActive ? 'border-purple-500 text-purple-700' : ''}`}
                        >
                          {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
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
                <p className="mt-4 text-muted-foreground">No Stock Management stage information available for this project</p>
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
                              <TableCell>{item?.item?.name || item?.itemname || item?.category?.name || ''}</TableCell>
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
                      {/* Materials Summary Card */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-primary/5 p-3 border-b">
                          <h4 className="font-semibold text-sm md:text-base flex items-center gap-2">
                            <Package className="h-4 w-4 md:h-5 md:w-5" />
                            Materials Summary
                            <Badge variant="secondary" className="text-xs">
                              {(() => {
                                const uniqueMaterials = new Map();
                                proformaInvoice.items.forEach(item => {
                                  if (item.proformaItemMaterials) {
                                    item.proformaItemMaterials.forEach(material => {
                                      if (material.material?.id) {
                                        const key = material.material.id;
                                        if (!uniqueMaterials.has(key)) {
                                          uniqueMaterials.set(key, {
                                            material: material.material,
                                            totalQuantity: 0,
                                            totalAdditional: 0,
                                            items: new Set()
                                          });
                                        }
                                        const entry = uniqueMaterials.get(key);
                                        entry.totalQuantity += (material.quantity || 0);
                                        entry.totalAdditional += (material.additionalQuantity || 0);
                                        entry.items.add(item?.item?.name || item?.itemname || 'Unnamed');
                                      }
                                    });
                                  }
                                });
                                return uniqueMaterials.size;
                              })()} types
                            </Badge>
                          </h4>
                        </div>
                        <div className="p-3 w-full overflow-x-auto">
                          <div className="min-w-150 md:min-w-full">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs md:text-sm">Image</TableHead>
                                  <TableHead className="text-xs md:text-sm">Material</TableHead>
                                  <TableHead className="text-xs md:text-sm">Color</TableHead>
                                  <TableHead className="text-xs md:text-sm">Size</TableHead>
                                  <TableHead className="text-xs md:text-sm text-right">Total Qty</TableHead>
                                  <TableHead className="text-xs md:text-sm text-right">Issued</TableHead>
                                  <TableHead className="text-xs md:text-sm text-right">Remaining</TableHead>
                                  <TableHead className="text-xs md:text-sm text-center">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  const groupedMaterials = new Map();
                                  proformaInvoice.items.forEach(item => {
                                    if (item.proformaItemMaterials) {
                                      item.proformaItemMaterials.forEach(material => {
                                        if (material.material?.id) {
                                          const key = material.material.id;
                                          if (!groupedMaterials.has(key)) {
                                            groupedMaterials.set(key, {
                                              material: material.material,
                                              totalQuantity: 0,
                                              totalIssued: 0,
                                              status: material.status,
                                              items: new Set()
                                            });
                                          }
                                          const entry = groupedMaterials.get(key);
                                          entry.totalQuantity += (material.quantity || 0) + (material.additionalQuantity || 0);
                                          entry.totalIssued += (material.givenquantity || 0);
                                          const itemName = item?.item?.name || item?.itemname || 'Unnamed';
                                          const itemSize = item?.size || '';
                                          const identifier = itemSize ? `${itemName} (${itemSize})` : itemName;
                                          entry.items.add(identifier);
                                        }
                                      });
                                    }
                                  });

                                  return Array.from(groupedMaterials.values())
                                    .sort((a, b) => a.material.name.localeCompare(b.material.name))
                                    .map((group) => {
                                      const isFullyIssued = group.totalIssued >= group.totalQuantity;
                                      const imageUrl = group.material.imageUrl ? normalizeImagePath(group.material.imageUrl) : null;
                                      
                                      return (
                                        <TableRow key={group.material.id}>
                                          <TableCell className="text-sm">
                                            {imageUrl ? (
                                              <div className="relative h-10 w-10 rounded overflow-hidden border border-gray-200 dark:border-gray-600 cursor-pointer">
                                                <Image
                                                  src={imageUrl}
                                                  alt={group.material.name}
                                                  fill
                                                  className="object-cover"
                                                  sizes="40px"
                                                  onClick={() => handleImageClick(imageUrl, group.material.name)}
                                                />
                                              </div>
                                            ) : (
                                              <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                                <ImageIcon className="h-4 w-4 text-gray-400" />
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-sm font-medium">
                                            {group.material.name}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {group.material.color ? (
                                              <span className="flex items-center gap-1.5">
                                                <span 
                                                  className="inline-block w-3 h-3 rounded-full border border-slate-200 shrink-0" 
                                                  style={{ backgroundColor: group.material.color.toLowerCase() }}
                                                />
                                                {group.material.color}
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground">-</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {group.material.size || '-'}
                                          </TableCell>
                                          <TableCell className="text-sm text-right font-semibold">
                                            {group.totalQuantity}
                                          </TableCell>
                                          <TableCell className="text-sm text-right">
                                            {group.totalIssued}
                                          </TableCell>
                                          <TableCell className="text-sm text-right">
                                            {group.totalQuantity - group.totalIssued > 0 ? (
                                              <span className="text-orange-600">
                                                {group.totalQuantity - group.totalIssued}
                                              </span>
                                            ) : (
                                              <span className="text-green-600">✓</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-sm text-center">
                                            {isFullyIssued ? (
                                              <Badge className="bg-green-500 text-white">Fully Issued</Badge>
                                            ) : group.totalIssued > 0 ? (
                                              <Badge className="bg-yellow-500 text-white">Partially Issued</Badge>
                                            ) : (
                                              <Badge variant="outline">Pending</Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    });
                                })()}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Breakdown by Product */}
                      <details className="space-y-4">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                          <ChevronRight className="h-3.5 w-3.5" />
                          View Breakdown by Product
                        </summary>
                        <div className="space-y-4 pt-4">
                          {proformaInvoice.items.map((item) => {
                            if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return null;
                            
                            return (
                              <div key={item.id} className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/30 p-3 border-b">
                                  <h4 className="font-semibold text-sm md:text-base flex items-center justify-between">
                                    <span>
                                      {item?.item?.name || item?.itemname || item?.category?.name || 'Unnamed Item'}
                                      {item.size && item.size !== "" && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Size: {item.size}
                                        </Badge>
                                      )}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {item.proformaItemMaterials.length} material(s)
                                    </Badge>
                                  </h4>
                                </div>
                                <div className="p-3 w-full overflow-x-auto">
                                  <div className="min-w-125 md:min-w-full">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="text-xs md:text-sm">Image</TableHead>
                                          <TableHead className="text-xs md:text-sm">Material</TableHead>
                                          <TableHead className="text-xs md:text-sm">Color</TableHead>
                                          <TableHead className="text-xs md:text-sm">Size</TableHead>
                                          <TableHead className="text-xs md:text-sm text-right">Qty</TableHead>
                                          <TableHead className="text-xs md:text-sm text-right">Issued</TableHead>
                                          <TableHead className="text-xs md:text-sm text-right">Remaining</TableHead>
                                          <TableHead className="text-xs md:text-sm">Status / Issues</TableHead>
                                          <TableHead className="text-xs md:text-sm text-center">Action</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {item.proformaItemMaterials.map((material) => {
                                          const totalRequired = (material.quantity || 0) + (material.additionalQuantity || 0);
                                          const alreadyIssued = material.givenquantity || 0;
                                          const remaining = totalRequired - alreadyIssued;
                                          const isFullyIssued = remaining <= 0;
                                          const materialImage = getMaterialImage(material);
                                          
                                          return (
                                            <TableRow key={material.id} className={isFullyIssued ? 'bg-green-50 dark:bg-green-950/30' : ''}>
                                              <TableCell className="text-sm">
                                                {materialImage ? (
                                                  <div className="relative h-10 w-10 rounded overflow-hidden border border-gray-200 dark:border-gray-600 cursor-pointer">
                                                    <Image
                                                      src={materialImage}
                                                      alt={material.material?.name || 'Material'}
                                                      fill
                                                      className="object-cover"
                                                      sizes="40px"
                                                      onClick={() => handleImageClick(materialImage, material.material?.name || 'Material')}
                                                    />
                                                  </div>
                                                ) : (
                                                  <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                                    <ImageIcon className="h-4 w-4 text-gray-400" />
                                                  </div>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-sm">
                                                <p className="font-medium">{material.material?.name || ''}</p>
                                              </TableCell>
                                              <TableCell className="text-sm">
                                                {material.material?.color ? (
                                                  <span className="flex items-center gap-1.5">
                                                    <span 
                                                      className="inline-block w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0" 
                                                      style={{ backgroundColor: material.material.color.toLowerCase() }}
                                                    />
                                                    {material.material.color}
                                                  </span>
                                                ) : (
                                                  <span className="text-muted-foreground">-</span>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-sm">{material.material?.size || '-'}</TableCell>
                                              <TableCell className="text-sm text-right font-semibold">
                                                {totalRequired}
                                              </TableCell>
                                              <TableCell className="text-sm text-right">
                                                {alreadyIssued > 0 ? (
                                                  <Badge variant="secondary" className="text-xs">
                                                    {alreadyIssued}
                                                  </Badge>
                                                ) : (
                                                  <span className="text-muted-foreground">0</span>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-sm text-right">
                                                {remaining > 0 ? (
                                                  <span className="text-orange-600 font-medium">{remaining}</span>
                                                ) : (
                                                  <span className="text-green-600 font-medium">✓</span>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-sm">
                                                <div className="flex flex-col gap-1">
                                                  {getMaterialStatusBadge(material.status)}
                                                  {material.materialIssues && material.materialIssues.length > 0 ? (
                                                    <div className="space-y-2 mt-1">
                                                      {material.materialIssues.map((issue, index) => (
                                                        <div key={issue.id || index} className="border-l-2 border-primary/20 pl-2">
                                                          {issue.givenTo && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                              <User className="h-3 w-3" />
                                                              <span className="font-medium">Accepter:</span> {issue.givenTo.name}
                                                            </span>
                                                          )}
                                                          {issue.issuedBy && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                              <User className="h-3 w-3" />
                                                              <span className="font-medium">Issued By:</span> {issue.issuedBy.name}
                                                            </span>
                                                          )}
                                                          {issue.issuedAt && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                              📅 {formatDate(issue.issuedAt)}
                                                            </span>
                                                          )}
                                                          {issue.quantity && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                              📦 Qty: {issue.quantity} units
                                                            </span>
                                                          )}
                                                          {issue.note && (
                                                            <span className="text-[10px] text-muted-foreground block truncate max-w-37.5">
                                                              📝 {issue.note}
                                                            </span>
                                                          )}
                                                          {index < material.materialIssues.length - 1 && (
                                                            <div className="border-b border-dashed border-gray-200 dark:border-gray-700 my-1" />
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">No issues recorded</span>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-sm text-center">
                                                {remaining > 0 && material.status !== MaterialIssueStatus.CANCELLED ? (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs h-8"
                                                    onClick={() => handleIssueMaterialClick(material)}
                                                    disabled={isProcessing}
                                                  >
                                                    {isProcessing ? (
                                                      <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                      'Issue'
                                                    )}
                                                  </Button>
                                                ) : material.status === MaterialIssueStatus.CANCELLED ? (
                                                  <Badge variant="destructive" className="text-xs">
                                                    Cancelled
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="default" className="text-xs bg-green-500">
                                                    Done
                                                  </Badge>
                                                )}
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
                      </details>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                {selectedMaterial?.material?.imageUrl && (
                  <div className="flex justify-center mb-2">
                    <div 
                      className="relative h-20 w-20 rounded overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        const imageUrl = normalizeImagePath(selectedMaterial.material?.imageUrl);
                        if (imageUrl) {
                          handleImageClick(imageUrl, selectedMaterial.material?.name || 'Material');
                        }
                      }}
                    >
                      <Image
                        src={normalizeImagePath(selectedMaterial.material.imageUrl)!}
                        alt={selectedMaterial.material?.name || 'Material'}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <Eye className="h-5 w-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm">
                  <span className="font-medium">Material:</span> {selectedMaterial?.material?.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Total Required:</span> {(selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)} units
                </p>
                <p className="text-sm">
                  <span className="font-medium">Already Issued:</span> {selectedMaterial?.givenquantity || 0} units
                </p>
                <p className="text-sm">
                  <span className="font-medium">Remaining:</span> {((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)} units
                </p>
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
                    onChange={() => setIssueType('full')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Full Issue</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="partial"
                    checked={issueType === 'partial'}
                    onChange={() => setIssueType('partial')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Partial Issue</span>
                </label>
              </div>
            </div>

            {issueType === 'partial' && (
              <div className="space-y-2">
                <Label htmlFor="givenQuantity">Quantity to Issue *</Label>
                <Input
                  id="givenQuantity"
                  type="number"
                  min={0}
                  max={((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)}
                  value={givenQuantity}
                  onChange={(e) => setGivenQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity to issue"
                />
                <p className="text-xs text-muted-foreground">
                  Max: {((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)} units
                </p>
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
                    : givenQuantity)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available Stock:</span>
                    <span className={`text-lg font-bold ${
                      stockData.totalQuantity >= (issueType === 'full'
                        ? ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)
                        : givenQuantity)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {stockData.totalQuantity} units
                    </span>
                  </div>
                  {stockData.totalQuantity < ((issueType === 'full'
                    ? ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)
                    : givenQuantity)) && (
                    <p className="text-xs text-red-500 mt-1">
                      Insufficient stock! Shortfall: {((issueType === 'full'
                        ? ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)
                        : givenQuantity)) - stockData.totalQuantity} units
                    </p>
                  )}
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

            <div className="space-y-2">
              <Label htmlFor="issueNote">Note (Optional)</Label>
              <Textarea
                id="issueNote"
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="Add any notes about this issuance..."
                className="resize-none"
                rows={2}
              />
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
                (issueType === 'partial' && givenQuantity <= 0) ||
                (issueType === 'full' && ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0) - (selectedMaterial?.givenquantity || 0)) <= 0) ||
                (issueType === 'full' 
                  ? ((selectedMaterial?.quantity || 0) + (selectedMaterial?.additionalQuantity || 0)) - (selectedMaterial?.givenquantity || 0)
                  : givenQuantity) > (stockData?.totalQuantity || 0)
              }
              className="gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-2xl">
          <DialogHeader className="absolute top-4 right-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={closePreview}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-black/90 rounded-lg">
            {previewImage && (
              <>
                <div className="relative w-full max-h-[70vh] flex items-center justify-center">
                  <img
                    src={previewImage.url}
                    alt={previewImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                </div>
                <div className="mt-4 text-center text-white">
                  <p className="text-sm font-medium">{previewImage.name}</p>
                  <p className="text-xs text-gray-400">Click outside or press ESC to close</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseProjectDetailPage;