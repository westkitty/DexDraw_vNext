import type { BoardObject } from "@dexdraw/shared-protocol";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEWPORT,
  clampZoom,
  clientToBoardCoordinates,
  fitContentToViewport,
  zoomAtClientPoint,
} from "../lib/viewport";

describe("viewport calculations", () => {
  const dummyRect = { left: 100, top: 50, width: 800, height: 450 };

  it("clientToBoardCoordinates transforms correctly under default 1x zoom", () => {
    // Top-left corner
    const p1 = clientToBoardCoordinates(
      100,
      50,
      dummyRect,
      { x: 0, y: 0 },
      1.0,
    );
    expect(p1.x).toBeCloseTo(0);
    expect(p1.y).toBeCloseTo(0);

    // Center
    const p2 = clientToBoardCoordinates(
      500,
      275,
      dummyRect,
      { x: 0, y: 0 },
      1.0,
    );
    expect(p2.x).toBeCloseTo(800);
    expect(p2.y).toBeCloseTo(450);

    // Bottom-right corner
    const p3 = clientToBoardCoordinates(
      900,
      500,
      dummyRect,
      { x: 0, y: 0 },
      1.0,
    );
    expect(p3.x).toBeCloseTo(1600);
    expect(p3.y).toBeCloseTo(900);
  });

  it("clientToBoardCoordinates accounts for pan and zoom", () => {
    // Zoomed 2x, panned by (100, 100)
    const p = clientToBoardCoordinates(
      500,
      275,
      dummyRect,
      { x: 100, y: 100 },
      2.0,
    );
    expect(p.x).toBeCloseTo(100 + 400); // 500
    expect(p.y).toBeCloseTo(100 + 225); // 325
  });

  it("clamps zoom within bounds [0.25, 4.0]", () => {
    expect(clampZoom(0.05)).toBe(0.25);
    expect(clampZoom(10)).toBe(4.0);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  it("zoomAtClientPoint keeps pointer focal point stationary on the board", () => {
    const pointerX = 300;
    const pointerY = 200;
    const initialZoom = 1.0;
    const initialPan = { x: 0, y: 0 };

    const boardBefore = clientToBoardCoordinates(
      pointerX,
      pointerY,
      dummyRect,
      initialPan,
      initialZoom,
    );

    const next = zoomAtClientPoint(
      initialZoom,
      2.0,
      initialPan,
      pointerX,
      pointerY,
      dummyRect,
    );

    const boardAfter = clientToBoardCoordinates(
      pointerX,
      pointerY,
      dummyRect,
      next.pan,
      next.zoom,
    );

    expect(boardAfter.x).toBeCloseTo(boardBefore.x, 0);
    expect(boardAfter.y).toBeCloseTo(boardBefore.y, 0);
  });

  it("fitContentToViewport returns default for empty objects", () => {
    expect(fitContentToViewport([])).toEqual(DEFAULT_VIEWPORT);
  });

  it("fitContentToViewport frames objects properly", () => {
    const objects: BoardObject[] = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        type: "rectangle",
        x: 200,
        y: 200,
        width: 400,
        height: 300,
        style: {},
        createdBy: "user",
        createdAt: "2026-05-04T00:00:00.000Z",
        updatedAt: "2026-05-04T00:00:00.000Z",
        zIndex: 0,
      },
    ];

    const vp = fitContentToViewport(objects);
    expect(vp.zoom).toBeGreaterThanOrEqual(0.25);
    expect(vp.zoom).toBeLessThanOrEqual(4.0);
  });
});
