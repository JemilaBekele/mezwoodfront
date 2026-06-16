/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { IStore } from '@/models/store';
import { IShowroom } from '@/models/showroom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Copy } from 'lucide-react';
import { getStoresAll } from '@/service/store';
import { getShowroomsAll } from '@/service/showroom';
import { acceptItemInitialStock } from '@/service/item';

interface ItemInitialStockFormProps {
  itemId: string;
}

interface StockFormData {
  quantity: number;
  storeId: string | null;
  showroomId: string | null;
  notes?: string;
  locationType: 'store' | 'showroom';
}

const ItemInitialStockForm: React.FC<ItemInitialStockFormProps> = ({ itemId }) => {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockFormData[]>([
    {
      quantity: 0,
      storeId: null,
      showroomId: null,
      notes: '',
      locationType: 'store'
    }
  ]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [showrooms, setShowrooms] = useState<IShowroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const [storesResponse, showroomsResponse] = await Promise.all([
          getStoresAll(),
          getShowroomsAll()
        ]);
        setStores(storesResponse);
        setShowrooms(showroomsResponse);
      } catch (err) {
        setError('Failed to load locations');
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const handleStockChange = (stockIndex: number, field: string, value: any) => {
    setStocks((prev) =>
      prev.map((stock, index) => {
        if (index === stockIndex) {
          // Reset the other location field when switching location type
          if (field === 'locationType') {
            return {
              ...stock,
              locationType: value,
              storeId: null,
              showroomId: null,
            };
          }
          return { ...stock, [field]: value };
        }
        return stock;
      })
    );
  };

  const addStock = () => {
    setStocks((prev) => [
      ...prev,
      {
        quantity: 0,
        storeId: null,
        showroomId: null,
        notes: '',
        locationType: 'store'
      }
    ]);
  };

  const removeStock = (index: number) => {
    if (stocks.length > 1) {
      setStocks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateStock = (index: number) => {
    const stockToDuplicate = { 
      ...stocks[index],
      storeId: null,
      showroomId: null 
    };
    setStocks((prev) => [...prev, stockToDuplicate]);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);
  setSuccess(null);

  try {
 

    // Validate each stock entry
    for (const stock of stocks) {
      if (stock.quantity <= 0) {
        throw new Error('Quantity must be greater than 0 for all entries');
      }
      if (stock.locationType === 'store' && !stock.storeId) {
        throw new Error('Please select a store for all store entries');
      }
      if (stock.locationType === 'showroom' && !stock.showroomId) {
        throw new Error('Please select a showroom for all showroom entries');
      }
    }

    // Prepare payload - ensure itemId is included and not empty
    const payload = {
      items: stocks.map(stock => ({
        itemId: itemId, // Use the itemId from props
        initialQuantity: Number(stock.quantity),
        storeId: stock.locationType === 'store' ? stock.storeId || undefined : undefined,
        showroomId: stock.locationType === 'showroom' ? stock.showroomId || undefined : undefined,
      }))
    };

    console.log('Submitting payload:', payload); // Debug log

    await acceptItemInitialStock(payload);
    
    setSuccess(`Successfully added initial stock to ${stocks.length} location(s)`);
    setTimeout(() => {
      router.push(`/dashboard/Item`);
    }, 2000);
  } catch (err: any) {
    console.error('Error:', err);
    setError(err?.message || 'Failed to add initial stock');
  } finally {
    setIsLoading(false);
  }
};

  const getLocationLabel = (locationType: 'store' | 'showroom') => {
    return locationType === 'store' ? 'Store' : 'Showroom';
  };

  const getAvailableLocations = (locationType: 'store' | 'showroom', currentIndex: number) => {
    if (locationType === 'store') {
      return stores;
    } else {
      return showrooms;
    }
  };

  const getSelectedLocationValue = (stock: StockFormData) => {
    if (stock.locationType === 'store') {
      return stock.storeId || '';
    } else {
      return stock.showroomId || '';
    }
  };

  const handleLocationChange = (stockIndex: number, value: string) => {
    const stock = stocks[stockIndex];
    if (stock.locationType === 'store') {
      handleStockChange(stockIndex, 'storeId', value);
    } else {
      handleStockChange(stockIndex, 'showroomId', value);
    }
  };

  if (isLoadingLocations && stores.length === 0 && showrooms.length === 0) {
    return <div className="flex justify-center p-8">Loading locations...</div>;
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Add Initial Stock to Locations</span>
          <Button type='button' onClick={addStock} variant='outline' size='sm'>
            <Plus className='mr-2 h-4 w-4' />
            Add Location Stock
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert
            variant='default'
            className='mb-4 border-green-200 bg-green-50'
          >
            <AlertDescription className='text-green-800'>
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {stocks.map((stock, stockIndex) => (
            <div key={stockIndex} className='space-y-4 rounded-lg border p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>
                  Location Stock Entry {stockIndex + 1}
                </h3>
                <div className='flex space-x-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => duplicateStock(stockIndex)}
                  >
                    <Copy className='mr-1 h-4 w-4' />
                    Duplicate
                  </Button>
                  {stocks.length > 1 && (
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      onClick={() => removeStock(stockIndex)}
                    >
                      <Trash2 className='mr-1 h-4 w-4' />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor={`locationType-${stockIndex}`}>
                    Location Type *
                  </Label>
                  <Select
                    value={stock.locationType}
                    onValueChange={(value: 'store' | 'showroom') =>
                      handleStockChange(stockIndex, 'locationType', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select Location Type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='store'>Store</SelectItem>
                      <SelectItem value='showroom'>Showroom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor={`location-${stockIndex}`}>
                    {getLocationLabel(stock.locationType)} *
                  </Label>
                  <Select
                    value={getSelectedLocationValue(stock)}
                    onValueChange={(value) =>
                      handleLocationChange(stockIndex, value)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${getLocationLabel(stock.locationType)}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableLocations(stock.locationType, stockIndex).map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} {location.isMain ? '(Main)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor={`quantity-${stockIndex}`}>
                    Quantity *
                  </Label>
                  <Input
                    type='number'
                    id={`quantity-${stockIndex}`}
                    min='1'
                    value={stock.quantity}
                    onChange={(e) =>
                      handleStockChange(
                        stockIndex,
                        'quantity',
                        Number(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>

                <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                  <Label htmlFor={`notes-${stockIndex}`}>
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id={`notes-${stockIndex}`}
                    value={stock.notes || ''}
                    onChange={(e) =>
                      handleStockChange(stockIndex, 'notes', e.target.value)
                    }
                    placeholder='Add any notes about this stock entry...'
                  />
                </div>
              </div>
            </div>
          ))}

          <div className='flex justify-between'>
            <Button type='button' onClick={addStock} variant='outline'>
              <Plus className='mr-2 h-4 w-4' />
              Add Another Location Stock
            </Button>
            <Button type='submit' disabled={isLoading || isLoadingLocations}>
              {isLoading ? 'Adding Stock...' : `Add Stock to ${stocks.length} Location(s)`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ItemInitialStockForm;