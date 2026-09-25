import { randomUUID } from 'node:crypto';
import { expect, test, type Browser, type BrowserContext } from '@playwright/test';

const previousPassword = `Old-${randomUUID()}-42!`;
const replacementPassword = `New-${randomUUID()}-84!`;

async function loginAttempt(
  browser: Browser,
  login: string,
  password: string,
  expectedStatus: 200 | 401,
  phase: string,
) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('/login');
    expect(await context.cookies(), `${phase}: browser should start signed out`).toHaveLength(0);
    await page.getByTestId('input-login').fill(login);
    await page.getByTestId('input-password').fill(password);

    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' && /\/api\/auth\/login$/.test(response.url()),
    );
    await page.getByTestId('button-login').click();
    const response = await responsePromise;
    expect(response.status(), phase).toBe(expectedStatus);

    if (expectedStatus === 401) {
      await expect(page.getByRole('alert'), phase).toHaveText("Those credentials don't match.");
      await expect(page).toHaveURL(/\/login(?:\?.*)?$/, phase);
    } else {
      await expect(page.getByRole('heading', { level: 1, name: /Ready when/ }), phase).toBeVisible();
      expect(
        (await context.cookies()).some((cookie) => cookie.name === 'lofte_session'),
        `${phase}: successful login should establish a browser session`,
      ).toBe(true);
    }
  } finally {
    await context.close();
  }
}

async function closeContext(context: BrowserContext | undefined) {
  if (context) await context.close();
}

test('production-built local web app changes a real account password and renews sessions', async ({ browser }) => {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
  const username = `pwtest_${suffix}`;
  const email = `pwtest_${suffix}@example.test`;
  const context = await browser.newContext();
  let olderContext: BrowserContext | undefined;

  try {
    const page = await context.newPage();

    await page.goto('/signup');
    await page.getByTestId('input-signup-username').fill(username);
    await page.getByTestId('input-signup-email').fill(email);
    await page.getByTestId('input-signup-password').fill(previousPassword);
    const signupResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' && /\/api\/auth\/signup$/.test(response.url()),
    );
    await page.getByTestId('button-signup').click();
    const signupResponse = await signupResponsePromise;
    expect(signupResponse.status(), 'signup should create the disposable athlete in the isolated test schema').toBe(201);
    expect(
      (await context.cookies()).some((cookie) => cookie.name === 'lofte_session'),
      'signup should establish the first browser session',
    ).toBe(true);

    await page.goto('/profile');
    await expect(page, 'signup session should open Profile').toHaveURL(/\/profile$/);
    await expect(page.getByText(username, { exact: true }), 'signup session should identify the new athlete').toBeVisible();
    await page.reload();
    await expect(page, 'initial session should persist after reload').toHaveURL(/\/profile$/);
    await expect(page.getByText(username, { exact: true }), 'initial session should reload the athlete account').toBeVisible();

    olderContext = await browser.newContext();
    await olderContext.addCookies(await context.cookies());
    const olderPage = await olderContext.newPage();
    await olderPage.goto('/profile');
    await expect(olderPage.getByText(username, { exact: true }), 'older browser session should be valid before the password change').toBeVisible();

    const originalCookie = (await context.cookies()).find((cookie) => cookie.name === 'lofte_session');
    expect(originalCookie, 'signup should have issued a session cookie').toBeTruthy();

    await page.getByTestId('button-open-change-password').click();
    await page.getByTestId('input-new-password').fill(replacementPassword);
    await page.getByTestId('input-confirm-new-password').fill(replacementPassword);
    const passwordResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' && /\/api\/auth\/password$/.test(response.url()),
    );
    await page.getByTestId('button-change-password').click();
    const passwordResponse = await passwordResponsePromise;
    expect(passwordResponse.status(), 'authenticated password-change API request should succeed').toBe(200);
    await expect(page.getByRole('status'), 'Profile should confirm the password change').toHaveText(
      'Password changed. You are still signed in.',
    );

    const replacementCookie = (await context.cookies()).find((cookie) => cookie.name === 'lofte_session');
    expect(
      Boolean(replacementCookie && originalCookie && replacementCookie.value !== originalCookie.value),
      'password change should replace the browser session cookie',
    ).toBe(true);

    await page.reload();
    await expect(page, 'replacement session should remain signed in after reload').toHaveURL(/\/profile$/);
    await expect(page.getByText(username, { exact: true }), 'replacement session should reload the same account').toBeVisible();

    await olderPage.reload();
    await expect(olderPage, 'password change should reject the older browser session').toHaveURL(/\/login(?:\?.*)?$/);
    await expect(olderPage.getByRole('heading', { name: 'Welcome back.' }), 'older session should reach the signed-out page').toBeVisible();

    await loginAttempt(browser, email, previousPassword, 401, 'fresh email login with previous password should be rejected');
    await loginAttempt(browser, email, replacementPassword, 200, 'fresh email login with replacement password should succeed');
    await loginAttempt(browser, username, previousPassword, 401, 'fresh username login with previous password should be rejected');
    await loginAttempt(browser, username, replacementPassword, 200, 'fresh username login with replacement password should succeed');
  } finally {
    await closeContext(olderContext);
    await context.close();
  }
});