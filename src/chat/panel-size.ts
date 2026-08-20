/** Default / minimum list-chat panel size (22.5rem × 28rem at 16px root). */
export const CHAT_PANEL_MIN_W = 360;
export const CHAT_PANEL_MIN_H = 448;
export const CHAT_PANEL_MAX_W_REM = 36;
export const CHAT_PANEL_MAX_H_REM = 42;

export const CHAT_PANEL_SIZE_KEY = "w2e.chat.panelSize";

export type ChatPanelSize = { width: number; height: number };

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function chatPanelMaxSize(viewportW: number, viewportH: number): ChatPanelSize {
  return {
    width: Math.min(CHAT_PANEL_MAX_W_REM * 16, Math.max(CHAT_PANEL_MIN_W, viewportW - 32)),
    height: Math.min(CHAT_PANEL_MAX_H_REM * 16, Math.max(CHAT_PANEL_MIN_H, viewportH - 32)),
  };
}

/**
 * NW-corner resize: drag left/up grows the panel (bottom-right stays anchored).
 */
export function nextChatPanelSize(args: {
  startWidth: number;
  startHeight: number;
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
  viewportW: number;
  viewportH: number;
}): ChatPanelSize {
  const max = chatPanelMaxSize(args.viewportW, args.viewportH);
  const dw = args.startClientX - args.clientX;
  const dh = args.startClientY - args.clientY;
  return {
    width: clamp(args.startWidth + dw, CHAT_PANEL_MIN_W, max.width),
    height: clamp(args.startHeight + dh, CHAT_PANEL_MIN_H, max.height),
  };
}

export function clampChatPanelSize(
  size: ChatPanelSize,
  viewportW = typeof window !== "undefined" ? window.innerWidth : 1400,
  viewportH = typeof window !== "undefined" ? window.innerHeight : 900,
): ChatPanelSize {
  const max = chatPanelMaxSize(viewportW, viewportH);
  return {
    width: clamp(size.width, CHAT_PANEL_MIN_W, max.width),
    height: clamp(size.height, CHAT_PANEL_MIN_H, max.height),
  };
}

/** SSR-safe first paint — do not call `loadChatPanelSize` in `useState` (localStorage mismatch). */
export function defaultChatPanelSize(): ChatPanelSize {
  return { width: CHAT_PANEL_MIN_W, height: CHAT_PANEL_MIN_H };
}

export function loadChatPanelSize(): ChatPanelSize {
  const fallback = defaultChatPanelSize();
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(CHAT_PANEL_SIZE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as ChatPanelSize).width !== "number" ||
      typeof (parsed as ChatPanelSize).height !== "number"
    ) {
      return fallback;
    }
    return clampChatPanelSize(parsed as ChatPanelSize);
  } catch {
    return fallback;
  }
}

export function saveChatPanelSize(size: ChatPanelSize): void {
  try {
    if (typeof localStorage === "undefined") return;
    const clamped = clampChatPanelSize(size);
    localStorage.setItem(CHAT_PANEL_SIZE_KEY, JSON.stringify(clamped));
  } catch {
    /* ignore */
  }
}
