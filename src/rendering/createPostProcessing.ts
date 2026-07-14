import type { Camera, Scene, WebGPURenderer } from 'three/webgpu';

import type { QualityProfile } from '../quality/qualityProfiles';
import { DirectPostProcessing } from './DirectPostProcessing';
import { PostProcessing, type PostProcessingPort } from './PostProcessing';

export async function createPostProcessing(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  profile: QualityProfile,
  injectFailure = false,
): Promise<PostProcessingPort> {
  let pipeline: PostProcessing | null = null;
  try {
    if (injectFailure) throw new Error('Injected postprocessing initialization failure');
    pipeline = new PostProcessing(renderer, scene, camera, profile);
    await pipeline.precompile();
    return pipeline;
  } catch (error) {
    pipeline?.dispose();
    console.warn('Postprocessing unavailable; using direct rendering', error);
    const fallback = new DirectPostProcessing(renderer, scene, camera, profile);
    await fallback.precompile();
    return fallback;
  }
}
