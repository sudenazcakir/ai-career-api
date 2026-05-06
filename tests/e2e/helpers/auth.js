/**
 * Auth helpers for Playwright tests.
 *
 * loginViaApi  — calls POST /api/auth/login directly (fast, no UI)
 *                then sets localStorage.authToken so React picks it up.
 * registerViaUi — fills the register form through the actual UI.
 */

/** Seed users created by `npm run seed:test` */
const SEED_USERS = {
  backendDev:    { email: "aylin.kaya@demo.local",   password: "Bknd!2026A" },
  frontendDev:   { email: "deniz.arslan@demo.local",  password: "Fnt@2026Dev" },
  juniorGap:     { email: "mert.yilmaz@demo.local",   password: "Jrn#2026Qa" },
  validationUser:{ email: "elif.demir@demo.local",    password: "Err0r!2026X" },
};

/**
 * Login via API, store token in localStorage, then navigate to /dashboard.
 * Use this in beforeEach for tests that need an authenticated state.
 *
 * @param {import('@playwright/test').Page} page
 * @param {"backendDev"|"frontendDev"|"juniorGap"|"validationUser"} userKey
 */
async function loginAs(page, userKey = "backendDev") {
  const { email, password } = SEED_USERS[userKey];

  // Call the backend API directly — no UI overhead
  const res = await page.request.post("/api/auth/login", {
    data: { email, password },
  });

  if (!res.ok()) {
    throw new Error(
      `loginAs(${userKey}) failed: ${res.status()} — Is the backend running and seed data loaded?`
    );
  }

  const { token } = await res.json();

  // Inject token before navigating so React reads it on mount
  await page.goto("/login");
  await page.evaluate((t) => localStorage.setItem("authToken", t), token);
  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard", { timeout: 10_000 });
}

/**
 * Register a fresh user through the UI. Returns { email, password }.
 * Uses a timestamp-based email to avoid conflicts.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [overrides]
 */
async function registerViaUi(page, overrides = {}) {
  const ts = Date.now();
  const user = {
    firstName: "Test",
    lastName:  "User",
    email:     `test-${ts}@playwright.test`,
    password:  "PwTest!2026",
    ...overrides,
  };

  await page.goto("/register");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByPlaceholder("Ada").fill(user.firstName);
  await page.getByPlaceholder("Tunç").fill(user.lastName);
  await page.getByPlaceholder("name@example.com").fill(user.email);
  await page.getByPlaceholder("Password").first().fill(user.password);
  await page.getByPlaceholder("Repeat password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  return user;
}

/**
 * Clear auth state — simulates a logged-out or expired-token scenario.
 *
 * @param {import('@playwright/test').Page} page
 */
async function clearAuth(page) {
  await page.evaluate(() => localStorage.removeItem("authToken"));
}

/**
 * Set an invalid/expired token to trigger 401 behavior.
 *
 * @param {import('@playwright/test').Page} page
 */
async function setExpiredToken(page) {
  await page.goto("/login");
  await page.evaluate(() =>
    localStorage.setItem("authToken", "invalid.jwt.token")
  );
}

module.exports = { loginAs, registerViaUi, clearAuth, setExpiredToken, SEED_USERS };
