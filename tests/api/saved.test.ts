import { describe, expect, it } from "vitest";
import { GET as savedGetRoute, POST as savedPostRoute, DELETE as savedDeleteRoute } from "../../app/api/saved/route";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { bffRequest, readJson, invokeRoute } from "../helpers/http-bff";

const SNAPSHOT = {
  id: "GOOGLE_MAPS:ChIJ-place-a",
  provider: "GOOGLE_MAPS",
  nativeId: "ChIJ-place-a",
  name: "St. JOHN",
  fit: "strong" as const,
  whyKeys: ["eat.why.reason_budget"],
  sources: [{ provider: "GOOGLE_MAPS", native_id: "ChIJ-place-a" }],
  warnings: [],
};

describe("/api/saved", () => {
  async function authedSession() {
    await registerTestUser();
    await loginTestUser();
  }

  it("should_save_list_and_unsave_a_place", async () => {
    await authedSession();

    const saveRes = await invokeRoute(
      savedPostRoute,
      authedRequest("/api/saved", {
        method: "POST",
        body: {
          provider: "GOOGLE_MAPS",
          nativeId: "ChIJ-place-a",
          snapshot: SNAPSHOT,
        },
      }),
    );
    expect(saveRes.status).toBe(200);

    const listRes = await invokeRoute(savedGetRoute, authedRequest("/api/saved"));
    expect(listRes.status).toBe(200);
    const list = await readJson<{ places: { nativeId: string; snapshot: { name: string } }[] }>(listRes);
    expect(list.places).toHaveLength(1);
    expect(list.places[0]?.nativeId).toBe("ChIJ-place-a");
    expect(list.places[0]?.snapshot.name).toBe("St. JOHN");

    const delRes = await invokeRoute(
      savedDeleteRoute,
      authedRequest("/api/saved", {
        method: "DELETE",
        body: { provider: "GOOGLE_MAPS", nativeId: "ChIJ-place-a" },
      }),
    );
    expect(delRes.status).toBe(200);

    const emptyRes = await invokeRoute(savedGetRoute, authedRequest("/api/saved"));
    const empty = await readJson<{ places: unknown[] }>(emptyRes);
    expect(empty.places).toHaveLength(0);
  });

  it("should_reject_unauthenticated_saved_list", async () => {
    const res = await invokeRoute(savedGetRoute, bffRequest("/api/saved"));
    expect(res.status).toBe(401);
  });
});
