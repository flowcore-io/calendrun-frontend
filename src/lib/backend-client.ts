/**
 * Backend API Client
 *
 * TypeScript client for interacting with the CalendRun backend API.
 * Used for reading data from the backend database (projected from Flowcore events).
 *
 * All writes should go through Flowcore ingestion, not this client.
 */

import { env } from "@/env.mjs";
import { cookies } from "next/headers";

const BACKEND_API_BASE_URL = env.NEXT_PUBLIC_BACKEND_API_URL;
const BACKEND_API_KEY = env.BACKEND_API_KEY;

/**
 * Convert snake_case object keys to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeys<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeys) as T;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = transformKeys(value);
    }
    return transformed as T;
  }

  return obj;
}

/**
 * Backend API Client for CalendRun
 */
export class BackendClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? BACKEND_API_BASE_URL;
  }

  /**
   * Build query string from params object
   */
  private buildQueryString(params?: Record<string, string | undefined>): string {
    if (!params) return "";
    const filtered = Object.entries(params).filter(([, value]) => value !== undefined);
    if (filtered.length === 0) return "";
    return `?${filtered
      .map(([key, value]) => {
        if (value == null) return "";
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .filter(Boolean)
      .join("&")}`;
  }

  /**
   * Make a GET request to the backend API
   */
  async get<T>(endpoint: string, params?: Record<string, string | undefined>): Promise<T> {
    const queryString = this.buildQueryString(params);
    const url = `${this.baseUrl}${endpoint}${queryString}`;

    // Get cookies for authentication (Next.js server-side)
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      };

      // Add API key if configured
      if (BACKEND_API_KEY) {
        headers.Authorization = `Bearer ${BACKEND_API_KEY}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store", // Always fetch fresh data from backend
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        throw new Error(`Backend API error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      // Transform snake_case to camelCase
      return transformKeys(data) as T;
    } catch (error) {
      // Handle network errors (ECONNREFUSED, etc.)
      if (error instanceof Error && (error.message.includes("fetch failed") || error.cause)) {
        const cause = (error as { cause?: { code?: string } }).cause;
        if (cause?.code === "ECONNREFUSED") {
          throw new Error(
            `Failed to connect to backend API at ${url}. ` +
              `Please ensure the backend server is running on ${this.baseUrl}. ` +
              `Original error: ${error.message}`
          );
        }
      }
      throw error;
    }
  }

  /**
   * Make a POST request to the backend API
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get cookies for authentication (Next.js server-side)
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    // Add API key if configured
    if (BACKEND_API_KEY) {
      headers.Authorization = `Bearer ${BACKEND_API_KEY}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      throw new Error(`Backend API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    return transformKeys(data) as T;
  }

  /**
   * Make a PATCH request to the backend API
   */
  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get cookies for authentication (Next.js server-side)
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    // Add API key if configured
    if (BACKEND_API_KEY) {
      headers.Authorization = `Bearer ${BACKEND_API_KEY}`;
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      throw new Error(`Backend API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    return transformKeys(data) as T;
  }

  /**
   * Make a DELETE request to the backend API
   */
  async delete(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get cookies for authentication (Next.js server-side)
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    // Add API key if configured
    if (BACKEND_API_KEY) {
      headers.Authorization = `Bearer ${BACKEND_API_KEY}`;
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      throw new Error(`Backend API error (${response.status}): ${errorMessage}`);
    }
  }
}

/**
 * Singleton instance of the Backend client
 */
export const backendClient = new BackendClient();
