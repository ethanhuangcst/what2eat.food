import { describe, expect, it } from "vitest";
import { buildRankOrder, sortPicks } from "@/src/core/sort-picks";
import { type PickDto } from "@/src/places-agent/types";

function pick(id: string, overrides: Partial<PickDto> = {}): PickDto {
  return {
    id,
    provider: "GOOGLE_MAPS",
    nativeId: id,
    name: id,
    fit: "partial",
    whyKeys: [],
    sources: [{ provider: "GOOGLE_MAPS", native_id: id }],
    warnings: [],
    ...overrides,
  };
}

describe("sortPicks", () => {
  const base = [
    pick("a", { rating: 4.0, walkMinutes: 12, priceLevel: "$$" }),
    pick("b", { rating: 4.8, walkMinutes: 5, priceLevel: "$" }),
    pick("c", { rating: 3.5, walkMinutes: 20, priceLevel: "$$$" }),
  ];
  const rankOrder = buildRankOrder(base);

  it("should_restore_rank_order_when_mode_is_rank", () => {
    const sorted = sortPicks([...base].reverse(), "rank", rankOrder);
    expect(sorted.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("should_sort_by_rating_desc_with_missing_last", () => {
    const withMissing = [...base, pick("d")];
    const order = buildRankOrder(withMissing);
    const sorted = sortPicks(withMissing, "rating", order);
    expect(sorted[0]?.id).toBe("b");
    expect(sorted.at(-1)?.id).toBe("d");
  });

  it("should_sort_by_distance_asc_with_missing_last", () => {
    const sorted = sortPicks(base, "distance", rankOrder);
    expect(sorted.map((p) => p.id)).toEqual(["b", "a", "c"]);
  });

  it("should_sort_by_price_asc", () => {
    const sorted = sortPicks(base, "price", rankOrder);
    expect(sorted.map((p) => p.id)).toEqual(["b", "a", "c"]);
  });
});
