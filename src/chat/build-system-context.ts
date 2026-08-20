import { type ListChatContext, type PlaceChatContext } from "./types";

const BLOCKS_INSTRUCTION = [
  "Reply with a single JSON object only (no prose outside JSON), shape:",
  '{"blocks":[...],"fallbackText":"..."}',
  "Allowed block types: paragraph{text}, heading{level:2|3,text}, list{items:string[]},",
  "pick_ref{provider,nativeId,note?}, link{label,href} (https only).",
  "When recommending restaurants from the current context, use pick_ref with exact provider+nativeId.",
  "Do not invent photo URLs or map URLs.",
  "Reply as a suggestion only — not verified menu, hours, or allergen facts.",
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
    BLOCKS_INSTRUCTION,
  ]
    .filter(Boolean)
    .join("\n");
}
