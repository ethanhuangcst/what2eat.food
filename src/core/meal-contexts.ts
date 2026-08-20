import { t as catalogT, catalogs } from "../i18n/catalog";
import { LOCALES, type Locale } from "./locales";

export const MEAL_CONTEXT_KEYS = [
  "eat.meal.weekday_lunch",
  "eat.meal.weekend_dinner",
  "eat.meal.quick",
  "eat.meal.celebration",
  "eat.meal.family_dinner",
  "eat.meal.dating",
  "eat.meal.friends",
  "eat.meal.business",
  "eat.meal.solo",
  "eat.meal.brunch",
  "eat.meal.late_night",
] as const;

export type MealContextKey = (typeof MEAL_CONTEXT_KEYS)[number];

export const DEFAULT_MEAL_CONTEXT_KEY: MealContextKey = "eat.meal.weekend_dinner";

export type MealContextSelection =
  | { kind: "preset"; key: MealContextKey }
  | { kind: "custom"; text: string };

export function isMealContextKey(value: string): value is MealContextKey {
  return (MEAL_CONTEXT_KEYS as readonly string[]).includes(value);
}

export function mealContextLabel(key: string, locale: Locale | string): string {
  return catalogT(locale, key);
}

export function mealContextKeyFromLabel(label: string): MealContextKey | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  for (const key of MEAL_CONTEXT_KEYS) {
    for (const loc of LOCALES) {
      if (catalogs[loc][key] === trimmed) return key;
    }
  }
  return null;
}

export function parseMealContext(value: string | null | undefined): MealContextSelection {
  if (!value?.trim()) {
    return { kind: "preset", key: DEFAULT_MEAL_CONTEXT_KEY };
  }
  const trimmed = value.trim();
  if (isMealContextKey(trimmed)) {
    return { kind: "preset", key: trimmed };
  }
  const key = mealContextKeyFromLabel(trimmed);
  if (key) return { kind: "preset", key };
  return { kind: "custom", text: trimmed };
}

export function formatMealContextDisplay(
  selection: MealContextSelection,
  locale: Locale | string,
): string {
  if (selection.kind === "preset") return mealContextLabel(selection.key, locale);
  return selection.text;
}

export function formatMealContextStorage(selection: MealContextSelection): string {
  if (selection.kind === "preset") return selection.key;
  return selection.text.trim();
}

export function mealContextSelectionFromInput(
  text: string,
  locale: Locale | string,
): MealContextSelection {
  // Keep empty while editing — do not snap back to the default preset (users must be able to clear).
  if (!text.trim()) return { kind: "custom", text: "" };
  const trimmed = text.trim();
  for (const key of MEAL_CONTEXT_KEYS) {
    if (mealContextLabel(key, locale) === trimmed) {
      return { kind: "preset", key };
    }
  }
  const legacy = mealContextKeyFromLabel(trimmed);
  if (legacy) return { kind: "preset", key: legacy };
  return { kind: "custom", text: text };
}

export function defaultMealContextSelection(): MealContextSelection {
  return { kind: "preset", key: DEFAULT_MEAL_CONTEXT_KEY };
}
