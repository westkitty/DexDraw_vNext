import type { BoardObject } from "@dexdraw/shared-protocol";

const STROKE_HIT_RADIUS = 10;

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function hitTestOne(object: BoardObject, x: number, y: number): boolean {
  if (object.type === "stroke") {
    const { points } = object;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (!a || !b) continue;
      if (distanceToSegment(x, y, a.x, a.y, b.x, b.y) <= STROKE_HIT_RADIUS) {
        return true;
      }
    }
    return false;
  }

  if (object.type === "rectangle") {
    return (
      x >= object.x &&
      x <= object.x + object.width &&
      y >= object.y &&
      y <= object.y + object.height
    );
  }

  if (object.type === "ellipse") {
    const dx = (x - object.cx) / object.rx;
    const dy = (y - object.cy) / object.ry;
    return dx * dx + dy * dy <= 1;
  }

  if (object.type === "text") {
    const fontSize = object.style.fontSize ?? 18;
    const charCount = object.text.length;
    const width = charCount * fontSize * 0.6;
    return (
      x >= object.x &&
      x <= object.x + width &&
      y >= object.y - fontSize &&
      y <= object.y
    );
  }

  if (object.type === "note") {
    return (
      x >= object.x &&
      x <= object.x + object.width &&
      y >= object.y &&
      y <= object.y + object.height
    );
  }

  return false;
}

export function hitTestObjects(
  objects: BoardObject[],
  x: number,
  y: number,
): BoardObject | null {
  const sorted = [...objects].sort((a, b) => b.zIndex - a.zIndex);
  for (const object of sorted) {
    if (hitTestOne(object, x, y)) {
      return object;
    }
  }
  return null;
}
