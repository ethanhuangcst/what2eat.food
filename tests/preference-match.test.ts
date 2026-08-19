import { describe, expect, it } from "vitest";
import { rankPicks } from "@/src/core/preference-match";
import { type PlaceCard } from "@/src/places-agent/types";

const card: PlaceCard = {
  provider: "GOOGLE_MAPS",
  name: "Ramen House",
  category: "ramen restaurant",
  location: { lat: 51.52, lng: -0.1, crs: "WGS84" },
  sources: [{ provider: "GOOGLE_MAPS", native_id: "live_123" }],
  rating: 4.2,
};

describe("preference-match", () => {
  it("should_mark_strong_fit_when_cuisine_matches", () => {
    const picks = rankPicks([card], { likes: ["ramen"], dislikes: [], constraints: [] }, {
      pinLat: 51.521,
      pinLng: -0.101,
      budget: "$$",
    });
    expect(picks[0].fit).toBe("strong");
    expect(picks[0].whyKeys).toContain("eat.why.reason_cuisine");
  });

  it("should_mark_weak_fit_on_dislike", () => {
    const picks = rankPicks([card], { likes: [], dislikes: ["ramen"], constraints: [] }, {});
    expect(picks[0].fit).toBe("weak");
  });
});
