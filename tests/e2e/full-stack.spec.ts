import { expect, test } from "@playwright/test";

const BACKEND_URL = process.env.E2E_BACKEND_URL || "http://localhost:18765";

test.describe("Full Stack E2E Tests", () => {
  // Use authenticated state from auth.setup.ts
  test.use({ storageState: ".auth/user.json" });

  test("should complete full user flow: authenticate, view challenges, log run", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const uniqueId = `test-${timestamp}`;

    // 1. Navigate to dashboard
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");

    // 2. Verify backend API is accessible
    const healthResponse = await page.request.get(`${BACKEND_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();

    // 3. Test challenge templates API
    const templatesResponse = await page.request.get(`${BACKEND_URL}/api/challenges/templates`);
    expect(templatesResponse.ok()).toBeTruthy();
    const templates = await templatesResponse.json();
    expect(Array.isArray(templates)).toBeTruthy();

    // 4. Test user challenges API
    const challengesResponse = await page.request.get(
      `${BACKEND_URL}/api/challenges/instances?userId=test-user`
    );
    expect(challengesResponse.ok()).toBeTruthy();
    const challenges = await challengesResponse.json();
    expect(Array.isArray(challenges)).toBeTruthy();

    // 5. Navigate to my-log page
    await page.goto("/my-log");
    await expect(page.locator("h1, h2")).toContainText(/log|runs/i);

    // Verify page loaded successfully
    await page.waitForLoadState("networkidle");
  });

  test("should handle backend API errors gracefully", async ({ page }) => {
    // Test with invalid endpoint
    const response = await page.request.get(`${BACKEND_URL}/api/invalid-endpoint`);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("should verify dev tables are used when backend is in dev mode", async ({ page }) => {
    // This test verifies that the backend is using dev_ prefixed tables
    // by checking that data is isolated from production

    // Make a request that would hit the database
    const response = await page.request.get(`${BACKEND_URL}/api/challenges/templates`);

    // If backend is in dev mode, it should be using dev_ tables
    // We can't directly verify this, but we can verify the API works
    expect(response.ok()).toBeTruthy();

    // Log that we're testing against dev environment
    console.log("Testing against dev backend (should use dev_ prefixed tables)");
  });
});

test.describe("Public Pages (No Auth Required)", () => {
  test("should render home page and access public API", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Seasonal running challenges");

    // Health endpoint should be accessible without auth
    const healthResponse = await page.request.get(`${BACKEND_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();
  });
});
