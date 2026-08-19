import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import { normalizeLocale } from "@/src/core/locales";
import { geocode, providersForPin, searchRestaurants } from "@/src/places-agent/client";
import { rankPicks } from "@/src/core/preference-match";
import { paginatePicks, type SearchCachePayload } from "@/src/core/short-list";

const searchSchema = z.object({
  location: z.string().min(1),
  mealContext: z.string().optional(),
  budget: z.string().optional(),
  craving: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

function tastesFromProfile(profile: {
  likes: unknown;
  dislikes: unknown;
  constraints: unknown;
}) {
  return {
    likes: Array.isArray(profile.likes) ? (profile.likes as string[]) : [],
    dislikes: Array.isArray(profile.dislikes) ? (profile.dislikes as string[]) : [],
    constraints: Array.isArray(profile.constraints) ? (profile.constraints as string[]) : [],
  };
}

export async function POST(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const parsed = searchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);
  const locale = normalizeLocale(gate.user.locale);
  const { location, mealContext, budget, craving, page } = parsed.data;

  const geo = await geocode({
    address: location,
    locale,
    providers: providersForPin(51.5, -0.1),
  });

  let pinLat: number | undefined = geo.data?.lat;
  let pinLng: number | undefined = geo.data?.lng;
  const providers =
    pinLat != null && pinLng != null
      ? providersForPin(pinLat, pinLng)
      : providersForPin(51.5, -0.1);

  const search = await searchRestaurants({
    near: pinLat != null && pinLng != null ? { lat: pinLat, lng: pinLng } : undefined,
    address: pinLat == null ? location : undefined,
    query: craving || "restaurant",
    providers,
    locale,
  });

  if (!search.ok) {
    return authError(search.outcome?.key ?? "errors.provider_failed", 502);
  }

  const cards = search.data ?? [];
  if (pinLat == null && cards[0]?.location) {
    pinLat = cards[0].location.lat;
    pinLng = cards[0].location.lng;
  }
  const profile =
    gate.user.tasteProfile ??
    (await prisma.tasteProfile.create({ data: { userId: gate.user.id } }));
  const picks = rankPicks(cards, tastesFromProfile(profile), {
    budget,
    mealContext,
    pinLat,
    pinLng,
  });

  const updatedAt = new Date().toISOString();
  const payload: SearchCachePayload = {
    picks,
    cursor: 0,
    criteria: { location, mealContext, budget, craving, lat: pinLat, lng: pinLng },
    updatedAt,
  };

  await prisma.searchCache.deleteMany({ where: { userId: gate.user.id } });
  const cache = await prisma.searchCache.create({
    data: {
      userId: gate.user.id,
      payload: payload as unknown as Prisma.InputJsonValue,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const { slice, from, to, total } = paginatePicks(picks, page);
  return NextResponse.json({
    searchId: cache.id,
    picks: slice,
    total,
    from,
    to,
    updatedAt,
    skipped: [...(geo.skipped ?? []), ...(search.skipped ?? [])],
    empty: total === 0,
  });
}
