import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";

export async function GET(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const rows = await prisma.savedPlace.findMany({
    where: { userId: gate.user.id },
    orderBy: { savedAt: "desc" },
  });
  return NextResponse.json({
    places: rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      nativeId: r.nativeId,
      snapshot: r.snapshot,
      savedAt: r.savedAt.toISOString(),
    })),
  });
}

const saveSchema = z.object({
  provider: z.string().min(1),
  nativeId: z.string().min(1),
  snapshot: z.record(z.string(), z.unknown()),
  area: z.string().optional(),
  mealContext: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const parsed = saveSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);
  const row = await prisma.savedPlace.upsert({
    where: {
      userId_provider_nativeId: {
        userId: gate.user.id,
        provider: parsed.data.provider,
        nativeId: parsed.data.nativeId,
      },
    },
    create: {
      userId: gate.user.id,
      provider: parsed.data.provider,
      nativeId: parsed.data.nativeId,
      snapshot: parsed.data.snapshot as unknown as Prisma.InputJsonValue,
    },
    update: { snapshot: parsed.data.snapshot as unknown as Prisma.InputJsonValue },
  });

  await prisma.decisionHistory.create({
    data: {
      userId: gate.user.id,
      placeSnapshot: parsed.data.snapshot as unknown as Prisma.InputJsonValue,
      area: parsed.data.area,
      mealContext: parsed.data.mealContext,
      outcome: "went",
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

const deleteSchema = z.object({
  provider: z.string().min(1),
  nativeId: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const parsed = deleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);
  await prisma.savedPlace.deleteMany({
    where: {
      userId: gate.user.id,
      provider: parsed.data.provider,
      nativeId: parsed.data.nativeId,
    },
  });
  return NextResponse.json({ ok: true });
}
