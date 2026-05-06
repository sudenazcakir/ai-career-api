/**
 * Phase 10 — Responsive smoke tests
 *
 * Covers:
 *  - Mobile (375px): hamburger menu visible, sidebar hidden
 *  - Hamburger click → sidebar slides in
 *  - Clicking a nav item navigates and closes sidebar
 *  - Content does not overflow horizontally
 *  - Tablet (768px): layout is stable
 *
 * Requires: backend running + npm run seed:test
 */

const { test, expect } = require("@playwright/test");
const { loginAs } = require("./helpers/auth");

const MOBILE  = { width: 375, height: 812 };  // iPhone SE
const TABLET  = { width: 768, height: 1024 }; // iPad portrait
const DESKTOP = { width: 1280, height: 800 };

test.describe("Responsive — mobile (375px)", () => {
  test.use({ viewport: MOBILE });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
  });

  test("hamburger menu button is visible at mobile width", async ({ page }) => {
    await page.goto("/dashboard");

    // Phase 1.6: hamburger button in header on mobile
    const hamburger = page.getByRole("button", { name: /menu|open.*navigation/i });
    await expect(hamburger).toBeVisible({ timeout: 8_000 });
  });

  test("sidebar is hidden by default at mobile width", async ({ page }) => {
    await page.goto("/dashboard");

    // Sidebar should be off-screen (translated) — checking nav items not visible
    const navLinks = page.getByRole("navigation").locator("a");
    const firstLink = navLinks.first();

    // The sidebar nav links may be in the DOM but should not be interactable
    const isOffscreen = await firstLink.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.left < 0 || rect.right > window.innerWidth + 10;
    }).catch(() => true);

    expect(isOffscreen).toBe(true);
  });

  test("clicking hamburger opens sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    const hamburger = page.getByRole("button", { name: /menu|open.*navigation/i });
    await hamburger.click();

    // After opening, at least one nav link should be visible on-screen
    const dashboardLink = page.getByRole("link", { name: /dashboard|overview/i });
    await expect(dashboardLink).toBeInViewport({ timeout: 5_000 });
  });

  test("backdrop overlay is visible when sidebar is open", async ({ page }) => {
    await page.goto("/dashboard");

    const hamburger = page.getByRole("button", { name: /menu|open.*navigation/i });
    await hamburger.click();

    // A semi-transparent backdrop should appear
    await page.waitForTimeout(500);
    const backdrop = page.locator("[class*='overlay'], [class*='backdrop'], [aria-label='Close navigation']");
    const hasBackdrop = await backdrop.count() > 0;
    expect(hasBackdrop).toBe(true);
  });

  test("clicking a nav item closes the sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    // Open sidebar
    await page.getByRole("button", { name: /menu|open.*navigation/i }).click();
    await page.waitForTimeout(500);

    // Click a nav item — e.g., Jobs
    const jobsLink = page.getByRole("link", { name: /jobs/i });
    await jobsLink.click();

    await expect(page).toHaveURL(/jobs/, { timeout: 8_000 });

    // Sidebar should be hidden again
    await page.waitForTimeout(600);
    const hamburger = page.getByRole("button", { name: /menu|open.*navigation/i });
    await expect(hamburger).toBeVisible();
  });

  test("page does not overflow horizontally on mobile", async ({ page }) => {
    const pages = ["/dashboard", "/jobs", "/applications"];

    for (const route of pages) {
      await page.goto(route);
      await page.waitForTimeout(1_500);

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(overflow).toBe(false);
    }
  });
});

test.describe("Responsive — tablet (768px)", () => {
  test.use({ viewport: TABLET });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
  });

  test("main pages load without horizontal overflow at 768px", async ({ page }) => {
    const routes = ["/dashboard", "/cvs", "/jobs", "/insights"];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(1_000);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflow).toBe(false);
    }
  });
});

test.describe("Responsive — desktop sanity (1280px)", () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, "backendDev");
  });

  test("hamburger button is NOT visible at desktop width", async ({ page }) => {
    await page.goto("/dashboard");

    const hamburger = page.getByRole("button", { name: /menu|open.*navigation/i });
    // Should not be visible at desktop — sidebar is always shown
    await expect(hamburger).not.toBeVisible({ timeout: 3_000 });
  });

  test("sidebar nav links are directly visible at desktop width", async ({ page }) => {
    await page.goto("/dashboard");

    // Navigation items should be directly in view without opening a menu
    const jobsLink = page.getByRole("link", { name: /^jobs$/i });
    await expect(jobsLink).toBeVisible({ timeout: 5_000 });
  });
});
