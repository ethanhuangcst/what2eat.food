import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as registerRoute } from "../../app/api/auth/register/route";
import { bffRequest, readJson } from "../helpers/http-bff";

describe("POST /api/auth/register", () => {
  it("should_create_user_when_valid", async () => {
    const res = await registerRoute(
      bffRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "New User",
          email: "new.user@what2eat.food",
          password: "testpass123",
          confirmPassword: "testpass123",
          defaultLocation: "London",
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ ok: boolean }>(res);
    expect(body.ok).toBe(true);
  });

  it("should_reject_csrf_when_origin_missing", async () => {
    const res = await registerRoute(
      new NextRequest("http://localhost:3020/api/auth/register", {
        method: "POST",
        headers: { host: "localhost:3020", "content-type": "application/json" },
        body: JSON.stringify({
          name: "X",
          email: "x@what2eat.food",
          password: "testpass123",
          confirmPassword: "testpass123",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("should_reject_invalid_body", async () => {
    const res = await registerRoute(
      bffRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "",
          email: "bad",
          password: "short",
          confirmPassword: "short",
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("should_reject_age_out_of_range", async () => {
    const res = await registerRoute(
      bffRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Age Test",
          email: "age.test@what2eat.food",
          age: 5,
          password: "testpass123",
          confirmPassword: "testpass123",
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("should_reject_password_mismatch", async () => {
    const res = await registerRoute(
      bffRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Mismatch",
          email: "mismatch@what2eat.food",
          password: "testpass123",
          confirmPassword: "testpass999",
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("should_reject_duplicate_email", async () => {
    const body = {
      name: "Dup",
      email: "dup@what2eat.food",
      password: "testpass123",
      confirmPassword: "testpass123",
    };
    await registerRoute(bffRequest("/api/auth/register", { method: "POST", body }));
    const res = await registerRoute(bffRequest("/api/auth/register", { method: "POST", body }));
    expect(res.status).toBe(409);
  });
});
