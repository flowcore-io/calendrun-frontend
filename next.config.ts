import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-slot",
      "@tanstack/react-query",
      "@tanstack/react-form",
    ],
  },
  webpack: (config) => {
    // Exclude test output directories from file watching to prevent hot reload issues during E2E tests
    config.watchOptions = {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/test-results/**",
        "**/.playwright/**",
        "**/.auth/**",
        "**/tests/e2e/**/*.json",
        "**/playwright-report/**",
        "**/playwright/.cache/**",
      ],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
