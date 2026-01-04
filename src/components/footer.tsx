import { Link } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { useTranslations } from "next-intl";
import { Outfit } from "next/font/google";
import Image from "next/image";

const outfit = Outfit({ subsets: ["latin"] });

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="relative z-10 mt-auto border-t border-white/10 bg-black/80 py-4 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-full flex-col items-center justify-center gap-4 px-4 md:px-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <a
          href="https://usable.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Image
            src="/usable-logo.webp"
            alt="Usable Mascot"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span
            className={cn("text-sm font-medium text-white/90 dark:text-white/90", outfit.className)}
          >
            {t("poweredBy")}
          </span>
        </a>

        <nav className="flex gap-6 text-xs text-white/80 dark:text-white/80">
          <Link href="/terms" className="hover:text-white hover:underline">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="hover:text-white hover:underline">
            {t("privacy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
