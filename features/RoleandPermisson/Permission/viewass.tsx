import AssRolePermissionForm from './createass';

export default async function AssPermissionViewPage() {
  const pageTitle = 'Create New Role Permission';

  return <AssRolePermissionForm pageTitle={pageTitle} />;
}
