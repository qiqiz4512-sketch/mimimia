import { describe, expect, it } from 'vitest';
import { createMagicCircleNodeMaterial } from '../../../src/effects/magicCircle/magicCircleNodes';

describe('magic circle node material', () => {
  it('exposes all frame-controlled uniforms for core and halo variants', () => {
    for (const variant of ['core', 'halo'] as const) {
      const { material, controls } = createMagicCircleNodeMaterial({ variant });
      expect(controls.progress.value).toBe(0);
      expect(controls.opacity.value).toBe(0);
      expect(controls.brightness.value).toBe(1);
      expect(controls.flow.value).toBe(0);
      expect(controls.flash.value).toBe(0);
      expect(controls.microMarkFraction.value).toBe(1);
      expect(controls.orbitLightCount.value).toBe(6);
      expect(controls.fieldProgress.value).toBe(0);
      expect(controls.dissolveProgress.value).toBe(0);
      expect(material.transparent).toBe(true);
      material.dispose();
    }
  });
});
