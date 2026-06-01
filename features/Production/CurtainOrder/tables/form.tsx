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
import { Plus, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

import { IShop } from '@/models/shop';
import { IEmployee } from '@/models/employee';
import { TransferEntityType } from '@/models/transfer';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { getShops } from '@/service/shop';
import { bulkUpdateCurtainMeasurements } from '@/service/Curtain';
import { getAllEmploy } from '@/service/employee';
import { ICurtainOrder } from '@/models/curtainType';

interface ProductVariant {
  id: string;
  height: number;
  width: number;
  area: number;
  quantity: number;
  totalArea: number;
}

interface ProductItem {
  id: string;
  availableQuantity: number;
  finalSellPrice: number;
  hasVariants: boolean;
  isCurtainProduct: boolean;
  product: {
    id: string;
    name: string;
    sellPrice: string;
    additionalPrices?: any[];
    thickCurtain?: boolean;
    thinCurtain?: boolean;
    poleCurtain?: boolean;
    pullsCurtain?: boolean;
    bracketsCurtain?: boolean;
  };
  quantity: number;
  shopId: string;
  status: string;
  stockType: string;
  totalArea: number;
  uniqueDimensions: string[];
  variants: ProductVariant[];
  variantCount: number;
}

interface CurtainMeasurementFormValues {
  shopId?: string;
  measurements: Array<{
    // Required fields
    roomName: string;
    width: number | null;
    height: number | null;
    extrawidth?: number | null;
    quantity: number;
    
    // Optional fields - can be removed
    size?: 'NORMAL' | 'TWO_POINT_FIVE' | 'THREE';
    curtainSize?: number;
    
    // Thick curtain
    thickProductId?: string;
    thickMeter?: number;
    thickPrice?: number;
    thickAdditionalPriceId?: string;
    thickVariant?: string;
    includeThickCurtain?: boolean;

    // Thin curtain
    thinProductId?: string;
    thinMeter?: number;
    thinPrice?: number;
    thinAdditionalPriceId?: string;
    thinVariant?: string;
    includeThinCurtain?: boolean;

    // Curtain Pole
    curtainPoleId?: string;
    curtainPoleQuantity?: number;
    curtainPolePrice?: number;
    curtainPoleAdditionalPriceId?: string;
    includeCurtainPole?: boolean;
    
    // Curtain Pulls
    curtainPullsId?: string;
    curtainPullsQuantity?: number;
    includeCurtainPulls?: boolean;
    
    // Curtain Brackets
    curtainBracketsId?: string;
    curtainBracketsQuantity?: number;
    curtainPullsBracketsPrice?: number;
    includeCurtainBrackets?: boolean;
    
    // Workers
    thickWorkerId?: string;
    thinWorkerId?: string;
    workerPrice?: number;
    totalWorkerMeter?: number;
    includeWorkers?: boolean;
    
    // Final price
    price?: number;
    
    // Notes
    remark?: string;
  }>;
}

// ---------------- Props ----------------
interface CurtainMeasurementFormProps {
  orderId: string;
  curtainOrder: ICurtainOrder | null;
  pageTitle: string;
}

// ---------------- Component ----------------
export default function CurtainMeasurementForm({
  orderId,
  curtainOrder,
  pageTitle
}: CurtainMeasurementFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [shops, setShops] = useState<IShop[]>([]);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  
  // Search states
  const [shopSearch, setShopSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [productSearches, setProductSearches] = useState<{[key: string]: string}>({});
  const [variantSearches, setVariantSearches] = useState<{[key: string]: string}>({});
  
  const router = useRouter();

  // Curtain multiplier table based on height and size type
  const curtainMultiplierTable = useMemo<
    Record<number, { TWO_POINT_FIVE: number; THREE: number }>
  >(() => ({
    3: { TWO_POINT_FIVE: 3, THREE: 3.25 },
    3.25: { TWO_POINT_FIVE: 3.25, THREE: 3.5 },
    3.5: { TWO_POINT_FIVE: 3.75, THREE: 3.75 },
    3.75: { TWO_POINT_FIVE: 4, THREE: 4.25 },
    4: { TWO_POINT_FIVE: 4.25, THREE: 4.5 },
    4.25: { TWO_POINT_FIVE: 4.5, THREE: 4.75 },
    4.5: { TWO_POINT_FIVE: 4.75, THREE: 5 },
    5: { TWO_POINT_FIVE: 5.25, THREE: 5.5 },
    5.25: { TWO_POINT_FIVE: 5.5, THREE: 6 },
    5.5: { TWO_POINT_FIVE: 5.75, THREE: 6.25 },
    5.75: { TWO_POINT_FIVE: 6, THREE: 6.5 },
    6: { TWO_POINT_FIVE: 6.25, THREE: 6.75 },
    6.25: { TWO_POINT_FIVE: 6.5, THREE: 7 },
    6.5: { TWO_POINT_FIVE: 6.75, THREE: 7.25 },
    6.75: { TWO_POINT_FIVE: 7, THREE: 7.5 }
  }), []);

  // Helper function to get product by ID
  const getProductItem = (productId: string) => {
    return products.find(item => item.product?.id === productId);
  };

  // Helper function to get product sell price by ID
  const getProductSellPrice = (productId: string) => {
    const productItem = getProductItem(productId);
    return productItem?.product?.sellPrice ? parseFloat(productItem.product.sellPrice) : 0;
  };

  // Helper function to get product additional prices by ID
  const getProductAdditionalPrices = (productId: string) => {
    const productItem = getProductItem(productId);
    return productItem?.product?.additionalPrices || [];
  };

  // Helper function to get additional price by ID
  const getAdditionalPriceById = (productId: string, additionalPriceId: string) => {
    const additionalPrices = getProductAdditionalPrices(productId);
    return additionalPrices.find((price: any) => price.id === additionalPriceId);
  };

  // Helper function to get product variants
  const getProductVariants = (productId: string) => {
    const productItem = getProductItem(productId);
    return productItem?.variants || [];
  };

  // Helper function to format variant as string "height×width"
  const formatVariantString = (height: number, width: number): string => {
    return `${height}×${width}`;
  };

  // Helper to calculate curtain size based on the rules
  const calculateCurtainSize = useCallback((width: number, height: number, size: 'NORMAL' | 'TWO_POINT_FIVE' | 'THREE' = 'NORMAL'): number => {
    if (height < 3) {
      return width * 3;
    }
    
    const availableHeights = Object.keys(curtainMultiplierTable)
      .map(Number)
      .sort((a, b) => a - b);
    
    let selectedHeight = 3;
    
    for (const h of availableHeights) {
      if (height >= h) {
        selectedHeight = h;
      } else {
        break;
      }
    }
    
    let multiplier = 3;
    
    if (size === 'NORMAL') {
      multiplier = 3;
    } else if (size === 'TWO_POINT_FIVE') {
      multiplier = curtainMultiplierTable[selectedHeight]?.TWO_POINT_FIVE || 3;
    } else if (size === 'THREE') {
      multiplier = curtainMultiplierTable[selectedHeight]?.THREE || 3.25;
    }
    
    return width * multiplier;
  }, [curtainMultiplierTable]);

  // Calculate final price based on formula
  const calculateFinalPrice = useCallback((measurement: any) => {
    const width = measurement.width || 0;
    const quantity = measurement.quantity || 1;
    const size = measurement.size || 'NORMAL';
    const height = measurement.height || 0;
    
    const curtainSize = calculateCurtainSize(width, height, size) * quantity;
    
    let thickTotal = 0;
    let thinTotal = 0;
    let poleTotal = 0;
    let pullsBracketsTotal = 0;
    let totalWorkerMeter = 0;
    
    if (measurement.includeThickCurtain) {
      thickTotal = curtainSize * (measurement.thickPrice || 0);
    }
    
    if (measurement.includeThinCurtain) {
      thinTotal = curtainSize * (measurement.thinPrice || 0);
    }
    
    if (measurement.includeCurtainPole) {
      const curtainPoleQuantity = (measurement.includeThickCurtain ? width : 0) + (measurement.includeThinCurtain ? width : 0);
      poleTotal = curtainPoleQuantity * (measurement.curtainPolePrice || 0);
    }
    
    if (measurement.includeCurtainPulls || measurement.includeCurtainBrackets) {
      pullsBracketsTotal = measurement.curtainPullsBracketsPrice || 2000;
    }
    
    if (measurement.includeWorkers) {
      totalWorkerMeter = 2 * curtainSize * (measurement.workerPrice || 0);
    }
    
    const finalPrice = thickTotal + thinTotal + poleTotal + pullsBracketsTotal + totalWorkerMeter;
    
    return {
      thickMeter: measurement.includeThickCurtain ? width : 0,
      thinMeter: measurement.includeThinCurtain ? width : 0,
      curtainPoleQuantity: (measurement.includeThickCurtain ? width : 0) + (measurement.includeThinCurtain ? width : 0),
      thickTotal,
      thinTotal,
      poleTotal,
      pullsBracketsTotal,
      totalWorkerMeter,
      finalPrice,
      curtainSize
    };
  }, [calculateCurtainSize]);

  // Initialize form
  const form = useForm<CurtainMeasurementFormValues>({
    defaultValues: {
      shopId: curtainOrder?.ShopId || undefined,
      measurements: curtainOrder?.measurements?.map(m => {
        const calculated = calculateFinalPrice(m);
        
        return {
          // Required fields
          roomName: m.roomName,
          width: m.width || null,
          height: m.height || null,
          extrawidth: m.extrawidth || null,
          quantity: m.quantity ?? 1,
          
          // Optional fields with include flags
          size: m.size || 'NORMAL',
          curtainSize: calculated.curtainSize,
          
          includeThickCurtain: !!m.thickProductId,
          thickProductId: m.thickProductId || undefined,
          thickMeter: m.thickMeter || calculated.thickMeter,
          thickPrice: m.thickPrice || (m.thickProductId ? getProductSellPrice(m.thickProductId) : undefined),
          thickAdditionalPriceId: undefined,
          thickVariant: m.thickVariant || undefined,
          
          includeThinCurtain: !!m.thinProductId,
          thinProductId: m.thinProductId || undefined,
          thinMeter: m.thinMeter || calculated.thinMeter,
          thinPrice: m.thinPrice || (m.thinProductId ? getProductSellPrice(m.thinProductId) : undefined),
          thinAdditionalPriceId: undefined,
          thinVariant: m.thinVariant || undefined,
          
          includeCurtainPole: !!m.curtainPoleId,
          curtainPoleId: m.curtainPoleId || undefined,
          curtainPoleQuantity: m.curtainPoleQuantity || calculated.curtainPoleQuantity,
          curtainPolePrice: m.curtainPolePrice || (m.curtainPoleId ? getProductSellPrice(m.curtainPoleId) : undefined),
          curtainPoleAdditionalPriceId: undefined,
          
          includeCurtainPulls: !!m.curtainPullsId,
          curtainPullsId: m.curtainPullsId || undefined,
          curtainPullsQuantity: m.curtainPullsQuantity ?? 2,
          
          includeCurtainBrackets: !!m.curtainBracketsId,
          curtainBracketsId: m.curtainBracketsId || undefined,
          curtainBracketsQuantity: m.curtainBracketsQuantity ?? 2,
          curtainPullsBracketsPrice: m.curtainPullsBracketsPrice || 2000,
          
          includeWorkers: !!(m.thickWorkerId || m.thinWorkerId),
          thickWorkerId: m.thickWorkerId || undefined,
          thinWorkerId: m.thinWorkerId || undefined,
          workerPrice: m.workerPrice || 250,
          totalWorkerMeter: m.totalWorkerMeter || calculated.totalWorkerMeter,
          
          price: m.price || calculated.finalPrice,
          
          remark: m.remark
        };
      }) || [{
        // Required fields
        roomName: '',
        width: null,
        height: null,
        extrawidth: null,
        quantity: 1,
        
        // Optional fields
        size: 'NORMAL',
        curtainSize: 0,
        
        includeThickCurtain: false,
        thickProductId: undefined,
        thickMeter: 0,
        thickPrice: undefined,
        thickAdditionalPriceId: undefined,
        thickVariant: undefined,
        
        includeThinCurtain: false,
        thinProductId: undefined,
        thinMeter: 0,
        thinPrice: undefined,
        thinAdditionalPriceId: undefined,
        thinVariant: undefined,
        
        includeCurtainPole: false,
        curtainPoleId: undefined,
        curtainPoleQuantity: 0,
        curtainPolePrice: undefined,
        curtainPoleAdditionalPriceId: undefined,
        
        includeCurtainPulls: false,
        curtainPullsId: undefined,
        curtainPullsQuantity: 2,
        
        includeCurtainBrackets: false,
        curtainBracketsId: undefined,
        curtainBracketsQuantity: 2,
        curtainPullsBracketsPrice: 2000,
        
        includeWorkers: false,
        thickWorkerId: undefined,
        thinWorkerId: undefined,
        workerPrice: 250,
        totalWorkerMeter: 0,
        
        price: undefined,
        
        remark: ''
      }]
    }
  });

  const watchMeasurements = form.watch('measurements');

  // Update calculations when measurements change
  useEffect(() => {
    watchMeasurements.forEach((measurement, index) => {
      if (measurement.width && measurement.height) {
        const calculated = calculateFinalPrice(measurement);
        
        form.setValue(`measurements.${index}.curtainSize`, calculated.curtainSize);
        if (measurement.includeThickCurtain) {
          form.setValue(`measurements.${index}.thickMeter`, calculated.thickMeter);
        }
        if (measurement.includeThinCurtain) {
          form.setValue(`measurements.${index}.thinMeter`, calculated.thinMeter);
        }
        if (measurement.includeCurtainPole) {
          form.setValue(`measurements.${index}.curtainPoleQuantity`, calculated.curtainPoleQuantity);
        }
        if (measurement.includeWorkers) {
          form.setValue(`measurements.${index}.totalWorkerMeter`, calculated.totalWorkerMeter);
        }
        form.setValue(`measurements.${index}.price`, calculated.finalPrice);
      }
    });
  }, [watchMeasurements, calculateFinalPrice, form]);

  // Fetch shops and employees on component mount
  useEffect(() => {
    fetchShops();
    fetchEmployees();
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

  // Fetch employees function
  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const employeesData = await getAllEmploy();
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Fetch products when shop is identified or changed
  useEffect(() => {
    if (selectedShopId) {
      getAvailableProductsBySource(TransferEntityType.SHOP, selectedShopId)
        .then(response => {
          console.log("API response:", response);
          
          if (Array.isArray(response)) {
            setProducts(response);
          } else {
            console.warn("Expected array but got:", response);
            setProducts([]);
            toast.error('Failed to load products for the shop');
          }
        })
        .catch((error) => {
          console.error("Error loading products:", error);
          setProducts([]);
          toast.error('Failed to load products for the shop');
        });
    } else {
      setProducts([]);
    }
  }, [selectedShopId]);

  // Handle shop selection change
  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    form.setValue('shopId', shopId);
    setShopSearch('');
    
    const currentMeasurements = form.getValues('measurements');
    const updatedMeasurements = currentMeasurements.map(measurement => ({
      ...measurement,
      includeThickCurtain: false,
      thickProductId: undefined,
      thickVariant: undefined,
      includeThinCurtain: false,
      thinProductId: undefined,
      thinVariant: undefined,
      includeCurtainPole: false,
      curtainPoleId: undefined,
      includeCurtainPulls: false,
      curtainPullsId: undefined,
      includeCurtainBrackets: false,
      curtainBracketsId: undefined,
      thickPrice: undefined,
      thinPrice: undefined,
      curtainPolePrice: undefined,
      thickAdditionalPriceId: undefined,
      thinAdditionalPriceId: undefined,
      curtainPoleAdditionalPriceId: undefined,
      curtainPullsBracketsPrice: 2000
    }));
    form.setValue('measurements', updatedMeasurements);
  };

  // Handle product selection change
  const handleProductChange = (
    index: number,
    field: keyof CurtainMeasurementFormValues['measurements'][0],
    value: string
  ) => {
    form.setValue(`measurements.${index}.${field}`, value);

    if (field === 'thickProductId') {
      form.setValue(`measurements.${index}.thickVariant`, undefined);
      form.setValue(`measurements.${index}.thickAdditionalPriceId`, undefined);
    } else if (field === 'thinProductId') {
      form.setValue(`measurements.${index}.thinVariant`, undefined);
      form.setValue(`measurements.${index}.thinAdditionalPriceId`, undefined);
    } else if (field === 'curtainPoleId') {
      form.setValue(`measurements.${index}.curtainPoleAdditionalPriceId`, undefined);
    }

    if (value && value !== "NONE") {
      const sellPrice = getProductSellPrice(value);
      
      if (field === 'thickProductId') {
        form.setValue(`measurements.${index}.thickPrice`, sellPrice);
      } else if (field === 'thinProductId') {
        form.setValue(`measurements.${index}.thinPrice`, sellPrice);
      } else if (field === 'curtainPoleId') {
        form.setValue(`measurements.${index}.curtainPolePrice`, sellPrice);
      }
    }
  };

  // Handle variant selection change
  const handleVariantChange = (
    index: number,
    productField: string,
    variantString: string
  ) => {
    const productId = form.getValues(`measurements.${index}.${productField}` as any);
    
    if (!productId || productId === "NONE") {
      toast.error('Please select a product first');
      return;
    }

    if (variantString === "NONE") {
      if (productField === 'thickProductId') {
        form.setValue(`measurements.${index}.thickVariant`, undefined);
      } else if (productField === 'thinProductId') {
        form.setValue(`measurements.${index}.thinVariant`, undefined);
      }
      return;
    }

    if (productField === 'thickProductId') {
      form.setValue(`measurements.${index}.thickVariant`, variantString);
    } else if (productField === 'thinProductId') {
      form.setValue(`measurements.${index}.thinVariant`, variantString);
    }
  };

  // Handle additional price selection change
  const handleAdditionalPriceChange = (index: number, productField: string, additionalPriceId: string) => {
    const productId = form.getValues(`measurements.${index}.${productField}` as any);
    
    if (!productId || productId === "NONE") {
      toast.error('Please select a product first');
      return;
    }

    if (additionalPriceId === "NONE") {
      const sellPrice = getProductSellPrice(productId);
      if (productField === 'thickProductId') {
        form.setValue(`measurements.${index}.thickAdditionalPriceId`, undefined);
        form.setValue(`measurements.${index}.thickPrice`, sellPrice);
      } else if (productField === 'thinProductId') {
        form.setValue(`measurements.${index}.thinAdditionalPriceId`, undefined);
        form.setValue(`measurements.${index}.thinPrice`, sellPrice);
      } else if (productField === 'curtainPoleId') {
        form.setValue(`measurements.${index}.curtainPoleAdditionalPriceId`, undefined);
        form.setValue(`measurements.${index}.curtainPolePrice`, sellPrice);
      }
      return;
    }

    const additionalPrice = getAdditionalPriceById(productId, additionalPriceId);
    if (!additionalPrice) {
      toast.error('Selected additional price not found');
      return;
    }

    const priceValue = parseFloat(additionalPrice.price);
    if (productField === 'thickProductId') {
      form.setValue(`measurements.${index}.thickAdditionalPriceId`, additionalPriceId);
      form.setValue(`measurements.${index}.thickPrice`, priceValue);
    } else if (productField === 'thinProductId') {
      form.setValue(`measurements.${index}.thinAdditionalPriceId`, additionalPriceId);
      form.setValue(`measurements.${index}.thinPrice`, priceValue);
    } else if (productField === 'curtainPoleId') {
      form.setValue(`measurements.${index}.curtainPoleAdditionalPriceId`, additionalPriceId);
      form.setValue(`measurements.${index}.curtainPolePrice`, priceValue);
    }
  };

  // Toggle section expansion
  const toggleSection = (index: number, section: string) => {
    const key = `${index}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Add new measurement
  const addMeasurement = () => {
    const currentMeasurements = form.getValues('measurements');
    form.setValue('measurements', [
      ...currentMeasurements,
      {
        // Required fields
        roomName: '',
        width: null,
        height: null,
        extrawidth: null,
        quantity: 1,
        
        // Optional fields
        size: 'NORMAL',
        curtainSize: 0,
        
        includeThickCurtain: false,
        thickProductId: undefined,
        thickVariant: undefined,
        thickMeter: 0,
        thickPrice: undefined,
        thickAdditionalPriceId: undefined,
        
        includeThinCurtain: false,
        thinProductId: undefined,
        thinVariant: undefined,
        thinMeter: 0,
        thinPrice: undefined,
        thinAdditionalPriceId: undefined,
        
        includeCurtainPole: false,
        curtainPoleId: undefined,
        curtainPoleQuantity: 0,
        curtainPolePrice: undefined,
        curtainPoleAdditionalPriceId: undefined,
        
        includeCurtainPulls: false,
        curtainPullsId: undefined,
        curtainPullsQuantity: 2,
        
        includeCurtainBrackets: false,
        curtainBracketsId: undefined,
        curtainBracketsQuantity: 2,
        curtainPullsBracketsPrice: 2000,
        
        includeWorkers: false,
        thickWorkerId: undefined,
        thinWorkerId: undefined,
        workerPrice: 250,
        totalWorkerMeter: 0,
        
        price: undefined,
        
        remark: ''
      }
    ]);
  };

  // Remove measurement
  const removeMeasurement = (index: number) => {
    const currentMeasurements = form.getValues('measurements');
    if (currentMeasurements.length > 1) {
      form.setValue('measurements', currentMeasurements.filter((_, i) => i !== index));
    }
  };

  // Update product search
  const handleProductSearch = (index: number, productType: string, value: string) => {
    setProductSearches(prev => ({
      ...prev,
      [`${index}-${productType}`]: value
    }));
  };

  // Update variant search
  const handleVariantSearch = (index: number, variantType: string, value: string) => {
    setVariantSearches(prev => ({
      ...prev,
      [`${index}-${variantType}`]: value
    }));
  };

  // Filter shops by search
  const filteredShops = useMemo(() => {
    return shops.filter(shop => 
      shop.name.toLowerCase().includes(shopSearch.toLowerCase())
    );
  }, [shops, shopSearch]);

  // Filter employees by search
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => 
      employee.name?.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  // Simple validation function
  const validateForm = (data: CurtainMeasurementFormValues): boolean => {
    if (!data.shopId || data.shopId.trim() === '') {
      toast.error('Please select a shop');
      return false;
    }

    for (let i = 0; i < data.measurements.length; i++) {
      const measurement = data.measurements[i];
      
      if (!measurement.roomName || measurement.roomName.trim() === '') {
        toast.error(`Measurement ${i + 1}: Room name is required`);
        return false;
      }

      if (!measurement.width || measurement.width <= 0) {
        toast.error(`Measurement ${i + 1}: Width must be greater than 0`);
        return false;
      }

      if (!measurement.height || measurement.height <= 0) {
        toast.error(`Measurement ${i + 1}: Height must be greater than 0`);
        return false;
      }

      // Validate extrawidth if provided (must be non-negative)
      if (measurement.extrawidth !== null && measurement.extrawidth !== undefined && measurement.extrawidth < 0) {
        toast.error(`Measurement ${i + 1}: Extra Width cannot be negative`);
        return false;
      }

      if ((measurement.quantity || 1) <= 0) {
        toast.error(`Measurement ${i + 1}: Quantity must be greater than 0`);
        return false;
      }

      // Only validate optional sections if they are included
      if (measurement.includeThickCurtain && measurement.thickProductId && measurement.thickProductId !== "NONE") {
        const productItem = getProductItem(measurement.thickProductId);
        if (productItem?.hasVariants && !measurement.thickVariant) {
          toast.error(`Measurement ${i + 1}: Please select a variant for the thick curtain`);
          return false;
        }
      }

      if (measurement.includeThinCurtain && measurement.thinProductId && measurement.thinProductId !== "NONE") {
        const productItem = getProductItem(measurement.thinProductId);
        if (productItem?.hasVariants && !measurement.thinVariant) {
          toast.error(`Measurement ${i + 1}: Please select a variant for the thin curtain`);
          return false;
        }
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
    const cleanedMeasurements = data.measurements.map(measurement => {
      const calculated = calculateFinalPrice(measurement);
      
      const cleaned: any = {
        roomName: measurement.roomName,
        width: measurement.width,
        height: measurement.height,
        extrawidth: measurement.extrawidth || null,
        curtainSize: calculated.curtainSize,
        quantity: measurement.quantity ?? 1,
        size: measurement.size,
        remark: measurement.remark === '' ? undefined : measurement.remark,
      };

      // Only include optional fields if they are enabled
      if (measurement.includeThickCurtain && measurement.thickProductId && measurement.thickProductId !== "NONE") {
        cleaned.thickProductId = measurement.thickProductId;
        cleaned.thickVariant = measurement.thickVariant;
        cleaned.thickMeter = calculated.thickMeter;
        cleaned.thickPrice = measurement.thickPrice;
      }

      if (measurement.includeThinCurtain && measurement.thinProductId && measurement.thinProductId !== "NONE") {
        cleaned.thinProductId = measurement.thinProductId;
        cleaned.thinVariant = measurement.thinVariant;
        cleaned.thinMeter = calculated.thinMeter;
        cleaned.thinPrice = measurement.thinPrice;
      }

      if (measurement.includeCurtainPole && measurement.curtainPoleId && measurement.curtainPoleId !== "NONE") {
        cleaned.curtainPoleId = measurement.curtainPoleId;
        cleaned.curtainPoleQuantity = calculated.curtainPoleQuantity;
        cleaned.curtainPolePrice = measurement.curtainPolePrice;
      }

      if (measurement.includeCurtainPulls && measurement.curtainPullsId && measurement.curtainPullsId !== "NONE") {
        cleaned.curtainPullsId = measurement.curtainPullsId;
        cleaned.curtainPullsQuantity = measurement.curtainPullsQuantity ?? 2;
      }

      if (measurement.includeCurtainBrackets && measurement.curtainBracketsId && measurement.curtainBracketsId !== "NONE") {
        cleaned.curtainBracketsId = measurement.curtainBracketsId;
        cleaned.curtainBracketsQuantity = measurement.curtainBracketsQuantity ?? 2;
        cleaned.curtainPullsBracketsPrice = measurement.curtainPullsBracketsPrice || 2000;
      }

      if (measurement.includeWorkers) {
        if (measurement.thickWorkerId && measurement.thickWorkerId !== "NONE") {
          cleaned.thickWorkerId = measurement.thickWorkerId;
        }
        if (measurement.thinWorkerId && measurement.thinWorkerId !== "NONE") {
          cleaned.thinWorkerId = measurement.thinWorkerId;
        }
        cleaned.workerPrice = measurement.workerPrice;
        cleaned.totalWorkerMeter = calculated.totalWorkerMeter;
      }

      cleaned.price = calculated.finalPrice;

      return cleaned;
    });

    const existingMeasurements = curtainOrder?.measurements ?? [];
    
    // Prepare bulk data: include measurementId for existing measurements, omit for new ones
    const bulkUpdateData = cleanedMeasurements.map((measurement, index) => {
      // If there's an existing measurement at this index, include its ID for update
      if (index < existingMeasurements.length && existingMeasurements[index]?.id) {
        return {
          measurementId: existingMeasurements[index].id,
          curtainMeasurementData: measurement
        };
      } else {
        // New measurement - no measurementId
        return {
          curtainMeasurementData: measurement
        };
      }
    });

    // Call the enhanced bulk update function that handles both updates and creates
    const result = await bulkUpdateCurtainMeasurements(
      orderId,
      bulkUpdateData,
      data.shopId ?? "",
    );

    // Show success message with details
    if (result.createdCount > 0 && result.updatedCount > 0) {
      toast.success(`Created ${result.createdCount} and updated ${result.updatedCount} curtain measurement(s) successfully`);
    } else if (result.createdCount > 0) {
      toast.success(`Created ${result.createdCount} curtain measurement(s) successfully`);
    } else if (result.updatedCount > 0) {
      toast.success(`Updated ${result.updatedCount} curtain measurement(s) successfully`);
    } else {
      toast.success('Curtain measurements saved successfully');
    }

    router.refresh();
    router.push(`/dashboard/CurtainOrder/view?id=${orderId}`);
  } catch (error) {
    console.error('Error saving curtain measurements:', error);
    toast.error('Failed to save curtain measurements');
  } finally {
    setIsLoading(false);
  }
};

  // Helper to filter products by category
  const getProductsByCategory = (category: string) => {
    return products.filter(item => {
      const product = item.product;
      if (!product) return false;
      
      switch (category) {
        case 'thickCurtain':
          return product.thickCurtain === true;
        case 'thinCurtain':
          return product.thinCurtain === true;
        case 'poleCurtain':
          return product.poleCurtain === true;
        case 'pullsCurtain':
          return product.pullsCurtain === true;
        case 'bracketsCurtain':
          return product.bracketsCurtain === true;
        default:
          return false;
      }
    });
  };

  // Filter products by search
  const getFilteredProductsByCategory = (category: string, searchTerm: string, index: number, productType: string) => {
    const products = getProductsByCategory(category).filter(item => item.availableQuantity > 0);
    const searchKey = `${index}-${productType}`;
    const search = productSearches[searchKey] || '';
    
    if (!search) return products;
    
    return products.filter(item => 
      item.product.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  // Filter variants by search
  const getFilteredVariants = (productId: string, searchTerm: string, index: number, variantType: string) => {
    const variants = getProductVariants(productId);
    const searchKey = `${index}-${variantType}`;
    const search = variantSearches[searchKey] || '';
    
    if (!search) return variants;
    
    return variants.filter(variant => {
      const variantString = formatVariantString(variant.height, variant.width);
      return variantString.includes(search) || 
             variant.area.toString().includes(search);
    });
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
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Shop Selection with Search */}
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
                        <div className="flex items-center px-3 pb-2">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <input
                            className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search shops..."
                            value={shopSearch}
                            onChange={(e) => setShopSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {filteredShops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            <div className="flex flex-col">
                              <span>{shop.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        {filteredShops.length === 0 && (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No shops found
                          </div>
                        )}
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
                <h3 className='text-lg font-semibold'>Curtain Measurements</h3>
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
                    Please select a shop first to see available curtain products
                  </p>
                </div>
              )}

              {/* Show all measurements */}
              {watchMeasurements.map((_, index) => {
                const calculated = calculateFinalPrice(watchMeasurements[index]);
                const measurement = watchMeasurements[index];
                
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

                    {/* Required Fields Section */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {/* Room Name - Required */}
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

                      {/* Quantity - Required */}
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

                      {/* Width - Required - EMPTY INSTEAD OF ZERO */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.width`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (m) <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min="1"
                                step="0.01"
                                placeholder='Width in m'
                                value={field.value === null || field.value === 0 ? '' : field.value}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : Number(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Height - Required - EMPTY INSTEAD OF ZERO */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.height`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (m) <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min="1"
                                step="0.01"
                                placeholder='Height in m'
                                value={field.value === null || field.value === 0 ? '' : field.value}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : Number(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Extra Width - NEW FIELD */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.extrawidth`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Width (m)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min="0"
                                step="0.01"
                                placeholder='Extra Width (optional)'
                                value={field.value === null || field.value === 0 ? '' : field.value}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : Number(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Size Type - Optional but with default */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.size`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Size Type</FormLabel>
                            <Select
                              value={field.value || 'NORMAL'}
                              onValueChange={(value: 'NORMAL' | 'TWO_POINT_FIVE' | 'THREE') => field.onChange(value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select size type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="NORMAL">Normal (×3)</SelectItem>
                                <SelectItem value="TWO_POINT_FIVE">2.5x</SelectItem>
                                <SelectItem value="THREE">3x</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Optional Sections with Toggle */}
                    
                    {/* Thick Curtain Section - Optional */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleSection(index, 'thickCurtain')}
                          className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                          {expandedSections[`${index}-thickCurtain`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Thick Curtain
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues(`measurements.${index}.includeThickCurtain`);
                            form.setValue(`measurements.${index}.includeThickCurtain`, !current);
                            if (!current) {
                              setExpandedSections(prev => ({ ...prev, [`${index}-thickCurtain`]: true }));
                            }
                          }}
                        >
                          {measurement.includeThickCurtain ? 'Remove' : 'Add Thick Curtain'}
                        </Button>
                      </div>
                      
                      {measurement.includeThickCurtain && expandedSections[`${index}-thickCurtain`] && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                          {/* Thick Curtain Product with Search */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.thickProductId`}
                            render={({ field }) => {
                              const filteredProducts = getFilteredProductsByCategory('thickCurtain', '', index, 'thick');
                              
                              return (
                                <FormItem>
                                  <FormLabel>Thick Curtain Product</FormLabel>
                                  <Select
                                    value={field.value || ''}
                                    onValueChange={(value) => handleProductChange(index, 'thickProductId', value)}
                                    disabled={products.length === 0}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select thick curtain product" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <div className="flex items-center px-3 pb-2">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                          className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                          placeholder="Search products..."
                                          value={productSearches[`${index}-thick`] || ''}
                                          onChange={(e) => handleProductSearch(index, 'thick', e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <SelectItem value="NONE">None</SelectItem>
                                      {filteredProducts.map(item => (
                                        <SelectItem key={`thick-${item.product.id}`} value={item.product.id}>
                                          <div className="flex flex-col">
                                            <span>{item.product.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              Available {item.availableQuantity} 
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* Thick Curtain Variant */}
                          {measurement.thickProductId && 
                           measurement.thickProductId !== "NONE" && 
                           getProductVariants(measurement.thickProductId).length > 0 && (
                            <FormField
                              control={form.control}
                              name={`measurements.${index}.thickVariant`}
                              render={({ field }) => {
                                const filteredVariants = getFilteredVariants(
                                  measurement.thickProductId!, 
                                  '', 
                                  index, 
                                  'thickVariant'
                                );
                                
                                return (
                                  <FormItem>
                                    <FormLabel>Select Variant</FormLabel>
                                    <Select
                                      value={field.value || ''}
                                      onValueChange={(value) => handleVariantChange(index, 'thickProductId', value)}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select variant" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <div className="flex items-center px-3 pb-2">
                                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                          <input
                                            className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                            placeholder="Search variants..."
                                            value={variantSearches[`${index}-thickVariant`] || ''}
                                            onChange={(e) => handleVariantSearch(index, 'thickVariant', e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <SelectItem value="NONE">No specific variant</SelectItem>
                                        {filteredVariants.map((variant) => {
                                          const variantString = formatVariantString(variant.height, variant.width);
                                          return (
                                            <SelectItem key={variant.id} value={variantString}>
                                              <div className="flex flex-col">
                                                <span>{variantString} m</span>
                                                <span className="text-xs text-muted-foreground">
                                                  Available: {variant.quantity}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          )}
                          
                          {/* Thick Meter */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.thickMeter`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thick Meter (m)</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    readOnly
                                    value={calculated.thickMeter.toFixed(2)}
                                    className="bg-gray-50"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          {/* Thick Price */}
                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name={`measurements.${index}.thickPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Thick Price</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      min="0"
                                      step="0.01"
                                      placeholder='0.00'
                                      value={field.value ?? ''}
                                      onChange={(e) =>
                                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Additional Price Selection */}
                            {measurement.thickProductId && 
                             measurement.thickProductId !== "NONE" && (
                              <FormField
                                control={form.control}
                                name={`measurements.${index}.thickAdditionalPriceId`}
                                render={({ field }) => {
                                  const additionalPrices = getProductAdditionalPrices(measurement.thickProductId!);

                                  return (
                                    <FormItem>
                                      <FormLabel className="text-xs">Select Additional Price</FormLabel>
                                      {additionalPrices.length === 0 ? (
                                        <div className="text-xs text-muted-foreground">
                                          No additional price options available.
                                        </div>
                                      ) : (
                                        <Select
                                          value={field.value || ''}
                                          onValueChange={(value) => handleAdditionalPriceChange(index, 'thickProductId', value)}
                                        >
                                          <FormControl>
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Use sell price" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="NONE">
                                              Use sell price: {getProductSellPrice(measurement.thickProductId!)}
                                            </SelectItem>
                                            {additionalPrices.map((priceOption: any) => (
                                              <SelectItem key={priceOption.id} value={priceOption.id}>
                                                {priceOption.label}: {priceOption.price}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </FormItem>
                                  );
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Thin Curtain Section - Optional */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleSection(index, 'thinCurtain')}
                          className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                          {expandedSections[`${index}-thinCurtain`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Thin Curtain
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues(`measurements.${index}.includeThinCurtain`);
                            form.setValue(`measurements.${index}.includeThinCurtain`, !current);
                            if (!current) {
                              setExpandedSections(prev => ({ ...prev, [`${index}-thinCurtain`]: true }));
                            }
                          }}
                        >
                          {measurement.includeThinCurtain ? 'Remove' : 'Add Thin Curtain'}
                        </Button>
                      </div>
                      
                      {measurement.includeThinCurtain && expandedSections[`${index}-thinCurtain`] && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                          {/* Thin Curtain Product with Search */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.thinProductId`}
                            render={({ field }) => {
                              const filteredProducts = getFilteredProductsByCategory('thinCurtain', '', index, 'thin');
                              
                              return (
                                <FormItem>
                                  <FormLabel>Thin Curtain Product</FormLabel>
                                  <Select
                                    value={field.value || ''}
                                    onValueChange={(value) => handleProductChange(index, 'thinProductId', value)}
                                    disabled={products.length === 0}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select thin curtain product" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <div className="flex items-center px-3 pb-2">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                          className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                          placeholder="Search products..."
                                          value={productSearches[`${index}-thin`] || ''}
                                          onChange={(e) => handleProductSearch(index, 'thin', e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <SelectItem value="NONE">None</SelectItem>
                                      {filteredProducts.map(item => (
                                        <SelectItem key={`thin-${item.product.id}`} value={item.product.id}>
                                          <div className="flex flex-col">
                                            <span>{item.product.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              Available {item.availableQuantity} 
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* Thin Curtain Variant */}
                          {measurement.thinProductId && 
                           measurement.thinProductId !== "NONE" && 
                           getProductVariants(measurement.thinProductId).length > 0 && (
                            <FormField
                              control={form.control}
                              name={`measurements.${index}.thinVariant`}
                              render={({ field }) => {
                                const filteredVariants = getFilteredVariants(
                                  measurement.thinProductId!, 
                                  '', 
                                  index, 
                                  'thinVariant'
                                );
                                
                                return (
                                  <FormItem>
                                    <FormLabel>Select Variant</FormLabel>
                                    <Select
                                      value={field.value || ''}
                                      onValueChange={(value) => handleVariantChange(index, 'thinProductId', value)}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select variant" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <div className="flex items-center px-3 pb-2">
                                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                          <input
                                            className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                            placeholder="Search variants..."
                                            value={variantSearches[`${index}-thinVariant`] || ''}
                                            onChange={(e) => handleVariantSearch(index, 'thinVariant', e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <SelectItem value="NONE">No specific variant</SelectItem>
                                        {filteredVariants.map((variant) => {
                                          const variantString = formatVariantString(variant.height, variant.width);
                                          return (
                                            <SelectItem key={variant.id} value={variantString}>
                                              <div className="flex flex-col">
                                                <span>{variantString} m</span>
                                                <span className="text-xs text-muted-foreground">
                                                  Available: {variant.quantity}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          )}
                          
                          {/* Thin Meter */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.thinMeter`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thin Meter (m)</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    readOnly
                                    value={calculated.thinMeter.toFixed(2)}
                                    className="bg-gray-50"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          {/* Thin Price */}
                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name={`measurements.${index}.thinPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Thin Price</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      min="0"
                                      step="0.01"
                                      placeholder='0.00'
                                      value={field.value ?? ''}
                                      onChange={(e) =>
                                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Additional Price Selection */}
                            {measurement.thinProductId && 
                             measurement.thinProductId !== "NONE" && (
                              <FormField
                                control={form.control}
                                name={`measurements.${index}.thinAdditionalPriceId`}
                                render={({ field }) => {
                                  const additionalPrices = getProductAdditionalPrices(measurement.thinProductId!);

                                  return (
                                    <FormItem>
                                      <FormLabel className="text-xs">Select Additional Price</FormLabel>
                                      {additionalPrices.length === 0 ? (
                                        <div className="text-xs text-muted-foreground">
                                          No additional price options available.
                                        </div>
                                      ) : (
                                        <Select
                                          value={field.value || ''}
                                          onValueChange={(value) => handleAdditionalPriceChange(index, 'thinProductId', value)}
                                        >
                                          <FormControl>
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Use sell price" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="NONE">
                                              Use sell price: {getProductSellPrice(measurement.thinProductId!)}
                                            </SelectItem>
                                            {additionalPrices.map((priceOption: any) => (
                                              <SelectItem key={priceOption.id} value={priceOption.id}>
                                                {priceOption.label}: {priceOption.price}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </FormItem>
                                  );
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Curtain Pole Section - Optional */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleSection(index, 'curtainPole')}
                          className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                          {expandedSections[`${index}-curtainPole`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Curtain Rode
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues(`measurements.${index}.includeCurtainPole`);
                            form.setValue(`measurements.${index}.includeCurtainPole`, !current);
                            if (!current) {
                              setExpandedSections(prev => ({ ...prev, [`${index}-curtainPole`]: true }));
                            }
                          }}
                        >
                          {measurement.includeCurtainPole ? 'Remove' : 'Add Curtain Rode'}
                        </Button>
                      </div>
                      
                      {measurement.includeCurtainPole && expandedSections[`${index}-curtainPole`] && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          {/* Curtain Pole Product with Search */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.curtainPoleId`}
                            render={({ field }) => {
                              const filteredProducts = getFilteredProductsByCategory('poleCurtain', '', index, 'pole');
                              
                              return (
                                <FormItem>
                                  <FormLabel>Curtain Rode</FormLabel>
                                  <Select
                                    value={field.value || ''}
                                    onValueChange={(value) => handleProductChange(index, 'curtainPoleId', value)}
                                    disabled={products.length === 0}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select curtain rode" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <div className="flex items-center px-3 pb-2">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                          className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                          placeholder="Search products..."
                                          value={productSearches[`${index}-pole`] || ''}
                                          onChange={(e) => handleProductSearch(index, 'pole', e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <SelectItem value="NONE">None</SelectItem>
                                      {filteredProducts.map(item => (
                                        <SelectItem key={`pole-${item.product.id}`} value={item.product.id}>
                                          <div className="flex flex-col">
                                            <span>{item.product.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              Available {item.availableQuantity} 
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* Curtain Pole Quantity */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.curtainPoleQuantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rode Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    
                                    value={calculated.curtainPoleQuantity.toFixed(2)}
                                    className="bg-gray-50"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Curtain Pole Price */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.curtainPolePrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rode Price</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min="0"
                                    step="0.01"
                                    placeholder='0.00'
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Curtain Pulls Section - Optional */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleSection(index, 'curtainPulls')}
                          className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                          {expandedSections[`${index}-curtainPulls`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Belt
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues(`measurements.${index}.includeCurtainPulls`);
                            form.setValue(`measurements.${index}.includeCurtainPulls`, !current);
                            if (!current) {
                              setExpandedSections(prev => ({ ...prev, [`${index}-curtainPulls`]: true }));
                            }
                          }}
                        >
                          {measurement.includeCurtainPulls ? 'Remove' : 'Add Belt'}
                        </Button>
                      </div>
                      
                      {measurement.includeCurtainPulls && expandedSections[`${index}-curtainPulls`] && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {/* Curtain Pulls Product with Search */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.curtainPullsId`}
                            render={({ field }) => {
                              const filteredProducts = getFilteredProductsByCategory('pullsCurtain', '', index, 'pulls');
                              
                              return (
                                <FormItem>
                                  <FormLabel>Belt</FormLabel>
                                  <Select
                                    value={field.value || ''}
                                    onValueChange={(value) => handleProductChange(index, 'curtainPullsId', value)}
                                    disabled={products.length === 0}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select belt" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <div className="flex items-center px-3 pb-2">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                          className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                          placeholder="Search products..."
                                          value={productSearches[`${index}-pulls`] || ''}
                                          onChange={(e) => handleProductSearch(index, 'pulls', e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <SelectItem value="NONE">None</SelectItem>
                                      {filteredProducts.map(item => (
                                        <SelectItem key={`pulls-${item.product.id}`} value={item.product.id}>
                                          <div className="flex flex-col">
                                            <span>{item.product.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              Available {item.availableQuantity} 
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* Curtain Pulls Quantity */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.curtainPullsQuantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Belt Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min="1"
                                    value={field.value ?? 2}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Curtain Brackets Section - Optional */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleSection(index, 'curtainBrackets')}
                          className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                          {expandedSections[`${index}-curtainBrackets`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Holder
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues(`measurements.${index}.includeCurtainBrackets`);
                            form.setValue(`measurements.${index}.includeCurtainBrackets`, !current);
                            if (!current) {
                              setExpandedSections(prev => ({ ...prev, [`${index}-curtainBrackets`]: true }));
                            }
                          }}
                        >
                          {measurement.includeCurtainBrackets ? 'Remove' : 'Add Holder'}
                        </Button>
                      </div>
                      
                      {measurement.includeCurtainBrackets && expandedSections[`${index}-curtainBrackets`] && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {/* Curtain Brackets Product with Search */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.curtainBracketsId`}
                            render={({ field }) => {
                              const filteredProducts = getFilteredProductsByCategory('bracketsCurtain', '', index, 'brackets');
                              
                              return (
                                <FormItem>
                                  <FormLabel>Holder</FormLabel>
                                  <Select
                                    value={field.value || ''}
                                    onValueChange={(value) => handleProductChange(index, 'curtainBracketsId', value)}
                                    disabled={products.length === 0}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select holder" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <div className="flex items-center px-3 pb-2">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                          className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                          placeholder="Search products..."
                                          value={productSearches[`${index}-brackets`] || ''}
                                          onChange={(e) => handleProductSearch(index, 'brackets', e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <SelectItem value="NONE">None</SelectItem>
                                      {filteredProducts.map(item => (
                                        <SelectItem key={`brackets-${item.product.id}`} value={item.product.id}>
                                          <div className="flex flex-col">
                                            <span>{item.product.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              Available {item.availableQuantity} 
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* Curtain Brackets Quantity */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.curtainBracketsQuantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Holder Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min="1"
                                    value={field.value ?? 2}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Pulls & Brackets Price - only show if either is included */}
                    {(measurement.includeCurtainPulls || measurement.includeCurtainBrackets) && (
                      <div className="pt-2">
                        <FormField
                          control={form.control}
                          name={`measurements.${index}.curtainPullsBracketsPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Belt & Holder Price</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  min="0"
                                  step="0.01"
                                  value={field.value ?? 2000}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Default price is 2000, but can be edited
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <Separator className="my-4" />

                    {/* Worker Section - Optional */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleSection(index, 'workers')}
                          className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                          {expandedSections[`${index}-workers`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Worker Assignment
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues(`measurements.${index}.includeWorkers`);
                            form.setValue(`measurements.${index}.includeWorkers`, !current);
                            if (!current) {
                              setExpandedSections(prev => ({ ...prev, [`${index}-workers`]: true }));
                            }
                          }}
                        >
                          {measurement.includeWorkers ? 'Remove' : 'Add Workers'}
                        </Button>
                      </div>
                      
                      {measurement.includeWorkers && expandedSections[`${index}-workers`] && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                          {/* Thick Worker Assignment */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.thickWorkerId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thick Curtain Worker</FormLabel>
                                <Select
                                  value={field.value || ''}
                                  onValueChange={field.onChange}
                                  disabled={isLoadingEmployees}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Assign worker" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <div className="flex items-center px-3 pb-2">
                                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                      <input
                                        className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                        placeholder="Search employees..."
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    <SelectItem value="NONE">Not assigned</SelectItem>
                                    {filteredEmployees.map((employee) => (
                                      <SelectItem key={employee.id} value={employee.id??''}>
                                        {employee.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Thin Worker Assignment */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.thinWorkerId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thin Curtain Worker</FormLabel>
                                <Select
                                  value={field.value || ''}
                                  onValueChange={field.onChange}
                                  disabled={isLoadingEmployees}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Assign worker" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <div className="flex items-center px-3 pb-2">
                                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                      <input
                                        className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                        placeholder="Search employees..."
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    <SelectItem value="NONE">Not assigned</SelectItem>
                                    {filteredEmployees.map((employee) => (
                                      <SelectItem key={employee.id} value={employee.id??''}>
                                        {employee.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Worker Price */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.workerPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Worker Price</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min="0"
                                    step="0.01"
                                    placeholder='0.00'
                                    value={field.value ?? 250}
                                    onChange={(e) =>
                                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Total Worker Meter */}
                          <FormField
                            control={form.control}
                            name={`measurements.${index}.totalWorkerMeter`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Worker Meter</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    readOnly
                                    value={calculated.totalWorkerMeter.toFixed(2)}
                                    className="bg-gray-50"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Final Price and Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Final Price */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Final Price (Auto-calculated)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                readOnly
                                value={calculated.finalPrice.toFixed(2)}
                                className="bg-gray-50 font-medium"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Remark */}
                      <FormField
                        control={form.control}
                        name={`measurements.${index}.remark`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remark</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Optional notes for this measurement'
                                value={field.value ?? ''}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Cost Summary */}
                    <div className='text-sm text-muted-foreground pt-2 border-t mt-4'>
                      <span className='font-medium'>Cost Summary: </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        <div>
                          <span>Curtain Size: {calculated.curtainSize.toFixed(2)} m</span>
                        </div>
                        {measurement.includeThickCurtain && (
                          <div>
                            <span>Thick Curtain Amount: {calculated.thickTotal.toFixed(2)}</span>
                          </div>
                        )}
                        {measurement.includeThinCurtain && (
                          <div>
                            <span>Thin Curtain Amount: {calculated.thinTotal.toFixed(2)}</span>
                          </div>
                        )}
                        {measurement.includeCurtainPole && (
                          <div>
                            <span>Curtain Rode Amount: {calculated.poleTotal.toFixed(2)}</span>
                          </div>
                        )}
                        {(measurement.includeCurtainPulls || measurement.includeCurtainBrackets) && (
                          <div>
                            <span>Accessories (Belt & Holder): {calculated.pullsBracketsTotal.toFixed(2)}</span>
                          </div>
                        )}
                        {measurement.includeWorkers && (
                          <div>
                            <span>Labor Amount: {calculated.totalWorkerMeter.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="col-span-2 font-medium mt-1">
                          <span>Grand Total: {calculated.finalPrice.toFixed(2)}</span>
                        </div>
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
                onClick={() => router.push(`/curtain-orders/${orderId}`)}
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