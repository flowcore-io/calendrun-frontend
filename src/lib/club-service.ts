/**
 * Club Service
 *
 * Business logic for managing clubs and memberships.
 * Clubs and memberships are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import { backendClient } from "./backend-client";
import { listChallengeInstancesByTemplate } from "./challenge-instances";
import { getCurrentMonthChallenge } from "./challenge-templates";
import { emitEvent, generateId } from "./flowcore-client";
import { listRunPerformances } from "./run-performances";
import { variantToMultiplier } from "./variant-utils";

export interface LocalizedString {
  en?: string;
  da?: string;
  fo?: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  inviteToken: string; // Unique token for invitation links
  logoUrl?: string;
  welcomeText?: LocalizedString;
  shortDescription?: LocalizedString;
  createdAt: string;
  updatedAt: string;
  memberCount?: number; // Populated when listing/getting
}

export interface ClubMembership {
  id: string;
  clubId: string;
  userId: string;
  userName?: string;
  role: "admin" | "member";
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  doorsOpened: number;
  totalDistanceKm: number;
  targetDistanceKm: number;
  lastActivityDate?: string;
}

/**
 * Convert backend API response to Club domain model
 */
function apiToClub(data: Record<string, unknown>): Club {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    inviteToken: data.inviteToken as string,
    logoUrl: data.logoUrl as string | undefined,
    welcomeText: data.welcomeText as LocalizedString | undefined,
    shortDescription: data.shortDescription as LocalizedString | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
    memberCount: data.memberCount as number | undefined,
  };
}

/**
 * Convert backend API response to ClubMembership domain model
 */
function apiToMembership(data: Record<string, unknown>): ClubMembership {
  return {
    id: data.id as string,
    clubId: data.clubId as string,
    userId: data.userId as string,
    userName: data.userName as string | undefined,
    role: (data.role as "admin" | "member") ?? "member",
    joinedAt: data.joinedAt as string,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

/**
 * Create a new club (emits event to Flowcore)
 */
export async function createClub(
  clubData: Omit<Club, "id" | "createdAt" | "updatedAt" | "inviteToken" | "memberCount">,
  creatorUserId: string,
  creatorName?: string,
  creatorEmail?: string
): Promise<Club> {
  const id = generateId();
  const now = new Date().toISOString();
  const inviteToken = Math.random().toString(36).substring(2, 15);

  // Sync user to Flowcore before creating club
  const { syncUser } = await import("./user-service");
  await syncUser(creatorUserId, creatorName, creatorEmail);

  // Emit club.created.0 event
  await emitEvent("club.0", "club.created.0", {
    id,
    name: clubData.name,
    description: clubData.description,
    inviteToken,
    logoUrl: clubData.logoUrl,
    welcomeText: clubData.welcomeText,
    shortDescription: clubData.shortDescription,
  });

  // Create membership for creator (admin)
  await createMembership({
    clubId: id,
    userId: creatorUserId,
    userName: creatorName,
    role: "admin",
  });

  // Return the club with generated ID (backend will process the event)
  return {
    id,
    ...clubData,
    inviteToken,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a membership (emits event to Flowcore)
 */
async function createMembership(
  data: Omit<ClubMembership, "id" | "createdAt" | "updatedAt" | "joinedAt">
): Promise<ClubMembership> {
  const id = generateId();
  const now = new Date().toISOString();
  const joinedAt = now;

  // Emit club.member.joined.0 event
  await emitEvent("club.0", "club.member.joined.0", {
    id,
    clubId: data.clubId,
    userId: data.userId,
    userName: data.userName,
    role: data.role,
    joinedAt,
  });

  // Return the membership with generated ID (backend will process the event)
  return {
    id,
    ...data,
    joinedAt,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get club by ID
 */
export async function getClub(clubId: string): Promise<Club | null> {
  try {
    const club = await backendClient.get<Record<string, unknown>>(`/api/clubs/${clubId}`);
    return apiToClub(club);
  } catch (error) {
    console.error("Error fetching club:", clubId, error);
    return null;
  }
}

/**
 * Get club by Invite Token (Case-insensitive)
 */
export async function getClubByInviteToken(token: string): Promise<Club | null> {
  try {
    const club = await backendClient.get<Record<string, unknown>>("/api/clubs", {
      inviteToken: token,
    });
    return apiToClub(club);
  } catch {
    return null;
  }
}

/**
 * List clubs a user is a member of
 */
export async function getUserClubs(userId: string): Promise<Club[]> {
  try {
    const clubs = await backendClient.get<Record<string, unknown>[]>("/api/clubs", { userId });
    return Array.isArray(clubs) ? clubs.map(apiToClub) : [];
  } catch {
    return [];
  }
}

/**
 * List memberships for a club or user
 */
export async function listMemberships(filters: {
  clubId?: string;
  userId?: string;
}): Promise<ClubMembership[]> {
  if (filters.clubId) {
    try {
      const members = await backendClient.get<Record<string, unknown>[]>(
        `/api/clubs/${filters.clubId}/members`
      );
      return Array.isArray(members) ? members.map(apiToMembership) : [];
    } catch {
      return [];
    }
  }

  if (filters.userId) {
    // Get user's clubs, then get memberships for each club
    const clubs = await getUserClubs(filters.userId);
    const allMemberships: ClubMembership[] = [];

    for (const club of clubs) {
      const members = await backendClient
        .get<Record<string, unknown>[]>(`/api/clubs/${club.id}/members`)
        .catch(() => []);
      const userMembership = Array.isArray(members)
        ? members.find((m) => (m as Record<string, unknown>).userId === filters.userId)
        : null;
      if (userMembership) {
        allMemberships.push(apiToMembership(userMembership as Record<string, unknown>));
      }
    }

    return allMemberships;
  }

  return [];
}

/**
 * Join a club using invite token
 */
export async function joinClub(
  userId: string,
  inviteToken: string,
  userName?: string,
  userEmail?: string
): Promise<{ success: boolean; message: string; club?: Club }> {
  const club = await getClubByInviteToken(inviteToken);
  if (!club) {
    return { success: false, message: "Invalid invite token" };
  }

  // Check if already a member
  const memberships = await listMemberships({ clubId: club.id, userId });
  if (memberships.length > 0) {
    return { success: true, message: "Already a member", club };
  }

  // Sync user to Flowcore before creating membership
  const { syncUser } = await import("./user-service");
  await syncUser(userId, userName, userEmail);

  await createMembership({
    clubId: club.id,
    userId,
    userName,
    role: "member",
  });

  return { success: true, message: "Joined successfully", club };
}

/**
 * Remove a member from a club (emits event to Flowcore)
 */
export async function removeMember(clubId: string, userId: string): Promise<boolean> {
  // Find the membership
  const memberships = await listMemberships({ clubId, userId });
  if (memberships.length === 0) return false;

  const membership = memberships[0];

  try {
    // Emit club.member.left.0 event
    await emitEvent("club.0", "club.member.left.0", {
      id: membership.id,
      clubId,
      userId,
    });
    return true;
  } catch (error) {
    console.error("Failed to remove member:", error);
    return false;
  }
}

/**
 * Leave a club (emits event to Flowcore)
 */
export async function leaveClub(
  userId: string,
  clubId: string
): Promise<{ success: boolean; message: string }> {
  // Find the membership
  const memberships = await listMemberships({ clubId, userId });
  if (memberships.length === 0) {
    return { success: false, message: "Not a member of this club" };
  }

  const membership = memberships[0];

  try {
    // Emit club.member.left.0 event
    await emitEvent("club.0", "club.member.left.0", {
      id: membership.id,
      clubId,
      userId,
    });
    return { success: true, message: "Successfully left the club" };
  } catch (error) {
    console.error("Failed to leave club:", error);
    return { success: false, message: "Failed to leave club" };
  }
}

/**
 * Generate Club Leaderboard
 *
 * Uses the backend API endpoint which joins with the user table to get full names.
 * Note: totalDistanceKm from backend represents actual distances run.
 * We still calculate doorsOpened and targetDistanceKm from challenge instances.
 */
export async function getClubLeaderboard(clubId: string): Promise<LeaderboardEntry[]> {
  // 1. Get the current month's challenge template
  const currentChallenge = await getCurrentMonthChallenge();
  if (!currentChallenge) {
    // No current challenge active, return empty leaderboard
    return [];
  }

  // 2. Extract year/month from challenge start date
  const challengeStartDate = new Date(currentChallenge.startDate);
  const year = challengeStartDate.getFullYear();
  const month = challengeStartDate.getMonth() + 1;

  // 3. Fetch leaderboard from backend API (uses user table for names)
  // BackendClient automatically transforms snake_case to camelCase
  let backendLeaderboard: Array<{
    userId: string;
    userName: string | null;
    totalDistanceKm: number | null;
    runCount: number;
  }> = [];

  try {
    backendLeaderboard = await backendClient.get<typeof backendLeaderboard>(
      `/api/clubs/${clubId}/leaderboard`,
      { year: year.toString(), month: month.toString() }
    );
  } catch (error) {
    console.error("Failed to fetch leaderboard from backend:", error);
    return [];
  }

  if (backendLeaderboard.length === 0) {
    return [];
  }

  // 4. Get challenge instances to calculate targetDistanceKm and doorsOpened
  const allInstances = await listChallengeInstancesByTemplate(currentChallenge.id, {
    status: "active",
  });
  const instancesByUser = new Map<string, import("./challenge-instances").ChallengeInstance[]>();
  for (const instance of allInstances) {
    const existing = instancesByUser.get(instance.userId) ?? [];
    existing.push(instance);
    instancesByUser.set(instance.userId, existing);
  }

  // 5. Get runs to calculate doorsOpened and lastActivityDate
  const userIds = backendLeaderboard.map((entry) => entry.userId);
  const runsByUser = new Map<string, import("./run-performances").RunPerformance[]>();

  // Fetch runs for each user in parallel
  await Promise.all(
    userIds.map(async (userId) => {
      const instances = instancesByUser.get(userId) ?? [];
      const currentMonthInstance = instances.find(
        (instance) => instance.templateId === currentChallenge.id
      );

      if (currentMonthInstance) {
        const runs = await listRunPerformances({
          userId,
          instanceId: currentMonthInstance.id,
        });
        runsByUser.set(userId, runs);
      }
    })
  );

  // 6. Build leaderboard entries from backend data + challenge calculations
  const leaderboard: LeaderboardEntry[] = backendLeaderboard
    .map((entry) => {
      const userId = entry.userId;
      const instances = instancesByUser.get(userId) ?? [];
      const currentMonthInstance = instances.find(
        (instance) => instance.templateId === currentChallenge.id
      );

      const runs = runsByUser.get(userId) ?? [];
      const uniqueDays = new Set(runs.map((r) => r.runDate)).size;
      const latestRun = runs.length > 0 ? runs[0] : undefined;

      // Calculate target distance based on current month's challenge variant
      let targetDistanceKm = 0;
      if (currentMonthInstance) {
        const variantMultiplier = variantToMultiplier(currentMonthInstance.variant);
        targetDistanceKm = currentChallenge.fullDistanceTotalKm * variantMultiplier;
      }

      // Use userName from backend (which comes from user table via COALESCE)
      const displayName = entry.userName ?? userId;

      // Ensure totalDistanceKm is a number (PostgreSQL SUM might return string or null)
      const totalDistanceKm =
        typeof entry.totalDistanceKm === "number"
          ? entry.totalDistanceKm
          : entry.totalDistanceKm != null
            ? Number.parseFloat(String(entry.totalDistanceKm)) || 0
            : 0;

      return {
        userId,
        displayName,
        doorsOpened: uniqueDays,
        totalDistanceKm,
        targetDistanceKm,
        lastActivityDate: latestRun?.runDate,
      };
    })
    .filter((entry) => entry.targetDistanceKm > 0); // Only users who joined the challenge

  // 7. Sort by Distance DESC, then Doors Opened DESC
  return leaderboard.sort((a, b) => {
    if (b.totalDistanceKm !== a.totalDistanceKm) return b.totalDistanceKm - a.totalDistanceKm;
    return b.doorsOpened - a.doorsOpened;
  });
}

/**
 * Generate Leaderboard for All Users
 *
 * Similar to getClubLeaderboard but includes all users who have active challenge instances.
 * Note: totalDistanceKm represents the sum of "opened door" values (planned distances
 * from the calendar), NOT the actual distances run.
 */
export async function getAllUsersLeaderboard(): Promise<LeaderboardEntry[]> {
  // 1. Get the current month's challenge template to filter instances
  const currentChallenge = await getCurrentMonthChallenge();
  if (!currentChallenge) {
    // No current challenge active, return empty leaderboard
    return [];
  }

  // 2. Get all active challenge instances for the current month's challenge template
  const currentMonthInstances = await listChallengeInstancesByTemplate(currentChallenge.id, {
    status: "active",
  });

  if (currentMonthInstances.length === 0) return [];

  // Extract unique user IDs and group instances by user
  const uniqueUserIds = Array.from(new Set(currentMonthInstances.map((inst) => inst.userId)));

  if (uniqueUserIds.length === 0) return [];

  // Group instances by userId (we already have them, no need to query again)
  const instancesByUser = new Map<string, typeof currentMonthInstances>();
  for (const instance of currentMonthInstances) {
    const existing = instancesByUser.get(instance.userId) ?? [];
    existing.push(instance);
    instancesByUser.set(instance.userId, existing);
  }

  // 2. Fetch users, runs, and memberships for all users in parallel
  // Fetch runs individually per user to avoid query length issues with many users
  const [users, allRunsByUser, allMemberships] = await Promise.all([
    // Fetch users from user table to get names
    backendClient
      .get<Array<{ id: string; name: string | null; email: string | null }>>("/api/users", {
        userIds: uniqueUserIds.join(","),
      })
      .then((users) => {
        const userMap = new Map<
          string,
          { id: string; name: string | null; email: string | null }
        >();
        for (const user of users) {
          userMap.set(user.id, user);
        }
        return userMap;
      })
      .catch((error) => {
        // If API fails, log error but continue with empty map (will fall back to runnerName)
        console.warn("Failed to fetch users from API, will use runnerName fallback:", error);
        return new Map<string, { id: string; name: string | null; email: string | null }>();
      }),
    // Fetch runs per user in parallel (avoids long query strings)
    Promise.all(
      uniqueUserIds.map((userId) =>
        listRunPerformances({ userId }).then((runs) => [userId, runs] as const)
      )
    ).then((results) => {
      const merged = new Map<string, import("./run-performances").RunPerformance[]>();
      for (const [userId, runs] of results) {
        merged.set(userId, runs);
      }
      return merged;
    }),
    // Get all memberships for all users
    Promise.all(uniqueUserIds.map((userId) => listMemberships({ userId }))).then((results) =>
      results.flat()
    ),
  ]);

  // 3. Build a map of userId -> club name(s)
  // Get unique club IDs from memberships
  const uniqueClubIds = Array.from(new Set(allMemberships.map((m) => m.clubId)));

  // Fetch all clubs in parallel
  const clubs = await Promise.all(uniqueClubIds.map((clubId) => getClub(clubId)));

  // Create a map of clubId -> club name
  const clubNameMap = new Map<string, string>();
  for (const club of clubs) {
    if (club) {
      clubNameMap.set(club.id, club.name);
    }
  }

  // Create a map of userId -> first club name (users can be in multiple clubs, show first one)
  const userClubNameMap = new Map<string, string>();
  for (const membership of allMemberships) {
    const clubName = clubNameMap.get(membership.clubId);
    if (clubName && !userClubNameMap.has(membership.userId)) {
      userClubNameMap.set(membership.userId, clubName);
    }
  }

  // 4. Calculate leaderboard entries for each user
  const leaderboardEntries = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const allRuns = allRunsByUser.get(userId) ?? [];
      const instances = instancesByUser.get(userId) ?? [];

      // Get the current month's instance (should only be one)
      const currentMonthInstance =
        instances.find((instance) => instance.templateId === currentChallenge.id) ?? instances[0];

      // Filter runs to only include those from the current month's challenge instance
      const runs = currentMonthInstance
        ? allRuns.filter((run) => run.instanceId === currentMonthInstance.id)
        : [];

      const uniqueDays = new Set(runs.map((r) => r.runDate)).size;

      // Calculate target distance based on current month's challenge variant
      let targetDistanceKm = 0;
      let totalDistance = 0;

      if (currentMonthInstance) {
        // Use the current challenge template (already fetched)
        const variantMultiplier = variantToMultiplier(currentMonthInstance.variant);
        targetDistanceKm = currentChallenge.fullDistanceTotalKm * variantMultiplier;

        const startDate = new Date(currentChallenge.startDate);
        const msPerDay = 1000 * 60 * 60 * 24;

        // Get unique run dates (opened doors)
        const uniqueRunDates = new Set(runs.map((r) => r.runDate));

        for (const runDate of uniqueRunDates) {
          const runDateObj = new Date(runDate);
          const dayIndex = Math.floor((runDateObj.getTime() - startDate.getTime()) / msPerDay);

          if (dayIndex >= 0 && dayIndex < currentChallenge.requiredDistancesKm.length) {
            const baseDistance = currentChallenge.requiredDistancesKm[dayIndex] ?? 0;
            const doorValue = baseDistance * variantMultiplier;
            totalDistance += doorValue;
          }
        }
      }

      // Get user name from user table (preferred), fallback to runnerName from latest run
      // Don't show userId as fallback - filter out users without names instead
      const user = users.get(userId);
      const latestRun = runs[0];
      const userName = user?.name?.trim() || null;
      const runnerName = latestRun?.runnerName?.trim() || null;
      let displayName = userName || runnerName;

      // Skip users without any name (don't show UUIDs)
      if (!displayName) {
        return null;
      }

      // Add club name in parentheses if user is in a club
      const clubName = userClubNameMap.get(userId);
      if (clubName) {
        displayName = `${displayName} (${clubName})`;
      }

      const lastActivityDate = latestRun?.runDate;

      return {
        userId,
        displayName, // We've already checked it's not null above
        doorsOpened: uniqueDays,
        totalDistanceKm: totalDistance,
        targetDistanceKm,
        lastActivityDate,
      };
    })
  );

  // Filter out users who haven't joined the current month's challenge or don't have a name
  // (targetDistanceKm > 0 indicates they have an instance for the current challenge)
  // We filter out entries without displayName (null) to avoid showing UUIDs
  const filteredLeaderboard: LeaderboardEntry[] = leaderboardEntries.filter(
    (entry): entry is NonNullable<typeof entry> => {
      return entry != null && entry.targetDistanceKm > 0 && !!entry.displayName;
    }
  );

  // Sort by Distance DESC, then Doors Opened DESC
  return filteredLeaderboard.sort((a, b) => {
    if (b.totalDistanceKm !== a.totalDistanceKm) return b.totalDistanceKm - a.totalDistanceKm;
    return b.doorsOpened - a.doorsOpened;
  });
}

/**
 * Update club details
 */
export async function updateClub(
  clubId: string,
  data: Partial<Pick<Club, "name" | "description" | "welcomeText" | "shortDescription" | "logoUrl">>
): Promise<Club> {
  const currentClub = await getClub(clubId);
  if (!currentClub) throw new Error("Club not found");

  // Emit club.updated.0 event
  await emitEvent("club.0", "club.updated.0", {
    id: clubId,
    ...data,
  });

  // Return merged club (backend will process the event)
  return {
    ...currentClub,
    ...data,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Regenerate or Set Custom Invite Token (emits event to Flowcore)
 */
export async function regenerateInviteToken(clubId: string, customToken?: string): Promise<string> {
  const newToken = customToken || Math.random().toString(36).substring(2, 15);

  // Check uniqueness (case-insensitive)
  const existingClub = await getClubByInviteToken(newToken);
  if (existingClub && existingClub.id !== clubId) {
    throw new Error("Invite token already in use by another club");
  }

  // Emit club.updated.0 event with new inviteToken
  await emitEvent("club.0", "club.updated.0", {
    id: clubId,
    inviteToken: newToken,
  });

  return newToken;
}
