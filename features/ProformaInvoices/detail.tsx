/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  FileText,
  User,
  Building,
  DollarSign,
  Package,
  Check,
  RefreshCw,
  Eye,
  Download,
  Mail,
  Loader2,
  AlertCircle,
  Banknote,
  FileCheck,
  FileX,
  Box,
  Layers,
  Info,
  Calendar,
  Phone,
  MapPin,
  ArrowRight,
  Image as ImageIcon,
  AlertTriangle,
  Store,
  CreditCard,
  History,
  Clock,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  IProformaInvoice,
  IProformaInvoiceItem,
  PIStatus,
  IProformaItemMaterial,
  IProformaInvoiceBank,
  IAttachment,
  IProformaInvoiceItemImage,
  IPiLog,
} from '@/models/ProformaInvoice';
import {
  addPaymentToProformaInvoice,
  getProformaInvoiceById,
  updateProformaInvoiceStatus,
} from '@/service/ProformaInvoice';
import { getBanks } from '@/service/bank';
import { IBank } from '@/models/bank';
import { getCustomer } from '@/service/customer';
import { ProformaInvoicePDFGenerator } from './pdf';
import { ProformaInvoicePrinter } from './print';
import { SendToClientButton } from './sendtoclient';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

// Helper function for image URLs
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://rcf.ordere.net';

export const normalizeImagePath = (path?: string) => {
  if (!path) return '/placeholder-image.jpg';
  
  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.startsWith('http')) return normalizedPath;

  const cleanPath = normalizedPath.replace(/^\/+/, '');
  return `${BACKEND_URL}/${cleanPath}`;
};

type ProformaInvoiceDetailProps = {
  id?: string;
};

const ProformaInvoiceDetailPage: React.FC<ProformaInvoiceDetailProps> = ({ id }) => {
  const router = useRouter();
  const [invoice, setInvoice] = useState<IProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PIStatus>();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  // Alert dialog states
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PIStatus | null>(null);
  
  // Customer search state
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Add bank state
  const [banks, setBanks] = useState<IBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  
  // Update payment data state to include bankId
  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    amountDate: new Date().toISOString().split('T')[0],
    bankId: '',
    paidBy: '',
  });

  // Check if this is a store invoice
  const isStoreInvoice = invoice?.store === true;
  const getPaymentStatusVariant = (
    status: string
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PARTIAL':
        return 'secondary';
      case 'PENDING':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      (customer.companyName && customer.companyName.toLowerCase().includes(term)) ||
      (customer.phone1 && customer.phone1.includes(term)) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.tinNumber && customer.tinNumber.includes(term))
    );
  }, [customers, searchTerm]);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        if (id) {
          const invoiceData = await getProformaInvoiceById(id);
          setInvoice(invoiceData);
          setSelectedStatus(invoiceData.status);
          
          // Find and set selected customer from invoice
          if (invoiceData.customerId && customers.length > 0) {
            const customer = customers.find(c => c.id === invoiceData.customerId);
            setSelectedCustomer(customer || null);
          }
        }
      } catch (error: any) {
        toast.error('Failed to fetch proforma invoice details');
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id, customers]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const customersData = await getCustomer();
        setCustomers(customersData || []);
      } catch (error: any) {
        toast.error('Failed to fetch customers');
        console.error('Error fetching customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch banks when payment dialog opens (only for non-store invoices)
  useEffect(() => {
    const fetchBanksData = async () => {
      if (paymentDialogOpen && !isStoreInvoice) {
        try {
          setLoadingBanks(true);
          const banksData = await getBanks();
          setBanks(banksData);
          
          // Set default bank if banks exist
          if (banksData.length > 0 && !paymentData.bankId) {
            setPaymentData(prev => ({
              ...prev,
              bankId: banksData[0].id || ''
            }));
          }
        } catch (error: any) {
          toast.error('Failed to fetch banks');
          console.error('Error fetching banks:', error);
        } finally {
          setLoadingBanks(false);
        }
      }
    };

    fetchBanksData();
  }, [paymentData.bankId, paymentDialogOpen, isStoreInvoice]);

  // Handle status change - shows alert immediately when status is selected
  const handleStatusChange = (value: PIStatus) => {
    setSelectedStatus(value);
    if (value !== invoice?.status) {
      setPendingStatus(value);
      setShowStatusAlert(true);
    }
  };

  // Handle status update confirm
  const handleStatusUpdateConfirm = async () => {
    if (!id || !pendingStatus || pendingStatus === invoice?.status) {
      setShowStatusAlert(false);
      setPendingStatus(null);
      return;
    }

    setUpdatingStatus(true);
    try {
      const updated = await updateProformaInvoiceStatus(id, pendingStatus);
      setInvoice((prev) => (prev ? { ...prev, status: pendingStatus } : null));
      toast.success(`Status updated to ${getStatusConfig(pendingStatus).label} successfully`);
      
      // If status is APPROVED_CREATE_PROJECT, redirect to project creation page with proforma invoice ID
      if (pendingStatus === PIStatus.APPROVED_CREATE_PROJECT) {
        toast.success('Redirecting to project creation...');
        setTimeout(() => {
          router.push(`/dashboard/ProformaInvoice/Project?id=${id}`);
        }, 1500);
      }
    } catch (error: any) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
      setShowStatusAlert(false);
      setPendingStatus(null);
    }
  };

  // Handle payment addition request (only for non-store invoices)
  const handlePaymentRequest = () => {
    if (!paymentData.amountPaid || paymentData.amountPaid <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!paymentData.bankId) {
      toast.error('Please select a bank');
      return;
    }

    if (!paymentData.paidBy) {
      toast.error('Please enter the payer name');
      return;
    }

    if (paymentData.amountPaid > (invoice?.balance || 0)) {
      toast.error('Payment amount cannot exceed balance due');
      return;
    }

    setShowPaymentAlert(true);
  };

  // Handle payment addition confirm (only for non-store invoices)
  const handlePaymentConfirm = async () => {
    if (!id || !paymentData.amountPaid || paymentData.amountPaid <= 0) {
      setShowPaymentAlert(false);
      return;
    }

    setAddingPayment(true);
    try {
      await addPaymentToProformaInvoice(id, {
        amountPaid: paymentData.amountPaid,
        amountDate: paymentData.amountDate,
        bankId: paymentData.bankId,
        paidBy: paymentData.paidBy,
      });

      // Refresh invoice data
      const updatedInvoice = await getProformaInvoiceById(id);
      setInvoice(updatedInvoice);

      toast.success(`Payment of ${formatCurrency(paymentData.amountPaid)} added successfully`);
      setPaymentDialogOpen(false);
      setShowPaymentAlert(false);
      setPaymentData({
        amountPaid: 0,
        amountDate: new Date().toISOString().split('T')[0],
        bankId: '',
        paidBy: '',
      });
    } catch (error: any) {
      toast.error('Failed to add payment');
      console.error('Error adding payment:', error);
    } finally {
      setAddingPayment(false);
    }
  };

  // Reset payment form when dialog closes
  useEffect(() => {
    if (!paymentDialogOpen) {
      setPaymentData({
        amountPaid: 0,
        amountDate: new Date().toISOString().split('T')[0],
        bankId: '',
        paidBy: '',
      });
    }
  }, [paymentDialogOpen]);

  // Get status alert message
  const getStatusAlertMessage = () => {
    if (!pendingStatus || !invoice) return { title: '', description: '', variant: 'default' };
    
    const currentStatus = invoice.status;
    const newStatus = pendingStatus;
    const statusConfig = getStatusConfig(newStatus);
    
    if (newStatus === PIStatus.APPROVED_CREATE_PROJECT) {
      return {
        title: 'Confirm Project Creation',
        description: `Are you sure you want to approve this invoice and create a project? This will mark the invoice as "Approved - Create Project" and redirect you to the project creation page.`,
        variant: 'default'
      };
    } else if (newStatus === PIStatus.APPROVED_ST) {
      return {
        title: 'Confirm Approval',
        description: `Are you sure you want to approve this invoice? This will change the status from ${currentStatus} to ${statusConfig.label}.`,
        variant: 'default'
      };
    } else if (newStatus === PIStatus.SENT_TO_CLIENT) {
      return {
        title: 'Confirm Send to Client',
        description: `Are you sure you want to mark this invoice as sent to client? This will change the status from ${currentStatus} to ${statusConfig.label}.`,
        variant: 'default'
      };
    } else if (newStatus === PIStatus.APPROVED_CLIENT) {
      return {
        title: 'Confirm Client Approval',
        description: `Are you sure you want to mark this invoice as client approved? This will change the status from ${currentStatus} to ${statusConfig.label}.`,
        variant: 'default'
      };
    } else if (newStatus === PIStatus.REVISION) {
      return {
        title: 'Confirm Revision Request',
        description: `Are you sure you want to request revisions for this invoice? This will change the status from ${currentStatus} to ${statusConfig.label}.`,
        variant: 'destructive'
      };
    } else if (newStatus === PIStatus.CANCELLED) {
      return {
        title: 'Confirm Cancellation',
        description: `Are you sure you want to cancel this invoice? This action cannot be undone.`,
        variant: 'destructive'
      };
    }
    
    return {
      title: 'Confirm Status Change',
      description: `Are you sure you want to change the status from ${currentStatus} to ${statusConfig.label}?`,
      variant: 'default'
    };
  };

  // Get payment alert message (only for non-store invoices)
  const getPaymentAlertMessage = () => {
    const newBalance = (invoice?.balance || 0) - paymentData.amountPaid;
    const isFullyPaid = newBalance === 0;
    
    return {
      title: 'Confirm Payment',
      description: `Are you sure you want to record a payment of ${formatCurrency(paymentData.amountPaid)}?`,
      details: [
        `Amount: ${formatCurrency(paymentData.amountPaid)}`,
        `Current Balance: ${formatCurrency(invoice?.balance || 0)}`,
        `New Balance: ${formatCurrency(newBalance)}`,
        isFullyPaid ? 'This will fully pay off the invoice.' : `Remaining balance after payment: ${formatCurrency(newBalance)}`,
      ],
      isFullyPaid
    };
  };

  // Calculate total materials for an item
  const getItemMaterialsTotal = (item: IProformaInvoiceItem) => {
    if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return 0;
    return item.proformaItemMaterials.reduce((total, material) => total + material.quantity, 0);
  };

  // Get first image for an item
  const getFirstImage = (item: IProformaInvoiceItem): IProformaInvoiceItemImage | undefined => {
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    return undefined;
  };

  // Get all images for an item
  const getAllImages = (item: IProformaInvoiceItem): IProformaInvoiceItemImage[] => {
    return item.images || [];
  };

  // Status badge configuration
  const getStatusConfig = (status: PIStatus) => {
    const config = {
      [PIStatus.PENDING_ST]: {
        label: 'Pending',
        variant: 'secondary' as const,
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 border-yellow-200',
      },
      [PIStatus.APPROVED_ST]: {
        label: 'Approved',
        variant: 'default' as const,
        icon: Check,
        color: 'text-green-500',
        bgColor: 'bg-green-50 border-green-200',
      },
      [PIStatus.APPROVED_CREATE_PROJECT]: {
        label: 'Approved - Create Project',
        variant: 'default' as const,
        icon: ArrowRight,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-300',
      },
      [PIStatus.SENT_TO_CLIENT]: {
        label: 'Sent to Client',
        variant: 'outline' as const,
        icon: Mail,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200',
      },
      [PIStatus.REVISION]: {
        label: 'Revision',
        variant: 'destructive' as const,
        icon: RefreshCw,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 border-orange-200',
      },
      [PIStatus.APPROVED_CLIENT]: {
        label: 'Client Approved',
        variant: 'default' as const,
        icon: FileCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
      },
      [PIStatus.CANCELLED]: {
        label: 'Cancelled',
        variant: 'destructive' as const,
        icon: FileX,
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
      },
    };
    return config[status];
  };
const formatDescription = (text: string, limit = 80) => {
  if (text.length <= limit) return text;

  const firstLine = text.slice(0, limit);
  const secondLine = text.slice(limit);

  return (
    <>
      {firstLine}
      <br />
      {secondLine}
    </>
  );
};
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  // Handle create project button click
  const handleCreateProject = () => {
    router.push(`/dashboard/ProformaInvoice/Project?id=${id}`);
  };
    const handleCreateDeliveryEstimation = () => {
    router.push(`/dashboard/ProformaInvoice/deliveryestimation?piId=${id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Proforma invoice not found</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const vat = invoice?.vat ?? 0;
  const subtotal = invoice?.subtotal ?? 0;
  const alertMessage = getStatusAlertMessage();
  const paymentAlert = getPaymentAlertMessage();

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6 lg:p-8">
    
      {/* Status Update Alert Dialog */}
      <AlertDialog open={showStatusAlert} onOpenChange={setShowStatusAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingStatus === PIStatus.APPROVED_CREATE_PROJECT && (
                <ArrowRight className="h-5 w-5 text-green-600" />
              )}
              {pendingStatus === PIStatus.CANCELLED && (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              {pendingStatus === PIStatus.REVISION && (
                <RefreshCw className="h-5 w-5 text-orange-600" />
              )}
              {alertMessage.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Additional warnings based on status */}
          {pendingStatus === PIStatus.CANCELLED && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warning: Cancelling this invoice is permanent and cannot be undone.
              </p>
            </div>
          )}
          
          {pendingStatus === PIStatus.APPROVED_CREATE_PROJECT && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                You will be redirected to create a project for this invoice.
              </p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowStatusAlert(false);
                setPendingStatus(null);
                // Reset selected status back to current invoice status
                setSelectedStatus(invoice.status);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdateConfirm}
              disabled={updatingStatus}
              className={
                pendingStatus === PIStatus.CANCELLED
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : pendingStatus === PIStatus.APPROVED_CREATE_PROJECT
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                `Confirm ${pendingStatus ? getStatusConfig(pendingStatus).label : 'Update'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Confirmation Alert Dialog - Only show for non-store invoices */}
      {!isStoreInvoice && (
        <AlertDialog open={showPaymentAlert} onOpenChange={setShowPaymentAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-600" />
                {paymentAlert.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {paymentAlert.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="mt-4 space-y-2">
              {paymentAlert.details.map((detail, index) => (
                <p key={index} className="text-sm">
                  {detail}
                </p>
              ))}
            </div>
            
            {paymentAlert.isFullyPaid && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  This payment will fully settle the invoice.
                </p>
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePaymentConfirm}
                disabled={addingPayment}
                className="bg-green-600 hover:bg-green-700"
              >
                {addingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Proforma Invoice #{invoice.piNumber}
            </h1>
            {isStoreInvoice && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Store className="mr-1 h-3 w-3" />
                Store
              </Badge>
            )}
                <Badge variant={getPaymentStatusVariant(invoice.paymentStatus)}>
                <CreditCard className='mr-1 h-3 w-3' />
                {invoice.paymentStatus}
              </Badge>
          </div>
          <p className="text-muted-foreground mt-2 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created on {formatDate(invoice.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          
          <ProformaInvoicePrinter 
    invoice={invoice}
    items={invoice.items}
    totalPrice={invoice.total}
  />

          
           <ProformaInvoicePDFGenerator 
    invoice={invoice}
    items={invoice.items}
    totalPrice={invoice.total}
  />
{id && <SendToClientButton invoiceId={id} />}

                      <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.CREATE.name}>

          {invoice.status === PIStatus.APPROVED_CREATE_PROJECT && (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleCreateProject}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}          </PermissionGuard>


                <Button 
              variant="default" 
              size="sm"
              onClick={handleCreateDeliveryEstimation}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Create Delivery Estimation
            </Button>

        </div>
      </div>

      {/* Status Update Card */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <statusConfig.icon className={`h-5 w-5 ${statusConfig.color}`} />
            Invoice Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className={`rounded-lg px-4 py-3 ${statusConfig.bgColor} border`}>
              <Badge variant={statusConfig.variant} className="px-3 py-1 text-sm">
                <statusConfig.icon className="mr-2 h-4 w-4" />
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Select
                value={selectedStatus}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PIStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusConfig(status).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {updatingStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating status...
                </div>
              )}
            </div>
          </div>
          
          {selectedStatus === PIStatus.APPROVED_CREATE_PROJECT && selectedStatus !== invoice.status && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Updating to this status will redirect you to create a project for this invoice.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          {!isStoreInvoice && <TabsTrigger value="payments">Payments</TabsTrigger>}
          <TabsTrigger value="logs" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Invoice Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCustomer && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Name</p>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {selectedCustomer.name || 'N/A'}
                          </p>
                        </div>
                        {selectedCustomer.companyName && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">Company</p>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {selectedCustomer.companyName}
                            </p>
                          </div>
                        )}
                        {selectedCustomer.tinNumber && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">TIN Number</p>
                            <p className="text-muted-foreground text-sm">
                              {selectedCustomer.tinNumber}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {selectedCustomer.phone1 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">Phone 1</p>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {selectedCustomer.phone1}
                            </p>
                          </div>
                        )}
                        {selectedCustomer.phone2 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">Phone 2</p>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {selectedCustomer.phone2}
                            </p>
                          </div>
                        )}
                        {selectedCustomer.address && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">Address</p>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {selectedCustomer.address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Subtotal</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(invoice.subtotal)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">VAT</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(invoice.vat || 0)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Total Amount</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(invoice.total)}
                      </p>
                    </div>

                    <Separator />

                    {/* For store invoices, show simplified summary */}
                    {isStoreInvoice ? (
                      <div className="">
                       
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Amount Paid</p>
                            <p className="text-xl font-semibold text-green-600">
                              {formatCurrency(invoice.amountPaid)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Balance Due</p>
                            <p className="text-xl font-semibold text-amber-600">
                              {formatCurrency(invoice.balance)}
                            </p>
                          </div>
                        </div>

                        {invoice.amountDate && (
                          <div className="pt-2">
                            <p className="text-sm font-medium">Last Payment Date</p>
                            <p className="text-muted-foreground text-sm">
                              {formatDate(invoice.amountDate)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar Info */}
            <div className="space-y-6">
              {/* Personnel Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    Personnel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoice.preparedBy && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Prepared By</p>
                      <p className="text-muted-foreground text-sm">
                        {invoice.preparedBy.name || invoice.preparedBy.email}
                      </p>
                    </div>
                  )}

                  {invoice.approvedBy && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Approved By</p>
                      <p className="text-muted-foreground text-sm">
                        {invoice.approvedBy.name || invoice.approvedBy.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

       
            </div>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Invoice Items ({invoice.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile View */}
              <div className="space-y-4 md:hidden">
                {invoice.items.map((item: IProformaInvoiceItem, index) => (
                  <Card key={item.id || index} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{item.description}</h4>
                            {item.size && (
                              <p className="text-muted-foreground text-sm">
                                Size: {item.size}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(item.amount)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Quantity
                            </p>
                            <p className="font-medium">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Unit Price
                            </p>
                            <p className="font-medium">
                              {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                        </div>

                        {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {item.proformaItemMaterials.length} material(s) •{' '}
                              {getItemMaterialsTotal(item)} total units
                            </span>
                          </div>
                        )}

                        {(item.additionalDescription) && (
                          <div className="space-y-2 pt-2 border-t">
                            {item.additionalDescription && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  Additional Description
                                </p>
                                <p className="text-sm line-clamp-2">
                                  {item.additionalDescription}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {getAllImages(item).length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Images ({getAllImages(item).length})
                            </p>
                            <div className="flex gap-2 overflow-x-auto">
                              {getAllImages(item).map((image, imgIndex) => (
                                <Dialog key={image.id || imgIndex}>
                                  <DialogTrigger asChild>
                                    <div className="relative w-20 h-20 shrink-0 border rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                      <img
                                        src={normalizeImagePath(image.imageUrl)}
                                        alt={`${item.description} - image ${imgIndex + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        {item.description} - Image {imgIndex + 1}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="relative aspect-video">
                                      <img
                                        src={normalizeImagePath(image.imageUrl)}
                                        alt={`${item.description} - image ${imgIndex + 1}`}
                                        className="object-contain w-full h-full rounded-md"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-50">Product</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Materials</TableHead>
                      <TableHead className="min-w-37.5">Images</TableHead>
                                            <TableHead className="min-w-50">Description</TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item: IProformaInvoiceItem, index) => {
                      const images = getAllImages(item);
                      
                      return (
                        <TableRow key={item.id || index}>
                                                  <TableCell>{item.item?.name || ''}</TableCell>

                          <TableCell>{item.size || 'N/A'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {item.proformaItemMaterials.length} material(s)
                              </Badge>
                            ) : (
                              'No materials'
                            )}
                          </TableCell>
                          <TableCell>
                            {images.length > 0 ? (
                              <div className="flex gap-1">
                                {images.slice(0, 3).map((image, imgIndex) => (
                                  <Dialog key={image.id || imgIndex}>
                                    <DialogTrigger asChild>
                                      <div className="relative w-10 h-10 border rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                        <img
                                          src={normalizeImagePath(image.imageUrl)}
                                          alt={`Thumbnail ${imgIndex + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <DialogHeader>
                                        <DialogTitle>
                                          {item.description} - Image {imgIndex + 1}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="relative aspect-video">
                                        <img
                                          src={normalizeImagePath(image.imageUrl)}
                                          alt={`${item.description} - image ${imgIndex + 1}`}
                                          className="object-contain w-full h-full rounded-md"
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ))}
                                {images.length > 3 && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    +{images.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-sm">No images</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-65">
  <div className="space-y-1">
   <TableCell className="max-w-[300px]">
  <p className="break-words">
    {formatDescription(item.description)}
  </p>
</TableCell>

    {item.additionalDescription && (
      <div className="text-xs text-muted-foreground">
  <p className="break-words">
    {formatDescription(item.additionalDescription)}
        </p>
      </div>
    )}
  </div>
</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Footer */}
              <div className="mt-6 flex flex-col items-end space-y-2">
                <div className="flex w-full max-w-sm justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex w-full max-w-sm justify-between text-sm">
                  <span>
                    VAT (
                    {subtotal > 0
                      ? ((vat / subtotal) * 100).toFixed(0)
                      : '0'}
                    %):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(vat)}
                  </span>
                </div>
                <Separator className="max-w-sm" />
                <div className="flex w-full max-w-sm justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Materials Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-3">Total Materials Required</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xl font-bold">
                        {invoice.items.reduce(
                          (total, item) => total + (item.proformaItemMaterials?.length || 0),
                          0
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Material Types</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Materials by Item</h3>
                  {invoice.items.map((item) => {
                    if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return null;

                    return (
                      <Card key={item.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {item.item?.name}
                              {item.size && (
                                <Badge variant="outline" className="ml-2">
                                  Size: {item.size}
                                </Badge>
                              )}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Material Name</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Note</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.proformaItemMaterials.map((material: IProformaItemMaterial) => (
                                <TableRow key={material.id}>
                                  <TableCell>
                                    <p className="font-medium">
                                      {material.material?.name || 'N/A'}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    {material.material?.color || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {material.material?.size || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{material.quantity} units</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {material.note ? (
                                      <div className="max-w-xs">
                                        <p className="text-sm line-clamp-2">{material.note}</p>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">
                                        No note
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {invoice.items.filter((item) => !item.proformaItemMaterials || item.proformaItemMaterials.length === 0)
                    .length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Items Without Materials
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {invoice.items
                            .filter((item) => !item.proformaItemMaterials || item.proformaItemMaterials.length === 0)
                            .map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 border rounded"
                              >
                                <div>
                                  <p className="font-medium">{item.description}</p>
                                  {item.additionalDescription && (
                                    <p className="text-sm text-muted-foreground">
                                      {item.additionalDescription}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline">
                                  {formatCurrency(item.amount)}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Attachments ({invoice.attachments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.attachments && invoice.attachments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {invoice.attachments.map((attachment: IAttachment, index) => (
                    <Card key={attachment.id || index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div>
                              <p className="font-medium">
                                Attachment {index + 1}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {attachment.createdAt && formatDate(attachment.createdAt)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    normalizeImagePath(attachment.fileUrl),
                                    '_blank'
                                  )
                                }
                              >
                                <Eye className="mr-2 h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = normalizeImagePath(attachment.fileUrl);
                                  link.download = `attachment-${index + 1}`;
                                  link.click();
                                }}
                              >
                                <Download className="mr-2 h-3 w-3" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No attachments found for this invoice
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab - Only for non-store invoices */}
        {!isStoreInvoice && (
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-sm font-medium">Total Amount</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(invoice.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Amount Paid</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(invoice.amountPaid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Balance Due</p>
                        <p className="text-xl font-bold text-amber-600">
                          {formatCurrency(invoice.balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Payment Progress</p>
                        <p className="text-xl font-bold">
                          {invoice.total > 0
                            ? ((invoice.amountPaid / invoice.total) * 100).toFixed(1)
                            : '0'}
                          %
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.ADD_PAYMENT.name}>
                      <Button onClick={() => setPaymentDialogOpen(true)}>
                        <Banknote className="mr-2 h-4 w-4" />
                        Add Payment
                      </Button>
                    </PermissionGuard>
                  </div>

                  {/* Payment Modal Dialog - Separated from button */}
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Payment</DialogTitle>
                        <DialogDescription>
                          Record a payment for this invoice.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={paymentData.amountPaid}
                            onChange={(e) =>
                              setPaymentData({
                                ...paymentData,
                                amountPaid: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Enter payment amount"
                          />
                          <p className="text-xs text-muted-foreground">
                            Balance due: {formatCurrency(invoice.balance)}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="date">Payment Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={paymentData.amountDate}
                            onChange={(e) =>
                              setPaymentData({
                                ...paymentData,
                                amountDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bank">Select Bank</Label>
                          {loadingBanks ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Loading banks...</span>
                            </div>
                          ) : banks.length > 0 ? (
                            <Select
                              value={paymentData.bankId}
                              onValueChange={(value) =>
                                setPaymentData({ ...paymentData, bankId: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a bank" />
                              </SelectTrigger>
                              <SelectContent>
                                {banks.map((bank) => (
                                  <SelectItem key={bank.id} value={bank.id || ''}>
                                    {bank.bankName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No banks available. Please add banks first.
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paidBy">Payer Name</Label>
                          <Input
                            id="paidBy"
                            value={paymentData.paidBy}
                            onChange={(e) =>
                              setPaymentData({
                                ...paymentData,
                                paidBy: e.target.value,
                              })
                            }
                            placeholder="Enter payer name"
                          />
                          <p className="text-xs text-muted-foreground">
                            Name of the person or company making the payment
                          </p>
                        </div>

                        <Button
                          onClick={handlePaymentRequest}
                          disabled={addingPayment || !paymentData.bankId || !paymentData.paidBy}
                          className="w-full"
                        >
                          Review Payment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Paid By</TableHead>
                          <TableHead>Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.banks && invoice.banks.length > 0 ? (
                          invoice.banks.map((bankRecord: IProformaInvoiceBank) => (
                            <TableRow key={bankRecord.id}>
                              <TableCell>
                                {bankRecord.createdAt ? formatDate(bankRecord.createdAt) : ''}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(bankRecord.amount || 0)}
                              </TableCell>
                              <TableCell>
                                {bankRecord.bank?.bankName || ''}
                              </TableCell>
                              <TableCell>
                                {bankRecord.paidBy || ''}
                              </TableCell>
                              <TableCell>
                                {bankRecord.createdBy?.name || ''}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No payment records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity Logs ({invoice.piLogs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.piLogs && invoice.piLogs.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium">Total Activities</p>
                        <p className="text-xl font-bold">{invoice.piLogs.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status Changes</p>
                        <p className="text-xl font-bold">
                          {invoice.piLogs.filter(log => log.action.includes('Status changed')).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Views</p>
                        <p className="text-xl font-bold">
                          {invoice.piLogs.filter(log => log.action.includes('Viewed')).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-48">Date & Time</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead className="w-32">User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.piLogs.map((log: IPiLog) => {
                          // Determine if this is a status change to show badge
                          const isStatusChange = log.action.includes('Status changed');
                          const isView = log.action.includes('Viewed');
                          
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {formatDate(log.createdAt)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isStatusChange && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      Status Change
                                    </Badge>
                                  )}
                                  {isView && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                      View
                                    </Badge>
                                  )}
                                  <span className="text-sm">{log.action}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {log.piuser?.name || log.piuser?.email || 'System'}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No activity logs found for this invoice
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProformaInvoiceDetailPage;