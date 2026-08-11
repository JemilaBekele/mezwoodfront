/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import Image from 'next/image';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IPurchase } from '@/models/purchase';
import { IMaterial } from '@/models/material';
import { getMaterials } from '@/service/material';
import { createPurchase, updatePurchase } from '@/service/purchase';
import { ISupplier } from '@/models/supplier';
import { useEffect, useState } from 'react';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { Modal } from '@/components/ui/modal';
import CreateSupplierModal from './suppliyer';
import { format } from 'date-fns';
import { getSupplier } from '@/service/supplier';
import { normalizeImagePath } from '@/lib/norm';

// TypeScript interfaces for form values
interface FormItemValues {
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface FormValues {
  invoiceNo: string;
  supplierId: string;
  purchaseDate: string;
  paymentStatus: string;
  notes?: string;
  items: FormItemValues[];
}

interface PurchaseFormProps {
  initialData: IPurchase | null;
  isEdit?: boolean;
}


// Custom Option component for react-select with image
const CustomOption = (props: any) => {
  const { data, innerRef, innerProps, isFocused, isSelected } = props;
  
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
        isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''
      } ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
    >
      {data.imageUrl ? (
        <div className="relative h-8 w-8 rounded overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
          <Image
            src={normalizeImagePath(data.imageUrl) || ''}
            alt={data.label}
            fill
            className="object-cover"
            sizes="32px"
          />
        </div>
      ) : (
        <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-600">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <span>{data.label}</span>
    </div>
  );
};

// Custom SingleValue component to show image in selected value
const CustomSingleValue = (props: any) => {
  const { data } = props;
  
  return (
    <div className="flex items-center gap-3">
      {data.imageUrl ? (
        <div className="relative h-6 w-6 rounded overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
          <Image
            src={normalizeImagePath(data.imageUrl) || ''}
            alt={data.label}
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
      ) : (
        <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-600">
          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <span>{data.label}</span>
    </div>
  );
};

export default function PurchaseForm({
  initialData,
  isEdit = false
}: PurchaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>('');
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      invoiceNo: initialData?.invoiceNo || '',
      supplierId: initialData?.supplierId?.toString() || '',
      purchaseDate: initialData?.purchaseDate
        ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
        : format(new Date(), 'yyyy-MM-dd'),
      paymentStatus: initialData?.paymentStatus || 'PENDING',
      notes: initialData?.notes || '',
      items:
        initialData?.items?.map((item) => ({
          materialId: item.materialId.toString(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        })) || []
    }
  });

  // Calculate totals
  const items = form.watch('items');
  const grandTotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0
  );
  const totalProducts = items.filter((item) => item.materialId).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch suppliers and materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersData, materialsData] = await Promise.all([
          getSupplier(),
          getMaterials()
        ]);
        setSuppliers(suppliersData);
        setMaterials(materialsData);
      } catch (error) {
        toast.error('Failed to load suppliers or materials');
      }
    };
    fetchData();
  }, []);

  const handleSupplierCreated = () => {
    setShowSupplierModal(false);
    getSupplier()
      .then(setSuppliers)
      .catch(() => {
        toast.error('Failed to refresh suppliers');
      });
  };

  const updateItemTotal = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    const totalPrice = item.quantity * item.unitPrice;

    const updatedItems = [...items];
    updatedItems[index] = { ...item, totalPrice };
    form.setValue('items', updatedItems);
  };

  const validateForm = (data: FormValues): boolean => {
    let isValid = true;

    if (!data.invoiceNo || data.invoiceNo.trim() === '') {
      form.setError('invoiceNo', {
        type: 'manual',
        message: 'Invoice No is required'
      });
      isValid = false;
    }

    if (!data.supplierId || data.supplierId.trim() === '') {
      form.setError('supplierId', {
        type: 'manual',
        message: 'Supplier is required'
      });
      isValid = false;
    }

    if (!data.purchaseDate || data.purchaseDate.trim() === '') {
      form.setError('purchaseDate', {
        type: 'manual',
        message: 'Purchase Date is required'
      });
      isValid = false;
    }

    if (!data.paymentStatus || data.paymentStatus.trim() === '') {
      form.setError('paymentStatus', {
        type: 'manual',
        message: 'Payment status is required'
      });
      isValid = false;
    }

    if (data.items.length === 0) {
      form.setError('items', {
        type: 'manual',
        message: 'At least one item is required'
      });
      isValid = false;
    }

    data.items.forEach((item, index) => {
      if (!item.materialId || item.materialId.trim() === '') {
        form.setError(`items.${index}.materialId` as any, {
          type: 'manual',
          message: 'Material is required'
        });
        isValid = false;
      }

      if (item.quantity <= 0 || isNaN(item.quantity)) {
        form.setError(`items.${index}.quantity` as any, {
          type: 'manual',
          message: 'Quantity must be greater than 0'
        });
        isValid = false;
      }

      if (item.unitPrice < 0 || isNaN(item.unitPrice)) {
        form.setError(`items.${index}.unitPrice` as any, {
          type: 'manual',
          message: 'Unit price must be positive'
        });
        isValid = false;
      }

      if (item.totalPrice < 0 || isNaN(item.totalPrice)) {
        form.setError(`items.${index}.totalPrice` as any, {
          type: 'manual',
          message: 'Total price must be positive'
        });
        isValid = false;
      }
    });

    return isValid;
  };

  const onSubmit = async (data: FormValues) => {
    form.clearErrors();

    if (!validateForm(data)) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        items: data.items.map((item) => ({
          materialId: item.materialId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        }))
      };

      if (isEdit && initialData?.id) {
        await updatePurchase(initialData.id, payload);
        toast.success('Purchase updated successfully');
      } else {
        await createPurchase(payload);
        toast.success('Purchase created successfully');
      }
      router.push('/dashboard/purchase');
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'An error occurred while saving purchase.';
      toast.error(message);
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

  const getMaterialDisplayName = (material: IMaterial) => {
    const details = [material.color, material.size].filter(Boolean).join(' - ');
    return details ? `${material.name} (${details})` : material.name;
  };

  // Helper function to get available materials (not selected in other rows)
  const getAvailableMaterials = (currentIndex: number) => {
    const selectedMaterialIds = form
      .getValues('items')
      .filter((_, idx) => idx !== currentIndex)
      .map(item => item.materialId)
      .filter(id => id);

    return materials.filter(material => !selectedMaterialIds.includes(material.id));
  };

  // Get all available materials for the Add button (excluding all selected materials)
  const getAllAvailableMaterials = () => {
    const selectedMaterialIds = form
      .getValues('items')
      .map(item => item.materialId)
      .filter(id => id);

    return materials.filter(material => !selectedMaterialIds.includes(material.id));
  };

  // Handle image click to open in modal
  const handleImageClick = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      if (material.imageUrl) {
        setSelectedImageUrl(normalizeImagePath(material.imageUrl) || null);
        setSelectedMaterialName(getMaterialDisplayName(material));
        setShowImageModal(true);
      } else {
        toast.info('No image available for this material');
      }
    }
  };

  if (!isMounted) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase' : 'Create Purchase'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const allAvailableMaterials = getAllAvailableMaterials();

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase' : 'Create Purchase'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='invoiceNo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice No</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter invoice number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <div className='flex gap-2'>
                        <div className='flex-1'>
                          <Select
                            instanceId='supplier-select'
                            options={suppliers.map((supplier) => ({
                              value: supplier?.id?.toString() ?? '',
                              label: supplier?.name ?? 'Unnamed Supplier'
                            }))}
                            onChange={(newValue) =>
                              field.onChange(newValue?.value || '')
                            }
                            value={suppliers
                              .map((s) => ({
                                value: s?.id?.toString() ?? '',
                                label: s?.name ?? 'Unnamed Supplier'
                              }))
                              .find((s) => s.value === field.value)}
                            placeholder='Search for a supplier'
                            isSearchable
                            styles={isDark ? darkStyles : {}}
                          />
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => setShowSupplierModal(true)}
                        >
                          <IconPlus size={16} />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='purchaseDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='items'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Items</FormLabel>
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-6 gap-4 text-sm font-semibold'>
                          <div className='col-span-2'>Material</div>
                          <div>Quantity</div>
                          <div>Purchase Price</div>
                          <div>Total</div>
                          <div>Image</div>
                        </div>

                        {field.value.map((item, index) => {
                          const selectedMaterial = materials.find(
                            m => m.id === item.materialId
                          );
                          
                          // Get available materials excluding already selected ones
                          const availableMaterials = getAvailableMaterials(index);
                          
                          // Check if current material is already selected elsewhere
                          const isMaterialAlreadySelected = form
                            .getValues('items')
                            .some((i, idx) => idx !== index && i.materialId === item.materialId);
                          
                          return (
                            <div
                              key={index}
                              className='grid grid-cols-6 items-center gap-4'
                            >
                              {/* Material */}
                              <div className='col-span-2'>
                                <Select
                                  instanceId={`material-select-${index}`}
                                  options={availableMaterials.map((material) => ({
                                    value: material.id.toString(),
                                    label: getMaterialDisplayName(material),
                                    imageUrl: material.imageUrl
                                  }))}
                                  onChange={(newValue) => {
                                    const newItems = [...field.value];
                                    newItems[index].materialId =
                                      newValue?.value || '';
                                    field.onChange(newItems);
                                  }}
                                  value={
                                    item.materialId && selectedMaterial
                                      ? {
                                          value: item.materialId,
                                          label: getMaterialDisplayName(selectedMaterial),
                                          imageUrl: selectedMaterial.imageUrl
                                        }
                                      : null
                                  }
                                  placeholder='Search material'
                                  isSearchable
                                  styles={isDark ? darkStyles : {}}
                                  isDisabled={isMaterialAlreadySelected && !!item.materialId}
                                  components={{
                                    Option: CustomOption,
                                    SingleValue: CustomSingleValue
                                  }}
                                />
                                {isMaterialAlreadySelected && item.materialId && (
                                  <p className='text-xs text-red-500 mt-1'>
                                    This material is already selected in another row
                                  </p>
                                )}
                              </div>

                              {/* Quantity */}
                              <div>
                                <Input
                                  type='number'
                                  placeholder='Qty'
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const quantity = Number(e.target.value);
                                    newItems[index].quantity = isNaN(quantity)
                                      ? 0
                                      : quantity;
                                    newItems[index].totalPrice =
                                      newItems[index].quantity *
                                      newItems[index].unitPrice;
                                    field.onChange(newItems);
                                    updateItemTotal(index);
                                  }}
                                />
                              </div>

                              {/* Unit Price */}
                              <div>
                                <Input
                                  type='number'
                                  placeholder='Price'
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const unitPrice = Number(e.target.value);
                                    newItems[index].unitPrice = isNaN(unitPrice)
                                      ? 0
                                      : unitPrice;
                                    newItems[index].totalPrice =
                                      newItems[index].quantity *
                                      newItems[index].unitPrice;
                                    field.onChange(newItems);
                                    updateItemTotal(index);
                                  }}
                                />
                              </div>

                              {/* Total Price */}
                              <div className='flex items-center justify-center'>
                                <span className='text-sm font-medium'>
                                  {(item.quantity * item.unitPrice).toFixed(2)}
                                </span>
                              </div>

                              {/* Image Display - Clickable to view larger */}
                              <div className='flex items-center justify-center'>
                                {item.materialId && selectedMaterial ? (
                                  <div 
                                    className={`relative h-12 w-12 rounded overflow-hidden border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary transition-all duration-200 ${
                                      selectedMaterial.imageUrl ? 'hover:scale-105' : ''
                                    }`}
                                    onClick={() => handleImageClick(item.materialId)}
                                    title={selectedMaterial.imageUrl ? 'Click to view larger' : 'No image available'}
                                  >
                                    {selectedMaterial.imageUrl ? (
                                      <Image
                                        src={normalizeImagePath(selectedMaterial.imageUrl) || ''}
                                        alt={getMaterialDisplayName(selectedMaterial)}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                    {selectedMaterial.imageUrl && (
                                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-12 w-12 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">No mat.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Summary Row */}
                        <div className='grid grid-cols-6 items-center gap-4 border-t pt-4'>
                          <div className='col-span-4 text-right font-semibold'>
                            Summary:
                          </div>
                          <div className='text-center text-lg font-bold'>
                            {grandTotal.toFixed(2)}
                          </div>
                          <div className='flex items-center justify-center gap-2'>
                            <Button
                              type='button'
                              variant='destructive'
                              size='sm'
                              onClick={() => {
                                // Remove last item
                                const newItems = [...field.value];
                                newItems.pop();
                                field.onChange(newItems);
                              }}
                              disabled={field.value.length <= 1}
                            >
                              <IconTrash size={16} />
                            </Button>
                            <Button
                              type='button'
                              onClick={() => {
                                field.onChange([
                                  ...field.value,
                                  {
                                    materialId: '',
                                    quantity: 1,
                                    unitPrice: 0,
                                    totalPrice: 0
                                  }
                                ]);
                              }}
                              disabled={allAvailableMaterials.length === 0}
                            >
                              <IconPlus size={16} />
                            </Button>
                          </div>
                        </div>

                        <div className='flex justify-between items-center'>
                          <div className='text-sm'>
                            Total Products: {totalProducts}
                          </div>
                          {allAvailableMaterials.length === 0 && field.value.length > 0 && (
                            <p className='text-sm text-yellow-600'>
                              No more materials available to add.
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grand Total Display */}
              <div className='rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <div className='text-lg font-semibold'>Grand Total</div>
                  <div className='text-2xl font-bold text-green-600'>
                    {grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter notes (optional)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button type='submit' disabled={isLoading}>
                  {isEdit ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Supplier Creation Modal */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title='Create New Supplier'
        description={''}
      >
        <CreateSupplierModal
          closeModal={() => setShowSupplierModal(false)}
          onSuccess={handleSupplierCreated}
        />
      </Modal>

      {/* Image View Modal - Big Image Preview */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        title={`Material: ${selectedMaterialName}`}
        description='Click outside or press ESC to close'
      >
        <div className="relative w-full max-h-[70vh] flex items-center justify-center">
          {selectedImageUrl ? (
            <div className="relative w-full h-[60vh]">
              <Image
                src={selectedImageUrl}
                alt={selectedMaterialName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[60vh] w-full bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No image available</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImageModal(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}