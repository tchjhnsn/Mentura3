import { defineConfig, devices } from "@playwright/test";

// The production check (e2e-prod/README.md): browser tests against the live site, as two fresh accounts made for each
// run and deleted after it. No web server: PROD_BASE_URL (default https://mentura.xyz) is already running.
export const PROD_BASE_URL = process.env.PROD_BASE_URL ?? "https://mentura.xyz";

export default defineConfig({
  testDir: "e2e-prod",
  globalSetup: "./e2e-prod/setup.ts",
  globalTeardown: "./e2e-prod/teardown.ts",
  timeout: 180_000,
  workers: 1,
  reporter: [["list"]],
  outputDir: process.env.PROD_CHECK_OUT ?? "test-results/prod",
  use: {
    baseURL: PROD_BASE_URL,
    storageState: process.env.PROD_CHECK_STATE ?? "test-results/prod/state.json",
    trace: "off",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
});
