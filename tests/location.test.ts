import { describe, expect, it } from "vitest";
import { isCoordString, parseCoordString } from "@/src/core/location";

describe("location helpers", () => {
  it("should_detect_coord_string", () => {
    expect(isCoordString("22.3193, 114.1694")).toBe(true);
    expect(isCoordString("Clerkenwell, London")).toBe(false);
  });

  it("should_parse_coord_string", () => {
    expect(parseCoordString("22.3193, 114.1694")).toEqual({ lat: 22.3193, lng: 114.1694 });
  });
});
