import { defineConfig, devices } from '@playwright/test';

const webPort = 21585;
const baseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'password-change-real.spec.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    // Browser traces can contain auth request bodies and response cookies.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    ...devices['Desktop Chrome'],
    viewport: { width: 390, height: 844 },
  },
});