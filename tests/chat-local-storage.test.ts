import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_PREFIX,
  appendTurn,
  clearAllChatStorage,
  listChatKey,
  placeChatKey,
  readTranscript,
  writeTranscript,
} from "@/src/chat/local-storage";

describe("chat localStorage", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("should_append_and_read_list_transcript", () => {
    const key = listChatKey("search-1");
    appendTurn(key, { role: "user", content: "hello" });
    const turns = readTranscript(key);
    expect(turns).toHaveLength(1);
    expect(turns[0]?.content).toBe("hello");
  });

  it("should_keep_place_and_list_transcripts_separate", () => {
    const listKey = listChatKey("search-1");
    const placeKey = placeChatKey("GOOGLE_MAPS", "ChIJ-a");
    writeTranscript(listKey, [{ role: "user", content: "list msg" }]);
    writeTranscript(placeKey, [{ role: "user", content: "place msg" }]);
    expect(readTranscript(listKey)[0]?.content).toBe("list msg");
    expect(readTranscript(placeKey)[0]?.content).toBe("place msg");
  });

  it("should_return_empty_for_invalid_json", () => {
    const key = listChatKey("bad");
    store[key] = "not-json";
    expect(readTranscript(key)).toEqual([]);
  });

  it("should_clear_all_w2e_chat_keys", () => {
    writeTranscript(listChatKey("a"), [{ role: "user", content: "x" }]);
    writeTranscript(placeChatKey("GOOGLE_MAPS", "b"), [{ role: "user", content: "y" }]);
    clearAllChatStorage();
    expect(Object.keys(store).some((k) => k.startsWith(CHAT_PREFIX))).toBe(false);
  });

  it("should_roundtrip_assistant_blocks_in_transcript", () => {
    const key = listChatKey("rich");
    appendTurn(key, {
      role: "assistant",
      content: "Try St. JOHN",
      fallbackText: "Try St. JOHN",
      blocks: [
        { type: "paragraph", text: "Try this:" },
        {
          type: "pick_ref",
          provider: "GOOGLE_MAPS",
          nativeId: "a",
          name: "St. JOHN",
          mapUrl: "https://maps.example/x",
        },
      ],
    });
    const turns = readTranscript(key);
    expect(turns[0]?.blocks?.[1]).toMatchObject({ type: "pick_ref", name: "St. JOHN" });
    expect(turns[0]?.content).toBe("Try St. JOHN");
  });
});
