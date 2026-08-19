import { describe, expect, it } from "vitest";
import { GET as getPersonal, PUT as putPersonal } from "../../app/api/profile/personal/route";
import { bffRequest, invokeRoute, readJson } from "../helpers/http-bff";
import {
  authedRequest,
  loginTestUser,
  registerTestUser,
  TEST_USER,
} from "../helpers/test-user";

describe("/api/profile/personal", () => {
  it("should_get_profile_when_authenticated", async () => {
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(getPersonal, authedRequest("/api/profile/personal"));
    expect(res.status).toBe(200);
    const body = await readJson<{ email: string }>(res);
    expect(body.email).toBe(TEST_USER.email);
  });

  it("should_reject_unauthenticated_get", async () => {
    const res = await invokeRoute(getPersonal, bffRequest("/api/profile/personal"));
    expect(res.status).toBe(401);
  });

  it("should_update_personal_fields", async () => {
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(
      putPersonal,
      authedRequest("/api/profile/personal", {
        method: "PUT",
        body: {
          name: "Updated Name",
          email: TEST_USER.email,
          defaultLocation: "Shoreditch, London",
          age: 28,
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ name: string; defaultLocation: string }>(res);
    expect(body.name).toBe("Updated Name");
    expect(body.defaultLocation).toBe("Shoreditch, London");
  });

  it("should_reject_photo_too_large", async () => {
    await registerTestUser();
    await loginTestUser();
    const huge = `data:image/png;base64,${"A".repeat(3_000_000)}`;
    const res = await invokeRoute(
      putPersonal,
      authedRequest("/api/profile/personal", {
        method: "PUT",
        body: {
          name: TEST_USER.name,
          email: TEST_USER.email,
          defaultLocation: "London",
          photoUrl: huge,
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});
