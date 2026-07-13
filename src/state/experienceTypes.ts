export type ExperienceState =
  | 'loading'
  | 'entry'
  | 'idle'
  | 'charging'
  | 'charged'
  | 'dissolving'
  | 'summoning'
  | 'complete'
  | 'resetting';

export type ExperienceEvent =
  | { type: 'ASSETS_READY' }
  | { type: 'ENTER' }
  | { type: 'POINTER_DOWN' }
  | { type: 'POINTER_UP' }
  | { type: 'POINTER_CANCEL' }
  | { type: 'DISSOLVE_DONE' }
  | { type: 'SUMMON_DONE' }
  | { type: 'RESET' }
  | { type: 'RESET_DONE' }
  | { type: 'RECOVER' };

export interface ExperienceSnapshot {
  state: ExperienceState;
  charge: number;
  stateStartedAt: number;
  chargeStartedAt: number | null;
}
