import { afterEach, describe, expect, it } from "vitest";
import { POST as searchRoute } from "../../app/api/decide/search/route";
import { GET as placeRoute } from "../../app/api/places/[source]/[nativeId]/route";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { bffRequest, readJson, invokeRoute } from "../helpers/http-bff";
import {
  defaultSearchHandlers,
  installAgentMock,
  SAMPLE_PLACE_A,
  SAMPLE_PLACE_B,
} from "../helpers/mock-agent";

const PLACE_PARAMS = Promise.resolve({ source: "GOOGLE_MAPS", nativeId: "ChIJ-place-a" });

describe("GET /api/places/[source]/[nativeId]", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  async function seedSearch() {
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(
      searchRoute,
      authedRequest("/api/decide/search", {
        method: "POST",
        body: { location: "Clerkenwell, London", budget: "$$", page: 1 },
      }),
    );
    expect(res.status).toBe(200);
  }

  it("should_return_place_details_with_nearby_alternatives", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    await seedSearch();

    const res = await invokeRoute(
      (req) => placeRoute(req, { params: PLACE_PARAMS }),
      authedRequest("/api/places/GOOGLE_MAPS/ChIJ-place-a"),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{
      place: { name: string };
      pick: { nativeId: string };
      alternatives: { nativeId: string; name: string }[];
      saved: boolean;
    }>(res);
    expect(body.place.name).toBe(SAMPLE_PLACE_A.name);
    expect(body.pick.nativeId).toBe("ChIJ-place-a");
    expect(body.saved).toBe(false);
    expect(body.alternatives.length).toBeGreaterThan(0);
    expect(body.alternatives.some((a) => a.nativeId === SAMPLE_PLACE_B.sources[0]?.native_id)).toBe(true);
    expect(body.alternatives.every((a) => a.nativeId !== "ChIJ-place-a")).toBe(true);
  });

  it("should_reject_unauthenticated_place_details", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    const res = await invokeRoute(
      (req) => placeRoute(req, { params: PLACE_PARAMS }),
      bffRequest("/api/places/GOOGLE_MAPS/ChIJ-place-a"),
    );
    expect(res.status).toBe(401);
  });
});
