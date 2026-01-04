"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ChallengeBackgroundProps = {
  backgroundImageDesktop?: string | StaticImageData;
  backgroundImageMobile?: string | StaticImageData;
};

/**
 * Client component that renders the background image using a portal
 * to ensure it's visible behind the layout's main element background
 */
export function ChallengeBackground({
  backgroundImageDesktop,
  backgroundImageMobile,
}: ChallengeBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return null;
  }

  const backgroundContent = (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Desktop background */}
      {backgroundImageDesktop && (
        <div className="hidden md:block absolute inset-0">
          <Image
            src={backgroundImageDesktop}
            alt=""
            fill
            className="object-cover object-center"
            priority
            quality={85}
            placeholder={typeof backgroundImageDesktop === "object" ? "blur" : undefined}
            style={{
              objectPosition: "center",
            }}
          />
        </div>
      )}
      {/* Mobile background */}
      {backgroundImageMobile && (
        <div className="md:hidden absolute inset-0">
          <Image
            src={backgroundImageMobile}
            alt=""
            fill
            className="object-cover object-center"
            priority
            quality={85}
            placeholder={typeof backgroundImageMobile === "object" ? "blur" : undefined}
            style={{
              objectPosition: "center",
            }}
          />
        </div>
      )}
      {/* Light overlay for subtle readability */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
    </div>
  );

  // The background should be rendered via portal to be at the root level
  // We create a container if it doesn't exist
  return createPortal(backgroundContent, document.body);
}
