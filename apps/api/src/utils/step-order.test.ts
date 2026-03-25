import { describe, expect, it } from "vitest";

import { clampPosition } from "./step-order";

describe("clampPosition", () => {
  it("defaults to the last position when undefined", () => {
    expect(clampPosition(undefined, 1, 4)).toBe(4);
  });

  it("keeps values inside range", () => {
    expect(clampPosition(2, 1, 4)).toBe(2);
  });

  it("clamps values below the minimum", () => {
    expect(clampPosition(0, 1, 4)).toBe(1);
  });

  it("clamps values above the maximum", () => {
    expect(clampPosition(8, 1, 4)).toBe(4);
  });
});
