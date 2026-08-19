import { describe, expect, it } from "vitest";
import { t, catalogs } from "@/src/i18n/catalog";

const REGISTER_FIELD_KEYS = [
  "eat.errors.name_required",
  "eat.errors.email_required",
  "eat.errors.email_invalid",
  "eat.errors.email_taken",
  "eat.errors.password_required",
  "eat.errors.password_too_short",
  "eat.errors.password_mismatch",
  "eat.errors.age_required",
  "eat.errors.age_out_of_range",
  "eat.errors.photo_too_large",
  "eat.errors.network",
] as const;

describe("i18n catalogs", () => {
  it("should_differ_hk_and_tw_on_pinned_key", () => {
    expect(catalogs.HK["eat.home.headline"]).not.toBe(catalogs.TW["eat.home.headline"]);
  });

  it("should_interpolate_vars", () => {
    expect(t("EN", "eat.header.hello", { name: "Mei" })).toContain("Mei");
  });

  it("should_define_register_field_errors_in_all_locales", () => {
    for (const locale of ["EN", "CN", "HK", "TW"] as const) {
      for (const key of REGISTER_FIELD_KEYS) {
        expect(catalogs[locale][key], `${locale} missing ${key}`).toBeTruthy();
      }
    }
  });
});
