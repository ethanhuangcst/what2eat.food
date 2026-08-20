import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  CHAT_PANEL_MIN_H,
  CHAT_PANEL_MIN_W,
  CHAT_PANEL_SIZE_KEY,
  defaultChatPanelSize,
  loadChatPanelSize,
  nextChatPanelSize,
  saveChatPanelSize,
} from "@/src/chat/panel-size";

describe("nextChatPanelSize", () => {
  it("should_grow_when_dragging_northwest", () => {
    const next = nextChatPanelSize({
      startWidth: CHAT_PANEL_MIN_W,
      startHeight: CHAT_PANEL_MIN_H,
      startClientX: 400,
      startClientY: 400,
      clientX: 300,
      clientY: 300,
      viewportW: 1400,
      viewportH: 900,
    });
    expect(next.width).toBe(CHAT_PANEL_MIN_W + 100);
    expect(next.height).toBe(CHAT_PANEL_MIN_H + 100);
  });

  it("should_not_shrink_below_minimum", () => {
    const next = nextChatPanelSize({
      startWidth: CHAT_PANEL_MIN_W,
      startHeight: CHAT_PANEL_MIN_H,
      startClientX: 400,
      startClientY: 400,
      clientX: 500,
      clientY: 500,
      viewportW: 1400,
      viewportH: 900,
    });
    expect(next.width).toBe(CHAT_PANEL_MIN_W);
    expect(next.height).toBe(CHAT_PANEL_MIN_H);
  });

  it("should_clamp_to_viewport", () => {
    const next = nextChatPanelSize({
      startWidth: CHAT_PANEL_MIN_W,
      startHeight: CHAT_PANEL_MIN_H,
      startClientX: 800,
      startClientY: 800,
      clientX: 0,
      clientY: 0,
      viewportW: 500,
      viewportH: 600,
    });
    expect(next.width).toBe(468);
    expect(next.height).toBe(568);
  });
});

describe("chat panel size persistence", () => {
  beforeEach(() => {
    // node env: provide a minimal localStorage
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });
  });

  it("should_roundtrip_save_and_load", () => {
    saveChatPanelSize({ width: 400, height: 500 });
    expect(loadChatPanelSize()).toEqual({ width: 400, height: 500 });
  });

  it("should_keep_defaultChatPanelSize_independent_of_localStorage", () => {
    saveChatPanelSize({ width: 400, height: 500 });
    expect(defaultChatPanelSize()).toEqual({
      width: CHAT_PANEL_MIN_W,
      height: CHAT_PANEL_MIN_H,
    });
    expect(loadChatPanelSize()).toEqual({ width: 400, height: 500 });
  });

  it("should_clamp_invalid_stored_size_to_minimum", () => {
    localStorage.setItem(CHAT_PANEL_SIZE_KEY, JSON.stringify({ width: 10, height: 10 }));
    const loaded = loadChatPanelSize();
    expect(loaded.width).toBe(CHAT_PANEL_MIN_W);
    expect(loaded.height).toBe(CHAT_PANEL_MIN_H);
  });

  it("should_return_defaults_when_missing_or_corrupt", () => {
    expect(loadChatPanelSize()).toEqual({ width: CHAT_PANEL_MIN_W, height: CHAT_PANEL_MIN_H });
    localStorage.setItem(CHAT_PANEL_SIZE_KEY, "not-json");
    expect(loadChatPanelSize()).toEqual({ width: CHAT_PANEL_MIN_W, height: CHAT_PANEL_MIN_H });
  });
});
