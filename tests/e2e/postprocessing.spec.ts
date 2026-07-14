import { expect, test } from '@playwright/test';
import sharp from 'sharp';

import { withBackend } from '../helpers/withBackend';

type PostProcessingSnapshot = {
  quality: string;
  renderPath: string;
  bloomStrength: number;
  bloomResolutionScale: number;
  distortion: string;
  distortionStrength: number;
  chromaticAberration: number;
  afterImage: boolean;
};

const waitForPost = (page: import('@playwright/test').Page) =>
  page.locator('body[data-postprocessing-ready="true"]').waitFor({ timeout: 20_000 });
const readPost = (page: import('@playwright/test').Page) => page.locator('canvas[data-render-surface]').evaluate((canvas) =>
  JSON.parse((canvas as HTMLCanvasElement).dataset.postprocessing ?? '{}') as PostProcessingSnapshot);

test('renders the charged frame through the exact three quality pipelines', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  for (const [quality, expected] of [
    ['high', { distortion: 'full', afterImage: true, bloomResolutionScale: 0.5 }],
    ['balanced', { distortion: 'light', afterImage: false, bloomResolutionScale: 0.4 }],
    ['compatibility', { distortion: 'off', afterImage: false, bloomResolutionScale: 0.3 }],
  ] as const) {
    await page.goto(withBackend(`/?debug=1&quality=${quality}&experienceState=charged&charge=1`, testInfo.project.name));
    await waitForPost(page);
    if (testInfo.project.name === 'chromium-webgl2') {
      await expect(page.locator('body')).toHaveAttribute('data-render-backend', 'webgl2');
    }
    const snapshot = await readPost(page);
    expect(snapshot).toMatchObject({ quality, renderPath: 'r185-render-pipeline', ...expected });
    const screenshot = await page.locator('#scene-canvas-host').screenshot();
    const stats = await sharp(screenshot).removeAlpha().stats();
    expect(Math.max(...stats.channels.slice(0, 3).map(({ max }) => max))).toBeGreaterThan(220);
    expect(stats.channels[2].mean).toBeGreaterThan(stats.channels[0].mean);
  }
});

test('renders the reveal peak and compatibility fallback in forced WebGL 2', async ({ page }, testInfo) => {
  await page.goto(withBackend('/?debug=1&backend=webgl2&quality=compatibility&experienceState=summoning&charge=1&summon=0.43', testInfo.project.name));
  await waitForPost(page);
  await expect(page.locator('body')).toHaveAttribute('data-render-backend', 'webgl2');
  expect(await readPost(page)).toMatchObject({
    quality: 'compatibility',
    renderPath: 'r185-render-pipeline',
    distortion: 'off',
    afterImage: false,
  });
});

test('keeps the geometric summon visible when postprocessing initialization fails', async ({ page }, testInfo) => {
  await page.goto(withBackend('/?debug=1&fault=postprocessing-init&quality=compatibility&experienceState=charged&charge=1', testInfo.project.name));
  await waitForPost(page);
  if (testInfo.project.name === 'chromium-webgl2') {
    await expect(page.locator('body')).toHaveAttribute('data-render-backend', 'webgl2');
  }
  expect(await readPost(page)).toMatchObject({ renderPath: 'direct-fallback', bloomStrength: 0 });
  const circle = JSON.parse(await page.locator('canvas[data-render-surface]').getAttribute('data-magic-circle') ?? '{}');
  expect(circle).toMatchObject({ ringProgress: 1, latticeProgress: 1, detailProgress: 1, pillarCount: 3 });
  const activePng = await page.locator('#scene-canvas-host').screenshot();
  await page.goto(withBackend('/?debug=1&fault=postprocessing-init&quality=compatibility&experienceState=idle&charge=0', testInfo.project.name));
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
