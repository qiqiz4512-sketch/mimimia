import type { FrameSignals } from '../app/frameSignals';
import { EXPERIENCE_TIMING } from '../config/experience';
import { getSummonFrame, type SummonFrame } from './summonTiming';

interface SummonCatTarget {
  setReveal: (shadow: number, fill: number, opacity: number) => void;
  setAnchorPosition: (x: number, y: number, z: number) => void;
  reset: () => void;
}

export class SummonDirector {
  readonly #cat: SummonCatTarget;
  #complete = false;
  #active = false;
  #frame: SummonFrame = getSummonFrame(0);

  constructor(cat: SummonCatTarget) {
    this.#cat = cat;
  }

  update(signals: FrameSignals): void {
    if (signals.state === 'complete') {
      this.#active = true;
      this.#frame = getSummonFrame(EXPERIENCE_TIMING.summonEndMs);
      this.#applyFrame();
      this.#complete = true;
      return;
    }
    if (signals.state !== 'summoning') {
      if (this.#active || this.#complete) this.reset();
      return;
    }

    this.#active = true;
    const elapsedMs = Math.min(1, Math.max(0, signals.summon)) * EXPERIENCE_TIMING.summonEndMs;
    this.#frame = getSummonFrame(elapsedMs);
    this.#applyFrame();
    this.#complete = this.#frame.complete;
  }

  getSnapshot(): Readonly<SummonFrame> {
    return { ...this.#frame, position: { ...this.#frame.position } };
  }

  isComplete(): boolean {
    return this.#complete;
  }

  reset(): void {
    this.#complete = false;
    this.#active = false;
    this.#frame = getSummonFrame(0);
    this.#cat.reset();
  }

  #applyFrame(): void {
    this.#cat.setReveal(this.#frame.shadow, this.#frame.fill, this.#frame.opacity);
    this.#cat.setAnchorPosition(this.#frame.position.x, this.#frame.position.y, this.#frame.position.z);
  }
}
