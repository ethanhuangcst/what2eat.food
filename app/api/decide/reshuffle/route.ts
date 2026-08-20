import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import { normalizeLocale } from "@/src/core/locales";
import { fetchDecideCards } from "@/src/core/decide-run";
import {
  buildDecideSearchResponse,
  normalizeSearchCachePayload,
} from "@/src/core/decide-cache-response";
import { type SearchCachePayload } from "@/src/core/short-list";

const schema = z.object({
  searchId: z.string().min(1),
  page: z.coerce.number().int().min(1).optional(),
  mode: z.enum(["page", "reshuffle"]).default("page"),
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

function criteriaFromPayload(payload: SearchCachePayload) {
  const c = payload.criteria as {
    location?: string;
    mealContext?: string;
    budget?: string;
    craving?: string;
    lat?: number;
    lng?: number;
  };
  if (!c.location) throw new Error("errors.session_expired");
  return c;
}

export async function POST(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);

  const cache = await prisma.searchCache.findFirst({
    where: { id: parsed.data.searchId, userId: gate.user.id },
  });
  if (!cache) return authError("errors.session_expired", 404);

  const normalized = normalizeSearchCachePayload(cache.payload);
  if (!normalized) return authError("errors.session_expired", 404);
  let payload = normalized;

  if (parsed.data.mode === "reshuffle") {
    const criteria = criteriaFromPayload(payload);
    const profile =
      gate.user.tasteProfile ??
      (await prisma.tasteProfile.create({ data: { userId: gate.user.id } }));

    let run;
    try {
      run = await fetchDecideCards({
        criteria: {
          location: criteria.location!,
          mealContext: criteria.mealContext,
          budget: criteria.budget,
          craving: criteria.craving,
          lat: criteria.lat,
          lng: criteria.lng,
        },
        locale: normalizeLocale(gate.user.locale),
        tastes: tastesFromProfile(profile),
      });
    } catch (err) {
      const key = err instanceof Error ? err.message : "errors.provider_failed";
      return authError(key, 502);
    }

    payload = {
      picks: run.picks,
      rankOrder: run.rankOrder,
      sort: "rank",
      cursor: 0,
      criteria: {
        ...criteria,
        lat: run.pinLat,
        lng: run.pinLng,
      },
      updatedAt: run.updatedAt,
      skipped: run.skipped,
      partialBanner: run.partialBanner,
    };

    await prisma.searchCache.update({
      where: { id: cache.id },
      data: { payload: payload as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(buildDecideSearchResponse(cache.id, payload, 1));
  }

  const page = parsed.data.page ?? 1;
  return NextResponse.json(buildDecideSearchResponse(cache.id, payload, page));
}
