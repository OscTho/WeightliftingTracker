import { test, expect } from '@playwright/test';
import { AUTH_SESSION, setupMocks, PROFILE } from './fixtures';

test.describe('Profile', () => {
  test('loading state — skeleton visible while fetching', async ({ page }) => {
    await page.route(/\/api\/profile/, () => { /* hang */ });
    await page.goto('/profile');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('with existing profile — fields pre-filled', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await expect(page.getByTestId('input-name')).toHaveValue('Alex Johnson');
    await expect(page.getByTestId('input-snatchPb')).toHaveValue('90');
    await expect(page.getByTestId('input-cleanJerkPb')).toHaveValue('110');
    await expect(page.getByTestId('input-backSquatPb')).toHaveValue('150');
    await expect(page.getByTestId('input-frontSquatPb')).toHaveValue('130');
  });

  test('without an existing profile — blank form remains editable', async ({ page }) => {
    await setupMocks(page, { profile: 404 });
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'Your numbers.' })).toBeVisible();
    await expect(page.getByText('Personal bests', { exact: true })).toBeVisible();
    await expect(page.getByText('Weight rounding', { exact: true })).toBeVisible();
    await expect(page.getByTestId('input-name')).toHaveValue('');
    await expect(page.getByTestId('input-snatchPb')).toHaveValue('0');
    await expect(page.getByTestId('button-save-profile')).toBeVisible();
    await expect(page.getByText('PROFILE NOT SAVED', { exact: true })).toBeVisible();

    await page.getByTestId('input-name').fill('Alex Johnson');
    await expect(page.getByTestId('input-name')).toHaveValue('Alex Johnson');
  });

  test('without an existing profile — entered data can create it', async ({ page }) => {
    await page.route(/\/api\/profile$/, async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 404, body: JSON.stringify({ error: 'Profile not found' }), contentType: 'application/json' });
      }

      const input = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ id: 1, ...input, updatedAt: '2026-09-07T09:00:00.000Z' }),
        contentType: 'application/json',
      });
    });
    await page.goto('/profile');

    await page.getByTestId('input-name').fill('Alex Johnson');
    await page.getByTestId('input-snatchPb').fill('90');
    await page.getByTestId('input-cleanJerkPb').fill('110');
    await page.getByTestId('input-backSquatPb').fill('150');
    await page.getByTestId('input-frontSquatPb').fill('130');
    await page.getByTestId('button-save-profile').click();

    await expect(page.getByTestId('button-save-profile')).toContainText('Saved');
    await expect(page.getByText('PROFILE SAVED', { exact: true })).toBeVisible();
  });

  test('save button present and accessible', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    const saveBtn = page.getByTestId('button-save-profile');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toContainText('Save changes');
  });

  test('rounding increment buttons rendered with active state', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await expect(page.getByTestId('button-rounding-1')).toBeVisible();
    await expect(page.getByTestId('button-rounding-2')).toBeVisible();
    await expect(page.getByTestId('button-rounding-2.5')).toBeVisible();
  });

  test('page title uses the mobile display styles', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/font-display/);
    await expect(h1).toHaveCSS('font-size', '44px');
    await expect(h1).toContainText('Your numbers.');
  });

  test('profile header eyebrow uses mobile display styles', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    const eyebrow = page.getByText('Profile', { exact: true }).first();
    await expect(eyebrow).toBeVisible();
    await expect(eyebrow).toHaveClass(/font-display/);
  });

  test('profile sections use the current mobile copy', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await expect(page.getByText('Personal bests', { exact: true })).toBeVisible();
    await expect(page.getByText('Weight rounding', { exact: true })).toBeVisible();
  });

  test('profile nav item is active when on profile page', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await expect(page.getByTestId('link-nav-profile')).toHaveClass(/bg-primary/);
  });

  test('export downloads the API response as formatted JSON', async ({ page }) => {
    const exportedAccount = {
      exportedAt: '2026-09-21T12:00:00.000Z',
      profile: PROFILE,
      programmes: [],
      workouts: [],
      customMovements: [],
    };
    await setupMocks(page, { profile: PROFILE });
    await page.route(/\/api\/account\/export$/, async (route) => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify(exportedAccount),
        contentType: 'application/json',
      });
    });
    await page.goto('/profile');

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('button-export-data').click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));

    expect(download.suggestedFilename()).toMatch(/^lofte-data-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(Buffer.concat(chunks).toString('utf8'))).toEqual(exportedAccount);
  });

  test('password change validates length and matching confirmation before submitting', async ({ page }) => {
    let requests = 0;
    await setupMocks(page, { profile: PROFILE });
    await page.route(/\/api\/auth\/password$/, async (route) => {
      requests += 1;
      return route.fulfill({ status: 200, body: JSON.stringify(AUTH_SESSION), contentType: 'application/json' });
    });
    await page.goto('/profile');
    await page.getByTestId('button-open-change-password').click();

    await page.getByTestId('input-new-password').fill('short');
    await page.getByTestId('input-confirm-new-password').fill('short');
    await page.getByTestId('button-change-password').click();
    await expect(page.getByRole('alert')).toHaveText('Password must be between 8 and 128 characters.');

    await page.getByTestId('input-new-password').fill('ValidPassword42!');
    await page.getByTestId('input-confirm-new-password').fill('DifferentPassword42!');
    await page.getByTestId('button-change-password').click();
    await expect(page.getByRole('alert')).toHaveText('Passwords do not match.');
    expect(requests).toBe(0);
  });

  test('successful password change clears fields and retains authentication', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.route(/\/api\/auth\/password$/, async (route) => {
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toEqual({ password: 'ValidPassword42!' });
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ ...AUTH_SESSION, token: 'replacement-token' }),
        contentType: 'application/json',
      });
    });
    await page.goto('/profile');
    await page.getByTestId('button-open-change-password').click();
    await page.getByTestId('input-new-password').fill('ValidPassword42!');
    await page.getByTestId('input-confirm-new-password').fill('ValidPassword42!');
    await page.getByTestId('button-change-password').click();

    await expect(page.getByRole('status')).toHaveText('Password changed. You are still signed in.');
    await expect(page.getByTestId('input-new-password')).toHaveValue('');
    await expect(page.getByTestId('input-confirm-new-password')).toHaveValue('');
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('password change failure stays open and shows a safe inline error', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.route(/\/api\/auth\/password$/, async (route) => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'internal detail' }),
      contentType: 'application/json',
    }));
    await page.goto('/profile');
    await page.getByTestId('button-open-change-password').click();
    await page.getByTestId('input-new-password').fill('ValidPassword42!');
    await page.getByTestId('input-confirm-new-password').fill('ValidPassword42!');
    await page.getByTestId('button-change-password').click();

    await expect(page.getByRole('dialog', { name: 'Change password' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText('Could not change your password. Please try again.');
    await expect(page.getByText('internal detail')).toHaveCount(0);
  });

  test('deletion stays disabled until password and exact confirmation are entered', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await page.getByTestId('button-open-delete-account').click();
    const confirmButton = page.getByTestId('button-confirm-delete-account');
    await expect(confirmButton).toBeDisabled();

    await page.getByTestId('input-delete-password').fill('correct-password');
    await expect(confirmButton).toBeDisabled();

    await page.getByTestId('input-delete-confirmation').fill('delete');
    await expect(confirmButton).toBeDisabled();

    await page.getByTestId('input-delete-confirmation').fill('DELETE');
    await expect(confirmButton).toBeEnabled();
  });

  test('wrong deletion password keeps confirmation open and athlete signed in', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.route(/\/api\/account$/, async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      return route.fulfill({
        status: 403,
        body: JSON.stringify({ error: 'Your current password is incorrect.' }),
        contentType: 'application/json',
      });
    });
    await page.goto('/profile');

    await page.getByTestId('button-open-delete-account').click();
    await page.getByTestId('input-delete-password').fill('wrong-password');
    await page.getByTestId('input-delete-confirmation').fill('DELETE');
    await page.getByTestId('button-confirm-delete-account').click();

    await expect(page.getByRole('dialog', { name: 'Delete account?' })).toBeVisible();
    await expect(page.getByText('Your current password is incorrect.', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByTestId('input-delete-password')).toHaveValue('wrong-password');
  });

  test('successful deletion sends deliberate confirmation, clears cached profile, and navigates to login', async ({ page }) => {
    let sessionRequests = 0;
    page.on('request', (request) => {
      if (/\/api\/auth\/me$/.test(request.url())) sessionRequests += 1;
    });
    await setupMocks(page, { profile: PROFILE, deleteAccount: 204 });
    await page.goto('/profile');
    await expect(page.getByTestId('input-name')).toHaveValue('Alex Johnson');

    await page.getByTestId('button-open-delete-account').click();
    await page.getByTestId('input-delete-password').fill('correct-password');
    await page.getByTestId('input-delete-confirmation').fill('DELETE');
    const deletionRequestPromise = page.waitForRequest((request) =>
      request.method() === 'DELETE' && /\/api\/account$/.test(request.url()),
    );
    await page.getByTestId('button-confirm-delete-account').click();
    const deletionRequest = await deletionRequestPromise;

    await expect(page).toHaveURL(/\/login$/);
    expect(deletionRequest.postDataJSON()).toEqual({ password: 'correct-password', confirmation: 'DELETE' });
    await expect.poll(() => sessionRequests).toBeGreaterThanOrEqual(2);
  });
});
