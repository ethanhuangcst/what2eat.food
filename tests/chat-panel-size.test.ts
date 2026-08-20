import { describe, expect, it } from "vitest";
import {
  CHAT_PANEL_MIN_H,
  CHAT_PANEL_MIN_W,
  nextChatPanelSize,
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
    expect(next.width).toBe(468); // 500 - 32
    expect(next.height).toBe(568); // 600 - 32
  });
});
