# Geometric Starlight Magic Circle Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current blue-violet cat-eye/moon-phase line circle with an original warm white-gold geometric star field composed of five ring bands, three twelve-point lattices, vertical light pillars, three semantic stardust layers, and a release flash while preserving the existing interaction, summon timing, quality tiers, WebGL 2 fallback, reset, recovery, and privacy boundaries.

**Architecture:** Keep the state machine and `FrameSignals` as the sole timing source. Split the spell into pure layout data, ribbon geometry, a pure frame mapper, batched star-circle meshes, a three-layer light-pillar module, and semantic particle layers; `MagicCircle` remains the orchestration boundary and `Stage` remains the only scene integration point. Use Three.js r185 WebGPU classes and TSL node materials for both WebGPU and WebGL 2, with no new runtime image assets.

**Tech Stack:** TypeScript 5.9, Three.js/TSL 0.185.1, Vite 7.3, Vitest 3.2, Playwright 1.61, Sharp 0.34, GitHub Pages.

## Global Constraints

- The approved design is `docs/superpowers/specs/2026-07-14-geometric-starlight-magic-circle-redesign-design.md`.
- Keep `EXPERIENCE_TIMING.chargeMs=2500`, boundaries `0.32` and `0.68`, `dissolveMs=1000`, and `summonEndMs=2600` unchanged.
- `FrameSignals` remains the only animation source; do not add another `requestAnimationFrame`, charge accumulator, or independent summon timeline.
- Three.js must remain pinned to `0.185.1`; do not add dependencies.
- Use `three/webgpu` and TSL only; `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`, and `EffectComposer` remain forbidden.
- The maximum ground-path radius is `2.304`; the group base remains `y=0.015`.
- Use only original non-linguistic geometry; do not add cat-eye, moon-phase, religious, astrological, or copied reference symbols.
- Do not add the user reference image, `.superpowers/`, temporary comparisons, or private reference paths to git, `public/`, build output, release packages, screenshots, or documentation attachments.
- Keep face/chest added-highlight coverage at or below `8%` in charged and summoning states.
- High, balanced, and compatibility tiers keep identical state transitions, critical timings, camera framing, main star lattices, summon path, and reset behavior.
- Forced WebGL 2 must complete charging, early dissolve, charged hold, summon, cat interaction, reset, quality handling, failure handling, and focus interruption.
- Preserve the user-owned untracked `docs/superpowers/plans/2026-07-13-magical-girl-summoning-prototype.md`; stage only files named by each task.

## File Structure

| File | Responsibility |
|---|---|
| `src/effects/magicCircle/geometricStarPaths.ts` | Pure original path data for five rings, three lattices, three orbits, 48 ticks, 24 micro-marks, and 12 lock nodes. |
| `src/effects/magicCircle/createStrokeRibbonGeometry.ts` | Convert paths to indexed ribbon triangles with arc, edge, role, and stage attributes. |
| `src/effects/magicCircle/magicCircleNodes.ts` | TSL line-core and halo materials driven by progress, opacity, brightness, flow, and flash uniforms. |
| `src/effects/magicCircle/magicCircleFrame.ts` | Pure charge, dissolve, charged-hold, and summon mapping. |
| `src/effects/magicCircle/lightPillarGeometry.ts` | Prebuilt capacity for five vertical quads per pillar layer. |
| `src/effects/magicCircle/lightPillarNodes.ts` | TSL vertical gradient, soft edge, upward bands, convergence, and rise controls. |
| `src/effects/magicCircle/LightPillars.ts` | Own three preallocated pillar layers and apply quality/frame values. |
| `src/effects/MagicCircle.ts` | Orchestrate ring/lattice/detail meshes and `LightPillars`; expose diagnostics/reset/dispose. |
| `src/effects/seededRandom.ts` | Add deterministic semantic dust/riser/flare layouts without changing existing seed behavior. |
| `src/effects/particleNodes.ts` | Render warm-white semantic dust, rising lights, flares, and existing summon bursts. |
| `src/effects/ParticleSystem.ts` | Own three semantic particle draws, quality counts, bursts, diagnostics, reset, and dispose. |
| `src/quality/qualityProfiles.ts` | Add exact pillar, micro-mark, orbit-light, riser, and flare caps for each tier. |
| `src/rendering/postprocessingNodes.ts` | Map charged field and release flash to bounded bloom/distortion values. |
| `src/rendering/PostProcessing.ts` | Apply the revised bloom radius/threshold without changing the render pipeline. |
| `src/stage/Stage.ts` | Pass quality to the magic circle and keep scene/reset/dispose ordering. |
| `tests/unit/effects/*.test.ts` | Exact layout, ribbon, frame, pillar, particle, reset, and disposal contracts. |
| `tests/unit/quality/qualityProfiles.test.ts` | Exact tier caps and shared timing/composition invariants. |
| `tests/unit/rendering/postprocessingConfig.test.ts` | Bounded charged and summon bloom behavior. |
| `tests/e2e/*.spec.ts` | Real browser phase, fallback, dissolve, summon, reset, quality, audio, failure, and interruption behavior. |
| `tests/visual/*.spec.ts` and snapshots | Multi-viewport/tier visual regression and total-effect occlusion checks. |
| `docs/reports/visual-review-report.md` | Record the new local reference comparison and visual matrix results without embedding the reference. |
| `docs/reports/release-checklist.md` | Record final regression, privacy, performance, browser, deployment, and public URL verification. |

---

### Task 1: Generate the Original Geometric Star Layout

**Files:**
- Create: `src/effects/magicCircle/geometricStarPaths.ts`
- Create: `tests/unit/effects/GeometricStarPaths.test.ts`

**Interfaces:**
- Consumes: no runtime state.
- Produces: `MAGIC_CIRCLE_MAX_RADIUS`, `StarPathCategory`, `StarPathRole`, `StarPathStage`, `StarPoint`, `StarPath`, `GEOMETRIC_STAR_PATHS`, and `pathsForStage(stage)`.

- [ ] **Step 1: Write the failing layout test**

```ts
import { describe, expect, it } from 'vitest';

import {
  GEOMETRIC_STAR_PATHS,
  MAGIC_CIRCLE_MAX_RADIUS,
  pathsForStage,
} from '../../../src/effects/magicCircle/geometricStarPaths';

describe('geometric star layout', () => {
  it('contains the exact approved original geometry inventory', () => {
    const count = (category: string) => GEOMETRIC_STAR_PATHS.filter((path) => path.category === category).length;
    expect(count('ring')).toBe(5);
    expect(count('star-lattice')).toBe(3);
    expect(count('orbit')).toBe(3);
    expect(count('major-tick')).toBe(12);
    expect(count('minor-tick')).toBe(36);
    expect(count('micro-mark')).toBe(24);
    expect(count('lock-node')).toBe(12);
    expect(count('float-fragment')).toBe(12);
    const rings = GEOMETRIC_STAR_PATHS.filter((path) => path.category === 'ring');
    expect(rings.every((path) => path.segmentPairs)).toBe(true);
    expect(new Set(rings.map((path) => `${path.dashCount}:${path.dashDuty}`)).size).toBe(5);
    expect(GEOMETRIC_STAR_PATHS.filter((path) => path.category === 'float-fragment')
      .every((path) => (path.height ?? 0) >= 0.04 && (path.height ?? 0) <= 0.18)).toBe(true);
    expect(GEOMETRIC_STAR_PATHS
      .filter((path) => path.category === 'star-lattice')
      .map((path) => path.latticeStep)).toEqual([2, 3, 5]);
    expect(GEOMETRIC_STAR_PATHS.map((path) => path.latticeStep)).not.toContain(4);
    const orbits = GEOMETRIC_STAR_PATHS.filter((path) => path.category === 'orbit');
    expect(orbits.every((path) => path.segmentPairs && path.points.length === 96)).toBe(true);
    expect(orbits.every((path) => path.offsetX !== 0 || path.offsetY !== 0)).toBe(true);
    const dissolveRanks = GEOMETRIC_STAR_PATHS
      .filter((path) => path.stage === 'details')
      .map((path) => path.dissolveRank ?? 1);
    expect(Math.min(...dissolveRanks)).toBeGreaterThanOrEqual(0.25);
    expect(Math.max(...dissolveRanks)).toBeLessThanOrEqual(0.63);
    expect(pathsForStage('rings').length).toBeGreaterThan(0);
    expect(pathsForStage('lattice').length).toBeGreaterThan(0);
    expect(pathsForStage('details').length).toBeGreaterThan(0);
    expect(new Set(pathsForStage('rings').map((path) => path.drawStart)).size).toBeGreaterThan(1);
    for (const path of GEOMETRIC_STAR_PATHS) {
      expect(path.drawStart).toBeGreaterThanOrEqual(0);
      expect(path.drawEnd).toBeLessThanOrEqual(1);
      expect(path.drawEnd).toBeGreaterThan(path.drawStart);
    }
  });

  it('stays inside the approved radius and contains no retired motif ids', () => {
    expect(MAGIC_CIRCLE_MAX_RADIUS).toBe(2.304);
    for (const path of GEOMETRIC_STAR_PATHS) {
      expect(path.id).not.toMatch(/cat|eye|moon|phase|rune|glyph/i);
      for (const point of path.points) {
        expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(MAGIC_CIRCLE_MAX_RADIUS);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `npm run test:unit -- --run tests/unit/effects/GeometricStarPaths.test.ts`

Expected: FAIL because `geometricStarPaths.ts` does not exist.

- [ ] **Step 3: Implement the path model and deterministic generators**

```ts
export const MAGIC_CIRCLE_MAX_RADIUS = 2.304;
const TAU = Math.PI * 2;

export type StarPathCategory =
  | 'ring' | 'star-lattice' | 'orbit'
  | 'major-tick' | 'minor-tick' | 'micro-mark' | 'lock-node' | 'float-fragment';
export type StarPathRole = 'primary' | 'secondary' | 'detail';
export type StarPathStage = 'rings' | 'lattice' | 'details';

export interface StarPoint { x: number; y: number; pathArc?: number }
export interface StarPath {
  id: string;
  category: StarPathCategory;
  role: StarPathRole;
  stage: StarPathStage;
  points: StarPoint[];
  drawStart: number;
  drawEnd: number;
  closed?: boolean;
  segmentPairs?: boolean;
  latticeStep?: 2 | 3 | 5;
  microRank?: number;
  orbitBase?: 0 | 2 | 4;
  flowSpeed?: number;
  fieldChannel?: 0 | 1;
  offsetX?: number;
  offsetY?: number;
  height?: number;
  dashCount?: number;
  dashDuty?: number;
  dissolveRank?: number;
}

function polar(radius: number, angle: number): StarPoint {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function circle(
  id: string, radius: number, role: StarPathRole,
  drawStart: number, drawEnd: number, flowSpeed: number,
  dashCount: number, dashDuty: number,
): StarPath {
  const points: StarPoint[] = [];
  for (let index = 0; index < dashCount; index += 1) {
    const start = index / dashCount;
    const end = (index + dashDuty) / dashCount;
    points.push(
      { ...polar(radius, TAU * start), pathArc: start },
      { ...polar(radius, TAU * end), pathArc: end },
    );
  }
  return {
    id, category: 'ring', role, stage: 'rings', drawStart, drawEnd, flowSpeed,
    points, segmentPairs: true, dashCount, dashDuty,
  };
}

function lattice(
  id: string, radius: number, rotation: number, latticeStep: 2 | 3 | 5,
  drawStart: number, drawEnd: number,
): StarPath {
  const points: StarPoint[] = [];
  for (let index = 0; index < 12; index += 1) {
    points.push(
      polar(radius, rotation + TAU * index / 12),
      polar(radius, rotation + TAU * ((index + latticeStep) % 12) / 12),
    );
  }
  return {
    id, category: 'star-lattice', role: 'primary', stage: 'lattice', points, drawStart, drawEnd,
    segmentPairs: true, latticeStep,
  };
}

function orbit(
  id: string, rx: number, ry: number, rotation: number,
  drawStart: number, drawEnd: number, orbitBase: 0 | 2 | 4, flowSpeed: number,
  offsetX: number, offsetY: number,
): StarPath {
  const pointAt = (pathArc: number): StarPoint => {
    const angle = TAU * pathArc;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    return {
      x: x * Math.cos(rotation) - y * Math.sin(rotation) + offsetX,
      y: x * Math.sin(rotation) + y * Math.cos(rotation) + offsetY,
      pathArc,
    };
  };
  const points: StarPoint[] = [];
  for (let index = 0; index < 48; index += 1) {
    points.push(pointAt(index / 48), pointAt((index + 0.72) / 48));
  }
  return {
    id, category: 'orbit', role: 'secondary', stage: 'lattice', points,
    drawStart, drawEnd, orbitBase, flowSpeed, offsetX, offsetY, segmentPairs: true,
  };
}
```

Then add exact arrays in the same file:

```ts
const rings = [
  circle('energy-ring', 0.34, 'primary', 0, 0.34, 0.9, 36, 0.86),
  circle('constraint-ring', 0.76, 'secondary', 0.18, 0.62, -0.65, 48, 0.65),
  circle('orbit-ring', 1.22, 'secondary', 0.34, 0.78, 1.1, 56, 0.78),
  circle('calibration-ring', 1.92, 'detail', 0.5, 1, -0.4, 72, 0.52),
  circle('boundary-ring', 2.26, 'primary', 0.08, 0.48, 0.25, 88, 0.9),
];

const lattices = [
  lattice('inner-lattice', 0.66, 0, 2, 0, 0.42),
  lattice('middle-lattice', 1.28, Math.PI / 24, 3, 0.24, 0.72),
  lattice('outer-lattice', 1.78, Math.PI / 12, 5, 0.52, 1),
];

const orbits = [
  orbit('orbit-a', 1.52, 1.12, Math.PI / 18, 0.18, 0.58, 0, 0.75, 0.035, -0.02),
  orbit('orbit-b', 1.66, 1.34, -Math.PI / 15, 0.38, 0.8, 2, -0.55, -0.045, 0.025),
  orbit('orbit-c', 1.86, 1.54, Math.PI / 10, 0.58, 1, 4, 1.05, 0.02, 0.04),
];

function tick(index: number, major: boolean): StarPath {
  const angle = TAU * index / 48;
  const inner = major ? 1.93 : 2.02;
  const outer = major ? 2.24 : 2.17;
  const drawStart = (major ? 0.05 : 0.18) + index / 48 * (major ? 0.45 : 0.52);
  return {
    id: `${major ? 'major' : 'minor'}-tick-${index + 1}`,
    category: major ? 'major-tick' : 'minor-tick',
    role: major ? 'secondary' : 'detail', stage: 'details',
    drawStart, drawEnd: Math.min(1, drawStart + (major ? 0.24 : 0.16)),
    dissolveRank: 0.25 + index / 48 * 0.18,
    points: [polar(inner, angle), polar(outer, angle)],
  };
}

function microMark(index: number): StarPath {
  const angle = TAU * index / 24;
  const center = polar(1.72, angle);
  const tangent = { x: -Math.sin(angle), y: Math.cos(angle) };
  const radial = { x: Math.cos(angle), y: Math.sin(angle) };
  const sign = index % 2 === 0 ? 1 : -1;
  const drawStart = 0.4 + index / 24 * 0.42;
  return {
    id: `micro-mark-${index + 1}`, category: 'micro-mark', role: 'detail', stage: 'details',
    drawStart, drawEnd: Math.min(1, drawStart + 0.14), microRank: (index + 1) / 24,
    dissolveRank: 0.38 + index / 24 * 0.14,
    points: [
      { x: center.x - tangent.x * 0.055, y: center.y - tangent.y * 0.055 },
      { x: center.x + radial.x * 0.065 * sign, y: center.y + radial.y * 0.065 * sign },
      { x: center.x + tangent.x * 0.055, y: center.y + tangent.y * 0.055 },
    ],
  };
}

function lockNode(index: number): StarPath {
  const angle = TAU * index / 12;
  const center = polar(2.0, angle);
  const tangent = { x: -Math.sin(angle), y: Math.cos(angle) };
  const radial = { x: Math.cos(angle), y: Math.sin(angle) };
  const drawStart = index / 12 * 0.82;
  return {
    id: `lock-node-${index + 1}`, category: 'lock-node', role: 'secondary', stage: 'details',
    drawStart, drawEnd: Math.min(1, drawStart + 0.16), fieldChannel: 1,
    dissolveRank: 0.28 + index / 12 * 0.12, closed: true,
    points: [
      { x: center.x + radial.x * 0.055, y: center.y + radial.y * 0.055 },
      { x: center.x + tangent.x * 0.045, y: center.y + tangent.y * 0.045 },
      { x: center.x - radial.x * 0.055, y: center.y - radial.y * 0.055 },
      { x: center.x - tangent.x * 0.045, y: center.y - tangent.y * 0.045 },
    ],
  };
}

function floatingFragment(index: number): StarPath {
  const angle = TAU * index / 12 + Math.PI / 24;
  const center = polar(0.92 + (index % 3) * 0.23, angle);
  const tangent = { x: -Math.sin(angle), y: Math.cos(angle) };
  const radial = { x: Math.cos(angle), y: Math.sin(angle) };
  const drawStart = 0.38 + index / 12 * 0.4;
  return {
    id: `float-fragment-${index + 1}`, category: 'float-fragment', role: 'detail', stage: 'details',
    drawStart, drawEnd: Math.min(1, drawStart + 0.2), height: 0.04 + (index % 4) * 0.045,
    dissolveRank: 0.5 + index / 12 * 0.13,
    points: [
      { x: center.x - tangent.x * 0.07, y: center.y - tangent.y * 0.07 },
      { x: center.x + radial.x * 0.055, y: center.y + radial.y * 0.055 },
      { x: center.x + tangent.x * 0.07, y: center.y + tangent.y * 0.07 },
    ],
  };
}

const ticks = Array.from({ length: 48 }, (_, index) => tick(index, index % 4 === 0));
export const GEOMETRIC_STAR_PATHS: readonly StarPath[] = [
  ...rings, ...lattices, ...orbits, ...ticks,
  ...Array.from({ length: 24 }, (_, index) => microMark(index)),
  ...Array.from({ length: 12 }, (_, index) => lockNode(index)),
  ...Array.from({ length: 12 }, (_, index) => floatingFragment(index)),
];
export const pathsForStage = (stage: StarPathStage) => GEOMETRIC_STAR_PATHS.filter((path) => path.stage === stage);
```

- [ ] **Step 4: Run the layout test**

Run: `npm run test:unit -- --run tests/unit/effects/GeometricStarPaths.test.ts`

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit the layout**

```bash
git add src/effects/magicCircle/geometricStarPaths.ts tests/unit/effects/GeometricStarPaths.test.ts
git commit -m "feat: define geometric starlight circle layout"
```

---

### Task 2: Build Cross-Backend Ribbon Geometry and Warm-Gold Node Materials

**Files:**
- Create: `src/effects/magicCircle/createStrokeRibbonGeometry.ts`
- Modify: `src/effects/magicCircle/magicCircleNodes.ts`
- Create: `tests/unit/effects/StrokeRibbonGeometry.test.ts`
- Create: `tests/unit/effects/MagicCircleNodes.test.ts`

**Interfaces:**
- Consumes: `StarPath[]`, `StarPathRole` from Task 1.
- Produces: `createStrokeRibbonGeometry(paths, width)`, `StrokeRibbonStats`, `createMagicCircleNodeMaterial(options)`, and `MagicCircleNodeControls`.

- [ ] **Step 1: Write failing geometry tests**

```ts
import { describe, expect, it } from 'vitest';
import { pathsForStage } from '../../../src/effects/magicCircle/geometricStarPaths';
import { createStrokeRibbonGeometry } from '../../../src/effects/magicCircle/createStrokeRibbonGeometry';

describe('stroke ribbon geometry', () => {
  it('creates indexed ribbons with normalized draw and soft-edge attributes', () => {
    const geometry = createStrokeRibbonGeometry(pathsForStage('rings'), 0.018);
    expect(geometry.index).not.toBeNull();
    expect(geometry.getAttribute('arcProgress')).toBeDefined();
    expect(geometry.getAttribute('pathArc')).toBeDefined();
    expect(geometry.getAttribute('edgeDistance')).toBeDefined();
    expect(geometry.getAttribute('strokeRole')).toBeDefined();
    expect(geometry.getAttribute('microRank')).toBeDefined();
    expect(geometry.getAttribute('orbitBase')).toBeDefined();
    expect(geometry.getAttribute('flowSpeed')).toBeDefined();
    expect(geometry.getAttribute('fieldChannel')).toBeDefined();
    expect(geometry.getAttribute('dissolveRank')).toBeDefined();
    expect(geometry.userData.stats.pathCount).toBe(5);
    const arc = geometry.getAttribute('arcProgress');
    expect(arc.getX(0)).toBeGreaterThanOrEqual(0);
    expect(arc.getX(arc.count - 1)).toBeLessThanOrEqual(1);
    geometry.dispose();
  });

  it('builds a wider halo without changing the path inventory', () => {
    const core = createStrokeRibbonGeometry(pathsForStage('lattice'), 0.024);
    const halo = createStrokeRibbonGeometry(pathsForStage('lattice'), 0.11);
    expect(halo.userData.stats.pathCount).toBe(core.userData.stats.pathCount);
    expect(halo.boundingSphere?.radius).toBeGreaterThan(core.boundingSphere?.radius ?? 0);
    core.dispose();
    halo.dispose();
  });

  it('renders the three lattice connection sets as 36 separate chords', () => {
    const paths = pathsForStage('lattice').filter((path) => path.category === 'star-lattice');
    const geometry = createStrokeRibbonGeometry(paths, 0.024);
    expect(geometry.userData.stats).toMatchObject({ pathCount: 3, segmentCount: 36 });
    geometry.dispose();
  });

  it('winds the ground ribbons toward the camera above the array', () => {
    const geometry = createStrokeRibbonGeometry(pathsForStage('rings'), 0.018);
    const position = geometry.getAttribute('position');
    const index = geometry.index!;
    const [a, b, c] = [index.getX(0), index.getX(1), index.getX(2)]
      .map((vertex) => [position.getX(vertex), position.getY(vertex), position.getZ(vertex)] as const);
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const normalY = ab[2] * ac[0] - ab[0] * ac[2];
    expect(normalY).toBeGreaterThan(0);
    geometry.dispose();
  });
});
```

- [ ] **Step 2: Run the geometry tests and verify the missing module failure**

Run: `npm run test:unit -- --run tests/unit/effects/StrokeRibbonGeometry.test.ts`

Expected: FAIL because `createStrokeRibbonGeometry.ts` does not exist.

- [ ] **Step 3: Implement joined three-vertex cross-sections**

```ts
import { BufferAttribute, BufferGeometry } from 'three/webgpu';
import type { StarPath, StarPathRole } from './geometricStarPaths';

export interface StrokeRibbonStats { pathCount: number; segmentCount: number; triangleCount: number }
const ROLE_VALUE: Record<StarPathRole, number> = { primary: 0, secondary: 0.5, detail: 1 };
const ROLE_WIDTH: Record<StarPathRole, number> = { primary: 1, secondary: 0.72, detail: 0.45 };

export function createStrokeRibbonGeometry(paths: readonly StarPath[], width: number): BufferGeometry {
  const positions: number[] = [];
  const arcProgress: number[] = [];
  const pathArc: number[] = [];
  const edgeDistance: number[] = [];
  const strokeRole: number[] = [];
  const microRank: number[] = [];
  const orbitBase: number[] = [];
  const flowSpeed: number[] = [];
  const fieldChannel: number[] = [];
  const dissolveRank: number[] = [];
  const indices: number[] = [];
  let segmentCount = 0;
  let triangleCount = 0;

  for (const path of paths) {
    const effectiveWidth = width * ROLE_WIDTH[path.role];
    const strokes = path.segmentPairs
      ? Array.from({ length: path.points.length / 2 }, (_, index) => path.points.slice(index * 2, index * 2 + 2))
      : [path.closed ? [...path.points, path.points[0]] : [...path.points]];
    for (const points of strokes) {
      const lengths = points.map((point, index) => index === 0 ? 0 : Math.hypot(
        point.x - points[index - 1].x,
        point.y - points[index - 1].y,
      ));
      const total = Math.max(Number.EPSILON, lengths.reduce((sum, value) => sum + value, 0));
      let traveled = 0;
      const base = positions.length / 3;

      points.forEach((point, index) => {
        const previous = points[Math.max(0, index - 1)];
        const next = points[Math.min(points.length - 1, index + 1)];
        const dx = next.x - previous.x;
        const dy = next.y - previous.y;
        const length = Math.max(Number.EPSILON, Math.hypot(dx, dy));
        const nx = -dy / length;
        const ny = dx / length;
        traveled += lengths[index];
        for (const offset of [-0.5, 0, 0.5]) {
          positions.push(
            point.x + nx * effectiveWidth * offset,
            path.height ?? 0,
            point.y + ny * effectiveWidth * offset,
          );
          const localProgress = point.pathArc ?? traveled / total;
          arcProgress.push(path.drawStart + localProgress * (path.drawEnd - path.drawStart));
          pathArc.push(localProgress);
          edgeDistance.push(Math.abs(offset) * 2);
          strokeRole.push(ROLE_VALUE[path.role]);
          microRank.push(path.microRank ?? 0);
          orbitBase.push(path.orbitBase ?? -1);
          flowSpeed.push(path.flowSpeed ?? 1);
          fieldChannel.push(path.fieldChannel ?? 0);
          dissolveRank.push(path.dissolveRank ?? 1);
        }
      });

      for (let index = 0; index < points.length - 1; index += 1) {
        const left = base + index * 3;
        const next = left + 3;
        indices.push(left, left + 1, next, left + 1, next + 1, next);
        indices.push(left + 1, left + 2, next + 1, left + 2, next + 2, next + 1);
        segmentCount += 1;
        triangleCount += 4;
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('arcProgress', new BufferAttribute(new Float32Array(arcProgress), 1));
  geometry.setAttribute('pathArc', new BufferAttribute(new Float32Array(pathArc), 1));
  geometry.setAttribute('edgeDistance', new BufferAttribute(new Float32Array(edgeDistance), 1));
  geometry.setAttribute('strokeRole', new BufferAttribute(new Float32Array(strokeRole), 1));
  geometry.setAttribute('microRank', new BufferAttribute(new Float32Array(microRank), 1));
  geometry.setAttribute('orbitBase', new BufferAttribute(new Float32Array(orbitBase), 1));
  geometry.setAttribute('flowSpeed', new BufferAttribute(new Float32Array(flowSpeed), 1));
  geometry.setAttribute('fieldChannel', new BufferAttribute(new Float32Array(fieldChannel), 1));
  geometry.setAttribute('dissolveRank', new BufferAttribute(new Float32Array(dissolveRank), 1));
  geometry.computeBoundingSphere();
  geometry.userData.stats = { pathCount: paths.length, segmentCount, triangleCount } satisfies StrokeRibbonStats;
  return geometry;
}
```

- [ ] **Step 4: Write failing material-control tests**

```ts
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
```

- [ ] **Step 5: Replace the old line material with the ribbon mesh material**

```ts
import { AdditiveBlending, MeshBasicNodeMaterial } from 'three/webgpu';
import { attribute, color, float, fract, mix, oneMinus, smoothstep, step, uniform } from 'three/tsl';

export interface MagicCircleNodeControls {
  progress: { value: number };
  opacity: { value: number };
  brightness: { value: number };
  flow: { value: number };
  flash: { value: number };
  microMarkFraction: { value: number };
  orbitLightCount: { value: number };
  fieldProgress: { value: number };
  dissolveProgress: { value: number };
}

export function createMagicCircleNodeMaterial(options: { variant: 'core' | 'halo' }) {
  const progress = uniform(0);
  const opacity = uniform(0);
  const brightness = uniform(1);
  const flow = uniform(0);
  const flash = uniform(0);
  const microMarkFraction = uniform(1);
  const orbitLightCount = uniform(6);
  const fieldProgress = uniform(0);
  const dissolveProgress = uniform(0);
  const arc = attribute<'float'>('arcProgress', 'float');
  const localArc = attribute<'float'>('pathArc', 'float');
  const edge = attribute<'float'>('edgeDistance', 'float');
  const role = attribute<'float'>('strokeRole', 'float');
  const microRank = attribute<'float'>('microRank', 'float');
  const orbitBase = attribute<'float'>('orbitBase', 'float');
  const flowSpeed = attribute<'float'>('flowSpeed', 'float');
  const fieldChannel = attribute<'float'>('fieldChannel', 'float');
  const dissolveRank = attribute<'float'>('dissolveRank', 'float');
  const channelProgress = mix(progress, fieldProgress, fieldChannel);
  const draw = oneMinus(smoothstep(channelProgress, channelProgress.add(0.025), arc));
  const roleFade = mix(float(1), float(0.52), role);
  const flowBand = localArc.mul(18).sub(flow.mul(flowSpeed)).sin().mul(0.08).add(0.92);
  const microVisibility = step(microRank, microMarkFraction);
  const dissolveVisibility = oneMinus(smoothstep(dissolveRank, dissolveRank.add(0.12), dissolveProgress));
  const isOrbit = step(float(0), orbitBase);
  const movingArc = fract(localArc.sub(flow.mul(flowSpeed).mul(0.06)));
  const orbitPointA = oneMinus(smoothstep(float(0.018), float(0.055), movingArc.sub(0.25).abs()))
    .mul(step(orbitBase.add(1), orbitLightCount));
  const orbitPointB = oneMinus(smoothstep(float(0.018), float(0.055), movingArc.sub(0.75).abs()))
    .mul(step(orbitBase.add(2), orbitLightCount));
  const orbitGlow = isOrbit.mul(orbitPointA.add(orbitPointB));
  const haloInnerEdge = mix(float(0.06), float(0.38), fieldProgress);
  const edgeFade = options.variant === 'halo'
    ? oneMinus(smoothstep(haloInnerEdge, float(1), edge))
    : oneMinus(smoothstep(float(0.72), float(1), edge));
  const material = new MeshBasicNodeMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
  });
  material.colorNode = options.variant === 'core'
    ? mix(color(0xfffdf2), color(0xf4d8a5), role.mul(0.38)).mul(brightness.add(flash))
    : color(0xf4d8a5).mul(brightness.mul(0.58).add(flash.mul(0.45)));
  material.opacityNode = draw.mul(opacity).mul(roleFade).mul(flowBand.add(orbitGlow.mul(1.4)))
    .mul(edgeFade).mul(microVisibility).mul(dissolveVisibility)
    .mul(options.variant === 'halo' ? 0.42 : 1);
  return {
    material,
    controls: {
      progress, opacity, brightness, flow, flash, microMarkFraction, orbitLightCount,
      fieldProgress, dissolveProgress,
    },
  };
}
```

- [ ] **Step 6: Run focused tests and type checking**

Run: `npm run test:unit -- --run tests/unit/effects/StrokeRibbonGeometry.test.ts tests/unit/effects/MagicCircleNodes.test.ts && npm run typecheck`

Expected: all focused tests PASS and TypeScript reports no errors.

- [ ] **Step 7: Commit ribbon rendering**

```bash
git add src/effects/magicCircle/createStrokeRibbonGeometry.ts src/effects/magicCircle/magicCircleNodes.ts tests/unit/effects/StrokeRibbonGeometry.test.ts tests/unit/effects/MagicCircleNodes.test.ts
git commit -m "feat: render cross-backend starlight ribbons"
```

---

### Task 3: Add the Pure Spell Frame Mapper and Exact Tier Caps

**Files:**
- Create: `src/effects/magicCircle/magicCircleFrame.ts`
- Modify: `src/quality/qualityProfiles.ts`
- Create: `tests/unit/effects/MagicCircleFrame.test.ts`
- Modify: `tests/unit/quality/qualityProfiles.test.ts`

**Interfaces:**
- Consumes: `FrameSignals`, `EXPERIENCE_TIMING`, and `QualityTier`.
- Produces: `MagicCircleFrame`, `getMagicCircleFrame(signals)`, `SpellFieldQuality`, and `QUALITY_PROFILES[tier].spellField`.

- [ ] **Step 1: Write failing frame and quality tests**

```ts
import { describe, expect, it } from 'vitest';
import { getMagicCircleFrame } from '../../../src/effects/magicCircle/magicCircleFrame';

const frame = (state: 'charging' | 'charged' | 'dissolving' | 'summoning', charge: number, dissolve = 0, summon = 0, nowMs = 0) => ({
  nowMs, deltaSeconds: 1 / 60, state, charge, dissolve, summon, pointerNdc: { x: 0, y: 0 },
});

describe('geometric magic circle frame', () => {
  it('maps the exact approved charge boundaries', () => {
    expect(getMagicCircleFrame(frame('charging', 0))).toMatchObject({ opacity: 0, ringProgress: 0, latticeProgress: 0, fieldProgress: 0 });
    expect(getMagicCircleFrame(frame('charging', 0.32))).toMatchObject({ ringProgress: 1, latticeProgress: 0, fieldProgress: 0 });
    expect(getMagicCircleFrame(frame('charging', 0.68))).toMatchObject({ ringProgress: 1, latticeProgress: 1, detailProgress: 1, fieldProgress: 0 });
    expect(getMagicCircleFrame(frame('charged', 1))).toMatchObject({ ringProgress: 1, latticeProgress: 1, detailProgress: 1, fieldProgress: 1 });
  });

  it('holds brightness inside the approved breathing band', () => {
    const samples = [0, 900, 1800, 2700, 3600].map((nowMs) => getMagicCircleFrame(frame('charged', 1, 0, 0, nowMs)).brightness);
    expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(0.16);
  });

  it('fires one deterministic completion pulse before charged hold and leaves a dust-only tail', () => {
    expect(getMagicCircleFrame(frame('charging', 0.95)).chargeFlash).toBeGreaterThan(0);
    expect(getMagicCircleFrame(frame('charged', 1)).chargeFlash).toBe(0);
    const retreat = getMagicCircleFrame(frame('summoning', 1, 0, 2360 / 2600));
    expect(retreat).toMatchObject({ ringOpacity: 0, latticeOpacity: 0, detailOpacity: 0, pillarOpacity: 0 });
    expect(retreat.dustOpacity).toBeGreaterThan(0);
    expect(getMagicCircleFrame(frame('summoning', 1, 0, 1)).dustOpacity).toBe(0);
  });

  it('dissolves pillars before the main lattice and flashes only on success', () => {
    const early = getMagicCircleFrame(frame('dissolving', 1, 0.2));
    const middle = getMagicCircleFrame(frame('dissolving', 1, 0.5));
    const late = getMagicCircleFrame(frame('dissolving', 1, 0.7));
    expect(early.pillarOpacity).toBeLessThan(early.latticeOpacity);
    expect(middle).toMatchObject({ latticeOpacity: 1, dissolveProgress: 0.5 });
    expect(getMagicCircleFrame(frame('dissolving', 1, 0.75)).detailOpacity).toBe(0);
    expect(late.latticeOpacity).toBeLessThan(early.latticeOpacity);
    expect(early.releaseFlash).toBe(0);
    expect(getMagicCircleFrame(frame('summoning', 1, 0, 120 / 2600)).releaseFlash).toBeGreaterThan(0);
  });
});
```

Append to `tests/unit/quality/qualityProfiles.test.ts`:

```ts
expect(QUALITY_PROFILES.high.spellField).toEqual({
  pillarCount: 5, pillarLayers: 3, microMarkCount: 24,
  orbitLightCount: 6, risingLightCount: 90, starFlareCount: 18,
});
expect(QUALITY_PROFILES.balanced.spellField).toEqual({
  pillarCount: 4, pillarLayers: 2, microMarkCount: 18,
  orbitLightCount: 4, risingLightCount: 54, starFlareCount: 12,
});
expect(QUALITY_PROFILES.compatibility.spellField).toEqual({
  pillarCount: 3, pillarLayers: 1, microMarkCount: 12,
  orbitLightCount: 2, risingLightCount: 30, starFlareCount: 6,
});
```

- [ ] **Step 2: Run tests and verify missing properties/modules**

Run: `npm run test:unit -- --run tests/unit/effects/MagicCircleFrame.test.ts tests/unit/quality/qualityProfiles.test.ts`

Expected: FAIL because `magicCircleFrame.ts` and `spellField` do not exist.

- [ ] **Step 3: Add the exact quality shape**

```ts
export interface SpellFieldQuality {
  pillarCount: 3 | 4 | 5;
  pillarLayers: 1 | 2 | 3;
  microMarkCount: 12 | 18 | 24;
  orbitLightCount: 2 | 4 | 6;
  risingLightCount: 30 | 54 | 90;
  starFlareCount: 6 | 12 | 18;
}

export interface QualityProfile {
  pixelRatioMax: number;
  renderScale: number;
  backgroundStardust: number;
  gatherStardust: number;
  burstParticles: number;
  fogLayers: number;
  bloomStrength: number;
  bloomResolutionScale: number;
  chromaticAberration: number;
  trails: 'fullscreen-and-4-particle' | '2-particle' | 'off';
  distortion: 'full' | 'light' | 'off';
  cameraFraming: 'moon-overlook-v1';
  timeline: 'summoning-v1';
  colorPalette: 'moonlight-violet-v1';
  spellField: SpellFieldQuality;
}
```

Add the exact values from the failing test to each profile without changing the existing pixel ratio, particle, fog, bloom, trail, distortion, framing, timeline, or palette fields.

- [ ] **Step 4: Implement the pure frame mapper**

```ts
import type { FrameSignals } from '../../app/frameSignals';
import { EXPERIENCE_TIMING } from '../../config/experience';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => { const amount = clamp01(value); return amount * amount * (3 - 2 * amount); };
const fade = (value: number, start: number, end: number) => 1 - smooth((value - start) / (end - start));

export interface MagicCircleFrame {
  ringProgress: number;
  latticeProgress: number;
  detailProgress: number;
  fieldProgress: number;
  opacity: number;
  ringOpacity: number;
  latticeOpacity: number;
  detailOpacity: number;
  pillarOpacity: number;
  dustOpacity: number;
  brightness: number;
  flow: number;
  releaseScale: number;
  releaseFlash: number;
  chargeFlash: number;
  pillarConvergence: number;
  dissolveProgress: number;
}

export function getMagicCircleFrame(signals: FrameSignals): MagicCircleFrame {
  const charge = clamp01(signals.charge);
  const active = ['charging', 'charged', 'dissolving', 'summoning'].includes(signals.state);
  const opacity = active && charge > 0 ? 1 : 0;
  const ringProgress = clamp01(charge / 0.32);
  const latticeProgress = clamp01((charge - 0.32) / 0.36);
  const detailProgress = smooth((charge - 0.32) / 0.36);
  const fieldProgress = clamp01((charge - 0.68) / 0.32);
  const dissolve = signals.state === 'dissolving' ? clamp01(signals.dissolve) : 0;
  const elapsedMs = signals.state === 'summoning' ? clamp01(signals.summon) * EXPERIENCE_TIMING.summonEndMs : 0;
  const summonMainFade = signals.state === 'summoning' ? fade(elapsedMs, 1500, 2360) : 1;
  const summonFieldFade = signals.state === 'summoning' ? fade(elapsedMs, 1660, 2360) : 1;
  const dustRetreat = signals.state === 'summoning'
    ? 1 - 0.86 * smooth((elapsedMs - 1660) / (2360 - 1660))
    : 1;
  const dustTail = signals.state === 'summoning' ? fade(elapsedMs, 2360, 2600) : 1;
  const compressIn = smooth(elapsedMs / EXPERIENCE_TIMING.releaseHoldMs);
  const rebound = smooth((elapsedMs - EXPERIENCE_TIMING.releaseHoldMs) / 100);
  const releaseScale = signals.state === 'summoning' ? 1 - 0.06 * compressIn * (1 - rebound) : 1;
  const releaseFlash = signals.state === 'summoning'
    ? smooth(elapsedMs / EXPERIENCE_TIMING.releaseHoldMs) * fade(elapsedMs, 220, 420)
    : 0;
  const chargeFlash = (signals.state === 'charging' || signals.state === 'charged')
    ? smooth((charge - 0.9) / 0.06) * fade(charge, 0.97, 1)
    : 0;
  const pillarConvergence = signals.state === 'summoning'
    ? smooth((elapsedMs - EXPERIENCE_TIMING.releaseHoldMs) / (EXPERIENCE_TIMING.fillStartMs - EXPERIENCE_TIMING.releaseHoldMs))
    : 0;
  const breath = signals.state === 'charged' ? 1 + Math.sin(signals.nowMs * Math.PI * 2 / 3600) * 0.04 : 1;

  return {
    ringProgress, latticeProgress, detailProgress, fieldProgress, opacity,
    ringOpacity: opacity * fade(dissolve, 0.55, 1) * summonMainFade,
    latticeOpacity: opacity * fade(dissolve, 0.55, 1) * summonMainFade,
    detailOpacity: opacity * fade(dissolve, 0.68, 0.75) * summonFieldFade,
    pillarOpacity: opacity * fade(dissolve, 0, 0.25) * summonFieldFade,
    dustOpacity: opacity * fade(dissolve, 0.1, 0.55) * dustRetreat * dustTail,
    brightness: (0.72 + smooth(fieldProgress) * 0.88) * breath,
    flow: Math.max(0, signals.nowMs) / 1000,
    releaseScale, releaseFlash, chargeFlash, pillarConvergence, dissolveProgress: dissolve,
  };
}
```

- [ ] **Step 5: Run focused tests and type checking**

Run: `npm run test:unit -- --run tests/unit/effects/MagicCircleFrame.test.ts tests/unit/quality/qualityProfiles.test.ts && npm run typecheck`

Expected: all focused tests PASS and TypeScript reports no errors.

- [ ] **Step 6: Commit timing and caps**

```bash
git add src/effects/magicCircle/magicCircleFrame.ts src/quality/qualityProfiles.ts tests/unit/effects/MagicCircleFrame.test.ts tests/unit/quality/qualityProfiles.test.ts
git commit -m "feat: map starlight phases and quality caps"
```

---

### Task 4: Add Preallocated Vertical Light Pillars

**Files:**
- Create: `src/effects/magicCircle/lightPillarGeometry.ts`
- Create: `src/effects/magicCircle/lightPillarNodes.ts`
- Create: `src/effects/magicCircle/LightPillars.ts`
- Create: `tests/unit/effects/LightPillars.test.ts`

**Interfaces:**
- Consumes: `MagicCircleFrame`, `QualityTier`, and `QUALITY_PROFILES[tier].spellField`.
- Produces: `LightPillars.update(frame, quality)`, `reset()`, `dispose()`, and `getStats(): LightPillarStats`.

- [ ] **Step 1: Write the failing pillar lifecycle test**

```ts
import { describe, expect, it } from 'vitest';
import { LightPillars } from '../../../src/effects/magicCircle/LightPillars';
import { createLightPillarGeometry } from '../../../src/effects/magicCircle/lightPillarGeometry';
import { getMagicCircleFrame } from '../../../src/effects/magicCircle/magicCircleFrame';

const charged = getMagicCircleFrame({
  nowMs: 1000, deltaSeconds: 1 / 60, state: 'charged', charge: 1,
  dissolve: 0, summon: 0, pointerNdc: { x: 0, y: 0 },
});

describe('LightPillars', () => {
  it('uses exact tier counts without reallocating', () => {
    const pillars = new LightPillars();
    const allocatedObjects = pillars.getStats().allocatedObjects;
    for (const [quality, pillarCount, layerCount] of [
      ['high', 5, 3], ['balanced', 4, 2], ['compatibility', 3, 1],
    ] as const) {
      pillars.update(charged, quality);
      expect(pillars.getStats()).toMatchObject({ pillarCount, layerCount, allocatedObjects });
    }
    pillars.reset();
    expect(pillars.getStats()).toMatchObject({ pillarCount: 0, layerCount: 0, allocatedObjects });
    pillars.dispose();
  });

  it('gives the mist layer a taller, wider silhouette than the light core', () => {
    const core = createLightPillarGeometry(0.7, 0.92);
    const mist = createLightPillarGeometry(2.8, 1.18);
    core.computeBoundingBox();
    mist.computeBoundingBox();
    expect(mist.boundingBox!.max.y).toBeGreaterThan(core.boundingBox!.max.y);
    expect(mist.boundingBox!.max.x - mist.boundingBox!.min.x)
      .toBeGreaterThan(core.boundingBox!.max.x - core.boundingBox!.min.x);
    const intensities = Array.from({ length: core.getAttribute('pillarIntensity').count },
      (_, index) => core.getAttribute('pillarIntensity').getX(index));
    expect(new Set(intensities).size).toBeGreaterThan(1);
    core.dispose();
    mist.dispose();
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `npm run test:unit -- --run tests/unit/effects/LightPillars.test.ts`

Expected: FAIL because `LightPillars.ts` does not exist.

- [ ] **Step 3: Implement capacity-five geometry for each visual layer**

```ts
import { BufferAttribute, BufferGeometry } from 'three/webgpu';

const PILLARS = [
  { x: 0, z: -0.52, width: 0.56, height: 4.8, seed: 0.13, intensity: 1 },
  { x: -1.15, z: -0.18, width: 0.42, height: 3.8, seed: 0.37, intensity: 0.78 },
  { x: 1.08, z: -0.08, width: 0.46, height: 4.2, seed: 0.59, intensity: 0.85 },
  { x: -1.82, z: 0.22, width: 0.34, height: 3.1, seed: 0.76, intensity: 0.62 },
  { x: 1.72, z: 0.28, width: 0.36, height: 3.4, seed: 0.91, intensity: 0.68 },
] as const;

export function createLightPillarGeometry(widthScale: number, heightScale: number): BufferGeometry {
  const positions: number[] = [];
  const pillarUv: number[] = [];
  const pillarSeed: number[] = [];
  const pillarIntensity: number[] = [];
  const pillarCenterX: number[] = [];
  const indices: number[] = [];
  for (const [index, pillar] of PILLARS.entries()) {
    const half = pillar.width * widthScale * 0.5;
    const base = positions.length / 3;
    positions.push(
      pillar.x - half, 0, pillar.z, pillar.x + half, 0, pillar.z,
      pillar.x - half, pillar.height * heightScale, pillar.z,
      pillar.x + half, pillar.height * heightScale, pillar.z,
    );
    pillarUv.push(0, 0, 1, 0, 0, 1, 1, 1);
    pillarSeed.push(pillar.seed, pillar.seed, pillar.seed, pillar.seed);
    pillarIntensity.push(pillar.intensity, pillar.intensity, pillar.intensity, pillar.intensity);
    pillarCenterX.push(pillar.x, pillar.x, pillar.x, pillar.x);
    indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('pillarUv', new BufferAttribute(new Float32Array(pillarUv), 2));
  geometry.setAttribute('pillarSeed', new BufferAttribute(new Float32Array(pillarSeed), 1));
  geometry.setAttribute('pillarIntensity', new BufferAttribute(new Float32Array(pillarIntensity), 1));
  geometry.setAttribute('pillarCenterX', new BufferAttribute(new Float32Array(pillarCenterX), 1));
  geometry.computeBoundingSphere();
  return geometry;
}
```

- [ ] **Step 4: Implement the TSL pillar material**

```ts
import { AdditiveBlending, MeshBasicNodeMaterial } from 'three/webgpu';
import { attribute, color, float, oneMinus, positionLocal, smoothstep, uniform, vec3 } from 'three/tsl';

export function createLightPillarNodeMaterial(layer: 0 | 1 | 2) {
  const opacity = uniform(0);
  const rise = uniform(0);
  const time = uniform(0);
  const convergence = uniform(0);
  const uv = attribute<'vec2'>('pillarUv', 'vec2');
  const seed = attribute<'float'>('pillarSeed', 'float');
  const intensity = attribute<'float'>('pillarIntensity', 'float');
  const centerX = attribute<'float'>('pillarCenterX', 'float');
  const horizontal = oneMinus(smoothstep(float(0.05), float(0.5), uv.x.sub(0.5).abs()));
  const vertical = smoothstep(float(0), float(0.08), uv.y)
    .mul(oneMinus(smoothstep(rise.sub(0.28), rise, uv.y)));
  const bands = uv.y.mul(17).sub(time.mul(1.7)).add(seed.mul(11)).sin().mul(0.16).add(0.84);
  const wisps = uv.y.mul(31).add(time.mul(0.63)).add(seed.mul(23)).sin().mul(0.09).add(0.91);
  const layerOpacity = [1, 0.42, 0.18][layer];
  const material = new MeshBasicNodeMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
  });
  const convergenceScale = oneMinus(convergence.mul(0.18));
  const breath = time.mul(0.48).add(seed.mul(17)).sin().mul(0.025).add(1);
  const sway = time.mul(0.42).add(seed.mul(23)).sin().mul(0.018).mul(uv.y);
  const breathedX = centerX.add(positionLocal.x.sub(centerX).mul(breath));
  material.positionNode = vec3(
    breathedX.mul(convergenceScale).add(sway),
    positionLocal.y,
    positionLocal.z.mul(convergenceScale),
  );
  material.colorNode = layer === 0 ? color(0xfffdf2) : color(0xf4d8a5);
  material.opacityNode = horizontal.mul(vertical).mul(bands).mul(wisps)
    .mul(opacity).mul(intensity).mul(layerOpacity);
  return { material, controls: { opacity, rise, time, convergence } };
}
```

- [ ] **Step 5: Implement the owner with fixed allocation and draw ranges**

```ts
import { Group, Mesh } from 'three/webgpu';
import type { QualityTier } from '../../quality/qualityProfiles';
import { QUALITY_PROFILES } from '../../quality/qualityProfiles';
import type { MagicCircleFrame } from './magicCircleFrame';
import { createLightPillarGeometry } from './lightPillarGeometry';
import { createLightPillarNodeMaterial } from './lightPillarNodes';
import { LAYER_ORDER } from '../../stage/layerOrder';

export interface LightPillarStats { pillarCount: number; layerCount: number; allocatedObjects: number }

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
    this.#stats = { pillarCount: active ? caps.pillarCount : 0, layerCount: active ? caps.pillarLayers : 0, allocatedObjects: 4 };
    this.#layers.forEach((layer, index) => {
      layer.mesh.visible = active && index < caps.pillarLayers;
      layer.geometry.setDrawRange(0, caps.pillarCount * 6);
      layer.controls.opacity.value = frame.pillarOpacity;
      layer.controls.rise.value = frame.fieldProgress;
      layer.controls.time.value = frame.flow;
      layer.controls.convergence.value = frame.pillarConvergence;
    });
  }

  getStats(): LightPillarStats { return { ...this.#stats }; }
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
  dispose(): void { this.#layers.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); }); this.group.removeFromParent(); this.group.clear(); }
}
```

- [ ] **Step 6: Run focused tests and build**

Run: `npm run test:unit -- --run tests/unit/effects/LightPillars.test.ts && npm run build`

Expected: the pillar test PASS and the production build complete.

- [ ] **Step 7: Commit light pillars**

```bash
git add src/effects/magicCircle/lightPillarGeometry.ts src/effects/magicCircle/lightPillarNodes.ts src/effects/magicCircle/LightPillars.ts tests/unit/effects/LightPillars.test.ts
git commit -m "feat: add tiered starlight pillars"
```

---

### Task 5: Replace Generic Gather Trails with Semantic White-Gold Stardust

**Files:**
- Modify: `src/effects/seededRandom.ts`
- Modify: `src/effects/particleNodes.ts`
- Modify: `src/effects/ParticleSystem.ts`
- Modify: `src/summon/SummonDirector.ts`
- Modify: `src/stage/Stage.ts`
- Modify: `tests/unit/effects/ParticleSystem.test.ts`
- Modify: `tests/unit/summon/SummonDirector.test.ts`
- Modify: `tests/e2e/dissolve.spec.ts`
- Modify: `tests/e2e/quality-selection.spec.ts`

**Interfaces:**
- Consumes: existing `ParticleBurstKind`, `FrameSignals`, `QualityTier`, `QUALITY_PROFILES[tier]`, and `getMagicCircleFrame(signals)` from Task 3.
- Produces: `SpellParticleKind`, deterministic `createSemanticParticleLayouts`, and expanded `ParticleSystemStats` with `quality`, `dustCount`, `risingLightCount`, `starFlareCount`, and `drawCalls`.

- [ ] **Step 1: Replace old trail-count assertions with semantic-count assertions**

```ts
it('uses deterministic semantic layouts and exact quality caps', () => {
  const first = new ParticleSystem(0x4d4f4f4e);
  const second = new ParticleSystem(0x4d4f4f4e);
  expect(first.getLayoutSample(8)).toEqual(second.getLayoutSample(8));

  for (const [quality, dustCount, risingLightCount, starFlareCount] of [
    ['high', 900, 90, 18],
    ['balanced', 520, 54, 12],
    ['compatibility', 240, 30, 6],
  ] as const) {
    first.update(frame('charged', 1), quality);
    expect(first.getStats()).toMatchObject({
      dustCount, risingLightCount, starFlareCount, drawCalls: 3,
      activeCount: dustCount + risingLightCount + starFlareCount,
    });
    expect(first.group.children.every((child) => child.visible)).toBe(true);
  }
  first.dispose();
  second.dispose();
});

it('reconstructs every summon particle phase from summon progress in one fixed frame', () => {
  const particles = new ParticleSystem(99);
  for (const [elapsedMs, mode] of [
    [120, 'release-flash'], [520, 'fill-rise'], [1500, 'cat-settle'],
  ] as const) {
    particles.update(frame('summoning', 1, 0, elapsedMs), 'high');
    expect(particles.getStats()).toMatchObject({ mode, activeCount: expect.any(Number) });
    expect(particles.getStats().activeCount).toBeGreaterThan(0);
  }
  particles.update(frame('summoning', 1, 0, 2400), 'high');
  expect(particles.getStats()).toMatchObject({ mode: 'gather', risingLightCount: 0, starFlareCount: 0 });
  expect(particles.getStats().dustCount).toBeGreaterThan(0);
  particles.update(frame('summoning', 1, 0, 2600), 'high');
  expect(particles.getStats().activeCount).toBe(0);
  particles.dispose();
});

it('stops flares in the first dissolve quarter while dust fades through the middle', () => {
  const particles = new ParticleSystem(77);
  particles.update(frame('dissolving', 1, 0.25), 'high');
  expect(particles.getStats().starFlareCount).toBe(0);
  expect(particles.getStats().dustCount).toBeGreaterThan(0);
  particles.update(frame('dissolving', 1, 0.55), 'high');
  expect(particles.getStats().dustCount).toBe(0);
  particles.dispose();
});
```

Update browser assertions to read:

```ts
type ParticleStats = {
  quality: 'high' | 'balanced' | 'compatibility';
  capacity: number;
  activeCount: number;
  allocatedObjects: number;
  dustCount: number;
  risingLightCount: number;
  starFlareCount: number;
  drawCalls: number;
};
```

and expect compatibility to report `{ dustCount: 240, risingLightCount: 30, starFlareCount: 6, drawCalls: 3 }`.

Replace the source stats interface rather than retaining the retired trail field:

```ts
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
```

- [ ] **Step 2: Run focused tests and verify the old API failure**

Run: `npm run test:unit -- --run tests/unit/effects/ParticleSystem.test.ts`

Expected: FAIL because the semantic fields do not exist.

- [ ] **Step 3: Add deterministic semantic layouts**

```ts
export type SpellParticleKind = 'dust' | 'riser' | 'flare';

export function createSemanticParticleLayouts(
  seed: number,
  capacities: { dust: number; riser: number; flare: number },
) {
  return {
    dust: createParticleLayout(capacities.dust, seed),
    riser: createParticleLayout(capacities.riser, seed ^ 0x52495345).map((point) => ({
      ...point,
      target: [
        Math.cos(point.seed * Math.PI * 2) * (0.35 + point.seed * 1.55),
        0.08 + point.seed * 3.8,
        Math.sin(point.seed * Math.PI * 2) * 0.42,
      ] as const,
    })),
    flare: createParticleLayout(capacities.flare, seed ^ 0x464c4152).map((point, index) => ({
      ...point,
      target: [
        Math.cos(index * Math.PI * 2 / capacities.flare) * 1.85,
        0.22 + point.seed * 2.9,
        Math.sin(index * Math.PI * 2 / capacities.flare) * 0.46,
      ] as const,
    })),
  } as const;
}
```

Preserve `createParticleLayout(count, seed)` unchanged so existing deterministic samples and burst paths remain stable.

- [ ] **Step 4: Split node behavior by semantic kind**

Change the material factory signature to:

```ts
export function createParticleNodeMaterial(
  attributes: ParticleNodeAttributes,
  kind: 'dust' | 'riser' | 'flare',
): { material: PointsNodeMaterial; controls: ParticleNodeControls }
```

Delete the retired `trailOffset`, `delayedCharge`, `trailFade`, and all trail-delay multipliers. Replace the old delayed gather line with:

```ts
const gatherAmount = smoothstep(float(0), float(1), charge);
```

Use these exact semantic differences for gather/dissolve only, then select the untouched existing burst position for summon modes:

```ts
const kindScale = kind === 'dust' ? float(0.72) : kind === 'riser' ? float(1.12) : float(2.1);
const kindSpeed = kind === 'dust' ? float(0.72) : kind === 'riser' ? float(1.55) : float(0.18);
const liftClock = time.mul(kindSpeed).mul(oneMinus(dissolve));
const verticalLift = liftClock.add(seed.mul(13)).fract().mul(kind === 'flare' ? 0.18 : 3.6);
const semanticGatherPosition = dissolved.add(vec3(
  time.mul(0.31).add(seed.mul(17)).sin().mul(kind === 'dust' ? 0.08 : 0.03),
  verticalLift,
  seed.mul(29).fract().sub(0.5).mul(kind === 'dust' ? 0.22 : 0.08),
));
const renderPosition = select(mode.equal(0), semanticGatherPosition, burstPosition);
material.positionNode = renderPosition;
const faceDistance = length(vec2(renderPosition.x.div(0.62), renderPosition.y.sub(3.55).div(0.48)));
const chestDistance = length(vec2(renderPosition.x.div(0.82), renderPosition.y.sub(2.95).div(0.62)));
material.sizeNode = size.mul(kindScale).mul(twinkle.mul(0.24).add(0.88));
material.colorNode = kind === 'dust'
  ? mix(color(0xfffdf2), color(0xf4d8a5), seed.mul(0.45))
  : color(kind === 'riser' ? 0xfff8e8 : 0xffffff);
material.opacityNode = softEdge.mul(opacity).mul(twinkle).mul(faceSafety).mul(chestSafety)
  .mul(kind === 'flare' ? smoothstep(float(0.58), float(1), twinkle) : 1);
```

Replace the existing face/chest distance definitions with the two `renderPosition` lines above; do not leave the retired versions that read the pre-semantic `position` variable.

Keep all burst modes (`release-flash`, `fill-rise`, `cat-settle`) and their existing positions intact.

- [ ] **Step 5: Replace five trail sprites with three semantic sprites**

In `ParticleSystem`, preallocate exactly three layers:

```ts
interface ParticleLayer {
  kind: SpellParticleKind;
  capacity: number;
  sprite: Sprite;
  material: PointsNodeMaterial;
  controls: ParticleNodeControls;
}

readonly #pool = new ParticlePool(QUALITY_PROFILES.high.burstParticles, (index) => index);
readonly #layouts: ReturnType<typeof createSemanticParticleLayouts>;
#counts = { dust: 0, riser: 0, flare: 0 };

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
```

Keep the existing diagnostics method deterministic by sampling the dense-dust layout:

```ts
getLayoutSample(count: number): ParticleLayoutPoint[] {
  return this.#layouts.dust.slice(0, Math.max(0, count)).map((point) => ({
    ...point, origin: [...point.origin], target: [...point.target],
  }));
}
```

Set counts in `update`:

```ts
const caps = QUALITY_PROFILES[quality];
const magicFrame = getMagicCircleFrame(signals);
const density = chargeDensity(signals.charge);
const fieldOpacity = magicFrame.dustOpacity;
const flareOpacity = signals.state === 'dissolving'
  ? 1 - smoothstep(signals.dissolve / 0.25)
  : fieldOpacity;
const dustCount = Math.round(caps.gatherStardust * density * fieldOpacity);
const risingLightCount = Math.round(caps.spellField.risingLightCount * density * fieldOpacity);
const starFlareCount = Math.round(caps.spellField.starFlareCount
  * smoothstep((signals.charge - 0.68) / 0.32) * flareOpacity);
```

Replace timestamp-triggered bursts with a pure reconstruction from `signals.summon`:

```ts
const SUMMON_PARTICLE_PHASES = [
  { kind: 'release-flash', startMs: EXPERIENCE_TIMING.releaseHoldMs, durationMs: 620 },
  { kind: 'fill-rise', startMs: EXPERIENCE_TIMING.fillStartMs, durationMs: 1140 },
  { kind: 'cat-settle', startMs: EXPERIENCE_TIMING.catMoveStartMs, durationMs: 860 },
] as const;

export function getSummonParticlePhase(signals: FrameSignals):
  { kind: ParticleBurstKind; progress: number } | null {
  if (signals.state !== 'summoning') return null;
  const elapsedMs = clamp01(signals.summon) * EXPERIENCE_TIMING.summonEndMs;
  let active: { kind: ParticleBurstKind; progress: number } | null = null;
  for (const phase of SUMMON_PARTICLE_PHASES) {
    if (elapsedMs >= phase.startMs && elapsedMs < phase.startMs + phase.durationMs) {
      active = { kind: phase.kind, progress: clamp01((elapsedMs - phase.startMs) / phase.durationMs) };
    }
  }
  return active;
}
```

During an active summon phase, set `#mode` to the returned kind and `burstProgress` to the returned progress. Set `dustCount` to `Math.round(caps.burstParticles * magicFrame.dustOpacity)`, `risingLightCount` to `Math.round(caps.spellField.risingLightCount * magicFrame.dustOpacity)`, and compute `starFlareCount` with both `magicFrame.dustOpacity` and `1 - smoothstep((burstProgress - 0.72) / 0.28)`. Set semantic-layer opacity to `magicFrame.dustOpacity * (1 - smoothstep((burstProgress - 0.72) / 0.28))`. For `summoning` before `120ms`, retain the fully charged gather counts; the pure phase function takes over at `120ms`.

When no phase remains and elapsed summon time is `2360–2600ms`, switch to the approved dust-only tail instead of dropping immediately to zero:

```ts
const tailCounts = {
  dust: Math.round(caps.gatherStardust * 0.12 * magicFrame.dustOpacity),
  riser: 0,
  flare: 0,
};
```

Use `magicFrame.dustOpacity` as the semantic-layer opacity during this tail. It is `0.14` at `2360ms` and reaches `0` at `2600ms`, so no riser or flare survives into `complete`.

Store `capacity` on each `ParticleLayer` when constructing it, then replace the old shared-count helper and stats with:

```ts
#setCounts(counts: { dust: number; riser: number; flare: number }): void {
  this.#pool.setActiveCount(counts.dust);
  const byKind = { dust: this.#pool.getStats().activeCount, riser: counts.riser, flare: counts.flare } as const;
  this.#layers.forEach(({ kind, capacity, sprite }) => {
    sprite.count = Math.max(0, Math.min(capacity, byKind[kind]));
  });
  this.#counts = { dust: byKind.dust, riser: byKind.riser, flare: byKind.flare };
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
```

Delete `TRAILS`, `#trailSegments`, `#applyVisibility`, `#pendingBurst`, `#burstStartedAt`, `BURST_DURATION`, and `burst(kind)`. Keep all three semantic sprites visible and control cost only through their instance counts; compatibility still renders dust, risers, and flares. `ParticleSystem.update` must be able to render any deterministic debug summon frame in one call. Remove the particle target and trigger set from `SummonDirector`; construct it as `new SummonDirector(moonCat)` in `Stage`. Update its unit test to assert only the cat reveal/path lifecycle—the three particle phases are now covered by the `ParticleSystem` fixed-frame test above.

Change the safe-downgrade browser assertion to inspect `{"quality":"balanced","drawCalls":3}` after the spell completes; active semantic counts are correctly zero in `complete`.

- [ ] **Step 6: Run unit, dissolve, and quality tests**

Run: `npm run test:unit -- --run tests/unit/effects/ParticleSystem.test.ts && npm run test:e2e -- tests/e2e/dissolve.spec.ts tests/e2e/quality-selection.spec.ts --project=chromium`

Expected: semantic counts, dissolve allocation baseline, safe quality downgrade, and burst modes all PASS.

- [ ] **Step 7: Commit semantic particles**

```bash
git add src/effects/seededRandom.ts src/effects/particleNodes.ts src/effects/ParticleSystem.ts src/summon/SummonDirector.ts src/stage/Stage.ts tests/unit/effects/ParticleSystem.test.ts tests/unit/summon/SummonDirector.test.ts tests/e2e/dissolve.spec.ts tests/e2e/quality-selection.spec.ts
git commit -m "feat: render semantic white-gold stardust"
```

---

### Task 6: Integrate the Star Circle, Pillars, Quality, and Diagnostics

**Files:**
- Modify: `src/effects/MagicCircle.ts`
- Modify: `src/stage/Stage.ts`
- Delete: `src/effects/magicCircle/glyphPaths.ts`
- Delete: `src/effects/magicCircle/createRingGeometry.ts`
- Modify: `tests/unit/effects/MagicCircle.test.ts`
- Modify: `tests/e2e/magic-circle.spec.ts`

**Interfaces:**
- Consumes: Tasks 1–5 modules, `FrameSignals`, `QualityTier`, and `LAYER_ORDER`.
- Produces: `MagicCircle.update(signals, quality)`, `MagicCircleSnapshot`, `reset()`, `dispose()`, and unchanged `canvas.dataset.magicCircle` diagnostics.

- [ ] **Step 1: Rewrite the unit test for the new orchestration contract**

```ts
it('meets the exact total spell draw budgets without removing core geometry', () => {
  const circle = new MagicCircle();
  circle.update(signals('charged', 1), 'high');
  expect(circle.group.position.y).toBeCloseTo(0.015);
  expect(circle.getSnapshot()).toMatchObject({
    ringProgress: 1, latticeProgress: 1, detailProgress: 1, fieldProgress: 1,
    pillarCount: 5, pillarLayers: 3, ribbonDrawCalls: 6, totalDrawCalls: 9,
    microMarkCount: 24, orbitLightCount: 6,
  });
  expect(circle.getSnapshot().totalDrawCalls + 3).toBe(12);
  circle.update(signals('charged', 1), 'balanced');
  expect(circle.getSnapshot()).toMatchObject({
    pillarCount: 4, pillarLayers: 2, ribbonDrawCalls: 5, totalDrawCalls: 7,
  });
  expect(circle.getSnapshot().totalDrawCalls + 3).toBe(10);
  circle.update(signals('charged', 1), 'compatibility');
  expect(circle.getSnapshot()).toMatchObject({
    pillarCount: 3, pillarLayers: 1, ribbonDrawCalls: 4, totalDrawCalls: 5,
    microMarkCount: 12, orbitLightCount: 2,
  });
  expect(circle.getSnapshot().totalDrawCalls + 3).toBe(8);
  circle.dispose();
});

it('resets rotations, pillar visibility, flash, and progress', () => {
  const circle = new MagicCircle();
  circle.update(signals('charged', 1), 'high');
  circle.reset();
  expect(circle.getSnapshot()).toMatchObject({
    opacity: 0, ringRotation: 0, latticeRotation: 0, orbitRotation: 0,
    detailRotation: 0, pillarCount: 0, releaseFlash: 0, chargeFlash: 0,
  });
  circle.dispose();
});
```

- [ ] **Step 2: Run the unit test and verify the old snapshot failure**

Run: `npm run test:unit -- --run tests/unit/effects/MagicCircle.test.ts`

Expected: FAIL because `MagicCircle.update` and the snapshot still expose the retired layer model.

- [ ] **Step 3: Replace old line layers with three core/halo ribbon groups**

Use this owner shape in `MagicCircle.ts`:

```ts
interface RibbonLayer {
  group: Group;
  haloMinPillarLayers: 1 | 2 | 3;
  core: { mesh: Mesh; geometry: BufferGeometry; material: MeshBasicNodeMaterial; controls: MagicCircleNodeControls };
  halo: { mesh: Mesh; geometry: BufferGeometry; material: MeshBasicNodeMaterial; controls: MagicCircleNodeControls };
}

function makeRibbonLayer(
  name: string, stage: StarPathStage, coreWidth: number, renderOrder: number,
  haloMinPillarLayers: 1 | 2 | 3,
): RibbonLayer {
  const group = new Group();
  group.name = name;
  const paths = pathsForStage(stage);
  const make = (variant: 'core' | 'halo', width: number, order: number) => {
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
```

Create `rings`, `lattice`, and `details` layers plus `LightPillars`. Add pillar meshes before the six ribbon meshes so the ground geometry stays readable.

Use these exact owner fields and construction order:

```ts
readonly group = new Group();
readonly #pillars = new LightPillars();
readonly #rings = makeRibbonLayer('magic-circle-rings', 'rings', 0.018, LAYER_ORDER.spellBack.min, 1);
readonly #lattice = makeRibbonLayer('magic-circle-lattice', 'lattice', 0.024, LAYER_ORDER.spellBack.min + 2, 2);
readonly #details = makeRibbonLayer('magic-circle-details', 'details', 0.012, LAYER_ORDER.spellBack.min + 4, 3);
readonly #activeCaps = { ...QUALITY_PROFILES.compatibility.spellField };

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
```

- [ ] **Step 4: Apply the pure frame and quality without a second timeline**

```ts
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
  this.#rings.group.rotation.y = MathUtils.euclideanModulo(this.#rings.group.rotation.y + delta * 0.07 * speed, Math.PI * 2);
  this.#lattice.group.rotation.y = -MathUtils.euclideanModulo(-this.#lattice.group.rotation.y + delta * 0.045 * speed, Math.PI * 2);
  this.#details.group.rotation.y = MathUtils.euclideanModulo(this.#details.group.rotation.y + delta * 0.09 * speed, Math.PI * 2);
}
```

Implement the ribbon application exactly once so the core and halo can never drift apart:

```ts
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
```

- [ ] **Step 5: Pass quality from Stage and expose diagnostics**

Change exactly one Stage call:

```ts
this.magicCircle.update(signals, quality);
```

Return this snapshot shape:

```ts
const ribbonDrawCalls = [this.#rings, this.#lattice, this.#details]
  .reduce((sum, layer) => sum + Number(layer.core.mesh.visible) + Number(layer.halo.mesh.visible), 0);
return {
  ...this.#frame,
  ringRotation: this.#rings.group.rotation.y,
  latticeRotation: this.#lattice.group.rotation.y,
  orbitRotation: this.#lattice.group.rotation.y,
  detailRotation: this.#details.group.rotation.y,
  ribbonDrawCalls,
  totalDrawCalls: ribbonDrawCalls + this.#pillars.getStats().layerCount,
  microMarkCount: this.#activeCaps.microMarkCount,
  orbitLightCount: this.#activeCaps.orbitLightCount,
  ...this.#pillars.getStats(),
};
```

Replace reset and disposal with fixed, exhaustive ownership cleanup:

```ts
reset(): void {
  this.group.scale.setScalar(1);
  Object.assign(this.#activeCaps, QUALITY_PROFILES.compatibility.spellField);
  for (const layer of [this.#rings, this.#lattice, this.#details]) layer.group.rotation.y = 0;
  this.#frame = getMagicCircleFrame({
    nowMs: 0, deltaSeconds: 0, state: 'idle', charge: 0, dissolve: 0, summon: 0,
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
```

- [ ] **Step 6: Delete the retired motif and line-geometry modules**

Delete `glyphPaths.ts` and `createRingGeometry.ts`, then verify no import or string remains:

Run: `rg -n "glyphPaths|createRingGeometry|cat-eye|moon-phase" src/effects tests/unit/effects tests/e2e/magic-circle.spec.ts`

Expected: no matches.

- [ ] **Step 7: Update browser phase and WebGL 2 assertions**

Change `tests/e2e/magic-circle.spec.ts` to assert:

```ts
for (const [charge, expected] of [
  [0, { ringProgress: 0, latticeProgress: 0, fieldProgress: 0, pillarCount: 0 }],
  [0.32, { ringProgress: 1, latticeProgress: 0, fieldProgress: 0, pillarCount: 0 }],
  [0.68, { ringProgress: 1, latticeProgress: 1, detailProgress: 1, fieldProgress: 0, pillarCount: 0 }],
  [1, { ringProgress: 1, latticeProgress: 1, detailProgress: 1, fieldProgress: 1, pillarCount: 5 }],
] as const) {
  await page.goto(`/?debug=1&quality=high&experienceState=${charge === 1 ? 'charged' : 'charging'}&charge=${charge}`);
  await waitForMagicCircle(page);
  expect(await snapshot(page)).toMatchObject(expected);
}
```

For forced WebGL 2 compatibility, expect all main progress fields to equal `1`, `pillarCount` to equal `3`, `pillarLayers` to equal `1`, `ribbonDrawCalls` to equal `4`, and magic-circle `totalDrawCalls` to equal `5`. Together with the three semantic particle draws, the complete spell field equals the approved compatibility budget of `8`.

- [ ] **Step 8: Run focused unit, browser, forbidden-renderer, and build checks**

Run: `npm run test:unit -- --run tests/unit/effects && npm run test:e2e -- tests/e2e/magic-circle.spec.ts --project=chromium && npm run rendering:forbidden-check && npm run build`

Expected: all unit tests PASS, both browser tests PASS, forbidden-renderer check PASS, and the production build completes.

- [ ] **Step 9: Commit the integrated star circle**

```bash
git add src/effects/MagicCircle.ts src/effects/magicCircle src/stage/Stage.ts tests/unit/effects tests/e2e/magic-circle.spec.ts
git commit -m "feat: integrate geometric starlight magic circle"
```

---

### Task 7: Tune Release Bloom and Preserve Every Existing Flow

**Files:**
- Modify: `src/rendering/postprocessingNodes.ts`
- Modify: `src/rendering/PostProcessing.ts`
- Create: `src/rendering/DirectPostProcessing.ts`
- Create: `src/rendering/createPostProcessing.ts`
- Modify: `src/app/createExperience.ts`
- Modify: `src/main.ts`
- Modify: `playwright.config.ts`
- Create: `tests/helpers/withBackend.ts`
- Modify: `tests/unit/rendering/postprocessingConfig.test.ts`
- Modify: `tests/e2e/postprocessing.spec.ts`
- Modify: `tests/e2e/summoning.spec.ts`
- Modify: `tests/e2e/reset.spec.ts`
- Modify: `tests/e2e/audio.spec.ts`
- Modify: `tests/e2e/interruption.spec.ts`
- Modify: `tests/e2e/resource-errors.spec.ts`
- Modify: `tests/e2e/quality-selection.spec.ts`

**Interfaces:**
- Consumes: existing `FrameSignals`, `EXPERIENCE_TIMING`, `QualityProfile`, and magic-circle/particle diagnostics.
- Produces: bounded charged-field bloom, release-flash bloom, a direct-render fallback when postprocessing construction/precompile fails, and regression assertions for summon, reset, audio, interruption, and resource handling.

- [ ] **Step 1: Add failing bounded-energy tests**

```ts
it('raises warm-field bloom only after the second charge boundary', () => {
  const before = getPostProcessingFrame(frame('charging', 0.68), QUALITY_PROFILES.high);
  const charged = getPostProcessingFrame(frame('charged', 1), QUALITY_PROFILES.high);
  expect(before.energy).toBe(0);
  expect(charged.energy).toBe(1);
  expect(charged.bloomStrength).toBeGreaterThan(before.bloomStrength);
  expect(charged.bloomStrength).toBeLessThanOrEqual(0.72);
});

it('creates a short release flash and then returns below the flash peak', () => {
  const flash = getPostProcessingFrame(frame('summoning', 1, 0, 120 / 2600), QUALITY_PROFILES.high);
  const fill = getPostProcessingFrame(frame('summoning', 1, 0, 900 / 2600), QUALITY_PROFILES.high);
  expect(flash.bloomStrength).toBeGreaterThan(fill.bloomStrength);
  expect(flash.bloomStrength).toBeLessThanOrEqual(1.1);
});
```

In the existing `peaks during charged and reveal while dissolving gently` test, update the approved upper bounds to match the new bounded glow:

```ts
expect(charged.bloomStrength).toBeLessThanOrEqual(0.72);
expect(reveal.bloomStrength).toBeLessThanOrEqual(1.1);
```

- [ ] **Step 2: Run the test and verify the old values fail**

Run: `npm run test:unit -- --run tests/unit/rendering/postprocessingConfig.test.ts`

Expected: FAIL because the current low bloom multiplier does not meet the charged/release contract.

- [ ] **Step 3: Implement bounded field and flash energy**

Replace the summoning/charge section in `getPostProcessingFrame` with:

```ts
let energy = 0;
let releaseFlash = 0;
if (signals.state === 'charging' || signals.state === 'charged') {
  energy = smooth((signals.charge - EXPERIENCE_TIMING.chargePhase2End) / (1 - EXPERIENCE_TIMING.chargePhase2End));
} else if (signals.state === 'dissolving') {
  const chargedEnergy = smooth((signals.charge - EXPERIENCE_TIMING.chargePhase2End) / (1 - EXPERIENCE_TIMING.chargePhase2End));
  energy = chargedEnergy * (1 - smooth(signals.dissolve));
} else if (signals.state === 'summoning') {
  const elapsedMs = clamp01(signals.summon) * EXPERIENCE_TIMING.summonEndMs;
  const flashIn = smooth(elapsedMs / EXPERIENCE_TIMING.releaseHoldMs);
  const flashOut = 1 - smooth((elapsedMs - 220) / 200);
  releaseFlash = flashIn * flashOut;
  const fill = clamp01((elapsedMs - EXPERIENCE_TIMING.fillStartMs)
    / (EXPERIENCE_TIMING.fillEndMs - EXPERIENCE_TIMING.fillStartMs));
  const fieldEnergy = 0.72 + Math.sin(Math.PI * fill) * 0.34;
  const retreat = 1 - smooth((elapsedMs - EXPERIENCE_TIMING.fillEndMs)
    / (EXPERIENCE_TIMING.catMoveEndMs - EXPERIENCE_TIMING.fillEndMs));
  energy = 0.16 + (fieldEnergy - 0.16) * retreat;
} else if (signals.state === 'complete') {
  energy = 0.16;
}

const bloomMultiplier = 0.16 + Math.min(1.1, energy) * 0.42 + releaseFlash * 0.42;
return {
  energy,
  bloomStrength: Math.min(profile.bloomStrength, profile.bloomStrength * bloomMultiplier),
  distortionStrength: distortionMultiplier * energy * 0.0028,
  distortionTimeSeconds: Math.max(0, signals.nowMs) / 1000,
  chromaticAberration: profile.chromaticAberration * Math.min(1, energy) * 0.18,
  afterImageDamp: profile.trails === 'fullscreen-and-4-particle' ? 0.18 + Math.min(1, energy) * 0.58 : 0,
};
```

Set the bloom nodes in `PostProcessing.update` to:

```ts
this.#bloom.radius.value = 0.32 + Math.min(1, this.#frame.energy) * 0.18;
this.#bloom.threshold.value = 0.58;
```

- [ ] **Step 4: Write and run the failing postprocessing fallback browser test**

Add this assertion to `tests/e2e/postprocessing.spec.ts`:

```ts
test('keeps the geometric summon visible when postprocessing initialization fails', async ({ page }) => {
  await page.goto('/?debug=1&fault=postprocessing-init&quality=compatibility&experienceState=charged&charge=1');
  await waitForPost(page);
  expect(await readPost(page)).toMatchObject({ renderPath: 'direct-fallback', bloomStrength: 0 });
  const circle = JSON.parse(await page.locator('canvas[data-render-surface]').getAttribute('data-magic-circle') ?? '{}');
  expect(circle).toMatchObject({ ringProgress: 1, latticeProgress: 1, detailProgress: 1, pillarCount: 3 });
  const activePng = await page.locator('#scene-canvas-host').screenshot();
  await page.goto('/?debug=1&fault=postprocessing-init&quality=compatibility&experienceState=idle&charge=0');
  await waitForPost(page);
  const baselinePng = await page.locator('#scene-canvas-host').screenshot();
  const active = await sharp(activePng).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const baseline = await sharp(baselinePng).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sampled = 0;
  let addedWarmPixels = 0;
  for (let y = Math.floor(active.info.height * 0.62); y < active.info.height; y += 1) {
    for (let x = 0; x < active.info.width; x += 1) {
      if (x > active.info.width * 0.36 && x < active.info.width * 0.64) continue;
      const offset = (y * active.info.width + x) * 3;
      const redGain = active.data[offset] - baseline.data[offset];
      const greenGain = active.data[offset + 1] - baseline.data[offset + 1];
      sampled += 1;
      if (redGain > 35 && greenGain > 28 && active.data[offset] > 150) addedWarmPixels += 1;
    }
  }
  expect(addedWarmPixels / sampled).toBeGreaterThan(0.003);
});
```

Run: `npm run test:e2e -- tests/e2e/postprocessing.spec.ts --project=chromium`

Expected: FAIL because an injected postprocessing initialization error still sends the whole experience to the fatal loading error.

- [ ] **Step 5: Add a direct-render fallback for postprocessing initialization failure**

Widen `PostProcessingSnapshot.renderPath` to `'r185-render-pipeline' | 'direct-fallback'` and export this shared owner interface from `PostProcessing.ts`:

```ts
export interface PostProcessingPort {
  precompile(): Promise<void>;
  setQuality(profile: QualityProfile): void;
  update(signals: FrameSignals): void;
  render(): void;
  clearHistory(): void;
  resize(width: number, height: number): void;
  getSnapshot(): PostProcessingSnapshot;
  dispose(): void;
}
```

Implement `DirectPostProcessing` with no bloom resources and the same lifecycle:

```ts
const IDLE_SIGNALS: FrameSignals = {
  nowMs: 0, deltaSeconds: 0, state: 'idle', charge: 0, dissolve: 0, summon: 0,
  pointerNdc: { x: 0, y: 0 },
};

export class DirectPostProcessing implements PostProcessingPort {
  #quality: QualityTier;
  #frame = getPostProcessingFrame(IDLE_SIGNALS, QUALITY_PROFILES.compatibility);

  constructor(
    readonly #renderer: WebGPURenderer,
    readonly #scene: Scene,
    readonly #camera: Camera,
    profile: QualityProfile,
  ) { this.#quality = tierForProfile(profile); }

  precompile(): Promise<void> { return this.#renderer.compileAsync(this.#scene, this.#camera, this.#scene); }
  setQuality(profile: QualityProfile): void { this.#quality = tierForProfile(profile); }
  update(signals: FrameSignals): void {
    this.#frame = { ...getPostProcessingFrame(signals, QUALITY_PROFILES[this.#quality]), bloomStrength: 0,
      distortionStrength: 0, chromaticAberration: 0, afterImageDamp: 0 };
  }
  render(): void { this.#renderer.render(this.#scene, this.#camera); }
  clearHistory(): void {}
  resize(width: number, height: number): void { void width; void height; }
  getSnapshot(): PostProcessingSnapshot {
    return { quality: this.#quality, renderPath: 'direct-fallback', distortion: 'off', afterImage: false,
      bloomResolutionScale: 0, ...this.#frame };
  }
  dispose(): void {}
}
```

Move `tierForProfile` to a named export, then create the guarded factory:

```ts
export async function createPostProcessing(
  renderer: WebGPURenderer, scene: Scene, camera: Camera, profile: QualityProfile,
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
```

Change `ExperienceRuntime.postProcessing` and its local owner to `PostProcessingPort`, call the factory instead of the constructor plus separate precompile, and add `injectPostProcessingFailure?: boolean` to `CreateExperienceOptions`. In all three `createExperience` calls in `main.ts` (graphics rebuild, debug initialization, and normal initialization), pass:

```ts
injectPostProcessingFailure: fault === 'postprocessing-init',
```

- [ ] **Step 6: Add summon and reset diagnostics assertions**

In `tests/e2e/summoning.spec.ts`, read `data-magic-circle` and assert at release:

```ts
expect(release.releaseFlash).toBeGreaterThan(0);
expect(release.pillarConvergence).toBeGreaterThanOrEqual(0);
expect(release.pillarCount).toBeGreaterThan(0);
```

At `summon=0.9`, assert `releaseFlash` is `0` and the cat remains visible. In `reset.spec.ts`, after returning to idle assert:

```ts
await expect(canvas).toHaveAttribute('data-magic-circle', /"pillarCount":0/);
await expect(canvas).toHaveAttribute('data-magic-circle', /"releaseFlash":0/);
await expect(canvas).toHaveAttribute('data-particle-stats', /"activeCount":0/);
```

- [ ] **Step 7: Strengthen audio, interruption, and resource regression assertions**

Create one reusable URL helper so the same regression cases can run on the default backend and forced WebGL 2 without copying test logic:

```ts
export function withBackend(pathAndQuery: string, projectName: string): string {
  const url = new URL(pathAndQuery, 'http://mimimia.test');
  if (projectName === 'chromium-webgl2') url.searchParams.set('backend', 'webgl2');
  return `${url.pathname}${url.search}${url.hash}`;
}
```

Use `withBackend(url, testInfo.project.name)` for every `page.goto` in `quality-selection.spec.ts`, `postprocessing.spec.ts`, `resource-errors.spec.ts`, and `interruption.spec.ts`. Keep explicit fault, quality, and debug parameters unchanged. Expand `playwright.config.ts` so the `chromium-webgl2` project matches those four files in addition to `full-flow.spec.ts` and the visual suite. In each spec's primary happy/fallback case, assert `body[data-render-backend="webgl2"]` when the project name is `chromium-webgl2`.

Add this separate real-runtime test to `audio.spec.ts`:

```ts
test('mute never changes the spell phase', async ({ page }) => {
  await page.goto('/?quality=compatibility');
  await expect(page.getByTestId('enter-button')).toBeEnabled({ timeout: 35_000 });
  await page.getByTestId('enter-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'idle');
  const canvas = page.locator('canvas[data-render-surface]');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('render canvas has no bounds');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'charged', { timeout: 5000 });
  const before = JSON.parse(await canvas.getAttribute('data-magic-circle') ?? '{}');
  await page.getByTestId('mute-button').click();
  const after = JSON.parse(await canvas.getAttribute('data-magic-circle') ?? '{}');
  expect(after).toMatchObject({
    ringProgress: before.ringProgress,
    latticeProgress: before.latticeProgress,
    detailProgress: before.detailProgress,
    fieldProgress: before.fieldProgress,
  });
  await page.mouse.up();
});
```

After each interruption scenario returns to idle, add:

```ts
await expect(canvas).toHaveAttribute('data-magic-circle', /"pillarCount":0/);
await expect(canvas).toHaveAttribute('data-particle-stats', /"activeCount":0/);
```

Add a separate request-boundary test to `resource-errors.spec.ts`:

```ts
test('never requests a magic-circle bitmap asset', async ({ page }) => {
  const requestedUrls: string[] = [];
  page.on('request', (request) => requestedUrls.push(request.url()));
  await page.goto('/?debug=1&quality=compatibility&experienceState=charged&charge=1');
  await expect(page.locator('canvas[data-render-surface]')).toHaveAttribute('data-render-ready', 'true', { timeout: 20_000 });
  expect(requestedUrls.some((url) => /magic-circle.*\.(png|webp|jpg)/i.test(url))).toBe(false);
});
```

- [ ] **Step 8: Run the full behavior subset in Chromium and forced WebGL 2**

Run: `npm run test:unit -- --run tests/unit/rendering/postprocessingConfig.test.ts && npm run test:e2e -- tests/e2e/postprocessing.spec.ts tests/e2e/summoning.spec.ts tests/e2e/reset.spec.ts tests/e2e/audio.spec.ts tests/e2e/interruption.spec.ts tests/e2e/resource-errors.spec.ts --project=chromium && npm run test:e2e -- tests/e2e/full-flow.spec.ts tests/e2e/quality-selection.spec.ts tests/e2e/postprocessing.spec.ts tests/e2e/resource-errors.spec.ts tests/e2e/interruption.spec.ts --project=chromium-webgl2`

Expected: charged bloom is bounded, release flash peaks once, summon/reset/audio/interruption/resources pass on the default backend, and forced WebGL 2 passes the complete flow plus loading/benchmark downgrade, postprocessing failure, resource failure, and focus-interruption matrices.

- [ ] **Step 9: Commit bloom and flow preservation**

```bash
git add src/rendering/postprocessingNodes.ts src/rendering/PostProcessing.ts src/rendering/DirectPostProcessing.ts src/rendering/createPostProcessing.ts src/app/createExperience.ts src/main.ts playwright.config.ts tests/helpers/withBackend.ts tests/unit/rendering/postprocessingConfig.test.ts tests/e2e/quality-selection.spec.ts tests/e2e/postprocessing.spec.ts tests/e2e/summoning.spec.ts tests/e2e/reset.spec.ts tests/e2e/audio.spec.ts tests/e2e/interruption.spec.ts tests/e2e/resource-errors.spec.ts
git commit -m "feat: choreograph white-gold release bloom"
```

---

### Task 8: Rebuild Visual Baselines and Verify Occlusion, Performance, and Privacy

**Files:**
- Modify: `src/app/createExperience.ts`
- Modify: `src/main.ts`
- Modify: `src/stage/Stage.ts`
- Modify: `scripts/assets/verify-private-boundary.mjs`
- Modify: `scripts/release/release-helpers.mjs`
- Modify: `tests/unit/release/releaseHelpers.test.ts`
- Modify: `tests/visual/visual-states.spec.ts`
- Modify: `tests/visual/occlusion.spec.ts`
- Modify: `tests/visual/__snapshots__/chromium-webgl2/**/*.png`
- Modify: `docs/reports/visual-review-report.md`
- Modify: `docs/reports/release-checklist.md`

**Interfaces:**
- Consumes: final runtime diagnostics and existing debug query parameters.
- Produces: reviewed visual baselines, total-effect highlight coverage, performance/reset evidence, privacy evidence, and release documentation.

- [ ] **Step 1: Extend the visual state matrix with release flash**

Add one deterministic state to `tests/visual/visual-states.spec.ts`:

```ts
{ name: 'release-flash', state: 'summoning', charge: 1, dissolve: 0, summon: 120 / 2600 },
```

Keep the existing idle, charging-mid, charged, dissolving-mid, summoning-mid, and complete states for both `1920×1080` and `1440×900` across all three tiers.

- [ ] **Step 2: Change occlusion comparison from particles-only to total spell effect**

Add `hideSpellField?: boolean` to `StageOptions` and `CreateExperienceOptions`. In `Stage` construction, apply it without affecting updates or timing:

```ts
this.magicCircle.group.visible = !options.hideSpellField;
this.particleSystem.group.visible = !options.hideParticles && !options.hideSpellField;
```

For the debug/visual initialization in `main.ts`, pass:

```ts
hideSpellField: visualTestMode && query.get('hideSpellField') === '1',
```

Change the test helper's final parameter from `hideParticles` to `hideSpellField` and write that query key. Compare the same state, quality, fixed time, camera, and character pose with only the full spell field hidden; postprocessing remains configured identically so its spill from the spell geometry is included while unrelated pose changes are excluded:

```ts
const baseline = await openFrame(page, quality, state, viewport, true);
const baselineImage = await baseline.canvas.screenshot();
const active = await openFrame(page, quality, state, viewport);
const activeImage = await active.canvas.screenshot();
const ratio = await protectedHighlightRatio(baselineImage, activeImage, active.points, viewport);
expect(ratio, `${viewport.width}×${viewport.height} ${quality} ${state}`).toBeLessThanOrEqual(0.08);
```

Do not use the old particles-only baseline in this test. The hidden baseline must disable both `magicCircle.group` and `particleSystem.group`, while leaving the same charged/summoning frame active.

The existing landmark/timing test must compare only tier-invariant frame values because the new snapshot intentionally reports tier-specific pillar, mark, orbit-light, and draw counts. Replace its `circle` timing payload with:

```ts
const circle = JSON.parse(await canvas.getAttribute('data-magic-circle') ?? '{}');
circle: {
  ringProgress: circle.ringProgress,
  latticeProgress: circle.latticeProgress,
  detailProgress: circle.detailProgress,
  fieldProgress: circle.fieldProgress,
  releaseScale: circle.releaseScale,
  releaseFlash: circle.releaseFlash,
  pillarConvergence: circle.pillarConvergence,
},
```

- [ ] **Step 3: Generate new local snapshots**

Run: `npm run test:visual -- --update-snapshots`

Expected: 42 snapshots are written: 7 states × 3 tiers × 2 viewports.

- [ ] **Step 4: Inspect every new snapshot and compare local target states with the private reference**

Inspect the `charged`, `release-flash`, and `summoning-mid` snapshots at both viewports. Locally place the user reference and the implementation screenshot side by side without copying the reference into the repository. Confirm:

- the ground array is warm white-gold rather than blue-violet;
- three interlaced twelve-point lattices are readable;
- high quality shows five pillars with different width/height;
- dust rises through the pillars and large flares are sparse;
- the girl remains in front and the face is not washed out;
- compatibility keeps the main geometry and three pillars;
- no reference UI, buttons, crop, or source pixels appear in the implementation.

If any item fails, adjust only the owning module, rerun its focused unit/E2E test, then regenerate and re-inspect the affected snapshots before continuing.

- [ ] **Step 5: Extend hash-boundary tests to both private references**

First change `tests/unit/release/releaseHelpers.test.ts` to import `PRIVATE_REFERENCE_SHA256S` and assert that `findPrivateHashCopies` finds a record matching each of the two known hashes while ignoring a safe hash. Run:

`npm run test:unit -- --run tests/unit/release/releaseHelpers.test.ts`

Expected: FAIL because the helper recognizes only the original private reference hash.

Replace the singular release helper constant with this immutable set and make `findPrivateHashCopies` use `.has(sha256)`:

```js
export const PRIVATE_REFERENCE_SHA256S = new Set([
  '068cb272738f78eb2ec3f10239de63450afeb433a44af8ee1abd24835b72ea23',
  'd66c00ebbedbfb68a84366165729b16ca88c4abe366851da59beed86ba3abd12',
]);
```

Import that set into `verify-private-boundary.mjs`. Keep the original local reference path and its original exact expected hash for the local-presence validation, add `tests` to `HASH_SCAN_ROOTS`, and use `PRIVATE_REFERENCE_SHA256S.has(await sha256(filePath))` when scanning every public candidate file. This detects a renamed or byte-identical copy of either private image in source, art, docs, public files, or visual baselines without adding the newer temporary filename or path to any tracked file.

Run: `npm run test:unit -- --run tests/unit/release/releaseHelpers.test.ts tests/unit/assets/provenance.test.ts && npm run assets:private-check`

Expected: both unit suites and the expanded public-boundary scan PASS.

- [ ] **Step 6: Run automated occlusion, performance, soak, and private-boundary checks**

Run: `npm run test:e2e -- tests/visual/occlusion.spec.ts --project=chromium-webgl2 && npm run perf:profile && npm run perf:soak && npm run assets:private-check && npm run assets:ledger-check && npm run rendering:forbidden-check`

Expected: face/chest coverage stays at or below 8%, the first-cast profile meets existing budgets, reset soak reports no object growth, both asset checks pass, and the rendering restriction check passes.

- [ ] **Step 7: Record exact evidence without embedding the private reference**

Update `docs/reports/visual-review-report.md` with:

```md
## 2026-07-14 纯几何白金星阵改版

- 视觉矩阵：42/42 通过（2 个视口 × 3 档画质 × 7 个状态）。
- 本地参考对照：通过；参考图未复制进仓库或测试基线。
- 高档：5 束光柱、三组十二角星格、完整暖白金柔光与星尘。
- 均衡档：4 束光柱，主结构与时间线不变。
- 兼容档：3 束光柱，主结构、召唤和 WebGL 2 流程完整。
- 人物脸部与胸前新增高亮覆盖：全部样本 ≤ 8%。
```

Update `docs/reports/release-checklist.md` with the actual command results, measured profile/soak values, browser matrix result, privacy check result, and the verified implementation commit hash (the Task 7 implementation tip). Do not call this self-referential report commit the final commit, and do not write the private reference filename or temporary path.

- [ ] **Step 8: Rebuild the release archives and run the full local acceptance gate**

Run: `npm run build && npm run test:unit -- --run && npm run test:e2e && npm run test:acceptance && npm run release:package && npm run release:verify`

Expected: build succeeds, all unit/browser/visual/acceptance checks pass, fresh source and distribution archives are created from this redesign, both archives reject either private hash, the packaged source rebuilds, the packaged site opens, and no test is left failing.

- [ ] **Step 9: Commit verified visual evidence and reports**

```bash
git add src/app/createExperience.ts src/main.ts src/stage/Stage.ts scripts/assets/verify-private-boundary.mjs scripts/release/release-helpers.mjs tests/unit/release/releaseHelpers.test.ts tests/visual docs/reports/visual-review-report.md docs/reports/release-checklist.md
git commit -m "test: verify geometric starlight visual matrix"
```

---

### Task 9: Publish to qiqiz4512-sketch and Verify the Public Page

**Files:**
- Modify only if verification values changed: `docs/reports/release-checklist.md`

**Interfaces:**
- Consumes: a clean verified branch, the existing `origin` remote, GitHub Actions, and GitHub Pages.
- Produces: pushed source, successful CI/Pages runs, and a publicly reachable verified page.

- [ ] **Step 1: Confirm the target account, remote, branch, and private boundary**

Run: `git remote -v && gh auth status && git status --short && npm run assets:private-check`

Expected: `origin` points to `qiqiz4512-sketch/mimimia`, GitHub authentication names `qiqiz4512-sketch`, only known user-owned untracked plan files remain, and the private-boundary check passes.

- [ ] **Step 2: Push the completed implementation to the public repository**

Run: `git push origin main`

Expected: the new commits are accepted by `github.com/qiqiz4512-sketch/mimimia.git` and `origin/main` advances to local `main`.

- [ ] **Step 3: Wait for CI and Pages deployment**

Run: `gh run list --repo qiqiz4512-sketch/mimimia --limit 10`

Identify the new CI and Pages run ids, then run:

```bash
gh run watch <ci-run-id> --repo qiqiz4512-sketch/mimimia --exit-status
gh run watch <pages-run-id> --repo qiqiz4512-sketch/mimimia --exit-status
```

Expected: both runs finish with `success`.

- [ ] **Step 4: Verify public transfer and HTML reachability**

Run: `curl -I https://qiqiz4512-sketch.github.io/mimimia/`

Expected: HTTP `200` and a `text/html` response.

- [ ] **Step 5: Perform the final real-browser acceptance pass on the public URL**

Open `https://qiqiz4512-sketch.github.io/mimimia/` in the approved browser and physically verify:

1. hold to charge;
2. early release dissolves softly;
3. charged hold remains stable;
4. release flashes and summons the cat;
5. the cat remains and follows the pointer;
6. reset permits a second full cast;
7. mute does not change animation;
8. all three tiers and automatic downgrade preserve timing;
9. forced WebGL 2 completes the flow;
10. loading, performance downgrade, resource failure, and focus loss produce the approved results.

Capture fresh evidence for charged, release-flash, summoning-mid, complete, compatibility, and WebGL 2 states. Do not upload or expose the private reference.

- [ ] **Step 6: Record final public verification if the deployed hash/run ids differ from the report**

Update only the exact hash, run ids, timestamp, public URL, and pass counts in `docs/reports/release-checklist.md`, then run:

```bash
npm run release:package
npm run release:verify
git add docs/reports/release-checklist.md
git commit -m "docs: record starlight deployment verification"
git push origin main
```

Expected: the report contains the actual deployed evidence and the final documentation deployment succeeds.

- [ ] **Step 7: Wait for and verify the final documentation deployment**

Run `gh run list --repo qiqiz4512-sketch/mimimia --limit 10`, identify the CI and Pages runs triggered by the Step 6 documentation push, then watch both with `gh run watch <run-id> --repo qiqiz4512-sketch/mimimia --exit-status`. Finally run:

```bash
curl -I https://qiqiz4512-sketch.github.io/mimimia/
git status --short
```

Expected: the second CI and Pages runs both succeed, the final public page still returns HTTP `200` with HTML content, and the working tree contains only the preserved user-owned untracked original plan.

---

## Final Verification Checklist

- [ ] `git diff --check` reports no whitespace errors.
- [ ] `rg -n "cat-eye|moon-phase|glyphPaths|createRingGeometry" src/effects tests/unit/effects tests/e2e/magic-circle.spec.ts` reports no retired magic-circle implementation matches (character eye assets are outside this deliberately narrow scope).
- [ ] `npm run build` passes.
- [ ] `npm run test:unit -- --run` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `npm run test:visual` passes against the reviewed 42-image baseline.
- [ ] `npm run test:acceptance` passes.
- [ ] `npm run perf:profile` passes existing budgets.
- [ ] `npm run perf:soak` reports no allocation growth.
- [ ] `npm run assets:private-check` passes.
- [ ] `npm run assets:ledger-check` passes.
- [ ] `npm run rendering:forbidden-check` passes.
- [ ] Forced WebGL 2 passes full flow, quality/benchmark downgrade, postprocessing fallback, resource failures, and focus interruption.
- [ ] Public GitHub Pages returns HTTP 200 and completes the ten required real-browser checks.
- [ ] Neither private reference image is tracked, built, packaged, documented by path, or publicly served.
