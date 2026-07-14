import { describe, expect, it } from 'vitest';

import { getMagicCircleFrame } from '../../../src/effects/magicCircle/magicCircleFrame';

const frame = (
  state: 'charging' | 'charged' | 'dissolving' | 'summoning',
  charge: number,
  dissolve = 0,
  summon = 0,
  nowMs = 0,
) => ({
  nowMs,
  deltaSeconds: 1 / 60,
  state,
  charge,
  dissolve,
  summon,
  pointerNdc: { x: 0, y: 0 },
});

describe('geometric magic circle frame', () => {
  it('maps the exact approved charge boundaries', () => {
    expect(getMagicCircleFrame(frame('charging', 0))).toMatchObject({
      opacity: 0,
      ringProgress: 0,
      latticeProgress: 0,
      fieldProgress: 0,
    });
    expect(getMagicCircleFrame(frame('charging', 0.32))).toMatchObject({
      ringProgress: 1,
      latticeProgress: 0,
      fieldProgress: 0,
    });
    expect(getMagicCircleFrame(frame('charging', 0.68))).toMatchObject({
      ringProgress: 1,
      latticeProgress: 1,
      detailProgress: 1,
      fieldProgress: 0,
    });
    expect(getMagicCircleFrame(frame('charged', 1))).toMatchObject({
      ringProgress: 1,
      latticeProgress: 1,
      detailProgress: 1,
      fieldProgress: 1,
    });
  });

  it('holds brightness inside the approved breathing band', () => {
    const samples = [0, 900, 1800, 2700, 3600].map(
      (nowMs) => getMagicCircleFrame(frame('charged', 1, 0, 0, nowMs)).brightness,
    );
    expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(0.16);
  });

  it('fires one deterministic completion pulse before charged hold and leaves a dust-only tail', () => {
    expect(getMagicCircleFrame(frame('charging', 0.95)).chargeFlash).toBeGreaterThan(0);
    expect(getMagicCircleFrame(frame('charged', 1)).chargeFlash).toBe(0);
    const retreat = getMagicCircleFrame(frame('summoning', 1, 0, 2360 / 2600));
    expect(retreat).toMatchObject({
      ringOpacity: 0,
      latticeOpacity: 0,
      detailOpacity: 0,
      pillarOpacity: 0,
    });
    expect(retreat.dustOpacity).toBeGreaterThan(0);
    expect(getMagicCircleFrame(frame('summoning', 1, 0, 1)).dustOpacity).toBe(0);
  });

  it('dissolves pillars before the main lattice and flashes only on success', () => {
    const early = getMagicCircleFrame(frame('dissolving', 1, 0.2));
    const middle = getMagicCircleFrame(frame('dissolving', 1, 0.5));
    const late = getMagicCircleFrame(frame('dissolving', 1, 0.7));
    expect(early.pillarOpacity).toBeLessThan(early.latticeOpacity);
    expect(middle).toMatchObject({ latticeOpacity: 1, dissolveProgress: 0.5 });
    expect(getMagicCircleFrame(frame('dissolving', 1, 0.75)).detailOpacity).toBe(0);
    expect(late.latticeOpacity).toBeLessThan(early.latticeOpacity);
    expect(early.releaseFlash).toBe(0);
    expect(getMagicCircleFrame(frame('summoning', 1, 0, 120 / 2600)).releaseFlash).toBeGreaterThan(0);
  });
});
