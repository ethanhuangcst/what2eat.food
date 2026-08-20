import { type ListChatContext, type PlaceChatContext } from "./types";

const BLOCKS_INSTRUCTION = [
  "Reply with a single JSON object only (no prose outside JSON), shape:",
  '{"blocks":[{"type":"paragraph","text":"..."},{"type":"pick_ref","provider":"AMAP","nativeId":"...","note":"..."}],"fallbackText":"..."}',
  "Every block MUST include a top-level \"type\" field (paragraph | heading | list | pick_ref | link).",
  "Do not nest as {\"paragraph\":{...}} — use {\"type\":\"paragraph\",\"text\":\"...\"}.",
  "",
  "Card-first UX (critical):",
  "- Any restaurant you mention MUST be a pick_ref block with exact provider + nativeId from tool results or Current picks.",
  "- Keep prose minimal: at most 1–2 short paragraph sentences total. Prefer one short lead + pick_ref cards.",
  "- Do NOT dump address, lat/lng, category enums, price tables, or long bullet fact sheets in text — the UI card shows name/rating/photo/map.",
  "- Optional note on pick_ref: one short phrase (e.g. fit reason), not a full address.",
  "- Do not invent photo URLs or map URLs.",
  "- Reply as a suggestion only — not verified menu, hours, or allergen facts.",
].join("\n");

export function buildListSystemContext(ctx: ListChatContext): string {
  const picks =
    ctx.picks?.map((p) => `${p.name} (${p.provider}:${p.nativeId})`).join(", ") ?? "none yet";
  return [
    "You are helping the user with their current Decide restaurant short list.",
    `Area: ${ctx.location ?? "unknown"}`,
    `Meal context: ${ctx.mealContext ?? "unknown"}`,
    `Budget: ${ctx.budget ?? "unknown"}`,
    `Search id: ${ctx.searchId ?? "none"}`,
    `Current picks: ${picks}`,
    BLOCKS_INSTRUCTION,
  ].join("\n");
}

export function buildPlaceSystemContext(ctx: PlaceChatContext): string {
  return [
    "You are helping the user about one restaurant in the place details dialog.",
    `Place: ${ctx.name}`,
    `Provider native id: ${ctx.provider}:${ctx.nativeId}`,
    ctx.address ? `Address: ${ctx.address}` : "",
    ctx.category ? `Category: ${ctx.category}` : "",
    "When answering about this place or nearby options, lead with pick_ref cards; keep prose to 1–2 short sentences.",
    BLOCKS_INSTRUCTION,
  ]
    .filter(Boolean)
    .join("\n");
}
