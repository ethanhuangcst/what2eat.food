import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { hashPassword, hashToken } from "@/src/core/crypto";
import { csrfOk } from "@/src/auth/csrf";
import { authError } from "@/src/auth/user";
import { clearSession, readSession } from "@/src/auth/session";

const schema = z.object({
  token: z.string().optional(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  if (!csrfOk(request)) return authError("errors.csrf", 403);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) {
    return authError("errors.validation", 400);
  }
  const passwordHash = await hashPassword(parsed.data.password);
  if (parsed.data.token) {
    const hash = hashToken(parsed.data.token);
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: hash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!user) return authError("errors.token_expired", 400);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
    await clearSession();
    return NextResponse.json({ ok: true, key: "auth.password_set" });
  }
  const session = await readSession();
  if (!session) return authError("errors.session_expired", 401);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash },
  });
  return NextResponse.json({ ok: true, key: "auth.password_set" });
}
