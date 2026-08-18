/**
 * Typography regression tests
 *
 * These tests verify the computed CSS properties of every named type-scale
 * utility defined in index.css.  They catch regressions in font-size, weight,
 * text-transform, and letter-spacing that pure class-name assertions cannot
 * detect — e.g. a size change to a utility class, a missing @layer rule, or a
 * specificity override.
 */
import { test, expect } from '@playwright/test';
import {
  setupMocks,
  DASHBOARD_WITH_PROGRAMME,
  PROFILE,
  HISTORY_ITEMS,
  WORKOUT_ACTIVE,
  PROGRAMME,
} from './fixtures';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Read computed style properties from the first element matching a CSS selector. */
async function getTypeStyle(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const s = window.getComputedStyle(el);
    return {
      fontSize:      s.fontSize,
      fontWeight:    s.fontWeight,
      textTransform: s.textTransform,
      letterSpacing: s.letterSpacing,
      lineHeight:    s.lineHeight,
    };
  });
}

/** Parse a computed px value like "44px" → 44 */
function px(value: string) { return parseFloat(value); }

// Base font size: browsers default 16px = 1rem
const REM = 16;

// ─── Type-scale verification ─────────────────────────────────────────────────

test.describe('Typography scale — computed styles', () => {

  test('type-page-title: 44 px, weight 600, uppercase', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    const s = await getTypeStyle(page, '.type-page-title');
    // 2.75rem × 16 = 44 px
    expect(px(s.fontSize)).toBeCloseTo(2.75 * REM, 0);
    expect(s.fontWeight).toBe('600');
    expect(s.textTransform).toBe('uppercase');
  });

  test('type-section-heading: 24 px, weight 600, uppercase', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    const s = await getTypeStyle(page, '.type-section-heading');
    // 1.5rem × 16 = 24 px
    expect(px(s.fontSize)).toBeCloseTo(1.5 * REM, 0);
    expect(s.fontWeight).toBe('600');
    expect(s.textTransform).toBe('uppercase');
  });

  test('type-subheading: 18 px, weight 600', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    const s = await getTypeStyle(page, '.type-subheading');
    // 1.125rem × 16 = 18 px
    expect(px(s.fontSize)).toBeCloseTo(1.125 * REM, 0);
    expect(s.fontWeight).toBe('600');
  });

  test('type-body-sm: 13 px, weight 400', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    const s = await getTypeStyle(page, '.type-body-sm');
    // 0.8125rem × 16 = 13 px
    expect(px(s.fontSize)).toBeCloseTo(0.8125 * REM, 0);
    expect(s.fontWeight).toBe('400');
  });

  test('type-caption: 11 px, weight 400, uppercase, wide tracking', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    const s = await getTypeStyle(page, '.type-caption');
    // 0.6875rem × 16 = 11 px
    expect(px(s.fontSize)).toBeCloseTo(0.6875 * REM, 0);
    expect(s.fontWeight).toBe('400');
    expect(s.textTransform).toBe('uppercase');
    // letter-spacing: 0.1em on an 11 px font = 1.1 px
    expect(px(s.letterSpacing)).toBeCloseTo(0.1 * (0.6875 * REM), 0);
  });

  test('type-button: 14 px, weight 600', async ({ page }) => {
    // History empty state has a "Go to Track" CTA with type-button class
    await setupMocks(page, { history: [] });
    await page.goto('/history');

    const s = await getTypeStyle(page, '.type-button');
    // 0.875rem × 16 = 14 px
    expect(px(s.fontSize)).toBeCloseTo(0.875 * REM, 0);
    expect(s.fontWeight).toBe('600');
  });

  test('text-pb-number: 32 px, weight 600 — stat/PB display', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    const s = await getTypeStyle(page, '.text-pb-number');
    // 2rem × 16 = 32 px
    expect(px(s.fontSize)).toBeCloseTo(2 * REM, 0);
    expect(s.fontWeight).toBe('600');
  });

  test('text-workout-weight: 88 px, weight 600 — largest element in app', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    const s = await getTypeStyle(page, '.text-workout-weight');
    // 5.5rem × 16 = 88 px
    expect(px(s.fontSize)).toBeCloseTo(5.5 * REM, 0);
    expect(s.fontWeight).toBe('600');
  });

  test('text-workout-weight-unit: 28 px, weight 400', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    const s = await getTypeStyle(page, '.text-workout-weight-unit');
    // 1.75rem × 16 = 28 px
    expect(px(s.fontSize)).toBeCloseTo(1.75 * REM, 0);
    expect(s.fontWeight).toBe('400');
  });

});

// ─── Visual layout spot-checks ───────────────────────────────────────────────

test.describe('Typography layout — key screens', () => {

  test('dashboard page title is taller than section heading', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    const titleSize   = await getTypeStyle(page, '.type-page-title');
    const sectionSize = await getTypeStyle(page, '.type-section-heading');
    expect(px(titleSize.fontSize)).toBeGreaterThan(px(sectionSize.fontSize));
  });

  test('profile — page title larger than section heading, both uppercase', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    const title   = await getTypeStyle(page, '.type-page-title');
    const section = await getTypeStyle(page, '.type-section-heading');
    expect(px(title.fontSize)).toBeGreaterThan(px(section.fontSize));
    expect(title.textTransform).toBe('uppercase');
    expect(section.textTransform).toBe('uppercase');
  });

  test('history — section heading larger than body-sm', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    const heading = await getTypeStyle(page, '.type-section-heading');
    const body    = await getTypeStyle(page, '.type-body-sm');
    expect(px(heading.fontSize)).toBeGreaterThan(px(body.fontSize));
  });

  test('programme detail — session title larger than exercise label', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME });
    await page.goto('/programme/1');

    const pageTitle    = await getTypeStyle(page, '.type-page-title');
    const subheading   = await getTypeStyle(page, '.type-subheading');
    expect(px(pageTitle.fontSize)).toBeGreaterThan(px(subheading.fontSize));
  });

  test('workout — weight number largest element on screen', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    const weight  = await getTypeStyle(page, '.text-workout-weight');
    const session = await getTypeStyle(page, '.type-page-title');
    expect(px(weight.fontSize)).toBeGreaterThan(px(session.fontSize));
  });

});
