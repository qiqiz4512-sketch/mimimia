import { EXPERIENCE_TIMING } from '../config/experience';
import type { ExperienceEvent, ExperienceSnapshot, ExperienceState } from './experienceTypes';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export class ExperienceMachine {
  #snapshot: ExperienceSnapshot = {
    state: 'loading',
    charge: 0,
    stateStartedAt: 0,
    chargeStartedAt: null,
  };

  snapshot(): Readonly<ExperienceSnapshot> {
    return { ...this.#snapshot };
  }

  tick(nowMs: number): Readonly<ExperienceSnapshot> {
    this.#advanceCharge(nowMs);
    return this.snapshot();
  }

  dispatch(event: ExperienceEvent, nowMs: number): Readonly<ExperienceSnapshot> {
    this.#advanceCharge(nowMs);
    const state = this.#snapshot.state;

    switch (event.type) {
      case 'ASSETS_READY':
        if (state === 'loading') this.#transition('entry', nowMs, 0, null);
        break;
      case 'ENTER':
        if (state === 'entry') this.#transition('idle', nowMs, 0, null);
        break;
      case 'POINTER_DOWN':
        if (state === 'idle') this.#transition('charging', nowMs, 0, nowMs);
        break;
      case 'POINTER_UP':
        if (state === 'charging') this.#transition('dissolving', nowMs, this.#snapshot.charge, null);
        else if (state === 'charged') this.#transition('summoning', nowMs, 1, null);
        break;
      case 'POINTER_CANCEL':
        if (state === 'charging' || state === 'charged') {
          this.#transition('dissolving', nowMs, this.#snapshot.charge, null);
        }
        break;
      case 'DISSOLVE_DONE':
        if (state === 'dissolving') this.#transition('idle', nowMs, 0, null);
        break;
      case 'SUMMON_DONE':
        if (state === 'summoning') this.#transition('complete', nowMs, 1, null);
        break;
      case 'RESET':
        if (state === 'complete') this.#transition('resetting', nowMs, 1, null);
        break;
      case 'RESET_DONE':
        if (state === 'resetting') this.#transition('idle', nowMs, 0, null);
        break;
    }
    return this.snapshot();
  }

  #advanceCharge(nowMs: number): void {
    if (this.#snapshot.state !== 'charging' || this.#snapshot.chargeStartedAt === null) return;
    const charge = clamp01((nowMs - this.#snapshot.chargeStartedAt) / EXPERIENCE_TIMING.chargeMs);
    this.#snapshot = { ...this.#snapshot, charge };
    if (charge >= 1) this.#transition('charged', nowMs, 1, this.#snapshot.chargeStartedAt);
  }

  #transition(
    state: ExperienceState,
    stateStartedAt: number,
    charge: number,
    chargeStartedAt: number | null,
  ): void {
    this.#snapshot = { state, stateStartedAt, charge, chargeStartedAt };
  }
}
