import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  DECIDE_DEFAULT_BUDGET,
  DECIDE_DEFAULT_LOCATION,
  decideFormSsrDefaults,
  mayApplyProfileDefault,
  readDecideDraft,
  resolveDecideField,
  writeDecideDraft,
} from "@/src/core/decide-draft";

describe("decideFormSsrDefaults", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  });

  it("should_ignore_session_drafts_so_ssr_and_client_first_paint_match", () => {
    writeDecideDraft("location", "中環");
    writeDecideDraft("meal", "Business meal");
    writeDecideDraft("budget", "$");
    writeDecideDraft("craving", "牛排");
    expect(readDecideDraft("location")).toBe("中環");
    expect(decideFormSsrDefaults()).toEqual({
      location: DECIDE_DEFAULT_LOCATION,
      budget: DECIDE_DEFAULT_BUDGET,
      craving: "",
    });
    expect(decideFormSsrDefaults().location).not.toBe(readDecideDraft("location"));
  });
});

describe("resolveDecideField", () => {
  it("should_prefer_url_over_draft_and_profile", () => {
    expect(
      resolveDecideField({
        urlValue: "Central",
        draftValue: "Draft",
        criteriaValue: "Cache",
        profileOrDefault: "Profile",
        touched: false,
      }),
    ).toBe("Central");
  });

  it("should_prefer_draft_over_criteria_and_profile", () => {
    expect(
      resolveDecideField({
        urlValue: null,
        draftValue: "Draft Area",
        criteriaValue: "Cache",
        profileOrDefault: "Profile",
        touched: false,
      }),
    ).toBe("Draft Area");
  });

  it("should_prefer_criteria_over_profile_when_no_draft", () => {
    expect(
      resolveDecideField({
        urlValue: null,
        draftValue: null,
        criteriaValue: "From cache",
        profileOrDefault: "Profile",
        touched: false,
      }),
    ).toBe("From cache");
  });

  it("should_return_null_when_touched_so_caller_keeps_state", () => {
    expect(
      resolveDecideField({
        urlValue: null,
        draftValue: "Draft",
        criteriaValue: "Cache",
        profileOrDefault: "Profile",
        touched: true,
      }),
    ).toBeNull();
  });

  it("should_allow_empty_draft_string", () => {
    expect(
      resolveDecideField({
        urlValue: null,
        draftValue: "",
        criteriaValue: "Cache",
        profileOrDefault: "Profile",
        touched: false,
      }),
    ).toBe("");
  });
});

describe("mayApplyProfileDefault", () => {
  it("should_block_when_draft_or_touched_or_url", () => {
    expect(mayApplyProfileDefault({ urlValue: null, draftValue: null, touched: false })).toBe(true);
    expect(mayApplyProfileDefault({ urlValue: "x", draftValue: null, touched: false })).toBe(false);
    expect(mayApplyProfileDefault({ urlValue: null, draftValue: "d", touched: false })).toBe(false);
    expect(mayApplyProfileDefault({ urlValue: null, draftValue: null, touched: true })).toBe(false);
  });
});
