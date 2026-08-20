import { AGENT_ID } from "@/src/core/locales";
import { setPlacesAgentFetchForTests, type FetchFn } from "@/src/places-agent/client";
import { type AgentEnvelope, type PlaceCard } from "@/src/places-agent/types";

type Handler = (body: unknown) => Omit<AgentEnvelope<unknown>, "agent">;

export function installAgentMock(handlers: Record<string, Handler>): () => void {
  const fetchFn: FetchFn = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const tool = url.split("/v1/")[1]?.split("?")[0] ?? "";
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const handler = handlers[tool];
    if (!handler) {
      return new Response(
        JSON.stringify({
          agent: AGENT_ID,
          ok: false,
          outcome: { key: "errors.provider_failed" },
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      );
    }
    const envelope = handler(body);
    return new Response(JSON.stringify({ agent: AGENT_ID, locale: "EN", ...envelope }), {
      status: envelope.ok === false ? 502 : 200,
      headers: { "content-type": "application/json" },
    });
  };
  setPlacesAgentFetchForTests(fetchFn);
  return () => setPlacesAgentFetchForTests(null);
}

export const SAMPLE_PLACE_A: PlaceCard = {
  provider: "GOOGLE_MAPS",
  name: "St. JOHN",
  address: "26 St John Street, London",
  location: { lat: 51.522, lng: -0.102, crs: "WGS84" },
  rating: 4.6,
  category: "restaurant",
  sources: [{ provider: "GOOGLE_MAPS", native_id: "ChIJ-place-a" }],
};

export const SAMPLE_PLACE_B: PlaceCard = {
  provider: "GOOGLE_MAPS",
  name: "Dishoom",
  address: "12 Upper St Martin's Lane, London",
  location: { lat: 51.513, lng: -0.127, crs: "WGS84" },
  rating: 4.4,
  category: "indian_restaurant",
  sources: [{ provider: "GOOGLE_MAPS", native_id: "ChIJ-place-b" }],
};

export const SAMPLE_PLACE_C: PlaceCard = {
  provider: "GOOGLE_MAPS",
  name: "Bao",
  address: "53 Lexington Street, London",
  location: { lat: 51.514, lng: -0.136, crs: "WGS84" },
  rating: 4.3,
  category: "restaurant",
  sources: [{ provider: "GOOGLE_MAPS", native_id: "ChIJ-place-c" }],
};

export function defaultSearchHandlers(cards: PlaceCard[] = [SAMPLE_PLACE_A, SAMPLE_PLACE_B, SAMPLE_PLACE_C]) {
  return {
    geocode: () => ({
      ok: true,
      data: { lat: 51.523, lng: -0.105, crs: "WGS84", address: "Clerkenwell, London" },
    }),
    search_restaurants: () => ({ ok: true, data: cards }),
    get_place_details: (body: unknown) => {
      const { native_id } = body as { native_id: string };
      const card = cards.find((c) => c.sources[0]?.native_id === native_id);
      if (!card) return { ok: false, outcome: { key: "errors.provider_failed" } };
      return { ok: true, data: card };
    },
    chat: () => ({
      ok: true,
      data: {
        message: { role: "assistant", content: "Here are lighter options nearby from your current list." },
      },
    }),
  } satisfies Record<string, Handler>;
}
