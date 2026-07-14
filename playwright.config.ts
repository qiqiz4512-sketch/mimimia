import { defineConfig, devices } from '@playwright/test';

const testPort = process.env.MIMIMIA_TEST_PORT ?? '4174';
const testBaseUrl = `http://127.0.0.1:${testPort}`;

const stableChannelProjects = process.env.INCLUDE_STABLE_CHANNELS === '1'
  ? [
      {
        name: 'chrome-stable',
        use: { channel: 'chrome' as const, viewport: { width: 1280, height: 720 } },
        testMatch: ['e2e/full-flow.spec.ts'],
      },
      {
        name: 'edge-stable',
        use: { channel: 'msedge' as const, viewport: { width: 1280, height: 720 } },
        testMatch: ['e2e/full-flow.spec.ts'],
      },
    ]
  : [];

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'visual/**/*.spec.ts'],
  fullyParallel: false,
  // GPU-heavy browser scenes become timing-invalid when too many software
  // graphics contexts compete on the same validation machine.
  workers: 1,
  retries: 0,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/visual/__snapshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: testBaseUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['visual/**/*.spec.ts'],
    },
    ...stableChannelProjects,
    {
      name: 'chromium-webgl2',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        'e2e/full-flow.spec.ts',
        'e2e/quality-selection.spec.ts',
        'e2e/postprocessing.spec.ts',
        'e2e/resource-errors.spec.ts',
        'e2e/interruption.spec.ts',
        'visual/**/*.spec.ts',
      ],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['e2e/full-flow.spec.ts'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['e2e/full-flow.spec.ts'],
    },
  ],
  webServer: {
    command: `npm run dev -- --strictPort --port ${testPort}`,
    url: testBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
