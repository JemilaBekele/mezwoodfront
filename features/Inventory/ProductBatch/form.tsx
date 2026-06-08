/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { IStore } from '@/models/store';
import { getStores } from '@/service/store';
import { getProductById } from '@/service/Product'; // Import the getProductById function
import { IProduct } from '@/models/Product'; // Import IProduct interface
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
import { createProductstock } from '@/service/Product';

interface ProductStockFormProps {
  productId: string;
}

interface StockFormData {
  storeId: string;
  notes?: string;
  height?: number;
  width?: number;
  quantity?: number;
}

const ProductStockForm: React.FC<ProductStockFormProps> = ({ productId }) => {
  const router = useRouter();

  const [stocks, setStocks] = useState<StockFormData[]>([
    {
      storeId: '',
      notes: '',
      quantity: undefined
    }
  ]);

  const [stores, setStores] = useState<IStore[]>([]);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if product should show height and width fields
  const shouldShowDimensions = () => {
    if (!product) return false;
    return !!(product.thickCurtain || product.thinCurtain || product.poleCurtain);
  };

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoadingStores(true);
      try {
        const storesResponse = await getStores();
        setStores(storesResponse);
      } catch {
        setError('Failed to load stores');
      } finally {
        setIsLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoadingProduct(true);
      try {
        const productData = await getProductById(productId);
        setProduct(productData);
      } catch {
        setError('Failed to load product information');
      } finally {
        setIsLoadingProduct(false);
      }
    };
    
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleStockChange = (index: number, field: string, value: any) => {
    setStocks(prev =>
      prev.map((stock, i) =>
        i === index ? { ...stock, [field]: value } : stock
      )
    );
  };

  const addStock = () => {
    setStocks(prev => [
      ...prev,
      { storeId: '', notes: '', quantity: undefined }
    ]);
  };

  const removeStock = (index: number) => {
    if (stocks.length > 1) {
      setStocks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateStock = (index: number) => {
    const copy = { ...stocks[index], storeId: '' };
    setStocks(prev => [...prev, copy]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Filter out stocks with empty/undefined quantity or no store selected
    const validStocks = stocks.filter(stock => {
      const hasStore = stock.storeId && stock.storeId.trim() !== '';
      const hasQuantity = stock.quantity !== undefined && 
                          stock.quantity !== null && 
                          stock.quantity !== 0 &&
                          !isNaN(stock.quantity) &&
                          stock.quantity.toString().trim() !== '';
      
      return hasStore && hasQuantity;
    });

    if (validStocks.length === 0) {
      setError('Please add at least one valid stock entry with store and quantity greater than 0');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        stocks: validStocks.map(stock => ({
          storeId: stock.storeId,
          notes: stock.notes || undefined,
          quantity: Number(stock.quantity),
          height: stock.height ? Number(stock.height) : undefined,
          width: stock.width ? Number(stock.width) : undefined
        }))
      };

      await createProductstock(productId, payload);

      setSuccess(`Successfully added stock to ${validStocks.length} store(s)`);
      setTimeout(() => router.push('/dashboard/Products'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add stock');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingStores && stores.length === 0) {
    return <div>Loading stores...</div>;
  }

  if (isLoadingProduct) {
    return <div>Loading product information...</div>;
  }

  const showDimensions = shouldShowDimensions();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='flex justify-between'>
          Add Initial Stock to Stores
          <Button onClick={addStock} variant='outline' size='sm'>
            <Plus className='mr-2 h-4 w-4' /> Add Store Stock
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className='border-green-200 bg-green-50'>
            <AlertDescription className='text-green-800'>
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Optional: Show a note about dimensions */}
        {product && !showDimensions && (
          <Alert className='mb-4 bg-blue-50 border-blue-200'>
            <AlertDescription className='text-blue-800 text-sm'>
              Note: Height and width are not required for this product type.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {stocks.map((stock, i) => (
            <div key={i} className='border p-4 rounded-lg space-y-4'>
              <div className='flex justify-between'>
                <h3 className='font-semibold'>Store Entry {i + 1}</h3>

                <div className='flex gap-2'>
                  <Button type='button' size='sm' onClick={() => duplicateStock(i)}>
                    <Copy className='h-4 w-4 mr-1' /> Duplicate
                  </Button>

                  {stocks.length > 1 && (
                    <Button
                      type='button'
                      size='sm'
                      variant='destructive'
                      onClick={() => removeStock(i)}
                    >
                      <Trash2 className='h-4 w-4 mr-1' /> Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* STORE */}
              <div className='space-y-2'>
                <Label>Store *</Label>
                <Select
                  value={stock.storeId}
                  onValueChange={v => handleStockChange(i, 'storeId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select Store' />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* HEIGHT & WIDTH - Only show for curtain products */}
              {showDimensions && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input
                      type='number'
                      value={stock.height || ''}
                      onChange={e =>
                        handleStockChange(i, 'height', e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder='Enter height'
                    />
                  </div>

                  <div>
                    <Label>Width (cm)</Label>
                    <Input
                      type='number'
                      value={stock.width || ''}
                      onChange={e =>
                        handleStockChange(i, 'width', e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder='Enter width'
                    />
                  </div>
                </div>
              )}

              {/* QUANTITY */}
              <div>
                <Label>Quantity *</Label>
                <Input
                  type='number'
                  value={stock.quantity === undefined ? '' : stock.quantity}
                  onChange={e => {
                    const value = e.target.value;
                    handleStockChange(i, 'quantity', value === '' ? undefined : Number(value));
                  }}
                  placeholder='Enter quantity (must be greater than 0)'
                />
              </div>

              {/* NOTES */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={stock.notes || ''}
                  onChange={e =>
                    handleStockChange(i, 'notes', e.target.value)
                  }
                />
              </div>
            </div>
          ))}

          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Add Stock'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductStockForm;