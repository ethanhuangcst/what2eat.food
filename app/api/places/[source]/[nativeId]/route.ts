import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import { normalizeLocale } from "@/src/core/locales";
import { getPlaceDetails } from "@/src/places-agent/client";
import { rankPicks } from "@/src/core/preference-match";
import { type SearchCachePayload } from "@/src/core/short-list";

type RouteParams = { params: Promise<{ source: string; nativeId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const { source, nativeId } = await params;
  const locale = normalizeLocale(gate.user.locale);
  const details = await getPlaceDetails({
    provider: source,
    native_id: decodeURIComponent(nativeId),
    locale,
  });
  if (!details.ok || !details.data) {
    return authError(details.outcome?.key ?? "errors.provider_failed", 502);
  }

  const profile =
    gate.user.tasteProfile ??
    (await prisma.tasteProfile.create({ data: { userId: gate.user.id } }));
  const cache = await prisma.searchCache.findFirst({
    where: { userId: gate.user.id },
    orderBy: { createdAt: "desc" },
  });
  const criteria = (cache?.payload as SearchCachePayload | undefined)?.criteria as
    | { lat?: number; lng?: number; budget?: string; mealContext?: string }
    | undefined;

  const pick = rankPicks(
    [details.data],
    {
      likes: Array.isArray(profile.likes) ? (profile.likes as string[]) : [],
      dislikes: Array.isArray(profile.dislikes) ? (profile.dislikes as string[]) : [],
      constraints: Array.isArray(profile.constraints) ? (profile.constraints as string[]) : [],
    },
    {
      pinLat: criteria?.lat,
      pinLng: criteria?.lng,
      budget: criteria?.budget,
      mealContext: criteria?.mealContext,
    },
  )[0];

  const saved = await prisma.savedPlace.findUnique({
    where: {
      userId_provider_nativeId: {
        userId: gate.user.id,
        provider: source,
        nativeId: decodeURIComponent(nativeId),
      },
    },
  });

  return NextResponse.json({
    place: details.data,
    pick,
    saved: Boolean(saved),
  });
}
