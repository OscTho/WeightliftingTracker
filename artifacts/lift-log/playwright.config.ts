import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: {
    baseURL: 'http://localhost:21583',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  // Start (or reuse) the Vite dev server before running tests.
  // In the Replit environment the workflow keeps the server warm;
  // reuseExistingServer ensures no double-start.
  webServer: {
    command: 'pnpm --filter @workspace/lift-log run dev',
    url: 'http://localhost:21583',
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      PORT: '21583',
      BASE_PATH: '/',
      NODE_ENV: 'development',
    },
  },
});
