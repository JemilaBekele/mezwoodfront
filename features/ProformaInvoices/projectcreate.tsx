/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { 
  AlertCircle, 
  Calendar, 
  FileText, 
  User, 
  ArrowLeft, 
  Clock, 
  Loader2,
  ChevronRight,
  Building,
  CheckCircle2,
  Layers,
  Wrench,
  Sparkles,
  ArrowRight,
  Copy,
  Info,
  ShieldCheck,
  DollarSign,
  Package,
} from 'lucide-react';

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

  const calculateEstimation = useCallback(async (invoiceData: IProformaInvoice): Promise<void> => {
    if (!invoiceData) return;

    setIsCalculating(true);
    try {
      const stageQuantities = await prepareStageQuantities(invoiceData);
      
      const payload = {
        difficulty: form.getValues('difficulty') || DifficultyLevel.EASY,
        stageQuantities: stageQuantities,
      };

      const result = await calculateDeliveryEstimation(payload);
      setCalculationResult(result.data);
    } catch (error) {
      console.error('Error calculating delivery estimation:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [form]);

  // Fetch invoice details and calculate delivery estimation
  useEffect(() => {
    const fetchInvoiceAndCalculate = async () => {
      if (!id) return;

      setIsFetchingInvoice(true);
      try {
        const invoiceData = await getProformaInvoiceById(id);
        setInvoice(invoiceData);
        form.setValue('invoiceId', id);

        if (invoiceData.customer?.name) {
          form.setValue('customerName', invoiceData.customer.name);
        }

        await calculateEstimation(invoiceData);
        toast.success('Invoice details loaded & estimation calculated');
      } catch (error) {
        toast.error('Failed to load invoice details');
        console.error('Error fetching invoice:', error);
      } finally {
        setIsFetchingInvoice(false);
      }
    };

    fetchInvoiceAndCalculate();
  }, [id, form, calculateEstimation]);

  // Calculate delivery estimation

// Helper function to format date from YYYY-MM-DD to MM/DD/YYYY
const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
  } catch {
    return dateString;
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
          } else if (m?.accessory) {
            // Excluded from scheduling entirely — not folded into "other".
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
        toast.success(`Delivery estimation recalculated for ${difficulty} difficulty`);
      } catch (error: any) {
        console.error('Error recalculating delivery estimation:', error);
        toast.error('Failed to recalculate delivery estimation');
      } finally {
        setIsCalculating(false);
      }
    }
  };

  // Quick action: copy calculated delivery date into requested field
  const handleCopyCalculatedDate = () => {
    if (calculationResult?.timeline?.estimatedDeliveryDate) {
      const dateStr = calculationResult.timeline.estimatedDeliveryDate.split('T')[0];
      form.setValue('requestedDelivery', dateStr);
      toast.success(`Populated target date: ${calculationResult.timeline.formattedDeliveryDate}`);
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsLoading(true);

      if (!invoice && !data.invoiceId) {
        toast.error('Invoice is required to create a project');
        return;
      }

      if (!data.requestedDelivery) {
        toast.error('Please select a requested delivery date');
        setIsLoading(false);
        return;
      }

      let createdEstimationCode: string | undefined = undefined;
      if (calculationResult) {
        try {
          const estimationData = {
            piId: data.invoiceId,
            difficulty: data.difficulty,
            status: EstimationStatus.ESTIMATED,
            ...calculationResult.stageQuantitiesCalculated,
            customerName: invoice?.customer?.name || '',
            phone: invoice?.customer?.phone1 || '',
          };

          const estimationResponse = await createDeliveryEstimation(estimationData);
          if (estimationResponse?.estimation?.code) {
            createdEstimationCode = estimationResponse.estimation.code;
          }
        } catch (estimationError) {
          console.warn('Failed to create delivery estimation:', estimationError);
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

      router.push('/dashboard/ProformaInvoice/my');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (id) {
      router.push(`/dashboard/ProformaInvoice/view?id=${id}`);
    } else {
      router.back();
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'ETB 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  if (isFetchingInvoice) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
          <FileText className="absolute h-6 w-6 text-slate-700" />
        </div>
        <p className="text-sm font-medium tracking-wide text-slate-500">Loading invoice details & computing timeline...</p>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-rose-50 p-4 text-rose-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Invoice ID Missing</h2>
        <p className="text-sm text-slate-500 max-w-md">No proforma invoice ID was specified. Please navigate from an approved invoice to create a project.</p>
        <Button onClick={() => router.push('/dashboard/ProformaInvoice')} variant="outline" className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  if (!invoice && !isFetchingInvoice) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-rose-50 p-4 text-rose-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Invoice Not Found</h2>
        <Button onClick={handleBack} variant="outline" className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoice View
        </Button>
      </div>
    );
  }

  const itemCount = invoice?.items?.length || 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
              <span className="cursor-pointer hover:text-slate-800" onClick={() => router.push('/dashboard/ProformaInvoice')}>Proforma Invoices</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="cursor-pointer hover:text-slate-800" onClick={handleBack}>#{invoice?.piNumber}</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-800">Project Setup</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Initialize Project Workflow
            </h1>
          </div>
        </div>

        {/* Step Progression Pills */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 flex items-center gap-1.5 py-1 px-2.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            1. Invoice Verified
          </Badge>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 flex items-center gap-1.5 py-1 px-2.5">
            <Sparkles className="h-3.5 w-3.5" />
            2. Timeline Calculated
          </Badge>
        </div>
      </div>

      {/* Invoice Details Banner */}
      {invoice && (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                Source Proforma Invoice Metadata
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs border-slate-300 bg-white">
                #{invoice.piNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Customer Info */}
              <div className="flex items-start space-x-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-white shadow-xs">
                  {invoice.customer?.name ? invoice.customer.name.substring(0, 2).toUpperCase() : 'CU'}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client / Customer</p>
                  <h4 className="text-sm font-bold text-slate-900">{invoice.customer?.name || 'Unknown Customer'}</h4>
                  {invoice.customer?.companyName && (
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Building className="h-3 w-3 text-slate-400" />
                      {invoice.customer.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* Items & Materials Summary */}
              <div className="flex items-start space-x-3.5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Package className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scope Overview</p>
                  <p className="text-sm font-bold text-slate-900">{itemCount} Product Line Item{itemCount !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-slate-500">
                    Status: <strong className="text-slate-700 font-semibold">{invoice.status}</strong>
                  </p>
                </div>
              </div>

              {/* Financial Balance Status */}
              {/* Financial Balance Status */}
<div className="flex items-start space-x-3.5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
    invoice.amountPaid === 0 || !invoice.amountPaid 
      ? 'bg-rose-50 text-rose-600' 
      : 'bg-emerald-50 text-emerald-600'
  }`}>
    <DollarSign className="h-5 w-5" />
  </div>
  <div className="space-y-0.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financial Ledger</p>
    <p className={`text-sm font-bold font-mono ${
      invoice.amountPaid === 0 || !invoice.amountPaid 
        ? 'text-rose-700' 
        : 'text-emerald-700'
    }`}>
      {invoice.amountPaid === 0 || !invoice.amountPaid ? (
        <span className="flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
          No payment received
        </span>
      ) : (
        `${formatCurrency(invoice.amountPaid)} paid`
      )}
    </p>
    <p className="text-xs font-mono text-slate-500">
      Balance: <strong className={`font-bold ${
        invoice.balance === 0 || !invoice.balance
          ? 'text-emerald-700'
          : 'text-amber-700'
      }`}>{formatCurrency(invoice.balance)}</strong>
    </p>
  </div>
</div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Estimation Visualizer Card */}
      {calculationResult && (
        <Card className="rounded-xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/40 via-white to-teal-50/30 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-emerald-100 bg-emerald-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Delivery Estimation
                </CardTitle>
                {isCalculating && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 ml-1" />}
              </div>
              <Badge className="bg-emerald-600 text-white font-medium text-[11px] hover:bg-emerald-600">
                System Computed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Timeline KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="rounded-xl border border-emerald-200/80 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated Delivery Date</p>
                <p className="text-lg font-extrabold text-emerald-800 mt-1 font-mono">
                  {calculationResult.timeline?.formattedDeliveryDate || 'N/A'}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Target completion date</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business Days Required</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1 font-mono">
                  {calculationResult.timeline?.estimatedBusinessDays || 0} Days
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Base: {calculationResult.timeline?.baseBusinessDays || 0} days</p>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Difficulty Adjustment</p>
                <p className="text-lg font-extrabold text-amber-700 mt-1 font-mono">
                  +{calculationResult.timeline?.difficultyAdjustmentDays || 0} Days
                </p>
                <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Contingency: +{calculationResult.timeline?.contingencyDays || 0}d</p>
              </div>

            </div>

            {/* Toggle Stage Details */}
            <div>
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEstimationDetails(!showEstimationDetails)}
                className="h-8 text-xs font-semibold border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
              >
                <Layers className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                {showEstimationDetails ? 'Hide Manufacturing Stages' : 'Show Manufacturing Stages Breakdown'}
              </Button> */}

              {showEstimationDetails && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-emerald-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Production Stage Durations</span>
                    <span className="text-slate-400 font-mono">Calculated from item materials</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {calculationResult.stageDays && Object.entries(calculationResult.stageDays).map(([stage, days]) => (
                      <div key={stage} className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${days > 0 ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/40 border-slate-100 text-slate-400'}`}>
                        <span className="font-medium text-slate-700 uppercase tracking-wider text-[10px]">{stage.replace(/_/g, ' ')}</span>
                        <Badge variant="outline" className={`font-mono text-xs ${days > 0 ? 'bg-white text-slate-900 border-slate-300 font-bold' : 'border-transparent text-slate-400'}`}>
                          {days}d
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Main Project Form Card */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-500" />
            Project Parameters & Delivery Schedule
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Set project difficulty level and select the target requested delivery date for project tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" {...form.register('invoiceId')} value={id} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Difficulty Selector */}
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-slate-500" />
                        Project Difficulty Level
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value: DifficultyLevel) => {
                            field.onChange(value);
                            handleDifficultyChange(value);
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-lg border-slate-300 text-xs font-medium">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-slate-200">
                            <SelectItem value={DifficultyLevel.EASY} className="text-xs">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-emerald-800">Easy</span>
                                <Badge variant="outline" className="ml-2 font-mono text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                                  +0 Days
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value={DifficultyLevel.MEDIUM} className="text-xs">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-amber-800">Medium</span>
                                <Badge variant="outline" className="ml-2 font-mono text-[10px] border-amber-200 bg-amber-50 text-amber-700">
                                  +2 Days
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value={DifficultyLevel.HARD} className="text-xs">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-rose-800">Hard</span>
                                <Badge variant="outline" className="ml-2 font-mono text-[10px] border-rose-200 bg-rose-50 text-rose-700">
                                  +4 Days
                                </Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
               
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Requested Delivery Date */}
{/* Target Requested Delivery Date */}
<FormField
  control={form.control}
  name="requestedDelivery"
  render={({ field }) => (
    <FormItem className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-500" />
          Requested Delivery Date <span className="text-rose-500">*</span>
        </FormLabel>
        {calculationResult?.timeline?.estimatedDeliveryDate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyCalculatedDate}
            className="h-6 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
          >
            <Copy className="h-3 w-3 mr-1" /> Use Calculated Date
          </Button>
        )}
      </div>
      <FormControl>
        <Input
          type="date"
          {...field}
          value={field.value || ''}
          min={new Date().toISOString().split('T')[0]}
          className="h-10 rounded-lg border-slate-300 text-xs font-mono"
          required
          onChange={(e) => {
            // Store in YYYY-MM-DD format for the form state
            field.onChange(e.target.value);
          }}
        />
      </FormControl>
      {/* Display formatted date if value exists */}
      {field.value && (
        <p className="text-xs text-slate-500 mt-1">
          Selected: {formatDisplayDate(field.value)}
        </p>
      )}
      <FormMessage />
    </FormItem>
  )}
/>

              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="h-10 rounded-lg border-slate-300 text-xs font-medium px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isCalculating}
                  className="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 shadow-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Initializing Project...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Project & Start Workflow
                      <ArrowRight className="h-4 w-4" />
                    </span>
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