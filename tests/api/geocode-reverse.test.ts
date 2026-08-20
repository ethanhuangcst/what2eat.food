import { afterEach, describe, expect, it } from "vitest";
import { POST as reverseRoute } from "../../app/api/geocode/reverse/route";
import { bffRequest, invokeRoute, readJson } from "../helpers/http-bff";
import { installAgentMock } from "../helpers/mock-agent";

describe("POST /api/geocode/reverse", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("should_return_label_for_coords", async () => {
    teardown = installAgentMock({
      geocode: (body: unknown) => {
        const { lat, lng } = body as { lat: number; lng: number };
        return {
          ok: true,
          data: { lat, lng, crs: "WGS84", address: "Central, Hong Kong" },
        };
      },
    });

    const res = await invokeRoute(
      reverseRoute,
      bffRequest("/api/geocode/reverse", {
        method: "POST",
        body: { lat: 22.3193, lng: 114.1694, locale: "EN" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ label: string; lat: number; lng: number }>(res);
    expect(body.label).toBe("Central, Hong Kong");
    expect(body.lat).toBe(22.3193);
  });

  it("should_reject_without_csrf_origin", async () => {
    teardown = installAgentMock({});
    const res = await invokeRoute(
      reverseRoute,
      bffRequest("/api/geocode/reverse", {
        method: "POST",
        body: { lat: 1, lng: 2 },
        origin: "http://evil.test",
      }),
    );
    expect(res.status).toBe(403);
  });
});
