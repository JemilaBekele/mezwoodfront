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
  reload?: () => Promise<void>;
}
export const ProjectCellAction: React.FC<ProjectCellActionProps> = ({
  data,
  reload
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  /* =========================
      DESIGN STAGES
  ========================= */

  const designStages: DesignStatus[] = [
    DesignStatus.INITIATED,
    DesignStatus.MODELING,
    DesignStatus.DRAFTING,
    DesignStatus.CUTLIST,
    DesignStatus.BOQ,
    DesignStatus.FINISHED
  ];

  /* =========================
      UPDATE DESIGN STATUS
  ========================= */

const handleDesignUpdate = async (stage: DesignStatus) => {
  const confirmChange = window.confirm(
    `Are you sure you want to change stage to "${stage.replace('_', ' ')}"?`
  );

  if (!confirmChange) return;

  try {
    setLoading(true);

    await updateProjectDesignStatus(data.id, stage);

    // 👇 preferred refresh method
    if (reload) {
      await reload();
    } else {
      router.refresh(); // fallback
    }
  } catch (error: any) {
    console.error(error.message);
  } finally {
    setLoading(false);
  }
};

  const isFinished = data.designStatus === DesignStatus.FINISHED;

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
              router.push(`/dashboard/Stage/Design/view?id=${data.id}`)
            }
          >
            <IconEdit className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          {/* =========================
              DESIGN STAGES
          ========================= */}

            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Stage</DropdownMenuLabel>

              {designStages.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={() => handleDesignUpdate(stage)}
                  disabled={loading || data.designStatus === stage}
                >
                  <IconProgress className="mr-2 h-4 w-4" />
                  {stage.replace('_', ' ')}
                </DropdownMenuItem>
              ))}
            </>
          
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};