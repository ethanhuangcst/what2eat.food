import { describe, expect, it } from "vitest";
import { absoluteAppUrl, setPasswordUrl } from "../src/auth/public-url";

describe("public-url", () => {
  it("should_build_set_password_url_with_encoded_token", () => {
    const url = setPasswordUrl("token+special&chars");
    expect(url).toContain("/set-password?token=");
    expect(url).toContain(encodeURIComponent("token+special&chars"));
    expect(absoluteAppUrl("/login")).toMatch(/\/login$/);
  });

  it("should_default_base_strip_trailing_slash_and_prefix_path", () => {
    const prev = process.env.PUBLIC_BASE_URL;
    delete process.env.PUBLIC_BASE_URL;
    expect(absoluteAppUrl("login")).toBe("http://localhost:3020/login");
    process.env.PUBLIC_BASE_URL = "https://eat.example.com/";
    expect(absoluteAppUrl("/profile")).toBe("https://eat.example.com/profile");
    if (prev === undefined) delete process.env.PUBLIC_BASE_URL;
    else process.env.PUBLIC_BASE_URL = prev;
  });
});
