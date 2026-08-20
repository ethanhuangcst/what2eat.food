import { type PickDto } from "../places-agent/types";
import { buildPartialBanner, type PartialBanner } from "./partial-banner";
import { rankPicks, type DecideContext, type TasteInput } from "./preference-match";
import { prioritizePlaceCards } from "./vendor-priority";
import { vendorRegionForPin } from "./region";
import { buildRankOrder, sortPicks, type DecideSortMode } from "./sort-picks";
import { paginatePicks } from "./short-list";
import { geocode, searchRestaurants } from "../places-agent/client";

export type DecideCriteria = {
  location: string;
  mealContext?: string;
  budget?: string;
  craving?: string;
  lat?: number;
  lng?: number;
};

export type DecideRunResult = {
  picks: PickDto[];
  rankOrder: string[];
  sort: DecideSortMode;
  pinLat?: number;
  pinLng?: number;
  skipped: { provider: string; reason_key: string }[];
  partialBanner: PartialBanner | null;
  updatedAt: string;
  empty: boolean;
};

export async function fetchDecideCards(input: {
  criteria: DecideCriteria;
  locale: string;
  tastes: TasteInput;
}): Promise<DecideRunResult> {
  const { criteria, locale, tastes } = input;
  const { location, mealContext, budget, craving } = criteria;

  let pinLat = criteria.lat;
  let pinLng = criteria.lng;

  // Let places-agent auto-select providers based on address + locale.
  // Do not pass providers[] — the agent's resolver picks AMAP/Google/TA.
  const geo = await geocode({
    address: location,
    locale,
  });

  if (pinLat == null || pinLng == null) {
    pinLat = geo.data?.lat;
    pinLng = geo.data?.lng;
  }

  const search = await searchRestaurants({
    near: pinLat != null && pinLng != null ? { lat: pinLat, lng: pinLng } : undefined,
    address: location,
    query: craving || "restaurant",
    locale,
  });

  if (!search.ok) {
    throw new Error(search.outcome?.key ?? "errors.provider_failed");
  }

  const rawCards = search.data ?? [];
  if (pinLat == null && rawCards[0]?.location) {
    pinLat = rawCards[0].location.lat;
    pinLng = rawCards[0].location.lng;
  }

  const region =
    pinLat != null && pinLng != null ? vendorRegionForPin(pinLat, pinLng) : "overseas";
  const cards = prioritizePlaceCards(rawCards, region);

  const picks = rankPicks(
    cards,
    tastes,
    {
      budget,
      mealContext,
      pinLat,
      pinLng,
    },
    region,
  );

  const updatedAt = new Date().toISOString();
  const skipped = [...(geo.skipped ?? []), ...(search.skipped ?? [])];
  const partialBanner = buildPartialBanner(skipped, picks);

  return {
    picks,
    rankOrder: buildRankOrder(picks),
    sort: "rank",
    pinLat,
    pinLng,
    skipped,
    partialBanner,
    updatedAt,
    empty: picks.length === 0,
  };
}

export function sliceDecidePicks(input: {
  picks: PickDto[];
  rankOrder: string[];
  sort: DecideSortMode;
  page: number;
}) {
  const sorted = sortPicks(input.picks, input.sort, input.rankOrder);
  const { slice, from, to, total } = paginatePicks(sorted, input.page);
  return { picks: slice, from, to, total };
}
