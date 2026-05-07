import type { BoardObject } from "@dexdraw/shared-protocol";

export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Minimum drag distance (SVG units) before a marquee is treated as a real selection, not a click. */
export const MARQUEE_THRESHOLD = 4;

/**
 * Normalises two arbitrary corner points into a top-left-origin bounding rect.
 * Works regardless of which corner the drag started from.
 */
export function normalizeRect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): MarqueeRect {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    width: Math.abs(bx - ax),
    height: Math.abs(by - ay),
  };
}

/**
 * Returns the axis-aligned bounding box used for marquee intersection.
 * Covers all object types, including text (approximate) and stroke (point cloud).
 */
export function boundsForMarquee(object: BoardObject): MarqueeRect {
  if (object.type === "rectangle" || object.type === "note") {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }
  if (object.type === "ellipse") {
    return {
      x: object.cx - object.rx,
      y: object.cy - object.ry,
      width: object.rx * 2,
      height: object.ry * 2,
    };
  }
  if (object.type === "text") {
    const fontSize = object.style.fontSize ?? 18;
    const width = Math.max(1, object.text.length * fontSize * 0.6);
    return { x: object.x, y: object.y - fontSize, width, height: fontSize };
  }
  // stroke: point-cloud bounding box
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of object.points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Returns true if two axis-aligned rectangles overlap (including edge-touching). */
export function rectsIntersect(a: MarqueeRect, b: MarqueeRect): boolean {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}

/** Returns true if a board object's bounding box intersects the given marquee rect. */
export function objectIntersectsMarquee(
  object: BoardObject,
  marquee: MarqueeRect,
): boolean {
  return rectsIntersect(boundsForMarquee(object), marquee);
}
