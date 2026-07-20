/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DifficultyLevel } from '@/models/Projects';
import { EstimationStatus, IDeliveryEstimation } from '@/models/delivery-estimation';
import { calculateDeliveryEstimation, createDeliveryEstimation, updateDeliveryEstimation } from '@/service/delivery-estimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, Calculator, Save, Edit, Search, X, Plus, Package, Sliders, Settings, ArrowLeft, ChevronDown } from 'lucide-react';
import { getItems } from '@/service/item';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

/* ========================= TYPES ========================= */

interface Material {
  materialId: string;
  materialName: string;
  quantity: number;
  // Use boolean flags instead of type string
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
  customerName?: string | null;
  phone?: string | null;
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

interface DeliveryEstimationFormProps {
  initialData: IDeliveryEstimation | null;
  isEdit: boolean;
}

/* ========================= STAGE QUANTITY DEFAULT VALUES ========================= */
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

/* ========================= COMPONENT ========================= */

export default function DeliveryEstimationForm({
  initialData,
  isEdit = false
}: DeliveryEstimationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResponse | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Item selection state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Stage quantities state (editable)
  const [stageQuantities, setStageQuantities] = useState<StageQuantity>({ ...DEFAULT_STAGE_QUANTITIES });
  const [isManualMode, setIsManualMode] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Safely extract customer name from initialData
  const safeCustomerName = initialData?.customerName 
    ? getSafeStringValue(initialData.customerName)
    : '';

  const form = useForm<FormValues>({
    defaultValues: {
      customerName: safeCustomerName,
      phone: initialData?.phone || '',
      difficulty: initialData?.difficulty || DifficultyLevel.EASY,
      status: initialData?.status || EstimationStatus.ESTIMATED,
    }
  });

  // Load all items on component mount
  useEffect(() => {
    loadAllItems();
  }, []);

  // Load initial items and stage quantities if editing
  useEffect(() => {
    if (isEdit && initialData) {
      const data = initialData as any;
      
      if (data.deliveryEstimationItems && Array.isArray(data.deliveryEstimationItems)) {
        const items = data.deliveryEstimationItems.map((item: any) => ({
          itemId: item.itemId,
          itemName: item.item?.name || 'Unknown Item',
          quantity: item.quantity,
          materials: (item.item?.itemMaterials || []).map((im: any) => ({
            materialId: im.materialId,
            materialName: im.material?.name || 'Unknown Material',
            quantity: im.quantity,
            // Copy the boolean flags from the material
            laminatedMDF: im.material?.laminatedMDF || false,
            plainMDF: im.material?.plainMDF || false,
            wood: im.material?.wood || false,
            metal: im.material?.metal || false,
            other: im.material?.other || false,
            color: im.material?.color,
            size: im.material?.size,
          }))
        }));
        setSelectedItems(items);
      }
      const savedStageQuantities = {
        DESIGN: data.DESIGN || 0,
        METAL_WORKS: data.METAL_WORKS || 0,
        CNC: data.CNC || 0,
        CUTTING: data.CUTTING || 0,
        EDGE_BANDING: data.EDGE_BANDING || 0,
        ASSEMBLY: data.ASSEMBLY || 0,
        PAINTING: data.PAINTING || 0,
        FINISHING: data.FINISHING || 0,
        DELIVERY: data.DELIVERY || 0,
      };
      setStageQuantities(savedStageQuantities);
    }
  }, [isEdit, initialData]);

  // Filter items based on search term AND exclude already selected items
  useEffect(() => {
    const selectedItemIds = new Set(selectedItems.map(item => item.itemId));
    
    let filtered = allItems;
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = allItems.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Exclude already selected items
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

  // Calculate material totals from selected items
  const calculateMaterialTotals = useCallback((): MaterialSummary => {
    const totals = {
      laminatedMDF: 0,
      plainMDF: 0,
      wood: 0,
      metal: 0,
      other: 0,
      total: 0
    };

    selectedItems.forEach(item => {
      if (item.materials && Array.isArray(item.materials)) {
        item.materials.forEach(material => {
          const materialQuantity = (material.quantity || 0) * (item.quantity || 1);
          
          // Check the boolean flags on the material object
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

  // Calculate stage quantities from selected items
  const calculateStageQuantitiesFromItems = useCallback((): StageQuantity => {
    const materialTotals = calculateMaterialTotals();
    
    const hasMetal = materialTotals.metal > 0;
    const hasLaminatedMDF = materialTotals.laminatedMDF > 0;
    
    return {
      DESIGN: materialTotals.total,
      METAL_WORKS: hasMetal ? materialTotals.metal : 0,
      CNC: 0,
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

  // Update stage quantity for a specific stage
  const updateStageQuantity = (stage: keyof StageQuantity, value: number) => {
    setStageQuantities(prev => ({
      ...prev,
      [stage]: Math.max(0, value)
    }));
  };

  // Add item to selection from dropdown
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
          quantity: im.quantity,
          // Copy the boolean flags from the material
          laminatedMDF: im.material?.laminatedMDF || false,
          plainMDF: im.material?.plainMDF || false,
          wood: im.material?.wood || false,
          metal: im.material?.metal || false,
          other: im.material?.other || false,
          color: im.material?.color,
          size: im.material?.size,
        }))
      }
    ]);
    setSelectedItemId('');
    setSearchTerm('');
  };

  // Remove item
  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item quantity (increased quantity support)
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  // Manual validation
  const validateForm = (data: FormValues): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (showCustomerForm) {
      if (!data.customerName || getSafeStringValue(data.customerName).length < 2) {
        errors.customerName = 'Customer name must be at least 2 characters long';
      }
    }

    if (data.phone && data.phone.length > 0 && data.phone.length < 10) {
      errors.phone = 'Phone number must be at least 10 characters long';
    }

    const hasAnyQuantity = Object.values(stageQuantities).some(qty => qty > 0);
    if (!hasAnyQuantity && !isEdit) {
      errors.stageQuantities = 'At least one stage must have quantity greater than 0';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const onSubmit = async (data: FormValues) => {
    if (!calculationResult && !isEdit) {
      toast.error('Please calculate the estimation first');
      return;
    }

    const hasAnyQuantity = Object.values(stageQuantities).some(qty => qty > 0);
    if (!hasAnyQuantity && !isEdit) {
      toast.error('Please enter at least one stage quantity');
      return;
    }

    const validation = validateForm(data);
    
    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        form.setError(field as any, {
          type: 'manual',
          message
        });
      });
      toast.error('Please fix the validation errors');
      return;
    }

    setIsLoading(true);
    try {
      const submissionData: any = {
        difficulty: data.difficulty,
        status: showCustomerForm ? EstimationStatus.ON_HOLD : EstimationStatus.ESTIMATED,
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
      
      if (showCustomerForm) {
        submissionData.customerName = getSafeStringValue(data.customerName);
        submissionData.phone = data.phone;
      }
      
      if (!isManualMode && selectedItems.length > 0) {
        submissionData.items = selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        }));
      }

      if (isEdit && initialData?.id) {
        await updateDeliveryEstimation(initialData.id, submissionData);
        toast.success('Delivery estimation updated successfully');
      } else {
        await createDeliveryEstimation(submissionData);
        toast.success('Delivery estimation created successfully');
      }

      router.push('/dashboard/DeliveryEstimation');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while saving delivery estimation.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ========================= CALCULATION HANDLER ========================= */
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
      };
      
      if (!isManualMode && selectedItems.length > 0) {
        calculationPayload.items = selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        }));
      }

      const result = await calculateDeliveryEstimation(calculationPayload);
      
      setCalculationResult(result.data);
      setShowCustomerForm(true);
      setActiveTab('result');
      toast.success('Calculation completed. Please review the estimation.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to calculate delivery estimation');
    } finally {
      setIsLoading(false);
    }
  };
// Add this with your other helper functions
const formatMinutes = (minutes: number): string => {
  if (!minutes && minutes !== 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};
const watchedCustomerName = form.watch('customerName');

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

  // Get status badge color
  const getStatusBadge = (status: EstimationStatus) => {
    switch (status) {
      case EstimationStatus.ESTIMATED:
        return <Badge className="bg-blue-100 text-blue-800">Estimated</Badge>;
      case EstimationStatus.ON_HOLD:
        return <Badge className="bg-amber-100 text-amber-800">On Hold</Badge>;
      case EstimationStatus.CONFIRMED:
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case EstimationStatus.PROJECT_CREATED:
        return <Badge className="bg-purple-100 text-purple-800">Project Created</Badge>;
      case EstimationStatus.EXPIRED:
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return null;
    }
  };

  const materialTotals = calculateMaterialTotals();

  // Custom Select component with search (updated to hide selected items)
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
        <PopoverContent className="w-[400px] p-0" align="start">
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
          <div className="max-h-[300px] overflow-y-auto">
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

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading 
            title={isEdit ? 'Edit Delivery Estimation' : 'Create Delivery Estimation'} 
            description={isEdit ? 'Update the delivery estimation details.' : 'Fill in the details to create a new delivery estimation.'}
          />
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
              {isEdit ? 'Edit Delivery Estimation' : 'Create New Delivery Estimation'}
            </CardTitle>
            {initialData && (
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(initialData.status)}
                <span className="text-sm text-gray-500">Code: {initialData.code || '-'}</span>
              </div>
            )}
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
                    <div className="flex items-center justify-between p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Mode:</span>
                        {isManualMode ? (
                          <Badge variant="outline" className=" text-amber-700">Manual Mode</Badge>
                        ) : (
                          <Badge variant="outline" className=" text-green-700">Automatic Mode</Badge>
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
                        <h3 className="text-lg font-semibold">Select Items (Optional in Manual Mode)</h3>
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
    <div className="space-y-2">
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
                  // REMOVE the disabled condition or change it based on your needs
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
                      <div className="p-4 rounded-lg">
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
                          <>Processing...</>
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
                        // CNC is a manual-add stage: only shown when the project has metal.
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
                    <div className="p-4 rounded-lg">
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
                          <>Processing...</>
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
                      <div className="p-6 bg-linear-to-br rounded-lg">
                        <h4 className="font-semibold text-lg text-blue-800 mb-2">Delivery Summary</h4>
                        <p className="text-blue-700">{calculationResult.summary.message}</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className=" p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-blue-600 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Total Business Days
                            </p>
                            <p className="text-3xl font-bold text-blue-900">
                              {calculationResult.timeline.estimatedBusinessDays}
                              <span className="text-sm font-normal text-blue-600 ml-1">days</span>
                            </p>
                          </div>
                          <div className=" p-4 rounded-lg shadow-sm">
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
                     {/* Stage Results with Detailed Timeline */}
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
            {/* Duration */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{data.timeTakenFormatted || formatMinutes(data.timeTaken)}</span>
            </div>
            
            {/* Start Date & Time */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Start:</span>
              <span className="font-medium">
                {data.startDateTime ? new Date(data.startDateTime).toLocaleString() : ''}
              </span>
            </div>
            
            {/* End Date & Time */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">End:</span>
              <span className="font-medium">
                {data.endDateTime ? new Date(data.endDateTime).toLocaleString() : ''}
              </span>
            </div>
            
            {/* Work Units */}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Units Processed:</span>
              <span className="font-medium">{data.actualWorkUnits || data.workUnits}</span>
            </div>
          </div>
          
          {/* Daily Allocations Breakdown */}
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
                      {alloc.minutes} min ({alloc.units} units)
                    </span>
                    <span className="text-gray-400">
                      {new Date(alloc.date).toLocaleTimeString()} - 
                      {alloc.endDateTime ? new Date(alloc.endDateTime).toLocaleTimeString() : ''}
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
                      <div className="space-y-4 p-6 borderrounded-lg">
                        <div className="flex items-center gap-2 text-amber-700">
                          <Users className="h-5 w-5" />
                          <h3 className="font-medium">Customer Information</h3>
                          <Badge variant="outline" className="ml-2 ">Required</Badge>
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
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value) {
                                      form.setValue('status', EstimationStatus.ON_HOLD);
                                    } else {
                                      form.setValue('status', EstimationStatus.ESTIMATED);
                                    }
                                  }}
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
                              <div key={stage} className="flex justify-between items-center p-2  rounded">
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
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              {isEdit ? 'Update Estimation' : 'Create Estimation'}
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
    </PageContainer>
  );
}
