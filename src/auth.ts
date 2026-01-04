import { env } from "@/env.mjs";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

declare module "next-auth" {
  interface User {
    roles?: string[];
  }

  interface Session {
    user: {
      id: string;
      roles: string[];
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    idToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Keycloak({
      issuer: env.KEYCLOAK_ISSUER,
      clientId: env.KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      wellKnown: `${env.KEYCLOAK_ISSUER}/.well-known/openid-configuration`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store the id_token for Keycloak logout
      if (account?.id_token) {
        token.idToken = account.id_token;
      }

      // Roles may come from Keycloak's token or profile; adjust mapping as needed.
      if (account && profile) {
        const kcProfile = profile as Record<string, unknown>;
        const resourceAccess = kcProfile.resource_access as
          | Record<
              string,
              {
                roles?: string[];
              }
            >
          | undefined;

        const realmAccess = kcProfile.realm_access as
          | {
              roles?: string[];
            }
          | undefined;

        const roles = resourceAccess?.[env.KEYCLOAK_CLIENT_ID]?.roles ?? realmAccess?.roles ?? [];

        token.roles = roles;
      }

      return token;
    },
    async session({ session, token }) {
      // Keycloak user ID is typically in `sub`
      session.user = {
        id: token.sub ?? "",
        roles: (token.roles as string[] | undefined) ?? [],
        name: token.name ?? session.user?.name ?? null,
        email: token.email ?? session.user?.email ?? null,
      };

      return session;
    },
  },
  session: {
    strategy: "jwt",
    // Ensure session cookies have proper settings
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  logger: {
    error(code, metadata) {
      // Silently ignore JWT decryption errors (expected during NEXTAUTH_SECRET rotation)
      if (code === "JWT_SESSION_ERROR") {
        return;
      }
      // Log other errors normally
      console.error("[next-auth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[next-auth][warn]", code);
    },
    debug(code, metadata) {
      // Suppress debug logs in production
      if (process.env.NODE_ENV === "development") {
        console.debug("[next-auth][debug]", code, metadata);
      }
    },
  },
};

export async function getServerAuthSession(): Promise<Session | null> {
  // Try to resolve a NextAuth/Keycloak-backed session.
  // Wrap in try-catch to gracefully handle JWT decryption errors from old cookies.
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    // Silently ignore JWT decryption errors (e.g., from NEXTAUTH_SECRET rotation)
    // The browser cookie will be cleared on the next successful auth attempt.
    if (error instanceof Error && error.message.includes("decryption operation failed")) {
      return null;
    }
    // Re-throw unexpected errors
    throw error;
  }
}
