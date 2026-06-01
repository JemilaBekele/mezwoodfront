/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Package,
  Info,
  FileText,
  Box,
  Layers,
  MapPin,
  Hash,
  DollarSign,
  AlertTriangle,
  Store,
  ShoppingBag,
  Calendar,
  User,
  Tag,
  Filter,
  Download,
  Ruler,
  Grid
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductdetailaById } from '@/service/Product';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { exportToExcel, StockLedgerExportData } from '@/lib/exportExcel';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Variant {
  id: string;
  height: number;
  width: number;
  quantity: number;
  dimensions: string;
}

interface StockWithVariants {
  id: string;
  shopId?: string;
  shopName?: string;
  storeId?: string;
  storeName?: string;
  branchId: string | undefined;
  branchName: string | undefined;
  quantity: number;
  totalQuantity: number;
  status: string;
  unitOfMeasure: {
    id: string;
    name: string;
    symbol: string;
  } | null;
  variants: Variant[];
  variantsByDimensions?: Record<string, Variant>;
}

interface ProductDetails {
  product: {
    id: string;
    productCode: string;
    name: string;
    generic: string | null;
    description: string | null;
    sellPrice: number;
    warningQuantity: number | null;
    imageUrl: string | null;
    category: {
      id: string;
      name: string;
    } | null;
    colour: {
      id: string;
      name: string;
    } | null;
    unitOfMeasure: {
      id: string;
      name: string;
      symbol: string;
    } | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  stocks: {
    shopStocks: StockWithVariants[];
    storeStocks: StockWithVariants[];
  };
  additionalPrices: Array<{
    id: string;
    label: string;
    price: number;
    shopId: string | null;
    shopName: string | undefined;
    branchId: string | undefined;
    branchName: string | undefined;
  }>;
  stockLedgers: Array<{
    id: string;
    invoiceNo: string | null;
    movementType: string;
    quantity: number;
    height?: number | null;
    width?: number | null;
    dimensions?: string | null;
    unitOfMeasure: {
      id: string;
      name: string;
      symbol: string;
    } | null;
    reference: string | null;
    userId: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    } | null;
    store: {
      id: string;
      name: string;
      branch: {
        id: string;
        name: string;
      };
    } | null;
    shop: {
      id: string;
      name: string;
      branch: {
        id: string;
        name: string;
      };
    } | null;
    notes: string | null;
    movementDate: string;
    createdAt: string;
    updatedAt: string;
  }>;
  locationStocks: Array<{
    storeId?: string;
    shopId?: string;
    storeName?: string;
    shopName?: string;
    branchId: string | undefined;
    branchName: string | undefined;
    quantity: number;
    variants?: Variant[];
    type: 'store' | 'shop';
    additionalPrice?: {
      id: string;
      label: string | null;
      price: number;
      shopId: string | null;
      shopName: string | undefined;
      branchId: string | undefined;
      branchName: string | undefined;
    } | null;
  }>;
  dimensions?: {
    uniqueDimensions: string[];
    totalDimensionCount: number;
  };
  summary: {
    totalStoreQuantity: number;
    totalShopQuantity: number;
    overallTotalQuantity: number;
    storeCount: number;
    shopCount: number;
    ledgerCount: number;
    additionalPriceCount: number;
    variantCount?: number;
  };
}

type ProductDetailsProps = {
  productId?: string;
};

const ProductDetailsPage: React.FC<ProductDetailsProps> = ({ productId }) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL, BEFORE ANY CONDITIONAL RETURNS
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [openVariants, setOpenVariants] = useState<Record<string, boolean>>({});

  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP pp');
    } catch {
      return dateString;
    }
  };

  // Helper function to format currency
  const formatCurrency = (value: any) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return '0.00';
    }
    return numValue.toFixed(2);
  };

  // Check if product has dimensions/variants
  const hasDimensions = useMemo(() => {
    return (
      productDetails?.dimensions?.uniqueDimensions &&
      productDetails.dimensions.uniqueDimensions.length > 0
    );
  }, [productDetails]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        if (productId) {
          setLoading(true);
          const details = await getProductdetailaById(productId);

          if (details && details.product && details.summary) {
            setProductDetails(details);
          } else {
            toast.error('Received incomplete product data');
          }
        }
      } catch {
        toast.error('Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Get unique branches from stock ledgers
  const branches = useMemo(() => {
    const stockLedgers = productDetails?.stockLedgers;
    if (!stockLedgers) return [];

    const branchSet = new Set<string>();
    const branchMap = new Map<string, string>();

    stockLedgers.forEach((ledger) => {
      if (ledger.store?.branch?.id) {
        branchSet.add(ledger.store.branch.id);
        branchMap.set(ledger.store.branch.id, ledger.store.branch.name);
      }
      if (ledger.shop?.branch?.id) {
        branchSet.add(ledger.shop.branch.id);
        branchMap.set(ledger.shop.branch.id, ledger.shop.branch.name);
      }
    });

    return Array.from(branchSet).map((branchId) => ({
      id: branchId,
      name: branchMap.get(branchId) || 'Unknown Branch'
    }));
  }, [productDetails]);

  // Get unique dimensions
  const dimensions = useMemo(() => {
    return productDetails?.dimensions?.uniqueDimensions || [];
  }, [productDetails]);

  // Filter stock ledgers by branch and dimension
  const filteredStockLedgers = useMemo(() => {
    const stockLedgers = productDetails?.stockLedgers;
    if (!stockLedgers) return [];

    let filtered = [...stockLedgers];

    // Filter by branch
    if (selectedBranch !== 'all') {
      filtered = filtered.filter((ledger) => {
        return (
          ledger.store?.branch?.id === selectedBranch ||
          ledger.shop?.branch?.id === selectedBranch
        );
      });
    }

    // Filter by dimension (if product has dimensions)
    if (hasDimensions && selectedDimension !== 'all') {
      filtered = filtered.filter((ledger) => {
        if (!ledger.height || !ledger.width) return false;
        const dimKey = `${ledger.height}x${ledger.width}`;
        return dimKey === selectedDimension;
      });
    }

    return filtered;
  }, [productDetails, selectedBranch, selectedDimension, hasDimensions]);

  // Determine if final balance should be shown
  const shouldShowFinalBalance = useMemo(() => {
    // For products without dimensions, always show final balance
    if (!hasDimensions) return true;
    
    // For products with dimensions, only show when a specific dimension is selected
    return selectedDimension !== 'all';
  }, [hasDimensions, selectedDimension]);

  // Toggle variant visibility
  const toggleVariant = (locationKey: string) => {
    setOpenVariants(prev => ({
      ...prev,
      [locationKey]: !prev[locationKey]
    }));
  };

  const handleExportExcel = () => {
    try {
      if (!productDetails || filteredStockLedgers.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Sort ledgers for export
      const sortedLedgers = [...filteredStockLedgers].sort(
        (a, b) =>
          new Date(a.movementDate).getTime() -
          new Date(b.movementDate).getTime()
      );

      let runningBalance = 0;
      const unitSymbol = productDetails.product.unitOfMeasure?.symbol || 'unit';

      // Prepare data for export
      const exportData: StockLedgerExportData[] = sortedLedgers.map(
        (ledger) => {
          if (ledger.movementType.includes('IN')) {
            runningBalance += Math.abs(ledger.quantity);
          } else if (ledger.movementType.includes('OUT')) {
            runningBalance -= Math.abs(ledger.quantity);
          }

          const dimensionInfo = ledger.height && ledger.width 
            ? ` (${ledger.height}x${ledger.width})` 
            : '';

          return {
            Date: formatDateTime(ledger.movementDate),
            Type: ledger.movementType + dimensionInfo,
            Batch: 'N/A',
            Location: ledger.store
              ? `Store: ${ledger.store.name}`
              : ledger.shop
                ? `Shop: ${ledger.shop.name}`
                : 'N/A',
            Branch:
              ledger.store?.branch?.name || ledger.shop?.branch?.name || 'N/A',
            In: ledger.movementType.includes('IN')
              ? `${ledger.quantity} ${ledger.unitOfMeasure?.symbol || unitSymbol}`
              : '-',
            Out: ledger.movementType.includes('OUT')
              ? `${Math.abs(ledger.quantity)} ${ledger.unitOfMeasure?.symbol || unitSymbol}`
              : '-',
            Balance: `${runningBalance} ${ledger.unitOfMeasure?.symbol || unitSymbol}`,
            'Reference/Invoice': ledger.invoiceNo || ledger.reference || 'N/A',
            User: ledger.user?.name || 'System',
            Notes: ledger.notes || 'N/A'
          };
        }
      );

      // Calculate final balance
      const finalBalance = filteredStockLedgers.reduce((balance, ledger) => {
        if (ledger.movementType.includes('IN')) {
          return balance + Math.abs(ledger.quantity);
        } else if (ledger.movementType.includes('OUT')) {
          return balance - Math.abs(ledger.quantity);
        }
        return balance;
      }, 0);

      const finalBalanceText = `${finalBalance} ${unitSymbol}`;
      const filename = `${productDetails.product.productCode}_${productDetails.product.name}_Stock_Ledger_${format(new Date(), 'yyyy-MM-dd_HH-mm')}`;

      // Export to Excel
      exportToExcel(exportData, filename, finalBalanceText);

      toast.success('Excel file downloaded successfully');
    } catch {
      toast.error('Failed to export Excel file');
    }
  };

  // Early returns AFTER all hooks - this is correct
  if (loading) {
    return (
      <div className='container mx-auto space-y-6 p-4 md:p-8'>
        <Skeleton className='h-12 w-1/3' />
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <Skeleton className='h-64' />
          <Skeleton className='h-64' />
        </div>
        <Skeleton className='h-64' />
        <Skeleton className='h-64' />
        <Skeleton className='h-64' />
      </div>
    );
  }

  if (!productDetails || !productDetails.product) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Product not found</p>
      </div>
    );
  }

  const { product, additionalPrices, locationStocks, summary } = productDetails;
  const unitSymbol = product.unitOfMeasure?.symbol || 'unit';

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header with actions */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='flex items-center gap-2 text-3xl font-bold'>
            <Package className='text-primary' />
            {product.name}
          </h1>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Badge variant='outline' className='flex items-center gap-1'>
              <Hash className='h-3 w-3' />
              {product.productCode}
            </Badge>
            {product.category && (
              <Badge variant='secondary'>{product.category.name}</Badge>
            )}
            {product.colour && (
              <Badge variant='outline'>{product.colour.name}</Badge>
            )}
            {!product.isActive && <Badge variant='destructive'>Inactive</Badge>}
            {summary.overallTotalQuantity === 0 && (
              <Badge variant='destructive' className='flex items-center gap-1'>
                <AlertTriangle className='h-3 w-3' />
                Out of Stock
              </Badge>
            )}
          {hasDimensions && (
  <Badge
    variant='outline'
    className='
      flex items-center gap-1
      border-blue-200
      bg-blue-50
      text-blue-700

      dark:border-blue-900/40
      dark:bg-blue-950/20
      dark:text-blue-300
    '
  >
    <Ruler className='h-3 w-3' />
    {summary.variantCount || 0} Dimensions
  </Badge>
)}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Quantity
            </CardTitle>
            <Box className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summary.overallTotalQuantity} {unitSymbol}
            </div>
            <p className='text-muted-foreground text-xs'>
              {summary.totalStoreQuantity} in stores +{' '}
              {summary.totalShopQuantity} in shops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Stores</CardTitle>
            <Store className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.storeCount}</div>
            <p className='text-muted-foreground text-xs'>Active stores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Shops</CardTitle>
            <ShoppingBag className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.shopCount}</div>
            <p className='text-muted-foreground text-xs'>Active shops</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Branches</CardTitle>
            <MapPin className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(() => {
                if (!locationStocks || locationStocks.length === 0) return 0;

                const uniqueBranches = new Set(
                  locationStocks
                    .map((loc) => loc.branchId)
                    .filter((id): id is string => !!id)
                );
                return uniqueBranches.size;
              })()}
            </div>

            <div className='text-muted-foreground mt-2 text-xs'>
              {(() => {
                if (!locationStocks || locationStocks.length === 0) return null;

                const branchMap = new Map<string, string>();
                locationStocks.forEach((loc) => {
                  if (loc.branchId && loc.branchName) {
                    branchMap.set(loc.branchId, loc.branchName);
                  }
                });

                if (branchMap.size === 0) return null;

                const branches = Array.from(branchMap.values()).sort();

                if (branches.length <= 3) {
                  return <span>Branches: {branches.join(', ')}</span>;
                } else {
                  return <span>{branches.length} active branches</span>;
                }
              })()}
            </div>
          </CardContent>
        </Card>

        {hasDimensions && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Unique Dimensions
              </CardTitle>
              <Grid className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dimensions.length}
              </div>
              <p className='text-muted-foreground text-xs'>
                Size variants available
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Info className='text-primary h-5 w-5' />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='font-medium'>Product Name</p>
                <p className='text-muted-foreground'>{product.name}</p>
              </div>
              <div>
                <p className='font-medium'>Product Code</p>
                <p className='text-muted-foreground'>{product.productCode}</p>
              </div>
              <div>
                <p className='font-medium'>Generic Name</p>
                <p className='text-muted-foreground'>
                  {product.generic || 'N/A'}
                </p>
              </div>
              <div>
                <p className='font-medium'>Status</p>
                <Badge variant={product.isActive ? 'default' : 'destructive'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className='font-medium'>Category</p>
                <p className='text-muted-foreground'>
                  {product.category?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='font-medium'>Colour</p>
                <p className='text-muted-foreground'>
                  {product.colour?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='font-medium'>Sell Price</p>
                <p className='text-muted-foreground flex items-center gap-1'>
                  <DollarSign className='h-4 w-4' />
                  {formatCurrency(product.sellPrice)}
                </p>
              </div>
              <div>
                <p className='font-medium'>Warning Quantity</p>
                <p className='text-muted-foreground'>
                  {product.warningQuantity || 'N/A'}
                </p>
              </div>
              <div>
                <p className='font-medium'>Unit of Measure</p>
                <p className='text-muted-foreground'>
                  {product.unitOfMeasure?.name} (
                  {product.unitOfMeasure?.symbol || 'N/A'})
                </p>
              </div>
              {product.description && (
                <div className='col-span-2'>
                  <p className='font-medium'>Description</p>
                  <p className='text-muted-foreground'>{product.description}</p>
                </div>
              )}
            </div>

            {/* Additional Prices Section */}
            {additionalPrices && additionalPrices.length > 0 && (
              <div className='border-t pt-4'>
                <p className='mb-3 flex items-center gap-2 font-medium'>
                  <Tag className='h-4 w-4' />
                  Additional Prices
                </p>
                <div className='space-y-2'>
                  {additionalPrices.map((price) => (
                    <div
                      key={price.id}
                      className='bg-muted/50 flex items-center justify-between rounded-lg border p-3'
                    >
                      <div>
                        <p className='font-medium'>{price.label}</p>
                        <p className='text-muted-foreground text-sm'>
                          {price.shopName || 'All Shops'} •{' '}
                          {price.branchName || 'All Branches'}
                        </p>
                      </div>
                      <p className='text-lg font-bold'>
                        {formatCurrency(price.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className='border-t pt-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='font-medium'>Created At</p>
                  <p className='text-muted-foreground'>
                    {formatDateTime(product.createdAt)}
                  </p>
                </div>
                <div>
                  <p className='font-medium'>Updated At</p>
                  <p className='text-muted-foreground'>
                    {formatDateTime(product.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Stock Summary with Variants */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='text-primary h-5 w-5' />
              Location Stock Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationStocks && locationStocks.length > 0 ? (
              <div className='space-y-4'>
                {locationStocks.map((location, index) => {
                  const locationKey = `${location.type}-${location.storeId || location.shopId}-${index}`;
                  const hasVariants = location.variants && location.variants.length > 0;
                  
                  return (
                    <div key={index} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          {location.type === 'store' ? (
                            <Store className='h-4 w-4 text-blue-500' />
                          ) : (
                            <ShoppingBag className='h-4 w-4 text-green-500' />
                          )}
                          <div>
                            <p className='font-medium'>
                              {location.type === 'store' 
                                ? location.storeName 
                                : location.shopName}
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              {location.branchName || 'No Branch'} • 
                              <Badge variant="outline" className='ml-1'>
                                {location.type}
                              </Badge>
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-lg font-bold'>
                            {location.quantity} {unitSymbol}
                          </p>
                          {hasVariants && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVariant(locationKey)}
                              className='h-6 px-2 text-xs'
                            >
                              {openVariants[locationKey] ? (
                                <>Hide Variants <ChevronUp className='ml-1 h-3 w-3' /></>
                              ) : (
                                <>Show Variants <ChevronDown className='ml-1 h-3 w-3' /></>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Additional Price Info */}
                      {location.additionalPrice && (
                        <div className='mt-2 flex justify-between border-t pt-2 text-sm'>
                          <span className='text-muted-foreground'>
                            Additional Price:
                          </span>
                          <span className='font-medium text-green-600'>
                            ${formatCurrency(location.additionalPrice.price)}
                            {location.additionalPrice.label && (
                              <span className='text-muted-foreground ml-1 text-xs'>
                                ({location.additionalPrice.label})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Variants Section */}
                      {hasVariants && openVariants[locationKey] && (
                        <div className='mt-3 border-t pt-3'>
                          <p className='mb-2 text-sm font-medium'>Dimension Variants:</p>
                          <div className='bg-muted/50 rounded-md p-2'>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Dimensions</TableHead>
                                  <TableHead className='text-right'>Quantity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {location.variants?.map((variant, vIdx) => (
                                  <TableRow key={vIdx}>
                                    <TableCell>
 <Badge
    variant='outline'
    className='
      flex items-center gap-1
      border-blue-200
      bg-blue-50
      text-blue-700

      dark:border-blue-900/40
      dark:bg-blue-950/20
      dark:text-blue-300
    '
  >                                        {variant.height} x {variant.width}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className='text-right font-medium'>
                                      {variant.quantity} {unitSymbol}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Total Row */}
                <div className='bg-primary/5 mt-4 rounded-lg p-4 font-medium'>
                  <div className='flex justify-between'>
                    <span>Total Quantity</span>
                    <span className='text-lg font-bold'>
                      {summary.overallTotalQuantity} {unitSymbol}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className='text-muted-foreground'>No stock in locations</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Ledger with Branch and Dimension Filters */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='text-primary h-5 w-5' />
                Stock Ledger ({filteredStockLedgers.length})
              </CardTitle>
              <Button
                variant='outline'
                size='sm'
                onClick={handleExportExcel}
                disabled={filteredStockLedgers.length === 0}
                className='gap-2'
              >
                <Download className='h-4 w-4' />
                Export Excel
              </Button>
            </div>
            
            <div className='flex flex-wrap items-center gap-2'>
              <div className='flex items-center gap-2'>
                <Filter className='text-muted-foreground h-4 w-4' />
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Filter by branch' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasDimensions && dimensions.length > 0 && (
                <div className='flex items-center gap-2'>
                  <Ruler className='text-muted-foreground h-4 w-4' />
                  <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Filter by dimension' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Dimensions</SelectItem>
                      {dimensions.map((dim) => (
                        <SelectItem key={dim} value={dim}>
                          {dim}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStockLedgers.length > 0 ? (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    {hasDimensions && <TableHead>Dimensions</TableHead>}
                    <TableHead>Location</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>In</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Reference/Invoice</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const sortedLedgers = [...filteredStockLedgers].sort(
                      (a, b) =>
                        new Date(a.movementDate).getTime() -
                        new Date(b.movementDate).getTime()
                    );

                    let runningBalance = 0;

                    return sortedLedgers.map((ledger) => {
                      if (ledger.movementType.includes('IN')) {
                        runningBalance += Math.abs(ledger.quantity);
                      } else if (ledger.movementType.includes('OUT')) {
                        runningBalance -= Math.abs(ledger.quantity);
                      }

                      const isSellInvoice = ledger.invoiceNo?.startsWith('Sell-');
                      const isSellReference = ledger.reference?.startsWith('Sell-');
                      const hasDimension = ledger.height && ledger.width;

                      return (
                        <TableRow key={ledger.id}>
                          <TableCell className='whitespace-nowrap'>
                            {formatDateTime(ledger.movementDate)}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                ledger.movementType.includes('IN')
                                  ? 'default'
                                  : ledger.movementType.includes('OUT')
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {ledger.movementType}
                            </Badge>
                          </TableCell>

                          {hasDimensions && (
                            <TableCell>
                              {hasDimension ? (
  <Badge
    variant='outline'
    className='
      flex items-center gap-1
      border-blue-200
      bg-blue-50
      text-blue-700

      dark:border-blue-900/40
      dark:bg-blue-950/20
      dark:text-blue-300
    '
  >                                  {ledger.height} x {ledger.width}
                                </Badge>
                              ) : (
                                <span className='text-muted-foreground text-xs'>-</span>
                              )}
                            </TableCell>
                          )}

                          <TableCell>
                            {ledger.store ? (
                              <div className='flex items-center gap-1'>
                                <Store className='h-3 w-3' />
                                <span className='whitespace-nowrap'>{ledger.store.name}</span>
                              </div>
                            ) : ledger.shop ? (
                              <div className='flex items-center gap-1'>
                                <ShoppingBag className='h-3 w-3' />
                                <span className='whitespace-nowrap'>{ledger.shop.name}</span>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>

                          <TableCell className='whitespace-nowrap'>
                            {ledger.store?.branch?.name ||
                              ledger.shop?.branch?.name ||
                              'N/A'}
                          </TableCell>

                          <TableCell className='font-medium text-green-600 whitespace-nowrap'>
                            {ledger.movementType.includes('IN')
                              ? `${ledger.quantity} ${
                                  ledger.unitOfMeasure?.symbol || unitSymbol
                                }`
                              : '-'}
                          </TableCell>

                          <TableCell className='font-medium text-red-600 whitespace-nowrap'>
                            {ledger.movementType.includes('OUT')
                              ? `${Math.abs(ledger.quantity)} ${
                                  ledger.unitOfMeasure?.symbol || unitSymbol
                                }`
                              : '-'}
                          </TableCell>

                          <TableCell className='font-bold whitespace-nowrap'>
                            {runningBalance}{' '}
                            {ledger.unitOfMeasure?.symbol || unitSymbol}
                          </TableCell>

                          <TableCell>
                            {ledger.invoiceNo ? (
                              isSellInvoice ? (
                                <a
                                  href={`/dashboard/Products/view/sell?id=${ledger.invoiceNo.replace(/^Sell-/, '')}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-primary hover:text-primary/80 underline transition-colors'
                                  title='View invoice details'
                                >
                                  {ledger.invoiceNo}
                                </a>
                              ) : (
                                <span className='whitespace-nowrap'>{ledger.invoiceNo}</span>
                              )
                            ) : ledger.reference ? (
                              isSellReference ? (
                                <a
                                  href={`/dashboard/Products/view/sell?id=${ledger.reference.replace(/^Sell-/, '')}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-primary hover:text-primary/80 underline transition-colors'
                                  title='View invoice details'
                                >
                                  {ledger.reference}
                                </a>
                              ) : (
                                <span className='whitespace-nowrap'>{ledger.reference}</span>
                              )
                            ) : (
                              'N/A'
                            )}
                          </TableCell>

                          <TableCell>
                            {ledger.user ? (
                              <div className='flex items-center gap-1'>
                                <User className='h-3 w-3' />
                                <span className='whitespace-nowrap'>{ledger.user.name}</span>
                              </div>
                            ) : (
                              'System'
                            )}
                          </TableCell>

                          <TableCell
                            className='max-w-50 truncate'
                            title={ledger.notes || ''}
                          >
                            {ledger.notes || 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>

                {/* Conditional Final Balance Display */}
                {shouldShowFinalBalance && (
                  <tfoot>
                    <TableRow className='bg-muted/50'>
                      <TableCell colSpan={hasDimensions ? 5 : 4} className='text-right font-bold'>
                        Final Balance:
                      </TableCell>
                      <TableCell className='text-lg font-bold' colSpan={2}>
                        {(() => {
                          const finalBalance = filteredStockLedgers.reduce(
                            (balance, ledger) => {
                              if (ledger.movementType.includes('IN')) {
                                return balance + Math.abs(ledger.quantity);
                              } else if (ledger.movementType.includes('OUT')) {
                                return balance - Math.abs(ledger.quantity);
                              }
                              return balance;
                            },
                            0
                          );
                          return `${finalBalance} ${unitSymbol}`;
                        })()}
                      </TableCell>
                      <TableCell colSpan={hasDimensions ? 4 : 3}></TableCell>
                    </TableRow>
                  </tfoot>
                )}
              </Table>
            </div>
          ) : (
            <p className='text-muted-foreground'>
              {selectedBranch === 'all' && selectedDimension === 'all'
                ? 'No stock movements recorded'
                : 'No stock movements found for selected filters'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetailsPage;