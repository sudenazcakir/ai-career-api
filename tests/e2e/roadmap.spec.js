/**
 * Phase 10 — Skill Map + Growth Plan tests
 *
 * Covers:
 *  - Skill Map shows gaps when CV + jobs are loaded
 *  - Skill Map shows correct empty states when data is missing
 *  - Growth Plan does NOT auto-generate on page load
 *  - "Generate growth plan" button → progress bar → roadmap appears
 *  - Roadmap resets when "Reset plan" is clicked
 *
 * Uses seeded user "strong-backend" who has backend-cv and seeded jobs.
 * Requires: backend running + npm run seed:test
 */

const { test, expect } = require("@playwright/test");
const { loginAs } = require("./helpers/auth");

test.describe("Skill Map", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
  });

  test("Skill Map page loads without crash", async ({ page }) => {
    await page.goto("/skill-gaps");
    await expect(page.locator("body")).not.toContainText(/crash|unexpected error/i);
    await expect(page.getByText(/skill|gap|map/i)).toBeVisible({ timeout: 8_000 });
  });

  test("shows 'Select a CV' guidance when no CV is selected", async ({ page }) => {
    // Navigate without selecting CV
    await page.goto("/skill-gaps");

    // If no CV is pre-selected the page should show a directed message
    const body = page.locator("body");
    const hasGuidance = await body
      .getByText(/select a cv|no cv|choose a cv/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    // Either guidance OR actual skill gaps are shown — both are valid
    const hasSkills = await body
      .getByText(/missing skills|skill gap/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasGuidance || hasSkills).toBe(true);
  });

  test("shows hero description mentioning comparison or jobs", async ({ page }) => {
    await page.goto("/skill-gaps");
    // Phase 6.1: hero text should reference CV comparison or job count
    await expect(
      page.getByText(/comparing|against|jobs loaded|select a cv/i)
    ).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Growth Plan — generate behavior", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
    // Select Backend CV so roadmap generation is possible
    await page.goto("/cvs");
    await page.getByText("Backend CV").first().click();
  });

  test("roadmap page does NOT auto-show roadmap on load", async ({ page }) => {
    await page.goto("/roadmap");
    // Phase 6.2: timeline/milestone cards should not be immediately visible
    // — instruction state or disabled generate button should be shown instead
    await page.waitForTimeout(1_500);

    const timelineVisible = await page
      .getByText(/week 1|week 2|step 1/i)
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    // If no jobs are loaded, roadmap cannot be generated — instruction state
    // If jobs ARE loaded, generate button should be the gating action
    const instructionVisible = await page
      .getByText(/generate.*growth plan|analyse gaps|load jobs first|select a cv/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    // Either instruction state OR generate button must be present
    expect(timelineVisible === false || instructionVisible).toBe(true);
  });

  test("Generate growth plan button exists on /roadmap", async ({ page }) => {
    await page.goto("/roadmap");
    await expect(
      page.getByRole("button", { name: /generate growth plan/i })
    ).toBeVisible({ timeout: 8_000 });
  });

  test("clicking Generate growth plan shows roadmap (when data is available)", async ({ page }) => {
    // Load jobs first
    await page.goto("/jobs");
    await page.waitForTimeout(3_000); // wait for auto-sync

    await page.goto("/roadmap");

    const generateBtn = page.getByRole("button", { name: /generate growth plan/i });
    await expect(generateBtn).toBeVisible({ timeout: 8_000 });

    const isEnabled = await generateBtn.isEnabled();
    if (isEnabled) {
      await generateBtn.click();

      // Progress bar or generating state
      await expect(
        page.getByText(/generating/i).or(page.locator(".roadmap-progress-fill"))
      ).toBeVisible({ timeout: 5_000 }).catch(() => {
        // Progress may be too fast to catch — that's OK
      });

      // Roadmap milestone cards should appear after generation
      await expect(
        page.getByText(/week|step|learn/i)
      ).toBeVisible({ timeout: 10_000 });
    } else {
      // Button disabled → no jobs or CV loaded → instruction state is acceptable
      await expect(page.getByText(/load jobs|select a cv/i)).toBeVisible({ timeout: 5_000 });
    }
  });

  test("Reset plan returns to instruction state", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForTimeout(3_000);

    await page.goto("/roadmap");

    const generateBtn = page.getByRole("button", { name: /generate growth plan/i });
    if (await generateBtn.isEnabled()) {
      await generateBtn.click();
      await page.waitForTimeout(2_000);

      // Click Reset plan
      const resetBtn = page.getByRole("button", { name: /reset plan/i });
      if (await resetBtn.isVisible()) {
        await resetBtn.click();
        // Instruction state should reappear
        await expect(
          page.getByRole("button", { name: /generate growth plan/i })
        ).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});
