import { afterEach, describe, expect, it } from "vitest";
import { chatTimeoutMs } from "@/src/places-agent/client";

describe("chatTimeoutMs", () => {
  const prevChat = process.env.PLACES_AGENT_CHAT_TIMEOUT_MS;
  const prevGeneral = process.env.PLACES_AGENT_TIMEOUT_MS;

  afterEach(() => {
    if (prevChat === undefined) delete process.env.PLACES_AGENT_CHAT_TIMEOUT_MS;
    else process.env.PLACES_AGENT_CHAT_TIMEOUT_MS = prevChat;
    if (prevGeneral === undefined) delete process.env.PLACES_AGENT_TIMEOUT_MS;
    else process.env.PLACES_AGENT_TIMEOUT_MS = prevGeneral;
  });

  it("should_default_to_at_least_90s_even_when_general_timeout_is_25s", () => {
    process.env.PLACES_AGENT_TIMEOUT_MS = "25000";
    delete process.env.PLACES_AGENT_CHAT_TIMEOUT_MS;
    expect(chatTimeoutMs()).toBe(90_000);
  });

  it("should_honor_PLACES_AGENT_CHAT_TIMEOUT_MS_override", () => {
    process.env.PLACES_AGENT_CHAT_TIMEOUT_MS = "120000";
    expect(chatTimeoutMs()).toBe(120_000);
  });
});
