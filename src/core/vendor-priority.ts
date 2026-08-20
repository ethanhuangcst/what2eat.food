import { type PlaceCard } from "../places-agent/types";
import { type VendorRegion } from "./region";

const MAINLAND_PRIORITY = ["AMAP", "GOOGLE_MAPS", "TRIPADVISOR"] as const;
const OVERSEAS_PRIORITY = ["GOOGLE_MAPS", "TRIPADVISOR", "AMAP"] as const;

export function providerListRank(provider: string, region: VendorRegion): number {
  const order = region === "cn_mainland" ? MAINLAND_PRIORITY : OVERSEAS_PRIORITY;
  const idx = order.indexOf(provider as (typeof order)[number]);
  return idx === -1 ? 99 : idx;
}

function providerRank(provider: string, region: VendorRegion): number {
  return providerListRank(provider, region);
}

export function prioritizePlaceCard(card: PlaceCard, region: VendorRegion): PlaceCard {
  if (!card.sources?.length) return card;
  const sources = [...card.sources].sort(
    (a, b) => providerRank(a.provider, region) - providerRank(b.provider, region),
  );
  const primary = sources[0];
  return {
    ...card,
    sources,
    provider: primary.provider,
    primary_provider: primary.provider,
  };
}

export function prioritizePlaceCards(cards: PlaceCard[], region: VendorRegion): PlaceCard[] {
  return cards.map((card) => prioritizePlaceCard(card, region));
}
