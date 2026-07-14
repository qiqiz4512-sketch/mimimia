import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { argument, writeJson } from '../performance/browser-runtime.mjs';

const baseUrl = argument('url');
const outputPath = argument('output', 'docs/reports/evidence/mimimia-public-focus-loss.json');
const suiteReportPath = argument('suite-report', 'docs/reports/evidence/mimimia-public-full-flow.json');
const chromeBinary = argument('binary', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

if (process.platform !== 'darwin') throw new Error('Real public focus-loss verification currently requires macOS');
if (!baseUrl || !/^https:\/\//u.test(baseUrl)) throw new Error('A public HTTPS URL is required with --url');

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function waitUntil(check, label, timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const profile = await mkdtemp(path.join(tmpdir(), 'mimimia-public-focus-'));
const port = 9_400 + Math.floor(Math.random() * 400);
const child = spawn(chromeBinary, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });
let browserOutput = '';
child.stdout.on('data', (chunk) => { browserOutput += chunk; });
child.stderr.on('data', (chunk) => { browserOutput += chunk; });

let socket;
try {
  let target;
  await waitUntil(async () => {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = targets.find(({ type }) => type === 'page');
      return Boolean(target);
    } catch {
      if (child.exitCode !== null) throw new Error(`Chrome exited early:\n${browserOutput}`);
      return false;
    }
  }, 'Chrome debugging target', 30_000);

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  socket.addEventListener('close', () => {
    for (const resolvePending of pending.values()) {
      resolvePending({ error: { message: `Chrome debugging connection closed:\n${browserOutput}` } });
    }
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolveSend, rejectSend) => {
    id += 1;
    pending.set(id, (message) => {
      if (message.error) rejectSend(new Error(message.error.message));
      else resolveSend(message.result);
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: new URL('./', baseUrl).href });
  await send('Page.bringToFront');
  execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate']);
  await waitUntil(() => evaluate('document.hasFocus()'), 'focused public Chrome entry', 10_000);
  await waitUntil(
    () => evaluate("Boolean(document.querySelector('[data-testid=\"enter-button\"]:not([disabled])'))"),
    'enabled public entry button',
  );
  await evaluate(`window.__mimimiaPublicFocusHistory=[];
    window.__mimimiaPublicFocusEvents={blur:0,focus:0,visibility:[]};
    addEventListener('blur',()=>window.__mimimiaPublicFocusEvents.blur++);
    addEventListener('focus',()=>window.__mimimiaPublicFocusEvents.focus++);
    document.addEventListener('visibilitychange',()=>window.__mimimiaPublicFocusEvents.visibility.push(document.visibilityState));
    (()=>{const record=()=>{const value=document.body.dataset.experienceState;
    if(value&&window.__mimimiaPublicFocusHistory.at(-1)!==value)window.__mimimiaPublicFocusHistory.push(value)};
    record(); const observer=new MutationObserver(record); observer.observe(document.body,{attributes:true,attributeFilter:['data-experience-state']});})();
    document.querySelector('[data-testid="enter-button"]').click(); true`);
  await waitUntil(() => evaluate("document.body.dataset.experienceState==='idle'"), 'idle public scene');
  const bounds = await evaluate(`(()=>{const rect=document.querySelector('canvas[data-render-surface]').getBoundingClientRect();
    return {x:rect.x,y:rect.y,width:rect.width,height:rect.height}})()`);
  const x = bounds.x + bounds.width * 0.52;
  const y = bounds.y + bounds.height * 0.55;
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await waitUntil(() => evaluate("document.body.dataset.experienceState==='charging'"), 'charging public scene');
  await wait(500);

  await send('Page.bringToFront');
  execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate']);
  await waitUntil(() => evaluate('document.hasFocus()'), 'focused public Chrome tab', 5_000);
  const focusBefore = await evaluate('document.hasFocus()');
  execFileSync('osascript', [
    '-e', 'tell application "Google Chrome"',
    '-e', 'tell front window',
    '-e', 'make new tab at end with properties {URL:"about:blank"}',
    '-e', 'set active tab index to (count of tabs)',
    '-e', 'end tell',
    '-e', 'end tell',
  ]);
  await waitUntil(() => evaluate('!document.hasFocus()'), 'real public tab focus loss', 10_000);
  const focusLost = await evaluate('!document.hasFocus()');
  await wait(500);
  const focusEvents = await evaluate('({...window.__mimimiaPublicFocusEvents})');
  await send('Page.bringToFront');
  await waitUntil(() => evaluate('document.hasFocus()'), 'restored public tab focus', 10_000);
  await waitUntil(
    () => evaluate("window.__mimimiaPublicFocusHistory.includes('dissolving')"),
    'dissolve after real focus loss',
    20_000,
  );
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  await waitUntil(() => evaluate("document.body.dataset.experienceState==='idle'"), 'idle after focus-loss dissolve', 20_000);
  const final = await evaluate(`(()=>{const canvas=document.querySelector('canvas[data-render-surface]'); return {
    focused:document.hasFocus(), body:{...document.body.dataset},
    magicCircle:JSON.parse(canvas.dataset.magicCircle), particles:JSON.parse(canvas.dataset.particleStats),
    history:[...window.__mimimiaPublicFocusHistory]}})()`);
  const version = await send('Browser.getVersion');
  if (!focusBefore || !focusLost || !final.focused) throw new Error('The real Chrome focus transition was incomplete');
  if (focusEvents.blur < 1 && !focusEvents.visibility.includes('hidden')) {
    throw new Error(`The real Chrome focus transition emitted no interruption event: ${JSON.stringify(focusEvents)}`);
  }
  if (!final.history.includes('dissolving')) throw new Error('Real focus loss did not enter dissolve');
  if (final.body.catVisible !== 'false') throw new Error('Real focus loss summoned the cat');
  if (final.magicCircle.pillarCount !== 0 || final.particles.activeCount !== 0) {
    throw new Error('Real focus loss left spell resources visible');
  }

  const report = {
    measuredAt: new Date().toISOString(),
    url: baseUrl,
    browser: { product: version.product, userAgent: version.userAgent },
    focusBefore,
    focusLost,
    focusRestored: final.focused,
    focusEvents,
    stateHistory: final.history,
    final: {
      state: final.body.experienceState,
      catVisible: final.body.catVisible,
      pillarCount: final.magicCircle.pillarCount,
      activeParticles: final.particles.activeCount,
    },
    checks: {
      realTabFocusLoss: true,
      dissolvedWithoutSummoning: true,
      restoredFocus: true,
      clearedSpellResources: true,
    },
  };
  await writeJson(outputPath, report);
  const suiteReport = JSON.parse(await readFile(suiteReportPath, 'utf8'));
  suiteReport.actualFocusLoss = report;
  await writeJson(suiteReportPath, suiteReport);
  console.log(`Public focus-loss report written to ${path.resolve(outputPath)}`);
  console.log(JSON.stringify(report, null, 2));
  await send('Browser.close').catch(() => {});
} finally {
  socket?.close();
  if (child.exitCode === null) child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => child.once('exit', resolveExit)),
    wait(2_000),
  ]);
  await rm(profile, { recursive: true, force: true });
}
