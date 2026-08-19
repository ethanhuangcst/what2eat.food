import { describe, expect, it } from "vitest";
import { absoluteAppUrl, setPasswordUrl } from "../src/auth/public-url";

describe("public-url", () => {
  it("should_build_set_password_url_with_encoded_token", () => {
    const url = setPasswordUrl("token+special&chars");
    expect(url).toContain("/set-password?token=");
    expect(url).toContain(encodeURIComponent("token+special&chars"));
    expect(absoluteAppUrl("/login")).toMatch(/\/login$/);
  });
});
