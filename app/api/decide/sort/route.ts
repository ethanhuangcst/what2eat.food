import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import {
  buildDecideSearchResponse,
  normalizeSearchCachePayload,
} from "@/src/core/decide-cache-response";
import { isDecideSortMode } from "@/src/core/sort-picks";
import { type SearchCachePayload } from "@/src/core/short-list";

const schema = z.object({
  searchId: z.string().min(1),
  sort: z.string(),
  page: z.coerce.number().int().min(1).default(1),
});

export async function POST(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || !isDecideSortMode(parsed.data.sort)) {
    return authError("errors.validation", 400);
  }

  const cache = await prisma.searchCache.findFirst({
    where: { id: parsed.data.searchId, userId: gate.user.id },
  });
  if (!cache) return authError("errors.session_expired", 404);

  const payload = normalizeSearchCachePayload(cache.payload);
  if (!payload) {
    return authError("errors.session_expired", 404);
  }

  const nextPayload: SearchCachePayload = {
    ...payload,
    sort: parsed.data.sort,
  };

  await prisma.searchCache.update({
    where: { id: cache.id },
    data: { payload: nextPayload as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json(
    buildDecideSearchResponse(cache.id, nextPayload, parsed.data.page),
  );
}
