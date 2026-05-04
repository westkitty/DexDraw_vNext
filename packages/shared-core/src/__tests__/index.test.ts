import { describe, expect, it } from "vitest";
import { boundsFromPoints, normalizeStroke } from "../index";

describe("shared-core", () => {
  it("calculates bounds from points", () => {
    expect(
      boundsFromPoints([
        { x: 10, y: 12 },
        { x: -5, y: 15 },
        { x: 4, y: -1 },
      ]),
    ).toEqual({
      x: -5,
      y: -1,
      width: 15,
      height: 16,
    });
  });

  it("normalizes strokes deterministically by quantizing and removing consecutive duplicates", () => {
    expect(
      normalizeStroke([
        { x: 10.124, y: 5.876, pressure: 0.2 },
        { x: 10.1241, y: 5.8761, pressure: 0.3 },
        { x: 18.334, y: 9.331, pressure: 0.9 },
      ]),
    ).toEqual([
      { x: 10.12, y: 5.88, pressure: 0.2 },
      { x: 18.33, y: 9.33, pressure: 0.9 },
    ]);
  });
});
