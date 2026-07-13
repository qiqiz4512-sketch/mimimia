import type { ExperienceState } from '../state/experienceTypes';

export interface FrameSignals {
  nowMs: number;
  deltaSeconds: number;
  state: ExperienceState;
  charge: number;
  dissolve: number;
  summon: number;
  pointerNdc: { x: number; y: number };
}
