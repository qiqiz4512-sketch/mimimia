import { describe, expect, it } from 'vitest';
import { LightPillars } from '../../../src/effects/magicCircle/LightPillars';
import { createLightPillarGeometry } from '../../../src/effects/magicCircle/lightPillarGeometry';
import { getMagicCircleFrame } from '../../../src/effects/magicCircle/magicCircleFrame';

const charged = getMagicCircleFrame({
  nowMs: 1000,
  deltaSeconds: 1 / 60,
  state: 'charged',
  charge: 1,
  dissolve: 0,
  summon: 0,
  pointerNdc: { x: 0, y: 0 },
});

describe('LightPillars', () => {
  it('uses exact tier counts without reallocating', () => {
    const pillars = new LightPillars();
    const allocatedObjects = pillars.getStats().allocatedObjects;

    for (const [quality, pillarCount, layerCount] of [
      ['high', 5, 3],
      ['balanced', 4, 2],
      ['compatibility', 3, 1],
    ] as const) {
      pillars.update(charged, quality);
      expect(pillars.getStats()).toMatchObject({ pillarCount, layerCount, allocatedObjects });
    }

    pillars.reset();
    expect(pillars.getStats()).toMatchObject({ pillarCount: 0, layerCount: 0, allocatedObjects });
    pillars.dispose();
  });

  it('gives the mist layer a taller, wider silhouette than the light core', () => {
    const core = createLightPillarGeometry(0.7, 0.92);
    const mist = createLightPillarGeometry(2.8, 1.18);
    core.computeBoundingBox();
    mist.computeBoundingBox();

    expect(mist.boundingBox!.max.y).toBeGreaterThan(core.boundingBox!.max.y);
    expect(mist.boundingBox!.max.x - mist.boundingBox!.min.x)
      .toBeGreaterThan(core.boundingBox!.max.x - core.boundingBox!.min.x);

    const intensityAttribute = core.getAttribute('pillarIntensity');
    const intensities = Array.from(
      { length: intensityAttribute.count },
      (_, index) => intensityAttribute.getX(index),
    );
    expect(new Set(intensities).size).toBeGreaterThan(1);

    core.dispose();
    mist.dispose();
  });
});
