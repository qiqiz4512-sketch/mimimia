import { describe, expect, it } from 'vitest';

import { ExperienceMachine } from '../../../src/state/experienceMachine';

function readyMachine(): ExperienceMachine {
  const machine = new ExperienceMachine();
  machine.dispatch({ type: 'ASSETS_READY' }, 0);
  machine.dispatch({ type: 'ENTER' }, 1);
  return machine;
}

describe('ExperienceMachine', () => {
  it('follows the complete success and reset path', () => {
    const machine = new ExperienceMachine();
    expect(machine.snapshot().state).toBe('loading');

    machine.dispatch({ type: 'ASSETS_READY' }, 10);
    expect(machine.snapshot().state).toBe('entry');
    machine.dispatch({ type: 'ENTER' }, 20);
    machine.dispatch({ type: 'POINTER_DOWN' }, 100);
    expect(machine.snapshot().state).toBe('charging');

    machine.tick(2600);
    expect(machine.snapshot()).toMatchObject({ state: 'charged', charge: 1 });
    machine.tick(6100);
    expect(machine.snapshot()).toMatchObject({ state: 'charged', charge: 1 });

    machine.dispatch({ type: 'POINTER_UP' }, 6100);
    expect(machine.snapshot().state).toBe('summoning');
    machine.dispatch({ type: 'SUMMON_DONE' }, 8700);
    expect(machine.snapshot().state).toBe('complete');
    machine.dispatch({ type: 'RESET' }, 9000);
    expect(machine.snapshot().state).toBe('resetting');
    machine.dispatch({ type: 'RESET_DONE' }, 9500);
    expect(machine.snapshot()).toMatchObject({ state: 'idle', charge: 0 });
  });

  it('treats 2499 milliseconds as early release', () => {
    const machine = readyMachine();
    machine.dispatch({ type: 'POINTER_DOWN' }, 100);
    machine.tick(2599);
    expect(machine.snapshot().state).toBe('charging');
    expect(machine.snapshot().charge).toBeCloseTo(2499 / 2500, 6);

    machine.dispatch({ type: 'POINTER_UP' }, 2599);

    expect(machine.snapshot().state).toBe('dissolving');
    machine.dispatch({ type: 'DISSOLVE_DONE' }, 3599);
    expect(machine.snapshot()).toMatchObject({ state: 'idle', charge: 0 });
  });

  it('becomes charged at exactly 2500 milliseconds and cannot fail while held', () => {
    const machine = readyMachine();
    machine.dispatch({ type: 'POINTER_DOWN' }, 50);

    machine.tick(2550);
    machine.tick(25_550);

    expect(machine.snapshot()).toMatchObject({ state: 'charged', charge: 1 });
    machine.dispatch({ type: 'POINTER_UP' }, 25_550);
    expect(machine.snapshot().state).toBe('summoning');
  });

  it('routes every charging interruption through safe dissolve', () => {
    for (const elapsed of [500, 2500, 5000]) {
      const machine = readyMachine();
      machine.dispatch({ type: 'POINTER_DOWN' }, 100);
      machine.tick(100 + elapsed);
      machine.dispatch({ type: 'POINTER_CANCEL' }, 100 + elapsed);
      expect(machine.snapshot().state).toBe('dissolving');
    }
  });

  it('ignores spell input outside idle and active hold states', () => {
    const machine = new ExperienceMachine();
    machine.dispatch({ type: 'POINTER_DOWN' }, 1);
    expect(machine.snapshot().state).toBe('loading');
    machine.dispatch({ type: 'ASSETS_READY' }, 2);
    machine.dispatch({ type: 'POINTER_DOWN' }, 3);
    expect(machine.snapshot().state).toBe('entry');
    machine.dispatch({ type: 'ENTER' }, 4);
    machine.dispatch({ type: 'POINTER_UP' }, 5);
    expect(machine.snapshot().state).toBe('idle');
  });

  it('returns any interrupted runtime state to a clean idle snapshot after graphics recovery', () => {
    const machine = readyMachine();
    machine.dispatch({ type: 'POINTER_DOWN' }, 10);
    machine.tick(1_210);
    expect(machine.snapshot()).toMatchObject({ state: 'charging', charge: 0.48 });
    machine.dispatch({ type: 'RECOVER' }, 2_000);
    expect(machine.snapshot()).toMatchObject({
      state: 'idle',
      charge: 0,
      stateStartedAt: 2_000,
      chargeStartedAt: null,
    });
  });
});
