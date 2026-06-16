/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';


import { ProjectStatus } from '@/models/Projects';
import UnifiedProjectDetailPage from '../../unifay';

type ProjectDetailProps = {
  id?: string;
  stageType: ProjectStatus.EDGE_BANDING | ProjectStatus.ASSEMBLY | ProjectStatus.CNC;
};

export const EdgebandingProjectDetailPage = (props: Omit<ProjectDetailProps, 'stageType'>) => (
  <UnifiedProjectDetailPage {...props} stageType={ProjectStatus.EDGE_BANDING} />
);