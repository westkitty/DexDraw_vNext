import type { BoardObject } from "@dexdraw/shared-protocol";
import { describe, expect, it } from "vitest";
import {
  applyResize,
  getBoundsForObject,
  patchFromBounds,
} from "../lib/resize";

const BASE = {
  createdBy: "test",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
  zIndex: 0,
};

const RECT: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000001",
  type: "rectangle",
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  style: {},
};

const ELLIPSE: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000002",
  type: "ellipse",
  cx: 400,
  cy: 300,
  rx: 100,
  ry: 50,
  style: {},
};

const NOTE: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000003",
  type: "note",
  x: 50,
  y: 50,
  width: 180,
  height: 110,
  text: "Note",
};

const TEXT: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000004",
  type: "text",
  x: 200,
  y: 200,
  text: "Hello",
  style: {},
};

const STROKE: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000005",
  type: "stroke",
  points: [
    { x: 10, y: 10 },
    { x: 50, y: 50 },
  ],
  style: { color: "#000", width: 2 },
};

// ── getBoundsForObject ──────────────────────────────────────────────────────

describe("getBoundsForObject", () => {
  it("returns bounds for a rectangle", () => {
    expect(getBoundsForObject(RECT)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    });
  });

  it("returns bounds for a note", () => {
    expect(getBoundsForObject(NOTE)).toEqual({
      x: 50,
      y: 50,
      width: 180,
      height: 110,
    });
  });

  it("returns bounding box for an ellipse derived from cx/cy/rx/ry", () => {
    // ellipse at cx=400, cy=300, rx=100, ry=50
    expect(getBoundsForObject(ELLIPSE)).toEqual({
      x: 300,
      y: 250,
      width: 200,
      height: 100,
    });
  });

  it("returns null for text (no intrinsic resize box)", () => {
    expect(getBoundsForObject(TEXT)).toBeNull();
  });

  it("returns null for stroke (no intrinsic resize box)", () => {
    expect(getBoundsForObject(STROKE)).toBeNull();
  });
});

// ── applyResize ────────────────────────────────────────────────────────────

const INITIAL = { x: 100, y: 100, width: 200, height: 100 };

describe("applyResize — SE handle", () => {
  it("increases width and height when dragging SE outward", () => {
    const result = applyResize(INITIAL, "se", 50, 30);
    expect(result).toEqual({ x: 100, y: 100, width: 250, height: 130 });
  });

  it("decreases size when dragging SE inward but does not go below minSize", () => {
    const result = applyResize(INITIAL, "se", -300, -300);
    expect(result.width).toBeGreaterThanOrEqual(10);
    expect(result.height).toBeGreaterThanOrEqual(10);
    // origin should not move for SE
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });
});

describe("applyResize — NW handle", () => {
  it("moves origin and shrinks box when dragging NW inward", () => {
    const result = applyResize(INITIAL, "nw", 50, 30);
    expect(result.width).toBe(150);
    expect(result.height).toBe(70);
    // origin shifts right/down by the same amount
    expect(result.x).toBe(150);
    expect(result.y).toBe(130);
  });

  it("moves origin and grows box when dragging NW outward", () => {
    const result = applyResize(INITIAL, "nw", -50, -30);
    expect(result.width).toBe(250);
    expect(result.height).toBe(130);
    expect(result.x).toBe(50);
    expect(result.y).toBe(70);
  });

  it("clamps at minSize for NW", () => {
    const result = applyResize(INITIAL, "nw", 500, 500);
    expect(result.width).toBeGreaterThanOrEqual(10);
    expect(result.height).toBeGreaterThanOrEqual(10);
  });
});

describe("applyResize — NE handle", () => {
  it("extends width and moves y-origin when dragging NE", () => {
    const result = applyResize(INITIAL, "ne", 50, -30);
    expect(result.width).toBe(250);
    expect(result.height).toBe(130);
    expect(result.x).toBe(100);
    expect(result.y).toBe(70);
  });
});

describe("applyResize — SW handle", () => {
  it("moves x-origin and extends height when dragging SW", () => {
    const result = applyResize(INITIAL, "sw", -50, 30);
    expect(result.width).toBe(250);
    expect(result.height).toBe(130);
    expect(result.x).toBe(50);
    expect(result.y).toBe(100);
  });
});

// ── patchFromBounds ─────────────────────────────────────────────────────────

describe("patchFromBounds", () => {
  it("returns x/y/width/height patch for a rectangle", () => {
    const bounds = { x: 120, y: 130, width: 180, height: 90 };
    expect(patchFromBounds(RECT, bounds)).toEqual({
      x: 120,
      y: 130,
      width: 180,
      height: 90,
    });
  });

  it("returns x/y/width/height patch for a note", () => {
    const bounds = { x: 60, y: 70, width: 200, height: 120 };
    expect(patchFromBounds(NOTE, bounds)).toEqual({
      x: 60,
      y: 70,
      width: 200,
      height: 120,
    });
  });

  it("returns cx/cy/rx/ry patch for an ellipse", () => {
    const bounds = { x: 300, y: 250, width: 200, height: 100 };
    expect(patchFromBounds(ELLIPSE, bounds)).toEqual({
      cx: 400,
      cy: 300,
      rx: 100,
      ry: 50,
    });
  });

  it("returns empty patch for text (non-resizable)", () => {
    const bounds = { x: 0, y: 0, width: 100, height: 50 };
    expect(patchFromBounds(TEXT, bounds)).toEqual({});
  });

  it("round-trips: getBounds → patchFromBounds restores original ellipse fields", () => {
    const bounds = getBoundsForObject(ELLIPSE);
    if (!bounds) throw new Error("expected bounds");
    const patch = patchFromBounds(ELLIPSE, bounds);
    expect(patch.cx).toBeCloseTo(ELLIPSE.cx);
    expect(patch.cy).toBeCloseTo(ELLIPSE.cy);
    expect(patch.rx).toBeCloseTo(ELLIPSE.rx);
    expect(patch.ry).toBeCloseTo(ELLIPSE.ry);
  });
});
