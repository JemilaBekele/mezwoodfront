'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { buttonVariants, Button } from '@/components/ui/button';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { ICompany } from '@/models/employee';
import { getCompanies, deleteCompany } from '@/service/companyService';
import { normalizeImagePath } from '@/lib/norm';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();

      setCompanies(data);
    } catch {
      setError( 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await deleteCompany(deleteId);
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch  {
      toast.error('Failed to delete company');
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setDeleteId(null);
    }
  };

  if (loading) return <div>Loading companies...</div>;
  if (error) return <div className='text-red-500'>Error: {error}</div>;

  return (
    <div className='p-4'>
      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
      />

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>All Companies</CardTitle>
          {/* <PermissionGuard requiredPermission={PERMISSIONS.COMPANY.CREATE.name}> */}
            {companies.length === 0 && (
              <Link
                href='/dashboard/Company/new'
                className={cn(buttonVariants(), 'text-xs md:text-sm')}
              >
                <IconPlus className='mr-2 h-4 w-4' />
                Add New Company
              </Link>
            )}
          {/* </PermissionGuard> */}
        </CardHeader>

        <CardContent>
          {companies.length === 0 ? (
            <p className='text-sm text-gray-500'>
              No company information available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Logo</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>TIN Address</TableCell>
                  <TableCell>TIN</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Avatar>
                        {company.logo ? (
                          <AvatarImage
                            src={normalizeImagePath(company.logo as string)}
                          />
                        ) : (
                          <AvatarFallback>{company.name[0]}</AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.email || '-'}</TableCell>
                    <TableCell>{company.phone || '-'}</TableCell>
                    <TableCell>{company.address || '-'}</TableCell>
                    <TableCell>{company.description || '-'}</TableCell>
                    <TableCell>{company.tinAddress || '-'}</TableCell>
                    <TableCell>{company.TIN || '-'}</TableCell>
                    <TableCell>{company.From || '-'}</TableCell>

                    <TableCell className='flex gap-2'>
                      {/* <PermissionGuard
                        requiredPermission={PERMISSIONS.COMPANY.UPDATE.name}
                      > */}
                        <Link
                          href={`/dashboard/Company/${company.id}`}
                          className={cn(
                            buttonVariants({ variant: 'outline' }),
                            'p-1'
                          )}
                        >
                          <IconEdit className='h-4 w-4' />
                        </Link>
                      {/* </PermissionGuard> */}
                      {/* <PermissionGuard
                        requiredPermission={PERMISSIONS.COMPANY.DELETE.name}
                      > */}
                        <Button
                          variant='destructive'
                          size='icon'
                          onClick={() => {
                            setDeleteId(company.id!);
                            setIsModalOpen(true);
                          }}
                        >
                          <IconTrash className='h-4 w-4' />
                        </Button>
                      {/* </PermissionGuard> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
