import type { Camera, Scene, WebGPURenderer } from 'three/webgpu';

import type { FrameSignals } from '../app/frameSignals';
import type { QualityProfile } from '../quality/qualityProfiles';
import { DirectPostProcessing } from './DirectPostProcessing';
import {
  PostProcessing,
  type PostProcessingPort,
  type PostProcessingSnapshot,
} from './PostProcessing';

export class RuntimeFallbackPostProcessing implements PostProcessingPort {
  readonly #primary: PostProcessingPort;
  readonly #fallback: PostProcessingPort;
  readonly #warn: (message: string, error: unknown) => void;
  readonly #injectFirstRenderFailure: boolean;
  #usingFallback = false;
  #primaryDisposed = false;
  #renderAttempted = false;

  constructor(
    primary: PostProcessingPort,
    fallback: PostProcessingPort,
    warn: (message: string, error: unknown) => void = (message, error) => console.warn(message, error),
    injectFirstRenderFailure = false,
  ) {
    this.#primary = primary;
    this.#fallback = fallback;
    this.#warn = warn;
    this.#injectFirstRenderFailure = injectFirstRenderFailure;
  }

  async precompile(): Promise<void> {
    await Promise.all([this.#primary.precompile(), this.#fallback.precompile()]);
  }

  setQuality(profile: QualityProfile): void {
    if (!this.#usingFallback) this.#primary.setQuality(profile);
    this.#fallback.setQuality(profile);
  }

  update(signals: FrameSignals): void {
    if (!this.#usingFallback) this.#primary.update(signals);
    this.#fallback.update(signals);
  }

  render(): void {
    if (this.#usingFallback) {
      this.#fallback.render();
      return;
    }
    try {
      if (this.#injectFirstRenderFailure && !this.#renderAttempted) {
        this.#renderAttempted = true;
        throw new Error('Injected postprocessing first-render failure');
      }
      this.#renderAttempted = true;
      this.#primary.render();
    } catch (error) {
      this.#warn('Postprocessing render failed; using direct rendering', error);
      this.#usingFallback = true;
      this.#disposePrimary();
      this.#fallback.render();
    }
  }

  clearHistory(): void {
    if (!this.#usingFallback) this.#primary.clearHistory();
    this.#fallback.clearHistory();
  }

  resize(width: number, height: number): void {
    if (!this.#usingFallback) this.#primary.resize(width, height);
    this.#fallback.resize(width, height);
  }

  getSnapshot(): PostProcessingSnapshot {
    return (this.#usingFallback ? this.#fallback : this.#primary).getSnapshot();
  }

  dispose(): void {
    this.#disposePrimary();
    this.#fallback.dispose();
  }

  #disposePrimary(): void {
    if (this.#primaryDisposed) return;
    this.#primaryDisposed = true;
    this.#primary.dispose();
  }
}

export async function createPostProcessing(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  profile: QualityProfile,
  injectFailure = false,
  injectRenderFailure = false,
): Promise<PostProcessingPort> {
  let pipeline: PostProcessing | null = null;
  let fallback: DirectPostProcessing | null = null;
  try {
    if (injectFailure) throw new Error('Injected postprocessing initialization failure');
    pipeline = new PostProcessing(renderer, scene, camera, profile);
    fallback = new DirectPostProcessing(renderer, scene, camera, profile);
    const resilient = new RuntimeFallbackPostProcessing(
      pipeline,
      fallback,
      (message, error) => console.warn(message, error),
      injectRenderFailure,
    );
    await resilient.precompile();
    return resilient;
  } catch (error) {
    pipeline?.dispose();
    fallback?.dispose();
    console.warn('Postprocessing unavailable; using direct rendering', error);
    const direct = new DirectPostProcessing(renderer, scene, camera, profile);
    await direct.precompile();
    return direct;
  }
}
