import { afterEach, describe, expect, it } from "vitest";
import { POST as searchRoute } from "../../app/api/decide/search/route";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { bffRequest, readJson, invokeRoute } from "../helpers/http-bff";
import { defaultSearchHandlers, installAgentMock } from "../helpers/mock-agent";

describe("POST /api/decide/search", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("should_return_ranked_picks_from_injected_agent", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    await registerTestUser();
    await loginTestUser();

    const res = await invokeRoute(
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
    expect(res.status).toBe(200);
    const body = await readJson<{
      searchId: string;
      picks: { name: string; nativeId: string }[];
      total: number;
      empty: boolean;
    }>(res);
    expect(body.searchId).toBeTruthy();
    expect(body.total).toBe(3);
    expect(body.empty).toBe(false);
    expect(body.picks.length).toBeGreaterThan(0);
    expect(body.picks[0]?.nativeId).not.toMatch(/^fixture_/);
  });

  it("should_reject_unauthenticated_search", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    const res = await invokeRoute(
      searchRoute,
      bffRequest("/api/decide/search", {
        method: "POST",
        body: { location: "London" },
      }),
    );
    expect(res.status).toBe(401);
  });
});
