import { describe, expect, it, vi } from 'vitest';

import { GraphicsRecovery, type GraphicsRendererPort } from '../../../src/recovery/GraphicsRecovery';

function renderer(): GraphicsRendererPort {
  return { onDeviceLost: vi.fn() };
}

describe('GraphicsRecovery', () => {
  it('prevents WebGL loss and coalesces backend and canvas reports into one rebuild', async () => {
    const canvas = new EventTarget();
    let activeRenderer = renderer();
    const replacement = renderer();
    const rebuildRuntime = vi.fn(async () => { activeRenderer = replacement; });
    const states: string[] = [];
    const recovery = new GraphicsRecovery({
      canvas,
      getRenderer: () => activeRenderer,
      rebuildRuntime,
      onStateChange: (snapshot) => states.push(snapshot.status),
    });
    recovery.watch();

    activeRenderer.onDeviceLost({ api: 'WebGL', message: 'lost', reason: null });
    const event = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(event);
    expect(rebuildRuntime).not.toHaveBeenCalled();
    expect(recovery.getSnapshot().status).toBe('recovering');
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    await recovery.whenSettled();

    expect(event.defaultPrevented).toBe(true);
    expect(rebuildRuntime).toHaveBeenCalledTimes(1);
    expect(states).toContain('recovering');
    expect(recovery.getSnapshot()).toMatchObject({ status: 'healthy', rebuildCount: 1 });

    replacement.onDeviceLost({ api: 'WebGPU', message: 'device lost', reason: 'unknown' });
    await recovery.whenSettled();
    expect(rebuildRuntime).toHaveBeenCalledTimes(2);
    expect(recovery.getSnapshot().rebuildCount).toBe(2);
  });

  it('reports a failed rebuild and stops reacting after disposal', async () => {
    const canvas = new EventTarget();
    const activeRenderer = renderer();
    const onFailure = vi.fn();
    const rebuildRuntime = vi.fn(async () => { throw new Error('rebuild failed'); });
    const originalDeviceLost = activeRenderer.onDeviceLost;
    const recovery = new GraphicsRecovery({
      canvas,
      getRenderer: () => activeRenderer,
      rebuildRuntime,
      onFailure,
    });
    recovery.watch();

    activeRenderer.onDeviceLost({ api: 'WebGPU', message: 'lost', reason: 'unknown' });
    await recovery.whenSettled();
    expect(recovery.getSnapshot()).toMatchObject({ status: 'failed', rebuildCount: 0 });
    expect(onFailure).toHaveBeenCalledOnce();

    recovery.dispose();
    expect(activeRenderer.onDeviceLost).toBe(originalDeviceLost);
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    await Promise.resolve();
    expect(rebuildRuntime).toHaveBeenCalledTimes(1);
  });
});
