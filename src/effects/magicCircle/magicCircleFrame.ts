import type { FrameSignals } from '../../app/frameSignals';
import { EXPERIENCE_TIMING } from '../../config/experience';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};
const fade = (value: number, start: number, end: number) => 1 - smooth((value - start) / (end - start));

export interface MagicCircleFrame {
  ringProgress: number;
  latticeProgress: number;
  detailProgress: number;
  fieldProgress: number;
  opacity: number;
  ringOpacity: number;
  latticeOpacity: number;
  detailOpacity: number;
  pillarOpacity: number;
  dustOpacity: number;
  brightness: number;
  flow: number;
  releaseScale: number;
  releaseFlash: number;
  chargeFlash: number;
  pillarConvergence: number;
  dissolveProgress: number;
}

export function getMagicCircleFrame(signals: FrameSignals): MagicCircleFrame {
  const charge = clamp01(signals.charge);
  const active = ['charging', 'charged', 'dissolving', 'summoning'].includes(signals.state);
  const opacity = active && charge > 0 ? 1 : 0;
  const ringProgress = clamp01(charge / 0.32);
  const latticeProgress = clamp01((charge - 0.32) / 0.36);
  const detailProgress = smooth((charge - 0.32) / 0.36);
  const fieldProgress = charge >= 1 ? 1 : clamp01((charge - 0.68) / 0.32);
  const dissolve = signals.state === 'dissolving' ? clamp01(signals.dissolve) : 0;
  const elapsedMs = signals.state === 'summoning'
    ? clamp01(signals.summon) * EXPERIENCE_TIMING.summonEndMs
    : 0;
  const summonMainFade = signals.state === 'summoning' ? fade(elapsedMs, 1500, 2360) : 1;
  const summonFieldFade = signals.state === 'summoning' ? fade(elapsedMs, 1660, 2360) : 1;
  const dustRetreat = signals.state === 'summoning'
    ? 1 - 0.86 * smooth((elapsedMs - 1660) / (2360 - 1660))
    : 1;
  const dustTail = signals.state === 'summoning' ? fade(elapsedMs, 2360, 2600) : 1;
  const compressIn = smooth(elapsedMs / EXPERIENCE_TIMING.releaseHoldMs);
  const rebound = smooth((elapsedMs - EXPERIENCE_TIMING.releaseHoldMs) / 100);
  const releaseScale = signals.state === 'summoning' ? 1 - 0.06 * compressIn * (1 - rebound) : 1;
  const releaseFlash = signals.state === 'summoning'
    ? smooth(elapsedMs / EXPERIENCE_TIMING.releaseHoldMs) * fade(elapsedMs, 220, 420)
    : 0;
  const chargeFlash = signals.state === 'charging' || signals.state === 'charged'
    ? smooth((charge - 0.9) / 0.06) * fade(charge, 0.97, 1)
    : 0;
  const pillarConvergence = signals.state === 'summoning'
    ? smooth((elapsedMs - EXPERIENCE_TIMING.releaseHoldMs)
      / (EXPERIENCE_TIMING.fillStartMs - EXPERIENCE_TIMING.releaseHoldMs))
    : 0;
  const breath = signals.state === 'charged'
    ? 1 + Math.sin(signals.nowMs * Math.PI * 2 / 3600) * 0.04
    : 1;

  return {
    ringProgress,
    latticeProgress,
    detailProgress,
    fieldProgress,
    opacity,
    ringOpacity: opacity * fade(dissolve, 0.55, 1) * summonMainFade,
    latticeOpacity: opacity * fade(dissolve, 0.55, 1) * summonMainFade,
    detailOpacity: opacity * fade(dissolve, 0.68, 0.75) * summonFieldFade,
    pillarOpacity: opacity * fade(dissolve, 0, 0.25) * summonFieldFade,
    dustOpacity: opacity * fade(dissolve, 0.1, 0.55) * dustRetreat * dustTail,
    brightness: (0.72 + smooth(fieldProgress) * 0.88) * breath,
    flow: Math.max(0, signals.nowMs) / 1000,
    releaseScale,
    releaseFlash,
    chargeFlash,
    pillarConvergence,
    dissolveProgress: dissolve,
  };
}
