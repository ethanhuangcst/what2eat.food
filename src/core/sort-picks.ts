import { type PickDto } from "../places-agent/types";

export const DECIDE_SORT_MODES = ["rank", "rating", "distance", "price"] as const;
export type DecideSortMode = (typeof DECIDE_SORT_MODES)[number];

export function isDecideSortMode(value: string): value is DecideSortMode {
  return (DECIDE_SORT_MODES as readonly string[]).includes(value);
}

const PRICE_ORDER: Record<string, number> = {
  FREE: 0,
  $: 1,
  $$: 2,
  $$$: 3,
  $$$$: 4,
};

function rankIndex(rankOrder: string[], id: string): number {
  const idx = rankOrder.indexOf(id);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

function compareRankOrder(rankOrder: string[], a: PickDto, b: PickDto): number {
  return rankIndex(rankOrder, a.id) - rankIndex(rankOrder, b.id);
}

function compareRating(a: PickDto, b: PickDto, rankOrder: string[]): number {
  const aRating = a.rating;
  const bRating = b.rating;
  if (aRating == null && bRating == null) return compareRankOrder(rankOrder, a, b);
  if (aRating == null) return 1;
  if (bRating == null) return -1;
  if (bRating !== aRating) return bRating - aRating;
  return compareRankOrder(rankOrder, a, b);
}

function compareDistance(a: PickDto, b: PickDto, rankOrder: string[]): number {
  const aWalk = a.walkMinutes;
  const bWalk = b.walkMinutes;
  if (aWalk == null && bWalk == null) return compareRankOrder(rankOrder, a, b);
  if (aWalk == null) return 1;
  if (bWalk == null) return -1;
  if (aWalk !== bWalk) return aWalk - bWalk;
  return compareRankOrder(rankOrder, a, b);
}

function comparePrice(a: PickDto, b: PickDto, rankOrder: string[]): number {
  const aPrice = a.priceLevel != null ? PRICE_ORDER[a.priceLevel] : undefined;
  const bPrice = b.priceLevel != null ? PRICE_ORDER[b.priceLevel] : undefined;
  if (aPrice == null && bPrice == null) return compareRankOrder(rankOrder, a, b);
  if (aPrice == null) return 1;
  if (bPrice == null) return -1;
  if (aPrice !== bPrice) return aPrice - bPrice;
  return compareRankOrder(rankOrder, a, b);
}

export function sortPicks(
  picks: PickDto[],
  mode: DecideSortMode,
  rankOrder: string[],
): PickDto[] {
  const copy = [...picks];
  switch (mode) {
    case "rating":
      copy.sort((a, b) => compareRating(a, b, rankOrder));
      break;
    case "distance":
      copy.sort((a, b) => compareDistance(a, b, rankOrder));
      break;
    case "price":
      copy.sort((a, b) => comparePrice(a, b, rankOrder));
      break;
    case "rank":
    default:
      copy.sort((a, b) => compareRankOrder(rankOrder, a, b));
      break;
  }
  return copy;
}

export function buildRankOrder(picks: PickDto[]): string[] {
  return picks.map((p) => p.id);
}
