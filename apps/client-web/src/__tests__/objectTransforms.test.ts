import type { BoardObject } from "@dexdraw/shared-protocol";
import { describe, expect, it } from "vitest";
import { computeArrange, duplicateObject } from "../lib/objectTransforms";

const BASE = {
  createdBy: "test",
  createdAt: "2026-05-07T00:00:00.000Z",
  updatedAt: "2026-05-07T00:00:00.000Z",
};

function makeRect(id: string, zIndex: number, x = 0, y = 0): BoardObject {
  return {
    ...BASE,
    id,
    type: "rectangle",
    x,
    y,
    width: 100,
    height: 100,
    zIndex,
    style: {},
  };
}

function makeEllipse(id: string, zIndex: number): BoardObject {
  return {
    ...BASE,
    id,
    type: "ellipse",
    cx: 200,
    cy: 200,
    rx: 50,
    ry: 30,
    zIndex,
    style: {},
  };
}

function makeStroke(id: string, zIndex: number): BoardObject {
  return {
    ...BASE,
    id,
    type: "stroke",
    points: [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ],
    zIndex,
    style: { color: "#000", width: 2 },
  };
}

function makeNote(id: string, zIndex: number): BoardObject {
  return {
    ...BASE,
    id,
    type: "note",
    x: 0,
    y: 0,
    width: 180,
    height: 110,
    text: "note",
    zIndex,
  };
}

function makeText(id: string, zIndex: number): BoardObject {
  return {
    ...BASE,
    id,
    type: "text",
    x: 0,
    y: 0,
    text: "hello",
    zIndex,
    style: { fontSize: 18 },
  };
}

// Shorthand: build a 5-object array A..E with z=0..4
function fiveObjects(): BoardObject[] {
  return [
    makeRect("A", 0),
    makeRect("B", 1),
    makeRect("C", 2),
    makeRect("D", 3),
    makeRect("E", 4),
  ];
}

function idOrder(changes: Array<{ id: string; nextZIndex: number }>): string[] {
  // Reconstruct the full order after changes
  return changes.sort((a, b) => a.nextZIndex - b.nextZIndex).map((c) => c.id);
}

// ── computeArrange ────────────────────────────────────────────────────────────

describe("computeArrange — front", () => {
  it("moves selected to highest z, preserving relative order", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["B", "D"], "front");
    // Expected new order: A C E B D
    const changedMap = new Map(changes.map((c) => [c.id, c.nextZIndex]));
    // B and D should be higher than A, C, E
    expect(changedMap.get("B")).toBeGreaterThan(changedMap.get("E") ?? -1);
    // B should be below D (preserve relative order B < D)
    expect(changedMap.get("B")).toBeLessThan(changedMap.get("D") ?? -1);
  });

  it("assigns dense 0..N-1 zIndices", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["C"], "front");
    const allZ = objects.map((o) => {
      const ch = changes.find((c) => c.id === o.id);
      return ch ? ch.nextZIndex : o.zIndex;
    });
    const sorted = [...allZ].sort((a, b) => a - b);
    expect(sorted).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns empty when all objects are selected", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["A", "B", "C", "D", "E"], "front");
    expect(changes).toHaveLength(0);
  });
});

describe("computeArrange — back", () => {
  it("moves selected to lowest z, preserving relative order", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["B", "D"], "back");
    const changedMap = new Map(changes.map((c) => [c.id, c.nextZIndex]));
    // B and D should be lower than A, C, E
    expect(changedMap.get("D")).toBeLessThan(changedMap.get("A") ?? 99);
    // B < D (preserve relative order)
    expect(changedMap.get("B")).toBeLessThan(changedMap.get("D") ?? -1);
  });

  it("returns empty when all selected", () => {
    const objects = fiveObjects();
    expect(
      computeArrange(objects, ["A", "B", "C", "D", "E"], "back"),
    ).toHaveLength(0);
  });
});

describe("computeArrange — forward", () => {
  it("moves single selected one step up (swaps with item above)", () => {
    const objects = fiveObjects();
    // C is at index 2; D is the next non-selected at index 3
    const changes = computeArrange(objects, ["C"], "forward");
    const changedMap = new Map(changes.map((c) => [c.id, c.nextZIndex]));
    // C should now be above D
    expect(changedMap.get("C")).toBeGreaterThan(changedMap.get("D") ?? -1);
    // A and B should be unchanged (or same relative positions below)
    const cZ = changedMap.get("C") ?? 2;
    const dZ = changedMap.get("D") ?? 3;
    expect(cZ).toBe(3);
    expect(dZ).toBe(2);
  });

  it("moves multi-select group one step up as a unit", () => {
    const objects = fiveObjects();
    // B and C are selected, D is the first non-selected above
    const changes = computeArrange(objects, ["B", "C"], "forward");
    const changedMap = new Map(changes.map((c) => [c.id, c.nextZIndex]));
    // B and C should both be above D now
    expect(changedMap.get("B")).toBeGreaterThan(changedMap.get("D") ?? -1);
    expect(changedMap.get("C")).toBeGreaterThan(changedMap.get("D") ?? -1);
  });

  it("returns empty when selected is already at top", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["E"], "forward");
    expect(changes).toHaveLength(0);
  });

  it("returns empty when all selected (no non-selected to swap with)", () => {
    const objects = fiveObjects();
    const changes = computeArrange(
      objects,
      ["A", "B", "C", "D", "E"],
      "forward",
    );
    expect(changes).toHaveLength(0);
  });
});

describe("computeArrange — backward", () => {
  it("moves single selected one step down (swaps with item below)", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["C"], "backward");
    const changedMap = new Map(changes.map((c) => [c.id, c.nextZIndex]));
    expect(changedMap.get("C")).toBe(1);
    expect(changedMap.get("B")).toBe(2);
  });

  it("moves multi-select group one step down as a unit", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["B", "C"], "backward");
    const changedMap = new Map(changes.map((c) => [c.id, c.nextZIndex]));
    // A should now be above B and C
    expect(changedMap.get("A")).toBeGreaterThan(changedMap.get("B") ?? -1);
    expect(changedMap.get("A")).toBeGreaterThan(changedMap.get("C") ?? -1);
  });

  it("returns empty when selected is already at bottom", () => {
    const objects = fiveObjects();
    const changes = computeArrange(objects, ["A"], "backward");
    expect(changes).toHaveLength(0);
  });
});

describe("computeArrange — edge cases", () => {
  it("returns empty when no objects", () => {
    expect(computeArrange([], ["A"], "front")).toHaveLength(0);
  });

  it("returns empty when no selectedIds", () => {
    expect(computeArrange(fiveObjects(), [], "front")).toHaveLength(0);
  });

  it("handles non-dense input zIndices", () => {
    const objects = [makeRect("A", 0), makeRect("B", 10), makeRect("C", 100)];
    const changes = computeArrange(objects, ["A"], "front");
    const changedMap = new Map(changes.map((c) => [c.id, c.nextZIndex]));
    // A should be highest, output should be dense 0..2
    expect(changedMap.get("A")).toBe(2);
    const allZ = objects.map((o) => changedMap.get(o.id) ?? o.zIndex);
    const sorted = [...allZ].sort((a, b) => a - b);
    expect(sorted).toEqual([0, 1, 2]);
  });
});

// ── duplicateObject ───────────────────────────────────────────────────────────

const NOW = "2026-05-07T12:00:00.000Z";

describe("duplicateObject — position offset", () => {
  it("offsets rectangle x/y by 24", () => {
    const rect = makeRect("r1", 0, 100, 200);
    const dup = duplicateObject(rect, "r2", 1, NOW, "User");
    if (dup.type !== "rectangle") throw new Error("wrong type");
    expect(dup.x).toBe(124);
    expect(dup.y).toBe(224);
  });

  it("respects custom offset", () => {
    const rect = makeRect("r1", 0, 50, 50);
    const dup = duplicateObject(rect, "r2", 1, NOW, "User", 8);
    if (dup.type !== "rectangle") throw new Error("wrong type");
    expect(dup.x).toBe(58);
    expect(dup.y).toBe(58);
  });

  it("offsets ellipse cx/cy", () => {
    const ell = makeEllipse("e1", 0);
    const dup = duplicateObject(ell, "e2", 1, NOW, "User");
    if (dup.type !== "ellipse") throw new Error("wrong type");
    expect(dup.cx).toBe(224);
    expect(dup.cy).toBe(224);
  });

  it("translates all stroke points", () => {
    const stroke = makeStroke("s1", 0);
    const dup = duplicateObject(stroke, "s2", 1, NOW, "User");
    if (dup.type !== "stroke") throw new Error("wrong type");
    expect(dup.points[0]).toMatchObject({ x: 34, y: 34 });
    expect(dup.points[1]).toMatchObject({ x: 44, y: 44 });
  });

  it("offsets text x/y", () => {
    const txt = makeText("t1", 0);
    const dup = duplicateObject(txt, "t2", 1, NOW, "User");
    if (dup.type !== "text") throw new Error("wrong type");
    expect(dup.x).toBe(24);
    expect(dup.y).toBe(24);
  });

  it("offsets note x/y", () => {
    const note = makeNote("n1", 0);
    const dup = duplicateObject(note, "n2", 1, NOW, "User");
    if (dup.type !== "note") throw new Error("wrong type");
    expect(dup.x).toBe(24);
    expect(dup.y).toBe(24);
  });
});

describe("duplicateObject — metadata", () => {
  it("uses the provided new id", () => {
    const rect = makeRect("r1", 0);
    const dup = duplicateObject(rect, "new-uuid", 5, NOW, "Alice");
    expect(dup.id).toBe("new-uuid");
  });

  it("uses the provided zIndex", () => {
    const rect = makeRect("r1", 0);
    const dup = duplicateObject(rect, "new-uuid", 7, NOW, "Alice");
    expect(dup.zIndex).toBe(7);
  });

  it("uses the provided createdBy and timestamps", () => {
    const rect = makeRect("r1", 0);
    const dup = duplicateObject(rect, "new-uuid", 1, NOW, "Alice");
    expect(dup.createdBy).toBe("Alice");
    expect(dup.createdAt).toBe(NOW);
    expect(dup.updatedAt).toBe(NOW);
  });

  it("preserves style fields", () => {
    const rect: BoardObject = {
      ...BASE,
      id: "r1",
      type: "rectangle",
      x: 0,
      y: 0,
      width: 80,
      height: 60,
      zIndex: 0,
      style: { strokeColor: "#ff0000", fillColor: "#00ff00" },
    };
    const dup = duplicateObject(rect, "r2", 1, NOW, "Alice");
    if (dup.type !== "rectangle") throw new Error("wrong type");
    expect(dup.style.strokeColor).toBe("#ff0000");
    expect(dup.style.fillColor).toBe("#00ff00");
    expect(dup.width).toBe(80);
    expect(dup.height).toBe(60);
  });
});
