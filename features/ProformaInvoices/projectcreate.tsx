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

import {  ProjectStatus, DifficultyLevel } from '@/models/Projects';
import { getProformaInvoiceById } from '@/service/ProformaInvoice';
import { createProject } from '@/service/Project';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { AlertCircle, Calendar, FileText, User, ArrowLeft } from 'lucide-react';

interface ProjectFormValues {
  invoiceId: string;
  difficulty: DifficultyLevel;
  requestedDelivery?: string;
  status: ProjectStatus;
}

interface ProjectCreatePageProps {
  id?: string; // Proforma invoice ID from URL
}

export default function ProjectCreatePage({ id }: ProjectCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<IProformaInvoice | null>(null);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);

  const defaultValues = useMemo<ProjectFormValues>(
    () => ({
      invoiceId: id || '',
      difficulty: DifficultyLevel.HARD, // Default to HARD
      requestedDelivery: '',
      status: ProjectStatus.INVOICE // Default status
    }),
    [id]
  );

  const form = useForm<ProjectFormValues>({
    defaultValues
  });

  // Fetch invoice details if ID is provided
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) return;

      setIsFetchingInvoice(true);
      try {
        const invoiceData = await getProformaInvoiceById(id);
        setInvoice(invoiceData);
        form.setValue('invoiceId', id);
      } catch (error: any) {
        toast.error('Failed to load invoice details');
        console.error('Error fetching invoice:', error);
      } finally {
        setIsFetchingInvoice(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, form]);

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsLoading(true);

      if (!invoice && !data.invoiceId) {
        toast.error('Invoice is required to create a project');
        return;
      }

      const projectData = {
        invoiceId: data.invoiceId,
        customerId: invoice?.customerId,
        difficulty: data.difficulty,
        requestedDelivery: data.requestedDelivery,
      };

      await createProject(projectData);
      toast.success('Project created successfully');

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
                Balancd: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(invoice.balance)}
              </Badge>
                <Badge variant="secondary" className="text-sm py-1">
                Total paid: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(invoice.amountPaid)}
              </Badge>
            </div>
          </div>
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
            Fill in the project details below. The invoice information has been pre-filled.
          </p>
        </CardHeader>
        <CardContent>
          {/* Invoice Summary */}
          {displayInvoiceInfo()}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
              {/* Hidden invoiceId field */}
              <input type="hidden" {...form.register('invoiceId')} value={id} />

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Difficulty Level with HARD as default */}
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
                        Select how challenging this project will be to complete
                      </p>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={DifficultyLevel.EASY}>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <span>Easy</span>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value={DifficultyLevel.MEDIUM}>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <span>Medium</span>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value={DifficultyLevel.HARD}>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <span>Hard</span>
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

              {/* Requested Delivery Date */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="requestedDelivery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Requested Delivery Date
                      </FormLabel>
                     
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input 
                            type="date" 
                            {...field}
                            min={new Date().toISOString().split('T')[0]}
                            className="h-12 pl-10 text-base"
                          />
                        </div>
                      </FormControl>
                   
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
                  disabled={isLoading}
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