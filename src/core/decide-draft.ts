/**
 * Decide criteria drafts in sessionStorage (ADR-029).
 * Survives locale `router.refresh()`; cleared when the tab closes.
 *
 * Do **not** read drafts in `useState` initializers — sessionStorage is empty on the
 * server and filled on the client, which causes React hydration mismatches. Apply
 * drafts in a mount `useEffect` after the first paint matches SSR defaults.
 */

export type DecideDraftField = "location" | "meal" | "budget" | "craving";

const PREFIX = "w2e.decide.draft.";

/** SSR-safe first-paint defaults (must match server render; never from sessionStorage). */
export const DECIDE_DEFAULT_LOCATION = "Clerkenwell, London";
export const DECIDE_DEFAULT_BUDGET = "$$";

export function draftKey(field: DecideDraftField): string {
  return `${PREFIX}${field}`;
}

/** Fixed form seeds for `useState` — ignores sessionStorage so SSR and client match. */
export function decideFormSsrDefaults(): {
  location: string;
  budget: string;
  craving: string;
} {
  return {
    location: DECIDE_DEFAULT_LOCATION,
    budget: DECIDE_DEFAULT_BUDGET,
    craving: "",
  };
}

export function readDecideDraft(field: DecideDraftField): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const v = sessionStorage.getItem(draftKey(field));
    return v;
  } catch {
    return null;
  }
}

export function writeDecideDraft(field: DecideDraftField, value: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(draftKey(field), value);
  } catch {
    /* quota / private mode */
  }
}

export function clearDecideDraft(field: DecideDraftField): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(draftKey(field));
  } catch {
    /* ignore */
  }
}

/**
 * Resolve initial field value: URL → session draft → cache criteria → profile/default (virgin only).
 * `touched` means the user already edited this session (never overwrite with profile).
 */
export function resolveDecideField(args: {
  urlValue: string | null;
  draftValue: string | null;
  criteriaValue: string | null | undefined;
  profileOrDefault: string | null | undefined;
  touched: boolean;
}): string | null {
  if (args.urlValue != null && args.urlValue !== "") return args.urlValue;
  if (args.touched) return null; // caller keeps React state
  if (args.draftValue != null) return args.draftValue;
  if (args.criteriaValue != null && args.criteriaValue !== "") return args.criteriaValue;
  if (args.profileOrDefault != null && args.profileOrDefault !== "") return args.profileOrDefault;
  return null;
}

/** True when profile/default may seed the field. */
export function mayApplyProfileDefault(args: {
  urlValue: string | null;
  draftValue: string | null;
  touched: boolean;
}): boolean {
  if (args.touched) return false;
  if (args.urlValue != null && args.urlValue !== "") return false;
  if (args.draftValue != null) return false;
  return true;
}
