import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NEXTAUTH_SECRET: z.string().min(1),
    // NEXTAUTH_URL is optional on Vercel - it auto-detects from VERCEL_URL
    NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
    KEYCLOAK_ISSUER: z.string().url(),
    KEYCLOAK_CLIENT_ID: z.string().min(1),
    KEYCLOAK_CLIENT_SECRET: z.string().min(1),
    // Flowcore configuration
    FLOWCORE_INGESTION_BASE_URL: z.string().url().default("https://webhook.api.flowcore.io"),
    FLOWCORE_TENANT: z.string().default("flowcore-saas"),
    // In dev mode, set FLOWCORE_DATA_CORE_ID to the dev datacore ID (e.g., from bun run dev:flowcore:setup)
    FLOWCORE_DATA_CORE_ID: z.string().min(1),
    FLOWCORE_API_KEY: z.string().min(1),
    // Backend API key for frontend-backend communication
    BACKEND_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_BACKEND_API_URL: z.string().url(),
    NEXT_PUBLIC_DEV_MODE: z
      .string()
      .default("false")
      .transform((val) => val === "true")
      .optional(),
  },
  runtimeEnv: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    FLOWCORE_INGESTION_BASE_URL: process.env.FLOWCORE_INGESTION_BASE_URL,
    FLOWCORE_TENANT: process.env.FLOWCORE_TENANT,
    FLOWCORE_DATA_CORE_ID: process.env.FLOWCORE_DATA_CORE_ID,
    FLOWCORE_API_KEY: process.env.FLOWCORE_API_KEY,
    BACKEND_API_KEY: process.env.BACKEND_API_KEY,
    NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
    NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
  },
});
