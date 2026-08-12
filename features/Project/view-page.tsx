import { getProjectById } from '@/service/Project';
import ProjectForm from './form';
import { IProject } from '@/models/Projects';

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
      console.error('Error loading project:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return (
    <ProjectForm
      initialData={project}
      pageTitle={pageTitle}
    />
  );
}
