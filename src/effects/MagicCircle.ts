import {
  type BufferGeometry,
  Group,
  MathUtils,
  Mesh,
  type MeshBasicNodeMaterial,
} from 'three/webgpu';

import type { FrameSignals } from '../app/frameSignals';
import { QUALITY_PROFILES, type QualityTier } from '../quality/qualityProfiles';
import { LAYER_ORDER } from '../stage/layerOrder';
import { createStrokeRibbonGeometry } from './magicCircle/createStrokeRibbonGeometry';
import { type StarPathStage, pathsForStage } from './magicCircle/geometricStarPaths';
import { LightPillars } from './magicCircle/LightPillars';
import { getMagicCircleFrame, type MagicCircleFrame } from './magicCircle/magicCircleFrame';
import {
  createMagicCircleNodeMaterial,
  type MagicCircleNodeControls,
} from './magicCircle/magicCircleNodes';

interface RibbonPass {
  mesh: Mesh;
  geometry: BufferGeometry;
  material: MeshBasicNodeMaterial;
  controls: MagicCircleNodeControls;
}

interface RibbonLayer {
  group: Group;
  haloMinPillarLayers: 1 | 2 | 3;
  core: RibbonPass;
  halo: RibbonPass;
}

export interface MagicCircleSnapshot extends MagicCircleFrame {
  ringRotation: number;
  latticeRotation: number;
  orbitRotation: number;
  detailRotation: number;
  ribbonDrawCalls: number;
  totalDrawCalls: number;
  microMarkCount: number;
  orbitLightCount: number;
  pillarCount: number;
  pillarLayers: number;
  allocatedPillarObjects: number;
}

function makeRibbonLayer(
  name: string,
  stage: StarPathStage,
  coreWidth: number,
  renderOrder: number,
  haloMinPillarLayers: 1 | 2 | 3,
): RibbonLayer {
  const group = new Group();
  group.name = name;
  const paths = pathsForStage(stage);
  const make = (variant: 'core' | 'halo', width: number, order: number): RibbonPass => {
    const geometry = createStrokeRibbonGeometry(paths, width);
    const { material, controls } = createMagicCircleNodeMaterial({ variant });
    const mesh = new Mesh(geometry, material);
    mesh.name = `${name}-${variant}`;
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    group.add(mesh);
    return { mesh, geometry, material, controls };
  };
  return {
    group,
    haloMinPillarLayers,
    halo: make('halo', coreWidth * 4.5, renderOrder),
    core: make('core', coreWidth, renderOrder + 1),
  };
}

export class MagicCircle {
  readonly group = new Group();
  readonly #pillars = new LightPillars();
  readonly #rings = makeRibbonLayer(
    'magic-circle-rings',
    'rings',
    0.018,
    LAYER_ORDER.spellBack.min,
    1,
  );
  readonly #lattice = makeRibbonLayer(
    'magic-circle-lattice',
    'lattice',
    0.024,
    LAYER_ORDER.spellBack.min + 2,
    2,
  );
  readonly #details = makeRibbonLayer(
    'magic-circle-details',
    'details',
    0.012,
    LAYER_ORDER.spellBack.min + 4,
    3,
  );
  readonly #activeCaps = { ...QUALITY_PROFILES.compatibility.spellField };
  #frame = getMagicCircleFrame({
    nowMs: 0,
    deltaSeconds: 0,
    state: 'idle',
    charge: 0,
    dissolve: 0,
    summon: 0,
    pointerNdc: { x: 0, y: 0 },
  });

  constructor() {
    this.group.name = 'procedural-geometric-star-circle';
    this.group.position.y = 0.015;
    this.group.add(
      this.#pillars.group,
      this.#rings.group,
      this.#lattice.group,
      this.#details.group,
    );
    this.reset();
  }

  update(signals: FrameSignals, quality: QualityTier): void {
    this.#frame = getMagicCircleFrame(signals);
    Object.assign(this.#activeCaps, QUALITY_PROFILES[quality].spellField);
    this.group.scale.setScalar(this.#frame.releaseScale);
    this.#applyRibbon(this.#rings, this.#frame.ringProgress, this.#frame.ringOpacity);
    this.#applyRibbon(this.#lattice, this.#frame.latticeProgress, this.#frame.latticeOpacity);
    this.#applyRibbon(this.#details, this.#frame.detailProgress, this.#frame.detailOpacity);
    this.#pillars.update(this.#frame, quality);
    if (this.#frame.opacity === 0) return;

    const delta = Math.min(0.1, Math.max(0, signals.deltaSeconds));
    const speed = 0.35 + Math.min(1, Math.max(0, signals.charge)) * 0.65;
    this.#rings.group.rotation.y = MathUtils.euclideanModulo(
      this.#rings.group.rotation.y + delta * 0.07 * speed,
      Math.PI * 2,
    );
    this.#lattice.group.rotation.y = -MathUtils.euclideanModulo(
      -this.#lattice.group.rotation.y + delta * 0.045 * speed,
      Math.PI * 2,
    );
    this.#details.group.rotation.y = MathUtils.euclideanModulo(
      this.#details.group.rotation.y + delta * 0.09 * speed,
      Math.PI * 2,
    );
  }

  getSnapshot(): MagicCircleSnapshot {
    const pillarStats = this.#pillars.getStats();
    const ribbonDrawCalls = [this.#rings, this.#lattice, this.#details]
      .reduce(
        (sum, layer) => sum + Number(layer.core.mesh.visible) + Number(layer.halo.mesh.visible),
        0,
      );
    return {
      ...this.#frame,
      ringRotation: this.#rings.group.rotation.y,
      latticeRotation: this.#lattice.group.rotation.y,
      orbitRotation: this.#lattice.group.rotation.y,
      detailRotation: this.#details.group.rotation.y,
      ribbonDrawCalls,
      totalDrawCalls: ribbonDrawCalls + pillarStats.layerCount,
      microMarkCount: this.#activeCaps.microMarkCount,
      orbitLightCount: this.#activeCaps.orbitLightCount,
      pillarCount: pillarStats.pillarCount,
      pillarLayers: pillarStats.layerCount,
      allocatedPillarObjects: pillarStats.allocatedObjects,
    };
  }

  reset(): void {
    this.group.scale.setScalar(1);
    Object.assign(this.#activeCaps, QUALITY_PROFILES.compatibility.spellField);
    for (const layer of [this.#rings, this.#lattice, this.#details]) layer.group.rotation.y = 0;
    this.#frame = getMagicCircleFrame({
      nowMs: 0,
      deltaSeconds: 0,
      state: 'idle',
      charge: 0,
      dissolve: 0,
      summon: 0,
      pointerNdc: { x: 0, y: 0 },
    });
    this.#applyRibbon(this.#rings, this.#frame.ringProgress, this.#frame.ringOpacity);
    this.#applyRibbon(this.#lattice, this.#frame.latticeProgress, this.#frame.latticeOpacity);
    this.#applyRibbon(this.#details, this.#frame.detailProgress, this.#frame.detailOpacity);
    this.#pillars.reset();
  }

  dispose(): void {
    this.#pillars.dispose();
    for (const layer of [this.#rings, this.#lattice, this.#details]) {
      for (const pass of [layer.halo, layer.core]) {
        pass.geometry.dispose();
        pass.material.dispose();
      }
      layer.group.clear();
    }
    this.group.removeFromParent();
    this.group.clear();
  }

  #applyRibbon(layer: RibbonLayer, progress: number, opacity: number): void {
    const visible = progress > 0 && opacity > 0;
    for (const pass of [layer.halo, layer.core]) {
      pass.controls.progress.value = progress;
      pass.controls.opacity.value = opacity;
      pass.controls.brightness.value = this.#frame.brightness;
      pass.controls.flow.value = this.#frame.flow;
      pass.controls.flash.value = this.#frame.releaseFlash + this.#frame.chargeFlash;
      pass.controls.microMarkFraction.value = this.#activeCaps.microMarkCount / 24;
      pass.controls.orbitLightCount.value = this.#activeCaps.orbitLightCount;
      pass.controls.fieldProgress.value = this.#frame.fieldProgress;
      pass.controls.dissolveProgress.value = this.#frame.dissolveProgress;
      const qualityAllowsPass = pass === layer.core
        || this.#activeCaps.pillarLayers >= layer.haloMinPillarLayers;
      pass.mesh.visible = visible && qualityAllowsPass;
    }
  }
}
