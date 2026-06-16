import { getProjectById } from '@/service/Project';
import ProjectForm from './form';
import { IProject } from '@/models/Projects';
import { toast } from 'sonner';

type TProjectViewPageProps = {
  projectId: string;
};

export default async function ProjectViewPage({
  projectId
}: TProjectViewPageProps) {
  let project: IProject | null = null;
  let pageTitle = 'Create New Project';

  if (projectId !== 'new') {
    try {
      const data = await getProjectById(projectId);
      project = data as IProject | null;

      if (project) {
        pageTitle = `Edit Project`;
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Error loading project');
    }
  }

  return (
    <ProjectForm
      initialData={project}
      pageTitle={pageTitle}
    />
  );
}
