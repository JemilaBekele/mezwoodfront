'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { IDeliveryEstimation } from '@/models/delivery-estimation';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  estimation: IDeliveryEstimation | null;
}

export default function DeliveryEstimationDetailModal({
  isOpen,
  onClose,
  estimation,
}: Props) {
  if (!estimation) return null;

  return (
    <Modal
      title="Delivery Estimation Details"
      description={`Code: ${estimation.code}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ScrollArea className="max-h-[80vh]">
        <div className="space-y-6 pr-4">
          
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{estimation.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{estimation.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{estimation.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <p className="font-medium capitalize">{estimation.difficulty}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Related PI ID</p>
              <p className="font-medium text-xs break-all">{estimation.piId || 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {/* Timeline Section */}
          <h3 className="text-lg font-semibold">Timeline & Estimates</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="font-medium">{estimation.totalQuantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Days</p>
              <p className="font-medium">{estimation.estimatedDays}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Date</p>
              <p className="font-medium">
                {estimation.estimatedDelivery ? new Date(estimation.estimatedDelivery).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Stage Quantities */}
          <h3 className="text-lg font-semibold">Stage Quantities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-sm">
            <div className="flex flex-col"><span className="text-muted-foreground">Design</span><span className="font-medium">{estimation.DESIGN || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Metal Works</span><span className="font-medium">{estimation.METAL_WORKS || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">CNC</span><span className="font-medium">{estimation.CNC || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Cutting</span><span className="font-medium">{estimation.CUTTING || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Edge Banding</span><span className="font-medium">{estimation.EDGE_BANDING || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Assembly</span><span className="font-medium">{estimation.ASSEMBLY || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Painting</span><span className="font-medium">{estimation.PAINTING || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Finishing</span><span className="font-medium">{estimation.FINISHING || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Delivery</span><span className="font-medium">{estimation.DELIVERY || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Purchasing</span><span className="font-medium">{estimation.PURCHASING || 0}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Installation</span><span className="font-medium">{estimation.INSTALLATION || 0}</span></div>
          </div>

          {estimation.itemsSnapshot && estimation.itemsSnapshot.length > 0 && (
            <>
              <Separator />
              <h3 className="text-lg font-semibold">Items Quoted</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {estimation.itemsSnapshot.map((item, idx) => (
                  <li key={idx}>Item ID: <span className="font-medium">{item.itemId}</span> — Quantity: <span className="font-medium">{item.quantity}</span></li>
                ))}
              </ul>
            </>
          )}

          <div className="pt-4 flex justify-end">
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </div>
      </ScrollArea>
    </Modal>
  );
}
