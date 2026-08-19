import { expect } from "vitest";
import { POST as registerRoute } from "../../app/api/auth/register/route";
import { POST as loginRoute } from "../../app/api/auth/login/route";
import { NextRequest } from "next/server";
import { bffRequest, readJson } from "./http-bff";
import { getTestCookie } from "../setup";

export const TEST_USER = {
  name: "Contract Test",
  email: "contract.test@what2eat.food",
  password: "testpass123",
  defaultLocation: "Clerkenwell, London",
};

export async function registerTestUser(
  overrides: Partial<typeof TEST_USER> = {},
): Promise<{ email: string; password: string }> {
  const user = { ...TEST_USER, ...overrides };
  const res = await registerRoute(
    bffRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: user.name,
        email: user.email,
        password: user.password,
        confirmPassword: user.password,
        defaultLocation: user.defaultLocation,
      },
    }),
  );
  expect(res.status).toBe(200);
  await readJson(res);
  return { email: user.email, password: user.password };
}

export async function loginTestUser(
  email = TEST_USER.email,
  password = TEST_USER.password,
): Promise<void> {
  const res = await loginRoute(
    bffRequest("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  );
  expect(res.status).toBe(200);
  await readJson(res);
}

export function sessionCookieHeader(): string | undefined {
  const value = getTestCookie("what2eat_session");
  return value ? `what2eat_session=${value}` : undefined;
}

export function authedRequest(
  path: string,
  init: Parameters<typeof bffRequest>[1] = {},
): NextRequest {
  const cookie = sessionCookieHeader();
  if (!cookie) {
    throw new Error("session cookie missing — call loginTestUser() first");
  }
  return bffRequest(path, { ...init, cookie });
}
