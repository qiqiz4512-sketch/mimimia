import {
  Group,
  InstancedBufferAttribute,
  PointsNodeMaterial,
  Sprite,
} from 'three/webgpu';

import type { FrameSignals } from '../app/frameSignals';
import { EXPERIENCE_TIMING } from '../config/experience';
import { QUALITY_PROFILES, type QualityTier } from '../quality/qualityProfiles';
import { LAYER_ORDER } from '../stage/layerOrder';
import { getMagicCircleFrame } from './magicCircle/magicCircleFrame';
import { ParticlePool } from './ParticlePool';
import { createParticleNodeMaterial, type ParticleNodeAttributes, type ParticleNodeControls } from './particleNodes';
import {
  createSemanticParticleLayouts,
  type ParticleLayoutPoint,
  type SpellParticleKind,
} from './seededRandom';

export type ParticleBurstKind = 'release-flash' | 'fill-rise' | 'cat-settle';

export interface ParticleSystemStats {
  quality: QualityTier;
  capacity: number;
  activeCount: number;
  allocatedObjects: number;
  dustCount: number;
  risingLightCount: number;
  starFlareCount: number;
  drawCalls: 3;
  mode: 'gather' | ParticleBurstKind;
}

interface ParticleLayer {
  kind: SpellParticleKind;
  capacity: number;
  sprite: Sprite;
  material: PointsNodeMaterial;
  controls: ParticleNodeControls;
}

const BURST_MODE: Record<ParticleBurstKind, number> = { 'release-flash': 1, 'fill-rise': 2, 'cat-settle': 3 };
const SUMMON_PARTICLE_PHASES = [
  { kind: 'release-flash', startMs: EXPERIENCE_TIMING.releaseHoldMs, durationMs: 620 },
  { kind: 'fill-rise', startMs: EXPERIENCE_TIMING.fillStartMs, durationMs: 1_140 },
  { kind: 'cat-settle', startMs: EXPERIENCE_TIMING.catMoveStartMs, durationMs: 860 },
] as const;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};
const getSummonElapsedMs = (summon: number) => Math.round(
  clamp01(summon) * EXPERIENCE_TIMING.summonEndMs * 1_000_000,
) / 1_000_000;

function chargeDensity(charge: number): number {
  const progress = clamp01(charge);
  if (progress <= 0.32) return 0.16 * progress / 0.32;
  if (progress <= 0.68) return 0.16 + 0.54 * (progress - 0.32) / 0.36;
  return 0.7 + 0.3 * (progress - 0.68) / 0.32;
}

function createAttributes(layout: readonly ParticleLayoutPoint[]): ParticleNodeAttributes {
  const origins = new Float32Array(layout.length * 3);
  const targets = new Float32Array(layout.length * 3);
  const seeds = new Float32Array(layout.length);
  const sizes = new Float32Array(layout.length);
  layout.forEach((point, index) => {
    origins.set(point.origin, index * 3);
    targets.set(point.target, index * 3);
    seeds[index] = point.seed;
    sizes[index] = point.size;
  });
  return {
    origins: new InstancedBufferAttribute(origins, 3),
    targets: new InstancedBufferAttribute(targets, 3),
    seeds: new InstancedBufferAttribute(seeds, 1),
    sizes: new InstancedBufferAttribute(sizes, 1),
  };
}

export function getSummonParticlePhase(signals: FrameSignals):
  { kind: ParticleBurstKind; progress: number } | null {
  if (signals.state !== 'summoning') return null;
  const elapsedMs = getSummonElapsedMs(signals.summon);
  let active: { kind: ParticleBurstKind; progress: number } | null = null;
  for (const phase of SUMMON_PARTICLE_PHASES) {
    if (elapsedMs >= phase.startMs && elapsedMs < phase.startMs + phase.durationMs) {
      active = { kind: phase.kind, progress: clamp01((elapsedMs - phase.startMs) / phase.durationMs) };
    }
  }
  return active;
}

export class ParticleSystem {
  readonly group = new Group();
  readonly #pool = new ParticlePool(QUALITY_PROFILES.high.burstParticles, (index) => index);
  readonly #layouts: ReturnType<typeof createSemanticParticleLayouts>;
  readonly #layers: ParticleLayer[] = [];
  #quality: QualityTier = 'high';
  #mode: 'gather' | ParticleBurstKind = 'gather';
  #counts = { dust: 0, riser: 0, flare: 0 };
  #allocatedObjects = 0;

  constructor(seed = 0x4d4f4f4e) {
    this.group.name = 'pooled-spell-particles';
    this.#layouts = createSemanticParticleLayouts(seed, {
      dust: QUALITY_PROFILES.high.burstParticles,
      riser: QUALITY_PROFILES.high.spellField.risingLightCount,
      flare: QUALITY_PROFILES.high.spellField.starFlareCount,
    });
    for (const kind of ['dust', 'riser', 'flare'] as const) {
      const attributes = createAttributes(this.#layouts[kind]);
      const { material, controls } = createParticleNodeMaterial(attributes, kind);
      const sprite = new Sprite(material);
      sprite.name = `spell-particles-${kind}`;
      sprite.count = 0;
      sprite.renderOrder = LAYER_ORDER.foregroundStardust.min + this.#layers.length;
      sprite.frustumCulled = false;
      this.group.add(sprite);
      this.#layers.push({ kind, capacity: this.#layouts[kind].length, sprite, material, controls });
    }
    this.#allocatedObjects = 1 + this.#layers.length;
  }

  update(signals: FrameSignals, quality: QualityTier): void {
    this.#quality = quality;
    this.#mode = 'gather';
    const caps = QUALITY_PROFILES[quality];
    const magicFrame = getMagicCircleFrame(signals);
    const density = chargeDensity(signals.charge);
    const fieldOpacity = magicFrame.dustOpacity;
    const flareOpacity = signals.state === 'dissolving'
      ? 1 - smoothstep(signals.dissolve / 0.25)
      : fieldOpacity;
    let counts = {
      dust: Math.round(caps.gatherStardust * density * fieldOpacity),
      riser: Math.round(caps.spellField.risingLightCount * density * fieldOpacity),
      flare: Math.round(caps.spellField.starFlareCount
        * smoothstep((signals.charge - 0.68) / 0.32) * flareOpacity),
    };
    let burstProgress = 0;
    let opacity = fieldOpacity;

    if (signals.state === 'summoning') {
      const elapsedMs = getSummonElapsedMs(signals.summon);
      const phase = getSummonParticlePhase(signals);
      if (phase) {
        this.#mode = phase.kind;
        burstProgress = phase.progress;
        const phaseOpacity = 1 - smoothstep((burstProgress - 0.72) / 0.28);
        counts = {
          dust: Math.round(caps.burstParticles * magicFrame.dustOpacity),
          riser: Math.round(caps.spellField.risingLightCount * magicFrame.dustOpacity),
          flare: Math.round(caps.spellField.starFlareCount * magicFrame.dustOpacity * phaseOpacity),
        };
        opacity = magicFrame.dustOpacity * phaseOpacity;
      } else if (elapsedMs >= EXPERIENCE_TIMING.catMoveEndMs && elapsedMs < EXPERIENCE_TIMING.summonEndMs) {
        counts = {
          dust: Math.round(caps.gatherStardust * 0.12 * magicFrame.dustOpacity),
          riser: 0,
          flare: 0,
        };
        opacity = magicFrame.dustOpacity;
      } else if (elapsedMs >= EXPERIENCE_TIMING.summonEndMs) {
        counts = { dust: 0, riser: 0, flare: 0 };
        opacity = 0;
      }
    } else if (signals.state !== 'charging' && signals.state !== 'charged' && signals.state !== 'dissolving') {
      counts = { dust: 0, riser: 0, flare: 0 };
      opacity = 0;
    }

    this.#setCounts(counts);
    for (const { controls } of this.#layers) {
      controls.time.value = signals.nowMs / 1_000;
      controls.charge.value = clamp01(signals.charge);
      controls.dissolve.value = signals.state === 'dissolving' ? clamp01(signals.dissolve) : 0;
      controls.burstProgress.value = burstProgress;
      controls.mode.value = this.#mode === 'gather' ? 0 : BURST_MODE[this.#mode];
      controls.opacity.value = opacity;
    }
  }

  getLayoutSample(count: number): ParticleLayoutPoint[] {
    return this.#layouts.dust.slice(0, Math.max(0, count)).map((point) => ({
      ...point,
      origin: [...point.origin],
      target: [...point.target],
    }));
  }

  getStats(): ParticleSystemStats {
    return {
      quality: this.#quality,
      capacity: QUALITY_PROFILES.high.burstParticles
        + QUALITY_PROFILES.high.spellField.risingLightCount
        + QUALITY_PROFILES.high.spellField.starFlareCount,
      activeCount: this.#counts.dust + this.#counts.riser + this.#counts.flare,
      allocatedObjects: this.#allocatedObjects,
      dustCount: this.#counts.dust,
      risingLightCount: this.#counts.riser,
      starFlareCount: this.#counts.flare,
      drawCalls: 3,
      mode: this.#mode,
    };
  }

  reset(): void {
    this.#mode = 'gather';
    this.#setCounts({ dust: 0, riser: 0, flare: 0 });
    this.#layers.forEach(({ controls }) => {
      controls.time.value = 0;
      controls.charge.value = 0;
      controls.dissolve.value = 0;
      controls.burstProgress.value = 0;
      controls.mode.value = 0;
      controls.opacity.value = 0;
    });
  }

  dispose(): void {
    this.group.removeFromParent();
    this.#layers.forEach(({ material, sprite }) => {
      material.dispose();
      sprite.removeFromParent();
    });
    this.#layers.length = 0;
    this.group.clear();
    this.#pool.releaseAll();
  }

  #setCounts(counts: { dust: number; riser: number; flare: number }): void {
    this.#pool.setActiveCount(counts.dust);
    const byKind = {
      dust: this.#pool.getStats().activeCount,
      riser: counts.riser,
      flare: counts.flare,
    } as const;
    this.#layers.forEach(({ kind, capacity, sprite }) => {
      sprite.count = Math.max(0, Math.min(capacity, byKind[kind]));
    });
    this.#counts = { dust: byKind.dust, riser: byKind.riser, flare: byKind.flare };
  }
}
