import { getServerAuthSession } from "@/auth";
import { getClubByInviteToken } from "@/lib/club-service";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// In-memory rate limiter store
// In production, you'd use Redis or a similar distributed cache
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_MAX_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(userId);

  // Clean up expired records periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    // No record or expired, create new one
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(userId, { count: 1, resetTime });
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - 1,
      resetTime,
    };
  }

  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(userId, record);
  return {
    allowed: true,
    remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - record.count,
    resetTime: record.resetTime,
  };
}

function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

const ValidateTokenSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/challenges/validate-token
 * Validates a club invite token with rate limiting protection
 */
export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check rate limit first
  const rateLimitResult = checkRateLimit(userId);

  if (!rateLimitResult.allowed) {
    const resetDate = new Date(rateLimitResult.resetTime);
    const minutesRemaining = Math.ceil((rateLimitResult.resetTime - Date.now()) / (60 * 1000));

    return NextResponse.json(
      {
        error: "Too many invalid token attempts. Please try again later.",
        rateLimited: true,
        resetTime: resetDate.toISOString(),
        minutesRemaining,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { token } = ValidateTokenSchema.parse(body);

    // Validate the token against clubs
    const club = await getClubByInviteToken(token);

    if (!club) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid invite token",
          remainingAttempts: rateLimitResult.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Token is valid - reset rate limit for this user since they succeeded
    resetRateLimit(userId);

    return NextResponse.json({
      valid: true,
      clubName: club.name,
      clubId: club.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error validating token:", error);
    return NextResponse.json({ error: "Failed to validate token" }, { status: 500 });
  }
}
