import { afterEach, describe, expect, it } from "vitest";
import { POST as searchRoute } from "../../app/api/decide/search/route";
import { POST as sortRoute } from "../../app/api/decide/sort/route";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { invokeRoute, readJson } from "../helpers/http-bff";
import { defaultSearchHandlers, installAgentMock, SAMPLE_PLACE_A, SAMPLE_PLACE_B, SAMPLE_PLACE_C } from "../helpers/mock-agent";

describe("POST /api/decide/sort", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("should_sort_cached_results_by_rating", async () => {
    teardown = installAgentMock(
      defaultSearchHandlers([
        { ...SAMPLE_PLACE_A, rating: 4.1 },
        { ...SAMPLE_PLACE_B, rating: 4.9 },
        { ...SAMPLE_PLACE_C, rating: 4.3 },
      ]),
    );
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
          page: 1,
        },
      }),
    );
    const searchBody = await readJson<{ searchId: string; sort: string }>(searchRes);
    expect(searchBody.sort).toBe("rank");

    const sortRes = await invokeRoute(
      sortRoute,
      authedRequest("/api/decide/sort", {
        method: "POST",
        body: { searchId: searchBody.searchId, sort: "rating", page: 1 },
      }),
    );
    expect(sortRes.status).toBe(200);
    const sortBody = await readJson<{ sort: string; picks: { name: string }[] }>(sortRes);
    expect(sortBody.sort).toBe("rating");
    expect(sortBody.picks[0]?.name).toBe("Dishoom");
  });
});
