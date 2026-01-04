import { getServerAuthSession } from "@/auth";
import { ClubInvite } from "@/components/club-invite";
import { ClubMembersManagement } from "@/components/club-members-management";
import { CreateClubDialog } from "@/components/create-club-dialog";
import { EditClubForm } from "@/components/edit-club-form";
import { Link } from "@/i18n/routing";
import { type Club, getUserClubs, listMemberships } from "@/lib/club-service";
import { getTranslations, setRequestLocale } from "next-intl/server";

// Disable caching to always get fresh data
export const dynamic = "force-dynamic";

export default async function ClubAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("club");
  const tProfile = await getTranslations("profile");
  const tCommon = await getTranslations("common");

  const session = await getServerAuthSession();

  // Check if user is allowed to access this page (hardcoded check as per requirement)
  const TEAM_ADMIN_ID = "cf66a9bc-b000-43f8-a834-9c4ba3ac96ad";
  const isClubAdmin = session?.user?.id === TEAM_ADMIN_ID;

  if (!session || !isClubAdmin) {
    return (
      <main className="mx-auto flex max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Access Denied.</p>
      </main>
    );
  }

  // Get clubs created by this user (or all clubs they are admin of)
  const userClubs = await getUserClubs(session.user.id);

  // Check admin role for each club and fetch members
  const adminClubsWithMembers: Array<{
    club: Club;
    members: { userId: string; userName?: string; joinedAt: string }[];
  }> = [];

  for (const club of userClubs) {
    const memberships = await listMemberships({ clubId: club.id });
    const myMembership = memberships.find((m) => m.userId === session.user.id);

    if (myMembership && myMembership.role === "admin") {
      // Filter out self from management list? Or keep self but disable remove?
      // Let's filter out self for now to prevent accidental self-removal.
      const otherMembers = memberships
        .filter((m) => m.userId !== session.user.id)
        .map((m) => ({
          userId: m.userId,
          userName: m.userName,
          joinedAt: m.joinedAt,
        }));

      adminClubsWithMembers.push({
        club,
        members: otherMembers,
      });
    }
  }

  // Translations
  const createClubTranslations = {
    createClub: tProfile("createClub"),
    clubName: tProfile("clubName"),
    clubNamePlaceholder: tProfile("clubNamePlaceholder"),
    clubDescription: tProfile("clubDescription"),
    clubDescriptionPlaceholder: tProfile("clubDescriptionPlaceholder"),
    optional: tCommon("optional"),
    cancel: tCommon("cancel"),
    create: tProfile("create"),
    creating: tProfile("creating"),
  };

  const membersManagementTranslations = {
    members: t("members"),
    remove: tCommon("delete"), // Reusing delete for remove
    removing: t("removing"),
    confirmRemove: t("confirmRemove", { name: "{name}" }),
    noMembers: t("noMembers"),
  };

  const editClubTranslations = {
    clubName: tProfile("clubName"),
    internalDescription: `${tProfile("clubDescription")} (${tCommon("optional")})`,
    localizedContent: t("localizedContent"),
    shortDescription: t("shortDescription", { lang: "{lang}" }),
    shortDescriptionPlaceholder: t("shortDescriptionPlaceholder"),
    welcomeText: t("welcomeText", { lang: "{lang}" }),
    welcomeTextPlaceholder: t("welcomeTextPlaceholder"),
    saveChanges: t("saveChanges"),
    saving: t("saving"),
    success: t("clubUpdated"),
    languages: {
      en: t("languages.en"),
      da: t("languages.da"),
      fo: t("languages.fo"),
    },
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("clubAdmin")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage your clubs and members.
          </p>
        </div>
        <CreateClubDialog translations={createClubTranslations} />
      </div>

      <div className="space-y-8">
        {adminClubsWithMembers.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-zinc-500 dark:text-zinc-400">You don&apos;t manage any clubs yet.</p>
          </div>
        ) : (
          adminClubsWithMembers.map(({ club, members }) => (
            <div
              key={club.id}
              className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {club.name}
                </h2>
                <Link
                  href={`/club?id=${club.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  View Public Page
                </Link>
              </div>

              {/* Edit Details */}
              <div className="mb-8">
                <EditClubForm club={club} translations={editClubTranslations} />
              </div>

              {/* Invite Section */}
              <div className="mb-8 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t("inviteMembers")}
                </h3>
                <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("inviteMembersDesc")}
                </p>
                <ClubInvite
                  inviteToken={club.inviteToken}
                  clubId={club.id}
                  allowRegenerate={true}
                />
              </div>

              {/* Members Management */}
              <div>
                <h3 className="mb-4 font-medium text-zinc-900 dark:text-zinc-100">
                  Members ({members.length})
                </h3>
                <ClubMembersManagement
                  clubId={club.id}
                  members={members}
                  translations={membersManagementTranslations}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
