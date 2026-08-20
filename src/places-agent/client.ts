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

const DEFAULT_TIMEOUT_MS = 25_000;
/** Agent vendor adapters can run up to 25s; leave headroom so the BFF does not abort first. */
const DEFAULT_SEARCH_TIMEOUT_MS = 60_000;

function timeoutMs(): number {
  const raw = Number(process.env.PLACES_AGENT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

function searchTimeoutMs(): number {
  const raw = process.env.PLACES_AGENT_SEARCH_TIMEOUT_MS;
  if (raw?.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return Math.max(timeoutMs(), DEFAULT_SEARCH_TIMEOUT_MS);
}

let injectedFetch: FetchFn | null = null;

export function setPlacesAgentFetchForTests(fn: FetchFn | null): void {
  injectedFetch = fn;
}

async function postV1<T>(
  tool: string,
  body: unknown,
  fetchFn: FetchFn = injectedFetch ?? fetch,
  requestTimeoutMs: number = timeoutMs(),
): Promise<AgentEnvelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
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
  } catch {
    return { agent: AGENT_ID, ok: false, outcome: { key: "errors.provider_failed" } };
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

type AgentGeocodeData = {
  lat: number;
  lng: number;
  crs: string;
  address?: string;
  label?: string;
};

export async function reverseGeocode(input: {
  lat: number;
  lng: number;
  locale: string;
  providers?: string[];
}): Promise<AgentEnvelope<GeocodeResult>> {
  const envelope = await postV1<AgentGeocodeData>("geocode", {
    lat: input.lat,
    lng: input.lng,
    locale: input.locale,
    providers: input.providers,
  });
  if (!envelope.data) return envelope as AgentEnvelope<GeocodeResult>;
  const label = envelope.data.label ?? envelope.data.address;
  return {
    ...envelope,
    data: {
      lat: envelope.data.lat,
      lng: envelope.data.lng,
      crs: envelope.data.crs,
      label,
    },
  };
}

export async function searchRestaurants(
  input: SearchRestaurantsInput,
): Promise<AgentEnvelope<PlaceCard[]>> {
  const enrich = process.env.W2E_ENRICH_TRIPADVISOR === "true";
  return postV1<PlaceCard[]>(
    "search_restaurants",
    {
      query: input.query,
      near: input.near,
      address: input.address,
      providers: input.providers,
      locale: input.locale,
      enrich: input.enrichTripadvisor ?? enrich ? { tripadvisor: true } : undefined,
    },
    injectedFetch ?? fetch,
    searchTimeoutMs(),
  );
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

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function chat(input: {
  messages: ChatMessage[];
  locale: string;
}): Promise<AgentEnvelope<{ message: { role: string; content: string; key?: string } }>> {
  return postV1("chat", { messages: input.messages, locale: input.locale });
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

import { isChinaMainland } from "../core/region";

export function providersForPin(lat: number, lng: number): string[] {
  if (isChinaMainland(lat, lng)) {
    return ["AMAP", "GOOGLE_MAPS"];
  }
  return defaultProviders();
}
