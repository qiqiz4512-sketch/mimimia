import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { argument, writeJson } from '../performance/browser-runtime.mjs';
import { inspectSceneScreenshot, visualEvidencePasses } from './visual-evidence.mjs';

const baseUrl = argument('url');
const outputPath = argument('output', 'docs/reports/evidence/mimimia-public-full-flow.json');
const screenshotPath = argument(
  'screenshot',
  'docs/reports/evidence/mimimia-public-geometric-starlight-complete.png',
);
const chargedScreenshotPath = argument(
  'charged-screenshot',
  'docs/reports/evidence/mimimia-public-geometric-starlight-charged.png',
);
const requestedChannel = argument('channel', 'chrome');
const headed = argument('headed', '0') === '1';

if (!baseUrl || !/^https:\/\//u.test(baseUrl)) {
  throw new Error('A public HTTPS URL is required with --url');
}

const browser = await chromium.launch({
  headless: !headed,
  channel: requestedChannel,
});

const waitForState = (page, expected, timeout = 15_000) =>
  page.locator(`body[data-experience-state="${expected}"]`).waitFor({ timeout });

const bodyDataset = (page) => page.evaluate(() => ({ ...document.body.dataset }));

const canvasJson = async (page, name) => {
  const raw = await page.locator('canvas[data-render-surface]').getAttribute(name);
  if (!raw) throw new Error(`Missing canvas dataset ${name}`);
  return JSON.parse(raw);
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function openPublicPage(context, route, beforeNavigation) {
  const page = await context.newPage();
  beforeNavigation?.(page);
  await page.goto(new URL(route, baseUrl).href, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.bringToFront();
  return page;
}

async function waitForEntry(page) {
  await page.locator('[data-testid="enter-button"]:not([disabled])').waitFor({ timeout: 120_000 });
}

async function installStateHistory(page) {
  await page.evaluate(() => {
    window.__mimimiaPublicStateHistory = [];
    const record = () => {
      const state = document.body.dataset.experienceState;
      if (state && window.__mimimiaPublicStateHistory.at(-1) !== state) {
        window.__mimimiaPublicStateHistory.push(state);
      }
    };
    record();
    window.__mimimiaPublicStateObserver?.disconnect();
    window.__mimimiaPublicStateObserver = new MutationObserver(record);
    window.__mimimiaPublicStateObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-experience-state'],
    });
  });
}

async function waitForHistory(page, expected, timeout = 20_000) {
  await page.waitForFunction(
    (state) => window.__mimimiaPublicStateHistory?.includes(state),
    expected,
    { timeout },
  );
}

async function canvasBounds(page) {
  const bounds = await page.locator('canvas[data-render-surface]').boundingBox();
  if (!bounds) throw new Error('The public render canvas has no bounds');
  return bounds;
}

async function moveToCastPoint(page, bounds) {
  await page.mouse.move(bounds.x + bounds.width * 0.52, bounds.y + bounds.height * 0.55);
}

async function completeCast(page, options = {}) {
  const { timeout = 20_000, onCharged, onSummoning } = options;
  await page.mouse.down();
  await waitForState(page, 'charged', timeout);
  await page.waitForTimeout(500);
  assert((await bodyDataset(page)).experienceState === 'charged', 'Full charge did not remain safe while held');
  await onCharged?.();
  await page.mouse.up();
  await waitForHistory(page, 'summoning', timeout);
  await waitForState(page, 'summoning', timeout);
  await onSummoning?.();
  await waitForState(page, 'complete', timeout);
  assert((await bodyDataset(page)).catVisible === 'true', 'The moon cat is not visible after summoning');
}

async function sampleAnimation(page, durationMs = 5_000) {
  return page.evaluate((duration) => new Promise((resolveSample) => {
    const frames = [];
    let first = null;
    let previous = null;
    const frame = (now) => {
      if (first === null) first = now;
      if (previous !== null) frames.push(now - previous);
      previous = now;
      if (now - first >= duration) {
        const sorted = [...frames].sort((left, right) => left - right);
        const elapsed = Math.max(1, now - first);
        const averageFps = frames.length * 1_000 / elapsed;
        const onePercentIndex = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99));
        const onePercentGap = sorted[Math.max(0, onePercentIndex)] ?? elapsed;
        resolveSample({
          durationMs: elapsed,
          frameCount: frames.length,
          averageFps,
          onePercentLowFps: 1_000 / Math.max(1, onePercentGap),
          maxFrameGapMs: Math.max(0, ...frames),
        });
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }), durationMs);
}

async function verifyFullFlow(context) {
  const consoleErrors = [];
  const failedRequests = [];
  const page = await openPublicPage(context, './', (nextPage) => {
    nextPage.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    nextPage.on('pageerror', (error) => consoleErrors.push(error.stack ?? error.message));
    nextPage.on('requestfailed', (request) => failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? 'unknown',
    }));
  });

  await page.locator('body[data-load-progress="1"]').waitFor({ timeout: 120_000 });
  await waitForEntry(page);
  const loading = await bodyDataset(page);
  const benchmarkDurationMs = Number(loading.qualityBenchmarkDuration);
  assert(loading.experienceState === 'entry', 'Loading did not finish at the entry state');
  assert(benchmarkDurationMs >= 3_000, 'The public quality benchmark was shorter than three seconds');

  await installStateHistory(page);
  await page.getByTestId('enter-button').click();
  await waitForState(page, 'idle');
  const bounds = await canvasBounds(page);
  await moveToCastPoint(page, bounds);

  await page.mouse.down({ button: 'right' });
  await page.waitForTimeout(150);
  assert((await bodyDataset(page)).experienceState === 'idle', 'Right click changed the spell state');
  await page.mouse.up({ button: 'right' });

  const mutedBefore = (await bodyDataset(page)).muted;
  await page.getByTestId('sound-button').click();
  await page.waitForFunction((previous) => document.body.dataset.muted !== previous, mutedBefore);
  const mutedAfter = (await bodyDataset(page)).muted;
  assert(mutedBefore !== mutedAfter, 'The sound control did not change its state');
  assert((await bodyDataset(page)).experienceState === 'idle', 'Sound control interrupted the idle animation');

  await moveToCastPoint(page, bounds);
  await page.mouse.down();
  await waitForState(page, 'charging');
  await page.waitForTimeout(150);
  await page.mouse.up();
  await waitForHistory(page, 'dissolving');
  await waitForState(page, 'idle');
  assert((await bodyDataset(page)).catVisible === 'false', 'Early release incorrectly summoned the cat');

  let charged = null;
  await completeCast(page, {
    onCharged: async () => {
      const screenshotOutput = resolve(chargedScreenshotPath);
      await mkdir(dirname(screenshotOutput), { recursive: true });
      const screenshotBuffer = await page.screenshot({ path: screenshotOutput, fullPage: true });
      const visualEvidence = await inspectSceneScreenshot(screenshotBuffer);
      const magicCircle = await canvasJson(page, 'data-magic-circle');
      const particles = await canvasJson(page, 'data-particle-stats');
      assert(visualEvidencePasses(visualEvidence), 'The public charged magic circle is not visibly present');
      assert(magicCircle.opacity === 1, 'Charged magic circle is not fully visible');
      assert(magicCircle.ringProgress === 1, 'Charged outer rings are incomplete');
      assert(magicCircle.latticeProgress === 1, 'Charged star lattice is incomplete');
      assert(magicCircle.detailProgress === 1, 'Charged precision details are incomplete');
      assert(magicCircle.pillarCount === 5, `Charged high tier has ${magicCircle.pillarCount} pillars instead of five`);
      charged = {
        body: await bodyDataset(page),
        magicCircle,
        particles,
        screenshot: chargedScreenshotPath,
        visualEvidence,
      };
    },
    onSummoning: async () => {
      const mutedAtSummon = (await bodyDataset(page)).muted;
      await page.getByTestId('sound-button').click();
      await page.waitForFunction((previous) => document.body.dataset.muted !== previous, mutedAtSummon);
      assert((await bodyDataset(page)).experienceState === 'summoning', 'Sound control interrupted the summoning animation');
    },
  });
  assert(charged !== null, 'Charged public evidence was not captured');

  await page.mouse.move(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.35);
  await page.waitForTimeout(300);
  const leftGaze = await canvasJson(page, 'data-cat');
  await page.mouse.move(bounds.x + bounds.width * 0.82, bounds.y + bounds.height * 0.62);
  await page.waitForTimeout(300);
  const rightGaze = await canvasJson(page, 'data-cat');
  assert(rightGaze.headDegrees > leftGaze.headDegrees, 'The cat head did not follow the pointer');
  assert(rightGaze.eyeOffsetFraction > leftGaze.eyeOffsetFraction, 'The cat eyes did not follow the pointer');

  const performance = await sampleAnimation(page);
  assert(performance.averageFps >= 30, `Public animation averaged only ${performance.averageFps.toFixed(2)} FPS`);
  assert(performance.maxFrameGapMs < 500, `Public animation stalled for ${performance.maxFrameGapMs.toFixed(1)} ms`);

  const screenshotOutput = resolve(screenshotPath);
  await mkdir(dirname(screenshotOutput), { recursive: true });
  const screenshotBuffer = await page.screenshot({ path: screenshotOutput, fullPage: true });
  const visualEvidence = await inspectSceneScreenshot(screenshotBuffer);
  assert(visualEvidencePasses(visualEvidence), 'The public completed summon is not visibly present');

  const firstComplete = {
    body: await bodyDataset(page),
    cat: await canvasJson(page, 'data-cat'),
    magicCircle: await canvasJson(page, 'data-magic-circle'),
    particles: await canvasJson(page, 'data-particle-stats'),
  };

  await page.getByTestId('reset-button').click();
  await waitForState(page, 'idle');
  let reset = {
    body: await bodyDataset(page),
    magicCircle: await canvasJson(page, 'data-magic-circle'),
    particles: await canvasJson(page, 'data-particle-stats'),
  };
  assert(reset.body.catVisible === 'false', 'Reset left the cat visible');
  assert(reset.magicCircle.opacity === 0, 'Reset left the magic circle visible');
  assert(reset.particles.activeCount === 0, 'Reset left live particles');

  await moveToCastPoint(page, bounds);
  await completeCast(page);
  const recastComplete = (await bodyDataset(page)).catVisible === 'true';
  assert(recastComplete, 'A second cast did not complete');
  await page.getByTestId('reset-button').click();
  await waitForState(page, 'idle');
  reset = {
    body: await bodyDataset(page),
    magicCircle: await canvasJson(page, 'data-magic-circle'),
    particles: await canvasJson(page, 'data-particle-stats'),
  };
  assert(reset.body.catVisible === 'false', 'Second reset left the cat visible');
  assert(reset.magicCircle.opacity === 0, 'Second reset left the magic circle visible');
  assert(reset.particles.activeCount === 0, 'Second reset left live particles');

  const stateHistory = await page.evaluate(() => [...(window.__mimimiaPublicStateHistory ?? [])]);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
  const result = {
    loading: {
      progress: loading.loadProgress,
      entryState: loading.experienceState,
      benchmarkDurationMs,
      selectedQuality: loading.qualityTier,
    },
    backend: firstComplete.body.renderBackend,
    charged,
    firstComplete,
    reset,
    recastComplete,
    leftGaze,
    rightGaze,
    performance,
    stateHistory,
    consoleErrors,
    failedRequests,
    resources,
    screenshot: screenshotPath,
    visualEvidence,
  };
  assert(result.backend === 'webgl2', `Expected the public fallback flow to use WebGL 2, got ${result.backend}`);
  assert(consoleErrors.length === 0, `Public flow logged errors: ${consoleErrors.join(' | ')}`);
  assert(failedRequests.length === 0, `Public flow had failed requests: ${JSON.stringify(failedRequests)}`);
  await page.close();
  return result;
}

async function verifyAutomaticQuality(context) {
  const page = await openPublicPage(context, './');
  await waitForEntry(page);
  await page.getByTestId('enter-button').click();
  await waitForState(page, 'idle');
  const initialTier = (await bodyDataset(page)).qualityTier;
  assert(initialTier === 'high', `Expected initial public tier high, got ${initialTier}`);

  await page.evaluate(() => {
    window.__mimimiaPublicQualityHistory = [];
    const record = () => {
      const tier = document.body.dataset.qualityTier;
      if (tier && window.__mimimiaPublicQualityHistory.at(-1)?.tier !== tier) {
        window.__mimimiaPublicQualityHistory.push({ tier, atMs: performance.now() });
      }
    };
    record();
    const observer = new MutationObserver(record);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-quality-tier'] });
    window.__mimimiaPublicQualityObserver = observer;
  });

  const session = await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 100 });
  try {
    await page.locator('body[data-quality-tier="balanced"]').waitFor({ timeout: 120_000 });
    await page.locator('body[data-quality-tier="compatibility"]').waitFor({ timeout: 150_000 });
  } finally {
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
  }
  const final = await bodyDataset(page);
  const transitions = await page.evaluate(() => [...(window.__mimimiaPublicQualityHistory ?? [])]);
  assert(final.qualityTier === 'compatibility', 'Automatic quality did not reach compatibility mode');
  assert(transitions.some(({ tier }) => tier === 'balanced'), 'Automatic quality skipped balanced mode');
  assert(transitions.some(({ tier }) => tier === 'compatibility'), 'Automatic quality skipped compatibility mode');
  assert(final.qualityPending === 'false', 'Automatic downgrade remained pending');
  await page.close();
  return { initialTier, transitions, finalTier: final.qualityTier, pending: final.qualityPending };
}

async function verifyInterruptionHandler(context) {
  const page = await openPublicPage(context, './');
  await waitForEntry(page);
  await page.getByTestId('enter-button').click();
  await waitForState(page, 'idle');
  await installStateHistory(page);
  const bounds = await canvasBounds(page);
  await moveToCastPoint(page, bounds);
  await page.mouse.down();
  await waitForState(page, 'charging');
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await waitForHistory(page, 'dissolving');
  await page.mouse.up();
  await waitForState(page, 'idle');
  const result = {
    blurEventRouted: true,
    body: await bodyDataset(page),
    magicCircle: await canvasJson(page, 'data-magic-circle'),
    particles: await canvasJson(page, 'data-particle-stats'),
  };
  assert(result.body.catVisible === 'false', 'Window blur summoned the cat');
  assert(result.magicCircle.pillarCount === 0, 'Window blur left light pillars');
  assert(result.particles.activeCount === 0, 'Window blur left live particles');
  await page.close();
  return result;
}

async function verifyMusicFailure(context) {
  const page = await context.newPage();
  let failedRequests = 0;
  await page.route('**/assets/audio/ambient-moon-void.mp3', async (route) => {
    failedRequests += 1;
    await route.abort('failed');
  });
  await page.goto(new URL('./', baseUrl).href, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForEntry(page);
  const entry = await bodyDataset(page);
  assert(entry.assetMuted === 'true', 'Music failure did not force silent mode');
  assert(entry.assetFailed.includes('ambient-moon-void'), 'Music failure was not recorded');
  await page.getByTestId('enter-button').click();
  await waitForState(page, 'idle');
  const body = await bodyDataset(page);
  assert(body.muted === 'true', 'Music failure did not keep the experience muted');
  assert(failedRequests >= 1, 'The music failure route was not exercised');
  await page.close();
  return { failedRequests, entry, body };
}

async function verifyCriticalAssetFailure(context) {
  const page = await context.newPage();
  let failedRequests = 0;
  const routePattern = '**/assets/characters/magical-girl/rig.json';
  await page.route(routePattern, async (route) => {
    failedRequests += 1;
    await route.abort('failed');
  });
  await page.goto(new URL('./', baseUrl).href, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const panel = page.locator('[data-render-error]');
  await panel.getByText('月光使者未能抵达').waitFor({ timeout: 120_000 });
  await page.getByTestId('reload-button').waitFor({ state: 'visible' });
  const body = await bodyDataset(page);
  const background = await panel.evaluate((node) => getComputedStyle(node).backgroundImage);
  assert(failedRequests === 2, `Critical asset retried ${failedRequests} times instead of twice`);
  assert(body.assetFailed.includes('girl-rig'), 'Critical asset failure was not recorded');
  assert(background.includes('gradient'), 'Critical asset failure produced a black result');
  assert(await page.locator('canvas[data-render-surface]').isHidden(), 'Failed critical scene kept the canvas visible');
  await page.unroute(routePattern);
  await page.getByTestId('reload-button').click();
  await waitForEntry(page);
  const recovered = await bodyDataset(page);
  assert(recovered.assetFailed === '', 'Reload did not clear the critical asset failure');
  assert(await page.locator('canvas[data-render-surface]').isVisible(), 'Reload did not restore the render canvas');
  await page.close();
  return { failedRequests, body, background, reloadVisible: true, reloadRecovered: true, recovered };
}

const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try {
  const fullFlow = await verifyFullFlow(context);
  const automaticQuality = await verifyAutomaticQuality(context);
  const interruptionHandler = await verifyInterruptionHandler(context);
  const musicFailure = await verifyMusicFailure(context);
  const criticalAssetFailure = await verifyCriticalAssetFailure(context);
  const report = {
    measuredAt: new Date().toISOString(),
    url: baseUrl,
    browser: {
      name: requestedChannel === 'chrome' ? 'Google Chrome' : requestedChannel,
      version: browser.version(),
      channel: requestedChannel,
      headed,
    },
    checks: {
      holdToCharge: true,
      earlyReleaseDissolved: true,
      heldChargeStayedSafe: true,
      completedSummon: true,
      catStayedVisibleAndFollowedPointer: true,
      recastAndReset: true,
      soundDidNotInterrupt: true,
      threeQualityTiersAndAutomaticDowngrade: true,
      webgl2FallbackCompletedFlow: true,
      loadingPerformanceResourceFailuresAndInterruptionHandler: true,
    },
    fullFlow,
    automaticQuality,
    interruptionHandler,
    resourceFailures: { music: musicFailure, criticalAsset: criticalAssetFailure },
  };
  const output = await writeJson(outputPath, report);
  console.log(`Public acceptance report written to ${output}`);
  console.log(JSON.stringify({
    checks: report.checks,
    backend: fullFlow.backend,
    performance: fullFlow.performance,
    charged: {
      pillarCount: fullFlow.charged.magicCircle.pillarCount,
      drawCalls: fullFlow.charged.magicCircle.totalDrawCalls,
      microMarkCount: fullFlow.charged.magicCircle.microMarkCount,
    },
    qualityTransitions: automaticQuality.transitions,
    resourceFailures: {
      musicRequests: musicFailure.failedRequests,
      criticalRequests: criticalAssetFailure.failedRequests,
    },
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
