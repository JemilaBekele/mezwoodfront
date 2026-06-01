/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Search } from 'lucide-react';

import { IShop } from '@/models/shop';
import { TransferEntityType } from '@/models/transfer';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { getShops } from '@/service/shop';
import { bulkUpdateShatterVerticalMeasurements } from '@/service/Curtain';
import { ICurtainOrder, ICurtainMeasurement } from '@/models/curtainType';

// ---------------- Type ----------------
interface CurtainMeasurementFormValues {
  shopId?: string;
  measurements: Array<{
    roomName: string;
    width: number;
    height: number;
    quantity?: number;
    pricePerUnit?: number; // This is the price per unit area (e.g., per m²) based on selected product and additional price
    unitprice?: number;  // Auto-calculated: width × height
    price?: number;      // Auto-calculated: unitprice × quantity
    remark?: string;
    shatterVerticalProductId?: string;
  }>;
}

// ---------------- Props ----------------
interface CurtainMeasurementFormProps {
  orderId: string;
  curtainOrder: ICurtainOrder | null;
  pageTitle: string;
}

// ---------------- Component ----------------
export default function ShatterCurtainMeasurementForm({
  orderId,
  curtainOrder,
  pageTitle
}: CurtainMeasurementFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<IShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [additionalPrices, setAdditionalPrices] = useState<{[key: string]: any[]}>({});
  const [selectedAdditionalPrices, setSelectedAdditionalPrices] = useState<{[key: string]: string}>({});
  const [productSearchTerms, setProductSearchTerms] = useState<{[key: string]: string}>({});
  const router = useRouter();

  // Helper function to get product by ID
  const getProductById = (productId: string) => {
    const productItem = products.find(item => item.product?.id === productId);
    return productItem?.product;
  };

  // Helper function to get product sell price by ID
  const getProductSellPrice = useCallback((productId: string) => {
    const productItem = products.find(item => item.product?.id === productId);
    return productItem?.product?.sellPrice ? parseFloat(productItem.product.sellPrice) : 0;
  }, [products]);

  // Helper function to get product additional prices by ID

  // Calculate unitprice (width × height × price per unit)
  const calculateUnitPrice = useCallback((width: number, height: number, pricePerUnit: number = 0): number => {
    return width * height * pricePerUnit;
  }, []);

  // Calculate total price (unitprice × quantity)
  const calculateTotalPrice = useCallback((
    width: number, 
    height: number, 
    pricePerUnit: number = 0, 
    quantity: number = 1
  ): number => {
    const unitPrice = calculateUnitPrice(width, height, pricePerUnit);
    return unitPrice * quantity;
  }, [calculateUnitPrice]);

  // Get the price to use for calculation (either sell price or selected additional price)
  const getPriceToUse = useCallback((productId: string, measurementIndex: number): number => {
    const additionalPriceId = selectedAdditionalPrices[`${measurementIndex}-${productId}`];
    
    if (additionalPriceId && additionalPriceId !== 'sell-price') {
      const additionalPricesList = additionalPrices[productId] || [];
      const selectedAdditionalPrice = additionalPricesList.find(price => price.id === additionalPriceId);
      if (selectedAdditionalPrice) {
        return parseFloat(selectedAdditionalPrice.price);
      }
    }
    
    // Default to sell price
    return getProductSellPrice(productId);
  }, [selectedAdditionalPrices, getProductSellPrice, additionalPrices]);

  // Initialize form with measurements and shopId
  const form = useForm<CurtainMeasurementFormValues>({
    defaultValues: {
      shopId: curtainOrder?.ShopId || undefined,
      measurements: curtainOrder?.measurements?.map((m: ICurtainMeasurement) => {
        const product = m.shatterVerticalProductId ? getProductById(m.shatterVerticalProductId) : null;
        const sellPrice = product?.sellPrice ? parseFloat(product.sellPrice) : 0;
        
        // Calculate price from existing data or use default
        const pricePerUnit = m.pricePerUnit || sellPrice;
        const unitPrice = calculateUnitPrice(m.width, m.height, pricePerUnit);
        const totalPrice = calculateTotalPrice(m.width, m.height, pricePerUnit, m.quantity || 1);
        
        return {
          roomName: m.roomName,
          width: m.width,
          height: m.height,
          quantity: m.quantity ?? 1,
          pricePerUnit: pricePerUnit,
          unitprice: m.unitprice || unitPrice,
          price: m.price || totalPrice,
          remark: m.remark || '',
          shatterVerticalProductId: m.shatterVerticalProductId || undefined
        };
      }) || [{
        roomName: '',
        width: 0,
        height: 0,
        quantity: 1,
        pricePerUnit: 0,
        unitprice: 0,
        price: 0,
        remark: '',
        shatterVerticalProductId: undefined
      }]
    }
  });

  const watchMeasurements = form.watch('measurements');
  const watchShopId = form.watch('shopId');

  // Update calculations when measurements change
  useEffect(() => {
    watchMeasurements.forEach((measurement, index) => {
      const width = measurement.width || 0;
      const height = measurement.height || 0;
      const quantity = measurement.quantity || 1;
      
      if (measurement.shatterVerticalProductId) {
        const pricePerUnit = getPriceToUse(measurement.shatterVerticalProductId, index);
        const unitPrice = calculateUnitPrice(width, height, pricePerUnit);
        const totalPrice = calculateTotalPrice(width, height, pricePerUnit, quantity);
        
        // Update calculated fields
        form.setValue(`measurements.${index}.unitprice`, unitPrice);
        form.setValue(`measurements.${index}.price`, totalPrice);
      } else {
        // Reset to 0 if no product selected
        form.setValue(`measurements.${index}.unitprice`, 0);
        form.setValue(`measurements.${index}.price`, 0);
      }
    });
  }, [watchMeasurements, getPriceToUse, calculateUnitPrice, calculateTotalPrice, form]);

  // Fetch shops on component mount
  useEffect(() => {
    fetchShops();
  }, []);

  // Set shop ID from curtain order when component mounts
  useEffect(() => {
    if (curtainOrder?.ShopId) {
      const shopId = curtainOrder.ShopId;
      setSelectedShopId(shopId);
      form.setValue('shopId', shopId);
    }
  }, [curtainOrder, form]);

  // Fetch shops function
  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const shopsData = await getShops();
      setShops(shopsData);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setIsLoadingShops(false);
    }
  };

  // Fetch products when shop is identified or changed
  useEffect(() => {
    if (selectedShopId) {
      getAvailableProductsBySource(TransferEntityType.SHOP, selectedShopId)
        .then(response => {
          console.log("API response:", response);
          
          if (Array.isArray(response)) {
            // Filter products where shatterVertical is true
            const shatterVerticalProducts = response.filter(item => 
              item.product?.shatterVertical === true
            );
            setProducts(shatterVerticalProducts);
            
            // Cache additional prices for each product
            const pricesMap: {[key: string]: any[]} = {};
            shatterVerticalProducts.forEach(item => {
              if (item.product?.id && item.product?.additionalPrices) {
                pricesMap[item.product.id] = item.product.additionalPrices;
              }
            });
            setAdditionalPrices(pricesMap);
          } else {
            console.warn("Expected array but got:", response);
            setProducts([]);
            setAdditionalPrices({});
            toast.error('Failed to load products for the shop');
          }
        })
        .catch((error) => {
          console.error("Error loading products:", error);
          setProducts([]);
          setAdditionalPrices({});
          toast.error('Failed to load products for the shop');
        });
    } else {
      setProducts([]);
      setAdditionalPrices({});
    }
  }, [selectedShopId]);

  // Handle shop selection change
  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    form.setValue('shopId', shopId);
    
    // Clear product selections when shop changes
    const currentMeasurements = form.getValues('measurements');
    const updatedMeasurements = currentMeasurements.map(measurement => ({
      ...measurement,
      shatterVerticalProductId: undefined,
      unitprice: 0,
      price: 0
    }));
    form.setValue('measurements', updatedMeasurements);
    
    // Clear additional price selections
    setSelectedAdditionalPrices({});
    // Clear search terms
    setProductSearchTerms({});
  };

  // Handle product selection change
  const handleProductChange = (index: number, value: string) => {
    form.setValue(`measurements.${index}.shatterVerticalProductId`, value);
    
    // Clear any previous additional price selection for this measurement
    const newSelectedPrices = { ...selectedAdditionalPrices };
    Object.keys(newSelectedPrices).forEach(key => {
      if (key.startsWith(`${index}-`)) {
        delete newSelectedPrices[key];
      }
    });
    setSelectedAdditionalPrices(newSelectedPrices);
  };

  // Handle additional price selection change
  const handleAdditionalPriceChange = (index: number, productId: string, additionalPriceId: string) => {
    setSelectedAdditionalPrices(prev => ({
      ...prev,
      [`${index}-${productId}`]: additionalPriceId
    }));
  };

  // Handle product search term change
  const handleProductSearchChange = (index: number, value: string) => {
    setProductSearchTerms(prev => ({
      ...prev,
      [index]: value
    }));
  };

  // Get filtered products for a specific measurement
  const getFilteredProducts = (index: number) => {
    const searchTerm = productSearchTerms[index]?.toLowerCase() || '';
    
    return products
      .filter(item => {
        // Always show products with available quantity and shatterVertical = true
        const hasQuantity = item.availableQuantity > 0;
        const isShatterVertical = item.product?.shatterVertical === true;
        
        if (!hasQuantity || !isShatterVertical) return false;
        
        // If there's a search term, filter by name
        if (searchTerm) {
          const productName = item.product?.name?.toLowerCase() || '';
          return productName.includes(searchTerm);
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by product name
        const nameA = a.product?.name?.toLowerCase() || '';
        const nameB = b.product?.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
  };

  // Add new measurement
  const addMeasurement = () => {
    const currentMeasurements = form.getValues('measurements');
    form.setValue('measurements', [
      ...currentMeasurements,
      {
        roomName: '',
        width: 0,
        height: 0,
        quantity: 1,
        unitprice: 0,
        price: 0,
        remark: '',
        shatterVerticalProductId: undefined
      }
    ]);
  };

  // Remove measurement
  const removeMeasurement = (index: number) => {
    const currentMeasurements = form.getValues('measurements');
    if (currentMeasurements.length > 1) {
      form.setValue('measurements', currentMeasurements.filter((_, i) => i !== index));
      
      // Clear additional price selections for this measurement
      const newSelectedPrices = { ...selectedAdditionalPrices };
      Object.keys(newSelectedPrices).forEach(key => {
        if (key.startsWith(`${index}-`)) {
          delete newSelectedPrices[key];
        }
      });
      setSelectedAdditionalPrices(newSelectedPrices);
      
      // Clear search term for this measurement
      const newSearchTerms = { ...productSearchTerms };
      delete newSearchTerms[index];
      setProductSearchTerms(newSearchTerms);
    }
  };

  // Prepare measurements for bulk update
  const prepareMeasurementsForBulkUpdate = (data: CurtainMeasurementFormValues) => {
    const measurementsArray = [];
    
    for (let i = 0; i < data.measurements.length; i++) {
      const measurement = data.measurements[i];
      let unitPrice = 0;
      let totalPrice = 0;
      let pricePerUnit = 0;
      
      if (measurement.shatterVerticalProductId) {
        pricePerUnit = getPriceToUse(measurement.shatterVerticalProductId, i);
        unitPrice = calculateUnitPrice(measurement.width, measurement.height, pricePerUnit);
        totalPrice = calculateTotalPrice(measurement.width, measurement.height, pricePerUnit, measurement.quantity || 1);
      }
      
      const measurementData = {
        roomName: measurement.roomName,
        width: measurement.width,
        height: measurement.height,
        quantity: measurement.quantity ?? 1,
        unitprice: unitPrice,
        pricePerUnit: pricePerUnit,
        price: totalPrice,
        remark: measurement.remark === '' ? undefined : measurement.remark,
        shatterVerticalProductId: measurement.shatterVerticalProductId,
      };
      
      // Check if this is an existing measurement (has an ID from the order)
      const existingMeasurement = curtainOrder?.measurements?.[i];
      
      measurementsArray.push({
        measurementId: existingMeasurement?.id, // undefined for new measurements
        curtainMeasurementData: measurementData
      });
    }
    
    return measurementsArray;
  };

  // Simple validation function
  const validateForm = (data: CurtainMeasurementFormValues): boolean => {
    // Validate shop selection
    if (!data.shopId || data.shopId.trim() === '') {
      toast.error('Please select a shop');
      return false;
    }

    // Validate measurements
    for (let i = 0; i < data.measurements.length; i++) {
      const measurement = data.measurements[i];
      
      if (!measurement.roomName || measurement.roomName.trim() === '') {
        toast.error(`Measurement ${i + 1}: Room name is required`);
        return false;
      }

      if (measurement.width <= 0) {
        toast.error(`Measurement ${i + 1}: Width must be greater than 0`);
        return false;
      }

      if (measurement.height <= 0) {
        toast.error(`Measurement ${i + 1}: Height must be greater than 0`);
        return false;
      }

      if ((measurement.quantity || 1) <= 0) {
        toast.error(`Measurement ${i + 1}: Quantity must be greater than 0`);
        return false;
      }

      // Validate shatter vertical product selection
      if (!measurement.shatterVerticalProductId || measurement.shatterVerticalProductId.trim() === '') {
        toast.error(`Measurement ${i + 1}: Shatter vertical product is required`);
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: CurtainMeasurementFormValues) => {
    if (!validateForm(data)) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare measurements for bulk update
      const measurementsArray = prepareMeasurementsForBulkUpdate(data);
      
      // Call the bulk update API
      const result = await bulkUpdateShatterVerticalMeasurements(
        orderId,
        measurementsArray,
        data.shopId ?? ""
      );

      // Show success message based on result
      let successMessage = '';
      if (result.data.createdCount > 0 && result.data.updatedCount > 0) {
        successMessage = `Successfully created ${result.data.createdCount} and updated ${result.data.updatedCount} shatter vertical measurements`;
      } else if (result.data.createdCount > 0) {
        successMessage = `Successfully created ${result.data.createdCount} shatter vertical measurements`;
      } else if (result.data.updatedCount > 0) {
        successMessage = `Successfully updated ${result.data.updatedCount} shatter vertical measurements`;
      } else {
        successMessage = 'No changes were made to shatter vertical measurements';
      }

      // Add price change information if applicable
      if (result.data.totalAmountChange !== 0) {
        const changeDirection = result.data.totalAmountChange > 0 ? 'increased' : 'decreased';
        const changeAmount = Math.abs(result.data.totalAmountChange);
        successMessage += `. Order total ${changeDirection} by ${changeAmount}`;
      }

      toast.success(successMessage);
      router.refresh();
      router.push(`/dashboard/CurtainOrder/view?id=${orderId}`);
    } catch (error: any) {
      console.error('Error saving curtain measurements:', error);
      toast.error(error.response?.data?.message || 'Failed to save curtain measurements');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get product name by ID
  const getProductName = (productId: string) => {
    const product = getProductById(productId);
    return product?.name || 'Unknown product';
  };

  // Helper function to get available quantity by product ID
  const getProductQuantity = (productId: string) => {
    const productItem = products.find(item => item.product?.id === productId);
    return productItem?.availableQuantity || 0;
  };

  // Show loading state if curtain order is not loaded
  if (!curtainOrder) {
    return (
      <Card className='mx-auto w-full max-w-4xl'>
        <CardContent className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-muted-foreground'>Loading curtain order...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>{pageTitle}</CardTitle>
        <div className='text-sm text-muted-foreground'>
          <p>Customer: <span className='font-medium'>{curtainOrder.customer?.name}</span></p>
          <p>Order ID: <span className='font-medium'>{curtainOrder.id}</span></p>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Shop Selection */}
            <div className='rounded-lg border p-4'>
              <h3 className='text-lg font-semibold mb-4'>Shop Selection</h3>
              <FormField
                control={form.control}
                name="shopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Shop <span className="text-red-500">*</span></FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={handleShopChange}
                      disabled={isLoadingShops}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingShops ? 'Loading shops...' : 'Select a shop'
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            <div className="flex flex-col">
                              <span>{shop.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {field.value && !isLoadingShops && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected shop: {shops.find(s => s.id === field.value)?.name || 'Unknown shop'}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            {/* Curtain Measurements Section */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Shatter Vertical Measurements</h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addMeasurement}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Measurement
                </Button>
              </div>

              {!selectedShopId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    Please select a shop first to see available shatter vertical products
                  </p>
                </div>
              )}

              {/* Show all measurements */}
              {watchMeasurements.map((measurement, index) => {
                const productId = measurement.shatterVerticalProductId;
                const product = productId ? getProductById(productId) : null;
                const sellPrice = productId ? getProductSellPrice(productId) : 0;
                const currentAdditionalPriceId = selectedAdditionalPrices[`${index}-${productId}`] || 'sell-price';
                const pricePerUnit = productId ? getPriceToUse(productId, index) : 0;
                const unitPrice = calculateUnitPrice(measurement.width || 0, measurement.height || 0, pricePerUnit);
                const totalPrice = calculateTotalPrice(
                  measurement.width || 0, 
                  measurement.height || 0, 
                  pricePerUnit, 
                  measurement.quantity || 1
                );
                const additionalPricesList = productId ? (additionalPrices[productId] || []) : [];
                const filteredProducts = getFilteredProducts(index);
                const searchTerm = productSearchTerms[index] || '';
                
                return (
                  <div key={index} className='space-y-4 rounded-lg border p-4'>
                    <div className='flex items-center justify-between'>
                      <h4 className='font-medium'>Measurement {index + 1}</h4>
                      {watchMeasurements.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeMeasurement(index)}
                          className='text-red-500 hover:text-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {/* Room Name */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.roomName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder='e.g., Living Room, Bedroom'
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min="1"
                                placeholder='1'
                                value={field.value ?? 1}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Width */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.width`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (cm) <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min="1"
                                step="0.01"
                                placeholder='Width in cm'
                                value={field.value}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Height */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.height`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm) <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min="1"
                                step="0.01"
                                placeholder='Height in cm'
                                value={field.value}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Shatter Vertical Product Section */}
                    <div className="space-y-4">
                      <h5 className="font-medium">Shatter Vertical Product <span className="text-red-500">*</span></h5>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Product Selection */}
                        <FormField
                          control={form.control}
                          name={`measurements.${index}.shatterVerticalProductId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shatter Vertical Product</FormLabel>
                              <Select
                                value={field.value || ''}
                                onValueChange={(value) => handleProductChange(index, value)}
                                disabled={products.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={
                                      products.length === 0 
                                        ? selectedShopId 
                                          ? 'Loading products...' 
                                          : 'Select a shop first'
                                        : 'Select shatter vertical product'
                                    } />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-96">
                                  {/* Search Input */}
                                  <div className="sticky top-0 z-10 bg-background p-2">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => handleProductSearchChange(index, e.target.value)}
                                        className="pl-8"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Product List */}
                                  {filteredProducts.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                      {searchTerm ? 'No products found. Try a different search term.' : 'No shatter vertical products available.'}
                                    </div>
                                  ) : (
                                    filteredProducts.map(item => (
                                      <SelectItem 
                                        key={item.product.id} 
                                        value={item.product.id}
                                        className="py-3"
                                      >
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">{item.product.name}</span>
                                            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                              {item.availableQuantity} available
                                            </span>
                                          </div>
                                          <div className="flex flex-col text-xs text-muted-foreground">
                                            {item.product.code && (
                                              <span>Code: {item.product.code}</span>
                                            )}
                                            {item.product.additionalPrices && item.product.additionalPrices.length > 0 && (
                                              <span className="text-blue-600 mt-0.5">
                                                {item.product.additionalPrices.length} additional price option(s)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              {field.value && (
                                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-blue-600">
                                        Sell Price: {getProductSellPrice(field.value)}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        form.setValue(`measurements.${index}.shatterVerticalProductId`, '');
                                        handleProductSearchChange(index, '');
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {!field.value && filteredProducts.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
                                  {searchTerm && ` matching "${searchTerm}"`}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />

                        {/* Additional Price Selection (Only show if product has additional prices) */}
                        {productId && additionalPricesList.length > 0 && (
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium">Select Price Option</FormLabel>
                            <Select
                              value={currentAdditionalPriceId}
                              onValueChange={(value) => handleAdditionalPriceChange(index, productId, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select price option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sell-price">
                                  <div className="flex flex-col">
                                    <span>Sell Price</span>
                                    <span className="text-xs text-muted-foreground">{sellPrice} per unit</span>
                                  </div>
                                </SelectItem>
                                {additionalPricesList.map((priceOption: any) => (
                                  <SelectItem key={priceOption.id} value={priceOption.id}>
                                    <div className="flex flex-col">
                                      <span>{priceOption.label}</span>
                                      <span className="text-xs text-muted-foreground">{priceOption.price} per unit</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Current selection: {currentAdditionalPriceId === 'sell-price' 
                                ? `Sell Price (${sellPrice})` 
                                : additionalPricesList.find(p => p.id === currentAdditionalPriceId)?.label || 'Sell Price'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Price Calculations Section */}
                    <div className="space-y-4">
                      <h5 className="font-medium">Price Calculations</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Price Per Unit (Selected Price) */}
                        <FormItem>
                          <FormLabel>Price Per Unit <span className="text-xs text-muted-foreground">(Selected)</span></FormLabel>
                          <Input
                            type='number'
                            readOnly
                            value={pricePerUnit.toFixed(2)}
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-muted-foreground">
                            {currentAdditionalPriceId === 'sell-price' ? 'Sell Price' : 'Additional Price'}
                          </p>
                        </FormItem>
                        
                        {/* Unit Price (Auto-calculated) */}
                        <FormField
                          control={form.control}
                          name={`measurements.${index}.unitprice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price <span className="text-xs text-muted-foreground">(Auto: width × height × price)</span></FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  readOnly
                                  value={unitPrice.toFixed(2)}
                                  className="bg-gray-50"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                ({measurement.width || 0} × {measurement.height || 0} × {pricePerUnit.toFixed(2)})
                              </p>
                            </FormItem>
                          )}
                        />
                        
                        {/* Total Price (Auto-calculated) */}
                        <FormField
                          control={form.control}
                          name={`measurements.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Price <span className="text-xs text-muted-foreground">(Auto: unitprice × quantity)</span></FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  readOnly
                                  value={totalPrice.toFixed(2)}
                                  className="bg-gray-50 font-medium"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                ({unitPrice.toFixed(2)} × {measurement.quantity || 1})
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Remark Section */}
                    <div className="space-y-4">
                      <h5 className="font-medium">Remark</h5>
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.remark`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder='Optional notes for this measurement'
                                value={field.value || ''}
                                onChange={field.onChange}
                                rows={2}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Calculation Summary */}
                    <div className='text-sm text-muted-foreground pt-2 border-t mt-4'>
                      <span className='font-medium'>Calculation Summary: </span>
                      <div className="mt-1">
                        <div>Price Per Unit: {pricePerUnit.toFixed(2)}</div>
                        <div>Unit Price = Width × Height × Price = {measurement.width || 0} × {measurement.height || 0} × {pricePerUnit.toFixed(2)} = {unitPrice.toFixed(2)}</div>
                        <div>Total Price = Unit Price × Quantity = {unitPrice.toFixed(2)} × {measurement.quantity || 1} = {totalPrice.toFixed(2)}</div>
                        {product && (
                          <div className="mt-1 text-blue-600">
                            Product: {product.name} 
                            {currentAdditionalPriceId === 'sell-price' 
                              ? ` (Sell Price: ${sellPrice})` 
                              : ` (Additional Price: ${additionalPricesList.find(p => p.id === currentAdditionalPriceId)?.label || 'Selected'})`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-2 pt-4'>
              <Button 
                type='button' 
                variant='outline' 
                onClick={() => router.push(`/dashboard/CurtainOrder/${orderId}`)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Measurements'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}