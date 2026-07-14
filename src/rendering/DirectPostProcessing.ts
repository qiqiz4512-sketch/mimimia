import {
  type Camera,
  type Scene,
  type WebGPURenderer,
} from 'three/webgpu';

import type { FrameSignals } from '../app/frameSignals';
import { QUALITY_PROFILES, type QualityProfile, type QualityTier } from '../quality/qualityProfiles';
import {
  tierForProfile,
  type PostProcessingPort,
  type PostProcessingSnapshot,
} from './PostProcessing';
import { getPostProcessingFrame } from './postprocessingNodes';

const IDLE_SIGNALS: FrameSignals = {
  nowMs: 0,
  deltaSeconds: 0,
  state: 'idle',
  charge: 0,
  dissolve: 0,
  summon: 0,
  pointerNdc: { x: 0, y: 0 },
};

export class DirectPostProcessing implements PostProcessingPort {
  readonly #renderer: WebGPURenderer;
  readonly #scene: Scene;
  readonly #camera: Camera;
  #quality: QualityTier;
  #frame = getPostProcessingFrame(IDLE_SIGNALS, QUALITY_PROFILES.compatibility);

  constructor(
    renderer: WebGPURenderer,
    scene: Scene,
    camera: Camera,
    profile: QualityProfile,
  ) {
    this.#renderer = renderer;
    this.#scene = scene;
    this.#camera = camera;
    this.#quality = tierForProfile(profile);
  }

  precompile(): Promise<void> {
    return this.#renderer.compileAsync(this.#scene, this.#camera, this.#scene);
  }

  setQuality(profile: QualityProfile): void {
    this.#quality = tierForProfile(profile);
  }

  update(signals: FrameSignals): void {
    this.#frame = {
      ...getPostProcessingFrame(signals, QUALITY_PROFILES[this.#quality]),
      bloomStrength: 0,
      distortionStrength: 0,
      chromaticAberration: 0,
      afterImageDamp: 0,
    };
  }

  render(): void {
    this.#renderer.render(this.#scene, this.#camera);
  }

  clearHistory(): void {}

  resize(width: number, height: number): void {
    void width;
    void height;
  }

  getSnapshot(): PostProcessingSnapshot {
    return {
      quality: this.#quality,
      renderPath: 'direct-fallback',
      distortion: 'off',
      afterImage: false,
      bloomResolutionScale: 0,
      ...this.#frame,
    };
  }

  dispose(): void {}
}
