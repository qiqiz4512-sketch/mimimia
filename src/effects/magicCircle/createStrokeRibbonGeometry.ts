import { BufferAttribute, BufferGeometry } from 'three/webgpu';
import type { StarPath, StarPathRole } from './geometricStarPaths';

export interface StrokeRibbonStats {
  pathCount: number;
  segmentCount: number;
  triangleCount: number;
}

const ROLE_VALUE: Record<StarPathRole, number> = { primary: 0, secondary: 0.5, detail: 1 };
const ROLE_WIDTH: Record<StarPathRole, number> = { primary: 1, secondary: 0.72, detail: 0.45 };

export function createStrokeRibbonGeometry(paths: readonly StarPath[], width: number): BufferGeometry {
  const positions: number[] = [];
  const strokeDraw: number[] = [];
  const strokeMotion: number[] = [];
  const strokeLifecycle: number[] = [];
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
          strokeDraw.push(
            path.drawStart + localProgress * (path.drawEnd - path.drawStart),
            localProgress,
            Math.abs(offset) * 2,
            ROLE_VALUE[path.role],
          );
          strokeMotion.push(
            path.microRank ?? 0,
            path.orbitBase ?? -1,
            path.flowSpeed ?? 1,
            0,
          );
          strokeLifecycle.push(path.fieldChannel ?? 0, path.dissolveRank ?? 1);
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
  geometry.setAttribute('strokeDraw', new BufferAttribute(new Float32Array(strokeDraw), 4));
  geometry.setAttribute('strokeMotion', new BufferAttribute(new Float32Array(strokeMotion), 4));
  geometry.setAttribute('strokeLifecycle', new BufferAttribute(new Float32Array(strokeLifecycle), 2));
  geometry.computeBoundingSphere();
  geometry.userData.stats = {
    pathCount: paths.length,
    segmentCount,
    triangleCount,
  } satisfies StrokeRibbonStats;
  return geometry;
}
