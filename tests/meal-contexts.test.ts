import { describe, expect, it } from "vitest";
import {
  DEFAULT_MEAL_CONTEXT_KEY,
  formatMealContextDisplay,
  formatMealContextStorage,
  mealContextKeyFromLabel,
  mealContextSelectionFromInput,
  parseMealContext,
} from "@/src/core/meal-contexts";
import { normalizeChipIds } from "@/src/core/chip-selection";

describe("meal-contexts", () => {
  it("should_resolve_default_key_to_localized_labels", () => {
    expect(formatMealContextDisplay({ kind: "preset", key: DEFAULT_MEAL_CONTEXT_KEY }, "EN")).toBe(
      "Weekend dinner",
    );
    expect(formatMealContextDisplay({ kind: "preset", key: DEFAULT_MEAL_CONTEXT_KEY }, "CN")).toBe(
      "周末晚餐",
    );
    expect(formatMealContextDisplay({ kind: "preset", key: DEFAULT_MEAL_CONTEXT_KEY }, "HK")).toBe(
      "週末晚餐",
    );
  });

  it("should_map_legacy_english_label_to_key", () => {
    expect(mealContextKeyFromLabel("Weekend dinner")).toBe("eat.meal.weekend_dinner");
  });

  it("should_map_legacy_chinese_label_to_key", () => {
    expect(mealContextKeyFromLabel("周末晚餐")).toBe("eat.meal.weekend_dinner");
  });

  it("should_round_trip_custom_text", () => {
    const custom = parseMealContext("加班宵夜");
    expect(custom).toEqual({ kind: "custom", text: "加班宵夜" });
    expect(formatMealContextStorage(custom)).toBe("加班宵夜");
    expect(formatMealContextDisplay(custom, "CN")).toBe("加班宵夜");
  });

  it("should_parse_storage_key_form", () => {
    const parsed = parseMealContext("eat.meal.weekend_dinner");
    expect(parsed).toEqual({ kind: "preset", key: "eat.meal.weekend_dinner" });
    expect(formatMealContextStorage(parsed)).toBe("eat.meal.weekend_dinner");
  });

  it("should_match_typed_label_in_current_locale", () => {
    const fromCn = mealContextSelectionFromInput("周末晚餐", "CN");
    expect(fromCn).toEqual({ kind: "preset", key: "eat.meal.weekend_dinner" });
    const fromEn = mealContextSelectionFromInput("Weekend dinner", "EN");
    expect(fromEn).toEqual({ kind: "preset", key: "eat.meal.weekend_dinner" });
  });

  it("should_keep_field_empty_when_user_clears_input", () => {
    const empty = mealContextSelectionFromInput("", "CN");
    expect(empty).toEqual({ kind: "custom", text: "" });
    expect(formatMealContextDisplay(empty, "CN")).toBe("");
    expect(formatMealContextStorage(empty)).toBe("");
  });

  it("should_allow_partial_edit_without_snapping_to_default", () => {
    const partial = mealContextSelectionFromInput("周末晚", "CN");
    expect(partial).toEqual({ kind: "custom", text: "周末晚" });
    expect(formatMealContextDisplay(partial, "CN")).toBe("周末晚");
  });

  it("should_update_display_when_locale_changes_for_same_key", () => {
    const selection = parseMealContext("eat.meal.weekend_dinner");
    expect(formatMealContextDisplay(selection, "EN")).toBe("Weekend dinner");
    expect(formatMealContextDisplay(selection, "CN")).toBe("周末晚餐");
  });
});

describe("chip-selection meal context normalize", () => {
  const options = [{ id: "eat.meal.weekend_dinner", labelKey: "eat.meal.weekend_dinner" }];

  it("should_normalize_legacy_meal_context_labels_to_keys", () => {
    expect(normalizeChipIds(["Weekend dinner", "周末晚餐"], options)).toEqual([
      "eat.meal.weekend_dinner",
    ]);
  });
});
