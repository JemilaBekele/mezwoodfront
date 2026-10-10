import { IProjectStage } from '@/models/Projects';

/**
 * Mirror of backend/src/services/stageHandoff.js — keep the two in step.
 *
 * A stage can only work on what the stages before it have passed on: the
 * share of their plan that is done (the slower of two parallel stages
 * decides). Stage order: Metal Works + CNC → Cutting + Edge Banding →
 * Assembly + Painting → Finishing → Delivery → Installation.
 */
const HANDOFF_PHASES: string[][] = [
  ['METAL_WORKS', 'CNC'],
  ['CUTTING', 'EDGE_BANDING'],
  ['ASSEMBLY', 'PAINTING'],
  ['FINISHING'],
  ['DELIVERY'],
  ['INSTALLATION']
];

const EPS = 1e-6;

type StageLike = Pick<IProjectStage, 'stage' | 'finished'> & {
  workUnits?: number | null;
  actualWorkUnits?: number | null;
  status?: string | null;
};

export const stageLabel = (name: string) =>
  name === 'CNC'
    ? 'CNC'
    : name
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

const isStageDone = (s?: StageLike) =>
  !!s &&
  (s.finished === true || s.status === 'COMPLETED' || s.status === 'CANCELLED');

const doneShare = (s: StageLike) => {
  if (isStageDone(s)) return 1;
  const planned = Number(s.workUnits) || 0;
  const actual = Number(s.actualWorkUnits) || 0;
  return planned > 0 ? Math.min(actual / planned, 1) : 0;
};

export interface StageHandoff {
  /** Units this stage can log right now. */
  availableUnits: number;
  /** Units still to do on this stage (planned − done). */
  remainingUnits: number;
  /** Whether "Complete all" is possible (everything remaining was passed on). */
  canCompleteAll: boolean;
  /** Earlier stages that are holding work back, with how far along they are. */
  waitingOn: { stage: string; label: string; donePercent: number }[];
  /** One-line explanation for the user when not everything is available. */
  reason: string | null;
}

export function getStageHandoff(
  stageName: string,
  stages: StageLike[] = []
): StageHandoff {
  const stage = stages.find((s) => s.stage === stageName);
  const planned = Number(stage?.workUnits) || 0;
  const actual = Number(stage?.actualWorkUnits) || 0;
  const remainingUnits = Math.max(0, planned - actual);

  const phaseIndex = HANDOFF_PHASES.findIndex((p) => p.includes(stageName));
  let prerequisites: StageLike[] = [];
  for (let i = phaseIndex - 1; i >= 0; i -= 1) {
    const present = stages.filter((s) => HANDOFF_PHASES[i].includes(s.stage));
    if (present.length > 0) {
      prerequisites = present;
      break;
    }
  }

  const share = prerequisites.length
    ? Math.min(...prerequisites.map(doneShare))
    : 1;
  const availableUnits =
    Math.round(Math.max(0, planned * share - actual) * 10000) / 10000;
  const canCompleteAll = availableUnits >= remainingUnits - EPS;

  const waitingOn = prerequisites
    .filter((s) => !isStageDone(s))
    .map((s) => ({
      stage: s.stage,
      label: stageLabel(s.stage),
      donePercent: Math.round(doneShare(s) * 10000) / 100
    }));

  let reason: string | null = null;
  if (!canCompleteAll) {
    const from = waitingOn
      .map((w) => `${w.label} is ${w.donePercent}% done`)
      .join(' and ');
    reason =
      availableUnits <= EPS
        ? `Nothing to work on yet: ${from}. Work becomes available here as they log their units.`
        : `Only ${availableUnits} of the ${
            Math.round(remainingUnits * 10000) / 10000
          } remaining units have been passed on, because ${from}. The rest can be completed once they finish.`;
  }

  return { availableUnits, remainingUnits, canCompleteAll, waitingOn, reason };
}
