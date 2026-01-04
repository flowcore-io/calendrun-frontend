"use client";

import { regenerateInviteTokenAction } from "@/app/actions/club-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface ClubInviteProps {
  inviteToken: string;
  clubId?: string; // Optional, only needed if allowRegenerate is true
  allowRegenerate?: boolean;
}

export function ClubInvite({ inviteToken, clubId, allowRegenerate = false }: ClubInviteProps) {
  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState(inviteToken); // Track the displayed token
  const [inviteLink, setInviteLink] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [customToken, setCustomToken] = useState(inviteToken);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use useEffect to avoid "window is not defined" error during SSR
  useEffect(() => {
    setInviteLink(`${window.location.origin}?club=${currentToken}`);
  }, [currentToken]);

  // Sync with prop changes (e.g., after server refresh)
  useEffect(() => {
    setCurrentToken(inviteToken);
    setCustomToken(inviteToken);
  }, [inviteToken]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!clubId) return;
    setError(null);

    // If token hasn't changed, just close edit mode
    if (customToken === currentToken) {
      setIsEditing(false);
      return;
    }

    // Optimistic update - immediately show the new token
    const newToken = customToken;
    setCurrentToken(newToken);
    setIsEditing(false);

    startTransition(async () => {
      const result = await regenerateInviteTokenAction(clubId, newToken);
      if (result.success) {
        router.refresh();
      } else {
        // Revert on error
        setCurrentToken(inviteToken);
        setError(result.error || "Failed to update token");
        setIsEditing(true);
        setCustomToken(newToken);
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCustomToken(currentToken);
    setError(null);
  };

  const handleRegenerateRandom = () => {
    if (!clubId || !confirm("Are you sure? The old link will stop working.")) return;
    setError(null);

    // Generate random token for optimistic update
    const newToken = Math.random().toString(36).substring(2, 15);
    setCurrentToken(newToken);
    setCustomToken(newToken);
    setIsEditing(false);

    startTransition(async () => {
      const result = await regenerateInviteTokenAction(clubId);
      if (result.success && result.newToken) {
        // Update with the actual token from the server
        setCurrentToken(result.newToken);
        setCustomToken(result.newToken);
        router.refresh();
      } else if (!result.success) {
        // Revert on error
        setCurrentToken(inviteToken);
        setCustomToken(inviteToken);
        setError(result.error || "Failed to regenerate token");
      }
    });
  };

  if (!inviteLink) {
    return null; // Don't render until client-side hydration
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              .../?club=
            </span>
            <input
              type="text"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Enter custom token"
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2">
            <code className="flex-1 rounded bg-zinc-100 px-2 py-1 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 break-all">
              {inviteLink}
            </code>
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {allowRegenerate && clubId && (
          <div className="flex items-center gap-2 sm:ml-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={handleRegenerateRandom}
                  disabled={isPending}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 whitespace-nowrap"
                >
                  Random
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 whitespace-nowrap"
              >
                Edit Link
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
