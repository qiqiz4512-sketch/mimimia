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
