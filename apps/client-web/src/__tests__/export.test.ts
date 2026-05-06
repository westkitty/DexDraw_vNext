import type { BoardObject } from "@dexdraw/shared-protocol";
import { describe, expect, it } from "vitest";
import { boardToMarkdown, boundsFromBoardObjects } from "../lib/export";

const BASE = {
  createdBy: "test",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
};

const TEXT_A: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000001",
  type: "text",
  x: 100,
  y: 100,
  text: "Hello World",
  zIndex: 0,
  style: { color: "#111827", fontSize: 24 },
};

const NOTE_A: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000002",
  type: "note",
  x: 200,
  y: 200,
  width: 180,
  height: 110,
  text: "Important note\nSecond line",
  zIndex: 1,
};

const RECT_A: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000003",
  type: "rectangle",
  x: 10,
  y: 10,
  width: 100,
  height: 50,
  zIndex: 2,
  style: {},
};

const STROKE_A: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000004",
  type: "stroke",
  points: [
    { x: 0, y: 0, pressure: 0.5 },
    { x: 10, y: 10, pressure: 0.5 },
  ],
  zIndex: 3,
  style: { color: "#111827", width: 3 },
};

describe("boardToMarkdown", () => {
  it("returns a heading for an empty board", () => {
    const md = boardToMarkdown([]);
    expect(md).toContain("# DexDraw Board");
  });

  it("renders text objects as paragraphs", () => {
    const md = boardToMarkdown([TEXT_A]);
    expect(md).toContain("Hello World");
  });

  it("renders note objects as blockquotes", () => {
    const md = boardToMarkdown([NOTE_A]);
    expect(md).toContain("> Important note");
    expect(md).toContain("> Second line");
  });

  it("renders rectangles as horizontal rules", () => {
    const md = boardToMarkdown([RECT_A]);
    expect(md).toContain("---");
  });

  it("skips strokes and ellipses", () => {
    const md = boardToMarkdown([STROKE_A]);
    expect(md).not.toContain("0,0");
  });

  it("orders output by zIndex", () => {
    const md = boardToMarkdown([NOTE_A, TEXT_A]);
    const textPos = md.indexOf("Hello World");
    const notePos = md.indexOf("> Important note");
    expect(textPos).toBeLessThan(notePos);
  });

  it("renders multi-line notes with each line prefixed", () => {
    const md = boardToMarkdown([NOTE_A]);
    const lines = md.split("\n");
    const noteLines = lines.filter((l) => l.startsWith(">"));
    expect(noteLines).toHaveLength(2);
  });
});

const ELLIPSE_A: BoardObject = {
  ...BASE,
  id: "00000000-0000-0000-0000-000000000005",
  type: "ellipse",
  cx: 150,
  cy: 100,
  rx: 50,
  ry: 30,
  zIndex: 0,
  style: {},
};

describe("boundsFromBoardObjects", () => {
  it("returns null for an empty array", () => {
    expect(boundsFromBoardObjects([])).toBeNull();
  });

  it("returns null for an empty array with padding", () => {
    expect(boundsFromBoardObjects([], 20)).toBeNull();
  });

  it("computes bounds for a rectangle", () => {
    // RECT_A: x=10, y=10, w=100, h=50 → right=110, bottom=60
    const b = boundsFromBoardObjects([RECT_A]);
    expect(b).toEqual({ x: 10, y: 10, width: 100, height: 50 });
  });

  it("applies padding to a rectangle", () => {
    const b = boundsFromBoardObjects([RECT_A], 10);
    expect(b).toEqual({ x: 0, y: 0, width: 120, height: 70 });
  });

  it("computes bounds for an ellipse", () => {
    // cx=150, cy=100, rx=50, ry=30 → x=100, y=70, w=100, h=60
    const b = boundsFromBoardObjects([ELLIPSE_A]);
    expect(b).toEqual({ x: 100, y: 70, width: 100, height: 60 });
  });

  it("computes bounds for a stroke (point cloud)", () => {
    // STROKE_A: points (0,0) and (10,10)
    const b = boundsFromBoardObjects([STROKE_A]);
    expect(b).toEqual({ x: 0, y: 0, width: 10, height: 10 });
  });

  it("computes bounds for a note", () => {
    // NOTE_A: x=200, y=200, w=180, h=110
    const b = boundsFromBoardObjects([NOTE_A]);
    expect(b).toEqual({ x: 200, y: 200, width: 180, height: 110 });
  });

  it("computes bounds for a text object (degenerate point)", () => {
    // TEXT_A: x=100, y=100 — no size
    const b = boundsFromBoardObjects([TEXT_A]);
    expect(b).toEqual({ x: 100, y: 100, width: 0, height: 0 });
  });

  it("unions bounds across multiple object types", () => {
    // RECT_A: x=10..110, y=10..60
    // TEXT_A: x=100, y=100 (point)
    // combined: x=10..110, y=10..100 → w=100, h=90
    const b = boundsFromBoardObjects([RECT_A, TEXT_A]);
    expect(b).toEqual({ x: 10, y: 10, width: 100, height: 90 });
  });

  it("unions stroke, ellipse, note, and text together", () => {
    // STROKE_A: 0..10 × 0..10
    // ELLIPSE_A: 100..200 × 70..130
    // NOTE_A: 200..380 × 200..310
    // TEXT_A: 100 × 100 (point)
    // combined: x=0..380, y=0..310 → w=380, h=310
    const b = boundsFromBoardObjects([STROKE_A, ELLIPSE_A, NOTE_A, TEXT_A]);
    expect(b).toEqual({ x: 0, y: 0, width: 380, height: 310 });
  });

  it("padding expands bounds symmetrically", () => {
    const b = boundsFromBoardObjects([ELLIPSE_A], 5);
    // base: x=100, y=70, w=100, h=60; padding 5 → x=95, y=65, w=110, h=70
    expect(b).toEqual({ x: 95, y: 65, width: 110, height: 70 });
  });
});
