import type { BoardObject } from "@dexdraw/shared-protocol";
import { describe, expect, it } from "vitest";
import {
  MARQUEE_THRESHOLD,
  boundsForMarquee,
  normalizeRect,
  objectIntersectsMarquee,
  rectsIntersect,
} from "../lib/marquee";

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

const TEXT: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000003",
  type: "text",
  x: 50,
  y: 500,
  text: "Hello",
  style: { fontSize: 24 },
};

const NOTE: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000004",
  type: "note",
  x: 600,
  y: 100,
  width: 180,
  height: 110,
  text: "Note",
};

const STROKE: BoardObject = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000005",
  type: "stroke",
  points: [
    { x: 200, y: 700 },
    { x: 300, y: 750 },
    { x: 400, y: 720 },
  ],
  style: { color: "#000", width: 2 },
};

// ── normalizeRect ─────────────────────────────────────────────────────────────

describe("normalizeRect", () => {
  it("handles top-left to bottom-right drag", () => {
    expect(normalizeRect(10, 20, 110, 120)).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    });
  });

  it("handles bottom-right to top-left drag", () => {
    expect(normalizeRect(110, 120, 10, 20)).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    });
  });

  it("handles top-right to bottom-left drag", () => {
    expect(normalizeRect(110, 20, 10, 120)).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    });
  });

  it("handles bottom-left to top-right drag", () => {
    expect(normalizeRect(10, 120, 110, 20)).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    });
  });

  it("returns zero size for same point", () => {
    expect(normalizeRect(50, 50, 50, 50)).toEqual({
      x: 50,
      y: 50,
      width: 0,
      height: 0,
    });
  });
});

// ── boundsForMarquee ──────────────────────────────────────────────────────────

describe("boundsForMarquee", () => {
  it("returns x/y/width/height for rectangle", () => {
    expect(boundsForMarquee(RECT)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    });
  });

  it("returns bounding box for ellipse", () => {
    expect(boundsForMarquee(ELLIPSE)).toEqual({
      x: 300,
      y: 250,
      width: 200,
      height: 100,
    });
  });

  it("returns x/y/width/height for note", () => {
    expect(boundsForMarquee(NOTE)).toEqual({
      x: 600,
      y: 100,
      width: 180,
      height: 110,
    });
  });

  it("returns approximate bounding box for text using fontSize and char width", () => {
    const bounds = boundsForMarquee(TEXT);
    // TEXT: x=50, y=500, fontSize=24, text="Hello" (5 chars)
    // expected: y = 500 - 24 = 476, width = 5 * 24 * 0.6 = 72
    expect(bounds.x).toBe(50);
    expect(bounds.y).toBe(476);
    expect(bounds.width).toBeCloseTo(72);
    expect(bounds.height).toBe(24);
  });

  it("returns point-cloud bounding box for stroke", () => {
    expect(boundsForMarquee(STROKE)).toEqual({
      x: 200,
      y: 700,
      width: 200,
      height: 50,
    });
  });

  it("uses at least width=1 for single-character text", () => {
    const single: BoardObject = {
      ...BASE,
      id: "00000000-0000-4000-8000-000000000099",
      type: "text",
      x: 0,
      y: 0,
      text: "",
      style: { fontSize: 18 },
    };
    expect(boundsForMarquee(single).width).toBeGreaterThanOrEqual(1);
  });
});

// ── rectsIntersect ────────────────────────────────────────────────────────────

describe("rectsIntersect", () => {
  const A = { x: 0, y: 0, width: 100, height: 100 };

  it("returns true for overlapping rects", () => {
    expect(rectsIntersect(A, { x: 50, y: 50, width: 100, height: 100 })).toBe(
      true,
    );
  });

  it("returns true for fully contained rect", () => {
    expect(rectsIntersect(A, { x: 10, y: 10, width: 20, height: 20 })).toBe(
      true,
    );
  });

  it("returns true for edge-touching rects", () => {
    expect(rectsIntersect(A, { x: 100, y: 0, width: 50, height: 100 })).toBe(
      true,
    );
  });

  it("returns false for non-overlapping rects (right of A)", () => {
    expect(rectsIntersect(A, { x: 101, y: 0, width: 50, height: 100 })).toBe(
      false,
    );
  });

  it("returns false for non-overlapping rects (below A)", () => {
    expect(rectsIntersect(A, { x: 0, y: 101, width: 50, height: 50 })).toBe(
      false,
    );
  });

  it("returns false for completely disjoint rects", () => {
    expect(rectsIntersect(A, { x: 200, y: 200, width: 50, height: 50 })).toBe(
      false,
    );
  });
});

// ── objectIntersectsMarquee ───────────────────────────────────────────────────

describe("objectIntersectsMarquee", () => {
  it("returns true when marquee covers rectangle", () => {
    const marquee = { x: 50, y: 50, width: 300, height: 300 };
    expect(objectIntersectsMarquee(RECT, marquee)).toBe(true);
  });

  it("returns false when marquee is entirely outside rectangle", () => {
    const marquee = { x: 400, y: 400, width: 100, height: 100 };
    expect(objectIntersectsMarquee(RECT, marquee)).toBe(false);
  });

  it("returns true when marquee partially overlaps rectangle", () => {
    const marquee = { x: 0, y: 0, width: 150, height: 150 };
    expect(objectIntersectsMarquee(RECT, marquee)).toBe(true);
  });

  it("returns true when marquee covers ellipse bounding box", () => {
    const marquee = { x: 250, y: 200, width: 300, height: 200 };
    expect(objectIntersectsMarquee(ELLIPSE, marquee)).toBe(true);
  });

  it("returns false when marquee misses ellipse", () => {
    const marquee = { x: 0, y: 0, width: 50, height: 50 };
    expect(objectIntersectsMarquee(ELLIPSE, marquee)).toBe(false);
  });

  it("returns true when marquee covers stroke bounding box", () => {
    const marquee = { x: 150, y: 650, width: 300, height: 150 };
    expect(objectIntersectsMarquee(STROKE, marquee)).toBe(true);
  });

  it("returns false when marquee misses stroke", () => {
    const marquee = { x: 0, y: 0, width: 100, height: 100 };
    expect(objectIntersectsMarquee(STROKE, marquee)).toBe(false);
  });

  it("returns true when marquee covers text approximate box", () => {
    // TEXT at x=50, y=500, fontSize=24 → box y=476..500
    const marquee = { x: 0, y: 450, width: 200, height: 100 };
    expect(objectIntersectsMarquee(TEXT, marquee)).toBe(true);
  });
});

// ── threshold constant ────────────────────────────────────────────────────────

describe("MARQUEE_THRESHOLD", () => {
  it("is a positive number", () => {
    expect(MARQUEE_THRESHOLD).toBeGreaterThan(0);
  });
});
