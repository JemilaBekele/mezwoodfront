/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ICurtainOrder, ICurtainMeasurement } from '@/models/curtainType';
import { getCurtainOrderById } from '@/service/Curtain';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CurtainWorkerLogs from './form';
import { CurtainWorkerType } from '@/models/CurtainWorkerLog'; // Import the enum
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type TcurtainOrderViewPageProps = {
  curtainOrderId: string;
};

// Helper function to safely format currency
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined) return '0.00';
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if it's a valid number
  if (isNaN(numValue)) return '0.00';
  
  return numValue.toFixed(2);
};

export default function CurtainViewPage({
  curtainOrderId
}: TcurtainOrderViewPageProps) {
  const [curtainOrder, setCurtainOrder] = useState<ICurtainOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurtainOrder = async () => {
      if (curtainOrderId === 'new') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getCurtainOrderById(curtainOrderId);
        setCurtainOrder(data as ICurtainOrder);
      } catch (err) {
        console.error('Error fetching curtain order:', err);
        setError('Failed to load curtain order details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurtainOrder();
  }, [curtainOrderId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // If it's a new order or no order found, show appropriate UI
  if (curtainOrderId === 'new' || !curtainOrder) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>New Curtain Order</CardTitle>
            <CardDescription>Create a new curtain order</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add your new order form here */}
            <p>New order creation form goes here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <CardTitle>Curtain Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Order Status</p>
              <p className="text-lg">{curtainOrder.curtainStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Payment Status</p>
              <p className="text-lg">{curtainOrder.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-lg">{formatCurrency(curtainOrder.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Balance</p>
              <p className="text-lg">{formatCurrency(curtainOrder.balance)}</p>
            </div>
            {curtainOrder.Shop && (
              <div>
                <p className="text-sm font-medium text-gray-500">Shop</p>
                <p className="text-lg">{curtainOrder.Shop.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Measurements and Worker Logs */}
      {curtainOrder.measurements && curtainOrder.measurements.length > 0 ? (
        <Tabs defaultValue={curtainOrder.measurements[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
            {curtainOrder.measurements.map((measurement: ICurtainMeasurement) => (
              <TabsTrigger key={measurement.id} value={measurement.id}>
                {measurement.roomName}
              </TabsTrigger>
            ))}
          </TabsList>

          {curtainOrder.measurements.map((measurement: ICurtainMeasurement) => (
            <TabsContent key={measurement.id} value={measurement.id} className="space-y-4">
              {/* Measurement Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{measurement.roomName} - Measurement Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Width</p>
                      <p>{measurement.width}m</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Height</p>
                      <p>{measurement.height}m</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Quantity</p>
                      <p>{measurement.quantity || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Size</p>
                      <p>{measurement.size || 'Standard'}</p>
                    </div>
                    {measurement.extrawidth && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Extra Width</p>
                        <p>{measurement.extrawidth}m</p>
                      </div>
                    )}
                   
                    
                    {/* Thick Curtain Info - Using predefined product variant */}
                    {measurement.thickProduct && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Thick Product</p>
                          <p>{measurement.thickProduct.name}</p>
                        
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Thick Meter</p>
                          <p>{measurement.thickMeter || 0}m</p>
                        </div>
                        {measurement.thickPrice && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Thick Price</p>
                            <p>{formatCurrency(measurement.thickPrice)}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Thin Curtain Info - Using predefined product variant */}
                    {measurement.thinProduct && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Thin Product</p>
                          <p>{measurement.thinProduct.name}</p>
                        
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Thin Meter</p>
                          <p>{measurement.thinMeter || 0}m</p>
                        </div>
                        {measurement.thinPrice && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Thin Price</p>
                            <p>{formatCurrency(measurement.thinPrice)}</p>
                          </div>
                        )}
                      </>
                    )}


                    {/* Worker Assignment */}
                    {measurement.thickWorker && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Thick Worker</p>
                        <p>{measurement.thickWorker.name}</p>
                      </div>
                    )}

                    {measurement.thinWorker && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Thin Worker</p>
                        <p>{measurement.thinWorker.name}</p>
                      </div>
                    )}

                    {measurement.workerPrice && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Worker Price</p>
                        <p>{formatCurrency(measurement.workerPrice)}</p>
                      </div>
                    )}

                    {measurement.totalWorkerMeter && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Worker Meter</p>
                        <p>{measurement.totalWorkerMeter}m</p>
                      </div>
                    )}

                    {/* Worker Payment Status */}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Thick Worker Paid</p>
                      <p>{measurement.thickWorkerPaid ? 'Yes' : 'No'}</p>
                      {measurement.thickWorkerPaidDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(measurement.thickWorkerPaidDate).toLocaleDateString()}
                        </p>
                      )}
                      {measurement.thickWorkerPaidAmount && (
                        <p className="text-xs text-gray-400">
                          Amount: {formatCurrency(measurement.thickWorkerPaidAmount)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Thin Worker Paid</p>
                      <p>{measurement.thinWorkerPaid ? 'Yes' : 'No'}</p>
                      {measurement.thinWorkerPaidDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(measurement.thinWorkerPaidDate).toLocaleDateString()}
                        </p>
                      )}
                      {measurement.thinWorkerPaidAmount && (
                        <p className="text-xs text-gray-400">
                          Amount: {formatCurrency(measurement.thinWorkerPaidAmount)}
                        </p>
                      )}
                    </div>
                  </div>


                  {measurement.remark && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Remark</p>
                      <p className="text-sm">{measurement.remark}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Worker Logs Section */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Worker Logs</CardTitle>
                    <CardDescription>
                      Manage worker assignments and track progress for this measurement
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Thick Curtain Worker Logs - Using predefined variant */}
                {measurement.thickProduct && (
                  <CurtainWorkerLogs
                    curtainMeasurementId={measurement.id}
                    measurementRoomName={`${measurement.roomName} - Thick Curtain`}
                    workerType={CurtainWorkerType.THICK}
                    productId={measurement.thickProductId}
                    productName={measurement.thickProduct?.name}
                    productVariant={measurement.thickVariant}
                    assignedWidth={measurement.width}
                    assignedHeight={measurement.height}
                    assignedExtraWidth={measurement.extrawidth} // ✅ Pass extra width
                    shopId={curtainOrder.ShopId}
                    shopName={curtainOrder.Shop?.name}
                  />
                )}

                {/* Thin Curtain Worker Logs - Using predefined variant */}
                {measurement.thinProduct && (
                  <CurtainWorkerLogs
                    curtainMeasurementId={measurement.id}
                    measurementRoomName={`${measurement.roomName} - Thin Curtain`}
                    workerType={CurtainWorkerType.THIN}
                    productId={measurement.thinProductId}
                    productName={measurement.thinProduct?.name}
                    productVariant={measurement.thinVariant}
                    assignedWidth={measurement.width}
                    assignedHeight={measurement.height}
                    assignedExtraWidth={measurement.extrawidth} // ✅ Pass extra width
                    shopId={curtainOrder.ShopId}
                    shopName={curtainOrder.Shop?.name}
                  />
                )}

                {/* Curtain Pole Worker Logs if needed
                {measurement.curtainPole && (
                  <CurtainWorkerLogs
                    curtainMeasurementId={measurement.id}
                    measurementRoomName={`${measurement.roomName} - Curtain Pole`}
                    workerType={CurtainWorkerType.THIN} // You may need to add this to your enum
                    productId={measurement.curtainPoleId}
                    productName={measurement.curtainPole?.name}
                    assignedWidth={measurement.width}
                    assignedHeight={measurement.height}
                    assignedExtraWidth={measurement.extrawidth} // ✅ Pass extra width
                    shopId={curtainOrder.ShopId}
                    shopName={curtainOrder.Shop?.name}
                  />
                )} */}

                {/* Show message if no products assigned */}
                {!measurement.thickProduct && !measurement.thinProduct && !measurement.curtainPole && (
                  <Card>
                    <CardContent className="py-4">
                      <p className="text-center text-gray-500">
                        No products assigned to this measurement. Please assign thick, thin, or pole products first.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">No measurements found for this order.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}