import { mkdir, writeFile } from 'node:fs/promises';
import { arch, platform, release, totalmem } from 'node:os';
import { dirname, resolve } from 'node:path';

import { argument, ensureServer, LOCAL_URL, writeJson } from '../performance/browser-runtime.mjs';
import { bufferFromPngDataUrl, inspectSceneScreenshot } from './visual-evidence.mjs';

const webdriverUrl = argument('webdriver', 'http://127.0.0.1:4444');
const baseUrl = argument('url', LOCAL_URL);
const browserName = argument('browser', 'safari');
const browserBinary = argument('binary');
const requestedQuality = argument('quality', 'compatibility');
const outputPath = argument('output', `test-results/browser/${browserName}-full-flow.json`);
const screenshotPath = argument('screenshot');
const stopServer = await ensureServer(baseUrl);

async function command(path, method = 'GET', body) {
  const response = await fetch(`${webdriverUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.value?.error) {
    throw new Error(payload?.value?.message ?? `WebDriver request failed: ${method} ${path} (${response.status})`);
  }
  return payload.value;
}

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function waitUntil(check, label, timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

let sessionId;
try {
  const created = await command('/session', 'POST', {
    capabilities: {
      alwaysMatch: {
        browserName,
        ...(browserName === 'firefox' && browserBinary
          ? { 'moz:firefoxOptions': { binary: resolve(browserBinary) } }
          : {}),
      },
      firstMatch: [{}],
    },
  });
  sessionId = created.sessionId;
  const session = (path) => `/session/${sessionId}${path}`;
  const execute = (script, args = []) => command(session('/execute/sync'), 'POST', { script, args });
  const state = () => execute('return document.body?.dataset.experienceState ?? null');
  const waitForState = (expected, timeout = 8_000) => waitUntil(
    async () => (await state()) === expected,
    `experience state ${expected}`,
    timeout,
  );
  const click = (selector) => execute(`
    const node = document.querySelector(arguments[0]);
    if (!(node instanceof HTMLElement)) throw new Error('Missing element: ' + arguments[0]);
    node.click();
    return true;
  `, [selector]);
  const pointer = (actions) => command(session('/actions'), 'POST', {
    actions: [{
      type: 'pointer',
      id: 'mouse',
      parameters: { pointerType: 'mouse' },
      actions,
    }],
  });
  const move = (x, y) => pointer([{
    type: 'pointerMove',
    duration: 100,
    origin: 'viewport',
    x: Math.round(x),
    y: Math.round(y),
  }]);

  const url = new URL(baseUrl);
  if (['high', 'balanced', 'compatibility'].includes(requestedQuality)) {
    url.searchParams.set('quality', requestedQuality);
  }
  await command(session('/url'), 'POST', { url: url.href });
  await waitUntil(
    async () => Boolean(await execute("return Boolean(document.querySelector('[data-testid=\"enter-button\"]:not([disabled])'));")),
    'enabled enter button',
  );
  await click('[data-testid="enter-button"]');
  await waitForState('idle');

  const bounds = await execute(`
    const rect = document.querySelector('canvas[data-render-surface]')?.getBoundingClientRect();
    return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
  `);
  if (!bounds) throw new Error('Render canvas has no bounds');
  const center = { x: bounds.x + bounds.width * 0.52, y: bounds.y + bounds.height * 0.55 };
  await move(center.x, center.y);

  await pointer([{ type: 'pointerDown', button: 2 }, { type: 'pause', duration: 150 }, { type: 'pointerUp', button: 2 }]);
  await waitForState('idle');
  await click('[data-testid="sound-button"]');

  await pointer([{ type: 'pointerDown', button: 0 }]);
  await waitForState('charging');
  await wait(800);
  await pointer([{ type: 'pointerUp', button: 0 }]);
  await waitForState('dissolving');
  await waitForState('idle');
  const catAfterFailure = await execute("return document.body.dataset.catVisible === 'true'");
  if (catAfterFailure) throw new Error('Cat became visible after an early release');

  await pointer([{ type: 'pointerDown', button: 0 }]);
  await waitForState('charged', 6_000);
  await wait(500);
  if (await state() !== 'charged') throw new Error('Holding after full charge left the charged state');
  await pointer([{ type: 'pointerUp', button: 0 }]);
  await waitForState('summoning');
  await click('[data-testid="sound-button"]');
  await waitForState('complete');
  const catVisible = await execute("return document.body.dataset.catVisible === 'true'");
  if (!catVisible) throw new Error('Cat is not visible after the completed summon');

  await move(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.35);
  await wait(250);
  const leftGaze = await execute("return JSON.parse(document.querySelector('canvas[data-render-surface]').dataset.cat)");
  await move(bounds.x + bounds.width * 0.82, bounds.y + bounds.height * 0.62);
  await wait(250);
  const rightGaze = await execute("return JSON.parse(document.querySelector('canvas[data-render-surface]').dataset.cat)");
  if (!(rightGaze.headDegrees > leftGaze.headDegrees && rightGaze.eyeOffsetFraction > leftGaze.eyeOffsetFraction)) {
    throw new Error('Cat gaze did not follow the pointer');
  }

  let screenshot = null;
  let visualEvidence = null;
  let canvasScreenshot = null;
  let canvasVisualEvidence = null;
  let canvasDiagnostics = null;
  if (screenshotPath) {
    screenshot = resolve(screenshotPath);
    await mkdir(dirname(screenshot), { recursive: true });
    const base64 = await command(session('/screenshot'));
    const screenshotBuffer = Buffer.from(base64, 'base64');
    await writeFile(screenshot, screenshotBuffer);
    visualEvidence = await inspectSceneScreenshot(screenshotBuffer);
    console.log(`VISUAL_EVIDENCE ${JSON.stringify(visualEvidence)}`);

    const canvasCapture = await execute(`
      const canvas = document.querySelector('canvas[data-render-surface]');
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing render canvas');
      const gl = canvas.getContext('webgl2');
      const style = getComputedStyle(canvas);
      return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        contextAttributes: gl?.getContextAttributes() ?? null,
        glError: gl?.getError() ?? null,
      };
    `);
    const canvasBuffer = bufferFromPngDataUrl(canvasCapture.dataUrl);
    canvasScreenshot = screenshot.replace(/\.png$/i, '-canvas.png');
    await writeFile(canvasScreenshot, canvasBuffer);
    canvasVisualEvidence = await inspectSceneScreenshot(canvasBuffer, { crop: 'full' });
    canvasDiagnostics = { ...canvasCapture, dataUrl: undefined };
    console.log(`CANVAS_VISUAL_EVIDENCE ${JSON.stringify(canvasVisualEvidence)}`);
    console.log(`CANVAS_DIAGNOSTICS ${JSON.stringify(canvasDiagnostics)}`);
  }

  const runtime = await execute(`return {
    backend: document.body.dataset.renderBackend,
    quality: document.body.dataset.qualityTier,
    muted: document.body.dataset.muted,
    state: document.body.dataset.experienceState,
    catVisible: document.body.dataset.catVisible,
    userAgent: navigator.userAgent,
    particleStats: JSON.parse(document.querySelector('canvas[data-render-surface]').dataset.particleStats),
  }`);

  await click('[data-testid="reset-button"]');
  await waitForState('idle', 3_000);
  const reset = await execute(`return {
    state: document.body.dataset.experienceState,
    catVisible: document.body.dataset.catVisible,
    particleStats: JSON.parse(document.querySelector('canvas[data-render-surface]').dataset.particleStats),
    magicCircle: JSON.parse(document.querySelector('canvas[data-render-surface]').dataset.magicCircle),
  }`);
  if (reset.catVisible !== 'false' || reset.particleStats.activeCount !== 0 || reset.magicCircle.opacity !== 0) {
    throw new Error('Reset left visible spell resources behind');
  }

  const report = {
    measuredAt: new Date().toISOString(),
    url: url.href,
    browser: {
      name: created.capabilities?.browserName ?? browserName,
      version: created.capabilities?.browserVersion ?? created.capabilities?.version ?? 'unknown',
      platform: created.capabilities?.platformName ?? 'macOS',
    },
    host: { platform: platform(), release: release(), arch: arch(), memoryBytes: totalmem() },
    viewport: { width: Math.round(bounds.width), height: Math.round(bounds.height) },
    requestedQuality,
    checks: {
      rightClickIgnored: true,
      earlyReleaseDissolved: true,
      heldChargeStayedSafe: true,
      completedSummon: true,
      catStayedVisible: true,
      catFollowedPointer: true,
      soundDidNotInterrupt: true,
      resetClearedSpell: true,
    },
    runtime,
    reset,
    screenshot,
    visualEvidence,
    canvasScreenshot,
    canvasVisualEvidence,
    canvasDiagnostics,
  };
  const output = await writeJson(outputPath, report);
  console.log(`${report.browser.name} full-flow report written to ${output}`);
  console.log(JSON.stringify({ browser: report.browser, checks: report.checks, runtime, reset }, null, 2));
  if (visualEvidence && !visualEvidence.passed) {
    throw new Error('Completed summon screenshot does not contain visible scene highlights');
  }
} finally {
  if (sessionId) {
    await command(`/session/${sessionId}`, 'DELETE').catch(() => {});
  }
  await stopServer();
}
