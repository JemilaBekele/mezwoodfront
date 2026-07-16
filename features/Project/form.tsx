/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { IProject, ProjectStatus, DifficultyLevel } from '@/models/Projects';
import { getProformaInvoices } from '@/service/ProformaInvoice';
import { getProformaInvoiceById } from '@/service/ProformaInvoice';
import { createProject, updateProject } from '@/service/Project';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { Check, ChevronsUpDown, AlertCircle, Calendar, FileText, User } from 'lucide-react';

interface ProjectFormValues {
  invoiceId: string;
  difficulty: DifficultyLevel;
  requestedDelivery?: string;
  status: ProjectStatus;
}

interface ProjectFormProps {
  initialData: IProject | null;
  pageTitle: string;
}

export default function ProjectForm({
  initialData,
  pageTitle
}: ProjectFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<IProformaInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<IProformaInvoice | null>(null);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');

  // Get invoiceId from URL if provided (for creating project from invoice)
  const invoiceIdFromUrl = searchParams.get('invoiceId');

  const defaultValues = useMemo<ProjectFormValues>(
    () => ({
      invoiceId: initialData?.invoiceId || invoiceIdFromUrl || '',
      difficulty: initialData?.difficulty || DifficultyLevel.HARD, // Default to HARD
      requestedDelivery: initialData?.requestedDelivery
        ? new Date(initialData.requestedDelivery).toISOString().split('T')[0]
        : '',
      status: ProjectStatus.INVOICE // Default status
    }),
    [initialData, invoiceIdFromUrl]
  );

  const form = useForm<ProjectFormValues>({
    defaultValues
  });

  /* Fetch invoices and set default invoice */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // If we have an invoiceId from URL or initial data, fetch that specific invoice
        if (invoiceIdFromUrl && !initialData) {
          setIsFetchingInvoice(true);
          try {
            const invoice = await getProformaInvoiceById(invoiceIdFromUrl);
            setSelectedInvoice(invoice);
            form.setValue('invoiceId', invoiceIdFromUrl);
          } catch  {
            toast.error('Failed to load selected invoice');
          } finally {
            setIsFetchingInvoice(false);
          }
        }

        // Always fetch all invoices for the dropdown (in case user wants to change)
        const data = await getProformaInvoices();
        setInvoices(data || []);
      } catch {
        toast.error('Failed to load invoices');
      }
    };
    fetchData();
  }, [invoiceIdFromUrl, initialData, form]);

  // Filter invoices based on search term
  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchTerm) return invoices;
    
    return invoices.filter(invoice => {
      const searchLower = invoiceSearchTerm.toLowerCase();
      return (
        invoice.piNumber?.toLowerCase().includes(searchLower) ||
        invoice.customer?.name?.toLowerCase().includes(searchLower) ||
        invoice.customer?.companyName?.toLowerCase().includes(searchLower) ||
        invoice.id.toLowerCase().includes(searchLower)
      );
    });
  }, [invoices, invoiceSearchTerm]);

 

 const onSubmit = async (data: ProjectFormValues) => {
  try {
    setIsLoading(true);

    // Determine the invoice - use selected invoice from URL or find from list
    let invoice = selectedInvoice;
    if (!invoice && data.invoiceId) {
      invoice = invoices.find(inv => inv.id === data.invoiceId) || null;
    }

    if (!invoice && !initialData) {
      toast.error('Invoice is required to create a project');
      return;
    }

    const projectData = {
      invoiceId: data.invoiceId,
      customerId: invoice?.customerId || initialData?.customerId,
      difficulty: data.difficulty,
      requestedDelivery: data.requestedDelivery,
    };

    let response; // Declare response variable outside the blocks

    if (initialData?.id) {
      response = await updateProject(initialData.id, {
        difficulty: data.difficulty,
        requestedDelivery: data.requestedDelivery
      });
      toast.success('Project updated successfully');
    } else {
      response = await createProject(projectData);
      toast.success('Project created successfully');
    }
    // Now response is accessible here
    router.push(`/dashboard/Project/view?id=${response.data.id}`);
    router.refresh();
  } catch (error: any) {
    toast.error(error?.message || 'Failed to save project');
  } finally {
    setIsLoading(false);
  }
};

  // Display selected invoice information
  const displayInvoiceInfo = () => {
    if (selectedInvoice) {
      const itemCount = selectedInvoice.items?.length || 0;
      
      return (
        <div className="p-4 bg-linear-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-primary/20 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold text-lg">
                    Invoice: {selectedInvoice.piNumber}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {selectedInvoice.customer?.name || 'Unknown Customer'}
                  </p>
                  {selectedInvoice.customer?.companyName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedInvoice.customer.companyName}
                    </p>
                  )}
                </div>
              </div>
            
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvoice(null);
                form.setValue('invoiceId', '');
                setInvoiceSearchOpen(true);
              }}
              className="shrink-0"
            >
              Change Invoice
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Invoice Selection Section */}
            {!initialData && (
              <div className="space-y-4">
                <div>
                  <FormLabel className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Select Invoice *
                  </FormLabel>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Choose the invoice this project is based on. This cannot be changed after creation.
                  </p>
                </div>
                
                {isFetchingInvoice ? (
                  <div className="p-8 text-center border rounded-lg">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading invoice information...</p>
                  </div>
                ) : selectedInvoice ? (
                  displayInvoiceInfo()
                ) : (
                  <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <Popover open={invoiceSearchOpen} onOpenChange={setInvoiceSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={invoiceSearchOpen}
                                className="w-full justify-between h-12 text-base"
                                disabled={invoices.length === 0}
                              >
                                {field.value
                                  ? `Invoice: ${invoices.find(invoice => invoice.id === field.value)?.piNumber || 'Not found'}`
                                  : 'Search or select an invoice...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search invoices by number, customer, or ID..." 
                                value={invoiceSearchTerm}
                                onValueChange={setInvoiceSearchTerm}
                                className="h-12"
                              />
                              <CommandList>
                                <CommandEmpty className="py-6 text-center">
                                  <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-gray-600">No invoices found.</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Try a different search term
                                  </p>
                                </CommandEmpty>
                                <ScrollArea className="h-64">
                                  <CommandGroup>
                                    {filteredInvoices.map((invoice) => (
                                      <CommandItem
                                        key={invoice.id}
                                        value={invoice.id}
                                        onSelect={(currentValue) => {
                                          const selected = invoices.find(inv => inv.id === currentValue);
                                          if (selected) {
                                            field.onChange(currentValue);
                                            setSelectedInvoice(selected);
                                            setInvoiceSearchOpen(false);
                                            setInvoiceSearchTerm('');
                                          }
                                        }}
                                        className="py-3 cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-primary" />
                                              <span className="font-semibold">
                                                {invoice.piNumber}
                                              </span>
                                              {field.value === invoice.id && (
                                                <Check className="h-4 w-4 text-green-500 ml-1" />
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <User className="h-3 w-3 text-gray-500" />
                                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {invoice.customer?.name || 'Unknown Customer'}
                                              </span>
                                            </div>
                                      
                                          </div>
                                          <Badge variant="outline">
                                            {invoice.items?.length || 0} items
                                          </Badge>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </ScrollArea>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                        {invoices.length === 0 && !isFetchingInvoice && (
                          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              No invoices available. Please create an invoice first.
                            </p>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

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
                onClick={() => router.push('/dashboard/project')}
                disabled={isLoading || isFetchingInvoice}
                className="min-w-25"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isFetchingInvoice}
                className="min-w-37.5 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isLoading || isFetchingInvoice ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : initialData ? (
                  'Update Project'
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}