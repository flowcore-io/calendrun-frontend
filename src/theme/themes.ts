import bgDesktopDecember from "@/assets/images/calendrun-december2025-a.png";
import bgMobileDecember from "@/assets/images/calendrun-december2025-b.png";
import bgDesktopJanuary from "@/assets/images/calendrun-january2026-a.png";
import bgMobileJanuary from "@/assets/images/calendrun-january2026-b.png";
import type { StaticImageData } from "next/image";

export type ThemeKey = "december_christmas" | "january_winter";

export type ThemeTokens = {
  name: string;
  description: string;
  /**
   * Primary background color for large surfaces.
   */
  background: string;
  /**
   * Default text color on top of `background`.
   */
  foreground: string;
  /**
   * Accent color for buttons and key actions.
   */
  accent: string;
  /**
   * Softer accent color for chips/badges.
   */
  accentSoft: string;
  /**
   * Border and subtle outline color.
   */
  border: string;
  /**
   * Optional key for themed imagery (can be mapped to actual assets later).
   */
  bannerImageKey?: string;
  /**
   * Desktop background image path (for calendar views).
   */
  backgroundImageDesktop?: string | StaticImageData;
  /**
   * Mobile background image path (for calendar views).
   */
  backgroundImageMobile?: string | StaticImageData;
};

export const themes: Record<ThemeKey, ThemeTokens> = {
  december_christmas: {
    name: "December – Christmas",
    description: "Warm Christmas calendar theme with deep reds and gold accents.",
    background: "#14010B",
    foreground: "#FDF7F2",
    accent: "#D72638",
    accentSoft: "#F7C948",
    border: "#F3D9B1",
    bannerImageKey: "december_christmas_snowy_forest",
    backgroundImageDesktop: bgDesktopDecember,
    backgroundImageMobile: bgMobileDecember,
  },
  january_winter: {
    name: "January – Winter",
    description: "Crisp winter theme with cool blues and frosty neutrals.",
    background: "#020716",
    foreground: "#E5F4FF",
    accent: "#2D9CDB",
    accentSoft: "#56CCF2",
    border: "#B3D4E6",
    bannerImageKey: "january_winter_snowy_city",
    backgroundImageDesktop: bgDesktopJanuary,
    backgroundImageMobile: bgMobileJanuary,
  },
};

export const defaultThemeKey: ThemeKey = "january_winter";

export function resolveTheme(key?: string | null): {
  key: ThemeKey;
  tokens: ThemeTokens;
} {
  const normalized = (key ?? "").toLowerCase();

  const themeKey: ThemeKey = normalized === "january_winter" ? "january_winter" : defaultThemeKey;

  return {
    key: themeKey,
    tokens: themes[themeKey],
  };
}

/**
 * Type alias for challenge templates and other domain models that need to
 * reference a seasonal theme.
 *
 * Example:
 *   type ChallengeTemplate = { ..., themeKey: ChallengeThemeKey }
 */
export type ChallengeThemeKey = ThemeKey;
