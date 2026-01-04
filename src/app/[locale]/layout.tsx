import { getServerAuthSession } from "@/auth";
import { AddToHomeScreen } from "@/components/add-to-home-screen";
import { AppHeader } from "@/components/app-header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { type Locale, routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL("https://calendrun.com"),
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://calendrun.com",
      siteName: "CalendRun",
      images: [
        {
          url: "/calendrun.png",
          width: 1200,
          height: 630,
        },
      ],
      locale: locale === "da" ? "da_DK" : locale === "fo" ? "fo_FO" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/calendrun.png"],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("title"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming locale parameter is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();
  const session = await getServerAuthSession();

  return (
    <html lang={locale} className="overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen w-full max-w-full overflow-x-hidden bg-zinc-50 text-zinc-900 antialiased dark:bg-black dark:text-zinc-50`}
      >
        <Script
          src="https://plausible.io/js/pa-GpbJZw3q6cGEq8-9d5U6n.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`
            window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
            plausible.init()
          `}
        </Script>
        {/* ULTRA-BRUTAL PWA REDIRECT: Block ANY challenge page access after Dec 31st */}
        <Script id="pwa-december-block" strategy="beforeInteractive">
          {`
            (function() {
              // Only run if this looks like a PWA
              var isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');

              if (!isPWA) return;

              var now = new Date();
              var currentYear = now.getFullYear();
              var currentMonth = now.getMonth();
              var checkYear = currentMonth < 11 ? currentYear - 1 : currentYear;
              var december31 = new Date(checkYear, 11, 31);
              var isAfterDec31 = now >= december31;

              // Only block December challenge URLs after Dec 31st
              if (isAfterDec31 &&
                  window.location.pathname.match(/\\/challenges\\/[^\\/]+$/) &&
                  (window.location.pathname.includes('december') || window.location.pathname.includes('christmas'))) {
                window.location.href = '/';
              }
            })();
          `}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
              <AppHeader locale={locale as Locale} session={session} />
              <main className="flex flex-1 flex-col overflow-x-hidden bg-gradient-to-b from-zinc-50 to-white pt-14 dark:from-black dark:to-zinc-950">
                {children}
              </main>
              <Footer />
              <AddToHomeScreen />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
