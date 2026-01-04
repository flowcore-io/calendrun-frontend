"use client";

import { JanuaryChallengePromotionModal } from "@/components/january-challenge-promotion-modal";
import type { ChallengeTemplate } from "@/lib/challenge-templates";
import { useEffect, useState } from "react";

interface JanuaryPromotionWrapperProps {
  currentThemeKey: string;
  januaryTemplate: ChallengeTemplate | null;
  showPromotion: boolean;
  children: React.ReactNode;
}

export function JanuaryPromotionWrapper({
  currentThemeKey,
  januaryTemplate,
  showPromotion,
  children,
}: JanuaryPromotionWrapperProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);

  useEffect(() => {
    // Only show modal if:
    // 1. We should show promotion (passed from server)
    // 2. Current challenge is December
    // 3. January template exists
    // 4. User hasn't dismissed it yet (stored in sessionStorage)
    console.log("[JanuaryPromotionWrapper] Checking conditions:", {
      showPromotion,
      currentThemeKey,
      hasJanuaryTemplate: !!januaryTemplate,
      hasSeenModal,
    });

    if (showPromotion && currentThemeKey.includes("december") && januaryTemplate && !hasSeenModal) {
      const dismissedKey = `january-promotion-dismissed-${januaryTemplate.id}`;
      // For testing, clear the dismissal flag on page load
      // TODO: Remove this line before production
      sessionStorage.removeItem(dismissedKey);
      const wasDismissed = sessionStorage.getItem(dismissedKey) === "true";
      console.log("[JanuaryPromotionWrapper] Dismissed check:", {
        dismissedKey,
        wasDismissed,
      });

      if (!wasDismissed) {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          console.log("[JanuaryPromotionWrapper] Showing modal");
          setShowModal(true);
        }, 0);
      }
    }
  }, [showPromotion, currentThemeKey, januaryTemplate, hasSeenModal]);

  const handleClose = () => {
    setShowModal(false);
    setHasSeenModal(true);
    // Store dismissal in sessionStorage so it doesn't show again this session
    if (januaryTemplate) {
      const dismissedKey = `january-promotion-dismissed-${januaryTemplate.id}`;
      sessionStorage.setItem(dismissedKey, "true");
    }
  };

  return (
    <>
      {children}
      {showModal && januaryTemplate && (
        <JanuaryChallengePromotionModal template={januaryTemplate} onClose={handleClose} />
      )}
    </>
  );
}
