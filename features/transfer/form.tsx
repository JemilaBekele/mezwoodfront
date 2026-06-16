/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
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
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createTransfer, getProducts, updateTransfer } from '@/service/transfer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { ITransfer, TransferEntityType } from '@/models/transfer';
import { getStoresAll } from '@/service/store';
import { getShowroomsAll } from '@/service/showroom';

interface FormData {
  reference?: string;
  sourceType: TransferEntityType;
  sourceStoreId?: string;
  sourceShowroomId?: string;
  destinationType: TransferEntityType;
  destStoreId?: string;
  destShowroomId?: string;
  notes?: string;
  productType: 'items' | 'materials'; // New field
  items: Array<{
    productId: string;
    quantity: number;
    // For materials, we don't need batch
    batchId?: string;
  }>;
}

interface TransferFormProps {
  initialData: ITransfer | null;
  isEdit?: boolean;
}

interface AvailableProduct {
  id: string;
  name: string;
  color?: string;
  size?: string;
  price?: number;
  imageUrl?: string;
  stockQuantity: number;
  stockStatus?: string;
  // For items
  category?: string;
  type?: string;
  // For materials
  materialType?: string;
  unitOfMeasure?: string;
  plainMDF?: boolean;
  laminatedMDF?: boolean;
  wood?: boolean;
  metal?: boolean;
  accessory?: boolean;
  other?: boolean;
}

export default function TransferForm({
  initialData,
  isEdit = false
}: TransferFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [destStores, setDestStores] = useState<any[]>([]);
  const [destShowrooms, setDestShowrooms] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStoresShops, setLoadingStoresShops] = useState(true);
  
  const hasFetchedProductsRef = useRef(false);
  const lastSourceRef = useRef<string>('');
  
  const router = useRouter();

  const form = useForm<FormData>({
    defaultValues: {
      reference: initialData?.reference || '',
      sourceType: initialData?.sourceType || TransferEntityType.STORE,
      sourceStoreId: initialData?.sourceStoreId || '',
      sourceShowroomId: initialData?.sourceShowroomId || '',
      destinationType: initialData?.destinationType || TransferEntityType.STORE,
      destStoreId: initialData?.destStoreId || '',
      destShowroomId: initialData?.destShowroomId || '',
      notes: initialData?.notes || '',
      productType: 'items', // Default to items
      items: initialData?.items?.map((item) => ({
        productId: item.ismaterial ? item.materialId! : item.itemId!,
        quantity: Number(item.quantity),
        batchId: undefined // Materials don't use batches
      })) || [{ productId: '', quantity: 1 }]
    }
  });

  const sourceType = form.watch('sourceType');
  const sourceStoreId = form.watch('sourceStoreId');
  const sourceShowroomId = form.watch('sourceShowroomId');
  const destinationType = form.watch('destinationType');
  const productType = form.watch('productType');

  const currentSource = `${sourceType}-${productType}-${sourceType === TransferEntityType.STORE ? sourceStoreId : sourceShowroomId}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch stores and showrooms
  useEffect(() => {
    const fetchData = async () => {
      setLoadingStoresShops(true);
      try {
        const [storesData, showroomsData, destStoresData, destShowroomsData] = await Promise.all([
          getStoresAll(),
          getShowroomsAll(), // Assuming getShops returns showrooms
          getStoresAll(),
          getShowroomsAll(),
        ]);
        setStores(storesData);
        setShowrooms(showroomsData);
        setDestStores(destStoresData);
        setDestShowrooms(destShowroomsData);
      } catch {
        toast.error('Failed to load stores or showrooms');
      } finally {
        setLoadingStoresShops(false);
      }
    };
    fetchData();
  }, []);

  // Fetch products from source based on product type
  const fetchProductsFromSource = useCallback(async () => {
    // Don't fetch if no source is selected
    if (
      (sourceType === TransferEntityType.STORE && !sourceStoreId) ||
      (sourceType === TransferEntityType.SHOWROOM && !sourceShowroomId)
    ) {
      setAvailableProducts([]);
      hasFetchedProductsRef.current = false;
      lastSourceRef.current = '';
      return;
    }

    // Skip if we've already fetched for this source
    if (currentSource === lastSourceRef.current && hasFetchedProductsRef.current) {
      return;
    }

    console.log(`Fetching ${productType} for source: ${currentSource}`);
    
    setLoadingProducts(true);
    hasFetchedProductsRef.current = true;
    lastSourceRef.current = currentSource;

    try {
      const sourceId = sourceType === TransferEntityType.STORE ? sourceStoreId : sourceShowroomId;
      if (!sourceId) return;

      const source = sourceType === TransferEntityType.STORE ? 'store' : 'showroom';
      
      const response = await getProducts({
        type: productType,
        source: source,
        id: sourceId!
      });

      // Extract products from response
      const products = response.products || response.data || response;
      setAvailableProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products from source');
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentSource, sourceType, sourceStoreId, sourceShowroomId, productType]);

  // Debounced fetch effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductsFromSource();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchProductsFromSource]);

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

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Validate source
      if (data.sourceType === TransferEntityType.STORE && !data.sourceStoreId) {
        toast.error('Source store is required');
        setIsLoading(false);
        return;
      }

      if (data.sourceType === TransferEntityType.SHOWROOM && !data.sourceShowroomId) {
        toast.error('Source showroom is required');
        setIsLoading(false);
        return;
      }

      // Validate destination
      if (data.destinationType === TransferEntityType.STORE && !data.destStoreId) {
        toast.error('Destination store is required');
        setIsLoading(false);
        return;
      }

      if (data.destinationType === TransferEntityType.SHOWROOM && !data.destShowroomId) {
        toast.error('Destination showroom is required');
        setIsLoading(false);
        return;
      }

      // Check if source and destination are the same
      if (
        (data.sourceType === TransferEntityType.STORE && 
         data.destinationType === TransferEntityType.STORE && 
         data.sourceStoreId === data.destStoreId) ||
        (data.sourceType === TransferEntityType.SHOWROOM && 
         data.destinationType === TransferEntityType.SHOWROOM && 
         data.sourceShowroomId === data.destShowroomId)
      ) {
        toast.error('Source and destination cannot be the same');
        setIsLoading(false);
        return;
      }

      // Filter out incomplete items
      const validItems = data.items.filter(
        (item) => item.productId && item.quantity > 0
      );
      
      if (validItems.length === 0) {
        toast.error('Please add at least one valid item');
        setIsLoading(false);
        return;
      }

      // Transform items based on product type
      const transformedItems = validItems.map((item) => ({
        [data.productType === 'items' ? 'itemId' : 'materialId']: item.productId,
        quantity: Number(item.quantity),
        ismaterial: data.productType === 'materials'
      }));

      const cleanedPayload = {
        ...data,
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        sourceStoreId: data.sourceStoreId || undefined,
        sourceShowroomId: data.sourceShowroomId || undefined,
        destStoreId: data.destStoreId || undefined,
        destShowroomId: data.destShowroomId || undefined,
        items: transformedItems
      };

      delete (cleanedPayload as any).productType; // Remove productType from payload

      if (isEdit && initialData?.id) {
        await updateTransfer(initialData.id, cleanedPayload);
        toast.success('Transfer updated successfully');
        router.push(`/dashboard/Transfer/view?id=${initialData?.id}`);
      } else {
        const newTransfer = await createTransfer(cleanedPayload);
        toast.success('Transfer created successfully');
        router.push(`/dashboard/Transfer/view?id=${newTransfer.transfer.id}`);
      }
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'An error occurred while saving transfer.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted || loadingStoresShops) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Transfer' : 'Create Transfer'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <div className='border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2'></div>
              <div>Loading form...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Transfer' : 'Create Transfer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='reference'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter transfer reference'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div></div>
            </div>

            {/* Product Type Selection - First Step */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-4 text-lg font-semibold'>Step 1: Select Product Type</h3>
              <FormField
                control={form.control}
                name='productType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What do you want to transfer?</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={(value: 'items' | 'materials') => {
                        field.onChange(value);
                        // Clear items when product type changes
                        form.setValue('items', [{ productId: '', quantity: 1 }]);
                        setAvailableProducts([]);
                        hasFetchedProductsRef.current = false;
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select product type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='items'>Items (Products)</SelectItem>
                        <SelectItem value='materials'>Materials (Raw Materials)</SelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Source and Destination Section */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Source Column */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='text-lg font-semibold'>Step 2: Source Location</h3>

                <FormField
                  control={form.control}
                  name='sourceType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: TransferEntityType) => {
                          field.onChange(value);
                          if (value === TransferEntityType.STORE) {
                            form.setValue('sourceShowroomId', '');
                          } else {
                            form.setValue('sourceStoreId', '');
                          }
                          form.setValue('items', [{ productId: '', quantity: 1 }]);
                          setAvailableProducts([]);
                          hasFetchedProductsRef.current = false;
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select source type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TransferEntityType.STORE}>
                            Store
                          </SelectItem>
                          <SelectItem value={TransferEntityType.SHOWROOM}>
                            Showroom
                          </SelectItem>
                        </SelectContent>
                      </ShadcnSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {sourceType === TransferEntityType.STORE && (
                  <FormField
                    control={form.control}
                    name='sourceStoreId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('items', [{ productId: '', quantity: 1 }]);
                            setAvailableProducts([]);
                            hasFetchedProductsRef.current = false;
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select source store' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id.toString()}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {sourceType === TransferEntityType.SHOWROOM && (
                  <FormField
                    control={form.control}
                    name='sourceShowroomId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Showroom</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('items', [{ productId: '', quantity: 1 }]);
                            setAvailableProducts([]);
                            hasFetchedProductsRef.current = false;
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select source showroom' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {showrooms.map((showroom) => (
                              <SelectItem key={showroom.id} value={showroom.id.toString()}>
                                {showroom.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Destination Column */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='text-lg font-semibold'>Step 3: Destination Location</h3>

                <FormField
                  control={form.control}
                  name='destinationType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Type</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: TransferEntityType) => {
                          field.onChange(value);
                          if (value === TransferEntityType.STORE) {
                            form.setValue('destShowroomId', '');
                          } else {
                            form.setValue('destStoreId', '');
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select destination type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TransferEntityType.STORE}>
                            Store
                          </SelectItem>
                          <SelectItem value={TransferEntityType.SHOWROOM}>
                            Showroom
                          </SelectItem>
                        </SelectContent>
                      </ShadcnSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {destinationType === TransferEntityType.STORE && (
                  <FormField
                    control={form.control}
                    name='destStoreId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <ShadcnSelect value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select destination store' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {destStores.map((store) => (
                              <SelectItem key={store.id} value={store.id.toString()}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {destinationType === TransferEntityType.SHOWROOM && (
                  <FormField
                    control={form.control}
                    name='destShowroomId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Showroom</FormLabel>
                        <ShadcnSelect value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select destination showroom' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {destShowrooms.map((showroom) => (
                              <SelectItem key={showroom.id} value={showroom.id.toString()}>
                                {showroom.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Items Selection - Step 4 */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-4 text-lg font-semibold'>Step 4: Select Products to Transfer</h3>
              <FormField
                control={form.control}
                name='items'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          <div className='col-span-3'>Product</div>
                          <div>Quantity</div>
                          <div>Available Stock</div>
                          <div>Action</div>
                        </div>

                        {field.value.map((item, index) => {
                          const selectedProduct = availableProducts.find(
                            (p) => p.id === item.productId
                          );

                          const productOptions = availableProducts.map((product) => ({
                            value: product.id,
                            label: `${product.name}${product.color ? ` - ${product.color}` : ''}${product.size ? ` (${product.size})` : ''}`,
                            data: product
                          }));

                          return (
                            <div key={index} className='grid grid-cols-6 items-center gap-4'>
                              <div className='col-span-3'>
                                <Select
                                  instanceId={`product-select-${index}`}
                                  options={productOptions}
                                  onChange={(newValue: any) => {
                                    const newItems = [...field.value];
                                    newItems[index].productId = newValue?.value || '';
                                    newItems[index].quantity = 1;
                                    field.onChange(newItems);
                                  }}
                                  value={
                                    productOptions.find(
                                      (p) => p.value === item.productId
                                    ) || null
                                  }
                                  placeholder={loadingProducts ? "Loading products..." : "Search product"}
                                  isSearchable
                                  isDisabled={loadingProducts || availableProducts.length === 0}
                                  isLoading={loadingProducts}
                                  styles={isDark ? darkStyles : {}}
                                />
                                {selectedProduct && (
                                  <div className='mt-1 text-xs text-gray-500'>
                                    {productType === 'items' ? (
                                      <>
                                        {selectedProduct.category && `Category: ${selectedProduct.category}`}
                                        {selectedProduct.type && ` | Type: ${selectedProduct.type}`}
                                      </>
                                    ) : (
                                      <>
                                        {selectedProduct.materialType && `Type: ${selectedProduct.materialType}`}
                                        {selectedProduct.unitOfMeasure && ` | Unit: ${selectedProduct.unitOfMeasure}`}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <Input
                                  type='number'
                                  placeholder='Qty'
                                  value={item.quantity}
                                  min={1}
                                  max={selectedProduct?.stockQuantity || 0}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const quantity = Number(e.target.value);
                                    const maxQuantity = selectedProduct?.stockQuantity || 0;

                                    newItems[index].quantity = Math.min(
                                      isNaN(quantity) ? 0 : quantity,
                                      maxQuantity
                                    );
                                    field.onChange(newItems);
                                  }}
                                  disabled={!item.productId || loadingProducts}
                                />
                              </div>

                              <div className='text-muted-foreground text-sm'>
                                {loadingProducts ? (
                                  <div className='flex items-center gap-1'>
                                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-gray-400'></div>
                                    <span>Loading...</span>
                                  </div>
                                ) : selectedProduct ? (
                                  <span className={selectedProduct.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {selectedProduct.stockQuantity} available
                                  </span>
                                ) : (
                                  'Select product'
                                )}
                              </div>

                              <div>
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  onClick={() => {
                                    const newItems = [...field.value];
                                    newItems.splice(index, 1);
                                    field.onChange(newItems);
                                  }}
                                  disabled={field.value.length <= 1}
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                        <div className='flex justify-end'>
                          <Button
                            type='button'
                            onClick={() => {
                              field.onChange([
                                ...field.value,
                                { productId: '', quantity: 1 }
                              ]);
                            }}
                            disabled={loadingProducts || availableProducts.length === 0}
                          >
                            Add Item
                          </Button>
                        </div>

                        {availableProducts.length === 0 && !loadingProducts && (
                          <div className='rounded-lg bg-yellow-50 p-4 text-center text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'>
                            <p>No products available at the selected source location.</p>
                            <p className='text-sm mt-1'>Please check that you have selected the correct product type and source location.</p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter any additional notes' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='submit'
                disabled={isLoading}
                className='min-w-24'
              >
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </div>
                ) : isEdit ? (
                  'Update Transfer'
                ) : (
                  'Create Transfer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}