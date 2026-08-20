import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import {
  buildDecideCurrentResponse,
  normalizeSearchCachePayload,
} from "@/src/core/decide-cache-response";

export async function GET(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;

  const pageParam = request.nextUrl.searchParams.get("page");
  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10) || 1) : 1;

  const cache = await prisma.searchCache.findFirst({
    where: {
      userId: gate.user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!cache) {
    return authError("errors.no_search_cache", 404);
  }

  const payload = normalizeSearchCachePayload(cache.payload);
  if (!payload) {
    return authError("errors.no_search_cache", 404);
  }

  return NextResponse.json(buildDecideCurrentResponse(cache.id, payload, page));
}
