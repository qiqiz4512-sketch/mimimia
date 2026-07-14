import { expect, test } from '@playwright/test';

const state = (page: import('@playwright/test').Page, value: string, timeout = 8_000) =>
  expect(page.locator('body')).toHaveAttribute('data-experience-state', value, { timeout });

type StateHistoryWindow = Window & {
  __mimimiaStateHistory?: string[];
  __mimimiaStateObserver?: MutationObserver;
};

const installStateHistory = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const trackedWindow = window as StateHistoryWindow;
  const recordState = () => {
    const nextState = document.body.dataset.experienceState;
    if (!nextState || trackedWindow.__mimimiaStateHistory?.at(-1) === nextState) return;
    trackedWindow.__mimimiaStateHistory?.push(nextState);
  };

  trackedWindow.__mimimiaStateObserver?.disconnect();
  trackedWindow.__mimimiaStateHistory = [];
  recordState();
  trackedWindow.__mimimiaStateObserver = new MutationObserver(recordState);
  trackedWindow.__mimimiaStateObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-experience-state'],
  });
});

const stateHistory = (page: import('@playwright/test').Page) => page.evaluate(() =>
  [...((window as StateHistoryWindow).__mimimiaStateHistory ?? [])]);

const historyIncludes = (
  page: import('@playwright/test').Page,
  value: string,
  timeout = 8_000,
) => expect.poll(async () => (await stateHistory(page)).includes(value), { timeout }).toBe(true);

const canvasJson = async <T>(page: import('@playwright/test').Page, attribute: string): Promise<T> => {
  const value = await page.locator('canvas[data-render-surface]').getAttribute(attribute);
  if (!value) throw new Error(`Missing ${attribute}`);
  return JSON.parse(value) as T;
};

const graphicsAvailability = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const probe = document.createElement('canvas');
  return {
    webgl2Available: Boolean(probe.getContext('webgl2')),
    webgpuAvailable: 'gpu' in navigator,
  };
});

test('keeps the entire mouse, failure, summon, cat, sound, and reset flow coherent', async ({ browser, page }, testInfo) => {
  const automaticQuality = testInfo.project.name === 'chrome-stable' || testInfo.project.name === 'edge-stable';
  const slowRunner = automaticQuality || process.env.CI === 'true';
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? error.message));
  test.setTimeout(slowRunner ? 300_000 : 120_000);
  const params = new URLSearchParams(automaticQuality ? {} : { quality: 'compatibility' });
  if (testInfo.project.name === 'chromium-webgl2') params.set('backend', 'webgl2');
  await page.goto(`/?${params}`);
  await installStateHistory(page);
  const graphics = await graphicsAvailability(page);
  if (
    process.env.CI === 'true'
    && testInfo.project.name === 'firefox'
    && !graphics.webgl2Available
    && !graphics.webgpuAvailable
  ) {
    test.skip(true, 'Hosted Linux Firefox exposes neither WebGL 2 nor WebGPU; the recovery result is verified separately.');
  }
  const enterButton = page.getByTestId('enter-button');
  try {
    await expect(enterButton).toBeEnabled({ timeout: slowRunner ? 180_000 : 60_000 });
  } catch (error) {
    const diagnostics = await page.evaluate(() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      return {
        bodyDataset: { ...document.body.dataset },
        bodyText: document.body.innerText,
        webgl2Available: Boolean(gl),
        contextAttributes: gl?.getContextAttributes() ?? null,
        webgpuAvailable: 'gpu' in navigator,
        userAgent: navigator.userAgent,
      };
    });
    console.error(`ENTRY_DIAGNOSTICS ${JSON.stringify({ ...diagnostics, pageErrors })}`);
    throw error;
  }
  // Native keyboard activation avoids a WebKit pointer-injection flake on the
  // transitioning entry overlay while still exercising the button click path.
  await enterButton.press('Enter');
  await state(page, 'idle');

  const canvas = page.locator('canvas[data-render-surface]');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Render canvas has no bounds');
  await page.mouse.move(bounds.x + bounds.width * 0.52, bounds.y + bounds.height * 0.55);

  await page.mouse.down({ button: 'right' });
  await page.waitForTimeout(150);
  await state(page, 'idle');
  await page.mouse.up({ button: 'right' });
  await page.getByTestId('sound-button').click();
  await state(page, 'idle');
  await page.mouse.move(bounds.x + bounds.width * 0.52, bounds.y + bounds.height * 0.55);

  await page.mouse.down();
  if (!slowRunner) {
    await state(page, 'charging');
    await page.waitForTimeout(800);
  }
  await page.mouse.up();
  await historyIncludes(page, 'dissolving', slowRunner ? 30_000 : 8_000);
  await state(page, 'idle', slowRunner ? 30_000 : 8_000);
  await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'false');

  await page.mouse.down();
  await state(page, 'charged', slowRunner ? 30_000 : 6_000);
  await page.waitForTimeout(500);
  await state(page, 'charged');
  await page.mouse.up();
  if (slowRunner) {
    // Hosted runners can render at only a few frames per second. The
    // observer proves transient states occurred even when an action finishes
    // after the visible state has already advanced.
    await page.getByTestId('sound-button').click();
    await historyIncludes(page, 'summoning', 30_000);
    await state(page, 'complete', 60_000);
  } else {
    await state(page, 'summoning');
    const beforeReentry = await canvasJson<{ elapsedMs: number }>(page, 'data-summon');
    await page.mouse.down();
    await page.mouse.up();
    await page.getByTestId('sound-button').click();
    await page.waitForTimeout(250);
    await state(page, 'summoning');
    const afterReentry = await canvasJson<{ elapsedMs: number }>(page, 'data-summon');
    expect(afterReentry.elapsedMs).toBeGreaterThan(beforeReentry.elapsedMs);
    await state(page, 'complete');
  }
  await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'true');
  await page.mouse.move(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.35);
  await page.waitForTimeout(250);
  const leftGaze = await canvasJson<{ headDegrees: number; eyeOffsetFraction: number }>(page, 'data-cat');
  await page.mouse.move(bounds.x + bounds.width * 0.82, bounds.y + bounds.height * 0.62);
  await page.waitForTimeout(250);
  const rightGaze = await canvasJson<{ headDegrees: number; eyeOffsetFraction: number }>(page, 'data-cat');
  expect(rightGaze.headDegrees).toBeGreaterThan(leftGaze.headDegrees);
  expect(rightGaze.eyeOffsetFraction).toBeGreaterThan(leftGaze.eyeOffsetFraction);

  const matrixRecord = {
    measuredAt: new Date().toISOString(),
    project: testInfo.project.name,
    browserVersion: browser.version(),
    userAgent: await page.evaluate(() => navigator.userAgent),
    viewport: page.viewportSize(),
    backend: await page.locator('body').getAttribute('data-render-backend'),
    quality: await page.locator('body').getAttribute('data-quality-tier'),
    checks: {
      rightClickIgnored: true,
      soundDidNotInterrupt: true,
      earlyReleaseDissolved: true,
      heldChargeStayedSafe: true,
      completedSummon: true,
      catStayedVisible: true,
      catFollowedPointer: true,
    },
  };
  await testInfo.attach('browser-matrix-record', {
    body: JSON.stringify(matrixRecord, null, 2),
    contentType: 'application/json',
  });
  console.log(`BROWSER_MATRIX_RECORD ${JSON.stringify(matrixRecord)}`);

  await page.getByTestId('reset-button').click();
  await state(page, 'idle', slowRunner ? 30_000 : 3_000);
  await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'false');
  await expect(canvas).toHaveAttribute('data-particle-stats', /"activeCount":0/);
  await expect(canvas).toHaveAttribute('data-magic-circle', /"opacity":0/);
});

test('shows a recoverable result when hosted Firefox exposes no graphics backend', async ({ page }, testInfo) => {
  test.skip(
    process.env.CI !== 'true' || testInfo.project.name !== 'firefox',
    'This environment contract only applies to hosted Linux Firefox.',
  );

  await page.goto('/?quality=compatibility');
  const graphics = await graphicsAvailability(page);
  expect(graphics).toEqual({ webgl2Available: false, webgpuAvailable: false });
  await expect(page.getByText('图形环境暂时不可用')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: '重新加载' })).toBeEnabled();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'loading');
  console.log(`HOSTED_FIREFOX_GRAPHICS_RECOVERY ${JSON.stringify(graphics)}`);
});
