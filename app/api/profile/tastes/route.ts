import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { authError, requireUser } from "@/src/auth/user";

const tastesSchema = z.object({
  likes: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
  spiceLevel: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(50).optional(),
  constraints: z.array(z.string()).default([]),
  mealContexts: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const profile =
    gate.user.tasteProfile ??
    (await prisma.tasteProfile.create({ data: { userId: gate.user.id } }));
  return NextResponse.json({
    likes: profile.likes,
    dislikes: profile.dislikes,
    spiceLevel: profile.spiceLevel,
    partySize: profile.partySize,
    constraints: profile.constraints,
    mealContexts: profile.mealContexts,
    updatedAt: profile.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest) {
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;
  const parsed = tastesSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);
  const data = parsed.data;
  const profile = await prisma.tasteProfile.upsert({
    where: { userId: gate.user.id },
    create: { userId: gate.user.id, ...data },
    update: data,
  });
  return NextResponse.json({
    likes: profile.likes,
    dislikes: profile.dislikes,
    spiceLevel: profile.spiceLevel,
    partySize: profile.partySize,
    constraints: profile.constraints,
    mealContexts: profile.mealContexts,
    updatedAt: profile.updatedAt.toISOString(),
  });
}
