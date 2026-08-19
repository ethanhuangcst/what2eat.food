import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/db/client";
import { verifyPassword } from "@/src/core/crypto";
import { writeSession } from "@/src/auth/session";
import { csrfOk } from "@/src/auth/csrf";
import { authError, normalizeEmail } from "@/src/auth/user";

export async function POST(request: NextRequest) {
  if (!csrfOk(request)) return authError("errors.csrf", 403);
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return authError("errors.login_failed", 401);
  }
  await writeSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true, name: user.name });
}
