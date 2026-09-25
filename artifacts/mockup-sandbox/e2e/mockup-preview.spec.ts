import { expect, test, type Page } from "@playwright/test";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MOCKUPS_ROOT = fileURLToPath(
  new URL("../src/components/mockups", import.meta.url),
);

type PreviewSmokeCase = {
  family: string;
  run: (page: Page) => Promise<void>;
};

type PreviewVisualCase = {
  family: string;
  path: string;
};

const PREVIEW_SMOKE_CASES: PreviewSmokeCase[] = [
  {
    family: "lift-log",
    run: async (page) => {
      await page.goto("/__mockup/preview/lift-log/ContinuousLog");

      await expect(
        page.getByRole("heading", { name: /LOFTE LOG/i }),
      ).toBeVisible();
      await expect(page.getByText("ATHLETE DATA")).toBeVisible();
      const todayLabel = page.getByText("TODAY //");
      await expect(todayLabel).toBeVisible();
      await expect(todayLabel).toBeInViewport();

      const setToggle = page
        .getByRole("button", { name: "Toggle set status: currently empty" })
        .first();
      await expect(setToggle).toBeVisible();
      await setToggle.scrollIntoViewIfNeeded();
      await expect(setToggle).toBeInViewport();
      await expect(setToggle).toHaveAttribute("data-checked", "false");

      const completedToggles = page.locator(
        'button[aria-label="Toggle set status: currently done"][data-checked="true"]',
      );
      const completedCount = await completedToggles.count();
      await setToggle.click();
      await expect(completedToggles).toHaveCount(completedCount + 1);

      const exerciseName = page.locator('input[type="text"]').first();
      await exerciseName.fill("TEST LIFT");
      await expect(exerciseName).toHaveValue("TEST LIFT");

      const addWorkButton = page
        .getByRole("button", { name: "+ ADD WORK" })
        .first();
      await addWorkButton.scrollIntoViewIfNeeded();
      await addWorkButton.click();
      await expect
        .poll(() =>
          page
            .locator('input[type="text"]')
            .evaluateAll((inputs) =>
              inputs.some(
                (input) => (input as HTMLInputElement).value === "NEW LIFT",
              ),
            ),
        )
        .toBe(true);
    },
  },
];

const PREVIEW_VISUAL_CASES: PreviewVisualCase[] = [
  {
    family: "lift-log",
    path: "lift-log/ContinuousLog",
  },
];

function discoverPreviewFamilies(): string[] {
  return readdirSync(MOCKUPS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

test.describe("mockup component previews", () => {
  for (const previewCase of PREVIEW_SMOKE_CASES) {
    test(`${previewCase.family} preview renders and keeps its core controls interactive`, async ({
      page,
    }) => {
      await previewCase.run(page);
    });
  }

  test("every preview family has a representative smoke case", () => {
    const discoveredFamilies = discoverPreviewFamilies();
    const coveredFamilies = PREVIEW_SMOKE_CASES.map(
      (previewCase) => previewCase.family,
    );

    expect(coveredFamilies).toEqual(expect.arrayContaining(discoveredFamilies));
    expect(new Set(coveredFamilies).size).toBe(coveredFamilies.length);
  });

  for (const previewCase of PREVIEW_VISUAL_CASES) {
    test(`${previewCase.family} preview matches its visual baseline`, async ({
      page,
    }) => {
      await page.clock.install({
        time: new Date("2026-01-15T12:00:00Z"),
      });
      await page.addInitScript(() => {
        const nativeScrollIntoView = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = function scrollIntoView(
          arg?: boolean | ScrollIntoViewOptions,
        ) {
          if (arg && typeof arg === "object") {
            nativeScrollIntoView.call(this, { ...arg, behavior: "auto" });
            return;
          }
          nativeScrollIntoView.call(this, arg);
        };
      });

      await page.goto(`/__mockup/preview/${previewCase.path}`);

      await expect(page.locator(".continuous-log")).toBeVisible();
      const todayLabel = page.getByText("TODAY //");
      await expect(todayLabel).toBeVisible();
      await todayLabel.scrollIntoViewIfNeeded();
      await expect(todayLabel).toBeInViewport();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation: none !important;
            caret-color: transparent !important;
            transition: none !important;
          }
        `,
      });

      await expect(page).toHaveScreenshot(`${previewCase.family}.png`);
    });
  }
});
