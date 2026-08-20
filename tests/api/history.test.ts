import { describe, expect, it } from "vitest";
import { GET as historyGetRoute, POST as historyPostRoute } from "../../app/api/history/route";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { bffRequest, invokeRoute, readJson } from "../helpers/http-bff";

const SNAPSHOT = {
  id: "GOOGLE_MAPS:ChIJ-place-a",
  provider: "GOOGLE_MAPS",
  nativeId: "ChIJ-place-a",
  name: "St. JOHN",
  fit: "strong" as const,
  whyKeys: [],
  sources: [{ provider: "GOOGLE_MAPS", native_id: "ChIJ-place-a" }],
  warnings: [],
};

describe("/api/history", () => {
  async function authedSession() {
    await registerTestUser();
    await loginTestUser();
  }

  it("should_record_and_list_went_decisions", async () => {
    await authedSession();

    const postRes = await invokeRoute(
      historyPostRoute,
      authedRequest("/api/history", {
        method: "POST",
        body: {
          provider: "GOOGLE_MAPS",
          nativeId: "ChIJ-place-a",
          placeSnapshot: SNAPSHOT,
          area: "Clerkenwell",
          mealContext: "Weekend dinner",
        },
      }),
    );
    expect(postRes.status).toBe(200);

    const listRes = await invokeRoute(historyGetRoute, authedRequest("/api/history"));
    expect(listRes.status).toBe(200);
    const list = await readJson<{
      decisions: { outcome: string; placeSnapshot: { name: string }; area: string | null }[];
    }>(listRes);
    expect(list.decisions.length).toBeGreaterThan(0);
    expect(list.decisions[0]?.outcome).toBe("went");
    expect(list.decisions[0]?.placeSnapshot.name).toBe("St. JOHN");
    expect(list.decisions[0]?.area).toBe("Clerkenwell");
  });

  it("should_reject_unauthenticated_history", async () => {
    const res = await invokeRoute(historyGetRoute, bffRequest("/api/history"));
    expect(res.status).toBe(401);
  });
});
