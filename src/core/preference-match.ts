import { type PlaceCard, type FitLevel, type PickDto } from "../places-agent/types";

export type TasteInput = {
  likes: string[];
  dislikes: string[];
  constraints: string[];
};

export type DecideContext = {
  budget?: string;
  mealContext?: string;
  pinLat?: number;
  pinLng?: number;
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function walkMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 4.8) * 60));
}

function cardKey(card: PlaceCard): string {
  const primary = card.sources[0];
  return `${primary?.provider ?? card.provider}:${primary?.native_id ?? card.name}`;
}

export function matchPick(
  card: PlaceCard,
  tastes: TasteInput,
  ctx: DecideContext,
): PickDto {
  const primary = card.sources[0];
  const provider = primary?.provider ?? card.provider;
  const nativeId = primary?.native_id ?? "";
  const whyKeys: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  const category = (card.category ?? "").toLowerCase();
  const name = card.name.toLowerCase();

  for (const like of tastes.likes) {
    const l = like.toLowerCase();
    if (l && (category.includes(l) || name.includes(l))) {
      score += 2;
      whyKeys.push("eat.why.reason_cuisine");
    }
  }

  for (const dislike of tastes.dislikes) {
    const d = dislike.toLowerCase();
    if (d && (category.includes(d) || name.includes(d))) {
      score -= 3;
      whyKeys.push("eat.why.reason_dislike");
    }
  }

  for (const constraint of tastes.constraints) {
    const c = constraint.toLowerCase();
    if (c && (category.includes(c) || name.includes(c))) {
      score -= 2;
      whyKeys.push("eat.why.reason_conflict");
    }
  }

  let walkMin: number | undefined;
  if (ctx.pinLat != null && ctx.pinLng != null) {
    const km = haversineKm(
      { lat: ctx.pinLat, lng: ctx.pinLng },
      { lat: card.location.lat, lng: card.location.lng },
    );
    walkMin = walkMinutes(km);
    if (km <= 1.2) {
      score += 1;
      whyKeys.push("eat.why.reason_distance");
    } else if (km > 3) {
      warnings.push("long_travel");
    }
  }

  if (ctx.budget) {
    score += 1;
    whyKeys.push("eat.why.reason_budget");
  }

  let fit: FitLevel = "partial";
  if (score >= 3 && !whyKeys.includes("eat.why.reason_dislike")) fit = "strong";
  else if (score <= -1 || whyKeys.includes("eat.why.reason_conflict")) fit = "weak";

  return {
    id: cardKey(card),
    provider,
    nativeId,
    name: card.name,
    address: card.address,
    rating: card.rating ?? card.tripadvisor?.rating,
    photoUrl: card.photos?.[0],
    category: card.category,
    fit,
    walkMinutes: walkMin,
    whyKeys: [...new Set(whyKeys)],
    sources: card.sources,
    warnings,
  };
}

export function rankPicks(cards: PlaceCard[], tastes: TasteInput, ctx: DecideContext): PickDto[] {
  const order = { strong: 0, partial: 1, weak: 2 } as const;
  return cards
    .map((c) => matchPick(c, tastes, ctx))
    .sort((a, b) => order[a.fit] - order[b.fit] || (b.rating ?? 0) - (a.rating ?? 0));
}
