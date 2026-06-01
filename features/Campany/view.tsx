import { ICompany } from '@/models/employee';
import { getCompanyById } from '@/service/companyService';
import { toast } from 'sonner';
import CompanyForm from './add';

type CompanyViewPageProps = {
  companyId: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.1.1:5000';

export default async function CompanyViewPage({
  companyId
}: CompanyViewPageProps) {
  let company: ICompany | null = null;
  let combinedCompanyData: ICompany | null = null;
  let pageTitle = 'Create New Company';

  const normalizeLogoPath = (path?: string | File) => {
    if (!path) return undefined;
    if (typeof path !== 'string') {
      // If path is a File, return undefined or handle as needed
      return undefined;
    }
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.startsWith('http')) {
      return normalizedPath;
    }
    // Remove any leading slashes to prevent double slashes in URL
    const cleanPath = normalizedPath.replace(/^\/+/, '');
    return `${BACKEND_URL}/${cleanPath}`;
  };

  if (companyId !== 'new') {
    try {
      const response = await getCompanyById(companyId);
      company = response || null;

      if (!company) {
      }

      combinedCompanyData = {
        ...company,
        logo: normalizeLogoPath(company?.logo)
      };

      pageTitle = `Edit Company: ${company?.name || company.id}`;
    } catch {
      toast.error('Error loading company');
    }
  }

  return (
    <CompanyForm initialData={combinedCompanyData} pageTitle={pageTitle} />
  );
}
