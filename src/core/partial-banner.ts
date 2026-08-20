import { type PickDto } from "../places-agent/types";

export type SkippedVendor = { provider: string; reason_key: string };

export type PartialBanner = {
  key: string;
  vars?: Record<string, string>;
};

/** Build an honest partial-vendor banner from skipped[] and the full pick list. */
export function buildPartialBanner(
  skipped: SkippedVendor[],
  picks: PickDto[],
): PartialBanner | null {
  if (!skipped.length) return null;

  const skippedProviders = [...new Set(skipped.map((s) => s.provider))];
  const primaryProviders = new Set(picks.map((p) => p.provider));

  const mixed = skippedProviders.filter((p) => primaryProviders.has(p));
  const missing = skippedProviders.filter((p) => !primaryProviders.has(p));

  if (skippedProviders.length === 1) {
    const provider = skippedProviders[0]!;
    if (mixed.includes(provider)) {
      return { key: "eat.decide.partial_provider_mixed", vars: { provider } };
    }
    return { key: "eat.decide.partial_provider_missing", vars: { provider } };
  }

  const providers = skippedProviders.join(", ");
  if (mixed.length && missing.length) {
    return { key: "eat.decide.partial_multi_mixed", vars: { providers } };
  }
  if (mixed.length) {
    return { key: "eat.decide.partial_multi_mixed", vars: { providers: mixed.join(", ") } };
  }
  return { key: "eat.decide.partial_multi_missing", vars: { providers: missing.join(", ") } };
}
