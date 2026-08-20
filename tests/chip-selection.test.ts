import { describe, expect, it } from "vitest";
import { normalizeChipIds } from "@/src/core/chip-selection";

const CONSTRAINT_OPTIONS = [
  { id: "veg", labelKey: "eat.profile.veg" },
  { id: "no_pork", labelKey: "eat.profile.no_pork" },
];

describe("chip-selection", () => {
  it("should_normalize_legacy_constraint_labels_to_ids", () => {
    expect(normalizeChipIds(["Vegetarian", "素食"], CONSTRAINT_OPTIONS)).toEqual(["veg"]);
  });

  it("should_keep_custom_chip_values", () => {
    expect(normalizeChipIds(["my custom tag"], CONSTRAINT_OPTIONS)).toEqual(["my custom tag"]);
  });
});
