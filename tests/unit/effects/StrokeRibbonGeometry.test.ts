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
