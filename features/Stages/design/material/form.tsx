/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

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
import { useForm, useFieldArray } from 'react-hook-form';
import { updateProformaInvoice } from '@/service/ProformaInvoice';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IProformaInvoice, IProformaInvoiceItem, IProformaItemMaterial } from '@/models/ProformaInvoice';
import { Textarea } from '@/components/ui/textarea';
import Select from 'react-select';
import { Plus, Trash2,  Image as ImageIcon, Package, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { getCustomer } from '@/service/customer';
import { getMaterials, getMaterialStockById } from '@/service/material';
import { getItems } from '@/service/item';
import { normalizeImagePath } from '@/lib/norm';
import { Badge } from '@/components/ui/badge';
import MaterialModal from '@/features/material/modal';

interface ProformaInvoiceFormValues {
  customerId: string;
  subtotal: number;
  vat: number;
  vatPercent: number | null;
  vatApplied: boolean;
  total: number;
  amountDate?: Date | string;
  items: IProformaInvoiceItem[];
  attachments?: File[];
}

interface SelectOption {
  value: string;
  label: string;
}

interface ProformaInvoiceFormProps {
  initialData: IProformaInvoice | null;
  pageTitle: string;
}

interface IItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  itemMaterials?: {
    materialId: string;
    quantity: number;
    note?: string;
    material?: {
      id: string;
      name: string;
      color: string;
      size: string;
    }
  }[];
}

interface ImageFileWithPreview {
  file?: File;
  preview: string;
  isExisting?: boolean;
  existingUrl?: string;
}

// Extended material type for display
interface ExtendedMaterial extends IProformaItemMaterial {
  material?: any;
}

export default function DesignProformaInvoiceForm({
  initialData,
  pageTitle
}: ProformaInvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [items, setItems] = useState<IItem[]>([]);
  const [attachments, ] = useState<File[]>([]);
  const [itemImages, setItemImages] = useState<Map<number, ImageFileWithPreview[]>>(new Map());
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  
  // State for stock information
  const [materialStock, setMaterialStock] = useState<Map<string, { available: number; isOutOfStock: boolean }>>(new Map());
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  
  // Ensure we have initialData for update
  if (!initialData) {
    throw new Error('This form is only for updating existing proforma invoices. No initial data provided.');
  }
  
  const defaultValues = useMemo<ProformaInvoiceFormValues>(
    () => ({
      customerId: initialData?.customerId || '',
      subtotal: initialData?.subtotal || 0,
      vat: initialData?.vat || 0,
      vatPercent: 15,
      vatApplied: initialData?.vat ? true : false,
      total: initialData?.total || 0,
      amountDate: initialData?.amountDate || new Date(),
      items: initialData?.items?.map((item) => ({
        ...item,
        size: item.size || '',
        additionalDescription: item.additionalDescription || '',
        materials: (item.proformaItemMaterials?.map((material) => ({
          id: material.id,
          itemId: material.itemId,
          materialId: material.materialId,
          quantity: material.quantity,
          note: material.note || '',
          material: material.material
        })) as ExtendedMaterial[]) || [],
        images: item.images || []
      })) || [
        {
          id: '',
          invoiceId: '',
          description: '',
          size: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          additionalDescription: '',
          materials: [],
          images: []
        }
      ],
      attachments: []
    }),
    [initialData]
  );

  const form = useForm<ProformaInvoiceFormValues>({
    defaultValues
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  // Function to check material stock
  const checkMaterialStock = useCallback(
    async (materialId: string) => {
      if (!materialId) return;
      
      // Skip if we already have stock info
      if (materialStock.has(materialId)) return;
      
      try {
        const stockData = await getMaterialStockById(materialId);
        const availableQuantity = stockData?.material?.availableStock || 0;
        
        setMaterialStock(prev => new Map(prev).set(materialId, {
          available: availableQuantity,
          isOutOfStock: availableQuantity <= 0
        }));
      } catch (error) {
        console.error('Failed to fetch stock for material:', materialId, error);
        setMaterialStock(prev => new Map(prev).set(materialId, {
          available: 0,
          isOutOfStock: true
        }));
      }
    },
    [materialStock]
  );

  // Function to load stock for all existing materials
  const loadExistingMaterialsStock = useCallback(async () => {
    const itemsList = form.getValues('items');
    const materialIdsToCheck: string[] = [];
    
    // Collect all unique material IDs from existing items
    itemsList.forEach(item => {
      if (item.materials && item.materials.length > 0) {
        item.materials.forEach(material => {
          if (material.materialId && !materialStock.has(material.materialId)) {
            materialIdsToCheck.push(material.materialId);
          }
        });
      }
    });
    
    // Remove duplicates
    const uniqueMaterialIds = [...new Set(materialIdsToCheck)];
    
    if (uniqueMaterialIds.length > 0) {
      setIsLoadingStock(true);
      try {
        // Check stock for all existing materials
        await Promise.all(uniqueMaterialIds.map(id => checkMaterialStock(id)));
      } catch (error) {
        console.error('Error loading stock for existing materials:', error);
      } finally {
        setIsLoadingStock(false);
      }
    }
  }, [checkMaterialStock, form, materialStock]);

  // Initialize item images from initial data using normalizeImagePath
  useEffect(() => {
    if (initialData?.items) {
      const newImagesMap = new Map<number, ImageFileWithPreview[]>();
      
      initialData.items.forEach((item, index) => {
        if (item.images && item.images.length > 0) {
          const images: ImageFileWithPreview[] = item.images.map(img => ({
            preview: normalizeImagePath(img.imageUrl) || img.imageUrl,
            isExisting: true,
            existingUrl: img.imageUrl
          }));
          newImagesMap.set(index, images);
        }
      });
      
      setItemImages(newImagesMap);
    }
  }, [initialData]);

  // Load stock for existing materials when form is ready
  useEffect(() => {
    if (form.getValues('items').length > 0) {
      loadExistingMaterialsStock();
    }
  }, [form, loadExistingMaterialsStock]);

  // Fetch customers, materials, and items on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, materialsData] = await Promise.all([
          getCustomer(),
          getMaterials()
        ]);
        setCustomers(customersData || []);
        setMaterials(materialsData || []);
        
        await fetchItems();
      } catch {
        toast.error('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

  const fetchItems = async () => {
    try {
      setIsFetchingItems(true);
      const itemsData = await getItems();
      setItems(itemsData || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setIsFetchingItems(false);
    }
  };

  const refreshItems = async () => {
    await fetchItems();
    toast.success('Items refreshed');
  };

  const customerOptions: SelectOption[] = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.name}`
      })),
    [customers]
  );

const materialOptions: SelectOption[] = useMemo(
  () => [
    { value: '', label: 'Select a material' },
    ...materials.map((material) => {
      const details: string[] = [];

      if (material.color?.trim()) {
        details.push(material.color);
      }

      if (material.size?.trim()) {
        details.push(material.size);
      }

      // Material type
      if (material.plainMDF) {
        details.push('Plain MDF');
      } else if (material.laminatedMDF) {
        details.push('Laminated MDF');
      } else if (material.wood) {
        details.push('Wood');
      } else if (material.metal) {
        details.push('Metal');
      } else if (material.accessory) {
        details.push('Accessory');
      } else if (material.other) {
        details.push('Other');
      }

      return {
        value: material.id,
        label: details.length
          ? `${material.name} (${details.join(' - ')})`
          : material.name,
      };
    }),
  ],
  [materials]
);

  const refreshMaterials = async () => {
    try {
      const materialsData = await getMaterials();
      setMaterials(materialsData || []);
      toast.success('Materials refreshed');
    } catch  {
      toast.error('Failed to refresh materials');
    }
  };



  const calculateItemAmount = (index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    const amount = quantity * unitPrice;
    form.setValue(`items.${index}.amount`, amount);
    calculateTotals();
  };

  const calculateTotals = () => {
    const itemsList = form.getValues('items');
    const subtotal = itemsList.reduce((sum, item) => sum + item.amount, 0);
    
    const vatApplied = form.getValues('vatApplied');
    const vatPercent = form.getValues('vatPercent') || 15;
    
    const vat = vatApplied ? subtotal * (vatPercent / 100) : 0;
    const total = subtotal + vat;

    form.setValue('subtotal', subtotal);
    form.setValue('vat', vat);
    form.setValue('total', total);
    
    if (vatApplied) {
      form.setValue('vatPercent', 15);
    }
  };



  const addItem = () => {
    appendItem({
      id: '',
      invoiceId: '',
      description: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      additionalDescription: '',
      materials: [],
      images: [],
    });
  };

  const addMaterialToItem = (itemIndex: number) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (item) {
      const updatedMaterials: ExtendedMaterial[] = [
        ...(item.materials as ExtendedMaterial[] || []),
        {
          id: '',
          itemId: item.id || '',
          materialId: '',
          quantity: 1,
          note: '',
        materialIssues: [] // Add this - required by ExtendedMaterial
          
        }
      ];
      
      form.setValue(`items.${itemIndex}.materials`, updatedMaterials);
    }
  };

  const removeMaterialFromItem = (itemIndex: number, materialIndex: number) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (item && item.materials) {
      const updatedMaterials = item.materials.filter((_, idx) => idx !== materialIndex);
      form.setValue(`items.${itemIndex}.materials`, updatedMaterials);
    }
  };

  const updateMaterialInItem = (
    itemIndex: number, 
    materialIndex: number, 
    field: keyof IProformaItemMaterial, 
    value: any
  ) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (item && item.materials) {
      const updatedMaterials = [...item.materials];
      updatedMaterials[materialIndex] = {
        ...updatedMaterials[materialIndex],
        [field]: value
      };
      
      form.setValue(`items.${itemIndex}.materials`, updatedMaterials);
      
      // Check stock when material is selected
      if (field === 'materialId' && value) {
        checkMaterialStock(value);
      }
      
      // Show warning when quantity exceeds available stock
      if (field === 'quantity' && value) {
        const materialId = updatedMaterials[materialIndex].materialId;
        if (materialId) {
          const stockInfo = materialStock.get(materialId);
          if (stockInfo && value > stockInfo.available && stockInfo.available > 0) {
            toast.warning(`Warning: Quantity (${value}) exceeds available stock (${stockInfo.available}) for this material!`, {
              duration: 4000,
              icon: <AlertTriangle className="h-4 w-4" />
            });
          } else if (stockInfo && stockInfo.isOutOfStock) {
            toast.warning(`Warning: This material is out of stock!`, {
              duration: 4000,
              icon: <AlertTriangle className="h-4 w-4" />
            });
          }
        }
      }
    }
  };


  const onSubmit = async (data: ProformaInvoiceFormValues) => {
    // Check for any quantity warnings before submitting
    // let hasWarnings = false;
    
    // data.items.forEach(item => {
    //   if (item.materials) {
    //     item.materials.forEach(material => {
    //       if (material.materialId) {
    //         const stockInfo = materialStock.get(material.materialId);
    //         if (stockInfo && material.quantity > stockInfo.available && stockInfo.available > 0) {
    //           hasWarnings = true;
    //           const materialName = materials.find(m => m.id === material.materialId)?.name || 'Material';
    //           toast.warning(`${materialName}: Quantity (${material.quantity}) exceeds available stock (${stockInfo.available})`, {
    //             duration: 5000,
    //           });
    //         } else if (stockInfo && stockInfo.isOutOfStock) {
    //           hasWarnings = true;
    //           const materialName = materials.find(m => m.id === material.materialId)?.name || 'Material';
    //           toast.warning(`${materialName} is out of stock!`, {
    //             duration: 5000,
    //           });
    //         }
    //       }
    //     });
    //   }
    // });
    
    // if (hasWarnings) {
    //   toast.warning('Some materials have stock issues. You can still proceed with the update.', {
    //     duration: 5000,
    //   });
    // }
    
    try {
      setIsLoading(true);

      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'items' && key !== 'attachments') {
          if (value !== undefined && value !== null) {
            if (value instanceof Date) {
              formData.append(key, value.toISOString());
            } else {
              formData.append(key, value.toString());
            }
          }
        }
      });

      // Prepare items with materials and images
      const itemsWithData = data.items.map((item, index) => {
        const itemImagesData = itemImages.get(index) || [];
        
        // Separate existing images and new uploads
        const existingImages = itemImagesData
          .filter(img => img.isExisting && img.existingUrl)
          .map(img => ({
            id: img.existingUrl?.split('/').pop() || '',
            itemId: item.id || '',
            imageUrl: img.existingUrl!,
            createdAt: new Date().toISOString()
          }));
        
        const newImages = itemImagesData
          .filter(img => !img.isExisting && img.file)
          .map(img => ({
            id: '',
            itemId: item.id || '',
            imageUrl: img.file!.name,
            createdAt: new Date().toISOString()
          }));
        
        return {
          ...item,
          itemIndex: index,
          proformaItemMaterials: item.materials?.map(material => ({
            id: material.id || '',
            materialId: material.materialId,
            quantity: material.quantity,
            note: material.note || ''
          })) || [],
          images: [...existingImages, ...newImages]
        };
      });

      formData.append('items', JSON.stringify(itemsWithData));

      // Append new image files
      itemImages.forEach((images, itemIndex) => {
        images.forEach((img, imgIndex) => {
          if (!img.isExisting && img.file) {
            formData.append(`items[${itemIndex}].images[${imgIndex}]`, img.file);
          }
        });
      });

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

     // Only update operation
await updateProformaInvoice(initialData.id, formData);

toast.success('Proforma Invoice updated successfully');

router.push(`/dashboard/Stage/Design/mydesign`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Error updating proforma invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f9fafb'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#f9fafb'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f9fafb'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    input: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af'
    })
  };


  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{pageTitle}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshItems}
              disabled={isFetchingItems}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingItems ? 'animate-spin' : ''}`} />
              Refresh Items
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                name="customerId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <Select
                        options={customerOptions}
                        value={customerOptions.find(option => option.value === field.value)}
                        onChange={(option) => field.onChange(option?.value)}
                        placeholder="Select customer"
                        isSearchable
                        styles={isDark ? darkStyles : {}}
                        isDisabled={true} // Read-only
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                name="amountDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        readOnly={true} // Read-only
                        className="bg-gray-50 dark:bg-gray-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-6">
              <div className="mb-4 flex items-center justify-between">
                <CardTitle className="text-lg">Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="flex items-center gap-2"
                  disabled={true} // Disable adding new items
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {itemFields.map((field, itemIndex) => {
                  const currentMaterials = form.watch(`items.${itemIndex}.materials`) || [];
                  
                  return (
                    <div
                      key={field.id}
                      className="space-y-4 rounded-lg border p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-5">
                         <FormField
                          control={form.control}
                          name={`items.${itemIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Item description"
                                  {...field}
                                  rows={2}
                                  readOnly={true} // Read-only
                                  className="bg-gray-50 dark:bg-gray-900"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        </div>

                        <div className="md:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qty</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(parseInt(e.target.value) || 1);
                                      calculateItemAmount(itemIndex);
                                    }}
                                    readOnly={true} // Read-only
                                    className="bg-gray-50 dark:bg-gray-900"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>


                      
                      </div>

                     

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${itemIndex}.size`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Large, 10x10"
                                  {...field}
                                  readOnly={true} // Read-only
                                  className="bg-gray-50 dark:bg-gray-900"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={form.control}
                          name={`items.${itemIndex}.additionalDescription`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Extra details about the item"
                                  {...field}
                                  rows={2}
                                  readOnly={true} // Read-only
                                  className="bg-gray-50 dark:bg-gray-900"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 border-t pt-4">
                        <div className="mb-3 flex items-center justify-between">
                          <CardTitle className="text-md flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Materials for this Item (Editable)
                            {currentMaterials.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {currentMaterials.length} material(s)
                              </Badge>
                            )}
                            {isLoadingStock && (
                              <Badge variant="outline" className="text-xs">
                                Loading stock...
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={refreshMaterials}
                              className="flex items-center gap-2"
                            >
                              Refresh Materials
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addMaterialToItem(itemIndex)}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Material
                            </Button>
                          </div>
                        </div>

                        {currentMaterials.length > 0 ? (
                          <div className="space-y-3">
                            {currentMaterials.map((material, materialIndex) => {
                              const stockInfo = material.materialId ? materialStock.get(material.materialId) : null;
                              const isQuantityExceeded = stockInfo && material.quantity > stockInfo.available && stockInfo.available > 0;
                              const isOutOfStock = stockInfo && stockInfo.isOutOfStock;
                              
                              return (
                              <div key={materialIndex} className={`grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-12 `}>
                                <div className="md:col-span-5">
                                  <FormLabel>Material</FormLabel>
                                  <Select
                                    options={materialOptions}
                                    value={materialOptions.find(option => option.value === material.materialId)}
                                    onChange={(option) => updateMaterialInItem(itemIndex, materialIndex, 'materialId', option?.value || '')}
                                    placeholder="Select material"
                                    styles={isDark ? darkStyles : {}}
                                    isDisabled={false} // Editable
                                  />
                               
                                  {/* Stock information display */}
                                  {material.materialId && (
                                    stockInfo ? (
                                      <div className="flex items-center gap-1 mt-1">
                                        {isQuantityExceeded && (
                                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                        )}
                                        {isOutOfStock && (
                                          <AlertTriangle className="h-3 w-3 text-red-600" />
                                        )}
                                        <p className={`text-xs ${isQuantityExceeded ? 'text-yellow-600 font-medium' : isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                          {isOutOfStock ? '⚠️ Out of Stock' : 
                                           isQuantityExceeded ? `⚠️ Exceeds stock! (${stockInfo.available} available)` : 
                                           `${stockInfo.available} available`}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs mt-1 text-gray-400">
                                        Checking stock...
                                      </p>
                                    )
                                  )}
                                </div>

                                <div className="md:col-span-2">
                                  <FormLabel>Quantity</FormLabel>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={material.quantity}
                                    onChange={(e) => updateMaterialInItem(itemIndex, materialIndex, 'quantity', parseInt(e.target.value) || 1)}
                                    placeholder="Qty"
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <FormLabel>Note</FormLabel>
                                  <Input
                                    value={material.note || ''}
                                    onChange={(e) => updateMaterialInItem(itemIndex, materialIndex, 'note', e.target.value)}
                                    placeholder="Optional note"
                                    className="border-blue-200 focus-visible:ring-blue-500"
                                  />
                                </div>

                                <div className="md:col-span-2 flex items-end">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeMaterialFromItem(itemIndex, materialIndex)}
                                    className="w-full"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )})}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed p-8 text-center">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              No materials added for this item yet.
                            </p>
                            <p className="text-xs text-gray-400">
                              Click &quot;Add Material&quot; to add materials to this item
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Multiple Images Section - Read-only */}
                      <div className="mt-4 border-t pt-4">
                        <FormLabel className="flex items-center gap-2 mb-3">
                          <ImageIcon className="h-4 w-4" />
                          Item Images (View Only)
                          {(itemImages.get(itemIndex)?.length || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {(itemImages.get(itemIndex)?.length || 0)} image(s)
                            </Badge>
                          )}
                        </FormLabel>
                        
                        <div className="space-y-4">
                          {/* Image Gallery - Read-only */}
                          {(itemImages.get(itemIndex)?.length || 0) > 0 && (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                              {itemImages.get(itemIndex)?.map((image, imageIndex) => (
                                <div key={imageIndex} className="relative group">
                                  <div className="relative aspect-square rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                      src={image.preview}
                                      alt={`Item ${itemIndex + 1} image ${imageIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                      }}
                                    />
                                    
                                    {/* Image Info Badge */}
                                    {image.isExisting && (
                                      <div className="absolute top-1 left-1">
                                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">
                                          Existing
                                        </Badge>
                                      </div>
                                    )}
                                    
                                    {/* View Button */}
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="icon"
                                      className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => window.open(image.preview, '_blank')}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {(!itemImages.get(itemIndex) || itemImages.get(itemIndex)?.length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2">No images available for this item</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          

        

            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Materials'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}