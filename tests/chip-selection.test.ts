import { describe, expect, it } from "vitest";
import { normalizeChipIds } from "@/src/core/chip-selection";

const CONSTRAINT_OPTIONS = [
  { id: "veg", labelKey: "eat.profile.veg" },
  { id: "no_pork", labelKey: "eat.profile.no_pork" },
];

const LIKE_OPTIONS = [
  { id: "eat.cuisine.italian", labelKey: "eat.cuisine.italian" },
  { id: "eat.cuisine.japanese", labelKey: "eat.cuisine.japanese" },
];

describe("chip-selection", () => {
  it("should_normalize_legacy_constraint_labels_to_ids", () => {
    expect(normalizeChipIds(["Vegetarian", "素食"], CONSTRAINT_OPTIONS)).toEqual(["veg"]);
  });

  it("should_keep_custom_chip_values", () => {
    expect(normalizeChipIds(["my custom tag"], CONSTRAINT_OPTIONS)).toEqual(["my custom tag"]);
  });

  it("should_keep_cuisine_keys_and_custom_when_round_trip", () => {
    expect(
      normalizeChipIds(["eat.cuisine.italian", "ramen", "Italian"], LIKE_OPTIONS),
    ).toEqual(["eat.cuisine.italian", "ramen"]);
  });
});
