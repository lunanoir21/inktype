import type { Metadata, Viewport } from "next";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import { fontVariables } from "@/lib/fonts";
import { themeBootScript } from "@/lib/theme-script";
import { Providers } from "@/components/layout/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { ContentShell } from "@/components/layout/content-shell";
import { SettingsDrawer } from "@/components/settings/settings-drawer";
import { FxCanvas } from "@/components/effects/fx-canvas";
import { I18nProvider } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Inktype — type through great books", template: "%s · Inktype" },
  description:
    "Free, open-source typing practice through real books. Type classic literature page by page. No accounts, no ads, no tracking.",
  applicationName: "Inktype",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Inktype", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Shrink the layout when the on-screen keyboard opens so the line stays centered.
  interactiveWidget: "resizes-content",
  themeColor: "#131313",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale();
  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <I18nProvider initial={locale}>
            <ContentShell>
              <SiteHeader />
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </ContentShell>
            <SettingsDrawer />
            <FxCanvas />
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
