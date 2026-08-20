import "server-only";
import { AGENT_ID } from "../core/locales";
import { placesAgentBaseUrl, placesAgentCallerKey } from "./config";
import {
  type AgentEnvelope,
  type GeocodeResult,
  type PlaceCard,
  type SearchRestaurantsInput,
} from "./types";

export type FetchFn = typeof fetch;

export { placesAgentBaseUrl, placesAgentCallerKey, placesAgentTarget } from "./config";

function timeoutMs(): number {
  return Number(process.env.PLACES_AGENT_TIMEOUT_MS ?? 25000);
}

let injectedFetch: FetchFn | null = null;

export function setPlacesAgentFetchForTests(fn: FetchFn | null): void {
  injectedFetch = fn;
}

async function postV1<T>(
  tool: string,
  body: unknown,
  fetchFn: FetchFn = injectedFetch ?? fetch,
): Promise<AgentEnvelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const res = await fetchFn(`${placesAgentBaseUrl()}/v1/${tool}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${placesAgentCallerKey()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let envelope: AgentEnvelope<T>;
    try {
      envelope = (text ? JSON.parse(text) : { agent: AGENT_ID, ok: false }) as AgentEnvelope<T>;
    } catch {
      return { agent: AGENT_ID, ok: false, outcome: { key: "errors.provider_failed" } };
    }
    if (envelope.agent !== AGENT_ID) {
      throw new Error("Invalid agent response");
    }
    if (!res.ok && envelope.ok !== false) {
      return { ...envelope, ok: false };
    }
    return envelope;
  } finally {
    clearTimeout(timer);
  }
}

export async function geocode(input: {
  address: string;
  locale: string;
  providers?: string[];
}): Promise<AgentEnvelope<GeocodeResult>> {
  return postV1<GeocodeResult>("geocode", {
    query: input.address,
    locale: input.locale,
    providers: input.providers,
  });
}

export async function searchRestaurants(
  input: SearchRestaurantsInput,
): Promise<AgentEnvelope<PlaceCard[]>> {
  const enrich = process.env.W2E_ENRICH_TRIPADVISOR === "true";
  return postV1<PlaceCard[]>("search_restaurants", {
    query: input.query,
    near: input.near,
    address: input.address,
    providers: input.providers,
    locale: input.locale,
    enrich: input.enrichTripadvisor ?? enrich ? { tripadvisor: true } : undefined,
  });
}

export async function getPlaceDetails(input: {
  provider: string;
  native_id: string;
  locale: string;
}): Promise<AgentEnvelope<PlaceCard>> {
  return postV1<PlaceCard>("get_place_details", input);
}

export async function navigate(input: {
  provider: string;
  native_id: string;
  locale: string;
}): Promise<AgentEnvelope<{ url: string }>> {
  return postV1<{ url: string }>("navigate", input);
}

export function defaultProviders(): string[] {
  try {
    const raw = process.env.W2E_DEFAULT_PROVIDERS ?? '["GOOGLE_MAPS"]';
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return ["GOOGLE_MAPS"];
}

export function providersForPin(lat: number, lng: number): string[] {
  if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) {
    return ["AMAP", "GOOGLE_MAPS"];
  }
  return defaultProviders();
}
