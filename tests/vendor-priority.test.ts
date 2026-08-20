import { describe, expect, it } from "vitest";
import { prioritizePlaceCard } from "@/src/core/vendor-priority";
import { type PlaceCard } from "@/src/places-agent/types";

const multiSource: PlaceCard = {
  provider: "GOOGLE_MAPS",
  name: "Test Place",
  location: { lat: 31.2, lng: 121.4, crs: "WGS84" },
  sources: [
    { provider: "GOOGLE_MAPS", native_id: "g1" },
    { provider: "AMAP", native_id: "a1" },
    { provider: "TRIPADVISOR", native_id: "t1" },
  ],
};

describe("vendor-priority", () => {
  it("should_prefer_amap_on_cn_mainland", () => {
    const card = prioritizePlaceCard(multiSource, "cn_mainland");
    expect(card.provider).toBe("AMAP");
    expect(card.sources[0]?.provider).toBe("AMAP");
  });

  it("should_prefer_google_maps_overseas", () => {
    const card = prioritizePlaceCard(multiSource, "overseas");
    expect(card.provider).toBe("GOOGLE_MAPS");
    expect(card.sources[0]?.provider).toBe("GOOGLE_MAPS");
  });
});
