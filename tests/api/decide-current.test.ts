import { afterEach, describe, expect, it } from "vitest";
import { GET as currentRoute } from "../../app/api/decide/current/route";
import { POST as searchRoute } from "../../app/api/decide/search/route";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { bffRequest, readJson, invokeRoute } from "../helpers/http-bff";
import { defaultSearchHandlers, installAgentMock } from "../helpers/mock-agent";

describe("GET /api/decide/current", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("should_return_cached_search_after_post_search", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    await registerTestUser();
    await loginTestUser();

    const searchRes = await invokeRoute(
      searchRoute,
      authedRequest("/api/decide/search", {
        method: "POST",
        body: {
          location: "Clerkenwell, London",
          mealContext: "Weekend dinner",
          budget: "$$",
          craving: "",
          page: 1,
        },
      }),
    );
    expect(searchRes.status).toBe(200);
    const searchBody = await readJson<{
      searchId: string;
      total: number;
      picks: { nativeId: string }[];
    }>(searchRes);

    const currentRes = await invokeRoute(
      currentRoute,
      authedRequest("/api/decide/current?page=1"),
    );
    expect(currentRes.status).toBe(200);
    const currentBody = await readJson<{
      searchId: string;
      total: number;
      picks: { nativeId: string }[];
      criteria: { location: string; mealContext?: string; budget?: string };
    }>(currentRes);

    expect(currentBody.searchId).toBe(searchBody.searchId);
    expect(currentBody.total).toBe(searchBody.total);
    expect(currentBody.picks.length).toBe(searchBody.picks.length);
    expect(currentBody.criteria.location).toBe("Clerkenwell, London");
  });

  it("should_reject_unauthenticated", async () => {
    const res = await invokeRoute(
      currentRoute,
      bffRequest("/api/decide/current"),
    );
    expect(res.status).toBe(401);
  });

  it("should_return_404_when_no_cache", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    await registerTestUser({ email: "nocache@what2eat.food" });
    await loginTestUser("nocache@what2eat.food");

    const res = await invokeRoute(
      currentRoute,
      authedRequest("/api/decide/current"),
    );
    expect(res.status).toBe(404);
    const body = await readJson<{ error: { key: string } }>(res);
    expect(body.error.key).toBe("errors.no_search_cache");
  });
});
