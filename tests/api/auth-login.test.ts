import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginRoute } from "../../app/api/auth/login/route";
import { bffRequest, readJson } from "../helpers/http-bff";
import { registerTestUser, TEST_USER } from "../helpers/test-user";

describe("POST /api/auth/login", () => {
  it("should_login_with_valid_credentials", async () => {
    await registerTestUser();
    const res = await loginRoute(
      bffRequest("/api/auth/login", {
        method: "POST",
        body: { email: TEST_USER.email, password: TEST_USER.password },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ ok: boolean; name: string }>(res);
    expect(body.ok).toBe(true);
    expect(body.name).toBe(TEST_USER.name);
  });

  it("should_reject_invalid_password", async () => {
    await registerTestUser();
    const res = await loginRoute(
      bffRequest("/api/auth/login", {
        method: "POST",
        body: { email: TEST_USER.email, password: "wrong-password" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("should_reject_csrf", async () => {
    const res = await loginRoute(
      new NextRequest("http://localhost:3020/api/auth/login", {
        method: "POST",
        headers: { host: "localhost:3020", "content-type": "application/json" },
        body: JSON.stringify({ email: "a@b.c", password: "x" }),
      }),
    );
    expect(res.status).toBe(403);
  });
});
