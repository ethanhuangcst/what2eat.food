import { sliceDecidePicks } from "./decide-run";
import { type PartialBanner } from "./partial-banner";
import { type PickDto } from "../places-agent/types";
import { type DecideSortMode } from "./sort-picks";
import { type SearchCachePayload } from "./short-list";

export type SearchCacheCriteria = {
  location?: string;
  mealContext?: string;
  budget?: string;
  craving?: string;
  lat?: number;
  lng?: number;
};

export type DecideSearchResponseJson = {
  searchId: string;
  picks: PickDto[];
  total: number;
  from: number;
  to: number;
  updatedAt: string;
  skipped: { provider: string; reason_key: string }[];
  partialBanner: PartialBanner | null;
  empty: boolean;
  sort: DecideSortMode;
};

export type DecideCurrentResponseJson = DecideSearchResponseJson & {
  criteria: SearchCacheCriteria;
};

export function normalizeSearchCachePayload(raw: unknown): SearchCachePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as SearchCachePayload;
  if (!Array.isArray(payload.picks)) return null;
  if (!payload.rankOrder?.length) {
    return {
      ...payload,
      rankOrder: payload.picks.map((p) => p.id),
      sort: payload.sort ?? "rank",
    };
  }
  return {
    ...payload,
    sort: payload.sort ?? "rank",
  };
}

export function buildDecideSearchResponse(
  cacheId: string,
  payload: SearchCachePayload,
  page: number,
): DecideSearchResponseJson {
  const { picks, from, to, total } = sliceDecidePicks({
    picks: payload.picks,
    rankOrder: payload.rankOrder,
    sort: payload.sort ?? "rank",
    page,
  });

  return {
    searchId: cacheId,
    picks,
    total,
    from,
    to,
    updatedAt: payload.updatedAt,
    skipped: payload.skipped ?? [],
    partialBanner: payload.partialBanner ?? null,
    empty: total === 0,
    sort: payload.sort ?? "rank",
  };
}

export function criteriaFromPayload(payload: SearchCachePayload): SearchCacheCriteria {
  const c = payload.criteria as SearchCacheCriteria | undefined;
  return {
    location: typeof c?.location === "string" ? c.location : undefined,
    mealContext: typeof c?.mealContext === "string" ? c.mealContext : undefined,
    budget: typeof c?.budget === "string" ? c.budget : undefined,
    craving: typeof c?.craving === "string" ? c.craving : undefined,
    lat: typeof c?.lat === "number" ? c.lat : undefined,
    lng: typeof c?.lng === "number" ? c.lng : undefined,
  };
}

export function buildDecideCurrentResponse(
  cacheId: string,
  payload: SearchCachePayload,
  page: number,
): DecideCurrentResponseJson {
  return {
    ...buildDecideSearchResponse(cacheId, payload, page),
    criteria: criteriaFromPayload(payload),
  };
}
