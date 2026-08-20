import { afterEach, describe, expect, it, vi } from "vitest";
import {
  placesAgentBaseUrl,
  placesAgentCallerKey,
  placesAgentTarget,
} from "@/src/places-agent/config";

const ENV_KEYS = [
  "PLACES_AGENT_TARGET",
  "PLACES_AGENT_BASE_URL",
  "PLACES_AGENT_BASE_URL_LOCAL",
  "PLACES_AGENT_BASE_URL_PROD",
  "PLACES_AGENT_CALLER_KEY",
  "PLACES_AGENT_CALLER_KEY_LOCAL",
  "PLACES_AGENT_CALLER_KEY_PROD",
] as const;

function clearAgentEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("placesAgentTarget", () => {
  afterEach(() => {
    clearAgentEnv();
    vi.unstubAllEnvs();
  });

  it("should_default_to_local_when_target_unset", () => {
    expect(placesAgentTarget()).toBe("local");
  });

  it("should_use_prod_when_target_is_prod", () => {
    vi.stubEnv("PLACES_AGENT_TARGET", "prod");
    expect(placesAgentTarget()).toBe("prod");
  });

  it("should_resolve_local_url_and_key_from_per_target_vars", () => {
    vi.stubEnv("PLACES_AGENT_TARGET", "local");
    vi.stubEnv("PLACES_AGENT_BASE_URL_LOCAL", "http://localhost:3010/");
    vi.stubEnv("PLACES_AGENT_CALLER_KEY_LOCAL", "pa_local");
    expect(placesAgentBaseUrl()).toBe("http://localhost:3010");
    expect(placesAgentCallerKey()).toBe("pa_local");
  });

  it("should_resolve_prod_url_and_key_from_per_target_vars", () => {
    vi.stubEnv("PLACES_AGENT_TARGET", "production");
    vi.stubEnv("PLACES_AGENT_BASE_URL_PROD", "https://places.agent-mate.ai/");
    vi.stubEnv("PLACES_AGENT_CALLER_KEY_PROD", "pa_prod");
    expect(placesAgentBaseUrl()).toBe("https://places.agent-mate.ai");
    expect(placesAgentCallerKey()).toBe("pa_prod");
  });

  it("should_fall_back_to_legacy_base_url_and_caller_key", () => {
    vi.stubEnv("PLACES_AGENT_TARGET", "local");
    vi.stubEnv("PLACES_AGENT_BASE_URL", "http://legacy:3010");
    vi.stubEnv("PLACES_AGENT_CALLER_KEY", "pa_legacy");
    expect(placesAgentBaseUrl()).toBe("http://legacy:3010");
    expect(placesAgentCallerKey()).toBe("pa_legacy");
  });

  it("should_prefer_per_target_vars_over_legacy", () => {
    vi.stubEnv("PLACES_AGENT_TARGET", "prod");
    vi.stubEnv("PLACES_AGENT_BASE_URL", "http://legacy:3010");
    vi.stubEnv("PLACES_AGENT_BASE_URL_PROD", "https://places.agent-mate.ai");
    vi.stubEnv("PLACES_AGENT_CALLER_KEY", "pa_legacy");
    vi.stubEnv("PLACES_AGENT_CALLER_KEY_PROD", "pa_prod");
    expect(placesAgentBaseUrl()).toBe("https://places.agent-mate.ai");
    expect(placesAgentCallerKey()).toBe("pa_prod");
  });
});
