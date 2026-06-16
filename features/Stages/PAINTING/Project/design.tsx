/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';


import { ProjectStatus } from '@/models/Projects';
import UnifiedProjectDetailPage from '../../unifay';

type ProjectDetailProps = {
  id?: string;
  stageType: ProjectStatus.PAINTING;
};

export const PAINTINGProjectDetailPage = (props: Omit<ProjectDetailProps, 'stageType'>) => (
  <UnifiedProjectDetailPage {...props} stageType={ProjectStatus.PAINTING} />
);