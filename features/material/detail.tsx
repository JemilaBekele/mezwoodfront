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
import { getMaterialById } from '@/service/material';
import { MaterialDetail } from '@/models/materialDetail';
import Link from 'next/link';

type MaterialViewProps = {
  id?: string;
};

// Define types for location info
type LocationInfo = {
  name: string;
  type: 'store' | 'showroom';
  isMain: boolean;
  icon: React.ReactElement;
};

// Define extended types for movement and stock
interface ExtendedMovement {
  id: string;
  movementType: string;
  quantity: number;
  reference?: string;
  movementDate: string;
  notes?: string;
  user?: { id: string; name: string };
  store?: { id: string; name: string; isMain: boolean };
  showroom?: { id: string; name: string; isMain: boolean };
}

interface ExtendedInventoryStock {
  id: string;
  quantity: number;
  status: string;
  locationName?: string;
  store?: { id: string; name: string; isMain: boolean };
  showroom?: { id: string; name: string; isMain: boolean };
}

const MaterialDetailPage: React.FC<MaterialViewProps> = ({ id }) => {
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [showroomFilter, setShowroomFilter] = useState<string>('all');
  const [filteredMovements, setFilteredMovements] = useState<ExtendedMovement[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<ExtendedInventoryStock[]>([]);

  const fetchMaterialData = useCallback(async () => {
    try {
      if (id) {
        const materialData = await getMaterialById(id);
        setMaterial(materialData);
      }
    } catch (err) {
      toast.error('Failed to fetch material details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMaterialData();
  }, [fetchMaterialData]);

  // Get unique stores and showrooms
  const getUniqueStores = useCallback(() => {
    if (!material) return [];
    
    const stores = new Set<string>();
    stores.add('all');
    
    material.recentMovements.forEach((movement: ExtendedMovement) => {
      if (movement.store?.name) stores.add(movement.store.name);
    });
    
    material.recentInventory?.forEach((stock: ExtendedInventoryStock) => {
      if (stock.store?.name) stores.add(stock.store.name);
    });
    
    return Array.from(stores);
  }, [material]);

  const getUniqueShowrooms = useCallback(() => {
    if (!material) return [];
    
    const showrooms = new Set<string>();
    showrooms.add('all');
    
    material.recentMovements.forEach((movement: ExtendedMovement) => {
      if (movement.showroom?.name) showrooms.add(movement.showroom.name);
    });
    
    material.recentInventory?.forEach((stock: ExtendedInventoryStock) => {
      if (stock.showroom?.name) showrooms.add(stock.showroom.name);
    });
    
    return Array.from(showrooms);
  }, [material]);

  // Define filter functions with useCallback
  const filterMovements = useCallback(() => {
    if (!material) return;
    
    let filtered = [...material.recentMovements] as ExtendedMovement[];
    
    // Apply store filter
    if (storeFilter !== 'all') {
      filtered = filtered.filter(movement => movement.store?.name === storeFilter);
    }
    
    // Apply showroom filter
    if (showroomFilter !== 'all') {
      filtered = filtered.filter(movement => movement.showroom?.name === showroomFilter);
    }
    
    setFilteredMovements(filtered);
  }, [material, storeFilter, showroomFilter]);

  const filterInventory = useCallback(() => {
    if (!material) return;
    
    let filtered = [...(material.recentInventory as ExtendedInventoryStock[])];
    
    // Apply store filter
    if (storeFilter !== 'all') {
      filtered = filtered.filter(stock => stock.store?.name === storeFilter);
    }
    
    // Apply showroom filter
    if (showroomFilter !== 'all') {
      filtered = filtered.filter(stock => stock.showroom?.name === showroomFilter);
    }
    
    setFilteredInventory(filtered);
  }, [material, storeFilter, showroomFilter]);

  // Apply filters when material data or filters change
  useEffect(() => {
    if (material) {
      filterMovements();
      filterInventory();
    }
  }, [material, storeFilter, showroomFilter, filterMovements, filterInventory]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
      case 'RETURN':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'OUT':
      case 'ADJUSTMENT':
      case 'DAMAGE':
      case 'EXPIRE':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
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

  const getFilteredNetChange = useCallback(() => {
    if (!material) return 0;
    
    let totalIn = 0;
    let totalOut = 0;
    
    filteredMovements.forEach(movement => {
      if (movement.movementType === 'IN' || movement.movementType === 'RETURN') {
        totalIn += movement.quantity;
      } else if (movement.movementType === 'OUT' || movement.movementType === 'DAMAGE' || movement.movementType === 'EXPIRE') {
        totalOut += movement.quantity;
      }
    });
    
    return totalIn - totalOut;
  }, [material, filteredMovements]);

  const getFilteredStockSummary = useCallback(() => {
    if (!material) return { totalStock: 0, availableStock: 0 };
    
    let totalStock = 0;
    let availableStock = 0;
    
    filteredInventory.forEach(stock => {
      totalStock += stock.quantity;
      if (stock.status === 'Available') {
        availableStock += stock.quantity;
      }
    });
    
    return { totalStock, availableStock };
  }, [material, filteredInventory]);

  const getInventoryByLocationType = () => {
    if (!material) return { stores: 0, showrooms: 0 };
    
    let stores = 0;
    let showrooms = 0;
    
    const inventoryToUse = filteredInventory;
    
    inventoryToUse.forEach(stock => {
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

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading material details...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Material not found</p>
      </div>
    );
  }

  // Calculate stock percentage for progress bar
  const stockPercentage = Math.min(
    (material.stockSummary.availableStock / (material.stockSummary.totalStock || 1)) * 100,
    100
  );

  const filteredStock = getFilteredStockSummary();
  const filteredStockPercentage = filteredStock.totalStock > 0 
    ? Math.min((filteredStock.availableStock / filteredStock.totalStock) * 100, 100)
    : 0;

  const stores = getUniqueStores();
  const showrooms = getUniqueShowrooms();
  const inventoryByType = getInventoryByLocationType();

  // Get filter description
  const getFilterDescription = () => {
    const filters = [];
    if (storeFilter !== 'all') filters.push(`Store: ${storeFilter}`);
    if (showroomFilter !== 'all') filters.push(`Showroom: ${showroomFilter}`);
    return filters.join(' • ');
  };

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header with actions */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div className='flex items-center gap-3'>
          <Package className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-2xl font-bold'>{material.name}</h1>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>ID: {material.id.slice(-8)}</span>
              <span>•</span>
              <span>{material.materialType?.name || 'No Category'}</span>
            </div>
          </div>
        </div>
        <div className='flex gap-2'>
          <Link href={`/dashboard/Material`}>
            <Button variant='outline' size='sm'>
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Total Stock</p>
                <p className='text-2xl font-bold'>{material.stockSummary.totalStock}</p>
                <p className='text-xs text-muted-foreground'>
                  in {material.unitOfMeasure?.name || 'units'}
                </p>
              </div>
              <div className='rounded-full bg-primary/10 p-3'>
                <Package className='h-5 w-5 text-primary' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Available</p>
                <p className='text-2xl font-bold text-green-600'>
                  {material.stockSummary.availableStock}
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

        {/* Inventory by Type Summary */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Stock by Type</p>
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
              <div className='rounded-full bg-purple-100 p-3 dark:bg-purple-950/20'>
                <Building2 className='h-5 w-5 text-purple-600' />
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
              
              {/* Store Filter */}
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
              
              {/* Showroom Filter */}
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

        {/* Filtered Stock Summary Card */}
        {isFilterActive && (
          <Card className='md:col-span-2 lg:col-span-1'>
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
                  <p className='text-xs text-green-600'>
                    Available: {filteredStock.availableStock}
                  </p>
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
      </div>

      {/* All Content Sections */}
      <div className='space-y-6'>
        {/* Overview Section */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Material Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Package className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Name</p>
                    <p className='text-sm text-muted-foreground'>{material.name}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Layers className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Category</p>
                    <p className='text-sm text-muted-foreground'>
                      {material.materialType?.name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <FileText className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Unit of Measure</p>
                    <p className='text-sm text-muted-foreground'>
                      {material.unitOfMeasure?.name || 'N/A'}
                      {material.unitOfMeasure?.symbol && ` (${material.unitOfMeasure.symbol})`}
                    </p>
                  </div>
                </div>
              </div>
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Created At</p>
                    <p className='text-sm text-muted-foreground'>
                      {formatDate(material.createdAt)}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <RefreshCw className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Last Updated</p>
                    <p className='text-sm text-muted-foreground'>
                      {formatDate(material.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Material Types Badges */}
            <div className='mt-4'>
              <p className='mb-2 text-sm font-medium'>Material Types</p>
              <div className='flex flex-wrap gap-2'>
                {material.plainMDF && (
                  <Badge variant='outline' className='bg-primary/5'>Plain MDF</Badge>
                )}
                {material.laminatedMDF && (
                  <Badge variant='outline' className='bg-primary/5'>Laminated MDF</Badge>
                )}
                {material.wood && (
                  <Badge variant='outline' className='bg-primary/5'>Wood</Badge>
                )}
                {material.metal && (
                  <Badge variant='outline' className='bg-primary/5'>Metal</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movements Section */}
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
                      <TableCell className={movement.movementType === 'IN' || movement.movementType === 'RETURN' 
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
                      <TableCell>{movement.reference || 'N/A'}</TableCell>
                      <TableCell>{formatDate(movement.movementDate)}</TableCell>
                      <TableCell>{movement.user?.name || 'System'}</TableCell>
                      <TableCell className='max-w-50 truncate'>
                        {movement.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMovements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center py-4 text-muted-foreground'>
                      No stock movements found for the selected filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Usage Section */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Material Usage in Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity Used</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {material.itemUsage.map((usage, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{usage.itemName}</TableCell>
                    <TableCell>{usage.quantity}</TableCell>
                    <TableCell>{usage.note || '-'}</TableCell>
                  </TableRow>
                ))}
                {material.itemUsage.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className='text-center py-4 text-muted-foreground'>
                      No item usage records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inventory by Location Section */}
        {/* <Card>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>
              Current Inventory by Location
              {isFilterActive && (
                <span className='text-sm font-normal text-muted-foreground ml-2'>
                  (Filtered)
                </span>
              )}
            </CardTitle>
            {!isFilterActive && (
              <p className='text-sm text-muted-foreground mt-1'>
                Showing all inventory across stores and showrooms
              </p>
            )}
          </CardHeader>
          <CardContent>
            {filteredInventory.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {filteredInventory.map((stock) => {
                  const locationInfo = getInventoryLocationInfo(stock);
                  return (
                    <div key={stock.id} className='flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          {locationInfo?.icon}
                          <p className='font-semibold'>
                            {locationInfo?.name || 'Unknown Location'}
                          </p>
                          {locationInfo?.isMain && (
                            <Badge variant='secondary' className='text-xs'>
                              Main
                            </Badge>
                          )}
                        </div>
                        <div className='space-y-1'>
                          <p className='text-sm text-muted-foreground'>
                            Status: 
                            <Badge 
                              variant='outline' 
                              className={`ml-2 text-xs ${
                                stock.status === 'Available' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}
                            >
                              {stock.status}
                            </Badge>
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            Type: <span className='capitalize'>{locationInfo?.type || 'unknown'}</span>
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-2xl font-bold text-primary'>{stock.quantity}</p>
                        <p className='text-xs text-muted-foreground'>
                          {material.unitOfMeasure?.symbol || 'units'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-12'>
                <Package className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
                <p className='text-muted-foreground'>
                  {isFilterActive 
                    ? `No inventory found for the selected filters: ${getFilterDescription()}`
                    : 'No inventory records found'}
                </p>
                {isFilterActive && (
                  <Button 
                    variant='link' 
                    onClick={resetFilters}
                    className='mt-2'
                  >
                    Clear filters to see all locations
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};

export default MaterialDetailPage;