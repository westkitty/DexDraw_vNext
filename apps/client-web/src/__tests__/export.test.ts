import type { BoardObject } from "@dexdraw/shared-protocol";
import { describe, expect, it } from "vitest";
import { boardToMarkdown } from "../lib/export";

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
