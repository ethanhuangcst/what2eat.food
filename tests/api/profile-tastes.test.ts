import { describe, expect, it } from "vitest";
import { GET as getTastes, PUT as putTastes } from "../../app/api/profile/tastes/route";
import { bffRequest, invokeRoute, readJson } from "../helpers/http-bff";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";

describe("/api/profile/tastes", () => {
  it("should_get_tastes_when_authenticated", async () => {
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(getTastes, authedRequest("/api/profile/tastes"));
    expect(res.status).toBe(200);
    const body = await readJson<{ likes: unknown[] }>(res);
    expect(Array.isArray(body.likes)).toBe(true);
  });

  it("should_reject_unauthenticated_get", async () => {
    const res = await invokeRoute(getTastes, bffRequest("/api/profile/tastes"));
    expect(res.status).toBe(401);
  });

  it("should_update_tastes", async () => {
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(
      putTastes,
      authedRequest("/api/profile/tastes", {
        method: "PUT",
        body: {
          likes: ["Italian", "ramen"],
          dislikes: ["fast food"],
          spiceLevel: "medium",
          partySize: 2,
          constraints: ["vegetarian"],
          mealContexts: ["weekend dinner"],
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ likes: string[]; partySize: number }>(res);
    expect(body.likes).toContain("Italian");
    expect(body.partySize).toBe(2);
  });
});
