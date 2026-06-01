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
import { getStores, getStoresall } from '@/service/store';
import { getShops, getShopsall } from '@/service/shop';
import { createTransfer, updateTransfer } from '@/service/transfer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { ITransfer, TransferEntityType } from '@/models/transfer';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import { Label } from '@/components/ui/label';

interface FormData {
  reference?: string;
  sourceType: TransferEntityType;
  sourceStoreId?: string;
  sourceShopId?: string;
  destinationType: TransferEntityType;
  destStoreId?: string;
  destShopId?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity?: number;
    height?: number;
    width?: number;
    variantId?: string;
  }>;
}

interface TransferFormProps {
  initialData: ITransfer | null;
  isEdit?: boolean;
}

interface StoreStockItem {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  status: string;
  unitOfMeasureId: string;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    branchId: string;
  };
  product: {
    id: string;
    productCode: string;
    name: string;
    generic: string | null;
    description: string | null;
    sellPrice: number | null;
    imageUrl: string;
    isActive: boolean;
    warningQuantity: number;
    category: any;
    colour: {
      id: string;
      name: string;
    } | null;
    unitOfMeasure: IUnitOfMeasure;
  };
  unitOfMeasure: IUnitOfMeasure;
  availableQuantity: number;
  conversionFactor: number;
  variants?: Array<{
    id: string;
    height: number;
    width: number;
    quantity: number;
    area: number;
  }>;
  stockType: 'dimension' | 'quantity';
  hasVariants: boolean;
}

export default function TransferForm({
  initialData,
  isEdit = false
}: TransferFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [disstores, setDisstores] = useState<any[]>([]);
  const [disshops, setDisshops] = useState<any[]>([]);
  const [storeStockItems, setStoreStockItems] = useState<StoreStockItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStoresShops, setLoadingStoresShops] = useState(true);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  
  const hasFetchedProductsRef = useRef(false);
  const lastSourceRef = useRef<string>('');
  
  const router = useRouter();

  const form = useForm<FormData>({
    defaultValues: {
      reference: initialData?.reference || '',
      sourceType: initialData?.sourceType || TransferEntityType.STORE,
      sourceStoreId: initialData?.sourceStoreId || '',
      sourceShopId: initialData?.sourceShopId || '',
      destinationType: initialData?.destinationType || TransferEntityType.STORE,
      destStoreId: initialData?.destStoreId || '',
      destShopId: initialData?.destShopId || '',
      notes: initialData?.notes || '',
      items: initialData?.items?.map((item: any) => ({
        productId: item.productId.toString(),
        quantity: item.quantity ? Number(item.quantity) : undefined,
        height: item.height,
        width: item.width,
        variantId: item.variantId
      })) || [{ productId: '', quantity: undefined }]
    }
  });

  const sourceType = form.watch('sourceType');
  const sourceStoreId = form.watch('sourceStoreId');
  const sourceShopId = form.watch('sourceShopId');
  const destinationType = form.watch('destinationType');
  const items = form.watch('items');

  const currentSource = `${sourceType}-${sourceType === TransferEntityType.STORE ? sourceStoreId : sourceShopId}`;

  // Check if a product is already selected
  const isProductSelected = (productId: string, currentIndex: number): boolean => {
    return items.some((item, idx) => idx !== currentIndex && item.productId === productId);
  };

  // Get available products (excluding already selected ones)
  const getAvailableProducts = (currentIndex: number) => {
    const selectedProductIds = items
      .filter((_, idx) => idx !== currentIndex)
      .map(item => item.productId)
      .filter(id => id);
    
    return storeStockItems.filter(stockItem => !selectedProductIds.includes(stockItem.product.id.toString()));
  };

  const getUniqueProducts = (): StoreStockItem[] => {
    const seenProductIds = new Set<string>();
    return storeStockItems.filter((item) => {
      if (!seenProductIds.has(item.product.id)) {
        seenProductIds.add(item.product.id);
        return true;
      }
      return false;
    });
  };

  const getUnitOfMeasureForProduct = (productId: string): IUnitOfMeasure | null => {
    const productItem = storeStockItems.find(item => item.product.id === productId);
    return productItem?.product.unitOfMeasure || productItem?.unitOfMeasure || null;
  };

  const getVariantsForProduct = (productId: string): StoreStockItem['variants'] => {
    const productItem = storeStockItems.find(item => item.product.id === productId);
    return productItem?.variants || [];
  };

  const productHasVariants = (productId: string): boolean => {
    const productItem = storeStockItems.find(item => item.product.id === productId);
    return productItem?.hasVariants || false;
  };

  const formatProductLabel = (product: any): string => {
    const productName = product.name || 'Unknown Product';
    const colourName = product.colour?.name;
    
    if (colourName) {
      return `${productName} - ${colourName}`;
    }
    return productName;
  };

  const formatVariantLabel = (variant: any): string => {
    return `${variant.height} x ${variant.width}`;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStoresShops(true);
      try {
        const [storesData, shopsData, disstoresData, disshopsData] = await Promise.all([
          getStores(),
          getShops(),
          getShopsall(),
          getStoresall(),
        ]);
        setStores(storesData);
        setShops(shopsData);
        setDisshops(disstoresData);
        setDisstores(disshopsData);
      } catch  {
        toast.error('Failed to load stores or shops');
      } finally {
        setLoadingStoresShops(false);
      }
    };
    fetchData();
  }, []);

  const fetchProductsFromSource = useCallback(async () => {
    if (
      (sourceType === TransferEntityType.STORE && !sourceStoreId) ||
      (sourceType === TransferEntityType.SHOP && !sourceShopId)
    ) {
      setStoreStockItems([]);
      hasFetchedProductsRef.current = false;
      lastSourceRef.current = '';
      setInitialSyncDone(false);
      return;
    }

    if (currentSource === lastSourceRef.current && hasFetchedProductsRef.current) {
      return;
    }
    
    setLoadingProducts(true);
    hasFetchedProductsRef.current = true;
    lastSourceRef.current = currentSource;

    try {
      const sourceId = sourceType === TransferEntityType.STORE ? sourceStoreId : sourceShopId;
      if (!sourceId) return;

      const storeStockData = await getAvailableProductsBySource(sourceType, sourceId);
      setStoreStockItems(storeStockData);
    } catch {
      toast.error('Failed to load products from source');
      setStoreStockItems([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentSource, sourceType, sourceStoreId, sourceShopId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductsFromSource();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchProductsFromSource]);

  useEffect(() => {
    if (isEdit && storeStockItems.length > 0 && items.length > 0 && !initialSyncDone) {
      const updatedItems = items.map((item) => {
        if (!item.productId) return item;

        const stockItem = storeStockItems.find(
          (stock) => stock.product.id.toString() === item.productId
        );

        if (stockItem?.hasVariants && item.height && item.width) {
          const matchingVariant = stockItem.variants?.find(
            (v) => 
              Math.abs(v.height - (item.height || 0)) < 0.01 && 
              Math.abs(v.width - (item.width || 0)) < 0.01
          );

          if (matchingVariant && (!item.variantId || item.variantId !== matchingVariant.id)) {
            return {
              ...item,
              variantId: matchingVariant.id
            };
          }
        }
        
        return item;
      });

      const hasChanges = updatedItems.some((item, index) => 
        item.variantId !== items[index].variantId
      );

      if (hasChanges) {
        form.setValue('items', updatedItems);
      }
      
      setInitialSyncDone(true);
    }
  }, [isEdit, storeStockItems, items, form, initialSyncDone]);

  const handleProductChange = (index: number, productId: string) => {
    const newItems = [...items];
    newItems[index].productId = productId;
    newItems[index].quantity = undefined;
    newItems[index].height = undefined;
    newItems[index].width = undefined;
    newItems[index].variantId = undefined;
    form.setValue('items', newItems);
  };

  const handleVariantChange = (index: number, variant: any) => {
    const newItems = [...items];
    newItems[index].height = variant.height;
    newItems[index].width = variant.width;
    newItems[index].variantId = variant.id;
    newItems[index].quantity = undefined;
    form.setValue('items', newItems);
    form.trigger(`items.${index}.quantity`);
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
      color: '#f9fafb',
      cursor: state.isDisabled ? 'not-allowed' : 'default',
      opacity: state.isDisabled ? 0.5 : 1
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
      if (data.sourceType === TransferEntityType.STORE && !data.sourceStoreId) {
        toast.error('Source store is required');
        setIsLoading(false);
        return;
      }

      if (data.sourceType === TransferEntityType.SHOP && !data.sourceShopId) {
        toast.error('Source shop is required');
        setIsLoading(false);
        return;
      }

      if (data.destinationType === TransferEntityType.STORE && !data.destStoreId) {
        toast.error('Destination store is required');
        setIsLoading(false);
        return;
      }

      if (data.destinationType === TransferEntityType.SHOP && !data.destShopId) {
        toast.error('Destination shop is required');
        setIsLoading(false);
        return;
      }

      if (
        (data.sourceType === TransferEntityType.STORE && 
         data.destinationType === TransferEntityType.STORE && 
         data.sourceStoreId === data.destStoreId) ||
        (data.sourceType === TransferEntityType.SHOP && 
         data.destinationType === TransferEntityType.SHOP && 
         data.sourceShopId === data.destShopId)
      ) {
        toast.error('Source and destination cannot be the same');
        setIsLoading(false);
        return;
      }

      const validItems = data.items.filter((item) => {
        if (!item.productId) return false;
        if (!item.quantity || item.quantity <= 0) return false;
        const hasVariants = productHasVariants(item.productId);
        if (hasVariants && (!item.height || !item.width || !item.variantId)) {
          return false;
        }
        return true;
      });

      if (validItems.length === 0) {
        toast.error('Please add at least one valid item');
        setIsLoading(false);
        return;
      }

      for (const item of validItems) {
        const productItem = storeStockItems.find(
          stock => stock.product.id === item.productId
        );
        
        if (productItem?.hasVariants && item.variantId) {
          const variant = productItem.variants?.find(v => v.id === item.variantId);
          if (variant && item.quantity && item.quantity > variant.quantity) {
            toast.error(`Insufficient stock for variant ${item.height}x${item.width}. Available: ${variant.quantity}`);
            setIsLoading(false);
            return;
          }
        } else if (productItem && !productItem.hasVariants) {
          if (item.quantity && item.quantity > (productItem.quantity || 0)) {
            toast.error(`Insufficient stock for product ${productItem.product.name}. Available: ${productItem.quantity}`);
            setIsLoading(false);
            return;
          }
        }
      }

      const cleanedPayload = {
        ...data,
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        sourceStoreId: data.sourceStoreId || undefined,
        sourceShopId: data.sourceShopId || undefined,
        destStoreId: data.destStoreId || undefined,
        destShopId: data.destShopId || undefined,
        items: validItems.map((item) => ({
          productId: item.productId.toString(),
          quantity: Number(item.quantity),
          ...(item.height && { height: Number(item.height) }),
          ...(item.width && { width: Number(item.width) }),
          ...(item.variantId && { variantId: item.variantId })
        }))
      };

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

  const deleteItem = (index: number, field: any) => {
    const newItems = [...field.value];
    newItems.splice(index, 1);
    field.onChange(newItems);
  };

  if (!isMounted) {
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

  if (loadingStoresShops) {
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
              <div>Loading stores and shops...</div>
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

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Source</h3>

                <FormField
                  control={form.control}
                  name='sourceType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: TransferEntityType) => {
                          field.onChange(value);
                          if (value === TransferEntityType.STORE) {
                            form.setValue('sourceShopId', '');
                          } else {
                            form.setValue('sourceStoreId', '');
                          }
                          form.setValue('items', [
                            {
                              productId: '',
                              quantity: undefined
                            }
                          ]);
                          setStoreStockItems([]);
                          setInitialSyncDone(false);
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
                          <SelectItem value={TransferEntityType.SHOP}>
                            Shop
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
                            form.setValue('items', [
                              {
                                productId: '',
                                quantity: undefined
                              }
                            ]);
                            setStoreStockItems([]);
                            setInitialSyncDone(false);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select source store' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem
                                key={store.id}
                                value={store.id.toString()}
                              >
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

                {sourceType === TransferEntityType.SHOP && (
                  <FormField
                    control={form.control}
                    name='sourceShopId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('items', [
                              {
                                productId: '',
                                quantity: undefined
                              }
                            ]);
                            setStoreStockItems([]);
                            setInitialSyncDone(false);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select source shop' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shops.map((shop) => (
                              <SelectItem
                                key={shop.id}
                                value={shop.id.toString()}
                              >
                                {shop.name}
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

              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Destination</h3>

                <FormField
                  control={form.control}
                  name='destinationType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: TransferEntityType) => {
                          field.onChange(value);
                          if (value === TransferEntityType.STORE) {
                            form.setValue('destShopId', '');
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
                          <SelectItem value={TransferEntityType.SHOP}>
                            Shop
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
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select destination store' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {disstores.map((store) => (
                              <SelectItem
                                key={store.id}
                                value={store.id.toString()}
                              >
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

                {destinationType === TransferEntityType.SHOP && (
                  <FormField
                    control={form.control}
                    name='destShopId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select destination shop' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {disshops.map((shop) => (
                              <SelectItem
                                key={shop.id}
                                value={shop.id.toString()}
                              >
                                {shop.name}
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

            <FormField
              control={form.control}
              name='items'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <FormControl>
                    <div className='space-y-4'>
                      {/* Desktop header - hidden on mobile */}
                      <div className='hidden lg:grid lg:grid-cols-6 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        <div>Product</div>
                        <div>Variant</div>
                        <div>Quantity</div>
                        <div>Available</div>
                        <div>Unit</div>
                        <div>Action</div>
                      </div>

                      {field.value.map((item, index) => {
                        const storeStockItem = storeStockItems.find(
                          (stock) => stock.product.id.toString() === item.productId
                        );

                        const hasVariants = storeStockItem?.hasVariants || false;
                        const variants = storeStockItem?.variants || [];
                        
                        let availableQuantity = 0;
                        if (hasVariants && item.variantId) {
                          const selectedVariant = variants.find(v => v.id === item.variantId);
                          availableQuantity = selectedVariant?.quantity || 0;
                        } else if (!hasVariants) {
                          availableQuantity = storeStockItem?.quantity || 0;
                        }
                        
                        const productUnitOfMeasure = getUnitOfMeasureForProduct(item.productId);

                        const availableProducts = getAvailableProducts(index);
                        const productOptions = availableProducts.map((storeStockItem) => ({
                          value: storeStockItem.product.id.toString(),
                          label: formatProductLabel(storeStockItem.product),
                          data: storeStockItem
                        }));

                        const variantOptions = variants.map((variant) => ({
                          value: variant.id,
                          label: formatVariantLabel(variant),
                          data: variant
                        }));

                        let selectedVariantValue = null;
                        if (item.variantId) {
                          selectedVariantValue = variantOptions.find(
                            (v) => v.value === item.variantId
                          );
                        } else if (item.height && item.width && !item.variantId) {
                          selectedVariantValue = variantOptions.find(
                            (v) => 
                              Math.abs(v.data.height - (item.height || 0)) < 0.01 && 
                              Math.abs(v.data.width - (item.width || 0)) < 0.01
                          );
                        }

                        return (
                          <div
                            key={index}
                            className='border rounded-lg p-4 lg:p-0 lg:border-none space-y-4 lg:space-y-0'
                          >
                            {/* Mobile View */}
                            <div className='lg:hidden space-y-3'>
                              <div className='flex justify-between items-start'>
                                <Label className='font-semibold'>Item {index + 1}</Label>
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  onClick={() => deleteItem(index, field)}
                                  disabled={field.value.length <= 1}
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </div>

                              <div>
                                <Label className='text-sm'>Product</Label>
                                <Select
                                  instanceId={`product-select-mobile-${index}`}
                                  options={productOptions}
                                  onChange={(newValue: any) => {
                                    handleProductChange(index, newValue?.value || '');
                                  }}
                                  value={
                                    productOptions.find(
                                      (p) => p.value === item.productId
                                    ) || null
                                  }
                                  placeholder='Search product'
                                  isSearchable
                                  isDisabled={loadingProducts}
                                  isLoading={loadingProducts}
                                  isOptionDisabled={(option) => isProductSelected(option.value, index)}
                                  styles={isDark ? darkStyles : {}}
                                />
                              </div>

                              {hasVariants && (
                                <div>
                                  <Label className='text-sm'>Variant</Label>
                                  <Select
                                    instanceId={`variant-select-mobile-${index}`}
                                    options={variantOptions}
                                    onChange={(newValue: any) => {
                                      handleVariantChange(index, newValue?.data);
                                    }}
                                    value={selectedVariantValue}
                                    placeholder='Select dimensions'
                                    isSearchable
                                    isDisabled={loadingProducts || !item.productId}
                                    isLoading={loadingProducts}
                                    styles={isDark ? darkStyles : {}}
                                  />
                                </div>
                              )}

                              <div>
                                <Label className='text-sm'>Quantity</Label>
                                <Input
                                  type='number'
                                  placeholder='Qty'
                                  value={item.quantity === undefined ? '' : item.quantity}
                                  min={1}
                                  max={Math.floor(availableQuantity)}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const value = e.target.value;
                                    const quantity = value === '' ? undefined : Number(value);
                                    
                                    if (quantity !== undefined && !isNaN(quantity) && quantity >= 1) {
                                      const maxQuantity = Math.floor(availableQuantity);
                                      newItems[index].quantity = Math.min(quantity, maxQuantity);
                                    } else if (value === '') {
                                      newItems[index].quantity = undefined;
                                    }
                                    field.onChange(newItems);
                                  }}
                                  disabled={loadingProducts || (hasVariants && !item.variantId)}
                                />
                              </div>

                              <div className='flex justify-between items-center'>
                                <Label className='text-sm'>Available</Label>
                                <span className='text-sm font-medium'>
                                  {loadingProducts ? (
                                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-gray-400'></div>
                                  ) : availableQuantity > 0 ? (
                                    `${Math.floor(availableQuantity)} available`
                                  ) : hasVariants && item.productId && !item.variantId ? (
                                    'Select variant'
                                  ) : (
                                    'Out of stock'
                                  )}
                                </span>
                              </div>

                              <div className='flex justify-between items-center'>
                                <Label className='text-sm'>Unit</Label>
                                <span className='text-sm text-muted-foreground'>
                                  {productUnitOfMeasure ? productUnitOfMeasure.name : 'Select product'}
                                </span>
                              </div>
                            </div>

                            {/* Desktop View */}
                            <div className='hidden lg:grid lg:grid-cols-6 items-center gap-4'>
                              <div>
                                <Select
                                  instanceId={`product-select-${index}`}
                                  options={productOptions}
                                  onChange={(newValue: any) => {
                                    handleProductChange(index, newValue?.value || '');
                                  }}
                                  value={
                                    productOptions.find(
                                      (p) => p.value === item.productId
                                    ) || null
                                  }
                                  placeholder='Search product'
                                  isSearchable
                                  isDisabled={loadingProducts}
                                  isLoading={loadingProducts}
                                  isOptionDisabled={(option) => isProductSelected(option.value, index)}
                                  styles={isDark ? darkStyles : {}}
                                />
                              </div>

                              <div>
                                {hasVariants ? (
                                  <Select
                                    instanceId={`variant-select-${index}`}
                                    options={variantOptions}
                                    onChange={(newValue: any) => {
                                      handleVariantChange(index, newValue?.data);
                                    }}
                                    value={selectedVariantValue}
                                    placeholder='Select dimensions'
                                    isSearchable
                                    isDisabled={loadingProducts || !item.productId}
                                    isLoading={loadingProducts}
                                    styles={isDark ? darkStyles : {}}
                                  />
                                ) : (
                                  <div className='text-muted-foreground text-sm'>
                                    {item.productId ? 'Standard item' : 'Select product'}
                                  </div>
                                )}
                              </div>

                              <div>
                            <Input
    type='number'
    placeholder='Qty'
    value={item.quantity === undefined ? '' : item.quantity}
    min={1}
    max={Math.floor(availableQuantity)}
    onChange={(e) => {
      const newItems = [...field.value];
      const value = e.target.value;
      const quantity = value === '' ? undefined : Number(value);
      
      if (quantity !== undefined && !isNaN(quantity) && quantity >= 1) {
        const maxQuantity = Math.floor(availableQuantity);
        newItems[index].quantity = Math.min(quantity, maxQuantity);
      } else if (value === '') {
        newItems[index].quantity = undefined;
      }
      field.onChange(newItems);
    }}
    disabled={loadingProducts || (hasVariants && !item.variantId)}
    className={!item.quantity && item.productId && (!hasVariants || (hasVariants && item.variantId)) ? 'border-red-500 focus-visible:ring-red-500' : ''}
  />
  {(!item.quantity && item.productId && (!hasVariants || (hasVariants && item.variantId))) && (
    <p className='text-sm text-red-500 mt-1'>Quantity is required</p>
  )}
                              </div>

                              <div className='text-muted-foreground text-sm'>
                                {loadingProducts ? (
                                  <div className='flex items-center gap-1'>
                                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-gray-400'></div>
                                    <span>Loading...</span>
                                  </div>
                                ) : availableQuantity > 0 ? (
                                  `${Math.floor(availableQuantity)} available`
                                ) : hasVariants && item.productId && !item.variantId ? (
                                  'Select variant'
                                ) : (
                                  'Out of stock'
                                )}
                              </div>

                              <div className='text-muted-foreground text-sm'>
                                {productUnitOfMeasure ? (
                                  productUnitOfMeasure.name
                                ) : (
                                  <span className='text-gray-400'>Select product</span>
                                )}
                              </div>

                              <div>
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  onClick={() => deleteItem(index, field)}
                                  disabled={field.value.length <= 1}
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </div>
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
                              {
                                productId: '',
                                quantity: undefined
                              }
                            ]);
                          }}
                          disabled={loadingProducts}
                        >
                          <IconPlus size={16} className='mr-2' />
                          {loadingProducts ? 'Loading...' : 'Add Item'}
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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