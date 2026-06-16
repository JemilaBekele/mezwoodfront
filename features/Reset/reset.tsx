'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import { factoryReset, yearEndReset } from '@/service/reset';
import {
  AlertTriangle,
  Trash2,
  RotateCcw,
  Loader2,
  Shield,
  Lock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

// Security code that user needs to enter
const SECURITY_CODE = 'RESET2024'; // Change this to your preferred code

export default function SystemResetPanel() {
  const [factorySubmitting, setFactorySubmitting] = useState(false);
  const [yearEndSubmitting, setYearEndSubmitting] = useState(false);
  const [factoryDialogOpen, setFactoryDialogOpen] = useState(false);
  const [yearEndDialogOpen, setYearEndDialogOpen] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const verifySecurityCode = () => {
    if (securityCode === SECURITY_CODE) {
      setIsVerified(true);
      setShowSecurityModal(false);
      toast.success('Security code verified successfully');
    } else {
      toast.error('Invalid security code. Please try again.');
      setSecurityCode('');
    }
  };

  const handleFactoryReset = async () => {
    try {
      setFactorySubmitting(true);
      const result = await factoryReset();

      if (result.success) {
        toast.success('Factory reset completed successfully', {
          description: 'All data has been cleared from the system.'
        });
        setFactoryDialogOpen(false);
      }
    } catch {
      const backendMessage =
       
        'Error performing factory reset';

      toast.error('Factory reset failed', {
        description: backendMessage
      });
    } finally {
      setFactorySubmitting(false);
    }
  };

  const handleYearEndReset = async () => {
    try {
      setYearEndSubmitting(true);
      const result = await yearEndReset();

      if (result.success) {
        toast.success('Year-end reset completed successfully', {
          description:
            'Transactional data has been cleared while preserving products and master data.'
        });
        setYearEndDialogOpen(false);
      }
    } catch  {
      const backendMessage =
      
        'Error performing year-end reset';

      toast.error('Year-end reset failed', {
        description: backendMessage
      });
    } finally {
      setYearEndSubmitting(false);
    }
  };

  // If not verified, show security code prompt
  if (!isVerified) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Lock className='h-5 w-5' />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You need special authorization to access system reset functions.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert>
              <Shield className='h-4 w-4' />
              <AlertDescription>
                This area contains dangerous operations that can permanently
                delete system data. Access is restricted to authorized personnel
                only.
              </AlertDescription>
            </Alert>

            <Dialog
              open={showSecurityModal}
              onOpenChange={setShowSecurityModal}
            >
              <DialogTrigger asChild>
                <Button className='w-full'>
                  <Shield className='mr-2 h-4 w-4' />
                  Enter Security Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <Shield className='h-5 w-5' />
                    Security Verification
                  </DialogTitle>
                  <DialogDescription>
                    Enter the security code to access system reset functions.
                    <br />
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <Input
                    type='text'
                    placeholder='Enter security code'
                    value={securityCode}
                    onChange={(e) =>
                      setSecurityCode(e.target.value.toUpperCase())
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        verifySecurityCode();
                      }
                    }}
                    className='text-center font-mono text-lg'
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setShowSecurityModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={verifySecurityCode}
                    disabled={!securityCode.trim()}
                  >
                    Verify Code
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If verified, show the actual reset panel
  return (
    <div className='space-y-6'>
      <Card className='border-destructive/20'>
        <CardHeader>
          <CardTitle className='text-destructive flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            Dangerous Operations
          </CardTitle>
          <CardDescription>
            These actions are irreversible and will permanently delete data from
            the system. Use with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>Warning:</strong> These operations cannot be undone.
              Please ensure you have proper backups before proceeding.
            </AlertDescription>
          </Alert>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Year End Reset Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <RotateCcw className='h-5 w-5' />
                  Year-End Reset
                </CardTitle>
                <CardDescription>
                  Clears all transactional data while preserving products,
                  stocks, and master data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog
                  open={yearEndDialogOpen}
                  onOpenChange={setYearEndDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant='outline' className='w-full'>
                      <RotateCcw className='mr-2 h-4 w-4' />
                      Year-End Reset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className='flex items-center gap-2'>
                        <RotateCcw className='h-5 w-5' />
                        Confirm Year-End Reset
                      </DialogTitle>
                      <DialogDescription>
                        This will permanently delete all transactional data
                        including:
                        <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                          <li>Sales and purchase records</li>
                          <li>Transfer and stock correction history</li>
                          <li>Stock ledger entries</li>
                          <li>Cart and notification data</li>
                        </ul>
                        <p className='mt-2 font-medium'>
                          Products, categories, customers, suppliers, and
                          current stock levels will be preserved.
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setYearEndDialogOpen(false)}
                        disabled={yearEndSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant='default'
                        onClick={handleYearEndReset}
                        disabled={yearEndSubmitting}
                      >
                        {yearEndSubmitting ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RotateCcw className='mr-2 h-4 w-4' />
                            Confirm Reset
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Factory Reset Card */}
            <Card>
              <CardHeader>
                <CardTitle className='text-destructive flex items-center gap-2 text-lg'>
                  <Trash2 className='h-5 w-5' />
                  Factory Reset
                </CardTitle>
                <CardDescription>
                  Completely wipes all data from the system. This will delete
                  everything.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog
                  open={factoryDialogOpen}
                  onOpenChange={setFactoryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant='destructive' className='w-full'>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Factory Reset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className='text-destructive flex items-center gap-2'>
                        <Trash2 className='h-5 w-5' />
                        Confirm Factory Reset
                      </DialogTitle>
                      <DialogDescription className='text-destructive'>
                        <strong className='text-destructive'>
                          This action cannot be undone.
                        </strong>
                        <br />
                        This will permanently delete:
                        <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                          <li>All companies, branches, shops, and stores</li>
                          <li>All products, categories, and inventory data</li>
                          <li>All users, roles, and permissions</li>
                          <li>All customers and suppliers</li>
                          <li>All transactional data and history</li>
                        </ul>
                        <p className='mt-2 font-medium'>
                          The system will be completely empty after this
                          operation.
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setFactoryDialogOpen(false)}
                        disabled={factorySubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant='destructive'
                        onClick={handleFactoryReset}
                        disabled={factorySubmitting}
                      >
                        {factorySubmitting ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete Everything
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
