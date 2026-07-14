import { describe, expect, it } from 'vitest';

import type { FrameSignals } from '../../../src/app/frameSignals';
import { QUALITY_PROFILES } from '../../../src/quality/qualityProfiles';
import type { PostProcessingPort, PostProcessingSnapshot } from '../../../src/rendering/PostProcessing';
import { RuntimeFallbackPostProcessing } from '../../../src/rendering/createPostProcessing';

const SIGNALS: FrameSignals = {
  nowMs: 1_000,
  deltaSeconds: 1 / 60,
  state: 'charged',
  charge: 1,
  dissolve: 0,
  summon: 0,
  pointerNdc: { x: 0, y: 0 },
};

class RecordingPostProcessing implements PostProcessingPort {
  renderCount = 0;
  updateCount = 0;
  disposeCount = 0;

  constructor(
    readonly renderPath: PostProcessingSnapshot['renderPath'],
    readonly failRender = false,
  ) {}

  precompile(): Promise<void> { return Promise.resolve(); }
  setQuality(): void {}
  update(): void { this.updateCount += 1; }
  render(): void {
    this.renderCount += 1;
    if (this.failRender) throw new Error('pipeline draw failed');
  }
  clearHistory(): void {}
  resize(): void {}
  getSnapshot(): PostProcessingSnapshot {
    return {
      quality: 'compatibility',
      renderPath: this.renderPath,
      energy: 0,
      bloomStrength: 0,
      distortionStrength: 0,
      distortionTimeSeconds: 0,
      chromaticAberration: 0,
      afterImageDamp: 0,
      distortion: 'off',
      afterImage: false,
      bloomResolutionScale: 0,
    };
  }
  dispose(): void { this.disposeCount += 1; }
}

describe('runtime postprocessing fallback', () => {
  it('switches permanently to direct rendering when the first pipeline draw throws', () => {
    const pipeline = new RecordingPostProcessing('r185-render-pipeline', true);
    const direct = new RecordingPostProcessing('direct-fallback');
    const resilient = new RuntimeFallbackPostProcessing(pipeline, direct, () => {});

    resilient.setQuality(QUALITY_PROFILES.compatibility);
    resilient.update(SIGNALS);
    resilient.render();
    resilient.render();

    expect(pipeline.renderCount).toBe(1);
    expect(pipeline.disposeCount).toBe(1);
    expect(direct.updateCount).toBe(1);
    expect(direct.renderCount).toBe(2);
    expect(resilient.getSnapshot().renderPath).toBe('direct-fallback');
  });

  it('can inject the same first-draw failure for browser acceptance', () => {
    const pipeline = new RecordingPostProcessing('r185-render-pipeline');
    const direct = new RecordingPostProcessing('direct-fallback');
    const resilient = new RuntimeFallbackPostProcessing(pipeline, direct, () => {}, true);

    resilient.update(SIGNALS);
    resilient.render();

    expect(pipeline.renderCount).toBe(0);
    expect(direct.renderCount).toBe(1);
    expect(resilient.getSnapshot().renderPath).toBe('direct-fallback');
  });
});
