// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Playwright E2E configuration
 *
 * Prerequisites before running:
 *   1. Backend running:  npm run server        (port 5001)
 *   2. Seed test data:   npm run seed:test
 *
 * The webServer config auto-starts Vite (port 5173) if not already running.
 * Vite proxies /api/* to the backend on 5001.
 */
module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,       // sequential — tests share seeded DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,                 // single worker to avoid auth state collisions
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Auto-start Vite dev server; reuse if already running locally
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: { NODE_ENV: "test" },
  },
});
