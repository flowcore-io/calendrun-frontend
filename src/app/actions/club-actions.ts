"use server";

import { getServerAuthSession } from "@/auth";
import {
  type LocalizedString,
  createClub,
  joinClub,
  leaveClub,
  listMemberships,
  regenerateInviteToken,
  removeMember,
  updateClub,
} from "@/lib/club-service";
import { revalidatePath } from "next/cache";

export interface CreateClubState {
  success: boolean;
  error?: string;
  clubId?: string;
}

export async function createClubAction(
  prevState: CreateClubState,
  formData: FormData
): Promise<CreateClubState> {
  const session = await getServerAuthSession();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim().length === 0) {
    return { success: false, error: "Club name is required" };
  }

  try {
    const club = await createClub(
      {
        name,
        description,
      },
      session.user.id,
      session.user.name ?? undefined,
      session.user.email ?? undefined
    );

    revalidatePath("/club");
    return { success: true, clubId: club.id };
  } catch (error) {
    console.error("Failed to create club:", error);
    return {
      success: false,
      error: "Failed to create club. Please try again.",
    };
  }
}

export interface JoinClubState {
  success: boolean;
  error?: string;
  clubName?: string;
  welcomeText?: LocalizedString;
}

export async function joinClubAction(
  prevState: JoinClubState,
  formData: FormData
): Promise<JoinClubState> {
  const session = await getServerAuthSession();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const inviteToken = formData.get("inviteToken") as string;

  if (!inviteToken || inviteToken.trim().length === 0) {
    return { success: false, error: "Invite token is required" };
  }

  try {
    const result = await joinClub(
      session.user.id,
      inviteToken.trim(),
      session.user.name ?? undefined,
      session.user.email ?? undefined
    );

    if (!result.success) {
      return { success: false, error: result.message };
    }

    revalidatePath("/profile");
    revalidatePath("/club");
    return {
      success: true,
      clubName: result.club?.name,
      welcomeText: result.club?.welcomeText,
    };
  } catch (error) {
    console.error("Failed to join club:", error);
    return { success: false, error: "Failed to join club. Please try again." };
  }
}

export async function leaveClubAction(
  clubId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerAuthSession();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await leaveClub(session.user.id, clubId);

    if (!result.success) {
      return { success: false, error: result.message };
    }

    revalidatePath("/profile");
    revalidatePath("/club");
    return { success: true };
  } catch (error) {
    console.error("Failed to leave club:", error);
    return { success: false, error: "Failed to leave club" };
  }
}

export async function removeMemberAction(
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerAuthSession();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if requestor is admin of the club
  // Note: This is a duplicate check (also done in UI), but vital for security.
  const memberships = await listMemberships({
    clubId,
    userId: session.user.id,
  });
  const membership = memberships[0];

  if (!membership || membership.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized: You must be an admin of this club.",
    };
  }

  try {
    const success = await removeMember(clubId, userId);

    if (!success) {
      return { success: false, error: "Failed to remove member" };
    }

    revalidatePath("/club-admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { success: false, error: "Failed to remove member" };
  }
}

export async function regenerateInviteTokenAction(
  clubId: string,
  customToken?: string
): Promise<{ success: boolean; newToken?: string; error?: string }> {
  const session = await getServerAuthSession();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if requestor is admin of the club
  const memberships = await listMemberships({
    clubId,
    userId: session.user.id,
  });
  const membership = memberships[0];

  if (!membership || membership.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized: You must be an admin of this club.",
    };
  }

  try {
    const newToken = await regenerateInviteToken(clubId, customToken);
    revalidatePath("/club-admin");
    return { success: true, newToken };
  } catch (error) {
    console.error("Failed to regenerate token:", error);
    if (error instanceof Error && error.message === "Invite token already in use by another club") {
      return {
        success: false,
        error: "This token is already in use. Please choose another one.",
      };
    }
    return { success: false, error: "Failed to regenerate token" };
  }
}

export interface UpdateClubState {
  success: boolean;
  error?: string;
}

export async function updateClubAction(
  clubId: string,
  prevState: UpdateClubState,
  formData: FormData
): Promise<UpdateClubState> {
  const session = await getServerAuthSession();
  if (!session) return { success: false, error: "Unauthorized" };

  // Verify admin access
  const memberships = await listMemberships({
    clubId,
    userId: session.user.id,
  });
  const membership = memberships[0];

  if (!membership || membership.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized: You must be an admin of this club.",
    };
  }

  const welcomeTextEn = formData.get("welcomeTextEn") as string;
  const welcomeTextDa = formData.get("welcomeTextDa") as string;
  const welcomeTextFo = formData.get("welcomeTextFo") as string;

  const shortDescriptionEn = formData.get("shortDescriptionEn") as string;
  const shortDescriptionDa = formData.get("shortDescriptionDa") as string;
  const shortDescriptionFo = formData.get("shortDescriptionFo") as string;

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  try {
    await updateClub(clubId, {
      name,
      description,
      welcomeText: {
        en: welcomeTextEn,
        da: welcomeTextDa,
        fo: welcomeTextFo,
      },
      shortDescription: {
        en: shortDescriptionEn,
        da: shortDescriptionDa,
        fo: shortDescriptionFo,
      },
    });

    revalidatePath("/club-admin");
    revalidatePath("/club");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update club:", error);
    return { success: false, error: "Failed to update club" };
  }
}
