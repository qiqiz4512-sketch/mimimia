import { describe, expect, it } from 'vitest';

import { ParticleSystem } from '../../../src/effects/ParticleSystem';

const frame = (state: 'idle' | 'charged' | 'dissolving' | 'summoning', charge: number, dissolve = 0, nowMs = 0) => ({
  nowMs,
  deltaSeconds: 1 / 60,
  state,
  charge,
  dissolve,
  summon: state === 'summoning' ? nowMs / 2_600 : 0,
  pointerNdc: { x: 0, y: 0 },
});

describe('ParticleSystem', () => {
  it('uses deterministic semantic layouts and exact quality caps', () => {
    const first = new ParticleSystem(0x4d4f4f4e);
    const second = new ParticleSystem(0x4d4f4f4e);
    expect(first.getLayoutSample(8)).toEqual(second.getLayoutSample(8));

    for (const [quality, dustCount, risingLightCount, starFlareCount] of [
      ['high', 900, 90, 18],
      ['balanced', 520, 54, 12],
      ['compatibility', 240, 30, 6],
    ] as const) {
      first.update(frame('charged', 1), quality);
      expect(first.getStats()).toMatchObject({
        quality,
        dustCount,
        risingLightCount,
        starFlareCount,
        drawCalls: 3,
        activeCount: dustCount + risingLightCount + starFlareCount,
      });
      expect(first.group.children.every((child) => child.visible)).toBe(true);
    }
    first.dispose();
    second.dispose();
  });

  it('returns to the same allocation baseline after 20 dissolve resets', () => {
    const particles = new ParticleSystem(1234);
    const allocatedObjects = particles.getStats().allocatedObjects;
    for (let cast = 0; cast < 20; cast += 1) {
      particles.update(frame('charged', 1), 'high');
      particles.update(frame('dissolving', 1, 0.5), 'high');
      particles.update(frame('dissolving', 1, 1), 'high');
      particles.reset();
      expect(particles.getStats()).toMatchObject({ activeCount: 0, allocatedObjects });
    }
    particles.dispose();
  });

  it('reconstructs every summon particle phase from summon progress in one fixed frame', () => {
    const particles = new ParticleSystem(99);
    for (const [elapsedMs, mode] of [
      [120, 'release-flash'],
      [520, 'fill-rise'],
      [1_500, 'cat-settle'],
    ] as const) {
      particles.update(frame('summoning', 1, 0, elapsedMs), 'high');
      expect(particles.getStats()).toMatchObject({ mode, activeCount: expect.any(Number) });
      expect(particles.getStats().activeCount).toBeGreaterThan(0);
    }
    particles.update(frame('summoning', 1, 0, 2_400), 'high');
    expect(particles.getStats()).toMatchObject({ mode: 'gather', risingLightCount: 0, starFlareCount: 0 });
    expect(particles.getStats().dustCount).toBeGreaterThan(0);
    particles.update(frame('summoning', 1, 0, 2_600), 'high');
    expect(particles.getStats().activeCount).toBe(0);
    particles.dispose();
  });

  it('stops flares in the first dissolve quarter while dust fades through the middle', () => {
    const particles = new ParticleSystem(77);
    particles.update(frame('dissolving', 1, 0.25), 'high');
    expect(particles.getStats().starFlareCount).toBe(0);
    expect(particles.getStats().dustCount).toBeGreaterThan(0);
    particles.update(frame('dissolving', 1, 0.55), 'high');
    expect(particles.getStats().dustCount).toBe(0);
    particles.dispose();
  });
});
