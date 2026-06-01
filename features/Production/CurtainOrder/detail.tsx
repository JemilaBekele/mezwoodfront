/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  User,
  Calendar,
  DollarSign,
  Ruler,
  Home,
  Package,
  Users,
  Check,
  X,
  Loader2,
  Building,
  MoveRight,
  AlertCircle,
  PlusCircle,
  RulerIcon,
  Construction,
  Trash2,
  Square,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  CalendarClock,
  Truck,
  Scissors
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  getCurtainOrderId,
  deleteCurtainOrder,
  deletemeasurements,
  updateCurtainOrderPayment,
  updateCurtainOrderStatus,
  updateCurtainOrderDeliveryDeadline,
} from '@/service/Curtain';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { useRouter } from 'next/navigation';
import { ICurtainMeasurement, ICurtainOrder} from '@/models/curtainType';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertModal } from '@/components/modal/alert-modal';
import { getAllEmploy } from '@/service/employee';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { TransferEntityType } from '@/models/transfer';

type CurtainOrderDetailPageProps = {
  id?: string;
};

// Curtain Rod Cutting interface
interface CurtainRodCutting {
  measurementId: string;
  curtainRodVariantId: string;
  requestedWidth: number;
}

interface PaymentFormData {
  amount: number;
  paymentMethod?: 'CASH' | 'TELEBIRR' | 'TRANSFER' | 'CBE' | 'AWASH' | 'DASHEN' | 'ABYSSINIA' | 'HIBRET' | 'NIB' | 'OROMIA' | 'BERHAN' | 'BUNNA' | 'ZEMEN' | 'ENAT' | 'COOP' | 'WEGAGEN' | 'AMHARA' | 'TSEHAY' | 'GOH' | 'HIJRA' | 'SIINQEE' | 'SHABELLE' | 'AHMAD' | 'ADDIS' | 'LION' | 'GADA' | 'RAYA';
  note?: string;
  paymentDate?: string;
}

interface StatusUpdateData {
  curtainStatus: 'PENDING' | 'FINISHED' | 'RETURNED' | 'COMPLETED' | 'CANCELLED' | 'DELIVERED';
  curtainstatusnote?: string;
  deliveredById?: string;
  curtainRodCuttings?: CurtainRodCutting[];
}

interface DeliveryDeadlineFormData {
  deliveryDeadline: string;
}

// Product variant type
interface ProductVariant {
  id: string;
  height: number;
  width: number;
  quantity: number;
  area: number;
  totalArea: number;
}

interface Product {
  id: string;
  productId: string;
  name: string;
 availableQuantity: number;
  quantity?: number; // For non-variant products
  variants: ProductVariant[];
  hasVariants: boolean;
    product?: {
    name: string;
    poleCurtain: boolean;
    sellPrice: string;
  };
}

const getOrderStatus = (order: ICurtainOrder) => {
  switch (order.curtainStatus) {
    case 'PENDING':
      return { text: 'Pending', variant: 'outline' as const };
    case 'COMPLETED':
      if (order.paymentStatus === 'PAID') {
        return { text: 'Complete and Paid', variant: 'default' as const };
      } else {
        return { text: 'Complete but not paid', variant: 'destructive' as const };
      }
    case 'DELIVERED':
      return { text: 'Delivered', variant: 'default' as const };
    case 'CANCELLED':
      return { text: 'Cancelled', variant: 'secondary' as const };
    default:
      return { text: 'Pending', variant: 'outline' as const };
  }
};

const separateMeasurements = (measurements: ICurtainMeasurement[]) => {
  const curtainMeasurements = measurements.filter(m => !m.shatterVerticalProductId);
  const shatterVerticalMeasurements = measurements.filter(m => m.shatterVerticalProductId);
  return { curtainMeasurements, shatterVerticalMeasurements };
};

const calculateTotalMeasurements = (measurements: ICurtainMeasurement[]) => {
  return {
    totalQuantity: measurements.reduce((sum, m) => sum + (m.quantity || 0), 0),
    totalAmount: measurements.reduce((sum, m) => sum + (m.price || 0), 0),
    totalRooms: new Set(measurements.map(m => m.roomName)).size,
    totalThick: measurements.reduce((sum, m) => sum + (m.thickMeter || 0), 0),
    totalThin: measurements.reduce((sum, m) => sum + (m.thinMeter || 0), 0),
    totalWorkerMeter: measurements.reduce((sum, m) => sum + (m.totalWorkerMeter || 0), 0)
  };
};

const CurtainOrderDetailPage: React.FC<CurtainOrderDetailPageProps> = ({
  id
}) => {
  const [curtainOrder, setCurtainOrder] = useState<ICurtainOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingDeliveryDeadline, setUpdatingDeliveryDeadline] = useState(false);
  
  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeliveryDeadlineModalOpen, setIsDeliveryDeadlineModalOpen] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: 0,
    paymentMethod: undefined,
    note: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  
  const [statusForm, setStatusForm] = useState<StatusUpdateData>({
    curtainStatus: 'PENDING',
    curtainstatusnote: '',
    deliveredById: '',
    curtainRodCuttings: [],
  });
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // State for curtain rod cutting products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  
  const [deliveryDeadlineForm, setDeliveryDeadlineForm] = useState<DeliveryDeadlineFormData>({
    deliveryDeadline: '',
  });
  
  const router = useRouter();

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const data = await getAllEmploy();
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);


// Update getAvailableVariants function to handle both types
// Update getAvailableRodVariants to accept any rod variant that can be cut to 6m x 1m
const getAvailableRodVariants = (product: Product) => {
  if (!product) return [];
  
  // For products with variants, show ALL variants that have quantity > 0
  // Since these rods can be cut to any size (max 6m requested)
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    // Show all variants that have stock, regardless of dimensions
    // The rod will be cut down to the requested width (max 6m)
    return product.variants.filter(v => v.quantity > 0);
  }
  
  // For products without variants, check if they have quantity > 0
  if (!product.hasVariants && (product.quantity || product.availableQuantity) > 0) {
    return [{
      id: product.id,
      width: 0, // Unknown width, will be specified by user
      height: 0, // Unknown height
      quantity: product.quantity || product.availableQuantity,
      area: 0,
      totalArea: 0
    }];
  }
  
  return [];
};

// Update the fetchProducts function to better identify curtain rods
const fetchProducts = useCallback(async (shopId: string) => {
  if (!shopId) return;
  
  try {
    setLoadingProducts(true);
    const response = await getAvailableProductsBySource(TransferEntityType.SHOP, shopId);
    console.log("Available products:", response);
    
    if (Array.isArray(response)) {
      // Map the response to our Product interface
      const mappedProducts: Product[] = response.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.product?.name || item.name || 'Unknown',
        availableQuantity: item.availableQuantity,
        quantity: item.quantity,
        hasVariants: item.hasVariants,
        variants: item.variants || [],
        product: item.product
      }));
      
      setProducts(mappedProducts);
    } else {
      setProducts([]);
    }
  } catch (error) {
    console.error('Error loading products:', error);
    setProducts([]);
    toast.error('Failed to load products for cutting');
  } finally {
    setLoadingProducts(false);
  }
}, []);

  const fetchCurtainOrder = useCallback(async () => {
    try {
      if (id) {
        const orderData = await getCurtainOrderId(id);
        setCurtainOrder(orderData);
        
        setStatusForm({
          curtainStatus: orderData.curtainStatus,
          curtainstatusnote: orderData.curtainstatusnote || '',
          deliveredById: orderData.deliveredById || '',
          curtainRodCuttings: [],
        });

        if (orderData.deliveryDeadline) {
          const date = new Date(orderData.deliveryDeadline);
          const formattedDate = date.toISOString().split('T')[0];
          setDeliveryDeadlineForm({
            deliveryDeadline: formattedDate,
          });
        } else {
          setDeliveryDeadlineForm({
            deliveryDeadline: '',
          });
        }
        
        // Set shop ID for product fetching
        if (orderData.ShopId) {
          setSelectedShopId(orderData.ShopId);
        }
      }
    } catch (error) {
      console.error('Error fetching curtain order:', error);
      toast.error('Failed to fetch curtain order details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCurtainOrder();
  }, [fetchCurtainOrder, id]);

  // Fetch products when shop is identified
  useEffect(() => {
    if (selectedShopId) {
      fetchProducts(selectedShopId);
    }
  }, [selectedShopId, fetchProducts]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      window.print();
    } catch {
      toast.error('Failed to print order');
    } finally {
      setPrinting(false);
    }
  };

  const handleAddCurtainMeasurement = () => {
    if (id) {
      router.push(`/dashboard/CurtainOrder/${id}`);
    }
  };
  
  const handleworklog= () => {
    if (id) {
      router.push(`/dashboard/CurtainWorkerType/${id}`);
    }
  };

  const handleAddShatterVerticalMeasurement = () => {
    if (id) {
      router.push(`/dashboard/CurtainOrder/shattervertical/${id}`);
    }
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    
    if (!window.confirm('Are you sure you want to delete this curtain order? This action cannot be undone.')) {
      return;
    }

    setDeletingOrder(true);
    try {
      await deleteCurtainOrder(id);
      toast.success('Curtain order deleted successfully');
      router.push('/dashboard/CurtainOrder');
    } catch (error) {
      console.error('Error deleting curtain order:', error);
      toast.error('Failed to delete curtain order');
    } finally {
      setDeletingOrder(false);
    }
  };

  const handleDeleteMeasurement = async (measurementId: string) => {
    if (!window.confirm('Are you sure you want to delete this measurement?')) {
      return;
    }

    try {
      await deletemeasurements(measurementId);
      toast.success('Measurement deleted successfully');
      fetchCurtainOrder();
    } catch (error) {
      console.error('Error deleting measurement:', error);
      toast.error('Failed to delete measurement');
    }
  };

  // Payment Modal Handlers
  const handleOpenPaymentModal = () => {
    if (!curtainOrder) return;
    
    setPaymentForm({
      amount: 0,
      paymentMethod: undefined,
      note: '',
      paymentDate: new Date().toISOString().split('T')[0],
    });
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentForm({
      amount: 0,
      paymentMethod: undefined,
      note: '',
      paymentDate: new Date().toISOString().split('T')[0],
    });
  };

  const handlePaymentFormChange = (field: keyof PaymentFormData, value: any) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdatePayment = async () => {
    if (!id || !curtainOrder) return;
    
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setUpdatingPayment(true);
    try {
      const payload: any = {
        amount: paymentForm.amount,
      };
      
      if (paymentForm.paymentMethod) {
        payload.paymentMethod = paymentForm.paymentMethod;
      }
      
      if (paymentForm.note) {
        payload.note = paymentForm.note;
      }
      
      if (paymentForm.paymentDate) {
        const date = new Date(paymentForm.paymentDate);
        payload.paymentDate = date.toISOString();
      }
      
      await updateCurtainOrderPayment(id, payload);
      toast.success('Payment added successfully');
      fetchCurtainOrder();
      setIsPaymentModalOpen(false);
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast.error(error.response?.data?.message || 'Failed to add payment');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Curtain Rod Cutting Handlers
  const addCurtainRodCutting = () => {
    setStatusForm(prev => ({
      ...prev,
      curtainRodCuttings: [
        ...(prev.curtainRodCuttings || []),
        { measurementId: '', curtainRodVariantId: '', requestedWidth: 0 }
      ]
    }));
  };

  const removeCurtainRodCutting = (index: number) => {
    setStatusForm(prev => ({
      ...prev,
      curtainRodCuttings: (prev.curtainRodCuttings || []).filter((_, i) => i !== index)
    }));
  };

  const updateCurtainRodCutting = (index: number, field: keyof CurtainRodCutting, value: any) => {
    setStatusForm(prev => {
      const updatedCuttings = [...(prev.curtainRodCuttings || [])];
      updatedCuttings[index] = { ...updatedCuttings[index], [field]: value };
      return { ...prev, curtainRodCuttings: updatedCuttings };
    });
  };

  // Get available variants for a product
  const getAvailableVariants = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.hasVariants) return [];
    return product.variants.filter(v => v.width === 6 && v.height === 1); // Only show 6x1 variants
  };

  // Status Modal Handlers
  const handleOpenStatusModal = () => {
    if (!curtainOrder) return;
    
    setStatusForm({
      curtainStatus: curtainOrder.curtainStatus as any,
      curtainstatusnote: curtainOrder.curtainstatusnote || '',
      deliveredById: curtainOrder.deliveredById || '',
      curtainRodCuttings: [],
    });
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setStatusForm({
      curtainStatus: curtainOrder?.curtainStatus as any || 'PENDING',
      curtainstatusnote: '',
      deliveredById: '',
      curtainRodCuttings: [],
    });
  };

  const handleStatusFormChange = (field: keyof StatusUpdateData, value: any) => {
    setStatusForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateStatus = async () => {
    if (!id || !curtainOrder) return;

    if (statusForm.curtainStatus === 'CANCELLED' && curtainOrder.paymentStatus === 'PAID') {
      toast.error('Cannot cancel an order that is already paid');
      return;
    }

    if (statusForm.curtainStatus === 'COMPLETED' && (!curtainOrder.measurements || curtainOrder.measurements.length === 0)) {
      toast.error('Cannot mark as completed without measurements');
      return;
    }



    // Validate curtain rod cuttings for DELIVERED status
  // Validate curtain rod cuttings for DELIVERED status
if (statusForm.curtainStatus === 'DELIVERED' && statusForm.curtainRodCuttings && statusForm.curtainRodCuttings.length > 0) {
  for (const cutting of statusForm.curtainRodCuttings) {
    if (!cutting.measurementId) {
      toast.error('Please select a measurement for each curtain rod cutting');
      return;
    }
    if (!cutting.curtainRodVariantId) {
      toast.error('Please select a curtain rod variant for each cutting');
      return;
    }
    
    // Get the selected measurement and variant
    const selectedMeasurement = curtainMeasurements.find(m => m.id === cutting.measurementId);
    const selectedProduct = products.find(p => p.productId === selectedMeasurement?.curtainPoleId);
    const availableVariants = selectedProduct ? getAvailableRodVariants(selectedProduct) : [];
    const selectedVariant = availableVariants.find(v => v.id === cutting.curtainRodVariantId);
    
    if (!cutting.requestedWidth || cutting.requestedWidth <= 0) {
      toast.error('Requested width must be greater than 0');
      return;
    }
    
    // Validate against variant width if known
    if (selectedVariant && selectedVariant.width > 0 && cutting.requestedWidth > selectedVariant.width) {
      toast.error(`Requested width (${cutting.requestedWidth}m) exceeds variant width (${selectedVariant.width}m)`);
      return;
    }
    
    if (cutting.requestedWidth > 6) {
      toast.error('Requested width cannot exceed 6 meters');
      return;
    }
  }
}

    setUpdatingStatus(true);
    try {
      const payload: any = {
        curtainStatus: statusForm.curtainStatus,
      };
      
      if (statusForm.curtainstatusnote) {
        payload.curtainstatusnote = statusForm.curtainstatusnote;
      }
      
      if (statusForm.deliveredById) {
        payload.deliveredById = statusForm.deliveredById;
      }
      
      if (statusForm.curtainRodCuttings && statusForm.curtainRodCuttings.length > 0) {
        payload.curtainRodCuttings = statusForm.curtainRodCuttings;
      }
      
      await updateCurtainOrderStatus(id, payload);
      toast.success('Status updated successfully');
      fetchCurtainOrder();
      setIsStatusModalOpen(false);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delivery Deadline Modal Handlers
  const handleOpenDeliveryDeadlineModal = () => {
    if (!curtainOrder) return;
    
    if (curtainOrder.deliveryDeadline) {
      const date = new Date(curtainOrder.deliveryDeadline);
      const formattedDate = date.toISOString().split('T')[0];
      setDeliveryDeadlineForm({
        deliveryDeadline: formattedDate,
      });
    } else {
      setDeliveryDeadlineForm({
        deliveryDeadline: '',
      });
    }
    setIsDeliveryDeadlineModalOpen(true);
  };

  const handleCloseDeliveryDeadlineModal = () => {
    setIsDeliveryDeadlineModalOpen(false);
  };

  const handleDeliveryDeadlineFormChange = (field: keyof DeliveryDeadlineFormData, value: string) => {
    setDeliveryDeadlineForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateDeliveryDeadline = async () => {
    if (!id || !curtainOrder) return;

    if (!deliveryDeadlineForm.deliveryDeadline) {
      toast.error('Please select a delivery deadline date');
      return;
    }

    setUpdatingDeliveryDeadline(true);
    try {
      const date = new Date(deliveryDeadlineForm.deliveryDeadline);
      const isoDateString = date.toISOString();

      await updateCurtainOrderDeliveryDeadline(id, isoDateString);
      toast.success('Delivery deadline updated successfully');
      fetchCurtainOrder();
      setIsDeliveryDeadlineModalOpen(false);
    } catch (error: any) {
      console.error('Error updating delivery deadline:', error);
      toast.error(error.response?.data?.message || 'Failed to update delivery deadline');
    } finally {
      setUpdatingDeliveryDeadline(false);
    }
  };

  useEffect(() => {
    if (isStatusModalOpen && statusForm.curtainStatus === 'DELIVERED') {
      fetchEmployees();
    }
  }, [isStatusModalOpen, statusForm.curtainStatus, fetchEmployees]);

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading curtain order details...</p>
      </div>
    );
  }

  if (!curtainOrder) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <AlertCircle className='mr-2 h-6 w-6' />
        <p>Curtain order not found</p>
      </div>
    );
  }

  const allMeasurements = curtainOrder.measurements || [];
  const { curtainMeasurements, shatterVerticalMeasurements } = separateMeasurements(allMeasurements);
  const totalStats = calculateTotalMeasurements(allMeasurements);
  const orderStatus = getOrderStatus(curtainOrder);
  const hasBalance = (curtainOrder.balance || 0) > 0;
  const hasAnyMeasurements = allMeasurements.length > 0;
  const hasCurtainMeasurements = curtainMeasurements.length > 0;
  const hasShatterVerticalMeasurements = shatterVerticalMeasurements.length > 0;

  const curtainTotal = curtainMeasurements.reduce((sum, m) => sum + (m.price || 0), 0);
  const shatterTotal = shatterVerticalMeasurements.reduce((sum, m) => sum + (m.price || 0), 0);
  const siteFee = curtainOrder.isSiteMeasured ? (curtainOrder.siteMeasurePrice || 0) : 0;
  const calculatedTotal = curtainTotal + shatterTotal + siteFee;

  const isDeliveryOverdue = () => {
    if (!curtainOrder.deliveryDeadline) return false;
    if (curtainOrder.curtainStatus === 'DELIVERED' || curtainOrder.curtainStatus === 'CANCELLED') return false;
    
    const deadline = new Date(curtainOrder.deliveryDeadline);
    const today = new Date();
    return deadline < today;
  };

  const overdue = isDeliveryOverdue();

  // Get curtain measurements that have curtain poles
  const measurementsWithPoles = curtainMeasurements.filter(m => m.curtainPoleId && (m.curtainPoleQuantity || 0) > 0);

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header with Actions */}
      <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Curtain Order 
          </h1>
          <div className='flex items-center gap-2 mt-1'>
            <Badge 
              variant={curtainOrder.curtainStatus === 'COMPLETED' ? 'default' : 
                      curtainOrder.curtainStatus === 'CANCELLED' ? 'destructive' : 'outline'}
            >
              {curtainOrder.curtainStatus}
            </Badge>
            <Badge 
              variant={curtainOrder.paymentStatus === 'PAID' ? 'default' : 
                      hasBalance ? 'destructive' : 'outline'}
            >
              {curtainOrder.paymentStatus}
            </Badge>
            {curtainOrder.deliveryDeadline && (
              <Badge 
                variant={overdue ? 'destructive' : 'outline'}
                className='flex items-center gap-1'
              >
                <CalendarClock className='h-3 w-3' />
                {overdue ? 'Overdue' : 'Delivery Scheduled'}
              </Badge>
            )}
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.ASSIGN_WORKER.name}>
            <Button onClick={handleworklog}>
              <PlusCircle className='mr-2 h-4 w-4' />
              Add Curtain Work Log
            </Button>
          </PermissionGuard>
          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.UPDATE_DELIVERY_DEADLINE.name}>
            {curtainOrder.curtainStatus !== 'DELIVERED' && (
              <Button onClick={handleOpenDeliveryDeadlineModal} variant="outline">
                <CalendarClock className='mr-2 h-4 w-4' />
                {curtainOrder.deliveryDeadline ? 'Update Delivery' : 'Set Delivery'}
              </Button>
            )}
          </PermissionGuard>
          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.UPDATE_PAYMENT.name}>
            {(() => {
              const isBalanceZero = Math.abs(curtainOrder.balance || 0) < 0.01;
              const shouldShowButton = !isBalanceZero;
              return shouldShowButton && (
                <Button onClick={handleOpenPaymentModal} variant="outline">
                  <CreditCard className='mr-2 h-4 w-4' />
                  Update Payment
                </Button>
              );
            })()}
          </PermissionGuard>
          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.CREATE.name}>
            {curtainOrder.curtainStatus !== 'DELIVERED' && (
              <Button onClick={handleOpenStatusModal}>
                <CheckCircle className='mr-2 h-4 w-4' />
                Update Status
              </Button>
            )}
          </PermissionGuard>
          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.UPDATE_STATUS.name}>
            {curtainOrder.curtainStatus !== 'COMPLETED' && curtainOrder.curtainStatus !== 'DELIVERED' && (
              !hasAnyMeasurements ? (
                <>
                  <Button onClick={handleAddCurtainMeasurement}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add Curtain Measurement
                  </Button>
                  <Button onClick={handleAddShatterVerticalMeasurement} variant="secondary">
                    <Square className='mr-2 h-4 w-4' />
                    Add Shatter Vertical
                  </Button>
                </>
              ) : (
                <>
                  {!hasShatterVerticalMeasurements && (
                    <Button onClick={handleAddShatterVerticalMeasurement} variant="secondary">
                      <Square className='mr-2 h-4 w-4' />
                      Add Shatter Vertical
                    </Button>
                  )}
                  {!hasCurtainMeasurements && (
                    <Button onClick={handleAddCurtainMeasurement}>
                      <PlusCircle className='mr-2 h-4 w-4' />
                      Add Curtain Measurement
                    </Button>
                  )}
                  {hasCurtainMeasurements && (
                    <Button onClick={handleAddCurtainMeasurement}>
                      <PlusCircle className='mr-2 h-4 w-4' />
                      Add More Curtain
                    </Button>
                  )}
                  {hasShatterVerticalMeasurements && (
                    <Button onClick={handleAddShatterVerticalMeasurement} variant="secondary">
                      <Square className='mr-2 h-4 w-4' />
                      Add More Shatter Vertical
                    </Button>
                  )}
                </>
              )
            )}
          </PermissionGuard>
          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.DELETE.name}>
            {curtainOrder.curtainStatus !== 'DELIVERED' && (
              <Button 
                variant='destructive' 
                onClick={handleDeleteOrder} 
                disabled={deletingOrder}
              >
                {deletingOrder ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Trash2 className='mr-2 h-4 w-4' />
                )}
                Delete Order
              </Button>
            )}
          </PermissionGuard>
        </div>
      </div>

      {/* Payment Update Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        title="Add Payment"
        description="Record a new payment for this curtain order"
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 bg-gray-50 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order Total:</span>
              <span className="font-medium">{formatCurrency(curtainOrder.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Paid:</span>
              <span className="font-medium">{formatCurrency(curtainOrder.totalPaid || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Remaining Balance:</span>
              <span className={`font-bold ${(curtainOrder.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(curtainOrder.balance || 0)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={paymentForm.amount || ''}
              onChange={(e) => handlePaymentFormChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="Enter payment amount"
              min="0"
              max={curtainOrder.balance || 0}
              step="0.01"
              required
            />
            {(curtainOrder.balance || 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                Maximum payment: {formatCurrency(curtainOrder.balance || 0)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method (Optional)</Label>
            <Select
              value={paymentForm.paymentMethod}
              onValueChange={(value) => handlePaymentFormChange('paymentMethod', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="TELEBIRR">TeleBirr</SelectItem>
                <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CBE">Commercial Bank of Ethiopia</SelectItem>
                <SelectItem value="AWASH">Awash Bank</SelectItem>
                <SelectItem value="DASHEN">Dashen Bank</SelectItem>
                <SelectItem value="ABYSSINIA">Abyssinia Bank</SelectItem>
                <SelectItem value="HIBRET">Hibret Bank</SelectItem>
                <SelectItem value="NIB">NIB Bank</SelectItem>
                <SelectItem value="OROMIA">Oromia Bank</SelectItem>
                <SelectItem value="BERHAN">Berhan Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date (Optional)</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentForm.paymentDate || ''}
              onChange={(e) => handlePaymentFormChange('paymentDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              type="text"
              value={paymentForm.note || ''}
              onChange={(e) => handlePaymentFormChange('note', e.target.value)}
              placeholder="Add a note about this payment"
            />
          </div>

          {paymentForm.amount > (curtainOrder.balance || 0) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning</p>
                  <p>Payment amount exceeds the remaining balance. The order will be marked as overpaid.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-6">
            <Button variant="outline" onClick={handleClosePaymentModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePayment} 
              disabled={updatingPayment || paymentForm.amount <= 0}
            >
              {updatingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Payment...
                </>
              ) : (
                'Add Payment'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Update Modal with Curtain Rod Cutting */}

<AlertModal
  isOpen={isStatusModalOpen}
  onClose={handleCloseStatusModal}
  onConfirm={handleUpdateStatus}
  loading={updatingStatus}
  title="Update Order Status"
  description="Change the status of this curtain order"
  confirmText="Update Status"
  cancelText="Cancel"
  variant="default"
>
  <div className="space-y-4 py-2 sm:py-4 max-h-[calc(90vh-200px)] overflow-y-auto px-1 sm:px-2">
    {/* Current Status Display */}
    <div className="rounded-md border border-border/50 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm text-muted-foreground">Current Status:</span>
        <Badge 
          variant={
            curtainOrder.curtainStatus === 'COMPLETED' ? 'default' :
            curtainOrder.curtainStatus === 'CANCELLED' ? 'destructive' : 'outline'
          }
          className="self-start sm:self-auto"
        >
          {curtainOrder.curtainStatus}
        </Badge>
      </div>
    </div>

    {/* Status Selection */}
    <div className="space-y-2">
      <Label htmlFor="curtainStatus">New Status *</Label>
      <Select
        value={statusForm.curtainStatus}
        onValueChange={(value: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DELIVERED') => 
          handleStatusFormChange('curtainStatus', value)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Pending</span>
            </div>
          </SelectItem>
          <SelectItem value="COMPLETED">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Completed</span>
            </div>
          </SelectItem>
          <SelectItem value="DELIVERED">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0" />
              <span>Delivered</span>
            </div>
          </SelectItem>
          <SelectItem value="CANCELLED">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" />
              <span>Cancelled</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Employee Selection for DELIVERED status */}
    {statusForm.curtainStatus === 'DELIVERED' && (
      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="deliveredById">Select Delivery Person *</Label>
        <Select
          value={statusForm.deliveredById}
          onValueChange={(value) => handleStatusFormChange('deliveredById', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select employee who will deliver" />
          </SelectTrigger>
          <SelectContent>
            {loadingEmployees ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading employees...</span>
              </div>
            ) : employees.length === 0 ? (
              <div className="p-2 text-center text-muted-foreground">
                No employees available
              </div>
            ) : (
              employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{employee.name}</span>
                   
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the employee responsible for delivering this order
        </p>
      </div>
    )}


    {/* Curtain Rod Cutting Section */}
    {statusForm.curtainStatus === 'DELIVERED' && measurementsWithPoles.length > 0 && (
      <div className="space-y-4 border-t pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Label className="font-semibold flex items-center gap-2">
            <Scissors className="h-4 w-4 shrink-0" />
            <span>Cut Curtain Rods from Stock</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCurtainRodCutting}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-1 h-3 w-3" />
            Add Cutting
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          For each curtain rod, select a 6m x 1m variant from stock and specify the width to cut.
        </p>

        {/* Curtain Rod Cuttings List */}
        <div className="space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          {(statusForm.curtainRodCuttings || []).map((cutting, index) => {
            const selectedMeasurement = curtainMeasurements.find(m => m.id === cutting.measurementId);
            
            // Get the product ID from the selected measurement
            const selectedProductId = selectedMeasurement?.curtainPoleId;
            
            // Find the product in products list
            const matchingProduct = products.find(p => p.productId === selectedProductId);
            
            // Get available variants for this specific product (6m x 1m only)
            const availableVariants = matchingProduct ? getAvailableRodVariants(matchingProduct) : [];
            
            // Find selected variant
            const selectedVariant = availableVariants.find(v => v.id === cutting.curtainRodVariantId);
            
            return (
              <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800 h-8 w-8 p-0"
                  onClick={() => removeCurtainRodCutting(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                {/* Measurement Selection */}
                <div className="space-y-2">
                  <Label>Select Measurement *</Label>
                  <Select
                    value={cutting.measurementId}
                    onValueChange={(value) => updateCurtainRodCutting(index, 'measurementId', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select measurement" />
                    </SelectTrigger>
                    <SelectContent>
                      {measurementsWithPoles.map((measurement) => (
                        <SelectItem key={measurement.id} value={measurement.id}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium">{measurement.roomName}</span>
                            <span className="text-xs text-muted-foreground">
                              Rod: {measurement.curtainPole?.name || 'Curtain Rod'} 
                              (Qty needed: {measurement.curtainPoleQuantity || 1})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show product info once measurement is selected */}
                {selectedMeasurement && (
                  <div className="p-2 bg-gray-50 rounded-md text-sm">
                    <div className="space-y-1">
                      <p><span className="font-medium">Product:</span> {selectedMeasurement.curtainPole?.name || 'Curtain Rod'}</p>
                      <p><span className="font-medium">Quantity needed:</span> {selectedMeasurement.curtainPoleQuantity || 1} piece(s)</p>
                    </div>
                  </div>
                )}

                {/* Variant Selection */}
                <div className="space-y-2">
                  <Label>Select Stock Variant *</Label>
                  <Select
                    value={cutting.curtainRodVariantId}
                    onValueChange={(value) => updateCurtainRodCutting(index, 'curtainRodVariantId', value)}
                    disabled={!cutting.measurementId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={!cutting.measurementId ? "Select measurement first" : "Select variant from stock"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {!cutting.measurementId ? (
                        <div className="p-2 text-center text-muted-foreground">
                          Please select a measurement first
                        </div>
                      ) : loadingProducts ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : availableVariants.length === 0 ? (
                        <div className="p-2 text-center text-red-600">
                          No rod variants available in stock for this product
                        </div>
                      ) : (
                        availableVariants.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="text-sm font-medium">
                                {variant.width}x{variant.height}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Stock: {variant.quantity} piece(s)
                              </span>
                              {variant.width >= 6 && (
                                <span className="text-xs text-green-600">
                                  ✓ Can cut to 6m
                                </span>
                              )}
                              {variant.width < 6 && variant.width > 0 && (
                                <span className="text-xs text-red-600">
                                  ✗ Max cut: {variant.width}m
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedVariant && (
                    <div className="text-xs space-y-1">
                      <p className="text-green-600">
                        ✓ Selected: {selectedVariant.width}m x {selectedVariant.height}m
                      </p>
                    </div>
                  )}
                </div>

                {/* Requested Width */}
                <div className="space-y-2">
                  <Label>Requested Width (meters) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="6"
                    value={cutting.requestedWidth || ''}
                    onChange={(e) => updateCurtainRodCutting(index, 'requestedWidth', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 3.5"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the width needed (max 6m). 
                    Remaining: {(6 - (cutting.requestedWidth || 0)).toFixed(1)}m x 1m will go back to stock.
                  </p>
                </div>

                {/* Cutting Preview */}
                {selectedMeasurement && selectedVariant && cutting.requestedWidth > 0 && (
                  <div className="p-2 bg-blue-50 rounded-md text-sm space-y-1">
                    <p className="font-medium">Cutting Preview:</p>
                    <p className="break-words">Original variant: {selectedVariant.width}m x {selectedVariant.height}m</p>
                    <p className="break-words">Cut piece: {cutting.requestedWidth}m x {selectedVariant.height}m (for customer)</p>
                    {cutting.requestedWidth < selectedVariant.width && (
                      <p className="break-words">Remaining: {(selectedVariant.width - cutting.requestedWidth).toFixed(1)}m x {selectedVariant.height}m (back to stock)</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be applied to {selectedMeasurement.curtainPoleQuantity || 1} rod(s) in this measurement.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {measurementsWithPoles.length > 0 && (statusForm.curtainRodCuttings || []).length === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Note</p>
                <p>This order has curtain rods. Add cutting instructions to cut them from stock.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* Validation Warning for DELIVERED without employee */}
    {statusForm.curtainStatus === 'DELIVERED' && !statusForm.deliveredById && (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Required</p>
            <p>Please select a delivery person before marking as delivered.</p>
          </div>
        </div>
      </div>
    )}

    {/* Warning Messages */}
    {statusForm.curtainStatus === 'CANCELLED' && curtainOrder.paymentStatus === 'PAID' && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Warning</p>
            <p>This order has been paid. Cancelling may require a refund.</p>
          </div>
        </div>
      </div>
    )}

    {statusForm.curtainStatus === 'COMPLETED' && (!curtainOrder.measurements || curtainOrder.measurements.length === 0) && (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Warning</p>
            <p>This order has no measurements. Add measurements before marking as completed.</p>
          </div>
        </div>
      </div>
    )}
  </div>
</AlertModal>

      {/* Delivery Deadline Modal */}
      <Modal
        isOpen={isDeliveryDeadlineModalOpen}
        onClose={handleCloseDeliveryDeadlineModal}
        title="Set Delivery Deadline"
        description="Set or update the delivery deadline for this curtain order"
        size="md"
      >
        <div className="space-y-4 py-2">
          {curtainOrder.deliveryDeadline && (
            <div className="p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Deadline:</span>
                <span className="font-medium">
                  {formatDate(curtainOrder.deliveryDeadline)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deliveryDeadline">Delivery Deadline *</Label>
            <Input
              id="deliveryDeadline"
              type="date"
              value={deliveryDeadlineForm.deliveryDeadline}
              onChange={(e) => handleDeliveryDeadlineFormChange('deliveryDeadline', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-muted-foreground">
              Select the expected delivery date for this order
            </p>
          </div>

          {curtainOrder.curtainStatus === 'DELIVERED' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Note</p>
                  <p>This order is already marked as delivered. Updating the deadline won&apos;t affect the delivery status.</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Delivery Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Status:</span>
                <Badge variant="outline">{curtainOrder.curtainStatus}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Has Measurements:</span>
                <span>{hasAnyMeasurements ? 'Yes' : 'No'}</span>
              </div>
              {curtainOrder.deliveryDeadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days until deadline:</span>
                  <span className={overdue ? 'text-red-600 font-medium' : ''}>
                    {Math.ceil((new Date(curtainOrder.deliveryDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button variant="outline" onClick={handleCloseDeliveryDeadlineModal}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDeliveryDeadline} disabled={updatingDeliveryDeadline}>
              {updatingDeliveryDeadline ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                curtainOrder.deliveryDeadline ? 'Update Deadline' : 'Set Deadline'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(curtainOrder.totalAmount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(curtainOrder.totalPaid || 0)}
            </div>
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              <DollarSign className='h-3 w-3' />
              {curtainOrder.balance === 0 ? 'Fully Paid' : 'Balance due'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(curtainOrder.balance || 0)}
            </div>
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              {hasBalance ? (
                <>
                  <X className='h-3 w-3 text-red-500' />
                  Payment pending
                </>
              ) : (
                <>
                  <Check className='h-3 w-3 text-green-500' />
                  Fully paid
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalStats.totalQuantity}</div>
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              <Ruler className='h-3 w-3' />
              {hasAnyMeasurements ? (
                <>
                  {curtainMeasurements.length} curtain, {shatterVerticalMeasurements.length} shatter
                </>
              ) : 'No measurements'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={orderStatus.variant} className='text-lg'>
                {orderStatus.text}
              </Badge>
              <div className='mt-1 flex items-center gap-1 text-sm text-muted-foreground'>
                {curtainOrder.isSiteMeasured ? (
                  <>
                    <Home className='h-3 w-3' />
                    Site measured
                  </>
                ) : (
                  <>
                    <Building className='h-3 w-3' />
                    Showroom order
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Details Grid - Rest of the existing JSX remains the same */}
      {/* ... (keep all the existing JSX for customer info, order details, timeline, and measurements) */}
      
      {/* The rest of your existing JSX for measurements, summary, etc. remains unchanged */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='text-primary h-5 w-5' />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Name</p>
                  <p className='text-lg'>{curtainOrder.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Contact</p>
                  <p className='text-lg'>{curtainOrder.customer?.phone1 || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Address</p>
                  <p className='text-lg'>{curtainOrder.customer?.address || 'N/A'}</p>
                </div>
                {curtainOrder.Shop && (
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>Shop</p>
                    <div className='flex items-center gap-2'>
                      <Building className='h-4 w-4' />
                      <p className='text-lg'>{curtainOrder.Shop.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='text-primary h-5 w-5' />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Issue Date</p>
                  <p className='text-lg'>
                    {curtainOrder.issueDate ? formatDate(curtainOrder.issueDate) : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Measurement Type</p>
                  <div className='flex items-center gap-2'>
                    <Badge variant={curtainOrder.isSiteMeasured ? 'default' : 'outline'}>
                      {curtainOrder.isSiteMeasured ? 'Site Measured' : 'Showroom'}
                    </Badge>
                    {curtainOrder.isSiteMeasured && curtainOrder.siteMeasurePrice && (
                      <span className='text-sm'>
                        ({formatCurrency(curtainOrder.siteMeasurePrice)})
                      </span>
                    )}
                  </div>
                </div>
                {curtainOrder.movementType && (
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>Movement Type</p>
                    <div className='flex items-center gap-2'>
                      <MoveRight className='h-4 w-4' />
                      <p className='text-lg'>{curtainOrder.movementType.name}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Created By</p>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    <p className='text-lg'>{curtainOrder.createdBy?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
              {curtainOrder.remark && (
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Order Remarks</p>
                  <p className='text-lg'>{curtainOrder.remark}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CalendarClock className='text-primary h-5 w-5' />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {curtainOrder.deliveryDeadline ? (
                <>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>Delivery Deadline</p>
                    <div className={`mt-1 flex items-center gap-2 rounded-md p-3 ${overdue ? 'bg-red-50' : 'bg-green-50'}`}>
                      <Calendar className={`h-5 w-5 ${overdue ? 'text-red-600' : 'text-green-600'}`} />
                      <div>
                        <p className={`font-medium ${overdue ? 'text-red-800' : 'text-green-800'}`}>
                          {formatDate(curtainOrder.deliveryDeadline)}
                        </p>
                        <p className={`text-sm ${overdue ? 'text-red-600' : 'text-green-600'}`}>
                          {overdue ? 'Overdue' : 'On Schedule'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Days until deadline:</span>
                      <span className={overdue ? 'font-medium text-red-600' : 'font-medium'}>
                        {Math.ceil((new Date(curtainOrder.deliveryDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                  {curtainOrder.deliveredBy && (
                    <div className='rounded-lg border p-3 space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Truck className='h-4 w-4 text-primary' />
                        <p className='text-sm font-medium'>Delivered By</p>
                      </div>
                      <div className='space-y-1'>
                        <p className='font-semibold'>{curtainOrder.deliveredBy.name}</p>
                        {curtainOrder.curtainstatusnote && (
                          <p className='font-semibold'>Note return: {curtainOrder?.curtainstatusnote}</p>
                        )}
                        {curtainOrder.deliveredBy && (
                          <p className='text-xs text-muted-foreground'>
                            Delivered at: {formatDate(curtainOrder.deliveredAt || new Date())}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className='py-6 text-center'>
                  <CalendarClock className='mx-auto mb-3 h-12 w-12 text-muted-foreground' />
                  <p className='mb-4 text-muted-foreground'>No delivery deadline set</p>
                  <Button onClick={handleOpenDeliveryDeadlineModal} variant='outline' size='sm'>
                    Set Delivery Deadline
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='text-primary h-5 w-5' />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Created</span>
                  <span className='text-sm'>{formatDate(curtainOrder.createdAt)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Last Updated</span>
                  <span className='text-sm'>{formatDate(curtainOrder.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Regular Curtain Measurements Section */}
      {hasCurtainMeasurements && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <RulerIcon className='text-primary h-5 w-5' />
                Curtain Measurements
                <Badge variant="default">{curtainMeasurements.length} items</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Curtain Size and Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Thick Curtain</TableHead>
                  <TableHead>Thin Curtain</TableHead>
                  <TableHead>Curtain Rode</TableHead>
                  <TableHead>Curtain Belt</TableHead>
                  <TableHead>Curtain Holder</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {curtainMeasurements.map((measurement) => {
                  const hasThick = !!measurement.thickProductId;
                  const hasThin = !!measurement.thinProductId;
                  const hasCurtainPole = !!measurement.curtainPoleId;
                  const hasCurtainPulls = !!measurement.curtainPullsId;
                  const hasCurtainBrackets = !!measurement.curtainBracketsId;
                  
                  return (
                    <TableRow key={measurement.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <Home className='h-4 w-4 text-muted-foreground' />
                          {measurement.roomName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {measurement.width}m × {measurement.height}m
                        {measurement.extrawidth && (
                          <div className='text-xs text-muted-foreground'>
                            + {measurement.extrawidth}m extra width
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {measurement.curtainSize ? `${measurement.curtainSize}m` : 'N/A'}
                        <div className='font-medium text-sm'>
                          {measurement.size ? `${measurement.size}` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{measurement.quantity || 1}</TableCell>
                      <TableCell>
                        {hasThick ? (
                          <div className='space-y-1'>
                            <div className='font-medium text-sm'>
                              {measurement.thickProduct?.name || 'Thick'}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {measurement.thickMeter}m × {formatCurrency(measurement.thickPrice || 0)}
                            </div>
                            <div className='font-medium text-sm'>
                              {measurement?.thickVariant || ''}
                            </div>
                          </div>
                        ) : (
                          <Badge variant='outline'>None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasThin ? (
                          <div className='space-y-1'>
                            <div className='font-medium text-sm'>
                              {measurement.thinProduct?.name || ''}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {measurement.thinMeter}m × {formatCurrency(measurement.thinPrice || 0)}
                            </div>
                            <div className='font-medium text-sm'>
                              {measurement?.thinVariant || ''}
                            </div>
                          </div>
                        ) : (
                          <Badge variant='outline'>None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasCurtainPole ? (
                          <div className='space-y-1'>
                            <div className='font-medium text-sm'>
                              {measurement.curtainPole?.name || 'Pole'}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              Qty: {measurement.curtainPoleQuantity || 1} × {formatCurrency(measurement.curtainPolePrice || 0)}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              Total: {formatCurrency((measurement.curtainPolePrice || 0) * (measurement.curtainPoleQuantity || 1))}
                            </div>
                          </div>
                        ) : (
                          <Badge variant='outline'>None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasCurtainPulls ? (
                          <div className='space-y-1'>
                            <div className='font-medium text-sm'>
                              {measurement.curtainPulls?.name || 'Pulls'}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              Qty: {measurement.curtainPullsQuantity || 1}
                            </div>
                          </div>
                        ) : (
                          <Badge variant='outline'>None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasCurtainBrackets ? (
                          <div className='space-y-1'>
                            <div className='font-medium text-sm'>
                              {measurement.curtainBrackets?.name || 'Brackets'}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              Qty: {measurement.curtainBracketsQuantity || 1}
                            </div>
                            {measurement.curtainPullsBracketsPrice && (
                              <div className='text-xs text-muted-foreground'>
                                Price: {formatCurrency(measurement.curtainPullsBracketsPrice)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant='outline'>None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          {measurement.thickWorker && (
                            <div className='flex items-center gap-1 text-xs'>
                              <Construction className='h-3 w-3' />
                              <span>Thick: {measurement.thickWorker.name}</span>
                            </div>
                          )}
                          {measurement.thinWorker && (
                            <div className='flex items-center gap-1 text-xs'>
                              <Construction className='h-3 w-3' />
                              <span>Thin: {measurement.thinWorker.name}</span>
                            </div>
                          )}
                          {measurement.workerPrice && (
                            <div className='text-xs text-muted-foreground'>
                              {formatCurrency(measurement.workerPrice)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {formatCurrency(measurement.price || 0)}
                      </TableCell>
                      <TableCell>
                        <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.DELETE.name}>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteMeasurement(measurement.id)}
                            className='text-red-600 hover:text-red-800 hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Shatter Vertical Measurements Section */}
      {hasShatterVerticalMeasurements && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Square className='text-primary h-5 w-5' />
                Shatter Vertical Measurements
                <Badge variant="secondary">{shatterVerticalMeasurements.length} items</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shatterVerticalMeasurements.map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell className='font-medium'>
                      <div className='flex items-center gap-2'>
                        <Home className='h-4 w-4 text-muted-foreground' />
                        {measurement.roomName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {measurement.width}m × {measurement.height}m
                    </TableCell>
                    <TableCell>{measurement.quantity || 1}</TableCell>
                    <TableCell>
                      {formatCurrency(measurement.unitprice || 0)}
                      <p className='text-xs text-muted-foreground'>
                        ({measurement.width} × {measurement.height})
                      </p>
                    </TableCell>
                    <TableCell className='font-medium'>
                      {formatCurrency(measurement.price || 0)}
                      <p className='text-xs text-muted-foreground'>
                        ({formatCurrency(measurement.unitprice || 0)} × {measurement.quantity || 1})
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='font-medium text-sm'>
                          {measurement.shatterVerticalProduct?.name || 'Unknown Product'}
                        </div>
                        {measurement.shatterVerticalProduct?.sellPrice && (
                          <div className='text-xs text-muted-foreground'>
                            Price: {formatCurrency(measurement.shatterVerticalProduct.sellPrice)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.DELETE.name}>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteMeasurement(measurement.id)}
                          className='text-red-600 hover:text-red-800 hover:bg-red-50'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Measurements State */}
      {!hasAnyMeasurements && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <RulerIcon className='text-primary h-5 w-5' />
              Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <RulerIcon className='h-16 w-16 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>No Measurements Added</h3>
              <p className='text-muted-foreground mb-6'>
                This curtain order doesn&apos;t have any measurements yet. Choose a measurement type to get started.
              </p>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button onClick={handleAddCurtainMeasurement} size="lg">
                  <PlusCircle className='mr-2 h-5 w-5' />
                  Add Curtain Measurement
                </Button>
                <Button onClick={handleAddShatterVerticalMeasurement} size="lg" variant="secondary">
                  <Square className='mr-2 h-5 w-5' />
                  Add Shatter Vertical
                </Button>
              </div>
              <p className='text-sm text-muted-foreground mt-4'>
                You can add multiple measurements for different rooms.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      {hasAnyMeasurements && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {hasCurtainMeasurements && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Curtain Material Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Total Thick Meter</span>
                  <span className='font-medium'>
                    {curtainMeasurements.reduce((sum, m) => sum + (m.thickMeter || 0), 0)}m
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Total Thin Meter</span>
                  <span className='font-medium'>
                    {curtainMeasurements.reduce((sum, m) => sum + (m.thinMeter || 0), 0)}m
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Total Worker Meter</span>
                  <span className='font-medium'>
                    {curtainMeasurements.reduce((sum, m) => sum + (m.totalWorkerMeter || 0), 0)}m
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={hasCurtainMeasurements ? 'md:col-span-2' : 'md:col-span-3'}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {hasCurtainMeasurements && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Curtain Measurements</span>
                  <span>{formatCurrency(curtainMeasurements.reduce((sum, m) => sum + (m.price || 0), 0))}</span>
                </div>
              )}
              {hasShatterVerticalMeasurements && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Shatter Vertical Measurements</span>
                  <span>{formatCurrency(shatterVerticalMeasurements.reduce((sum, m) => sum + (m.price || 0), 0))}</span>
                </div>
              )}
              {curtainOrder.isSiteMeasured && curtainOrder.siteMeasurePrice && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Site Measurement Fee</span>
                  <span>{formatCurrency(curtainOrder.siteMeasurePrice)}</span>
                </div>
              )}
              <div className='flex justify-between border-t pt-2 font-bold'>
                <span>Order Total</span>
                <span>{formatCurrency(curtainOrder.totalAmount || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CurtainOrderDetailPage;