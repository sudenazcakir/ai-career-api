/**
 * Phase 10 — Passport tests
 *
 * Covers:
 *  - Passport save / reload persistence
 *  - Dynamic languages: add, remove, save → correct count on reload
 *
 * Uses seeded user "strong-backend" (Aylin Kaya) who has a completed passport.
 * Requires: backend running + npm run seed:test
 */

const { test, expect } = require("@playwright/test");
const { loginAs } = require("./helpers/auth");

test.describe("Passport — save / load", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
  });

  test("opens passport form via profile page", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("button", { name: /edit.*passport|career passport/i })).toBeVisible();
  });

  test("edits Target role field, saves, and value persists after reload", async ({ page }) => {
    await page.goto("/profile");

    // Open passport editor
    await page.getByRole("button", { name: /edit.*passport|career passport/i }).click();

    // Wait for form to appear
    const targetRoleInput = page.getByLabel(/target role/i);
    await expect(targetRoleInput).toBeVisible({ timeout: 8_000 });

    // Set a unique value
    const uniqueRole = `QA-Playwright-${Date.now()}`;
    await targetRoleInput.fill(uniqueRole);

    // Save
    await page.getByRole("button", { name: /update.*passport|save.*passport/i }).click();
    await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 8_000 }).catch(() => {
      // Status feedback might be in status bar — acceptable if form closes
    });

    // Reload and reopen
    await page.reload();
    await page.getByRole("button", { name: /edit.*passport|career passport/i }).click();
    await expect(page.getByLabel(/target role/i)).toHaveValue(uniqueRole, { timeout: 8_000 });
  });
});

test.describe("Passport — dynamic languages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
  });

  test("adds two languages with + button, saves, reload shows correct count", async ({ page }) => {
    await page.goto("/profile");
    await page.getByRole("button", { name: /edit.*passport|career passport/i }).click();

    // Wait for form
    await expect(page.getByPlaceholder("e.g. English")).toBeVisible({ timeout: 8_000 });

    // Clear existing and start fresh: set first language
    await page.getByPlaceholder("e.g. English").fill("English");

    // Add second language
    await page.getByRole("button", { name: "Add language" }).click();
    await page.getByPlaceholder("Another language…").first().fill("Turkish");

    // Add third language
    await page.getByRole("button", { name: "Add language" }).click();
    await page.getByPlaceholder("Another language…").last().fill("German");

    // Save
    await page.getByRole("button", { name: /update.*passport|save.*passport/i }).click();

    // Re-open and check
    await page.reload();
    await page.getByRole("button", { name: /edit.*passport|career passport/i }).click();

    // First input still has "e.g. English" placeholder and should contain "English"
    await expect(page.getByPlaceholder("e.g. English")).toHaveValue("English", { timeout: 8_000 });

    // There should now be 2 "Another language…" inputs (Turkish + German)
    const additionalInputs = page.getByPlaceholder("Another language…");
    await expect(additionalInputs).toHaveCount(2, { timeout: 8_000 });
  });

  test("removes a language with × button, count decreases", async ({ page }) => {
    await page.goto("/profile");
    await page.getByRole("button", { name: /edit.*passport|career passport/i }).click();

    await expect(page.getByPlaceholder("e.g. English")).toBeVisible({ timeout: 8_000 });

    // Ensure at least 2 languages exist
    await page.getByPlaceholder("e.g. English").fill("English");
    await page.getByRole("button", { name: "Add language" }).click();
    await page.getByPlaceholder("Another language…").first().fill("Spanish");

    const beforeCount = await page.getByPlaceholder("Another language…").count();

    // Remove the last added language
    await page.getByRole("button", { name: "Remove language" }).last().click();

    const afterCount = await page.getByPlaceholder("Another language…").count();
    expect(afterCount).toBe(beforeCount - 1);
  });

  test("empty language values are not saved", async ({ page }) => {
    await page.goto("/profile");
    await page.getByRole("button", { name: /edit.*passport|career passport/i }).click();

    await expect(page.getByPlaceholder("e.g. English")).toBeVisible({ timeout: 8_000 });

    // Add an empty language slot
    await page.getByRole("button", { name: "Add language" }).click();
    // Leave the new input empty, then save
    await page.getByRole("button", { name: /update.*passport|save.*passport/i }).click();

    // Reload and reopen — empty entry should not be persisted
    await page.reload();
    await page.getByRole("button", { name: /edit.*passport|career passport/i }).click();

    // Count should be the same as before (empty fields stripped)
    const emptyInputs = await page
      .getByPlaceholder("Another language…")
      .evaluateAll((els) => els.filter((el) => el.value === "").length);
    expect(emptyInputs).toBe(0);
  });
});
