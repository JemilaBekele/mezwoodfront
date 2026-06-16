/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Copy } from 'lucide-react';
import { acceptMaterialInitialStock } from '@/service/material';

interface MaterialInitialStockFormProps {
  materialId: string;
}

interface StockFormData {
  quantity: number;
  notes?: string;
}

const MaterialInitialStockForm: React.FC<MaterialInitialStockFormProps> = ({ materialId }) => {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockFormData[]>([
    {
      quantity: 0,
      notes: ''
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStockChange = (stockIndex: number, field: string, value: any) => {
    setStocks((prev) =>
      prev.map((stock, index) => {
        if (index === stockIndex) {
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
        notes: ''
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
      ...stocks[index]
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
      }

      // Process each stock entry
      for (const stock of stocks) {
        await acceptMaterialInitialStock(
          materialId,
          Number(stock.quantity)
        );
      }
      
      setSuccess(`Successfully added initial stock to ${stocks.length} entry(ies)`);
      setTimeout(() => {
        router.push(`/dashboard/Material`);
      }, 2000);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err?.message || 'Failed to add initial stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Add Initial Material Stock</span>
          
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
                  Stock Entry {stockIndex + 1}
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

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
                    placeholder="Enter quantity"
                  />
                </div>

                <div className='space-y-2'>
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
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className='flex justify-between'>
           
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Adding Stock...' : `Add Stock (${stocks.length} Entry${stocks.length > 1 ? 'ies' : 'y'})`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MaterialInitialStockForm;