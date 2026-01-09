import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables - check .env.development.local first, then .env.local, then .env.development
// This matches Next.js loading order
const envFiles = [
  ".env.development.local",
  ".env.local",
  ".env.development",
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break; // Stop after first file found (highest priority)
  }
}

// Backend URL for E2E tests (defaults to localhost:18765)
const BACKEND_URL = process.env.E2E_BACKEND_URL || "http://localhost:18765";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 60000, // 60 seconds timeout for E2E tests
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Make backend URL available to tests
    extraHTTPHeaders: {
      "X-Backend-URL": BACKEND_URL,
    },
  },
  // Global setup to verify dev environment before tests run
  globalSetup: require.resolve("./tests/e2e/global-setup.ts"),

  projects: [
    // Setup project to authenticate once before all tests
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "yarn dev --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
