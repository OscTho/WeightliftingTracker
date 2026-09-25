import { test, expect } from '@playwright/test';
import { setupMocks, PROGRAMME_SUMMARY, PROGRAMME, CUSTOM_MOVEMENT } from './fixtures';

test.describe('Programme list', () => {
  test('loading state — skeleton visible', async ({ page }) => {
    await page.route(/\/api\/programmes$/, () => { /* hang */ });
    await page.goto('/programme');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('error state — retry button shown', async ({ page }) => {
    await setupMocks(page, { programmes: 'error' });
    await page.goto('/programme');

    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('button-retry')).toBeVisible();
  });

  test('empty state — mobile programme card and create CTA', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    await expect(page.getByTestId('empty-current-programme')).toBeVisible();
    await expect(page.getByText('No active programme')).toBeVisible();
    await expect(page.getByTestId('button-new-programme')).toBeVisible();
  });

  test('with programmes — cards rendered with correct data', async ({ page }) => {
    await setupMocks(page, { programmes: [PROGRAMME_SUMMARY] });
    await page.goto('/programme');

    const card = page.getByTestId(`card-programme-${PROGRAMME_SUMMARY.id}`);
    await expect(card).toBeVisible();
    // DOM text is original case; CSS applies uppercase visually
    await expect(card.getByText('Bulgarian Method')).toBeVisible();
    // Programme stats
    await expect(card.getByText('5 sessions / week · 8 weeks')).toBeVisible();
    // Link to detail
    await expect(page.getByTestId(`link-programme-${PROGRAMME_SUMMARY.id}`)).toBeVisible();
  });

  test('new programme form opens on button click', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    await page.getByTestId('button-new-programme').click();
    await expect(page.getByRole('button', { name: 'Close programme form' })).toBeVisible();
    await expect(page.getByTestId('button-save-programme')).toBeVisible();
    await expect(page.getByTestId('button-add-session')).toBeVisible();
  });

  test('quick-pick shows all seven common movements and selects each one', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');
    await page.getByTestId('button-new-programme').click();

    const quickChoices = [
      'Snatch',
      'Clean',
      'Jerk',
      'Back Squat',
      'Front Squat',
      'Clean Pull',
      'Snatch Pull',
    ];
    const addMovement = page.getByTestId('button-add-exercise-0');

    await addMovement.click();
    for (const movement of quickChoices) {
      const choice = page.getByRole('button', { name: movement, exact: true });
      await expect(choice).toBeVisible();
      await choice.click();
      await expect(page.getByText(movement, { exact: true }).last()).toBeVisible();
      if (movement !== quickChoices[quickChoices.length - 1]) await addMovement.click();
    }
  });

  test('movement library searches and filters by category', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');
    await page.getByTestId('button-new-programme').click();
    await page.getByTestId('button-add-exercise-0').click();
    await page.getByRole('button', { name: 'Explore movement library', exact: true }).click();

    const library = page.getByRole('dialog', { name: 'Movement library' });
    const search = library.getByRole('textbox', { name: 'Search movements' });
    await search.fill('power snatch');
    await expect(library.getByRole('button', { name: /^Power Snatch/ })).toBeVisible();
    await expect(library.getByRole('button', { name: /^Power Clean/ })).toHaveCount(0);

    await search.fill('');
    await library.getByRole('button', { name: 'Squats', exact: true }).click();
    await expect(library.getByRole('button', { name: /^Back Squat/ })).toBeVisible();
    await expect(library.getByRole('button', { name: /^Front Squat/ })).toBeVisible();
    await expect(library.getByRole('button', { name: /^Power Snatch/ })).toHaveCount(0);
  });

  test('custom movement is created and immediately selected', async ({ page }) => {
    await setupMocks(page, { programmes: [], createMovement: CUSTOM_MOVEMENT });
    await page.goto('/programme');
    await page.getByTestId('button-new-programme').click();
    await page.getByTestId('button-add-exercise-0').click();
    await page.getByRole('button', { name: 'Explore movement library', exact: true }).click();

    const library = page.getByRole('dialog', { name: 'Movement library' });
    await library.getByRole('button', { name: 'Add new movement', exact: true }).click();
    const customForm = page.getByRole('dialog', { name: 'Add new movement' });
    await customForm.getByRole('textbox', { name: 'Movement name' }).fill(CUSTOM_MOVEMENT.name);
    await customForm.getByLabel('Category').selectOption(CUSTOM_MOVEMENT.category);
    await customForm.getByRole('textbox', { name: 'Description (optional)' }).fill(CUSTOM_MOVEMENT.description);
    await customForm.getByRole('button', { name: 'Add movement', exact: true }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(CUSTOM_MOVEMENT.name, { exact: true })).toBeVisible();
  });

  test('selected movement id is persisted in the programme request', async ({ page }) => {
    let savedProgramme: { sessions: Array<{ exercises: Array<{ movementId?: string; exercise?: string }> }> } | undefined;
    await setupMocks(page, { programmes: [] });
    await page.route(/\/api\/programmes$/, async (route) => {
      if (route.request().method() === 'POST') {
        savedProgramme = route.request().postDataJSON();
        await route.fulfill({ status: 201, body: JSON.stringify(PROGRAMME), contentType: 'application/json' });
        return;
      }
      await route.fallback();
    });
    await page.goto('/programme');
    await page.getByTestId('button-new-programme').click();
    await page.getByTestId('button-add-exercise-0').click();
    await page.getByRole('button', { name: 'Explore movement library', exact: true }).click();
    const library = page.getByRole('dialog', { name: 'Movement library' });
    await library.getByRole('button', { name: /^Hang Snatch/ }).click();
    await page.getByTestId('button-save-programme').click();

    await expect.poll(() => savedProgramme?.sessions[0]?.exercises.at(-1)?.movementId).toBe('hang_snatch');
    expect(savedProgramme?.sessions[0]?.exercises.at(-1)?.exercise).toBeUndefined();
  });

  test('accessory movements use direct weight and equipment instead of percentage', async ({ page }) => {
    let savedProgramme: {
      sessions: Array<{
        exercises: Array<{
          movementId?: string;
          percentage?: number;
          weight?: number;
          equipment?: string;
        }>;
      }>;
    } | undefined;
    await setupMocks(page, { programmes: [] });
    await page.route(/\/api\/programmes$/, async (route) => {
      if (route.request().method() === 'POST') {
        savedProgramme = route.request().postDataJSON();
        await route.fulfill({ status: 201, body: JSON.stringify(PROGRAMME), contentType: 'application/json' });
        return;
      }
      await route.fallback();
    });
    await page.goto('/programme');
    await page.getByTestId('button-new-programme').click();
    await page.getByTestId('button-add-exercise-0').click();
    await page.getByRole('button', { name: 'Explore movement library', exact: true }).click();
    await page.getByRole('dialog', { name: 'Movement library' }).getByRole('button', { name: /^Deadlift/ }).click();

    await expect(page.getByTestId('input-percentage-0-2')).toHaveCount(0);
    await page.getByTestId('input-accessory-weight-0-2').fill('32');
    await page.getByTestId('select-accessory-equipment-0-2').selectOption('dumbbell');
    await page.getByTestId('button-save-programme').click();

    await expect.poll(() => savedProgramme?.sessions[0]?.exercises.at(-1)).toMatchObject({
      movementId: 'deadlift',
      weight: 32,
      equipment: 'dumbbell',
    });
    expect(savedProgramme?.sessions[0]?.exercises.at(-1)?.percentage).toBeUndefined();
  });

  test('page title uses the mobile display styles', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/font-display/);
    await expect(h1).toHaveCSS('font-size', '44px');
    await expect(h1).toContainText('Programme room.');
  });

  test('plans nav item is active', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    await expect(page.getByTestId('link-nav-plans')).toHaveClass(/bg-primary/);
  });
});

test.describe('Programme detail', () => {
  test('loading state — skeleton visible', async ({ page }) => {
    await page.route(/\/api\/programmes\/1$/, () => { /* hang */ });
    await page.goto('/programme/1');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('error state — retry shown on fetch failure', async ({ page }) => {
    await setupMocks(page, { programme: 'error' });
    await page.goto('/programme/1');

    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('button-retry')).toBeVisible();
  });

  test('with data — programme name, sessions and exercises rendered', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME });
    await page.goto('/programme/1');

    // Programme name in page title (DOM text, not CSS-uppercased)
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('Bulgarian Method');

    // Session names (h2 elements, DOM text)
    await expect(page.getByText('Snatch Focus').first()).toBeVisible();
    await expect(page.getByText('C&J Focus').first()).toBeVisible();

    // Exercise rows inside first session
    await expect(page.getByText('Snatch').first()).toBeVisible();
    await expect(page.getByText('Front Squat').first()).toBeVisible();

    // Start buttons per session
    await expect(page.getByTestId(`button-start-session-${PROGRAMME.sessions[0].id}`)).toBeVisible();
    await expect(page.getByTestId(`button-start-session-${PROGRAMME.sessions[1].id}`)).toBeVisible();
  });

  test('edit button reveals programme form', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME });
    await page.goto('/programme/1');

    await page.getByTestId('button-edit-programme').click();
    await expect(page.getByTestId('button-save-programme')).toBeVisible();
  });

  test('back link to programme list is visible', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME, programmes: [PROGRAMME_SUMMARY] });
    await page.goto('/programme/1');

    const backLink = page.getByTestId('link-back-programmes');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('All programmes');
  });

  test('session numbers use type-caption class', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME });
    await page.goto('/programme/1');

    // Session caption e.g. "Session 01"
    await expect(page.getByText('Session 01')).toBeVisible();
    await expect(page.locator('.type-caption').first()).toBeVisible();
  });
});
