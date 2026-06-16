/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  IconEdit,
  IconDotsVertical,
  IconProgress
} from '@tabler/icons-react';

import { IProject, DesignStatus } from '@/models/Projects';
import { updateProjectDesignStatus } from '@/service/Project';

interface ProjectCellActionProps {
  data: IProject;
}

export const ProjectCellAction: React.FC<ProjectCellActionProps> = ({
  data,
}) => {
  const router = useRouter();


  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/Stage/painting/view?id=${data.id}`)
            }
          >
            <IconEdit className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

       
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};