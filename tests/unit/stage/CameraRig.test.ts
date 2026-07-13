import { describe, expect, it } from 'vitest';

import { CameraRig } from '../../../src/stage/CameraRig';

describe('CameraRig', () => {
  it.each([
    [1920, 1080],
    [1440, 900],
  ])('keeps the full-body safety frame visible at %d × %d', (width, height) => {
    const rig = new CameraRig();
    rig.resize(width, height);
    const frame = rig.getSafeFrame(width, height);

    expect(frame.hatTip.y).toBeGreaterThanOrEqual(height * 0.03);
    expect(frame.shoeBottom.y).toBeLessThanOrEqual(height * 0.97);
    expect(frame.faceCenter.y).toBeLessThan(height * 0.5);
    expect(frame.magicCircleCenter.y).toBeLessThan(height * 0.84);
    expect(frame.leftEdge.x).toBeGreaterThanOrEqual(width * 0.03);
    expect(frame.rightEdge.x).toBeLessThanOrEqual(width * 0.97);
  });

  it('uses the approved baseline lens, position, and target', () => {
    const rig = new CameraRig();
    expect(rig.camera.fov).toBe(32);
    expect(rig.baselinePosition.toArray()).toEqual([0, 3.4, 9]);
    expect(rig.target.toArray()).toEqual([0, 1.65, 0]);
  });

  it('holds until the last charge phase and then moves no more than four percent', () => {
    const rig = new CameraRig();
    rig.resize(1920, 1080);
    const baseline = rig.distanceToTarget();
    rig.setChargeProgress(0.68);
    expect(rig.distanceToTarget()).toBeCloseTo(baseline, 6);
    rig.setChargeProgress(1);
    expect(rig.distanceToTarget()).toBeCloseTo(baseline * 0.96, 6);
    rig.setChargeProgress(1);
    expect(rig.distanceToTarget()).toBeCloseTo(baseline * 0.96, 6);
  });

  it('returns to baseline during dissolve and uses at most 1.5 percent summon breathing', () => {
    const rig = new CameraRig();
    rig.resize(1440, 900);
    const baseline = rig.distanceToTarget();
    rig.setChargeProgress(1);
    rig.setDissolveProgress(1);
    expect(rig.distanceToTarget()).toBeCloseTo(baseline, 6);

    rig.setSummonProgress(0.5);
    expect(rig.distanceToTarget()).toBeLessThanOrEqual(baseline);
    expect(rig.distanceToTarget()).toBeGreaterThanOrEqual(baseline * 0.985);
    rig.setSummonProgress(1);
    expect(rig.distanceToTarget()).toBeCloseTo(baseline, 6);
  });
});
