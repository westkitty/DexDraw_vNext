import type { BoardObject } from "@dexdraw/shared-protocol";
import { describe, expect, it } from "vitest";
import { hitTestObjects } from "../lib/hitTest";

const BASE = {
  createdBy: "test",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
};

const RECT: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000001",
  type: "rectangle",
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  zIndex: 0,
  style: {},
};

const ELLIPSE: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000002",
  type: "ellipse",
  cx: 400,
  cy: 300,
  rx: 100,
  ry: 50,
  zIndex: 1,
  style: {},
};

const TEXT: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000003",
  type: "text",
  x: 50,
  y: 500,
  text: "Hello",
  zIndex: 2,
  style: { color: "#111827", fontSize: 24 },
};

const NOTE: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000004",
  type: "note",
  x: 600,
  y: 100,
  width: 180,
  height: 110,
  text: "My note",
  zIndex: 3,
};

const STROKE: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000005",
  type: "stroke",
  points: [
    { x: 200, y: 700, pressure: 0.5 },
    { x: 300, y: 750, pressure: 0.5 },
    { x: 400, y: 720, pressure: 0.5 },
  ],
  zIndex: 4,
  style: { color: "#111827", width: 3 },
};

const ALL = [RECT, ELLIPSE, TEXT, NOTE, STROKE];

describe("hitTestObjects", () => {
  it("returns null for an empty list", () => {
    expect(hitTestObjects([], 200, 200)).toBeNull();
  });

  it("hits inside a rectangle", () => {
    expect(hitTestObjects(ALL, 150, 150)?.id).toBe(RECT.id);
  });

  it("misses outside a rectangle", () => {
    expect(hitTestObjects([RECT], 50, 50)).toBeNull();
  });

  it("hits inside an ellipse", () => {
    expect(hitTestObjects(ALL, 400, 300)?.id).toBe(ELLIPSE.id);
  });

  it("misses outside an ellipse", () => {
    expect(hitTestObjects([ELLIPSE], 400, 400)).toBeNull();
  });

  it("hits inside a note", () => {
    expect(hitTestObjects(ALL, 650, 150)?.id).toBe(NOTE.id);
  });

  it("misses outside a note", () => {
    expect(hitTestObjects([NOTE], 850, 150)).toBeNull();
  });

  it("hits approximately inside a text object", () => {
    // TEXT is at x=50 y=500 (baseline), fontSize=24, text="Hello" (5 chars)
    // approx bounding box: x:50..50+5*24*0.6=122, y:476..500
    expect(hitTestObjects([TEXT], 80, 490)?.id).toBe(TEXT.id);
  });

  it("hits near a stroke segment", () => {
    // segment from (200,700) to (300,750): midpoint is (250, 725)
    expect(hitTestObjects([STROKE], 250, 725)?.id).toBe(STROKE.id);
  });

  it("misses far from a stroke", () => {
    expect(hitTestObjects([STROKE], 200, 500)).toBeNull();
  });

  it("returns the top-most (highest zIndex) object when two overlap", () => {
    const low: BoardObject = { ...RECT, zIndex: 0 };
    const high: BoardObject = {
      ...BASE,
      id: "00000000-0000-0000-0000-000000000099",
      type: "rectangle",
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      zIndex: 10,
      style: {},
    };
    expect(hitTestObjects([low, high], 150, 150)?.id).toBe(high.id);
  });
});
