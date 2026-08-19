import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as setPasswordRoute } from "../../app/api/auth/set-password/route";
import { POST as loginRoute } from "../../app/api/auth/login/route";
import { hashToken } from "../../src/core/crypto";
import { prisma } from "../../src/db/client";
import { bffRequest, readJson } from "../helpers/http-bff";
import {
  authedRequest,
  loginTestUser,
  registerTestUser,
  TEST_USER,
} from "../helpers/test-user";

const TOKEN = "contract-set-password-token";

async function seedToken(expired = false) {
  await registerTestUser({ email: "setpw@what2eat.food" });
  await prisma.user.update({
    where: { email: "setpw@what2eat.food" },
    data: {
      resetTokenHash: hashToken(TOKEN),
      resetTokenExpiresAt: expired
        ? new Date(Date.now() - 60_000)
        : new Date(Date.now() + 3_600_000),
    },
  });
}

describe("POST /api/auth/set-password", () => {
  it("should_update_password_with_valid_token", async () => {
    await seedToken(false);
    const res = await setPasswordRoute(
      bffRequest("/api/auth/set-password", {
        method: "POST",
        body: { token: TOKEN, password: "newpass123", confirmPassword: "newpass123" },
      }),
    );
    expect(res.status).toBe(200);

    const login = await loginRoute(
      bffRequest("/api/auth/login", {
        method: "POST",
        body: { email: "setpw@what2eat.food", password: "newpass123" },
      }),
    );
    expect(login.status).toBe(200);
  });

  it("should_reject_expired_token", async () => {
    await seedToken(true);
    const res = await setPasswordRoute(
      bffRequest("/api/auth/set-password", {
        method: "POST",
        body: { token: TOKEN, password: "newpass123", confirmPassword: "newpass123" },
      }),
    );
    expect(res.status).toBe(400);
    const body = await readJson<{ error: { key: string } }>(res);
    expect(body.error.key).toBe("errors.token_expired");
  });

  it("should_reject_csrf", async () => {
    const res = await setPasswordRoute(
      new NextRequest("http://localhost:3020/api/auth/set-password", {
        method: "POST",
        headers: { host: "localhost:3020", "content-type": "application/json" },
        body: JSON.stringify({ token: "x", password: "newpass123", confirmPassword: "newpass123" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("should_reject_mismatched_passwords", async () => {
    await seedToken(false);
    const res = await setPasswordRoute(
      bffRequest("/api/auth/set-password", {
        method: "POST",
        body: { token: TOKEN, password: "newpass123", confirmPassword: "otherpass" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("should_update_password_for_authenticated_session_without_token", async () => {
    await registerTestUser({ email: "session-setpw@what2eat.food" });
    await loginTestUser("session-setpw@what2eat.food");
    const res = await setPasswordRoute(
      authedRequest("/api/auth/set-password", {
        method: "POST",
        body: { password: "sessionpass123", confirmPassword: "sessionpass123" },
      }),
    );
    expect(res.status).toBe(200);
  });
});
