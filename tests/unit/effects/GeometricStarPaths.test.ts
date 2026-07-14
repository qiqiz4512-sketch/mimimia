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
