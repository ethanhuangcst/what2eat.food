import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import { paginatePicks, reshufflePicks, type SearchCachePayload } from "@/src/core/short-list";

const schema = z.object({
  searchId: z.string().min(1),
  page: z.coerce.number().int().min(1).optional(),
  mode: z.enum(["page", "reshuffle"]).default("page"),
});

export async function POST(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);

  const cache = await prisma.searchCache.findFirst({
    where: { id: parsed.data.searchId, userId: gate.user.id },
  });
  if (!cache) return authError("errors.session_expired", 404);
  const payload = cache.payload as SearchCachePayload;

  if (parsed.data.mode === "reshuffle") {
    const { slice, nextCursor } = reshufflePicks(payload.picks, payload.cursor);
    const nextPayload = { ...payload, cursor: nextCursor };
    await prisma.searchCache.update({
      where: { id: cache.id },
      data: { payload: nextPayload as unknown as Prisma.InputJsonValue },
    });
    return NextResponse.json({
      searchId: cache.id,
      picks: slice,
      total: payload.picks.length,
      from: payload.picks.length ? 1 : 0,
      to: slice.length,
      updatedAt: payload.updatedAt,
      skipped: [],
      empty: payload.picks.length === 0,
    });
  }

  const page = parsed.data.page ?? 1;
  const { slice, from, to, total } = paginatePicks(payload.picks, page);
  return NextResponse.json({
    searchId: cache.id,
    picks: slice,
    total,
    from,
    to,
    updatedAt: payload.updatedAt,
    skipped: [],
    empty: total === 0,
  });
}
