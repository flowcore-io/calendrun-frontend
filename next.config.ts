import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./src/env.mjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_ENV: env.NEXT_PUBLIC_APP_ENV,
  },
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-slot",
      "@tanstack/react-query",
      "@tanstack/react-form",
    ],
  },
};

export default withNextIntl(nextConfig);
