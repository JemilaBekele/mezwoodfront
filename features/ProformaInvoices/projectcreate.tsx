/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ProjectStatus, DifficultyLevel } from '@/models/Projects';
import { getProformaInvoiceById } from '@/service/ProformaInvoice';
import { createProject } from '@/service/Project';
import { 
  calculateDeliveryEstimation,
  createDeliveryEstimation,
  deriveStageQuantities,
} from '@/service/delivery-estimation';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { EstimationStatus } from '@/models/delivery-estimation';
import { AlertCircle, Calendar, FileText, User, ArrowLeft, Clock, Loader2 } from 'lucide-react';

interface ProjectFormValues {
  invoiceId: string;
  customerName?: string;
  difficulty: DifficultyLevel;
  requestedDelivery?: string;
  status: ProjectStatus;
}

interface ProjectCreatePageProps {
  id?: string; // Proforma invoice ID from URL
}

interface CalculationResponse {
  inputs: {
    difficulty: string;
    materialQuantities: any;
    stageQuantities: any;
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
  stageResults: Record<string, any>;
  stageDays: Record<string, number>;
  allocations: any[];
  summary: {
    message: string;
    totalTime: string;
    deliveryDate: string;
  };
  materialSummary: any;
  stageQuantitiesCalculated?: any;
}

export default function ProjectCreatePage({ id }: ProjectCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<IProformaInvoice | null>(null);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResponse | null>(null);
  const [showEstimationDetails, setShowEstimationDetails] = useState(false);

  const defaultValues = useMemo<ProjectFormValues>(
    () => ({
      invoiceId: id || '',
      difficulty: DifficultyLevel.EASY,
      requestedDelivery: '',
      status: ProjectStatus.INVOICE
    }),
    [id]
  );

  const form = useForm<ProjectFormValues>({
    defaultValues
  });

  // Fetch invoice details and calculate delivery estimation
  useEffect(() => {
    const fetchInvoiceAndCalculate = async () => {
      if (!id) return;

      setIsFetchingInvoice(true);
      try {
        // Fetch invoice data
        const invoiceData = await getProformaInvoiceById(id);
        setInvoice(invoiceData);
        form.setValue('invoiceId', id);

        // Extract customer name from invoice
        if (invoiceData.customer?.name) {
          form.setValue('customerName', invoiceData.customer.name);
        }

        // Calculate delivery estimation automatically
        await calculateEstimation(invoiceData);

        toast.success('Invoice loaded and delivery estimation calculated');
      } catch (error: any) {
        toast.error('Failed to load invoice details');
        console.error('Error fetching invoice:', error);
      } finally {
        setIsFetchingInvoice(false);
      }
    };

    fetchInvoiceAndCalculate();
  }, [id, form]);

  // Calculate delivery estimation
  const calculateEstimation = async (invoiceData: IProformaInvoice) => {
    if (!invoiceData) return;

    setIsCalculating(true);
    try {
      // Prepare stage quantities from invoice items
      const stageQuantities = await prepareStageQuantities(invoiceData);
      
      const payload = {
        difficulty: form.getValues('difficulty') || DifficultyLevel.EASY,
        stageQuantities: stageQuantities,
      };

      const result = await calculateDeliveryEstimation(payload);
      setCalculationResult(result.data);

      // DO NOT auto-set the requested delivery date - let user enter it manually

    } catch (error: any) {
      console.error('Error calculating delivery estimation:', error);
      // Don't show toast error here as it might be confusing for the user
    } finally {
      setIsCalculating(false);
    }
  };

  // Prepare stage quantities from invoice items
  const prepareStageQuantities = async (invoiceData: IProformaInvoice) => {
    const quantities = {
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

    if (!invoiceData.items) return quantities;

    let metalUnits = 0;
    let laminatedMDFUnits = 0;
    let plainMDFUnits = 0;
    let woodUnits = 0;
    let otherUnits = 0;

    invoiceData.items.forEach((item: any) => {
      const qty = item.quantity || 1;

      // Check item materials
      if (item.proformaItemMaterials) {
        item.proformaItemMaterials.forEach((mat: any) => {
          const materialQty = mat.quantity || 1;
          const m = mat.material;
          if (m?.metal) {
            metalUnits += materialQty * qty;
          } else if (m?.laminatedMDF) {
            laminatedMDFUnits += materialQty * qty;
          } else if (m?.plainMDF) {
            plainMDFUnits += materialQty * qty;
          } else if (m?.wood) {
            woodUnits += materialQty * qty;
          } else {
            otherUnits += materialQty * qty;
          }
        });
      }
    });

    try {
      const result = await deriveStageQuantities({
        materials: {
          laminatedMDF: laminatedMDFUnits,
          plainMDF: plainMDFUnits,
          wood: woodUnits,
          metal: metalUnits,
          other: otherUnits,
        },
      });
      return result.stageQuantities as any;
    } catch {
      toast.error('Could not calculate stage quantities. Please try again.');
      return quantities;
    }
  };

  // Handle difficulty change - recalculate estimation
  const handleDifficultyChange = async (difficulty: DifficultyLevel) => {
    form.setValue('difficulty', difficulty);
    
    if (invoice) {
      setIsCalculating(true);
      try {
        const stageQuantities = await prepareStageQuantities(invoice);
        
        const payload = {
          difficulty: difficulty,
          stageQuantities: stageQuantities,
        };

        const result = await calculateDeliveryEstimation(payload);
        setCalculationResult(result.data);

        // DO NOT auto-set the requested delivery date - let user enter it manually

        toast.success(`Delivery estimation updated for ${difficulty} difficulty`);
      } catch (error: any) {
        console.error('Error recalculating delivery estimation:', error);
        toast.error('Failed to recalculate delivery estimation');
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsLoading(true);

      if (!invoice && !data.invoiceId) {
        toast.error('Invoice is required to create a project');
        return;
      }

      // Validate that requested delivery date is provided
      if (!data.requestedDelivery) {
        toast.error('Please select a requested delivery date');
        setIsLoading(false);
        return;
      }

      // Create delivery estimation if not already created
      let createdEstimationCode: string | undefined = undefined;
      if (calculationResult) {
        try {
          const estimationData = {
            piId: data.invoiceId,
            difficulty: data.difficulty,
            status: EstimationStatus.ESTIMATED, // Use enum value
            // Spread the calculated stage quantities here
            ...calculationResult.stageQuantitiesCalculated, // Ensure your API returns this
            customerName: invoice?.customer?.name || '',
            phone: invoice?.customer?.phone1 || '',
          };

          const estimationResponse = await createDeliveryEstimation(estimationData);
          if (estimationResponse?.estimation?.code) {
            createdEstimationCode = estimationResponse.estimation.code;
          }
        } catch (estimationError) {
          console.warn('Failed to create delivery estimation:', estimationError);
          // Continue with project creation even if estimation creation fails
        }
      }

      const projectData = {
        invoiceId: data.invoiceId,
        customerId: invoice?.customerId,
        difficulty: data.difficulty,
        requestedDelivery: data.requestedDelivery,
        ...(createdEstimationCode && { deliveryEstimationcode: createdEstimationCode })
      };

      await createProject(projectData);
      toast.success('Project created successfully with delivery estimation');

      router.push('/dashboard/Project');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Display invoice information
  const displayInvoiceInfo = () => {
    if (!invoice) return null;

    const itemCount = invoice.items?.length || 0;

    return (
      <div className="p-6 bg-linear-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-primary/20 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Number</p>
                <p className="font-bold text-xl">{invoice.piNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                <p className="font-medium text-lg">
                  {invoice.customer?.name || 'Unknown Customer'}
                </p>
                {invoice.customer?.companyName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {invoice.customer.companyName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <Badge variant="outline" className="text-sm py-1">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="text-sm py-1">
                Balance: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(invoice.balance || 0)}
              </Badge>
              <Badge variant="secondary" className="text-sm py-1">
                Total paid: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(invoice.amountPaid || 0)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Display delivery estimation
  const displayDeliveryEstimation = () => {
    if (!calculationResult) return null;

    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-800 dark:text-green-300">
                Delivery Estimation
              </h4>
              {isCalculating && (
                <Loader2 className="h-4 w-4 animate-spin text-green-600 ml-2" />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Delivery Date</p>
                <p className="font-bold text-lg text-green-700 dark:text-green-300">
                  {calculationResult.timeline?.formattedDeliveryDate || 'N/A'}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Business Days</p>
                <p className="font-bold text-lg text-green-700 dark:text-green-300">
                  {calculationResult.timeline?.estimatedBusinessDays || 0} days
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Difficulty Adjustment</p>
                <p className="font-bold text-lg text-amber-600">
                  +{calculationResult.timeline?.difficultyAdjustmentDays || 0} days
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEstimationDetails(!showEstimationDetails)}
              className="mt-2 text-green-700 hover:text-green-800"
            >
              {showEstimationDetails ? 'Hide Details' : 'Show Details'}
            </Button>

            {showEstimationDetails && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-md border border-green-100 dark:border-green-800">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Timeline Breakdown:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Manufacturing:</span>
                      <span className="font-medium">{calculationResult.timeline?.baseBusinessDays || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Contingency Buffer:</span>
                      <span className="font-medium text-orange-600">+{calculationResult.timeline?.contingencyDays || 0} days</span>
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Stage Breakdown:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                    {calculationResult.stageDays && Object.entries(calculationResult.stageDays).map(([stage, days]) => (
                      days > 0 && (
                        <div key={stage} className="flex justify-between">
                          <span className="text-gray-500">{stage.replace('_', ' ')}:</span>
                          <span className="font-medium">{days} days</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20">
            Auto-calculated
          </Badge>
        </div>
      </div>
    );
  };

  if (isFetchingInvoice) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="mx-auto w-full max-w-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading invoice information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="mx-auto w-full max-w-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Invoice ID Required</h3>
            <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
              No invoice ID was provided. Please navigate from a proforma invoice to create a project.
            </p>
            <Button onClick={() => router.push('/dashboard/ProformaInvoice')} className="mt-4">
              Go to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice && !isFetchingInvoice) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="mx-auto w-full max-w-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Invoice Not Found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Invoice
      </Button>

      <Card className="mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Create Project from Invoice
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fill in the project details below. The invoice information and delivery estimation have been pre-filled.
          </p>
        </CardHeader>
        <CardContent>
          {/* Invoice Summary */}
          {displayInvoiceInfo()}

          <Separator className="my-6" />

          {/* Delivery Estimation */}
          {displayDeliveryEstimation()}

          <Separator className="my-6" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Hidden invoiceId field */}
              <input type="hidden" {...form.register('invoiceId')} value={id} />

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Difficulty Level */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Difficulty Level
                        </FormLabel>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Changing difficulty will recalculate the delivery estimation
                        </p>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value: DifficultyLevel) => {
                              field.onChange(value);
                              handleDifficultyChange(value);
                            }}
                          >
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={DifficultyLevel.EASY}>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <span>Easy</span>
                                    <span className="text-xs text-gray-400">+0 days</span>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value={DifficultyLevel.MEDIUM}>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <span>Medium</span>
                                    <span className="text-xs text-gray-400">+2 days</span>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value={DifficultyLevel.HARD}>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <span>Hard</span>
                                    <span className="text-xs text-gray-400">+4 days</span>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Requested Delivery Date - Manual Entry */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="requestedDelivery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Requested Delivery Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input 
                              type="date" 
                              {...field}
                              value={field.value || ''}
                              min={new Date().toISOString().split('T')[0]}
                              className="h-12 pl-10 text-base"
                              required
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Please enter the delivery date requested by the customer
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/ProformaInvoice/view?=${id}`)}
                  disabled={isLoading}
                  className="min-w-25"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || isCalculating}
                  className="min-w-37.5 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}