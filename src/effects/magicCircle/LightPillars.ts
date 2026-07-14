import { Group, Mesh } from 'three/webgpu';

import type { QualityTier } from '../../quality/qualityProfiles';
import { QUALITY_PROFILES } from '../../quality/qualityProfiles';
import { LAYER_ORDER } from '../../stage/layerOrder';
import type { MagicCircleFrame } from './magicCircleFrame';
import { createLightPillarGeometry } from './lightPillarGeometry';
import { createLightPillarNodeMaterial } from './lightPillarNodes';

export interface LightPillarStats {
  pillarCount: number;
  layerCount: number;
  allocatedObjects: number;
}

export class LightPillars {
  readonly group = new Group();
  readonly #layers = [0, 1, 2].map((layer) => {
    const geometry = createLightPillarGeometry([0.7, 1.7, 2.8][layer], [0.92, 1, 1.18][layer]);
    const { material, controls } = createLightPillarNodeMaterial(layer as 0 | 1 | 2);
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = LAYER_ORDER.characterBack.max - layer;
    this.group.add(mesh);
    return { geometry, material, controls, mesh };
  });
  #stats: LightPillarStats = { pillarCount: 0, layerCount: 0, allocatedObjects: 4 };

  update(frame: MagicCircleFrame, quality: QualityTier): void {
    const caps = QUALITY_PROFILES[quality].spellField;
    const active = frame.fieldProgress > 0 && frame.pillarOpacity > 0;
    this.#stats = {
      pillarCount: active ? caps.pillarCount : 0,
      layerCount: active ? caps.pillarLayers : 0,
      allocatedObjects: 4,
    };

    this.#layers.forEach((layer, index) => {
      layer.mesh.visible = active && index < caps.pillarLayers;
      layer.geometry.setDrawRange(0, caps.pillarCount * 6);
      layer.controls.opacity.value = frame.pillarOpacity;
      layer.controls.rise.value = frame.fieldProgress;
      layer.controls.time.value = frame.flow;
      layer.controls.convergence.value = frame.pillarConvergence;
    });
  }

  getStats(): LightPillarStats {
    return { ...this.#stats };
  }

  reset(): void {
    this.#stats = { pillarCount: 0, layerCount: 0, allocatedObjects: 4 };
    this.#layers.forEach(({ mesh, controls }) => {
      mesh.visible = false;
      controls.opacity.value = 0;
      controls.rise.value = 0;
      controls.time.value = 0;
      controls.convergence.value = 0;
    });
  }

  dispose(): void {
    this.#layers.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
    this.group.removeFromParent();
    this.group.clear();
  }
}
