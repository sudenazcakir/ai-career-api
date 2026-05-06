/**
 * Phase 10 — Auth tests
 *
 * Covers:
 *  - Register validation (special chars in name fields)
 *  - Successful register → dashboard redirect
 *  - Login (valid credentials)
 *  - 401 / expired token → redirect to /login
 *  - Protected route access without auth → redirect to /login
 */

const { test, expect } = require("@playwright/test");
const { registerViaUi, setExpiredToken, clearAuth } = require("./helpers/auth");

test.describe("Auth — Register validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Sign up" }).click();
  });

  test("special characters in lastName show an error and form does not jump", async ({ page }) => {
    const firstName = page.getByPlaceholder("Ada");
    const lastName  = page.getByPlaceholder("Tunç");
    const email     = page.getByPlaceholder("name@example.com");
    const password  = page.getByPlaceholder("Password").first();
    const confirm   = page.getByPlaceholder("Repeat password");
    const submit    = page.getByRole("button", { name: "Create account" });

    await firstName.fill("Ada");
    await lastName.fill("Invalid@Name!");
    await email.fill(`val-${Date.now()}@test.com`);
    await password.fill("Valid!Pass2026");
    await confirm.fill("Valid!Pass2026");

    // Capture lastName input Y position before submit
    const box1 = await lastName.boundingBox();
    await submit.click();

    // Error text should appear
    await expect(page.getByText(/name.*only contain|invalid|format/i)).toBeVisible({ timeout: 5000 });

    // lastName input should NOT have jumped — within 5px tolerance
    const box2 = await lastName.boundingBox();
    expect(Math.abs((box2?.y ?? 0) - (box1?.y ?? 0))).toBeLessThan(5);
  });

  test("special characters in firstName show an error", async ({ page }) => {
    await page.getByPlaceholder("Ada").fill("Ada123!");
    await page.getByPlaceholder("Tunç").fill("Smith");
    await page.getByPlaceholder("name@example.com").fill(`fn-${Date.now()}@test.com`);
    await page.getByPlaceholder("Password").first().fill("Valid!Pass2026");
    await page.getByPlaceholder("Repeat password").fill("Valid!Pass2026");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/name.*only contain|invalid|format/i)).toBeVisible({ timeout: 5000 });
    // Must stay on register page
    await expect(page).toHaveURL(/register|login/);
  });

  test("mismatched passwords show an error", async ({ page }) => {
    await page.getByPlaceholder("Ada").fill("Ada");
    await page.getByPlaceholder("Tunç").fill("Smith");
    await page.getByPlaceholder("name@example.com").fill(`mm-${Date.now()}@test.com`);
    await page.getByPlaceholder("Password").first().fill("Valid!Pass2026");
    await page.getByPlaceholder("Repeat password").fill("DifferentPass!1");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/do not match|passwords match/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Auth — Successful register", () => {
  test("valid registration redirects to dashboard", async ({ page }) => {
    const user = await registerViaUi(page);
    await expect(page).toHaveURL(/dashboard/);
    // Welcome text or user name should be visible
    await expect(page.locator("body")).toContainText(/dashboard|welcome|overview/i);
    // Cleanup hint (just for test runner awareness)
    console.log(`  Created test user: ${user.email}`);
  });
});

test.describe("Auth — Login", () => {
  test("valid credentials redirect to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("aylin.kaya@demo.local");
    await page.getByPlaceholder("Password").first().fill("Bknd!2026A");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("wrong password shows an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("aylin.kaya@demo.local");
    await page.getByPlaceholder("Password").first().fill("WrongPassword!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|credentials/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Auth — 401 / protected routes", () => {
  test("navigating to /dashboard without auth redirects to /login", async ({ page }) => {
    // Go to login first to clear any state, then navigate directly
    await clearAuth(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test("navigating to /jobs without auth redirects to /login", async ({ page }) => {
    await clearAuth(page);
    await page.goto("/jobs");
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test("expired/invalid token redirects to /login", async ({ page }) => {
    await setExpiredToken(page);
    await page.goto("/dashboard");
    // The app should detect the 401 and redirect
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });

  test("sign out clears session and redirects to /login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("aylin.kaya@demo.local");
    await page.getByPlaceholder("Password").first().fill("Bknd!2026A");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });

    // Sign out via profile page or sign out button
    await page.goto("/profile");
    await page.getByRole("button", { name: /sign out|log out/i }).click();
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });

    // Token must be cleared
    const token = await page.evaluate(() => localStorage.getItem("authToken"));
    expect(token).toBeNull();
  });
});
