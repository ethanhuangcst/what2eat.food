import { describe, expect, it } from "vitest";
import { buildListSystemContext, buildPlaceSystemContext } from "@/src/chat/build-system-context";

describe("build-system-context", () => {
  it("should_include_list_criteria_and_picks", () => {
    const text = buildListSystemContext({
      searchId: "s1",
      location: "Clerkenwell",
      mealContext: "Weekend dinner",
      budget: "$$",
      picks: [{ name: "St. JOHN", nativeId: "a", provider: "GOOGLE_MAPS" }],
    });
    expect(text).toContain("Clerkenwell");
    expect(text).toContain("St. JOHN");
    expect(text).toContain("suggestion");
    expect(text).toContain("pick_ref");
    expect(text).toContain("JSON");
    expect(text).toContain('"type":"paragraph"');
  });

  it("should_include_place_facts", () => {
    const text = buildPlaceSystemContext({
      provider: "GOOGLE_MAPS",
      nativeId: "ChIJ-a",
      name: "St. JOHN",
      address: "26 St John Street",
      category: "restaurant",
    });
    expect(text).toContain("St. JOHN");
    expect(text).toContain("26 St John Street");
    expect(text).toContain("GOOGLE_MAPS:ChIJ-a");
  });

  it("should_require_card_first_pick_ref_guidance", () => {
    const text = buildListSystemContext({});
    expect(text).toContain("Card-first");
    expect(text).toContain("MUST be a pick_ref");
    expect(text).toMatch(/1–2 short|1-2 short/);
  });
});
