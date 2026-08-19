import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/db/client";
import { hashPassword } from "@/src/core/crypto";
import { writeSession } from "@/src/auth/session";
import { csrfOk } from "@/src/auth/csrf";
import { authError, normalizeEmail } from "@/src/auth/user";
import { normalizeLocale } from "@/src/core/locales";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  gender: z.string().optional(),
  age: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    },
    z.number().int().min(13).max(120).optional(),
  ),
  defaultLocation: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed ? trimmed : undefined;
    }),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  locale: z.string().optional(),
});

function registerSchemaErrorKey(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue?.path[0];
  if (path === "name") return "errors.name_required";
  if (path === "email") {
    if (issue.code === "invalid_format" || issue.code === "invalid_type") return "errors.email_invalid";
    return "errors.email_required";
  }
  if (path === "password" || path === "confirmPassword") return "errors.password_too_short";
  if (path === "age") return "errors.age_out_of_range";
  return "errors.validation";
}

export async function POST(request: NextRequest) {
  if (!csrfOk(request)) return authError("errors.csrf", 403);
  const body = await request.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return authError(registerSchemaErrorKey(parsed.error), 400);
  const data = parsed.data;
  if (data.password !== data.confirmPassword) return authError("errors.password_mismatch", 400);
  const email = normalizeEmail(data.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return authError("errors.email_taken", 409);
  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email,
      name: data.name.trim(),
      gender: data.gender,
      age: data.age,
      defaultLocation: data.defaultLocation?.trim() ?? null,
      passwordHash,
      locale: normalizeLocale(data.locale),
      tasteProfile: { create: {} },
    },
  });
  await writeSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true, key: "auth.register_success" });
}
