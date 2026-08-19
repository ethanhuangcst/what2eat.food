import { describe, expect, it } from "vitest";
import { htmlLang, isLocale, normalizeLocale } from "../src/core/locales";

describe("locales", () => {
  it("should_normalize_invalid_locale_to_en", () => {
    expect(normalizeLocale("XX")).toBe("EN");
    expect(normalizeLocale(null)).toBe("EN");
  });

  it("should_map_html_lang_per_locale", () => {
    expect(htmlLang("CN")).toBe("zh-CN");
    expect(htmlLang("HK")).toBe("zh-HK");
    expect(htmlLang("TW")).toBe("zh-TW");
    expect(htmlLang("EN")).toBe("en");
  });

  it("should_recognize_supported_locales", () => {
    expect(isLocale("HK")).toBe(true);
    expect(isLocale("FR")).toBe(false);
  });
});
