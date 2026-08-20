import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as searchRoute } from "../../app/api/decide/search/route";
import { POST as reshuffleRoute } from "../../app/api/decide/reshuffle/route";
import { POST as sortRoute } from "../../app/api/decide/sort/route";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { invokeRoute, readJson } from "../helpers/http-bff";
import { defaultSearchHandlers, installAgentMock } from "../helpers/mock-agent";

describe("POST /api/decide/reshuffle", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("should_requery_vendors_and_reset_sort_on_reshuffle", async () => {
    let searchCalls = 0;
    teardown = installAgentMock({
      ...defaultSearchHandlers(),
      search_restaurants: () => {
        searchCalls += 1;
        return defaultSearchHandlers().search_restaurants();
      },
    });
    await registerTestUser();
    await loginTestUser();

    const searchRes = await invokeRoute(
      searchRoute,
      authedRequest("/api/decide/search", {
        method: "POST",
        body: { location: "Clerkenwell, London", budget: "$$", page: 1 },
      }),
    );
    const searchBody = await readJson<{ searchId: string; updatedAt: string }>(searchRes);

    await invokeRoute(
      sortRoute,
      authedRequest("/api/decide/sort", {
        method: "POST",
        body: { searchId: searchBody.searchId, sort: "rating", page: 1 },
      }),
    );

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T06:00:00.000Z"));
    const reshuffleRes = await invokeRoute(
      reshuffleRoute,
      authedRequest("/api/decide/reshuffle", {
        method: "POST",
        body: { searchId: searchBody.searchId, mode: "reshuffle" },
      }),
    );
    vi.useRealTimers();

    expect(reshuffleRes.status).toBe(200);
    const body = await readJson<{ sort: string; updatedAt: string }>(reshuffleRes);
    expect(body.sort).toBe("rank");
    expect(body.updatedAt).not.toBe(searchBody.updatedAt);
    expect(searchCalls).toBeGreaterThanOrEqual(2);
  });
});
