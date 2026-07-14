import { AudioController } from '../audio/AudioController';
import type { CharacterDebugPose } from '../character/MagicalGirlRig';
import { WarmupController } from '../performance/WarmupController';
import type { WarmupReport } from '../performance/performanceTypes';
import { QUALITY_PROFILES, type QualityTier } from '../quality/qualityProfiles';
import { createPostProcessing } from '../rendering/createPostProcessing';
import { createRenderer } from '../rendering/createRenderer';
import type { PostProcessingPort } from '../rendering/PostProcessing';
import type { RendererHandle } from '../rendering/renderingTypes';
import { Stage } from '../stage/Stage';

export interface CreateExperienceOptions {
  canvas: HTMLCanvasElement;
  assets: ReadonlyMap<string, Uint8Array>;
  quality: QualityTier;
  forceWebGL?: boolean;
  characterPose?: CharacterDebugPose;
  showCat?: boolean;
  hideParticles?: boolean;
  injectPostProcessingFailure?: boolean;
  onRendererReady?: (handle: RendererHandle) => void;
  onWarmupReady?: (report: WarmupReport) => void;
}

export interface ExperienceRuntime {
  readonly renderer: RendererHandle;
  readonly stage: Stage;
  readonly postProcessing: PostProcessingPort;
  readonly audio: AudioController;
  readonly quality: QualityTier;
  setQuality(quality: QualityTier): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

export async function createExperience(options: CreateExperienceOptions): Promise<ExperienceRuntime> {
  const stage = new Stage({
    characterPose: options.characterPose,
    showCat: options.showCat,
    hideParticles: options.hideParticles,
  });
  let renderer: RendererHandle | null = null;
  let audio: AudioController | null = null;
  let postProcessing: PostProcessingPort | null = null;

  try {
    renderer = await createRenderer(options.canvas, {
      forceWebGL: options.forceWebGL ?? false,
      quality: options.quality,
    });
    options.onRendererReady?.(renderer);
    audio = await AudioController.create(options.assets);
    await stage.loadCharacters();
    const handle = renderer;
    const controller = audio;

    postProcessing = await createPostProcessing(
      handle.renderer,
      stage.scene,
      stage.cameraRig.camera,
      QUALITY_PROFILES[options.quality],
      options.injectPostProcessingFailure,
    );
    const resize = (width: number, height: number) => {
      handle.resize(width, height);
      stage.resize(width, height);
      postProcessing?.resize(width, height);
    };
    resize(window.innerWidth, window.innerHeight);
    const warmup = new WarmupController({
      prepareTextures: async () => {
        for (const texture of stage.getCharacterTextures()) handle.renderer.initTexture(texture);
        const backend = handle.renderer.backend as unknown as {
          gl?: { finish: () => void };
          device?: { queue?: { onSubmittedWorkDone?: () => Promise<void> } };
        };
        if (backend.gl) backend.gl.finish();
        else if (backend.device?.queue?.onSubmittedWorkDone) await backend.device.queue.onSubmittedWorkDone();
      },
      setQuality: (quality) => {
        handle.setQuality(quality);
        postProcessing?.setQuality(QUALITY_PROFILES[quality]);
        resize(window.innerWidth, window.innerHeight);
      },
      renderFrame: (signals, quality) => {
        stage.update(signals, quality);
        postProcessing?.update(signals);
        postProcessing?.render();
      },
      renderClosedEyesFrame: (signals, quality) => {
        stage.update(signals, quality);
        stage.showClosedEyesForWarmup();
        postProcessing?.update(signals);
        postProcessing?.render();
      },
      clearHistory: () => postProcessing?.clearHistory(),
      settle: async () => {
        await handle.renderer.compileAsync(stage.scene, stage.cameraRig.camera, stage.scene);
        const backend = handle.renderer.backend as unknown as {
          gl?: { finish: () => void };
          device?: { queue?: { onSubmittedWorkDone?: () => Promise<void> } };
        };
        if (backend.gl) backend.gl.finish();
        else if (backend.device?.queue?.onSubmittedWorkDone) await backend.device.queue.onSubmittedWorkDone();
      },
    });
    const warmupReport = await warmup.prepare(options.quality);
    stage.keepCatResident();
    stage.reset();
    options.onWarmupReady?.(warmupReport);

    let disposed = false;
    let currentQuality = options.quality;
    return {
      renderer: handle,
      stage,
      postProcessing,
      audio: controller,
      get quality() { return currentQuality; },
      setQuality: (quality) => {
        if (quality === currentQuality) return;
        currentQuality = quality;
        handle.setQuality(quality);
        postProcessing?.setQuality(QUALITY_PROFILES[quality]);
        resize(window.innerWidth, window.innerHeight);
      },
      resize,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        postProcessing?.dispose();
        controller.dispose();
        stage.dispose();
        handle.dispose();
      },
    };
  } catch (error) {
    postProcessing?.dispose();
    audio?.dispose();
    stage.dispose();
    renderer?.dispose();
    throw error;
  }
}
