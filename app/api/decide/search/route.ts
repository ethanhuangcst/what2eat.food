import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import { normalizeLocale } from "@/src/core/locales";
import { fetchDecideCards, sliceDecidePicks } from "@/src/core/decide-run";
import { type SearchCachePayload } from "@/src/core/short-list";

const searchSchema = z.object({
  location: z.string().min(1),
  mealContext: z.string().optional(),
  budget: z.string().optional(),
  craving: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
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
  const { location, mealContext, budget, craving, page, lat, lng } = parsed.data;

  const profile =
    gate.user.tasteProfile ??
    (await prisma.tasteProfile.create({ data: { userId: gate.user.id } }));

  let run;
  try {
    run = await fetchDecideCards({
      criteria: { location, mealContext, budget, craving, lat, lng },
      locale,
      tastes: tastesFromProfile(profile),
    });
  } catch (err) {
    const key = err instanceof Error ? err.message : "errors.provider_failed";
    return authError(key, 502);
  }

  const payload: SearchCachePayload = {
    picks: run.picks,
    rankOrder: run.rankOrder,
    sort: run.sort,
    cursor: 0,
    criteria: {
      location,
      mealContext,
      budget,
      craving,
      lat: run.pinLat,
      lng: run.pinLng,
    },
    updatedAt: run.updatedAt,
    skipped: run.skipped,
    partialBanner: run.partialBanner,
  };

  await prisma.searchCache.deleteMany({ where: { userId: gate.user.id } });
  const cache = await prisma.searchCache.create({
    data: {
      userId: gate.user.id,
      payload: payload as unknown as Prisma.InputJsonValue,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const { picks, from, to, total } = sliceDecidePicks({
    picks: payload.picks,
    rankOrder: payload.rankOrder,
    sort: payload.sort,
    page,
  });

  return NextResponse.json({
    searchId: cache.id,
    picks,
    total,
    from,
    to,
    updatedAt: run.updatedAt,
    skipped: run.skipped,
    partialBanner: run.partialBanner,
    empty: run.empty,
    sort: payload.sort,
  });
}
