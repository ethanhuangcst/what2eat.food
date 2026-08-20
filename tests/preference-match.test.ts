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

  it("should_prefer_amap_primary_on_cn_mainland_when_fit_and_rating_equal", () => {
    const amapCard: PlaceCard = {
      provider: "AMAP",
      name: "Amap Place",
      category: "restaurant",
      location: { lat: 39.9, lng: 116.4, crs: "WGS84" },
      sources: [{ provider: "AMAP", native_id: "a1" }],
      rating: 4.5,
    };
    const googleCard: PlaceCard = {
      provider: "GOOGLE_MAPS",
      name: "Google Place",
      category: "restaurant",
      location: { lat: 39.9, lng: 116.4, crs: "WGS84" },
      sources: [{ provider: "GOOGLE_MAPS", native_id: "g1" }],
      rating: 4.5,
    };
    const picks = rankPicks(
      [googleCard, amapCard],
      { likes: [], dislikes: [], constraints: [] },
      { pinLat: 39.9, pinLng: 116.4 },
      "cn_mainland",
    );
    expect(picks[0].provider).toBe("AMAP");
  });

  it("should_prefer_amap_on_cn_mainland_before_higher_rated_google", () => {
    const amapCard: PlaceCard = {
      provider: "AMAP",
      name: "Amap Place",
      category: "restaurant",
      location: { lat: 39.9, lng: 116.4, crs: "WGS84" },
      sources: [{ provider: "AMAP", native_id: "a1" }],
      rating: 4.2,
    };
    const googleCard: PlaceCard = {
      provider: "GOOGLE_MAPS",
      name: "Google Place",
      category: "restaurant",
      location: { lat: 39.9, lng: 116.4, crs: "WGS84" },
      sources: [{ provider: "GOOGLE_MAPS", native_id: "g1" }],
      rating: 4.8,
    };
    const picks = rankPicks(
      [googleCard, amapCard],
      { likes: [], dislikes: [], constraints: [] },
      { pinLat: 39.9, pinLng: 116.4 },
      "cn_mainland",
    );
    expect(picks[0].provider).toBe("AMAP");
    expect(picks[1].provider).toBe("GOOGLE_MAPS");
  });
});
