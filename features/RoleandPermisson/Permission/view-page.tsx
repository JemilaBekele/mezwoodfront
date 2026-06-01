import { toast } from 'sonner';
import RolePermissionForm from './form'; // Adjust path as needed

type RolePermissionViewPageProps = {
  id: string;
};

export default async function RolePermissionViewPage({
  id
}: RolePermissionViewPageProps) {
  let pageTitle = 'Create New Role Permission';

  if (id !== 'new') {
    try {
      pageTitle = 'Edit Role Permission';
    } catch  {
      toast.error('Error loading role permission');
    }
  }

  return <RolePermissionForm pageTitle={pageTitle} />;
}
