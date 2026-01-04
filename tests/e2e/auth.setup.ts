import * as path from "node:path";
import { test as setup } from "@playwright/test";

const authFile = path.join(__dirname, "../../.auth/user.json");

setup("authenticate with Keycloak", async ({ page }) => {
  // Get Keycloak credentials from environment
  const testUser = process.env.KEYCLOAK_TEST_USER;
  const testPassword = process.env.KEYCLOAK_TEST_USER_PASSWORD;

  if (!testUser || !testPassword) {
    throw new Error("KEYCLOAK_TEST_USER and KEYCLOAK_TEST_USER_PASSWORD must be set in .env.local");
  }

  // Navigate to a protected page with callbackUrl to ensure redirect back
  await page.goto("http://localhost:3000/protected");

  // Wait for the sign-in page to load
  await page.waitForSelector('a:has-text("Sign in with Keycloak")', {
    timeout: 5000,
  });

  // Click the sign-in button to go to NextAuth signin page
  // Use the link with callbackUrl to ensure we redirect back to protected page
  const signInLink = page.locator('a:has-text("Sign in with Keycloak")');
  const href = await signInLink.getAttribute("href");
  if (href && !href.includes("callbackUrl")) {
    // If the link doesn't have callbackUrl, navigate directly to signin with callbackUrl
    await page.goto(
      `http://localhost:3000/api/auth/signin?callbackUrl=${encodeURIComponent("http://localhost:3000/protected")}`
    );
  } else {
    await signInLink.click();
  }

  // Wait for NextAuth signin page to load
  await page.waitForURL(/\/api\/auth\/signin/, { timeout: 5000 });

  // NextAuth signin page shows provider buttons - click the Keycloak button
  // The button might be text "Sign in with Keycloak" or just "Keycloak"
  await page.waitForSelector("button, a", { timeout: 5000 });

  // Try to find and click the Keycloak provider button
  // It could be a button with text containing "Keycloak" or a form button
  const keycloakButton = page
    .locator('button:has-text("Keycloak"), a:has-text("Keycloak"), button[type="submit"]')
    .first();
  await keycloakButton.click();

  // Wait for Keycloak login page to load
  await page.waitForURL(/auth\.flowcore\.io/, { timeout: 10000 });

  // Fill in the login form
  await page.fill('input[name="username"]', testUser);
  await page.fill('input[name="password"]', testPassword);

  // Click the login button
  await page.click('input[type="submit"]');

  // Wait for redirect back to the app (might redirect to home or protected)
  // NextAuth might redirect to home page after login, so we'll check for either
  await page.waitForURL(/http:\/\/localhost:3000\//, { timeout: 15000 });

  // If we're on home page, navigate to protected page
  const currentURL = page.url();
  if (currentURL === "http://localhost:3000/" || currentURL === "http://localhost:3000") {
    await page.goto("http://localhost:3000/protected");
  }

  // Wait for protected page to load
  await page.waitForURL(/http:\/\/localhost:3000\/protected/, {
    timeout: 5000,
  });

  // Verify we're logged in
  await page.waitForSelector("h1:has-text('Protected area')", {
    timeout: 5000,
  });

  // Save the authenticated state
  await page.context().storageState({ path: authFile });

  console.log("✅ Keycloak authentication successful");
});
