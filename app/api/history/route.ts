import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";
import { csrfOk } from "@/src/auth/csrf";

export async function GET(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;

  const rows = await prisma.decisionHistory.findMany({
    where: { userId: gate.user.id },
    orderBy: { decidedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    decisions: rows.map((r) => ({
      id: r.id,
      placeSnapshot: r.placeSnapshot,
      area: r.area,
      mealContext: r.mealContext,
      outcome: r.outcome,
      decidedAt: r.decidedAt.toISOString(),
    })),
  });
}

const postSchema = z.object({
  provider: z.string().min(1),
  nativeId: z.string().min(1),
  placeSnapshot: z.record(z.string(), z.unknown()),
  area: z.string().optional(),
  mealContext: z.string().optional(),
  searchId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!csrfOk(request)) return authError("errors.csrf", 403);
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);

  const row = await prisma.decisionHistory.create({
    data: {
      userId: gate.user.id,
      placeSnapshot: parsed.data.placeSnapshot as unknown as Prisma.InputJsonValue,
      area: parsed.data.area,
      mealContext: parsed.data.mealContext,
      outcome: "went",
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
