import { describe, expect, it } from "vitest";
import { buildPartialBanner } from "@/src/core/partial-banner";
import { type PickDto } from "@/src/places-agent/types";

function pick(provider: string): PickDto {
  return {
    id: `${provider}:1`,
    provider,
    nativeId: "1",
    name: "Test",
    fit: "partial",
    whyKeys: [],
    sources: [{ provider, native_id: "1" }],
    warnings: [],
  };
}

describe("partial-banner", () => {
  it("should_return_null_when_no_skipped", () => {
    expect(buildPartialBanner([], [pick("AMAP")])).toBeNull();
  });

  it("should_use_mixed_key_when_skipped_provider_still_in_results", () => {
    const banner = buildPartialBanner(
      [{ provider: "GOOGLE_MAPS", reason_key: "errors.provider_failed" }],
      [pick("GOOGLE_MAPS"), pick("AMAP")],
    );
    expect(banner?.key).toBe("eat.decide.partial_provider_mixed");
    expect(banner?.vars?.provider).toBe("GOOGLE_MAPS");
  });

  it("should_use_missing_key_when_skipped_provider_absent_from_results", () => {
    const banner = buildPartialBanner(
      [{ provider: "GOOGLE_MAPS", reason_key: "errors.provider_failed" }],
      [pick("AMAP")],
    );
    expect(banner?.key).toBe("eat.decide.partial_provider_missing");
    expect(banner?.vars?.provider).toBe("GOOGLE_MAPS");
  });

  it("should_not_use_amap_only_wording_when_google_cards_present", () => {
    const banner = buildPartialBanner(
      [{ provider: "GOOGLE_MAPS", reason_key: "errors.provider_failed" }],
      [pick("GOOGLE_MAPS")],
    );
    expect(banner?.key).not.toBe("eat.decide.partial_banner");
  });
});
