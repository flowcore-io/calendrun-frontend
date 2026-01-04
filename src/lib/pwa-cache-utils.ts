/**
 * Utility functions for managing PWA cache and forcing updates
 */

export const PWA_CACHE_VERSION = "1.6.2";

export function clearPWACache() {
  if (typeof window === "undefined") return;

  try {
    // Clear localStorage cache
    localStorage.removeItem("calendrun_version");
    localStorage.removeItem("calendrun_last_challenge_check");
    localStorage.removeItem("calendrun_active_challenge_cache");

    // Clear sessionStorage redirect flags
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.startsWith("redirect_")) {
        sessionStorage.removeItem(key);
      }
    }

    // Force reload to clear any cached state
    window.location.reload();
  } catch (error) {
    console.warn("Failed to clear PWA cache:", error);
  }
}

export function forcePWARefresh() {
  if (typeof window === "undefined") return;

  // Update version to force cache invalidation
  localStorage.setItem("calendrun_version", PWA_CACHE_VERSION);

  // Clear cached data
  localStorage.removeItem("calendrun_last_challenge_check");
  localStorage.removeItem("calendrun_active_challenge_cache");

  // Reload page
  window.location.reload();
}

export function isPWACacheStale(): boolean {
  if (typeof window === "undefined") return false;

  const storedVersion = localStorage.getItem("calendrun_version");
  return storedVersion !== PWA_CACHE_VERSION;
}

export function initializePWACache() {
  if (typeof window === "undefined") return;

  const storedVersion = localStorage.getItem("calendrun_version");
  if (storedVersion !== PWA_CACHE_VERSION) {
    // Version changed, clear old cache
    clearPWACache();
    localStorage.setItem("calendrun_version", PWA_CACHE_VERSION);
  }
}
