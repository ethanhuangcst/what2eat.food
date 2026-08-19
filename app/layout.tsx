import type { Metadata } from "next";
import "./globals.css";
import { readLocaleCookie } from "@/src/auth/session";
import { htmlLang, normalizeLocale } from "@/src/core/locales";
import { LocaleProvider } from "@/src/i18n/locale-provider";

export const metadata: Metadata = {
  title: "what2eat.food",
  description: "Restaurant picker when you cannot decide what to eat",
  icons: { icon: "/favicon.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = await readLocaleCookie();
  const locale = normalizeLocale(cookieLocale);
  return (
    <html lang={htmlLang(locale)}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
