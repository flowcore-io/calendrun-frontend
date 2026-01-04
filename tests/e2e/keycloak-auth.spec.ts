import { expect, test } from "@playwright/test";

test.describe("Authenticated E2E Tests", () => {
  // These tests will use the authenticated state from auth.setup.ts
  test.use({ storageState: ".auth/user.json" });

  test("should access protected routes with Keycloak auth", async ({ page }) => {
    // Navigate to protected page - should show user without requiring login
    await page.goto("http://localhost:3000/protected");
    await expect(page.locator("h1")).toContainText("Protected area");
    await expect(page.locator("body")).toContainText("Signed in as:");

    // Take screenshot of protected page
    await page.screenshot({
      path: "tests/e2e/screenshots/protected-page.png",
    });
  });

  test("should access dashboard with authenticated session", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");

    // Take screenshot of dashboard
    await page.screenshot({
      path: "tests/e2e/screenshots/dashboard-page.png",
    });
  });

  test("should access admin area if user has system_admin role", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await expect(page.locator("h1")).toContainText("Admin");

    // Take screenshot of admin page
    await page.screenshot({ path: "tests/e2e/screenshots/admin-page.png" });
  });

  test("should show role-based navigation in header", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Header should show Dashboard and Sign out
    const header = page.locator("header");
    await expect(header.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(header.locator('button:has-text("Sign out")')).toBeVisible();

    // Should not show Sign in button
    await expect(header.locator('a:has-text("Sign in")')).not.toBeVisible();

    // Take screenshot of authenticated header
    await page.screenshot({
      path: "tests/e2e/screenshots/authenticated-header.png",
    });
  });

  test("should sign out successfully", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Click sign out button
    await page.click('button:has-text("Sign out")');

    // Should be redirected to Keycloak logout, then back to home
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 });

    // Should show Sign in button instead of Sign out
    const header = page.locator("header");
    await expect(header.locator('a:has-text("Sign in")')).toBeVisible();
    await expect(header.locator('button:has-text("Sign out")')).not.toBeVisible();
  });
});

test.describe("Public Pages", () => {
  // These tests don't require authentication

  test("should render public home page", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await expect(page.locator("h1")).toContainText("Seasonal running challenges");
    await expect(page.locator("body")).toContainText("Log your runs, track your progress");

    // Take screenshot of home page
    await page.screenshot({ path: "tests/e2e/screenshots/home-page.png" });
  });

  test("should render themes page and switch between themes", async ({ page }) => {
    await page.goto("http://localhost:3000/themes");
    await expect(page.locator("h1")).toContainText("Theme preview");

    // Click on January Winter theme
    await page.click('text="January – Winter"');
    await expect(page.locator("body")).toContainText("january_winter");

    // Take screenshot of January theme
    await page.screenshot({
      path: "tests/e2e/screenshots/themes-january.png",
    });

    // Click on December Christmas theme
    await page.click('text="December – Christmas"');
    await expect(page.locator("body")).toContainText("december_christmas");

    // Take screenshot of December theme
    await page.screenshot({
      path: "tests/e2e/screenshots/themes-december.png",
    });
  });
});
