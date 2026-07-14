import { WebGPURenderer } from 'three/webgpu';

import { QUALITY_PROFILES } from '../quality/qualityProfiles';
import type { BackendKind, CreateRendererOptions, RendererHandle } from './renderingTypes';

const CLEAR_COLOR = 0x120a2d;

interface DetectableBackend {
  isWebGPUBackend?: boolean;
  isWebGLBackend?: boolean;
}

export function requiresStableSafariWebGL(userAgent: string): boolean {
  return /\bSafari\/[\d.]+/.test(userAgent)
    && !/\b(?:Chrome|Chromium|CriOS|Edg|EdgiOS|Firefox|FxiOS|OPR)\//.test(userAgent);
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  options: CreateRendererOptions,
): Promise<RendererHandle> {
  const stableSafariWebGL = requiresStableSafariWebGL(globalThis.navigator?.userAgent ?? '');
  const stableSafariContext = stableSafariWebGL
    ? canvas.getContext('webgl2', {
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      })
    : null;
  if (stableSafariWebGL && !stableSafariContext) {
    throw new Error('Safari did not provide a stable WebGL 2 context');
  }

  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    alpha: false,
    forceWebGL: options.forceWebGL || stableSafariWebGL,
    ...(stableSafariContext ? { context: stableSafariContext as never } : {}),
  });
  await renderer.init();

  const detected = renderer.backend as DetectableBackend;
  let backend: BackendKind;
  if (detected.isWebGPUBackend === true) backend = 'webgpu';
  else if (detected.isWebGLBackend === true) backend = 'webgl2';
  else {
    renderer.dispose();
    throw new Error('Renderer initialized without a recognized backend');
  }

  let profile = QUALITY_PROFILES[options.quality];
  const resize = (cssWidth: number, cssHeight: number) => {
    const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, profile.pixelRatioMax);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(
      Math.max(1, Math.round(cssWidth * profile.renderScale)),
      Math.max(1, Math.round(cssHeight * profile.renderScale)),
      false,
    );
    renderer.clear(true, true, true);
  };

  renderer.setClearColor(CLEAR_COLOR, 1);

  return {
    renderer,
    backend,
    resize,
    setQuality: (quality) => { profile = QUALITY_PROFILES[quality]; },
    dispose: () => renderer.dispose(),
  };
}
