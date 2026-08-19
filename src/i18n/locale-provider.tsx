"use client";

import { useLocaleStore } from "@/src/i18n/locale-store";
import { type Locale } from "@/src/core/locales";

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const setLocale = useLocaleStore((s) => s.setLocale);
  if (useLocaleStore.getState().locale !== initialLocale) {
    setLocale(initialLocale);
  }
  return <>{children}</>;
}
