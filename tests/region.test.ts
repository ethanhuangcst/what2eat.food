import { describe, expect, it } from "vitest";
import { isChinaMainland, vendorRegionForPin } from "@/src/core/region";

describe("region", () => {
  it("should_treat_shanghai_as_cn_mainland", () => {
    expect(isChinaMainland(31.23, 121.47)).toBe(true);
    expect(vendorRegionForPin(31.23, 121.47)).toBe("cn_mainland");
  });

  it("should_exclude_hong_kong_from_mainland", () => {
    expect(isChinaMainland(22.32, 114.17)).toBe(false);
    expect(vendorRegionForPin(22.32, 114.17)).toBe("overseas");
  });

  it("should_treat_london_as_overseas", () => {
    expect(isChinaMainland(51.52, -0.1)).toBe(false);
    expect(vendorRegionForPin(51.52, -0.1)).toBe("overseas");
  });
});
