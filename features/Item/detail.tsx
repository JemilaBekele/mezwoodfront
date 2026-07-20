'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Package,
  Calendar,
  Loader2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle,
  FileText,
  Filter,
  X,
  Store,
  Building2,
  TrendingUp,
  Boxes,
  Palette,
  Ruler,
  Image as ImageIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getItemDetailById } from '@/service/item';
import Link from 'next/link';
import Image from 'next/image';

type ProductViewProps = {
  id?: string;
};

interface ProductDetail {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
  type?: { id: string; name: string };
  size?: { id: string; name: string };
  stockSummary: {
    totalStock: number;
    availableStock: number;
    byStore: Record<string, number>;
    byShowroom: Record<string, number>;
  };
  movementSummary: {
    totalIn: number;
    totalOut: number;
    netChange: number;
    byType: Record<string, number>;
    byLocation: Record<string, number>;
  };
  proformaSummary: {
    totalInvoices: number;
    totalQuantity: number;
    totalValue: number;
    byStatus: Record<string, number>;
  };
  recentInventory: ExtendedInventoryStock[];
  recentMovements: ExtendedMovement[];
  recentProformaInvoices: ProformaInvoiceItem[];
  materialsUsed: MaterialUsed[];
}

interface ExtendedMovement {
  id: string;
  movementType: string;
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  user?: { id: string; name: string };
  store?: { id: string; name: string; isMain: boolean };
  showroom?: { id: string; name: string; isMain: boolean };
}

interface ExtendedInventoryStock {
  id: string;
  quantity: number;
  locationName?: string;
  locationType?: string;
  store?: { id: string; name: string; isMain: boolean };
  showroom?: { id: string; name: string; isMain: boolean };
}

interface ProformaInvoiceItem {
  id: string;
  description: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  additionalDescription?: string;
  invoice?: {
    id: string;
    piNumber: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    total: number;
    createdAt: string;
  };
}

interface MaterialUsed {
  materialId: string;
  materialName: string;
  quantity: number;
  note?: string;
}

type LocationInfo = {
  name: string;
  type: 'store' | 'showroom';
  isMain: boolean;
  icon: React.ReactElement;
};

const ProductDetailPage: React.FC<ProductViewProps> = ({ id }) => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [showroomFilter, setShowroomFilter] = useState<string>('all');
  const [filteredMovements, setFilteredMovements] = useState<ExtendedMovement[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<ExtendedInventoryStock[]>([]);

  const fetchProductData = useCallback(async () => {
    try {
      setLoading(true);
      if (id) {
        const productData = await getItemDetailById(id);
        setProduct(productData);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      toast.error('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const getUniqueStores = useCallback(() => {
    if (!product) return [];
    
    const stores = new Set<string>();
    stores.add('all');
    
    product.recentMovements?.forEach((movement: ExtendedMovement) => {
      if (movement.store?.name) stores.add(movement.store.name);
    });
    
    product.recentInventory?.forEach((stock: ExtendedInventoryStock) => {
      if (stock.store?.name) stores.add(stock.store.name);
    });
    
    return Array.from(stores);
  }, [product]);

  const getUniqueShowrooms = useCallback(() => {
    if (!product) return [];
    
    const showrooms = new Set<string>();
    showrooms.add('all');
    
    product.recentMovements?.forEach((movement: ExtendedMovement) => {
      if (movement.showroom?.name) showrooms.add(movement.showroom.name);
    });
    
    product.recentInventory?.forEach((stock: ExtendedInventoryStock) => {
      if (stock.showroom?.name) showrooms.add(stock.showroom.name);
    });
    
    return Array.from(showrooms);
  }, [product]);

  const filterMovements = useCallback(() => {
    if (!product) return;
    
    let filtered = [...(product.recentMovements || [])] as ExtendedMovement[];
    
    if (storeFilter !== 'all') {
      filtered = filtered.filter(movement => movement.store?.name === storeFilter);
    }
    
    if (showroomFilter !== 'all') {
      filtered = filtered.filter(movement => movement.showroom?.name === showroomFilter);
    }
    
    setFilteredMovements(filtered);
  }, [product, storeFilter, showroomFilter]);

  const filterInventory = useCallback(() => {
    if (!product) return;
    
    let filtered = [...(product.recentInventory || [])] as ExtendedInventoryStock[];
    
    if (storeFilter !== 'all') {
      filtered = filtered.filter(stock => stock.store?.name === storeFilter);
    }
    
    if (showroomFilter !== 'all') {
      filtered = filtered.filter(stock => stock.showroom?.name === showroomFilter);
    }
    
    setFilteredInventory(filtered);
  }, [product, storeFilter, showroomFilter]);

  useEffect(() => {
    if (product) {
      filterMovements();
      filterInventory();
    }
  }, [product, storeFilter, showroomFilter, filterMovements, filterInventory]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
      case 'RETURN':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'OUT':
      case 'DAMAGE':
      case 'EXPIRE':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case 'TRANSFER':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLocationInfo = (movement: ExtendedMovement): LocationInfo | null => {
    if (movement.store) {
      return {
        name: movement.store.name,
        type: 'store',
        isMain: movement.store.isMain,
        icon: <Store className="h-3 w-3" />
      };
    } else if (movement.showroom) {
      return {
        name: movement.showroom.name,
        type: 'showroom',
        isMain: movement.showroom.isMain,
        icon: <Building2 className="h-3 w-3" />
      };
    }
    return null;
  };

  const getInventoryLocationInfo = (stock: ExtendedInventoryStock): LocationInfo | null => {
    if (stock.store) {
      return {
        name: stock.store.name,
        type: 'store',
        isMain: stock.store.isMain,
        icon: <Store className="h-4 w-4" />
      };
    } else if (stock.showroom) {
      return {
        name: stock.showroom.name,
        type: 'showroom',
        isMain: stock.showroom.isMain,
        icon: <Building2 className="h-4 w-4" />
      };
    }
    return null;
  };

  const getFilteredNetChange = useCallback(() => {
    if (!product) return 0;
    
    let totalIn = 0;
    let totalOut = 0;
    
    filteredMovements.forEach(movement => {
      if (movement.movementType === 'IN' || movement.movementType === 'RETURN') {
        totalIn += movement.quantity;
      } else if (movement.movementType === 'OUT' || movement.movementType === 'DAMAGE' || movement.movementType === 'EXPIRE') {
        totalOut += movement.quantity;
      } else if (movement.movementType === 'ADJUSTMENT' || movement.movementType === 'TRANSFER') {
        if (movement.quantity > 0) {
          totalIn += movement.quantity;
        } else {
          totalOut += Math.abs(movement.quantity);
        }
      }
    });
    
    return totalIn - totalOut;
  }, [product, filteredMovements]);

  const getFilteredStockSummary = useCallback(() => {
    if (!product) return { totalStock: 0, availableStock: 0 };
    
    let totalStock = 0;
    
    filteredInventory.forEach(stock => {
      totalStock += stock.quantity;
    });
    
    return { totalStock, availableStock: totalStock };
  }, [product, filteredInventory]);

  const getInventoryByLocationType = () => {
    if (!product) return { stores: 0, showrooms: 0 };
    
    let stores = 0;
    let showrooms = 0;
    
    const inventoryToUse = filteredInventory.length > 0 ? filteredInventory : product.recentInventory;
    
    inventoryToUse?.forEach(stock => {
      if (stock.store) stores += stock.quantity;
      if (stock.showroom) showrooms += stock.quantity;
    });
    
    return { stores, showrooms };
  };

  const resetFilters = () => {
    setStoreFilter('all');
    setShowroomFilter('all');
  };

  const isFilterActive = storeFilter !== 'all' || showroomFilter !== 'all';

  const getFilterDescription = () => {
    const filters = [];
    if (storeFilter !== 'all') filters.push(`Store: ${storeFilter}`);
    if (showroomFilter !== 'all') filters.push(`Showroom: ${showroomFilter}`);
    return filters.join(' • ');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <Package className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
          <p className='text-lg font-medium'>Product not found</p>
          <Link href='/dashboard/products'>
            <Button variant='outline' className='mt-4'>
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stockPercentage = product.stockSummary.totalStock > 0
    ? Math.min((product.stockSummary.availableStock / product.stockSummary.totalStock) * 100, 100)
    : 0;

  const filteredStock = getFilteredStockSummary();
  const filteredStockPercentage = filteredStock.totalStock > 0 
    ? Math.min((filteredStock.availableStock / filteredStock.totalStock) * 100, 100)
    : 0;

  const stores = getUniqueStores();
  const showrooms = getUniqueShowrooms();
  const inventoryByType = getInventoryByLocationType();

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div className='flex items-center gap-3'>
          <Package className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-2xl font-bold'>{product.name}</h1>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>ID: {product.id.slice(-8)}</span>
              <span>•</span>
              <span>{product.category?.name || 'No Category'}</span>
              {product.type && (
                <>
                  <span>•</span>
                  <span>{product.type.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className='flex gap-2'>
          <Link href='/dashboard/Item'>
            <Button variant='outline' size='sm'>
              Back to Products
            </Button>
          </Link>
          <Button variant='outline' size='sm' onClick={fetchProductData}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
       

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Total  Stock</p>
                <p className='text-2xl font-bold'>
                  {product.stockSummary.availableStock}
                </p>
                <div className='mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden'>
                  <div 
                    className='h-full bg-green-600 rounded-full' 
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
              </div>
              <div className='rounded-full bg-green-100 p-3 dark:bg-green-950/20'>
                <CheckCircle className='h-5 w-5 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Price</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {formatPrice(product.price)}
                </p>
              </div>
              <div className='rounded-full bg-purple-100 p-3 dark:bg-purple-950/20'>
                <FileText className='h-5 w-5 text-purple-600' />
              </div>
            </div>
          </CardContent>
        </Card>

   
      </div>

      {/* Location & Movement Summary */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Stock by Location</p>
                <div className='space-y-1 mt-1'>
                  <div className='flex items-center gap-2 text-xs'>
                    <Store className='h-3 w-3' />
                    <span className='font-medium'>Stores:</span>
                    <span>{inventoryByType.stores} units</span>
                  </div>
                  <div className='flex items-center gap-2 text-xs'>
                    <Building2 className='h-3 w-3' />
                    <span className='font-medium'>Showrooms:</span>
                    <span>{inventoryByType.showrooms} units</span>
                  </div>
                </div>
              </div>
              <div className='rounded-full bg-orange-100 p-3 dark:bg-orange-950/20'>
                <Building2 className='h-5 w-5 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Stock Movements</p>
                <div className='space-y-1 mt-1'>
                  <div className='flex items-center gap-2 text-xs text-green-600'>
                    <ArrowUp className='h-3 w-3' />
                    <span>In: {product.movementSummary.totalIn}</span>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-red-600'>
                    <ArrowDown className='h-3 w-3' />
                    <span>Out: {product.movementSummary.totalOut}</span>
                  </div>
                  <div className='flex items-center gap-2 text-xs font-medium'>
                    <TrendingUp className='h-3 w-3' />
                    <span>Net: {product.movementSummary.netChange > 0 ? '+' : ''}{product.movementSummary.netChange}</span>
                  </div>
                </div>
              </div>
              <div className='rounded-full bg-cyan-100 p-3 dark:bg-cyan-950/20'>
                <TrendingUp className='h-5 w-5 text-cyan-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Card */}
        <Card>
          <CardContent className='p-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>Filter by Location</p>
                {isFilterActive && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={resetFilters}
                    className='h-6 px-2 text-xs'
                  >
                    <X className='h-3 w-3 mr-1' />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div>
                <label className='text-xs text-muted-foreground mb-1 block'>Store</label>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store} value={store}>
                        {store === 'all' ? '🏪 All Stores' : `🏪 ${store}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className='text-xs text-muted-foreground mb-1 block'>Showroom</label>
                <Select value={showroomFilter} onValueChange={setShowroomFilter}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="All Showrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {showrooms.map((showroom) => (
                      <SelectItem key={showroom} value={showroom}>
                        {showroom === 'all' ? '🖼️ All Showrooms' : `🖼️ ${showroom}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtered Stock Summary */}
      {isFilterActive && (
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Filtered Stock
                </p>
                <p className='text-xs text-muted-foreground mb-1'>
                  {getFilterDescription()}
                </p>
                <p className='text-2xl font-bold'>{filteredStock.totalStock}</p>
                <div className='mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden'>
                  <div 
                    className='h-full bg-blue-600 rounded-full' 
                    style={{ width: `${filteredStockPercentage}%` }}
                  />
                </div>
              </div>
              <div className='rounded-full bg-blue-100 p-3 dark:bg-blue-950/20'>
                <Filter className='h-5 w-5 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-4'>
              {product.imageUrl && (
                <div className='flex items-start gap-3'>
                  <ImageIcon className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-sm font-medium'>Product Image</p>
                    <div className='relative w-32 h-32 mt-1 rounded-lg overflow-hidden border'>
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className='object-cover'
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className='flex items-center gap-3'>
                <Package className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Name</p>
                  <p className='text-sm text-muted-foreground'>{product.name}</p>
                </div>
              </div>
              
              <div className='flex items-center gap-3'>
                <FileText className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Price</p>
                  <p className='text-sm text-muted-foreground'>{formatPrice(product.price)}</p>
                </div>
              </div>
              
              {product.color && (
                <div className='flex items-center gap-3'>
                  <Palette className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Color</p>
                    <div className='flex items-center gap-2'>
                      <div 
                        className='w-4 h-4 rounded-full border' 
                        style={{ backgroundColor: product.color.toLowerCase() }}
                      />
                      <p className='text-sm text-muted-foreground'>{product.color}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Layers className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Category</p>
                  <p className='text-sm text-muted-foreground'>
                    {product.category?.name || ''}
                  </p>
                </div>
              </div>
              
              {product.type && (
                <div className='flex items-center gap-3'>
                  <FileText className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Type</p>
                    <p className='text-sm text-muted-foreground'>{product.type.name}</p>
                  </div>
                </div>
              )}
              
              {product.size && (
                <div className='flex items-center gap-3'>
                  <Ruler className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Size</p>
                    <p className='text-sm text-muted-foreground'>{product.size.name}</p>
                  </div>
                </div>
              )}
              
              <div className='flex items-center gap-3'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Created At</p>
                  <p className='text-sm text-muted-foreground'>
                    {formatDate(product.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Movements Table */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-lg font-semibold'>Recent Stock Movements</CardTitle>
            {isFilterActive && (
              <p className='text-sm text-muted-foreground mt-1'>
                Filtered by: {getFilterDescription()}
              </p>
            )}
          </div>
          <Badge variant='outline'>
            Net Change: {getFilteredNetChange() > 0 ? '+' : ''}
            {getFilteredNetChange()}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement) => {
                const locationInfo = getLocationInfo(movement);
                return (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {getMovementIcon(movement.movementType)}
                        <span>{movement.movementType}</span>
                      </div>
                    </TableCell>
                    <TableCell className={
                      movement.movementType === 'IN' || movement.movementType === 'RETURN' 
                        ? 'text-green-600 font-medium' 
                        : 'text-red-600 font-medium'
                    }>
                      {movement.movementType === 'IN' || movement.movementType === 'RETURN' ? '+' : '-'}
                      {movement.quantity}
                    </TableCell>
                    <TableCell>
                      {locationInfo ? (
                        <div className='flex items-center gap-1'>
                          {locationInfo.icon}
                          <span className='text-sm'>{locationInfo.name}</span>
                          {locationInfo.isMain && (
                            <Badge variant='secondary' className='text-xs px-1 py-0'>
                              Main
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className='text-sm text-muted-foreground'>-</span>
                      )}
                    </TableCell>
                    <TableCell>{movement.reference || ''}</TableCell>
                    <TableCell>{formatDate(movement.createdAt)}</TableCell>
                    <TableCell>{movement.user?.name || 'System'}</TableCell>
                    <TableCell className='max-w-50 truncate'>
                      {movement.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredMovements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                    No stock movements found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Materials Used */}
      {product.materialsUsed && product.materialsUsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Materials Used</CardTitle>
            <p className='text-sm text-muted-foreground'>
              Materials required to produce this product
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Quantity Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.materialsUsed.map((material, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{material.materialName}</TableCell>
                    <TableCell>{material.quantity}</TableCell>                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Proforma Invoices */}
      {product.recentProformaInvoices && product.recentProformaInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Proforma Invoices</CardTitle>
            <p className='text-sm text-muted-foreground'>
              Total Value: {formatPrice(product.proformaSummary.totalValue)}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PI Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.recentProformaInvoices.map((pi) => (
                  <TableRow key={pi.id}>
                    <TableCell className='font-medium'>
                      {pi.invoice?.piNumber || ''}
                    </TableCell>
                    <TableCell className='max-w-48 truncate'>
                      {pi.description}
                    </TableCell>
                    <TableCell>{pi.quantity}</TableCell>
                    <TableCell>{formatPrice(pi.unitPrice)}</TableCell>
                    <TableCell className='font-medium'>
                      {formatPrice(pi.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pi.invoice?.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {pi.invoice?.status || ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pi.invoice?.createdAt ? formatDate(pi.invoice.createdAt) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductDetailPage;