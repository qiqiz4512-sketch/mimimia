import { describe, expect, it } from 'vitest';

import { MagicCircle } from '../../../src/effects/MagicCircle';
import type { ExperienceState } from '../../../src/state/experienceTypes';

const signals = (state: ExperienceState, charge: number, dissolve = 0) => ({
  nowMs: 1_000,
  deltaSeconds: 1 / 60,
  state,
  charge,
  dissolve,
  summon: 0,
  pointerNdc: { x: 0, y: 0 },
});

describe('MagicCircle', () => {
  it('meets the exact total spell draw budgets without removing core geometry', () => {
    const circle = new MagicCircle();
    circle.update(signals('charged', 1), 'high');
    expect(circle.group.position.y).toBeCloseTo(0.015);
    expect(circle.getSnapshot()).toMatchObject({
      ringProgress: 1,
      latticeProgress: 1,
      detailProgress: 1,
      fieldProgress: 1,
      pillarCount: 5,
      pillarLayers: 3,
      ribbonDrawCalls: 6,
      totalDrawCalls: 9,
      microMarkCount: 24,
      orbitLightCount: 6,
    });
    expect(circle.getSnapshot().totalDrawCalls + 3).toBe(12);

    circle.update(signals('charged', 1), 'balanced');
    expect(circle.getSnapshot()).toMatchObject({
      pillarCount: 4,
      pillarLayers: 2,
      ribbonDrawCalls: 5,
      totalDrawCalls: 7,
    });
    expect(circle.getSnapshot().totalDrawCalls + 3).toBe(10);

    circle.update(signals('charged', 1), 'compatibility');
    expect(circle.getSnapshot()).toMatchObject({
      pillarCount: 3,
      pillarLayers: 1,
      ribbonDrawCalls: 4,
      totalDrawCalls: 5,
      microMarkCount: 12,
      orbitLightCount: 2,
    });
    expect(circle.getSnapshot().totalDrawCalls + 3).toBe(8);
    circle.dispose();
  });

  it('resets rotations, pillar visibility, flash, and progress', () => {
    const circle = new MagicCircle();
    circle.update(signals('charged', 1), 'high');
    circle.reset();
    expect(circle.getSnapshot()).toMatchObject({
      opacity: 0,
      ringRotation: 0,
      latticeRotation: 0,
      orbitRotation: 0,
      detailRotation: 0,
      pillarCount: 0,
      releaseFlash: 0,
      chargeFlash: 0,
    });
    circle.dispose();
  });
});
