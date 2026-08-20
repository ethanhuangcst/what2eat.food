import { afterEach, describe, expect, it } from "vitest";
import { POST as chatRoute } from "../../app/api/chat/route";
import { prisma } from "@/src/db/client";
import { authedRequest, loginTestUser, registerTestUser } from "../helpers/test-user";
import { bffRequest, invokeRoute, readJson } from "../helpers/http-bff";
import { defaultSearchHandlers, installAgentMock } from "../helpers/mock-agent";

describe("POST /api/chat", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("should_return_assistant_reply_without_db_chat_rows", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    await registerTestUser();
    await loginTestUser();

    const before = await prisma.decisionHistory.count();
    const res = await invokeRoute(
      chatRoute,
      authedRequest("/api/chat", {
        method: "POST",
        body: {
          scope: "list",
          messages: [{ role: "user", content: "Any lighter options?" }],
          context: {
            searchId: "s1",
            location: "Clerkenwell",
            mealContext: "Weekend dinner",
            budget: "$$",
            picks: [{ name: "St. JOHN", nativeId: "ChIJ-place-a", provider: "GOOGLE_MAPS" }],
          },
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{
      reply: { role: string; content: string; blocks?: { type: string }[]; fallbackText?: string };
    }>(res);
    expect(body.reply.content.length).toBeGreaterThan(0);
    expect(Array.isArray(body.reply.blocks)).toBe(true);
    expect(body.reply.blocks!.length).toBeGreaterThan(0);
    expect(body.reply.fallbackText).toBeTruthy();
    const after = await prisma.decisionHistory.count();
    expect(after).toBe(before);
  });

  it("should_hydrate_pick_ref_blocks_from_list_context", async () => {
    teardown = installAgentMock({
      ...defaultSearchHandlers(),
      chat: () => ({
        ok: true,
        data: {
          message: {
            role: "assistant",
            content: JSON.stringify({
              blocks: [
                { type: "paragraph", text: "Try this:" },
                { type: "pick_ref", provider: "GOOGLE_MAPS", nativeId: "ChIJ-place-a", note: "quiet" },
              ],
              fallbackText: "Try St. JOHN",
            }),
          },
        },
      }),
    });
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(
      chatRoute,
      authedRequest("/api/chat", {
        method: "POST",
        body: {
          scope: "list",
          messages: [{ role: "user", content: "Suggest one" }],
          context: {
            searchId: "s1",
            picks: [
              {
                name: "St. JOHN",
                nativeId: "ChIJ-place-a",
                provider: "GOOGLE_MAPS",
                photoUrl: "https://cdn.example/p.jpg",
                mapUrl: "https://maps.example/stjohn",
                rating: 4.5,
                category: "British",
              },
            ],
          },
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{
      reply: {
        blocks: { type: string; name?: string; mapUrl?: string; photoUrl?: string }[];
      };
    }>(res);
    const pick = body.reply.blocks.find((b) => b.type === "pick_ref");
    expect(pick).toMatchObject({
      type: "pick_ref",
      name: "St. JOHN",
      mapUrl: "https://maps.example/stjohn",
      photoUrl: "https://cdn.example/p.jpg",
    });
  });

  it("should_reject_unauthenticated_chat", async () => {
    const res = await invokeRoute(
      chatRoute,
      bffRequest("/api/chat", {
        method: "POST",
        body: {
          scope: "place",
          messages: [{ role: "user", content: "hours?" }],
          context: { provider: "GOOGLE_MAPS", nativeId: "ChIJ-place-a", name: "St. JOHN" },
        },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("should_reject_invalid_chat_body", async () => {
    teardown = installAgentMock(defaultSearchHandlers());
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(
      chatRoute,
      authedRequest("/api/chat", {
        method: "POST",
        body: { scope: "list", messages: [], context: {} },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("should_hydrate_pick_ref_from_agent_tool_places_when_not_in_context", async () => {
    teardown = installAgentMock({
      ...defaultSearchHandlers(),
      chat: () => ({
        ok: true,
        data: {
          message: {
            role: "assistant",
            content: JSON.stringify({
              blocks: [
                { type: "paragraph", text: "这家店偏快餐。" },
                { type: "pick_ref", provider: "AMAP", nativeId: "amap-wuji", note: "快餐" },
              ],
              fallbackText: "吴记鲜",
            }),
          },
          places: [
            {
              provider: "AMAP",
              name: "吴记鲜定位",
              rating: 4.5,
              photos: ["https://cdn.example/wuji.jpg"],
              location: { lat: 31.2, lng: 121.5, crs: "GCJ-02" },
              sources: [
                {
                  provider: "AMAP",
                  native_id: "amap-wuji",
                  deeplinks: { amap_web: "https://uri.amap.com/marker?position=121,31" },
                },
              ],
            },
          ],
        },
      }),
    });
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(
      chatRoute,
      authedRequest("/api/chat", {
        method: "POST",
        body: {
          scope: "list",
          messages: [{ role: "user", content: "给我这家餐厅的信息" }],
          context: { location: "上海", picks: [] },
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{
      reply: { blocks: { type: string; name?: string; photoUrl?: string; mapUrl?: string }[] };
    }>(res);
    const pick = body.reply.blocks.find((b) => b.type === "pick_ref");
    expect(pick).toMatchObject({
      type: "pick_ref",
      name: "吴记鲜定位",
      photoUrl: "https://cdn.example/wuji.jpg",
      mapUrl: "https://uri.amap.com/marker?position=121,31",
    });
  });

  it("should_return_502_when_agent_chat_fails", async () => {
    teardown = installAgentMock({
      ...defaultSearchHandlers(),
      chat: () => ({ ok: false, outcome: { key: "errors.chat_failed" } }),
    });
    await registerTestUser();
    await loginTestUser();
    const res = await invokeRoute(
      chatRoute,
      authedRequest("/api/chat", {
        method: "POST",
        body: {
          scope: "list",
          messages: [{ role: "user", content: "hello" }],
          context: { location: "London" },
        },
      }),
    );
    expect(res.status).toBe(502);
  });
});
