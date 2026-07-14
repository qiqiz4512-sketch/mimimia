import { describe, expect, it } from 'vitest';
import { pathsForStage } from '../../../src/effects/magicCircle/geometricStarPaths';
import { createStrokeRibbonGeometry } from '../../../src/effects/magicCircle/createStrokeRibbonGeometry';

describe('stroke ribbon geometry', () => {
  it('packs stroke data into no more than eight WebGPU vertex buffers', () => {
    const geometry = createStrokeRibbonGeometry(pathsForStage('rings'), 0.018);
    expect(geometry.index).not.toBeNull();
    expect(Object.keys(geometry.attributes)).toEqual([
      'position',
      'strokeDraw',
      'strokeMotion',
      'strokeLifecycle',
    ]);
    expect(Object.keys(geometry.attributes)).toHaveLength(4);
    expect(geometry.userData.stats.pathCount).toBe(5);
    const draw = geometry.getAttribute('strokeDraw');
    expect(draw.itemSize).toBe(4);
    expect(draw.getX(0)).toBeGreaterThanOrEqual(0);
    expect(draw.getX(draw.count - 1)).toBeLessThanOrEqual(1);
    geometry.dispose();
  });

  it('preserves every shader semantic in the packed components', () => {
    const geometry = createStrokeRibbonGeometry([{
      id: 'packed-semantics',
      category: 'orbit',
      stage: 'details',
      role: 'secondary',
      points: [
        { x: 0, y: 0, pathArc: 0.25 },
        { x: 1, y: 0, pathArc: 0.75 },
      ],
      closed: false,
      drawStart: 0.2,
      drawEnd: 0.8,
      microRank: 0.35,
      orbitBase: 2,
      flowSpeed: 1.7,
      fieldChannel: 1,
      dissolveRank: 0.45,
    }], 0.024);
    const draw = geometry.getAttribute('strokeDraw');
    const motion = geometry.getAttribute('strokeMotion');
    const lifecycle = geometry.getAttribute('strokeLifecycle');

    expect([draw.getX(0), draw.getY(0), draw.getZ(0), draw.getW(0)])
      .toEqual([
        expect.closeTo(0.35, 5),
        expect.closeTo(0.25, 5),
        expect.closeTo(1, 5),
        expect.closeTo(0.5, 5),
      ]);
    expect([motion.getX(0), motion.getY(0), motion.getZ(0), motion.getW(0)])
      .toEqual([
        expect.closeTo(0.35, 5),
        expect.closeTo(2, 5),
        expect.closeTo(1.7, 5),
        expect.closeTo(0, 5),
      ]);
    expect([lifecycle.getX(0), lifecycle.getY(0)])
      .toEqual([expect.closeTo(1, 5), expect.closeTo(0.45, 5)]);
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
