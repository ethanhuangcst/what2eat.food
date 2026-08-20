import { pickMapUrl } from "@/src/core/map-links";
import { type PlaceSource } from "@/src/places-agent/types";
import { type ChatBlock, type HydratedPickRef, type ListChatPickRef } from "./types";

const HTTPS = /^https:/i;

export function isSafeHttpsUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function asObject(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

const BLOCK_KINDS = ["paragraph", "heading", "list", "pick_ref", "link"] as const;

/**
 * Normalize one agent block: either `{type, ...fields}` or nested `{paragraph:{text}}`
 * (LLMs often emit the nested shape from "paragraph{text}" prose in the system prompt).
 */
function normalizeBlockObject(raw: unknown): Record<string, unknown> | null {
  const o = asObject(raw);
  if (!o) return null;
  if (typeof o.type === "string") return o;
  for (const kind of BLOCK_KINDS) {
    if (kind in o) {
      const nested = asObject(o[kind]);
      if (nested) return { type: kind, ...nested };
    }
  }
  return null;
}

function parseOneBlock(raw: unknown): ChatBlock | null {
  const o = normalizeBlockObject(raw);
  if (!o || typeof o.type !== "string") return null;
  switch (o.type) {
    case "paragraph":
      return typeof o.text === "string" && o.text.trim() ? { type: "paragraph", text: o.text } : null;
    case "heading": {
      const level = o.level === 2 || o.level === 3 ? o.level : null;
      if (!level || typeof o.text !== "string" || !o.text.trim()) return null;
      return { type: "heading", level, text: o.text };
    }
    case "list":
      if (!Array.isArray(o.items)) return null;
      {
        const items = o.items.filter((i): i is string => typeof i === "string" && i.trim().length > 0);
        return items.length ? { type: "list", items } : null;
      }
    case "pick_ref":
      if (typeof o.provider !== "string" || typeof o.nativeId !== "string") return null;
      if (!o.provider.trim() || !o.nativeId.trim()) return null;
      return {
        type: "pick_ref",
        provider: o.provider,
        nativeId: o.nativeId,
        note: typeof o.note === "string" ? o.note : undefined,
      };
    case "link":
      if (typeof o.label !== "string" || typeof o.href !== "string") return null;
      if (!o.label.trim() || !isSafeHttpsUrl(o.href)) return null;
      return { type: "link", label: o.label, href: o.href };
    default:
      return null;
  }
}

/** Extract JSON object from raw agent text (plain or fenced). */
export function extractJsonObject(raw: string): unknown | null {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

export function parseAgentBlocks(raw: string): { blocks: ChatBlock[]; fallbackText: string } {
  const parsed = extractJsonObject(raw);
  const root = asObject(parsed);
  if (root && Array.isArray(root.blocks)) {
    const blocks = root.blocks.map(parseOneBlock).filter((b): b is ChatBlock => b !== null);
    if (blocks.length > 0) {
      const fallback =
        typeof root.fallbackText === "string" && root.fallbackText.trim()
          ? root.fallbackText
          : blocksToPlainText(blocks);
      return { blocks, fallbackText: fallback };
    }
  }
  return {
    blocks: [{ type: "paragraph", text: raw }],
    fallbackText: raw,
  };
}

export function blocksToPlainText(blocks: ChatBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "paragraph":
        case "heading":
          return b.text;
        case "list":
          return b.items.map((i) => `- ${i}`).join("\n");
        case "pick_ref":
          return b.name ? `${b.name}${b.note ? ` — ${b.note}` : ""}` : `${b.provider}:${b.nativeId}`;
        case "link":
          return `${b.label}: ${b.href}`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

export function hydrateChatBlocks(
  blocks: ChatBlock[],
  picks: ListChatPickRef[],
): ChatBlock[] {
  const byKey = new Map(picks.map((p) => [`${p.provider}:${p.nativeId}`, p]));
  return blocks.map((block) => {
    if (block.type !== "pick_ref") {
      if (block.type === "link" && !isSafeHttpsUrl(block.href)) {
        return { type: "paragraph", text: block.label };
      }
      return block;
    }
    const hit = byKey.get(`${block.provider}:${block.nativeId}`);
    if (!hit) {
      return {
        type: "paragraph" as const,
        text: block.note?.trim() || `${block.provider}:${block.nativeId}`,
      };
    }
    const mapUrl = hit.mapUrl ?? (hit.sources ? pickMapUrl(hit.sources) : null);
    const hydrated: HydratedPickRef = {
      type: "pick_ref",
      provider: hit.provider,
      nativeId: hit.nativeId,
      note: block.note,
      name: hit.name,
      photoUrl: hit.photoUrl && HTTPS.test(hit.photoUrl) ? hit.photoUrl : undefined,
      rating: hit.rating,
      category: hit.category,
      mapUrl: mapUrl && isSafeHttpsUrl(mapUrl) ? mapUrl : undefined,
    };
    return hydrated;
  });
}

export function picksFromListContext(
  picks: {
    name: string;
    nativeId: string;
    provider: string;
    photoUrl?: string;
    rating?: number;
    category?: string;
    sources?: PlaceSource[];
    mapUrl?: string;
  }[],
): ListChatPickRef[] {
  return picks.map((p) => ({
    name: p.name,
    nativeId: p.nativeId,
    provider: p.provider,
    photoUrl: p.photoUrl,
    rating: p.rating,
    category: p.category,
    sources: p.sources,
    mapUrl: p.mapUrl,
  }));
}

/** Map places-agent tool cards into hydrate refs (chat-03). */
export function picksFromAgentPlaces(
  places: {
    name: string;
    provider: string;
    rating?: number;
    category?: string;
    photos?: string[];
    sources: PlaceSource[];
  }[],
): ListChatPickRef[] {
  const out: ListChatPickRef[] = [];
  for (const card of places) {
    const nativeId = card.sources[0]?.native_id;
    if (!nativeId) continue;
    const mapUrl = pickMapUrl(card.sources);
    const photo = card.photos?.[0];
    out.push({
      name: card.name,
      nativeId,
      provider: card.provider,
      photoUrl: photo && HTTPS.test(photo) ? photo : undefined,
      rating: card.rating,
      category: card.category,
      sources: card.sources,
      mapUrl: mapUrl && isSafeHttpsUrl(mapUrl) ? mapUrl : undefined,
    });
  }
  return out;
}

/** Context picks win; agent tool places fill gaps. */
export function mergeHydratePicks(
  contextPicks: ListChatPickRef[],
  agentPlaces: ListChatPickRef[],
): ListChatPickRef[] {
  const byKey = new Map<string, ListChatPickRef>();
  for (const p of agentPlaces) byKey.set(`${p.provider}:${p.nativeId}`, p);
  for (const p of contextPicks) byKey.set(`${p.provider}:${p.nativeId}`, p);
  return [...byKey.values()];
}
