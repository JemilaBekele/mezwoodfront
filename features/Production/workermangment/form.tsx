/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  User,
  Users,
  Loader2,
  PlusCircle,
  Trash2,
  Edit,
  Calendar,
  UserCircle,
  FileText,
  Ruler,
  Package,
  CheckCircle,
  XCircle,
  CheckSquare,
  Store
} from 'lucide-react';

import {
  getCurtainWorkerLogsByMeasurement,
  createCurtainWorkerLog,
  updateCurtainWorkerLog,
  deleteCurtainWorkerLog,
} from '@/service/CurtainWorkerLog';
import { bulkApproveCurtainWorkerLogs, rejectCurtainWorkerLog } from '@/service/CurtainWorkerLog';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertModal } from '@/components/modal/alert-modal';
import { formatDate } from '@/lib/format';
import { Checkbox } from '@/components/ui/checkbox';
import { CurtainWorkerType, CurtainWorkerLogStatus, ICurtainWorkerLog } from '@/models/CurtainWorkerLog';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { TransferEntityType } from '@/models/transfer';

// Interface for product stock item from API
interface ProductStockItem {
  id: string;
  shopId: string;
  productId: string;
  quantity: number;
  unitOfMeasureId: string;
  product: {
    id: string;
    name: string;
    productCode: string;
    colour?: {
      name: string;
    };
  };
  variants?: Array<{
    id: string;
    height: number;
    width: number;
    quantity: number;
  }>;
  hasVariants: boolean;
  stockType: 'dimension' | 'quantity';
}

type CurtainWorkerLogsProps = {
  curtainMeasurementId: string;
  measurementRoomName?: string;
  workerType: CurtainWorkerType;
  productId?: string;
  productName?: string;
  productVariant?: string;
  assignedWidth?: number;
  assignedHeight?: number;
  assignedExtraWidth?: number; // ✅ Added extra width prop
  shopId?: string;
  shopName?: string;
};

// Helper function to get status badge
const getStatusBadge = (status?: CurtainWorkerLogStatus) => {
  switch (status) {
    case 'APPROVED':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Helper function to calculate overall progress
const calculateOverallProgress = (log: ICurtainWorkerLog) => {
  const totalAssigned = (log.widthmeterAssigned || 0) + (log.heightmeterAssigned || 0) + (log.extrawidthAssigned || 0) + (log.quantityAssigned || 0);
  const totalCompleted = (log.widthmeterCompleted || 0) + (log.heightmeterCompleted || 0) + (log.extrawidthCompleted || 0) + (log.quantityCompleted || 0);
  
  if (totalAssigned === 0) return 0;
  return Math.round((totalCompleted / totalAssigned) * 100);
};

// Helper function to format variant label
const formatVariantLabel = (variant: any): string => {
  const height = typeof variant.height === 'number' ? variant.height.toFixed(2).replace(/\.?0+$/, '') : variant.height;
  const width = typeof variant.width === 'number' ? variant.width.toFixed(2).replace(/\.?0+$/, '') : variant.width;
  return `${height} x ${width} (${variant.quantity} available)`;
};

// Helper function to normalize dimension string (replace × with x, remove spaces)
const normalizeDimensionString = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\s/g, '')
    .replace(/×/g, 'x')
    .toLowerCase();
};

// Helper function to check if variant matches the productVariant prop
const isVariantMatch = (variant: any, productVariant?: string): boolean => {
  if (!productVariant) return false;
  
  const normalizedProductVariant = normalizeDimensionString(productVariant);
  
  const variantHeight = variant.height;
  const variantWidth = variant.width;
  
  if (variantHeight === undefined || variantWidth === undefined) return false;
  
  const variantString1 = normalizeDimensionString(`${variantHeight}x${variantWidth}`);
  const variantString2 = normalizeDimensionString(`${variantWidth}x${variantHeight}`);
  
  return variantString1 === normalizedProductVariant || 
         variantString2 === normalizedProductVariant ||
         variant.id === productVariant;
};

// Worker Logs Table Component
const WorkerLogsTable = ({ 
  logs, 
  title, 
  badgeColor,
  selectedLogs,
  onSelectLog,
  onSelectAll,
  onEdit, 
  onDelete,
  onApprove,
  onReject
}: { 
  logs: ICurtainWorkerLog[]; 
  title: string;
  badgeColor: string;
  selectedLogs: Set<string>;
  onSelectLog: (logId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (log: ICurtainWorkerLog) => void;
  onDelete: (log: ICurtainWorkerLog) => void;
  onApprove: (log: ICurtainWorkerLog) => void;
  onReject: (log: ICurtainWorkerLog) => void;
}) => {
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table');

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // Use card view on screens smaller than 1024px for better readability
      setViewMode(width < 1024 ? 'card' : 'table');
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (logs.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
          <Badge className={badgeColor}>{title}</Badge>
          <span className="text-xs sm:text-sm text-muted-foreground">(No logs)</span>
        </h3>
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center border rounded-lg bg-muted/10 dark:bg-muted/5">
          <Users className='h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2 sm:mb-3' />
          <p className='text-xs sm:text-sm text-muted-foreground px-4'>
            No {title.toLowerCase()} workers assigned yet.
          </p>
        </div>
      </div>
    );
  }

  const allSelected = logs.every(log => selectedLogs.has(log.id));
  const someSelected = logs.some(log => selectedLogs.has(log.id)) && !allSelected;

  // Card View - Used for all screen sizes (more reliable)
return (
  <div className="mb-8 text-foreground">

    {/* Header */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">

      <h3 className="text-base sm:text-lg font-semibold">
        <Badge className={badgeColor}>{title}</Badge>
      </h3>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelectAll(!allSelected)}
        className="text-xs w-full sm:w-auto"
      >
        {allSelected ? 'Deselect All' : 'Select All'}
      </Button>

    </div>

    {/* Logs */}
    <div className="space-y-3">

      {logs.map((log) => {
        const progress = calculateOverallProgress(log);
        const isApproved = log.status === 'APPROVED';
        const isPending = log.status === 'PENDING';

        return (
          <div
            key={log.id}
            className={`
              border border-border rounded-lg p-3 space-y-3
              bg-card text-foreground
              ${selectedLogs.has(log.id) ? 'ring-2 ring-primary' : ''}
            `}
          >

            {/* HEADER */}
            <div className="flex flex-col gap-2">

              <div className="flex items-start justify-between gap-2">

                <div className="flex items-center gap-2 flex-1 min-w-0">

                  <Checkbox
                    checked={selectedLogs.has(log.id)}
                    onCheckedChange={(checked) => onSelectLog(log.id, checked as boolean)}
                    aria-label={`Select log for ${log.worker?.name || 'Unassigned'}`}
                    disabled={isApproved}
                    className="shrink-0"
                  />

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-1 flex-wrap">

                      <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />

                      <span className="font-medium text-sm truncate text-foreground">
                        {log.worker?.name || 'Unassigned'}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="shrink-0">
                  {getStatusBadge(log.status)}
                </div>

              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-1 justify-end border-t border-border pt-2">

                {isPending && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApprove(log)}
                      className="text-green-500 hover:text-green-600 h-8 px-2 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(log)}
                      className="text-red-500 hover:text-red-600 h-8 px-2 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </>
                )}

                <Button variant="outline" size="sm" onClick={() => onEdit(log)} className="h-8 px-2 text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>

                {!isApproved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(log)}
                    className="text-red-500 hover:text-red-600 h-8 px-2 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}

              </div>

            </div>

            {/* PRODUCT VARIANT */}
            <div className="bg-muted rounded-lg p-2 border border-border">

              <Label className="text-xs text-muted-foreground">
                Product Variant
              </Label>

              {log.shopProductVariant ? (
                <div className="mt-1">

                  <p className="text-sm font-medium text-foreground">
                    {log.shopProductVariant.shopStock?.product?.name || 'Product'}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {log.shopProductVariant.height} x {log.shopProductVariant.width}
                  </p>

                </div>
              ) : (
                <Badge variant="outline" className="mt-1 text-xs">
                  No variant
                </Badge>
              )}

            </div>

            {/* ASSIGNED WORK */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                Assigned Work
              </Label>

              <div className="grid grid-cols-2 gap-2">

                <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                  <p className="text-xs text-muted-foreground">Width</p>
                  <p className="text-xs font-semibold text-foreground">
                    {log.widthmeterAssigned?.toFixed(2) || '-'} m
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                  <p className="text-xs text-muted-foreground">Height</p>
                  <p className="text-xs font-semibold text-foreground">
                    {log.heightmeterAssigned?.toFixed(2) || '-'} m
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                  <p className="text-xs text-muted-foreground">Extra W</p>
                  <p className="text-xs font-semibold text-foreground">
                    {log.extrawidthAssigned?.toFixed(2) || '-'} m
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                  <p className="text-xs text-muted-foreground">Qty</p>
                  <p className="text-xs font-semibold text-foreground">
                    {log.quantityAssigned || '-'}
                  </p>
                </div>

              </div>
            </div>

            {/* COMPLETED WORK */}
            {(log.widthmeterCompleted || log.heightmeterCompleted || log.extrawidthCompleted || log.quantityCompleted) && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Completed Work
                </Label>

                <div className="grid grid-cols-2 gap-2">

                  <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                    <p className="text-xs text-muted-foreground">Width</p>
                    <p className="text-xs font-semibold text-foreground">
                      {log.widthmeterCompleted?.toFixed(2) || '-'} m
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="text-xs font-semibold text-foreground">
                      {log.heightmeterCompleted?.toFixed(2) || '-'} m
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                    <p className="text-xs text-muted-foreground">Extra W</p>
                    <p className="text-xs font-semibold text-foreground">
                      {log.extrawidthCompleted?.toFixed(2) || '-'} m
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-1.5 text-center border border-border">
                    <p className="text-xs text-muted-foreground">Qty</p>
                    <p className="text-xs font-semibold text-foreground">
                      {log.quantityCompleted || '-'}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* PROGRESS */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-semibold text-foreground">{progress}%</span>
              </div>

              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    progress >= 100
                      ? 'bg-green-500'
                      : progress >= 50
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* NOTE */}
            {log.note && (
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                <p className="text-xs">
                  {log.note.length > 100 ? `${log.note.substring(0, 100)}...` : log.note}
                </p>
              </div>
            )}

          </div>
        );
      })}

    </div>
  </div>
);
};

const CurtainWorkerLogs: React.FC<CurtainWorkerLogsProps> = ({
  curtainMeasurementId,
  measurementRoomName,
  workerType,
  productId,
  productName,
  productVariant,
  assignedWidth,
  assignedHeight,
  assignedExtraWidth,
  shopId,
  shopName
}) => {
  const [logs, setLogs] = useState<ICurtainWorkerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [shopProductVariants, setShopProductVariants] = useState<ProductStockItem[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [preselectedVariantId, setPreselectedVariantId] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ICurtainWorkerLog | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Form states - use assignedWidth, assignedHeight, and assignedExtraWidth from measurement props
  const [formData, setFormData] = useState<Partial<ICurtainWorkerLog>>({
    curtainMeasurementId,
    workerType: workerType,
    shopProductVariantId: undefined,
    widthmeterAssigned: assignedWidth,
    heightmeterAssigned: assignedHeight,
    extrawidthAssigned: assignedExtraWidth,
    quantityAssigned: 1,
    widthmeterCompleted: undefined,
    heightmeterCompleted: undefined,
    extrawidthCompleted: undefined,
    quantityCompleted: undefined,
    note: '',
    status: CurtainWorkerLogStatus.PENDING
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState<string[]>([]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCurtainWorkerLogsByMeasurement(curtainMeasurementId);
      const filteredLogs = (result.logs || []).filter(
        (log: ICurtainWorkerLog) => log.workerType === workerType
      );
      setLogs(filteredLogs);
      setSelectedLogs(new Set());
    } catch (error) {
      console.error('Error fetching worker logs:', error);
      toast.error('Failed to fetch worker logs');
    } finally {
      setLoading(false);
    }
  }, [curtainMeasurementId, workerType]);

  // Fetch shop product variants when shopId is available
  const fetchShopProductVariants = useCallback(async () => {
    if (!shopId || !productId) {
      return;
    }

    setLoadingVariants(true);
    try {
      const response = await getAvailableProductsBySource(TransferEntityType.SHOP, shopId);
      
      if (Array.isArray(response)) {
        const filteredProducts = response.filter(
          (item: ProductStockItem) => item.productId === productId
        );
        
        // Find matching variant for auto-selection
        if (productVariant && filteredProducts.length > 0) {
          let foundVariantId: string | null = null;
          
          for (const product of filteredProducts) {
            if (product.hasVariants && product.variants) {
              const matchingVariant = product.variants.find((variant: any) => 
                isVariantMatch(variant, productVariant)
              );
              if (matchingVariant) {
                foundVariantId = matchingVariant.id;
                break;
              }
            } else if (!product.hasVariants && isVariantMatch(product, productVariant)) {
              foundVariantId = product.id;
              break;
            }
          }
          
          setPreselectedVariantId(foundVariantId);
        } else {
          setPreselectedVariantId(null);
        }
        
        setShopProductVariants(filteredProducts);
      } else {
        setShopProductVariants([]);
        setPreselectedVariantId(null);
      }
    } catch (error) {
      console.error('Error loading product variants:', error);
      setShopProductVariants([]);
      toast.error('Failed to load product variants for the shop');
    } finally {
      setLoadingVariants(false);
    }
  }, [shopId, productId, productVariant]);

  // Trigger fetch when modal opens
  useEffect(() => {
    if (isCreateModalOpen && shopId && productId) {
      fetchShopProductVariants();
      setHasAutoSelected(false);
    } else if (!isCreateModalOpen) {
      setShopProductVariants([]);
      setPreselectedVariantId(null);
      setHasAutoSelected(false);
    }
  }, [shopId, productId, isCreateModalOpen, fetchShopProductVariants]);

  // Auto-select the variant when variants are loaded (without changing width/height/extraWidth)
  useEffect(() => {
    if (isCreateModalOpen && preselectedVariantId && !formData.shopProductVariantId && !hasAutoSelected) {
      // Auto-select the recommended variant without changing width/height/extraWidth
      setFormData(prev => ({
        ...prev,
        shopProductVariantId: preselectedVariantId
        // IMPORTANT: Do NOT change widthmeterAssigned, heightmeterAssigned, or extrawidthAssigned
      }));
      setHasAutoSelected(true);
      toast.success(`Recommended variant automatically selected`);
    }
  }, [isCreateModalOpen, preselectedVariantId, formData.shopProductVariantId, hasAutoSelected]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle individual log selection
  const handleSelectLog = (logId: string, checked: boolean) => {
    const newSelected = new Set(selectedLogs);
    if (checked) {
      newSelected.add(logId);
    } else {
      newSelected.delete(logId);
    }
    setSelectedLogs(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    const pendingLogIds = logs.filter(log => log.status === 'PENDING').map(log => log.id);
    const newSelected = new Set(selectedLogs);
    
    if (checked) {
      pendingLogIds.forEach(id => newSelected.add(id));
    } else {
      pendingLogIds.forEach(id => newSelected.delete(id));
    }
    
    setSelectedLogs(newSelected);
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    const selectedIds = Array.from(selectedLogs);
    
    if (selectedIds.length === 0) {
      toast.error('No logs selected for approval');
      return;
    }

    setSubmitting(true);
    try {
      await bulkApproveCurtainWorkerLogs(selectedIds);
      toast.success(`${selectedIds.length} worker log(s) approved successfully`);
      setSelectedLogs(new Set());
      setIsBulkApproveModalOpen(false);
      await fetchLogs();
    } catch (error: any) {
      console.error('Error bulk approving worker logs:', error);
      toast.error(error.response?.data?.message || 'Failed to approve worker logs');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if there are any pending logs selected
  const hasSelectedPendingLogs = Array.from(selectedLogs).some(id => {
    const log = logs.find(l => l.id === id);
    return log?.status === 'PENDING';
  });

  // Create Modal Handlers
  const handleOpenCreateModal = () => {
    // Reset form with measurement values, NOT variant values
    setFormData({
      curtainMeasurementId,
      workerType: workerType,
      shopProductVariantId: undefined,
      widthmeterAssigned: assignedWidth,
      heightmeterAssigned: assignedHeight,
      extrawidthAssigned: assignedExtraWidth,
      quantityAssigned: 1,
      widthmeterCompleted: undefined,
      heightmeterCompleted: undefined,
      extrawidthCompleted: undefined,
      quantityCompleted: undefined,
      note: '',
      status: CurtainWorkerLogStatus.PENDING
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      curtainMeasurementId,
      workerType: workerType,
    });
  };

  // Edit Modal Handlers
  const handleOpenEditModal = (log: ICurtainWorkerLog) => {
    setSelectedLog(log);
    setFormData({
      curtainMeasurementId: log.curtainMeasurementId,
      workerType: log.workerType,
      shopProductVariantId: log.shopProductVariantId,
      widthmeterAssigned: log.widthmeterAssigned,
      heightmeterAssigned: log.heightmeterAssigned,
      extrawidthAssigned: log.extrawidthAssigned,
      quantityAssigned: log.quantityAssigned,
      widthmeterCompleted: log.widthmeterCompleted,
      heightmeterCompleted: log.heightmeterCompleted,
      extrawidthCompleted: log.extrawidthCompleted,
      quantityCompleted: log.quantityCompleted,
      note: log.note,
      status: log.status
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedLog(null);
    setFormData({
      curtainMeasurementId,
      workerType: workerType,
    });
  };

  // Delete Modal Handlers
  const handleOpenDeleteModal = (log: ICurtainWorkerLog) => {
    setSelectedLog(log);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedLog(null);
  };

  // Reject Modal Handlers
  const handleOpenRejectModal = (log: ICurtainWorkerLog) => {
    setSelectedLog(log);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
    setSelectedLog(null);
    setRejectionReason('');
  };

  // Bulk Approve Modal Handlers
  const handleOpenBulkApproveModal = () => {
    if (selectedLogs.size === 0) {
      toast.error('Please select at least one log to approve');
      return;
    }
    setIsBulkApproveModalOpen(true);
  };

  const handleCloseBulkApproveModal = () => {
    setIsBulkApproveModalOpen(false);
  };

  // Approve Handler (single)
  const handleApprove = async (log: ICurtainWorkerLog) => {
    try {
      setApproving(prev => [...prev, log.id]);
      await bulkApproveCurtainWorkerLogs([log.id]);
      toast.success('Worker log approved successfully');
      await fetchLogs();
    } catch (error: any) {
      console.error('Error approving worker log:', error);
      toast.error(error.response?.data?.message || 'Failed to approve worker log');
    } finally {
      setApproving(prev => prev.filter(id => id !== log.id));
    }
  };

  // Reject Handler
  const handleReject = async () => {
    if (!selectedLog) return;

    setSubmitting(true);
    try {
      await rejectCurtainWorkerLog(selectedLog.id, rejectionReason);
      toast.success('Worker log rejected successfully');
      await fetchLogs();
      handleCloseRejectModal();
    } catch (error: any) {
      console.error('Error rejecting worker log:', error);
      toast.error(error.response?.data?.message || 'Failed to reject worker log');
    } finally {
      setSubmitting(false);
    }
  };

  // Form Change Handler
  const handleFormChange = (field: keyof ICurtainWorkerLog, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle variant selection - ONLY set the variant ID, NOT width/height/extraWidth
  const handleVariantSelect = (selectedVariantId: string) => {
    setFormData(prev => ({
      ...prev,
      shopProductVariantId: selectedVariantId
      // Do NOT change widthmeterAssigned, heightmeterAssigned, or extrawidthAssigned - keep measurement values
    }));
  };

  // Create Submit Handler
  const handleCreate = async () => {
    if (!formData.shopProductVariantId) {
      toast.error('Please select a product variant');
      return;
    }

    if (!formData.quantityAssigned || formData.quantityAssigned <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      await createCurtainWorkerLog(formData);
      toast.success('Worker log created successfully');
      await fetchLogs();
      handleCloseCreateModal();
    } catch (error: any) {
      console.error('Error creating worker log:', error);
      toast.error(error.response?.data?.message || 'Failed to create worker log');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Submit Handler
  const handleUpdate = async () => {
    if (!selectedLog) return;

    if (!formData.shopProductVariantId) {
      toast.error('Please select a product variant');
      return;
    }

    setSubmitting(true);
    try {
      await updateCurtainWorkerLog(selectedLog.id, formData);
      toast.success('Worker log updated successfully');
      await fetchLogs();
      handleCloseEditModal();
    } catch (error: any) {
      console.error('Error updating worker log:', error);
      toast.error(error.response?.data?.message || 'Failed to update worker log');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!selectedLog) return;

    setDeleting(true);
    try {
      await deleteCurtainWorkerLog(selectedLog.id);
      toast.success('Worker log deleted successfully');
      await fetchLogs();
      handleCloseDeleteModal();
    } catch (error: any) {
      console.error('Error deleting worker log:', error);
      toast.error(error.response?.data?.message || 'Failed to delete worker log');
    } finally {
      setDeleting(false);
    }
  };

  // Prepare variant options
  const getVariantOptions = () => {
    const options: { value: string; label: string }[] = [];
    
    shopProductVariants.forEach((stockItem) => {
      if (stockItem.hasVariants && stockItem.variants) {
        stockItem.variants.forEach((variant) => {
          options.push({
            value: variant.id,
            label: formatVariantLabel(variant),
          });
        });
      } else if (!stockItem.hasVariants) {
        options.push({
          value: stockItem.id,
          label: `Standard - ${stockItem.quantity} available`,
        });
      }
    });
    
    return options;
  };

  const getWorkerTypeTitle = () => {
    return workerType === CurtainWorkerType.THICK ? 'Thick Curtain Workers' : 'Thin Curtain Workers';
  };

  const getWorkerTypeBadgeColor = () => {
    return workerType === CurtainWorkerType.THICK 
      ? "bg-amber-100 text-amber-800 hover:bg-amber-100" 
      : "bg-blue-100 text-blue-800 hover:bg-blue-100";
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='mr-2 h-6 w-6 animate-spin' />
        <p>Loading worker logs...</p>
      </div>
    );
  }

  return (
  <Card className="overflow-hidden">
    <CardHeader className="px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
       <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
  <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />

  <span className="hidden sm:inline">Worker Assignment Logs</span>
  <span className="sm:hidden">Worker Logs</span>

  {measurementRoomName && (
    <Badge
      variant="outline"
      className="
        text-xs
        border-border
        bg-transparent
        dark:border-gray-700
        dark:text-gray-200
      "
    >
      {measurementRoomName}
    </Badge>
  )}

  {shopName && (
    <Badge
      variant="outline"
      className="
        text-xs
        border-blue-200
        bg-blue-50
        text-blue-700

        dark:border-blue-900/40
        dark:bg-blue-950/20
        dark:text-blue-300
      "
    >
      <Store className="mr-1 hidden h-3 w-3 sm:inline" />
      {shopName.length > 15 ? `${shopName.substring(0, 15)}...` : shopName}
    </Badge>
  )}

  {productName && (
    <Badge
      variant="outline"
      className="
        text-xs
        border-purple-200
        bg-purple-50
        text-purple-700

        dark:border-purple-900/40
        dark:bg-purple-950/20
        dark:text-purple-300
      "
    >
      {productName.length > 20
        ? `${productName.substring(0, 20)}...`
        : productName}
    </Badge>
  )}

  {productVariant && (
    <Badge
      variant="outline"
      className="
        text-xs
        border-green-200
        bg-green-50
        text-green-700

        dark:border-green-900/40
        dark:bg-green-950/20
        dark:text-green-300
      "
    >
      {productVariant.length > 15
        ? `${productVariant.substring(0, 15)}...`
        : productVariant}
    </Badge>
  )}
</CardTitle>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {selectedLogs.size > 0 && (
            <Button
              onClick={handleOpenBulkApproveModal}
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              disabled={!hasSelectedPendingLogs}
            >
              <CheckSquare className='mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              <span className="text-xs sm:text-sm">Approve ({selectedLogs.size})</span>
            </Button>
          )}
          <Button onClick={handleOpenCreateModal} size="sm" className="w-full sm:w-auto">
            <PlusCircle className='mr-2 h-3 w-3 sm:h-4 sm:w-4' />
            <span className="text-xs sm:text-sm">Add Worker Log</span>
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent className="p-0 sm:p-6 overflow-x-auto">
      <div className="min-w-[320px] sm:min-w-0">
        <WorkerLogsTable
          logs={logs}
          title={getWorkerTypeTitle()}
          badgeColor={getWorkerTypeBadgeColor()}
          selectedLogs={selectedLogs}
          onSelectLog={handleSelectLog}
          onSelectAll={handleSelectAll}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onApprove={handleApprove}
          onReject={handleOpenRejectModal}
        />
      </div>
    </CardContent>

    {/* Create Modal */}
    <Modal
      isOpen={isCreateModalOpen}
      onClose={handleCloseCreateModal}
      title="Add Worker Log"
      description="Assign a worker to this measurement"
      size="lg"
    >
      <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 px-2 sm:px-0">
        {shopName && productName && (
          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Shop</Label>
                <p className="font-medium text-sm flex items-center gap-1 wrap-break-word">
                  <Store className='h-3 w-3 sm:h-4 sm:w-4 shrink-0' />
                  <span className="wrap-break-word">{shopName}</span>
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Product</Label>
                <p className="font-medium text-sm wrap-break-word">{productName}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Product Variant *</Label>
          {loadingVariants ? (
            <div className="flex items-center justify-center py-4 border rounded-md">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
              <span className="text-sm">Loading variants...</span>
            </div>
          ) : (
            <Select
              value={formData.shopProductVariantId ?? undefined}
              onValueChange={handleVariantSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                {getVariantOptions().map((variant) => (
                  <SelectItem key={variant.value} value={variant.value}>
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!shopId && (
            <p className="text-xs sm:text-sm text-amber-600 mt-1">
              No shop associated with this order. Please add a shop first.
            </p>
          )}
          {shopId && !productId && (
            <p className="text-xs sm:text-sm text-amber-600 mt-1">
              No product assigned for this worker type. Please assign a product first.
            </p>
          )}
          {productVariant && shopProductVariants.length > 0 && !preselectedVariantId && (
            <p className="text-xs sm:text-sm text-amber-600 mt-1">
              Recommended variant not available in stock.
            </p>
          )}
          {preselectedVariantId && formData.shopProductVariantId === preselectedVariantId && (
            <p className="text-xs sm:text-sm text-green-600 mt-1">
              ✓ Recommended variant automatically selected
            </p>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm font-semibold">Assigned Work</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="widthmeterAssigned" className="text-xs sm:text-sm">
                Width (m)
              </Label>
              <Input
                id="widthmeterAssigned"
                type="number"
                value={formData.widthmeterAssigned || ''}
                onChange={(e) => handleFormChange('widthmeterAssigned', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightmeterAssigned" className="text-xs sm:text-sm">
                Height (m)
              </Label>
              <Input
                id="heightmeterAssigned"
                type="number"
                value={formData.heightmeterAssigned || ''}
                onChange={(e) => handleFormChange('heightmeterAssigned', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extrawidthAssigned" className="text-xs sm:text-sm">
                Extra Width (m)
              </Label>
              <Input
                id="extrawidthAssigned"
                type="number"
                value={formData.extrawidthAssigned || ''}
                onChange={(e) => handleFormChange('extrawidthAssigned', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityAssigned" className="text-xs sm:text-sm">
                Quantity *
              </Label>
              <Input
                id="quantityAssigned"
                type="number"
                value={formData.quantityAssigned || ''}
                onChange={(e) => handleFormChange('quantityAssigned', parseInt(e.target.value) || undefined)}
                placeholder="0"
                min="1"
                step="1"
                className="text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Width, height, and extra width are from the curtain measurement.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm font-semibold">Completed Work</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="widthmeterCompleted" className="text-xs sm:text-sm">
                Width (m)
              </Label>
              <Input
                id="widthmeterCompleted"
                type="number"
                value={formData.widthmeterCompleted || ''}
                onChange={(e) => handleFormChange('widthmeterCompleted', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightmeterCompleted" className="text-xs sm:text-sm">
                Height (m)
              </Label>
              <Input
                id="heightmeterCompleted"
                type="number"
                value={formData.heightmeterCompleted || ''}
                onChange={(e) => handleFormChange('heightmeterCompleted', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extrawidthCompleted" className="text-xs sm:text-sm">
                Extra Width (m)
              </Label>
              <Input
                id="extrawidthCompleted"
                type="number"
                value={formData.extrawidthCompleted || ''}
                onChange={(e) => handleFormChange('extrawidthCompleted', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityCompleted" className="text-xs sm:text-sm">
                Quantity
              </Label>
              <Input
                id="quantityCompleted"
                type="number"
                value={formData.quantityCompleted || ''}
                onChange={(e) => handleFormChange('quantityCompleted', parseInt(e.target.value) || undefined)}
                placeholder="0"
                min="0"
                step="1"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note" className="text-sm font-medium">Note</Label>
          <Textarea
            id="note"
            value={formData.note || ''}
            onChange={(e) => handleFormChange('note', e.target.value)}
            placeholder="Add any notes about this assignment"
            rows={3}
            className="text-sm"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 sm:pt-6">
          <Button variant="outline" onClick={handleCloseCreateModal} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Log'
            )}
          </Button>
        </div>
      </div>
    </Modal>

    {/* Edit Modal */}
    <Modal
      isOpen={isEditModalOpen}
      onClose={handleCloseEditModal}
      title="Edit Worker Log"
      description="Update worker assignment details"
      size="lg"
    >
      <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 px-2 sm:px-0">
        {shopName && productName && (
          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Shop</Label>
                <p className="font-medium text-sm flex items-center gap-1 wrap-break-word">
                  <Store className='h-3 w-3 sm:h-4 sm:w-4 shrink-0' />
                  <span className="wrap-break-word">{shopName}</span>
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Product</Label>
                <p className="font-medium text-sm wrap-break-word">{productName}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Product Variant *</Label>
          {loadingVariants ? (
            <div className="flex items-center justify-center py-4 border rounded-md">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
              <span className="text-sm">Loading variants...</span>
            </div>
          ) : (
            <Select
              value={formData.shopProductVariantId ?? undefined}
              onValueChange={handleVariantSelect}
              disabled={!shopId || !productId || loadingVariants}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                {getVariantOptions().map((variant) => (
                  <SelectItem key={variant.value} value={variant.value}>
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm font-semibold">Assigned Work</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-widthmeterAssigned" className="text-xs sm:text-sm">
                Width (m)
              </Label>
              <Input
                id="edit-widthmeterAssigned"
                type="number"
                value={formData.widthmeterAssigned || ''}
                onChange={(e) => handleFormChange('widthmeterAssigned', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-heightmeterAssigned" className="text-xs sm:text-sm">
                Height (m)
              </Label>
              <Input
                id="edit-heightmeterAssigned"
                type="number"
                value={formData.heightmeterAssigned || ''}
                onChange={(e) => handleFormChange('heightmeterAssigned', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-extrawidthAssigned" className="text-xs sm:text-sm">
                Extra Width (m)
              </Label>
              <Input
                id="edit-extrawidthAssigned"
                type="number"
                value={formData.extrawidthAssigned || ''}
                onChange={(e) => handleFormChange('extrawidthAssigned', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantityAssigned" className="text-xs sm:text-sm">
                Quantity *
              </Label>
              <Input
                id="edit-quantityAssigned"
                type="number"
                value={formData.quantityAssigned || ''}
                onChange={(e) => handleFormChange('quantityAssigned', parseInt(e.target.value) || undefined)}
                placeholder="0"
                min="1"
                step="1"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm font-semibold">Completed Work</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-widthmeterCompleted" className="text-xs sm:text-sm">
                Width (m)
              </Label>
              <Input
                id="edit-widthmeterCompleted"
                type="number"
                value={formData.widthmeterCompleted || ''}
                onChange={(e) => handleFormChange('widthmeterCompleted', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-heightmeterCompleted" className="text-xs sm:text-sm">
                Height (m)
              </Label>
              <Input
                id="edit-heightmeterCompleted"
                type="number"
                value={formData.heightmeterCompleted || ''}
                onChange={(e) => handleFormChange('heightmeterCompleted', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-extrawidthCompleted" className="text-xs sm:text-sm">
                Extra Width (m)
              </Label>
              <Input
                id="edit-extrawidthCompleted"
                type="number"
                value={formData.extrawidthCompleted || ''}
                onChange={(e) => handleFormChange('extrawidthCompleted', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantityCompleted" className="text-xs sm:text-sm">
                Quantity
              </Label>
              <Input
                id="edit-quantityCompleted"
                type="number"
                value={formData.quantityCompleted || ''}
                onChange={(e) => handleFormChange('quantityCompleted', parseInt(e.target.value) || undefined)}
                placeholder="0"
                min="0"
                step="1"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-note" className="text-sm font-medium">Note</Label>
          <Textarea
            id="edit-note"
            value={formData.note || ''}
            onChange={(e) => handleFormChange('note', e.target.value)}
            placeholder="Add any notes about this assignment"
            rows={3}
            className="text-sm"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 sm:pt-6">
          <Button variant="outline" onClick={handleCloseEditModal} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Log'
            )}
          </Button>
        </div>
      </div>
    </Modal>

    {/* Delete Confirmation Modal */}
    <AlertModal
      isOpen={isDeleteModalOpen}
      onClose={handleCloseDeleteModal}
      onConfirm={handleDelete}
      loading={deleting}
      title="Delete Worker Log"
      description={`Are you sure you want to delete this worker log${selectedLog?.worker ? ` for ${selectedLog.worker.name}` : ''}? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
    />

    {/* Reject Modal */}
    <Modal
      isOpen={isRejectModalOpen}
      onClose={handleCloseRejectModal}
      title="Reject Worker Log"
      description="Please provide a reason for rejection"
      size="md"
    >
      <div className="space-y-4 py-4 px-2 sm:px-0">
        <div className="space-y-2">
          <Label htmlFor="rejectionReason" className="text-sm font-medium">Rejection Reason</Label>
          <Textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            rows={4}
            className="text-sm"
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCloseRejectModal} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            disabled={submitting || !rejectionReason.trim()}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Log'
            )}
          </Button>
        </div>
      </div>
    </Modal>

    {/* Bulk Approve Confirmation Modal */}
    <AlertModal
      isOpen={isBulkApproveModalOpen}
      onClose={handleCloseBulkApproveModal}
      onConfirm={handleBulkApprove}
      loading={submitting}
      title="Approve Selected Logs"
      description={`Are you sure you want to approve ${selectedLogs.size} selected worker log(s)? This action cannot be undone.`}
      confirmText="Approve"
      cancelText="Cancel"
      variant="default"
    />
  </Card>
);
};

export default CurtainWorkerLogs;