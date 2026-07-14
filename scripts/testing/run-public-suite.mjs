import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const url = value('url');
const suiteReport = value('output', 'docs/reports/evidence/mimimia-public-full-flow.json');
if (!url) throw new Error('A public URL is required with --url');

execFileSync(process.execPath, ['scripts/testing/run-public-acceptance.mjs', ...args], { stdio: 'inherit' });
execFileSync(process.execPath, [
  'scripts/testing/run-public-focus-acceptance.mjs',
  '--url', url,
  '--output', 'docs/reports/evidence/mimimia-public-focus-loss.json',
  '--suite-report', suiteReport,
], { stdio: 'inherit' });
