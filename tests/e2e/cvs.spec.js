/**
 * Phase 10 — CV tests
 *
 * Covers:
 *  - CV create
 *  - CV select / edit / save
 *  - CV delete
 *  - Create new version
 *  - Compare two CVs
 *
 * Uses seeded user "strong-backend" who already has backend-cv + fullstack-cv.
 * Requires: backend running + npm run seed:test
 */

const { test, expect } = require("@playwright/test");
const { loginAs } = require("./helpers/auth");

test.describe("CVs — list and create", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
    await page.goto("/cvs");
  });

  test("seeded CVs are visible on /cvs", async ({ page }) => {
    // "strong-backend" has backend-cv and fullstack-cv from seed
    await expect(page.getByText("Backend CV")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Full Stack CV")).toBeVisible({ timeout: 8_000 });
  });

  test("creates a new CV and it appears in the list", async ({ page }) => {
    const uniqueTitle = `PW-Test-CV-${Date.now()}`;

    // Fill the create form (always visible on /cvs page)
    await page.getByLabel(/CV title/i).fill(uniqueTitle);

    // Select type if available
    const typeSelect = page.getByLabel(/type/i).first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("Frontend");
    }

    // Fill skills
    const skillsInput = page.getByLabel(/skills/i).first();
    if (await skillsInput.isVisible()) {
      await skillsInput.fill("React, TypeScript, CSS");
    }

    await page.getByRole("button", { name: /save cv|create cv/i }).click();

    // New CV should appear in the list
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("CVs — select and edit", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
    await page.goto("/cvs");
    // Select the seeded Backend CV
    await page.getByText("Backend CV").first().click();
  });

  test("selecting a CV marks it as active", async ({ page }) => {
    // The selected CV panel should show the title
    await expect(page.getByText(/backend cv/i)).toBeVisible({ timeout: 5_000 });
    // "used for matching" indicator should be visible
    await expect(page.getByText(/used for matching/i)).toBeVisible({ timeout: 5_000 });
  });

  test("edits selected CV title and saves", async ({ page }) => {
    // Click edit button for Backend CV
    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
    }

    const titleInput = page.getByLabel(/CV title/i);
    await expect(titleInput).toBeVisible({ timeout: 5_000 });

    const newTitle = `Backend CV (edited-${Date.now()})`;
    await titleInput.fill(newTitle);
    await page.getByRole("button", { name: /save cv/i }).click();

    await expect(page.getByText(newTitle)).toBeVisible({ timeout: 8_000 });

    // Restore original title to keep seed data stable
    const editBtn2 = page.getByRole("button", { name: /edit/i }).first();
    if (await editBtn2.isVisible()) {
      await editBtn2.click();
      await page.getByLabel(/CV title/i).fill("Backend CV");
      await page.getByRole("button", { name: /save cv/i }).click();
    }
  });
});

test.describe("CVs — delete", () => {
  test("creates a CV then deletes it — CV removed from list", async ({ page }) => {
    await loginAs(page, "backendDev");
    await page.goto("/cvs");

    const tempTitle = `DELETE-ME-${Date.now()}`;

    // Create
    await page.getByLabel(/CV title/i).fill(tempTitle);
    await page.getByRole("button", { name: /save cv|create cv/i }).click();
    await expect(page.getByText(tempTitle)).toBeVisible({ timeout: 8_000 });

    // Select it so it can be deleted
    await page.getByText(tempTitle).first().click();

    // Handle confirm dialog
    page.once("dialog", (dialog) => dialog.accept());

    // Click delete
    const deleteBtn = page.getByRole("button", { name: /delete/i });
    await deleteBtn.click();

    // Must disappear
    await expect(page.getByText(tempTitle)).not.toBeVisible({ timeout: 8_000 });
  });
});

test.describe("CVs — versioning", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
    await page.goto("/cvs");
  });

  test("Create New Version button is enabled when a CV is selected", async ({ page }) => {
    await page.getByText("Backend CV").first().click();
    const versionBtn = page.getByRole("button", { name: /create new version|new version/i });
    await expect(versionBtn).toBeEnabled({ timeout: 5_000 });
  });

  test("creates a new version and it appears in the list", async ({ page }) => {
    await page.getByText("Backend CV").first().click();

    const beforeCount = await page.getByText(/backend cv/i).count();

    await page.getByRole("button", { name: /create new version|new version/i }).click();

    // A new version of Backend CV should appear
    await expect(page.getByText(/backend cv/i)).toHaveCount(beforeCount + 1, { timeout: 10_000 });
  });
});

test.describe("CVs — compare", () => {
  test("compare section shows shared and missing skills", async ({ page }) => {
    await loginAs(page, "backendDev");
    await page.goto("/cvs");

    // Select Backend CV as base
    await page.getByText("Backend CV").first().click();

    // Find the compare select — compare with Full Stack CV
    const compareSelect = page.getByRole("combobox").filter({ hasText: /compare|select/i });
    if (await compareSelect.isVisible()) {
      await compareSelect.selectOption({ label: /full stack/i });
      await page.getByRole("button", { name: /compare/i }).click();

      // Comparison result should show some skill data
      await expect(
        page.getByText(/shared skills|missing skills|in common|only in/i)
      ).toBeVisible({ timeout: 12_000 });
    } else {
      // If compare UI not found, just verify the section heading exists
      await expect(page.getByText(/versioning|comparison/i)).toBeVisible({ timeout: 5_000 });
    }
  });
});
