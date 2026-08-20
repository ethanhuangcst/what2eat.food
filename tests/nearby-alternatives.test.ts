import { describe, expect, it } from "vitest";
import { nearbyAlternatives } from "@/src/core/nearby-alternatives";
import { type PickDto } from "@/src/places-agent/types";

function pick(id: string, provider: string, nativeId: string): PickDto {
  return {
    id,
    provider,
    nativeId,
    name: id,
    fit: "partial",
    whyKeys: [],
    sources: [{ provider, native_id: nativeId }],
    warnings: [],
  };
}

describe("nearbyAlternatives", () => {
  it("should_exclude_current_pick_and_limit_results", () => {
    const picks = [
      pick("a", "GOOGLE_MAPS", "id-a"),
      pick("b", "GOOGLE_MAPS", "id-b"),
      pick("c", "GOOGLE_MAPS", "id-c"),
      pick("d", "GOOGLE_MAPS", "id-d"),
    ];
    const alts = nearbyAlternatives(picks, { provider: "GOOGLE_MAPS", nativeId: "id-a" }, 2);
    expect(alts.map((p) => p.nativeId)).toEqual(["id-b", "id-c"]);
  });
});
