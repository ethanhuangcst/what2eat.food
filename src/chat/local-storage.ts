import { type ChatTurn } from "./types";

export const CHAT_PREFIX = "w2e.chat.";

function storage(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  return globalThis.localStorage ?? null;
}

export function listChatKey(searchId: string): string {
  return `${CHAT_PREFIX}list.${searchId}`;
}

export function placeChatKey(provider: string, nativeId: string): string {
  return `${CHAT_PREFIX}place.${provider}:${nativeId}`;
}

function isChatTurn(t: unknown): t is ChatTurn {
  if (typeof t !== "object" || t === null) return false;
  const row = t as ChatTurn;
  if (row.role !== "user" && row.role !== "assistant") return false;
  if (typeof row.content === "string") return true;
  if (Array.isArray(row.blocks) && row.blocks.length > 0) return true;
  return false;
}

function normalizeTurn(t: ChatTurn): ChatTurn {
  if (typeof t.content === "string" && t.content.length > 0) return t;
  const fallback = t.fallbackText ?? "";
  return { ...t, content: fallback || "[message]" };
}

export function readTranscript(key: string): ChatTurn[] {
  const raw = storage()?.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChatTurn).map(normalizeTurn);
  } catch {
    return [];
  }
}

export function writeTranscript(key: string, turns: ChatTurn[]): void {
  storage()?.setItem(key, JSON.stringify(turns));
}

export function appendTurn(key: string, turn: ChatTurn): ChatTurn[] {
  const next = [...readTranscript(key), normalizeTurn(turn)];
  writeTranscript(key, next);
  return next;
}

export function clearAllChatStorage(): void {
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith(CHAT_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => store.removeItem(k));
}

/** Plain content for agent message history. */
export function turnPlainContent(turn: ChatTurn): string {
  return turn.content || turn.fallbackText || "";
}
