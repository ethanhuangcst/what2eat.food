import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authError, requireUser } from "@/src/auth/user";
import { csrfOk } from "@/src/auth/csrf";
import { normalizeLocale } from "@/src/core/locales";
import { buildListSystemContext, buildPlaceSystemContext } from "@/src/chat/build-system-context";
import { hydrateChatBlocks, parseAgentBlocks } from "@/src/chat/blocks";
import { chat } from "@/src/places-agent/client";
import { type ListChatPickRef } from "@/src/chat/types";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const pickRefSchema = z.object({
  name: z.string(),
  nativeId: z.string(),
  provider: z.string(),
  photoUrl: z.string().optional(),
  rating: z.number().optional(),
  category: z.string().optional(),
  mapUrl: z.string().optional(),
});

const listContextSchema = z.object({
  searchId: z.string().optional(),
  location: z.string().optional(),
  mealContext: z.string().optional(),
  budget: z.string().optional(),
  picks: z.array(pickRefSchema).optional(),
});

const placeContextSchema = z.object({
  provider: z.string().min(1),
  nativeId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  category: z.string().optional(),
  photoUrl: z.string().optional(),
  rating: z.number().optional(),
  mapUrl: z.string().optional(),
});

const bodySchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("list"),
    messages: z.array(messageSchema).min(1),
    context: listContextSchema,
  }),
  z.object({
    scope: z.literal("place"),
    messages: z.array(messageSchema).min(1),
    context: placeContextSchema,
  }),
]);

function hydratePicksForScope(
  scope: "list" | "place",
  context: z.infer<typeof listContextSchema> | z.infer<typeof placeContextSchema>,
): ListChatPickRef[] {
  if (scope === "list") {
    return (context as z.infer<typeof listContextSchema>).picks ?? [];
  }
  const place = context as z.infer<typeof placeContextSchema>;
  return [
    {
      name: place.name,
      nativeId: place.nativeId,
      provider: place.provider,
      photoUrl: place.photoUrl,
      rating: place.rating,
      category: place.category,
      mapUrl: place.mapUrl,
    },
  ];
}

export async function POST(request: NextRequest) {
  if (!csrfOk(request)) return authError("errors.csrf", 403);
  const gate = await requireUser(request);
  if ("error" in gate) return gate.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return authError("errors.validation", 400);

  const locale = normalizeLocale(gate.user.locale);
  const systemContent =
    parsed.data.scope === "list"
      ? buildListSystemContext(parsed.data.context)
      : buildPlaceSystemContext(parsed.data.context);

  const envelope = await chat({
    locale,
    messages: [{ role: "system", content: systemContent }, ...parsed.data.messages],
  });

  if (!envelope.ok || !envelope.data?.message?.content) {
    const key = envelope.outcome?.key ?? "errors.chat_failed";
    return NextResponse.json({ errorKey: key }, { status: 502 });
  }

  const msg = envelope.data.message;
  const { blocks: parsedBlocks, fallbackText } = parseAgentBlocks(msg.content);
  const picks = hydratePicksForScope(parsed.data.scope, parsed.data.context);
  const blocks = hydrateChatBlocks(parsedBlocks, picks);

  return NextResponse.json({
    reply: {
      role: "assistant" as const,
      content: fallbackText,
      fallbackText,
      blocks,
      key: msg.key,
    },
  });
}
