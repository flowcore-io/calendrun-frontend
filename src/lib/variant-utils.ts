/**
 * Variant Utilities
 *
 * Helper functions for working with challenge variants.
 * Variants can be "full", "half", or fraction strings like "1/8", "2/8", etc.
 * For 28-day calendars, variants use 1/7 through 7/7 (since 406 km is divisible by 7).
 * For 29-day and 30-day calendars, variants use 1/5 through 5/5 (since 435 km and 465 km are divisible by 5).
 */

export type Variant =
  | "full"
  | "half"
  | "1/8"
  | "2/8"
  | "3/8"
  | "4/8"
  | "5/8"
  | "6/8"
  | "7/8"
  | "8/8"
  | "1/7"
  | "2/7"
  | "3/7"
  | "4/7"
  | "5/7"
  | "6/7"
  | "7/7"
  | "1/5"
  | "2/5"
  | "3/5"
  | "4/5"
  | "5/5";

/**
 * Convert a variant string to a multiplier (0.0 to 1.0)
 */
export function variantToMultiplier(variant: Variant): number {
  if (variant === "full" || variant === "8/8" || variant === "7/7" || variant === "5/5") {
    return 1.0;
  }
  if (variant === "half" || variant === "4/8") {
    return 0.5;
  }
  // Parse fraction strings like "1/8", "2/8", "1/7", "2/7", "1/5", "2/5", etc.
  const match = variant.match(/^(\d+)\/(\d+)$/);
  if (match?.[1] && match?.[2]) {
    const numerator = Number.parseInt(match[1], 10);
    const denominator = Number.parseInt(match[2], 10);
    return numerator / denominator;
  }
  // Fallback to full if unknown
  return 1.0;
}

/**
 * Get the display name for a variant
 */
export function getVariantDisplayName(variant: Variant, locale = "en"): string {
  const names: Record<string, Record<Variant, string>> = {
    en: {
      full: "Full",
      half: "Half",
      "1/8": "1/8",
      "2/8": "Quarter",
      "3/8": "3/8",
      "4/8": "Half",
      "5/8": "5/8",
      "6/8": "Three Quarters",
      "7/8": "7/8",
      "8/8": "Full",
      "1/7": "1/7",
      "2/7": "2/7",
      "3/7": "3/7",
      "4/7": "4/7",
      "5/7": "5/7",
      "6/7": "6/7",
      "7/7": "Full",
      "1/5": "1/5",
      "2/5": "2/5",
      "3/5": "3/5",
      "4/5": "4/5",
      "5/5": "Full",
    },
    da: {
      full: "Fuld",
      half: "Halv",
      "1/8": "1/8",
      "2/8": "Kvart",
      "3/8": "3/8",
      "4/8": "Halv",
      "5/8": "5/8",
      "6/8": "Tre kvart",
      "7/8": "7/8",
      "8/8": "Fuld",
      "1/7": "1/7",
      "2/7": "2/7",
      "3/7": "3/7",
      "4/7": "4/7",
      "5/7": "5/7",
      "6/7": "6/7",
      "7/7": "Fuld",
      "1/5": "1/5",
      "2/5": "2/5",
      "3/5": "3/5",
      "4/5": "4/5",
      "5/5": "Fuld",
    },
    fo: {
      full: "Fullur",
      half: "Hálv",
      "1/8": "1/8",
      "2/8": "Fjórðings",
      "3/8": "3/8",
      "4/8": "Hálv",
      "5/8": "5/8",
      "6/8": "Tríggjar fjórðings",
      "7/8": "7/8",
      "8/8": "Full",
      "1/7": "1/7",
      "2/7": "2/7",
      "3/7": "3/7",
      "4/7": "4/7",
      "5/7": "5/7",
      "6/7": "6/7",
      "7/7": "Full",
      "1/5": "1/5",
      "2/5": "2/5",
      "3/5": "3/5",
      "4/5": "4/5",
      "5/5": "Full",
    },
  };

  return names[locale]?.[variant] ?? names.en[variant] ?? variant;
}

/**
 * Get a compact display name for a variant (fraction notation when space is limited)
 * This converts words like "Half", "Quarter", "Three Quarters" to fraction notation
 */
export function getVariantDisplayNameCompact(variant: Variant): string {
  // Convert to fraction notation
  if (variant === "full" || variant === "8/8" || variant === "7/7" || variant === "5/5") {
    return "1/1";
  }
  if (variant === "half" || variant === "4/8") {
    return "1/2";
  }
  // For fraction variants, simplify if possible
  if (variant === "2/8") {
    return "1/4";
  }
  if (variant === "6/8") {
    return "3/4";
  }
  // Return the variant as-is for other fractions (including 1/7, 2/7, 1/5, 2/5, etc.)
  return variant;
}

/**
 * Normalize variant string (convert "full" to "8/8", "half" to "4/8")
 */
export function normalizeVariant(variant: Variant): string {
  if (variant === "full") return "8/8";
  if (variant === "half") return "4/8";
  return variant;
}

/**
 * Check if a variant string is valid
 */
export function isValidVariant(variant: string): variant is Variant {
  return [
    "full",
    "half",
    "1/8",
    "2/8",
    "3/8",
    "4/8",
    "5/8",
    "6/8",
    "7/8",
    "8/8",
    "1/7",
    "2/7",
    "3/7",
    "4/7",
    "5/7",
    "6/7",
    "7/7",
    "1/5",
    "2/5",
    "3/5",
    "4/5",
    "5/5",
  ].includes(variant);
}

/**
 * Get available variants based on the number of days in the challenge.
 * Different month lengths have different numbers of options:
 * - 24 days (December - Faroe Islands/Denmark): 4 options (2/8, 4/8, 6/8, 8/8) - quarter increments
 * - 25 days (December - some countries): 6 options (1/5, 2/5, half, 3/5, 4/5, 5/5)
 *   - Uses 1/5 through 5/5 because 325 km (total for 25 days) is divisible by 5
 *   - Includes half option at 162.5 km
 * - 28 days (February non-leap): 7 options (1/7, 2/7, 3/7, 4/7, 5/7, 6/7, 7/7)
 *   - Uses 1/7 through 7/7 because 406 km (total for 28 days) is divisible by 7
 *   - Each day's distance is 1/7 of the required distance, rounded to 2 decimals
 * - 29 days (February leap): 6 options (1/5, 2/5, half, 3/5, 4/5, 5/5)
 *   - Uses 1/5 through 5/5 because 435 km (total for 29 days) is divisible by 5
 *   - Includes half option at 217.5 km
 * - 30 days (April, etc.): 6 options (1/5, 2/5, half, 3/5, 4/5, 5/5)
 *   - Uses 1/5 through 5/5 because 465 km (total for 30 days) is divisible by 5
 *   - Includes half option at 232.5 km
 * - 31 days (January, etc.): 8 options (1/8, 2/8, 3/8, 4/8, 5/8, 6/8, 7/8, 8/8)
 */
export function getVariantsForDays(days: number): Variant[] {
  if (days === 24) {
    // December (Faroe Islands/Denmark): 4 options (quarter increments)
    return ["2/8", "4/8", "6/8", "8/8"];
  }
  if (days === 25) {
    // December (some countries): 6 options using 1/5 through 5/5, plus half
    // Total distance is 325 km (1+2+...+25), which is divisible by 5
    // Half option: 162.5 km
    return ["1/5", "2/5", "half", "3/5", "4/5", "5/5"];
  }
  if (days === 28) {
    // February (non-leap): 7 options using 1/7 through 7/7
    // Total distance is 406 km (1+2+...+28), which is divisible by 7
    return ["1/7", "2/7", "3/7", "4/7", "5/7", "6/7", "7/7"];
  }
  if (days === 29) {
    // February (leap): 6 options using 1/5 through 5/5, plus half
    // Total distance is 435 km (1+2+...+29), which is divisible by 5
    // Half option: 217.5 km
    return ["1/5", "2/5", "half", "3/5", "4/5", "5/5"];
  }
  if (days === 30) {
    // April, June, September, November: 6 options using 1/5 through 5/5, plus half
    // Total distance is 465 km (1+2+...+30), which is divisible by 5
    // Half option: 232.5 km
    return ["1/5", "2/5", "half", "3/5", "4/5", "5/5"];
  }
  if (days === 31) {
    // January, March, May, July, August, October, December: 8 options
    return ["1/8", "2/8", "3/8", "4/8", "5/8", "6/8", "7/8", "8/8"];
  }
  // Default: show all 8 options for other lengths
  return ["1/8", "2/8", "3/8", "4/8", "5/8", "6/8", "7/8", "8/8"];
}
