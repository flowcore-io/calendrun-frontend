import { FullConfig } from "@playwright/test";

/**
 * Global setup to verify dev environment before tests run
 */
async function globalSetup(config: FullConfig) {
  const backendUrl = process.env.E2E_BACKEND_URL || "http://localhost:18765";

  console.log("🔍 Verifying dev environment...");
  console.log(`   Backend URL: ${backendUrl}`);

  // Check if backend is running
  try {
    const response = await fetch(`${backendUrl}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    console.log("   ✅ Backend is running");
  } catch (error) {
    console.error("   ❌ Backend is not accessible:", error);
    console.error(`   Please ensure the backend is running on ${backendUrl}`);
    throw error;
  }

  // Verify backend is in dev mode (optional check)
  try {
    const response = await fetch(`${backendUrl}/health`);
    const data = await response.json();
    // Backend could expose dev mode status in health endpoint
    // For now, we'll just verify it's accessible
  } catch (error) {
    // Non-critical, continue
  }

  console.log("✅ Dev environment verification complete");
}

export default globalSetup;
