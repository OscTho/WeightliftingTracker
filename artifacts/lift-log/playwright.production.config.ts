import { defineConfig, devices } from '@playwright/test';

const port = 21584;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'production-smoke.spec.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  }],
  webServer: {
    command: 'pnpm run build && node e2e/production-server.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PORT: String(port), BASE_PATH: '/', NODE_ENV: 'production' },
  },
});