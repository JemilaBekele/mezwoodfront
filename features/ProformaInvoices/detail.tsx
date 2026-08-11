/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ArrowLeft,
  Image as ImageIcon,
  AlertTriangle,
  Store,
  CreditCard,
  History,
  Clock,
  ChevronRight,
  Plus,
  Percent,
  TrendingUp,
  ShieldCheck,
  Paperclip,
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
  
  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Bank state
  const [banks, setBanks] = useState<IBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    amountDate: new Date().toISOString().split('T')[0],
    bankId: '',
    paidBy: '',
  });

  // Check if this is a store invoice
  const isStoreInvoice = invoice?.store === true;

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        if (id) {
          const invoiceData = await getProformaInvoiceById(id);
          setInvoice(invoiceData);
          setSelectedStatus(invoiceData.status);
          
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

  // Fetch banks when payment dialog opens
  useEffect(() => {
    const fetchBanksData = async () => {
      if (paymentDialogOpen && !isStoreInvoice) {
        try {
          setLoadingBanks(true);
          const banksData = await getBanks();
          setBanks(banksData);
          
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

// Show warning when NO PAYMENT has been made (Amount Paid = 0)
const showNoPaymentWarning = () => {
  const amountPaid = invoice?.amountPaid || 0;
  return amountPaid <= 0;
};

// Handle status change - SHOW WARNING BUT DON'T BLOCK
const handleStatusChange = (value: PIStatus) => {
  setSelectedStatus(value);
  

  
  // Always proceed with status change
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
      await updateProformaInvoiceStatus(id, pendingStatus);
      setInvoice((prev) => (prev ? { ...prev, status: pendingStatus } : null));
      toast.success(`Status updated to ${getStatusConfig(pendingStatus).label} successfully`);
      
      if (pendingStatus === PIStatus.APPROVED_CREATE_PROJECT) {
        toast.success('Redirecting to project creation...');
        setTimeout(() => {
          router.push(`/dashboard/ProformaInvoice/Project?id=${id}`);
        }, 1200);
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

  // Handle payment addition request
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

  // Handle payment addition confirm
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

  // Get status alert message - SHOW WARNING BUT DON'T BLOCK
const getStatusAlertMessage = () => {
  if (!pendingStatus || !invoice) return { title: '', description: '', variant: 'default' };
  
  const currentStatus = invoice.status;
  const newStatus = pendingStatus;
  const statusConfig = getStatusConfig(newStatus);
  const isNoPayment = showNoPaymentWarning();
  
  if (newStatus === PIStatus.APPROVED_CREATE_PROJECT) {
    // If NO payment has been made, show a warning message
    if (isNoPayment) {
      return {
        title: '',
        description: ``,
        variant: 'destructive',
        isBlocked: false, // NOT BLOCKED
        balanceWarning: true
      };
    }
    return {
      title: 'Confirm Project Creation',
      description: `Approve this invoice and proceed to create a new project? This will change status to "Approved - Create Project" and redirect to the project workflow.`,
      variant: 'default',
      isBlocked: false,
      balanceWarning: false
    };
  } else if (newStatus === PIStatus.APPROVED_ST) {
    return {
      title: 'Confirm Approval',
      description: `Approve this invoice? Status will update from ${currentStatus} to ${statusConfig.label}.`,
      variant: 'default',
      isBlocked: false,
      balanceWarning: false
    };
  } else if (newStatus === PIStatus.SENT_TO_CLIENT) {
    return {
      title: 'Confirm Send to Client',
      description: `Mark invoice as sent to client? Status will change from ${currentStatus} to ${statusConfig.label}.`,
      variant: 'default',
      isBlocked: false,
      balanceWarning: false
    };
  } else if (newStatus === PIStatus.APPROVED_CLIENT) {
    return {
      title: 'Confirm Client Approval',
      description: `Mark invoice as approved by client? Status will change from ${currentStatus} to ${statusConfig.label}.`,
      variant: 'default',
      isBlocked: false,
      balanceWarning: false
    };
  } else if (newStatus === PIStatus.REVISION) {
    return {
      title: 'Confirm Revision Request',
      description: `Request revisions for this invoice? Status will change from ${currentStatus} to ${statusConfig.label}.`,
      variant: 'destructive',
      isBlocked: false,
      balanceWarning: false
    };
  } else if (newStatus === PIStatus.CANCELLED) {
    return {
      title: 'Confirm Cancellation',
      description: `Cancel this invoice? This action is permanent.`,
      variant: 'destructive',
      isBlocked: false,
      balanceWarning: false
    };
  }
  
  return {
    title: 'Confirm Status Change',
    description: `Change status from ${currentStatus} to ${statusConfig.label}?`,
    variant: 'default',
    isBlocked: false,
    balanceWarning: false
  };
};

// NEVER BLOCK - always return false
const isStatusChangeBlocked = (status: PIStatus): boolean => {
  // Show warning but NEVER block
  return false;
};


  // Get payment alert message
  const getPaymentAlertMessage = () => {
    const newBalance = (invoice?.balance || 0) - paymentData.amountPaid;
    const isFullyPaid = newBalance === 0;
    
    return {
      title: 'Confirm Payment Entry',
      description: `Record a payment of ${formatCurrency(paymentData.amountPaid)}?`,
      details: [
        `Amount: ${formatCurrency(paymentData.amountPaid)}`,
        `Current Balance: ${formatCurrency(invoice?.balance || 0)}`,
        `New Balance: ${formatCurrency(newBalance)}`,
        isFullyPaid ? 'This payment will fully settle the invoice balance.' : `Remaining balance after payment: ${formatCurrency(newBalance)}`,
      ],
      isFullyPaid
    };
  };

  // Calculate total materials for an item
  const getItemMaterialsTotal = (item: IProformaInvoiceItem) => {
    if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return 0;
    return item.proformaItemMaterials.reduce((total, material) => total + material.quantity, 0);
  };

  // Get all images for an item
  const getAllImages = (item: IProformaInvoiceItem): IProformaInvoiceItemImage[] => {
    return item.images || [];
  };

  // Status badge configuration with executive color system
  const getStatusConfig = (status: PIStatus) => {
    const config = {
      [PIStatus.PENDING_ST]: {
        label: 'Pending Approval',
        variant: 'secondary' as const,
        icon: AlertCircle,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        textClass: 'text-amber-600',
        dotClass: 'bg-amber-500',
      },
      [PIStatus.APPROVED_ST]: {
        label: 'Approved',
        variant: 'default' as const,
        icon: Check,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        textClass: 'text-emerald-600',
        dotClass: 'bg-emerald-500',
      },
      [PIStatus.APPROVED_CREATE_PROJECT]: {
        label: 'Approved - Create Project',
        variant: 'default' as const,
        icon: ArrowRight,
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
        textClass: 'text-teal-600',
        dotClass: 'bg-teal-500',
      },
      [PIStatus.SENT_TO_CLIENT]: {
        label: 'Sent to Client',
        variant: 'outline' as const,
        icon: Mail,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
        textClass: 'text-sky-600',
        dotClass: 'bg-sky-500',
      },
      [PIStatus.REVISION]: {
        label: 'Under Revision',
        variant: 'destructive' as const,
        icon: RefreshCw,
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
        textClass: 'text-orange-600',
        dotClass: 'bg-orange-500',
      },
      [PIStatus.APPROVED_CLIENT]: {
        label: 'Client Approved',
        variant: 'default' as const,
        icon: FileCheck,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
        textClass: 'text-indigo-600',
        dotClass: 'bg-indigo-500',
      },
      [PIStatus.CANCELLED]: {
        label: 'Cancelled',
        variant: 'destructive' as const,
        icon: FileX,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
        textClass: 'text-rose-600',
        dotClass: 'bg-rose-500',
      },
    };
    return config[status] || {
      label: status,
      variant: 'outline' as const,
      icon: Info,
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      textClass: 'text-slate-600',
      dotClass: 'bg-slate-400',
    };
  };

  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PARTIAL':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'PENDING':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const formatDescription = (text: string, limit = 80) => {
    if (!text) return '-';
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'ETB 0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };


  const handleCreateProject = () => {
    router.push(`/dashboard/ProformaInvoice/Project?id=${id}`);
  };

  const handleCreateDeliveryEstimation = () => {
    router.push(`/dashboard/ProformaInvoice/deliveryestimation?piId=${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
          <FileText className="absolute h-6 w-6 text-slate-700" />
        </div>
        <p className="text-sm font-medium tracking-wide text-slate-500">Loading proforma invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-rose-50 p-4 text-rose-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Invoice Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md">The requested proforma invoice could not be found or may have been deleted.</p>
        <Button onClick={() => router.push('/dashboard/ProformaInvoice')} variant="outline" className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const vat = invoice?.vat ?? 0;
  const subtotal = invoice?.subtotal ?? 0;
  const alertMessage = getStatusAlertMessage();
  const paymentAlert = getPaymentAlertMessage();

  // Financial statistics calculations
  const paidPercent = invoice.total > 0 ? Math.min(100, Math.max(0, (invoice.amountPaid / invoice.total) * 100)) : 0;
  const totalItemsCount = invoice.items.length;
  const totalQtyCount = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Initials for avatar
  const getCustomerInitials = (name?: string) => {
    if (!name) return 'CU';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/ProformaInvoice')}
            className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
              <span className="cursor-pointer hover:text-slate-800" onClick={() => router.push('/dashboard/ProformaInvoice')}>Proforma Invoices</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-mono text-slate-700">#{invoice.piNumber}</span>
            </div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                #{invoice.piNumber}
              </h1>
              {isStoreInvoice && (
                <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  Store Invoice
                </Badge>
              )}
              <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getPaymentBadgeClass(invoice.paymentStatus)}`}>
                {invoice.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          <ProformaInvoicePrinter invoice={invoice} items={invoice.items} totalPrice={invoice.total} />
          <ProformaInvoicePDFGenerator invoice={invoice} items={invoice.items} totalPrice={invoice.total} />
          {id && <SendToClientButton invoiceId={id} />}
          
          <PermissionGuard requiredPermission={PERMISSIONS.DELIVERY_ESTIMATION.CREATE.name}>
            <Button
              onClick={handleCreateDeliveryEstimation}
              variant="outline"
              className="h-9 rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-medium text-xs px-3"
            >
              <Package className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Estimate
            </Button>
          </PermissionGuard>

          <PermissionGuard requiredPermission={PERMISSIONS.PROJECT.CREATE.name}>
            {invoice.status === PIStatus.APPROVED_CREATE_PROJECT && (
              <Button
                onClick={handleCreateProject}
                className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold text-xs px-4"
              >
                <ArrowRight className="mr-1.5 h-4 w-4" />
                Create Project
              </Button>
            )}
          </PermissionGuard>
        </div>
      </div>

      {/* Status Update Alert Dialog - SHOW WARNING BUT ALLOW ACTION */}
<AlertDialog open={showStatusAlert} onOpenChange={setShowStatusAlert}>
  <AlertDialogContent className={`rounded-xl border border-slate-200 shadow-xl max-w-md ${alertMessage.balanceWarning ? 'border-red-500 border-4' : ''}`}>
    <AlertDialogHeader>
      <AlertDialogTitle className={`flex items-center gap-2 ${alertMessage.balanceWarning ? 'text-red-700' : 'text-slate-900'}`}>
        {pendingStatus === PIStatus.APPROVED_CREATE_PROJECT && alertMessage.balanceWarning && (
          <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
        )}
        {pendingStatus === PIStatus.APPROVED_CREATE_PROJECT && !alertMessage.balanceWarning && (
          <ArrowRight className="h-5 w-5 text-emerald-600" />
        )}
        {pendingStatus === PIStatus.CANCELLED && (
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        )}
        {pendingStatus === PIStatus.REVISION && (
          <RefreshCw className="h-5 w-5 text-orange-600" />
        )}
        {alertMessage.title}
      </AlertDialogTitle>
      <AlertDialogDescription className={`${alertMessage.balanceWarning ? 'text-red-700 font-medium text-sm' : 'text-slate-600 text-sm'} mt-1`}>
        {alertMessage.description}
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    {/* BIG RED WARNING FOR NO PAYMENT */}
    {alertMessage.balanceWarning && (
      <div className="mt-3 p-4 bg-red-50 border-2 border-red-500 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="bg-red-500 rounded-full p-2 shrink-0 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-700">⚠️ NO PAYMENT RECEIVED!</h4>
            <p className="text-xs text-red-600 font-medium mt-1">
              Amount Paid: <strong>{formatCurrency(invoice.amountPaid)}</strong>
            </p>
            <p className="text-xs text-red-600 font-medium">
              You are about to create a project without any payment received.
            </p>
            <div className="mt-2 p-2 bg-red-100 rounded-lg border border-red-300">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-700">Total Invoice:</span>
                <span className="text-red-800 font-bold">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-700">Amount Paid:</span>
                <span className="text-red-800 font-bold">{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-xs font-mono border-t border-red-300 pt-1 mt-1">
                <span className="text-red-700 font-bold">Balance Due:</span>
                <span className="text-red-800 font-bold">{formatCurrency(invoice.balance)}</span>
              </div>
            </div>
            <p className="text-xs text-red-700 font-bold mt-2">
              Are you sure you want to proceed?
            </p>
          </div>
        </div>
      </div>
    )}
    
    {pendingStatus === PIStatus.CANCELLED && !alertMessage.balanceWarning && (
      <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
        <p className="text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Warning: Cancelling this invoice is permanent and cannot be undone.
        </p>
      </div>
    )}
    
    {pendingStatus === PIStatus.APPROVED_CREATE_PROJECT && !alertMessage.balanceWarning && (
      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <p className="text-xs text-emerald-700 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          You will be automatically redirected to project setup after confirmation.
        </p>
      </div>
    )}
    
    <AlertDialogFooter className="mt-4">
      <AlertDialogCancel 
        className="rounded-lg border-slate-200"
        onClick={() => {
          setShowStatusAlert(false);
          setPendingStatus(null);
          setSelectedStatus(invoice.status);
        }}
      >
        Cancel
      </AlertDialogCancel>
      {/* ALWAYS SHOW THE CONFIRM BUTTON - even with warning */}
      <AlertDialogAction
        onClick={handleStatusUpdateConfirm}
        disabled={updatingStatus}
        className={
          pendingStatus === PIStatus.CANCELLED
            ? 'rounded-lg bg-rose-600 hover:bg-rose-700 text-white'
            : pendingStatus === PIStatus.APPROVED_CREATE_PROJECT
            ? 'rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'rounded-lg bg-slate-900 hover:bg-slate-800 text-white'
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

      {/* Payment Confirmation Alert Dialog */}
      {!isStoreInvoice && (
        <AlertDialog open={showPaymentAlert} onOpenChange={setShowPaymentAlert}>
          <AlertDialogContent className="rounded-xl border border-slate-200 shadow-xl max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-slate-900">
                <Banknote className="h-5 w-5 text-emerald-600" />
                {paymentAlert.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600 text-sm">
                {paymentAlert.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="mt-3 space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              {paymentAlert.details.map((detail, index) => (
                <p key={index} className="text-xs font-mono text-slate-700">
                  {detail}
                </p>
              ))}
            </div>
            
            {paymentAlert.isFullyPaid && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs text-emerald-700 flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 text-emerald-600" />
                  This payment will fully settle the invoice balance.
                </p>
              </div>
            )}
            
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="rounded-lg border-slate-200">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePaymentConfirm}
                disabled={addingPayment}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
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

      {/* Executive Overview Banner & KPI Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        
        {/* Status & Control Card */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Status</span>
                <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotClass} animate-pulse`} />
              </div>
              <div className="mt-2 flex items-center space-x-2.5">
                <statusConfig.icon className={`h-6 w-6 ${statusConfig.textClass}`} />
                <h3 className="text-xl font-bold tracking-tight text-slate-900">{statusConfig.label}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Created on {formatDate(invoice.createdAt)}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Change Status</label>
              
         
              
              <Select 
                value={selectedStatus} 
                onValueChange={handleStatusChange} 
                disabled={updatingStatus || invoice.status === PIStatus.APPROVED_CREATE_PROJECT}
              >
                <SelectTrigger className={`w-full h-9 rounded-lg border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-slate-900 ${showNoPaymentWarning() ? 'border-red-500 border-2 bg-red-50' : ''}`}>
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 bg-white text-slate-900">
                  {Object.values(PIStatus).map((status) => {
                    const isBlocked = isStatusChangeBlocked(status);
                    return (
                      <SelectItem 
                        key={status} 
                        value={status} 
                        className={`text-xs focus:bg-slate-50 focus:text-slate-900 ${isBlocked ? 'text-red-600 bg-red-50 font-bold' : ''}`}
                        // NOT DISABLED - always selectable
                      >
                        {isBlocked && '⚠️ '}
                        {getStatusConfig(status).label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
          
            </div>
          </CardContent>
        </Card>

        {/* Total Financial Stat Card */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Grand Total</p>
                <h2 className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
                  {formatCurrency(invoice.total)}
                </h2>
              </div>
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-semibold uppercase block">Subtotal</span>
                <span className="font-mono font-bold text-slate-700">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-semibold uppercase block">VAT</span>
                <span className="font-mono font-bold text-slate-700">{formatCurrency(invoice.vat || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Balance Progress Stat Card */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Payment Balance</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className={`text-2xl font-black font-mono ${showNoPaymentWarning() ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatCurrency(invoice.amountPaid)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">paid</span>
                </div>
              </div>
              <div className={`rounded-xl p-2.5 ${showNoPaymentWarning() ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px] font-medium">Balance Due: <strong className={`font-mono font-bold ${showNoPaymentWarning() ? 'text-red-700' : 'text-amber-700'}`}>{formatCurrency(invoice.balance)}</strong></span>
                <span className="font-mono font-bold text-emerald-700">{paidPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${showNoPaymentWarning() ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="border-b border-slate-200">
          <TabsList className="h-11 bg-transparent p-0 space-x-2">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent"
            >
              <FileText className="mr-2 h-3.5 w-3.5 inline" /> Overview
            </TabsTrigger>
            <TabsTrigger 
              value="items" 
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent"
            >
              <Package className="mr-2 h-3.5 w-3.5 inline" /> Items ({totalItemsCount})
            </TabsTrigger>
            <TabsTrigger 
              value="materials" 
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent"
            >
              <Box className="mr-2 h-3.5 w-3.5 inline" /> Materials
            </TabsTrigger>
            <TabsTrigger 
              value="attachments" 
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent"
            >
              <Paperclip className="mr-2 h-3.5 w-3.5 inline" /> Attachments ({invoice.attachments?.length || 0})
            </TabsTrigger>
            {!isStoreInvoice && (
              <TabsTrigger 
                value="payments" 
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent"
              >
                <Banknote className="mr-2 h-3.5 w-3.5 inline" /> Payments
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="logs" 
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent"
            >
              <History className="mr-2 h-3.5 w-3.5 inline" /> Audit Logs ({invoice.piLogs?.length || 0})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Client Data Card */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Client Information</CardTitle>
                  </div>
                  {selectedCustomer?.tinNumber && (
                    <Badge variant="outline" className="font-mono text-xs border-slate-300 bg-white text-slate-700">
                      TIN: {selectedCustomer.tinNumber}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {selectedCustomer ? (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-white shadow-sm">
                        {getCustomerInitials(selectedCustomer.name)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
                        {selectedCustomer.companyName && (
                          <p className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-slate-400" />
                            {selectedCustomer.companyName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
                      {selectedCustomer.phone1 && (
                        <div className="flex items-center space-x-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-400">Primary Phone</p>
                            <p className="font-mono text-xs font-semibold text-slate-800">{selectedCustomer.phone1}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.phone2 && (
                        <div className="flex items-center space-x-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-400">Secondary Phone</p>
                            <p className="font-mono text-xs font-semibold text-slate-800">{selectedCustomer.phone2}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.email && (
                        <div className="flex items-center space-x-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-400">Email Address</p>
                            <p className="text-xs font-medium text-slate-800">{selectedCustomer.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-center space-x-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-400">Physical Address</p>
                            <p className="text-xs font-medium text-slate-800">{selectedCustomer.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm font-mono text-slate-400">
                    No customer data associated with this invoice
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personnel & Governance Card */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  Governance & Personnel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 divide-y divide-slate-100">
                {invoice.preparedBy && (
                  <div className="pt-2 first:pt-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prepared By</p>
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {(invoice.preparedBy.name || invoice.preparedBy.email || 'P')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{invoice.preparedBy.name || 'Staff'}</p>
                        <p className="text-xs text-slate-500">{invoice.preparedBy.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {invoice.approvedBy ? (
                  <div className="pt-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved By</p>
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                        {(invoice.approvedBy.name || invoice.approvedBy.email || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{invoice.approvedBy.name || 'Approver'}</p>
                        <p className="text-xs text-slate-500">{invoice.approvedBy.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approval Status</p>
                    <p className="text-xs text-slate-500 italic">Pending formal sign-off</p>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Invoice Type:</span>
                    <span className="font-semibold text-slate-800">{isStoreInvoice ? 'Store Sales' : 'Standard Project'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Created Date:</span>
                    <span className="font-mono text-slate-800">{formatDate(invoice.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Financial Breakdown Card */}
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                Financial Calculation Tree
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtotal Amount</p>
                  <p className="text-xl font-bold font-mono text-slate-800 mt-1">{formatCurrency(invoice.subtotal)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">VAT ({subtotal > 0 ? ((vat / subtotal) * 100).toFixed(0) : '0'}%)</p>
                  <p className="text-xl font-bold font-mono text-slate-800 mt-1">{formatCurrency(vat)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grand Total</p>
                  <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(invoice.total)}</p>
                </div>
                {!isStoreInvoice ? (
                  <div className={`p-4 rounded-xl border ${showNoPaymentWarning() ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className={`text-[10px] font-bold uppercase ${showNoPaymentWarning() ? 'text-red-700' : 'text-emerald-700'}`}>Amount Paid</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${showNoPaymentWarning() ? 'text-red-800' : 'text-emerald-800'}`}>{formatCurrency(invoice.amountPaid)}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <span className="text-xs text-slate-400 font-medium">Store Checkout</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ITEMS TAB */}
        <TabsContent value="items" className="space-y-4">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" />
                Line Items Breakdown
              </CardTitle>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span>Total Items: <strong className="text-slate-800 font-mono">{totalItemsCount}</strong></span>
                <span>•</span>
                <span>Total Units: <strong className="text-slate-800 font-mono">{totalQtyCount}</strong></span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/70 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">#</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 min-w-[180px]">Product / Service</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 min-w-[100px]">Size</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Qty</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Unit Price</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right min-w-[120px]">Line Amount</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Materials</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Images</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 min-w-[200px]">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {invoice.items.map((item: IProformaInvoiceItem, index: number) => {
                      const images = getAllImages(item);
                      
                      return (
                        <TableRow key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-center font-mono text-xs font-semibold text-slate-400">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-sm text-slate-900">
                            {item.item?.name || item.category?.name || 'Item'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {item.size ? (
                              <Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50">
                                {item.size}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-800 text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600 text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-900 text-right bg-slate-50/50">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            {item.proformaItemMaterials && item.proformaItemMaterials.length > 0 ? (
                              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 text-[11px] font-medium flex w-fit items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {item.proformaItemMaterials.length} MAT
                              </Badge>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {images.length > 0 ? (
                              <div className="flex gap-1 items-center">
                                {images.slice(0, 3).map((image, imgIndex) => (
                                  <Dialog key={image.id || imgIndex}>
                                    <DialogTrigger asChild>
                                      <div className="relative h-9 w-9 rounded-md border border-slate-200 overflow-hidden cursor-pointer hover:border-slate-400 transition-all">
                                        <img
                                          src={normalizeImagePath(image.imageUrl)}
                                          alt={`Item thumbnail ${imgIndex + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl rounded-xl p-0 overflow-hidden">
                                      <DialogHeader className="p-4 border-b border-slate-100 bg-slate-50">
                                        <DialogTitle className="text-sm font-semibold">
                                          Image Preview ({imgIndex + 1} of {images.length})
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[300px]">
                                        <img
                                          src={normalizeImagePath(image.imageUrl)}
                                          alt={`Full image ${imgIndex + 1}`}
                                          className="object-contain max-h-[70vh] rounded-lg shadow-sm"
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ))}
                                {images.length > 3 && (
                                  <Badge variant="secondary" className="text-[10px] font-mono h-6 px-1.5">
                                    +{images.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <ImageIcon className="h-3 w-3 text-slate-300" /> No Image
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs text-xs text-slate-600">
                            <div className="space-y-1">
                              <p className="break-words font-medium">{formatDescription(item.description)}</p>
                              {item.additionalDescription && (
                                <p className="text-[11px] text-slate-400 italic break-words">
                                  {formatDescription(item.additionalDescription)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-slate-100 md:hidden p-4 space-y-4">
                {invoice.items.map((item: IProformaInvoiceItem, index: number) => (
                  <div key={item.id || index} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{item.item?.name || item.description}</h4>
                        {item.size && (
                          <Badge variant="outline" className="mt-1 text-[10px] font-mono">
                            Size: {item.size}
                          </Badge>
                        )}
                      </div>
                      <Badge className="bg-slate-900 text-white font-mono text-xs">
                        {formatCurrency(item.amount)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Quantity</span>
                        <span className="font-mono font-bold text-slate-800">{item.quantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Unit Price</span>
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>

                    {item.additionalDescription && (
                      <p className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                        {item.additionalDescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Sticky Summary Footer */}
              <div className="border-t border-slate-200 bg-slate-50 p-4 flex flex-col items-end space-y-1.5 text-xs">
                <div className="flex justify-between w-full max-w-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-slate-600">
                  <span>VAT ({subtotal > 0 ? ((vat / subtotal) * 100).toFixed(0) : '0'}%):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatCurrency(vat)}</span>
                </div>
                <Separator className="my-1 max-w-xs" />
                <div className="flex justify-between w-full max-w-xs text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-slate-900">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MATERIALS TAB */}
        <TabsContent value="materials" className="space-y-6">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Box className="h-4 w-4 text-slate-500" />
                Materials Requirement Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Materials Count Metric Banner */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Material Types</p>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {invoice.items.reduce(
                      (total, item) => total + (item.proformaItemMaterials?.length || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Material Units</p>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {invoice.items.reduce(
                      (total, item) => total + getItemMaterialsTotal(item),
                      0
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 col-span-2 md:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Items with Specs</p>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {invoice.items.filter(item => item.proformaItemMaterials && item.proformaItemMaterials.length > 0).length} / {invoice.items.length}
                  </p>
                </div>
              </div>

              {/* Item Materials Accordion/Card Breakdown */}
              <div className="space-y-4">
                {invoice.items.map((item) => {
                  if (!item.proformaItemMaterials || item.proformaItemMaterials.length === 0) return null;

                  return (
                    <Card key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <CardHeader className="bg-slate-50/80 px-5 py-3 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-slate-500" />
                            {item.item?.name || item.description}
                            {item.size && (
                              <Badge variant="outline" className="ml-2 font-mono text-[10px]">
                                {item.size}
                              </Badge>
                            )}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.proformaItemMaterials.length} material(s)
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-slate-50/40">
                            <TableRow>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Material Name</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Color</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Size</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Qty</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Add. Qty</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-slate-100 text-xs">
                            {item.proformaItemMaterials.map((material: IProformaItemMaterial) => (
                              <TableRow key={material.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-semibold text-slate-800">
                                  {material.material?.name || '-'}
                                </TableCell>
                                <TableCell className="text-slate-600">{material.material?.color || '-'}</TableCell>
                                <TableCell className="font-mono text-slate-600">{material.material?.size || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-xs border-slate-200">
                                    {material.quantity} units
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    +{material?.additionalQuantity || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-500 text-xs">
                                  {material.note ? (
                                    <span className="line-clamp-1">{material.note}</span>
                                  ) : (
                                    <span className="text-slate-300 italic">No notes</span>
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

                {/* Items Without Materials Card */}
                {invoice.items.filter((item) => !item.proformaItemMaterials || item.proformaItemMaterials.length === 0).length > 0 && (
                  <Card className="rounded-xl border border-slate-200 bg-amber-50/30 shadow-sm">
                    <CardHeader className="py-3 px-5 border-b border-amber-100">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                        <Info className="h-4 w-4 text-amber-600" />
                        Items Without Specified Materials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {invoice.items
                        .filter((item) => !item.proformaItemMaterials || item.proformaItemMaterials.length === 0)
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200/60 bg-white text-xs">
                            <span className="font-medium text-slate-800">{item.description}</span>
                            <Badge variant="outline" className="font-mono border-amber-300 text-amber-800">
                              {formatCurrency(item.amount)}
                            </Badge>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ATTACHMENTS TAB */}
        <TabsContent value="attachments" className="space-y-4">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-slate-500" />
                Attached Documents & Proofs ({invoice.attachments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {invoice.attachments && invoice.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invoice.attachments.map((attachment: IAttachment, index: number) => (
                    <div key={attachment.id || index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 hover:border-slate-300 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="rounded-lg bg-slate-900 p-2 text-white">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Attachment #{index + 1}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {attachment.createdAt ? formatDate(attachment.createdAt) : 'Added'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs font-medium border-slate-300"
                          onClick={() => window.open(normalizeImagePath(attachment.fileUrl), '_blank')}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs font-medium border-slate-300"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = normalizeImagePath(attachment.fileUrl);
                            link.download = `attachment-${index + 1}`;
                            link.click();
                          }}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Paperclip className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500 font-medium">No attachments uploaded for this invoice</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB (Non-Store) */}
        {!isStoreInvoice && (
          <TabsContent value="payments" className="space-y-6">
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-slate-500" />
                  Payment Records & History
                </CardTitle>
                <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.ADD_PAYMENT.name}>
                  <Button
                    onClick={() => setPaymentDialogOpen(true)}
                    className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 shadow-sm"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                </PermissionGuard>
              </CardHeader>
              <CardContent className="p-0">
                
                {/* Financial Metric Header */}
                <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-200 bg-slate-50/50">
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Invoice Total</p>
                    <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(invoice.total)}</p>
                  </div>
                  <div className={`p-4 text-center ${showNoPaymentWarning() ? 'bg-red-50' : ''}`}>
                    <p className={`text-[10px] font-bold uppercase ${showNoPaymentWarning() ? 'text-red-700' : 'text-emerald-700'}`}>Total Paid</p>
                    <p className={`text-lg font-bold font-mono mt-0.5 ${showNoPaymentWarning() ? 'text-red-800' : 'text-emerald-800'}`}>{formatCurrency(invoice.amountPaid)}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-bold uppercase text-amber-700">Balance Remaining</p>
                    <p className="text-lg font-bold font-mono text-amber-800 mt-0.5">{formatCurrency(invoice.balance)}</p>
                  </div>
                  <div className="p-4 text-center flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Settlement Progress</p>
                    <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{paidPercent.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Add Payment Modal Dialog */}
                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogContent className="rounded-xl border border-slate-200 shadow-xl max-w-md p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50">
                      <DialogTitle className="text-base font-bold text-slate-900">Record New Payment</DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 mt-1">
                        Enter details for payment received against invoice balance.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4 bg-white">
                      <div className="space-y-1.5">
                        <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">Payment Amount (ETB)</Label>
                        <Input
                          id="amount"
                          type="text"
                          className="h-9 rounded-lg border-slate-300 font-mono text-sm"
                          value={paymentData.amountPaid ? paymentData.amountPaid.toLocaleString('en-US') : ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
                            setPaymentData({
                              ...paymentData,
                              amountPaid: parseFloat(rawValue) || 0,
                            });
                          }}
                          placeholder="0.00"
                        />
                        <p className="text-[11px] text-amber-700 font-mono">
                          Remaining balance due: <strong>{formatCurrency(invoice.balance)}</strong>
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="date" className="text-xs font-semibold text-slate-700">Payment Date</Label>
                        <Input
                          id="date"
                          type="date"
                          className="h-9 rounded-lg border-slate-300 text-xs font-mono"
                          value={paymentData.amountDate}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              amountDate: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bank" className="text-xs font-semibold text-slate-700">Bank Account</Label>
                        {loadingBanks ? (
                          <div className="flex items-center space-x-2 text-xs text-slate-500 py-1">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading banks...
                          </div>
                        ) : banks.length > 0 ? (
                          <Select
                            value={paymentData.bankId}
                            onValueChange={(value) =>
                              setPaymentData({ ...paymentData, bankId: value })
                            }
                          >
                            <SelectTrigger className="h-9 rounded-lg border-slate-300 text-xs">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-slate-200">
                              {banks.map((bank) => (
                                <SelectItem key={bank.id} value={bank.id || ''} className="text-xs">
                                  {bank.bankName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-xs text-rose-600 italic">No bank accounts available</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="paidBy" className="text-xs font-semibold text-slate-700">Payer Name</Label>
                        <Input
                          id="paidBy"
                          className="h-9 rounded-lg border-slate-300 text-xs"
                          value={paymentData.paidBy}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              paidBy: e.target.value,
                            })
                          }
                          placeholder="Person or organization name"
                        />
                      </div>

                      <Button
                        onClick={handlePaymentRequest}
                        disabled={addingPayment || !paymentData.bankId || !paymentData.paidBy}
                        className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs mt-2"
                      >
                        Review Payment Entry
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Payments Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/70 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Amount</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank Account</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Paid By</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 text-xs">
                      {invoice.banks && invoice.banks.length > 0 ? (
                        invoice.banks.map((bankRecord: IProformaInvoiceBank) => (
                          <TableRow key={bankRecord.id} className="hover:bg-slate-50/60">
                            <TableCell className="font-mono text-slate-600">
                              {bankRecord.createdAt ? formatDate(bankRecord.createdAt) : '-'}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-emerald-700 text-right">
                              {formatCurrency(bankRecord.amount || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50">
                                {bankRecord.bank?.bankName || 'Unknown Bank'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-800">
                              {bankRecord.paidBy || '-'}
                            </TableCell>
                            <TableCell className="text-slate-500">
                              {bankRecord.createdBy?.name || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs font-mono">
                            No payment transactions recorded yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* AUDIT LOGS TAB */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                Audit Trail & History ({invoice.piLogs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.piLogs && invoice.piLogs.length > 0 ? (
                <Table>
                  <TableHeader className="bg-slate-100/70 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-44">Timestamp</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Action Description</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-48">Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {invoice.piLogs.map((log: IPiLog) => {
                      const isStatusChange = log.action.includes('Status changed');
                      const isView = log.action.includes('Viewed');
                      
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/60">
                          <TableCell className="font-mono text-slate-500 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{formatDate(log.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-800">
                            <div className="flex items-center space-x-2">
                              {isStatusChange && (
                                <Badge variant="outline" className="text-[10px] font-semibold uppercase border-blue-200 bg-blue-50 text-blue-700">
                                  Status Update
                                </Badge>
                              )}
                              {isView && (
                                <Badge variant="outline" className="text-[10px] font-semibold uppercase border-slate-200 bg-slate-50 text-slate-600">
                                  View Log
                                </Badge>
                              )}
                              <span className="font-medium">{log.action}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">
                            <div className="flex items-center space-x-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span>{log.piuser?.name || log.piuser?.email || 'System'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">
                  No activity logs recorded for this invoice
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