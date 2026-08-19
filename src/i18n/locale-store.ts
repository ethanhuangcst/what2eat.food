"use client";

import { create } from "zustand";
import { type Locale, isLocale } from "../core/locales";

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

function readInitialLocale(): Locale {
  if (typeof document === "undefined") return "EN";
  const match = document.cookie.match(/what2eat_locale=([^;]+)/);
  const value = match?.[1];
  return value && isLocale(value) ? value : "EN";
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readInitialLocale(),
  setLocale: (locale) => set({ locale }),
}));

export async function persistLocale(locale: Locale): Promise<void> {
  document.cookie = `what2eat_locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  useLocaleStore.getState().setLocale(locale);
  await fetch("/api/locale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ locale }),
  });
}
