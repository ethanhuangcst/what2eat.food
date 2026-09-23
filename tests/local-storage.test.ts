import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_PREFIX,
  LIST_CHAT_STORAGE_KEY,
  appendTurn,
  clearAllChatStorage,
  migrateLegacyListChatIfNeeded,
  placeChatKey,
  readTranscript,
  turnPlainContent,
  writeTranscript,
} from "../src/chat/local-storage";

type MemStore = Map<string, string>;

function installMemoryStorage(store: MemStore): Storage {
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
  vi.stubGlobal("localStorage", storage);
  return storage;
}

describe("chat local-storage", () => {
  let store: MemStore;

  beforeEach(() => {
    store = new Map();
    installMemoryStorage(store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should_return_empty_when_missing_or_invalid_json", () => {
    expect(readTranscript("missing")).toEqual([]);
    store.set("bad", "{not-json");
    expect(readTranscript("bad")).toEqual([]);
    store.set("obj", JSON.stringify({ role: "user" }));
    expect(readTranscript("obj")).toEqual([]);
  });

  it("should_filter_and_normalize_turns_on_read_write_append", () => {
    writeTranscript(LIST_CHAT_STORAGE_KEY, [
      { role: "user", content: "hi" },
      { role: "assistant", content: "", blocks: [{ type: "paragraph", text: "ok" }], fallbackText: "ok" },
      { role: "user", content: "" },
      { role: "system" as "user", content: "nope" },
    ]);
    const turns = readTranscript(LIST_CHAT_STORAGE_KEY);
    expect(turns).toHaveLength(3);
    expect(turns[1]?.content).toBe("ok");
    expect(turns[2]?.content).toBe("[message]");
    const next = appendTurn(LIST_CHAT_STORAGE_KEY, { role: "user", content: "again" });
    expect(next).toHaveLength(4);
    expect(placeChatKey("AMAP", "B01")).toBe(`${CHAT_PREFIX}place.AMAP:B01`);
  });

  it("should_migrate_longest_legacy_list_and_clear_legacy_keys", () => {
    store.set(`${CHAT_PREFIX}list.old-a`, JSON.stringify([{ role: "user", content: "a" }]));
    store.set(
      `${CHAT_PREFIX}list.old-b`,
      JSON.stringify([
        { role: "user", content: "b1" },
        { role: "assistant", content: "b2" },
      ]),
    );
    migrateLegacyListChatIfNeeded();
    expect(readTranscript(LIST_CHAT_STORAGE_KEY)).toHaveLength(2);
    expect([...store.keys()].some((k) => k.startsWith(`${CHAT_PREFIX}list.`))).toBe(false);
    expect(store.has(LIST_CHAT_STORAGE_KEY)).toBe(true);
  });

  it("should_skip_migrate_when_stable_list_already_present", () => {
    writeTranscript(LIST_CHAT_STORAGE_KEY, [{ role: "user", content: "keep" }]);
    store.set(`${CHAT_PREFIX}list.old`, JSON.stringify([{ role: "user", content: "legacy" }]));
    migrateLegacyListChatIfNeeded();
    expect(readTranscript(LIST_CHAT_STORAGE_KEY)).toEqual([{ role: "user", content: "keep" }]);
    expect(store.has(`${CHAT_PREFIX}list.old`)).toBe(false);
  });

  it("should_clear_all_chat_keys_and_plain_content_fallback", () => {
    writeTranscript(LIST_CHAT_STORAGE_KEY, [{ role: "user", content: "x" }]);
    store.set(`${CHAT_PREFIX}place.AMAP:1`, "[]");
    store.set("other", "1");
    clearAllChatStorage();
    expect(store.has(LIST_CHAT_STORAGE_KEY)).toBe(false);
    expect(store.has("other")).toBe(true);
    expect(turnPlainContent({ role: "assistant", content: "", fallbackText: "fb" })).toBe("fb");
    expect(turnPlainContent({ role: "assistant", content: "c" })).toBe("c");
  });
});
