import { describe, expect, it } from "vitest";
import { hydrateChatBlocks, isSafeHttpsUrl, mergeHydratePicks, parseAgentBlocks, picksFromAgentPlaces } from "@/src/chat/blocks";

describe("parseAgentBlocks", () => {
  it("should_parse_json_blocks_when_agent_returns_structured_json", () => {
    const raw = JSON.stringify({
      blocks: [
        { type: "paragraph", text: "Try these:" },
        { type: "pick_ref", provider: "GOOGLE_MAPS", nativeId: "ChIJ-a", note: "quiet" },
      ],
      fallbackText: "Try St. JOHN",
    });
    const { blocks, fallbackText } = parseAgentBlocks(raw);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: "paragraph", text: "Try these:" });
    expect(blocks[1]).toMatchObject({ type: "pick_ref", nativeId: "ChIJ-a" });
    expect(fallbackText).toBe("Try St. JOHN");
  });

  it("should_parse_nested_keyed_blocks_when_llm_omits_type_field", () => {
    const raw = JSON.stringify({
      blocks: [
        { heading: { level: 2, text: "Recommended steakhouse picks in Central" } },
        { paragraph: { text: "For a business meal:" } },
        { list: { items: ["Carne's", "REX"] } },
        {
          pick_ref: {
            provider: "GOOGLE_MAPS",
            nativeId: "ChIJ09FPywUBBDQRKufFrOJWuFE",
            note: "Carne's Argentinian Steak House",
          },
        },
      ],
      fallbackText: "Start with Carne's.",
    });
    const { blocks, fallbackText } = parseAgentBlocks(raw);
    expect(blocks).toEqual([
      { type: "heading", level: 2, text: "Recommended steakhouse picks in Central" },
      { type: "paragraph", text: "For a business meal:" },
      { type: "list", items: ["Carne's", "REX"] },
      {
        type: "pick_ref",
        provider: "GOOGLE_MAPS",
        nativeId: "ChIJ09FPywUBBDQRKufFrOJWuFE",
        note: "Carne's Argentinian Steak House",
      },
    ]);
    expect(fallbackText).toBe("Start with Carne's.");
  });

  it("should_parse_fenced_json_when_wrapped_in_markdown_fence", () => {
    const raw =
      'Here you go:\n```json\n{"blocks":[{"type":"paragraph","text":"Hi"}]}\n```';
    const { blocks } = parseAgentBlocks(raw);
    expect(blocks).toEqual([{ type: "paragraph", text: "Hi" }]);
  });

  it("should_fallback_to_paragraph_when_content_is_plain_text", () => {
    const { blocks, fallbackText } = parseAgentBlocks("Just a plain suggestion.");
    expect(blocks).toEqual([{ type: "paragraph", text: "Just a plain suggestion." }]);
    expect(fallbackText).toBe("Just a plain suggestion.");
  });

  it("should_reject_javascript_link_scheme", () => {
    const raw = JSON.stringify({
      blocks: [{ type: "link", label: "x", href: "javascript:alert(1)" }],
    });
    const { blocks } = parseAgentBlocks(raw);
    expect(blocks).toEqual([{ type: "paragraph", text: raw }]);
  });
});

describe("hydrateChatBlocks", () => {
  it("should_hydrate_pick_ref_from_list_picks", () => {
    const blocks = hydrateChatBlocks(
      [{ type: "pick_ref", provider: "GOOGLE_MAPS", nativeId: "ChIJ-a", note: "4.5 · British" }],
      [
        {
          name: "St. JOHN",
          provider: "GOOGLE_MAPS",
          nativeId: "ChIJ-a",
          photoUrl: "https://cdn.example/p.jpg",
          rating: 4.5,
          category: "British",
          mapUrl: "https://maps.example/stjohn",
        },
      ],
    );
    expect(blocks[0]).toMatchObject({
      type: "pick_ref",
      name: "St. JOHN",
      photoUrl: "https://cdn.example/p.jpg",
      mapUrl: "https://maps.example/stjohn",
    });
  });

  it("should_degrade_unknown_pick_ref_to_paragraph", () => {
    const blocks = hydrateChatBlocks(
      [{ type: "pick_ref", provider: "GOOGLE_MAPS", nativeId: "missing", note: "maybe" }],
      [],
    );
    expect(blocks).toEqual([{ type: "paragraph", text: "maybe" }]);
  });

  it("should_omit_non_https_photo_url", () => {
    const blocks = hydrateChatBlocks(
      [{ type: "pick_ref", provider: "GOOGLE_MAPS", nativeId: "ChIJ-a" }],
      [
        {
          name: "St. JOHN",
          provider: "GOOGLE_MAPS",
          nativeId: "ChIJ-a",
          photoUrl: "http://insecure.example/p.jpg",
          mapUrl: "https://maps.example/ok",
        },
      ],
    );
    expect(blocks[0]).toMatchObject({ type: "pick_ref", name: "St. JOHN" });
    expect((blocks[0] as { photoUrl?: string }).photoUrl).toBeUndefined();
  });
});

describe("picksFromAgentPlaces", () => {
  it("should_map_tool_cards_for_hydrate", () => {
    const refs = picksFromAgentPlaces([
      {
        name: "吴记鲜",
        provider: "AMAP",
        rating: 4.2,
        category: "fast_food_restaurant",
        photos: ["https://cdn.example/a.jpg"],
        sources: [
          {
            provider: "AMAP",
            native_id: "B0xxx",
            deeplinks: { amap_web: "https://uri.amap.com/marker?position=1,2" },
          },
        ],
      },
    ]);
    expect(refs[0]).toMatchObject({
      name: "吴记鲜",
      provider: "AMAP",
      nativeId: "B0xxx",
      photoUrl: "https://cdn.example/a.jpg",
      mapUrl: "https://uri.amap.com/marker?position=1,2",
    });
  });

  it("should_prefer_context_over_agent_when_merging", () => {
    const merged = mergeHydratePicks(
      [{ name: "From context", provider: "AMAP", nativeId: "B1", rating: 5 }],
      [{ name: "From agent", provider: "AMAP", nativeId: "B1", rating: 3 }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.name).toBe("From context");
  });

  it("should_hydrate_pick_ref_from_agent_places_when_not_in_list_context", () => {
    const agent = picksFromAgentPlaces([
      {
        name: "吴记鲜定位",
        provider: "AMAP",
        photos: ["https://cdn.example/w.jpg"],
        sources: [
          {
            provider: "AMAP",
            native_id: "amap-1",
            deeplinks: { amap_web: "https://uri.amap.com/marker?position=121,31" },
          },
        ],
      },
    ]);
    const blocks = hydrateChatBlocks(
      [{ type: "pick_ref", provider: "AMAP", nativeId: "amap-1", note: "快餐" }],
      mergeHydratePicks([], agent),
    );
    expect(blocks[0]).toMatchObject({
      type: "pick_ref",
      name: "吴记鲜定位",
      photoUrl: "https://cdn.example/w.jpg",
      mapUrl: "https://uri.amap.com/marker?position=121,31",
    });
  });
});

describe("isSafeHttpsUrl", () => {
  it("should_allow_https_only", () => {
    expect(isSafeHttpsUrl("https://maps.google.com/x")).toBe(true);
    expect(isSafeHttpsUrl("http://maps.google.com/x")).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
  });
});
