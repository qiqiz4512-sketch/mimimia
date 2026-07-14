import { expect, test } from '@playwright/test';

type AudioSnapshot = {
  unlocked: boolean;
  muted: boolean;
  availableCueIds: string[];
  decodeFailures: string[];
  ambientLoopStarts: number;
  chargeLoopStarts: number;
  layerGains: { low: number; crystals: number; rise: number };
  cueCounts: { charged: number; dissolve: number; release: number; catForm: number };
  lastSignals: { state: string; charge: number; summon: number } | null;
};

test('unlocks real Web Audio on click and keeps mute independent from the animation frame', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('/?debug=1');
  await page.evaluate(async () => {
    const controllerPath = '/src/audio/AudioController.ts';
    const typesPath = '/src/audio/audioTypes.ts';
    const { AudioController } = await import(/* @vite-ignore */ controllerPath);
    const { AUDIO_CUE_IDS } = await import(/* @vite-ignore */ typesPath);
    const assets = new Map<string, Uint8Array>();
    for (const id of AUDIO_CUE_IDS) {
      const response = await fetch(`/assets/audio/${id}.mp3`);
      assets.set(id, new Uint8Array(await response.arrayBuffer()));
    }
    const controller = await AudioController.create(assets);
    const audioWindow = window as typeof window & {
      __audioController?: InstanceType<typeof AudioController>;
      __audioSnapshot?: () => AudioSnapshot;
      __audioUpdate?: (state: string, charge: number, dissolve?: number, summon?: number) => void;
    };
    audioWindow.__audioController = controller;
    audioWindow.__audioSnapshot = () => controller.getSnapshot();
    audioWindow.__audioUpdate = (state, charge, dissolve = 0, summon = 0) => controller.update({
      nowMs: performance.now(), deltaSeconds: 1 / 60, state, charge, dissolve, summon, pointerNdc: { x: 0, y: 0 },
    });
    const button = document.createElement('button');
    button.id = 'audio-unlock-test';
    button.textContent = '进入月光虚境';
    button.style.position = 'fixed';
    button.style.zIndex = '20';
    button.addEventListener('click', () => void controller.unlock());
    document.body.append(button);
  });

  const snapshot = () => page.evaluate(() => (window as typeof window & { __audioSnapshot: () => AudioSnapshot }).__audioSnapshot());
  expect(await snapshot()).toMatchObject({ unlocked: false, ambientLoopStarts: 0, chargeLoopStarts: 0, decodeFailures: [] });
  expect((await snapshot()).availableCueIds).toHaveLength(8);

  await page.locator('#audio-unlock-test').click();
  await expect.poll(async () => (await snapshot()).unlocked).toBe(true);
  expect(await snapshot()).toMatchObject({ ambientLoopStarts: 1, chargeLoopStarts: 3 });

  await page.evaluate(() => {
    const audioWindow = window as typeof window & {
      __audioController: { setMuted(muted: boolean): void };
      __audioUpdate: (state: string, charge: number, dissolve?: number, summon?: number) => void;
    };
    audioWindow.__audioUpdate('charging', 0.36);
    audioWindow.__audioUpdate('charged', 1);
    audioWindow.__audioController.setMuted(true);
  });
  const muted = await snapshot();
  expect(muted.layerGains.low).toBeGreaterThan(0);
  expect(muted.layerGains.crystals).toBeGreaterThan(0);
  expect(muted.cueCounts.charged).toBe(1);
  expect(muted).toMatchObject({ muted: true, lastSignals: { state: 'charged', charge: 1, summon: 0 } });

  await page.evaluate(() => {
    const audioWindow = window as typeof window & {
      __audioController: { setMuted(muted: boolean): void; reset(): void };
      __audioUpdate: (state: string, charge: number, dissolve?: number, summon?: number) => void;
    };
    audioWindow.__audioUpdate('dissolving', 1, 0.08);
    audioWindow.__audioController.reset();
    audioWindow.__audioUpdate('charged', 1);
    audioWindow.__audioUpdate('summoning', 1, 0, 0);
    const controller = audioWindow.__audioController;
    controller.setMuted(false);
  });
  expect(await snapshot()).toMatchObject({
    muted: false,
    cueCounts: { charged: 2, dissolve: 1, release: 1, catForm: 1 },
    lastSignals: { state: 'summoning', charge: 1, summon: 0 },
  });
});

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
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'charged', { timeout: 5_000 });
  const before = JSON.parse(await canvas.getAttribute('data-magic-circle') ?? '{}');
  await page.getByTestId('sound-button').click();
  const after = JSON.parse(await canvas.getAttribute('data-magic-circle') ?? '{}');
  expect(after).toMatchObject({
    ringProgress: before.ringProgress,
    latticeProgress: before.latticeProgress,
    detailProgress: before.detailProgress,
    fieldProgress: before.fieldProgress,
  });
  await page.mouse.up();
});
