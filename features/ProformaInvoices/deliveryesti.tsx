/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calculator,
  Calendar,
  Clock,
  Package,
  Save,
  ArrowLeft,
  Loader2,
  Users,
  FileText,
  Eye,
  ChevronDown,
  X,
  Sliders,
  Settings,
  Plus,
  Search,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { getProformaInvoiceById } from '@/service/ProformaInvoice';
import {
  calculateDeliveryEstimation,
  createDeliveryEstimation,
} from '@/service/delivery-estimation';
import { getItems } from '@/service/item';
import { DifficultyLevel } from '@/models/Projects';
import { EstimationStatus } from '@/models/delivery-estimation';
import { IProformaInvoice, IProformaItemMaterial } from '@/models/ProformaInvoice';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/* ========================= TYPES ========================= */

interface Material {
  materialId: string;
  materialName: string;
  quantity: number;
  laminatedMDF?: boolean;
  plainMDF?: boolean;
  wood?: boolean;
  metal?: boolean;
  other?: boolean;
  color?: string;
  size?: string;
}

interface SelectedItem {
  itemId: string;
  itemName: string;
  quantity: number;
  materials: Material[];
}

interface FormValues {
  customerName: string;
  phone: string;
  difficulty: DifficultyLevel;
  status: EstimationStatus;
}

interface Allocation {
  date: string;
  workUnits: number;
  unitsCount: number;
  dateStr: string;
  stage: string;
  isOverCapacity?: boolean;
}

interface StageResult {
  workUnits: number;
  daysUsed: number;
  allocations: Allocation[];
}

interface MaterialSummary {
  laminatedMDF: number;
  plainMDF: number;
  metal: number;
  wood: number;
  other: number;
  total: number;
}

interface StageQuantity {
  DESIGN: number;
  METAL_WORKS: number;
  CNC: number;
  CUTTING: number;
  EDGE_BANDING: number;
  ASSEMBLY: number;
  PAINTING: number;
  FINISHING: number;
  DELIVERY: number;
}

interface CalculationResponse {
  inputs: {
    difficulty: string;
    materialQuantities: MaterialSummary;
    stageQuantities: StageQuantity;
    hasMetal: boolean;
    hasWood: boolean;
    hasPlainMDF: boolean;
    hasLaminatedMDF: boolean;
  };
  timeline: {
    baseBusinessDays: number;
    difficultyAdjustmentDays: number;
    contingencyDays: number;
    estimatedBusinessDays: number;
    estimatedDeliveryDate: string;
    formattedDeliveryDate: string;
  };
  stageResults: Record<string, StageResult>;
  stageDays: Record<string, number>;
  allocations: Allocation[];
  summary: {
    message: string;
    totalTime: string;
    deliveryDate: string;
  };
  materialSummary: MaterialSummary;
  stageQuantitiesCalculated?: StageQuantity;
}

interface DeliveryEstimationFromPIPageProps {
  piId: string;
}

/* ========================= CONSTANTS ========================= */

const DEFAULT_STAGE_QUANTITIES: StageQuantity = {
  DESIGN: 0,
  METAL_WORKS: 0,
  CNC: 0,
  CUTTING: 0,
  EDGE_BANDING: 0,
  ASSEMBLY: 0,
  PAINTING: 0,
  FINISHING: 0,
  DELIVERY: 0,
};

/* ========================= HELPER FUNCTIONS ========================= */

const getSafeStringValue = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.name && typeof value.name === 'string') return value.name;
    return '';
  }
  return String(value);
};

const formatMinutes = (minutes: number): string => {
  if (!minutes && minutes !== 0) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

/* ========================= COMPONENT ========================= */

export default function DeliveryEstimationFromPIPage({
  piId,
}: DeliveryEstimationFromPIPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPI, setIsLoadingPI] = useState(true);
  const [invoice, setInvoice] = useState<IProformaInvoice | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResponse | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Item selection state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Stage quantities state
  const [stageQuantities, setStageQuantities] = useState<StageQuantity>({ ...DEFAULT_STAGE_QUANTITIES });
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Preview dialog
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      customerName: '',
      phone: '',
      difficulty: DifficultyLevel.MEDIUM,
      status: EstimationStatus.ESTIMATED,
    },
  });

  // Load PI data and items
  useEffect(() => {
    const loadData = async () => {
      if (!piId) {
        toast.error('No Proforma Invoice ID provided');
        setIsLoadingPI(false);
        return;
      }

      setIsLoadingPI(true);
      try {
        // Load PI details
        const invoiceData = await getProformaInvoiceById(piId);
        setInvoice(invoiceData);

        // Extract customer info
        if (invoiceData.customerId) {
          const customerName = invoiceData.customer?.name || invoiceData.customer?.companyName || '';                          '';
          form.setValue('customerName', customerName);
        }

        // Extract items from PI
        if (invoiceData.items && invoiceData.items.length > 0) {
          const items = invoiceData.items.map((item: any) => ({
            itemId: item.itemId || item.id || `pi-item-${item.id}`,
            itemName: item.item?.name || item.description || 'Unknown Item',
            quantity: item.quantity || 1,
            materials: (item.proformaItemMaterials || []).map((im: IProformaItemMaterial) => ({
              materialId: im.materialId || im.material?.id || '',
              materialName: im.material?.name || 'Unknown Material',
              quantity: im.quantity || 1,
              laminatedMDF: im.material?.laminatedMDF || false,
              plainMDF: im.material?.plainMDF || false,
              wood: im.material?.wood || false,
              metal: im.material?.metal || false,
              other: im.material?.other || false,
              color: im.material?.color,
              size: im.material?.size,
            })),
          }));
          setSelectedItems(items);
        }

        // Load all items for search
        await loadAllItems();

        toast.success('Proforma Invoice loaded successfully');
      } catch (error: any) {
        console.error('Error loading PI:', error);
        toast.error('Failed to load proforma invoice: ' + (error.message || 'Unknown error'));
      } finally {
        setIsLoadingPI(false);
      }
    };

    loadData();
  }, [form, piId]);

  // Load all items function
  const loadAllItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await getItems();
      setAllItems(response);
      setFilteredItems(response);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Filter items based on search term and exclude already selected
  useEffect(() => {
    const selectedItemIds = new Set(selectedItems.map(item => item.itemId));
    
    let filtered = allItems;
    
    if (searchTerm.trim()) {
      filtered = allItems.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered = filtered.filter(item => !selectedItemIds.has(item.id));
    setFilteredItems(filtered);
  }, [searchTerm, allItems, selectedItems]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isDropdownOpen]);

  // Calculate material totals from selected items
  const calculateMaterialTotals = useCallback((): MaterialSummary => {
    const totals = {
      laminatedMDF: 0,
      plainMDF: 0,
      wood: 0,
      metal: 0,
      other: 0,
      total: 0,
    };

    selectedItems.forEach(item => {
      if (item.materials && Array.isArray(item.materials)) {
        item.materials.forEach(material => {
          const materialQuantity = (material.quantity || 0) * (item.quantity || 1);
          
          if (material.laminatedMDF) {
            totals.laminatedMDF += materialQuantity;
          } else if (material.plainMDF) {
            totals.plainMDF += materialQuantity;
          } else if (material.wood) {
            totals.wood += materialQuantity;
          } else if (material.metal) {
            totals.metal += materialQuantity;
          } else {
            totals.other += materialQuantity;
          }
          
          totals.total += materialQuantity;
        });
      }
    });

    return totals;
  }, [selectedItems]);

  // Calculate stage quantities from items
  const calculateStageQuantitiesFromItems = useCallback((): StageQuantity => {
    const materialTotals = calculateMaterialTotals();
    
    const hasMetal = materialTotals.metal > 0;
    const hasLaminatedMDF = materialTotals.laminatedMDF > 0;
    
    return {
      DESIGN: materialTotals.total,
      METAL_WORKS: hasMetal ? materialTotals.metal : 0,
      CNC: hasMetal ? Math.ceil(materialTotals.metal / 2) : 0,
      CUTTING: materialTotals.total - materialTotals.metal,
      EDGE_BANDING: hasLaminatedMDF ? materialTotals.laminatedMDF : 0,
      ASSEMBLY: materialTotals.total - materialTotals.metal,
      PAINTING: materialTotals.plainMDF + materialTotals.wood + materialTotals.metal,
      FINISHING: materialTotals.total,
      DELIVERY: materialTotals.total,
    };
  }, [calculateMaterialTotals]);

  // Auto-calculate stage quantities when items change
  useEffect(() => {
    if (!isManualMode && selectedItems.length > 0) {
      const calculated = calculateStageQuantitiesFromItems();
      setStageQuantities(calculated);
    }
  }, [selectedItems, calculateStageQuantitiesFromItems, isManualMode]);

  // Update stage quantity
  const updateStageQuantity = (stage: keyof StageQuantity, value: number) => {
    setStageQuantities(prev => ({
      ...prev,
      [stage]: Math.max(0, value),
    }));
  };

  // Add item from dropdown
  const addItemFromDropdown = () => {
    if (!selectedItemId) {
      toast.error('Please select an item');
      return;
    }

    const item = allItems.find(i => i.id === selectedItemId);
    if (!item) return;

    const exists = selectedItems.some(i => i.itemId === item.id);
    if (exists) {
      toast.error('Item already added');
      setSelectedItemId('');
      return;
    }

    setSelectedItems(prev => [
      ...prev,
      {
        itemId: item.id,
        itemName: item.name || 'Unknown',
        quantity: 1,
        materials: (item.itemMaterials || []).map((im: any) => ({
          materialId: im.material?.id || im.materialId,
          materialName: im.material?.name || 'Unknown Material',
          quantity: im.quantity || 1,
          laminatedMDF: im.material?.laminatedMDF || false,
          plainMDF: im.material?.plainMDF || false,
          wood: im.material?.wood || false,
          metal: im.material?.metal || false,
          other: im.material?.other || false,
          color: im.material?.color,
          size: im.material?.size,
        })),
      },
    ]);
    setSelectedItemId('');
    setSearchTerm('');
  };

  // Remove item
  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  // Reset to automatic mode
  const resetToAutomaticMode = () => {
    if (selectedItems.length > 0) {
      const calculated = calculateStageQuantitiesFromItems();
      setStageQuantities(calculated);
      setIsManualMode(false);
      toast.success('Switched to automatic mode. Stage quantities updated from selected items.');
    } else {
      toast.error('Please select items first to use automatic mode.');
    }
  };

  // Handle calculation
  const handleCalculate = async () => {
    const values = form.getValues();

    const hasAnyQuantity = Object.values(stageQuantities).some(qty => qty > 0);
    if (!hasAnyQuantity) {
      toast.error('Please enter at least one stage quantity');
      return;
    }

    setIsLoading(true);
    try {
      const calculationPayload: any = {
        difficulty: values.difficulty,
        stageQuantities: stageQuantities,
        piId: piId,
      };
      
      if (!isManualMode && selectedItems.length > 0) {
        calculationPayload.items = selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
        }));
      }

      const result = await calculateDeliveryEstimation(calculationPayload);
      
      setCalculationResult(result.data);
      setActiveTab('result');
      toast.success('Calculation completed. Please review the estimation.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to calculate delivery estimation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submit - Create only
  const onSubmit = async (data: FormValues) => {
    if (!calculationResult) {
      toast.error('Please calculate the estimation first');
      return;
    }

    const hasAnyQuantity = Object.values(stageQuantities).some(qty => qty > 0);
    if (!hasAnyQuantity) {
      toast.error('Please enter at least one stage quantity');
      return;
    }

    setIsLoading(true);
    try {
      const submissionData: any = {
        piId: piId,
        difficulty: data.difficulty,
        status: EstimationStatus.ESTIMATED,
        DESIGN: stageQuantities.DESIGN,
        METAL_WORKS: stageQuantities.METAL_WORKS,
        CNC: stageQuantities.CNC,
        CUTTING: stageQuantities.CUTTING,
        EDGE_BANDING: stageQuantities.EDGE_BANDING,
        ASSEMBLY: stageQuantities.ASSEMBLY,
        PAINTING: stageQuantities.PAINTING,
        FINISHING: stageQuantities.FINISHING,
        DELIVERY: stageQuantities.DELIVERY,
      };
      
      submissionData.customerName = getSafeStringValue(data.customerName);
      submissionData.phone = data.phone;
      
      if (!isManualMode && selectedItems.length > 0) {
        submissionData.items = selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
        }));
      }

      await createDeliveryEstimation(submissionData);
      toast.success('Delivery estimation created successfully');

      router.push('/dashboard/DeliveryEstimation');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while saving delivery estimation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Searchable Select Component
  const SearchableSelect = () => {
    return (
      <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedItemId 
              ? allItems.find(i => i.id === selectedItemId)?.name || 'Select item'
              : 'Choose an item to add'}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-100 p-0" align="start">
          <div className="p-2 border-b">
            <div className="flex items-center border rounded-md px-2 py-1">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full outline-none text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-75 overflow-y-auto">
            {isLoadingItems ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {selectedItems.length === allItems.length 
                  ? 'All items have been selected' 
                  : 'No items found'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer border-b last:border-0"
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="font-medium">{item.name || 'Unnamed Item'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.itemMaterials?.length || 0} materials
                    </Badge>
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {typeof item.category === 'object' ? item.category.name : item.category}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const materialTotals = calculateMaterialTotals();
  const watchedCustomerName = form.watch('customerName');

  // Loading state
  if (isLoadingPI) {
    return (
      <PageContainer scrollable={true}>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading proforma invoice...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer scrollable={true}>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Proforma invoice not found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/dashboard/proforma-invoice')}
            >
              Back to Proforma Invoices
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <div>
            <Heading 
              title="Create Delivery Estimation from Proforma Invoice" 
              description={`Create delivery estimation for PI #${invoice.piNumber}`}
            />
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-sm">
                PI: {invoice.piNumber}
              </Badge>
              {invoice.customerId && (
                <Badge variant="secondary" className="text-sm">
                  <Users className="h-3 w-3 mr-1" />
                  {invoice.customer?.name || invoice.customer?.companyName || 'Unknown Customer'}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/delivery-estimation')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        </div>
        <Separator />

        <Card className='mx-auto w-full max-w-6xl'>
          <CardHeader>
            <CardTitle className='text-left text-2xl font-bold'>
              Create New Delivery Estimation
            </CardTitle>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-muted-foreground">
                PI Total: <span className="font-semibold">{invoice.total?.toLocaleString() || 0} ETB</span>
              </span>
              <span className="text-sm text-muted-foreground">
                Items: <span className="font-semibold">{invoice.items?.length || 0}</span>
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Items & Stages
                  </TabsTrigger>
                  <TabsTrigger value="stages" className="flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    Stage Quantities
                  </TabsTrigger>
                  <TabsTrigger value="result" disabled={!calculationResult} className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Calculation Result
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Items Selection */}
                <TabsContent value="basic" className="space-y-6 mt-4">
                  <div className='space-y-6'>
                    {/* PI Summary Card */}
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Proforma Invoice Items
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {invoice.items?.length || 0} items loaded from PI #{invoice.piNumber}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreviewDialog(true)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View PI Items
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name='difficulty'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select difficulty' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={DifficultyLevel.EASY}>Easy</SelectItem>
                                <SelectItem value={DifficultyLevel.MEDIUM}>Medium</SelectItem>
                                <SelectItem value={DifficultyLevel.HARD}>Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Mode:</span>
                        {isManualMode ? (
                          <Badge variant="outline" className="text-amber-700">Manual Mode</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-700">Automatic Mode</Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetToAutomaticMode}
                        disabled={!isManualMode}
                        className="text-sm"
                      >
                        Switch to Automatic
                      </Button>
                    </div>

                    {/* Item Selection Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Select Additional Items (Optional)</h3>
                        {isLoadingItems && (
                          <span className="text-sm text-gray-500">Loading items...</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SearchableSelect />
                        </div>
                        <Button
                          type="button"
                          onClick={addItemFromDropdown}
                          disabled={!selectedItemId}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                      </div>

                      {/* Selected Items */}
                      {selectedItems.length > 0 && (
                        <div className="space-y-3 mt-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Selected Items ({selectedItems.length})</h4>
                            {!isManualMode && (
                              <span className="text-xs text-green-600">
                                Auto-calculating stage quantities...
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {selectedItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 rounded-md border">
                                <div className="flex-1">
                                  <p className="font-medium">{item.itemName}</p>
                                  <p className="text-xs text-gray-500">
                                    {item.materials?.length || 0} material types
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-gray-500">Qty:</span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                      >
                                        -
                                      </Button>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                        className="w-16 h-8 text-center"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Material Summary */}
                    {selectedItems.length > 0 && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <h4 className="font-medium text-blue-800 mb-2">Material Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>Laminated MDF:</span>
                            <span className="font-medium">{materialTotals.laminatedMDF} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Plain MDF:</span>
                            <span className="font-medium">{materialTotals.plainMDF} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Wood:</span>
                            <span className="font-medium">{materialTotals.wood} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Metal:</span>
                            <span className="font-medium">{materialTotals.metal} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-bold">{materialTotals.total} units</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className='flex justify-end gap-2 pt-4 border-t'>
                      <Button
                        type='button'
                        onClick={() => setActiveTab('stages')}
                        className="flex items-center gap-2"
                      >
                        <Sliders className="h-4 w-4" />
                        Configure Stages
                      </Button>
                      <Button
                        type='button'
                        onClick={handleCalculate}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4" />
                            Calculate Estimation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Stage Quantities */}
                <TabsContent value="stages" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Stage Quantities</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsManualMode(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-3 w-3" />
                        Edit All Stages
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Enter the quantity for each production stage. These values will be used for capacity calculation.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(stageQuantities)
                        .filter(([stage]) => stage !== 'CNC' || materialTotals.metal > 0)
                        .map(([stage, value]) => (
                          <div key={stage} className="p-3 border rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {stage.replace('_', ' ')}
                              {stage === 'CNC' && (
                                <span className="ml-1 text-xs text-amber-600">(manual)</span>
                              )}
                            </label>
                            <Input
                              type="number"
                              min={0}
                              value={value}
                              onChange={(e) => updateStageQuantity(stage as keyof StageQuantity, parseInt(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>
                        ))}
                    </div>

                    {/* Total Quantity Summary */}
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Quantity Across All Stages:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {Object.values(stageQuantities).reduce((sum, qty) => sum + qty, 0)} units
                        </span>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className='flex justify-between gap-2 pt-4 border-t'>
                      <Button
                        variant='outline'
                        type='button'
                        onClick={() => setActiveTab('basic')}
                      >
                        Back to Items
                      </Button>
                      <Button
                        type='button'
                        onClick={handleCalculate}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4" />
                            Calculate Estimation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Calculation Result */}
                <TabsContent value="result" className="mt-4">
                  {calculationResult && (
                    <div className="space-y-6">
                      {/* Summary Card */}
                      <div className="p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-lg text-blue-800 mb-2">Delivery Summary</h4>
                        <p className="text-blue-700">{calculationResult.summary.message}</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-blue-600 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Total Business Days
                            </p>
                            <p className="text-3xl font-bold text-blue-900">
                              {calculationResult.timeline.estimatedBusinessDays}
                              <span className="text-sm font-normal text-blue-600 ml-1">days</span>
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-blue-600 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Estimated Delivery
                            </p>
                            <p className="text-xl font-semibold text-blue-900">
                              {calculationResult.timeline.formattedDeliveryDate}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Breakdown */}
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Timeline Breakdown</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Base Manufacturing Time:</span>
                            <span className="font-medium">{calculationResult.timeline.baseBusinessDays} days</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Difficulty Adjustment:</span>
                            <span className="font-medium text-amber-600">+{calculationResult.timeline.difficultyAdjustmentDays} days</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Contingency buffer:</span>
                            <span className="font-medium text-orange-600">+{calculationResult.timeline.contingencyDays} days</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center font-bold text-lg">
                              <span>Total:</span>
                              <span className="text-blue-600">{calculationResult.timeline.estimatedBusinessDays} days</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stage Results */}
                      {calculationResult.stageResults && Object.keys(calculationResult.stageResults).length > 0 && (
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold text-lg mb-3">Stage Duration Details</h4>
                          <div className="space-y-4">
                            {Object.entries(calculationResult.stageResults).map(([stage, data]: [string, any]) => (
                              <div key={stage} className="border-b last:border-0 pb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-md text-blue-700">{stage.replace('_', ' ')}</h5>
                                  <Badge variant="outline" className="bg-blue-50">
                                    {data.daysUsed} day{data.daysUsed !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Duration:</span>
                                    <span className="font-medium">{formatMinutes(data.timeTaken)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Units Processed:</span>
                                    <span className="font-medium">{data.actualWorkUnits || data.workUnits}</span>
                                  </div>
                                </div>
                                
                                {data.allocations && data.allocations.length > 0 && (
                                  <div className="mt-3 pl-4 border-l-2 border-blue-200">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Daily Breakdown:</p>
                                    <div className="space-y-1">
                                      {data.allocations.map((alloc: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 text-xs">
                                          <span className="text-gray-500 w-28">
                                            {new Date(alloc.date).toLocaleDateString()}:
                                          </span>
                                          <span className="font-medium">
                                            {alloc.units} units
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Customer Information Form */}
                      <div className="space-y-4 p-6 border rounded-lg bg-amber-50/30">
                        <div className="flex items-center gap-2 text-amber-700">
                          <Users className="h-5 w-5" />
                          <h3 className="font-medium">Customer Information</h3>
                          <Badge variant="outline" className="ml-2">Required</Badge>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name='customerName'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-700">
                                Customer Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder='e.g., John Doe' 
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  ref={field.ref}
                                  name={field.name}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='phone'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-700">
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder='e.g., 0912345678' 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Stage Quantities Summary */}
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Stage Quantities Used</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(stageQuantities).map(([stage, qty]) => (
                            qty > 0 && (
                              <div key={stage} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                                <span className="text-sm font-medium">{stage}:</span>
                                <span className="text-sm font-bold text-blue-600">{qty} units</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between gap-2 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab('stages')}
                          className="flex items-center gap-2"
                        >
                          <Sliders className="h-4 w-4" />
                          Adjust Stages
                        </Button>
                        <Button
                          type="button"
                          onClick={form.handleSubmit(onSubmit)}
                          disabled={isLoading || !watchedCustomerName}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Create Estimation
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* PI Items Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proforma Invoice #{invoice.piNumber} - Items
            </DialogTitle>
            <DialogDescription>
              Items loaded from the proforma invoice. These will be used for delivery estimation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.map((item: any, index: number) => (
                  <TableRow key={item.id || index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.item?.name || item.description}</p>
                        {item.size && (
                          <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.proformaItemMaterials?.length || 0} materials
                    </TableCell>
                    <TableCell>{item.amount?.toLocaleString() || 0} ETB</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  {invoice.total?.toLocaleString() || 0} ETB
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

// Re-export for external use
export { DeliveryEstimationFromPIPage };