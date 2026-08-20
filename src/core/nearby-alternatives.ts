import { type PickDto } from "@/src/places-agent/types";

export const NEARBY_ALTS_LIMIT = 3;

export function nearbyAlternatives(
  picks: PickDto[],
  current: { provider: string; nativeId: string },
  limit = NEARBY_ALTS_LIMIT,
): PickDto[] {
  return picks
    .filter((p) => !(p.provider === current.provider && p.nativeId === current.nativeId))
    .slice(0, limit);
}
