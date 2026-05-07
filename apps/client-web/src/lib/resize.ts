import type { BoardObject } from "@dexdraw/shared-protocol";

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

export interface ResizableBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_SIZE = 10;

/**
 * Returns the axis-aligned bounding box for resizable object types.
 * Returns null for stroke and text (no intrinsic resize box).
 */
export function getBoundsForObject(
  object: BoardObject,
): ResizableBounds | null {
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
  return null;
}

/**
 * Given an initial bounding box, a corner handle, and a pointer delta,
 * returns the new bounding box after resize. Clamps to minSize.
 */
export function applyResize(
  initial: ResizableBounds,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  minSize = MIN_SIZE,
): ResizableBounds {
  let { x, y, width, height } = initial;

  if (handle === "se") {
    width = Math.max(minSize, initial.width + dx);
    height = Math.max(minSize, initial.height + dy);
  } else if (handle === "ne") {
    width = Math.max(minSize, initial.width + dx);
    const newHeight = Math.max(minSize, initial.height - dy);
    y = initial.y + initial.height - newHeight;
    height = newHeight;
  } else if (handle === "sw") {
    const newWidth = Math.max(minSize, initial.width - dx);
    x = initial.x + initial.width - newWidth;
    width = newWidth;
    height = Math.max(minSize, initial.height + dy);
  } else {
    // nw
    const newWidth = Math.max(minSize, initial.width - dx);
    const newHeight = Math.max(minSize, initial.height - dy);
    x = initial.x + initial.width - newWidth;
    y = initial.y + initial.height - newHeight;
    width = newWidth;
    height = newHeight;
  }

  return { x, y, width, height };
}

/**
 * Converts bounds back into the object-type-specific patch fields.
 * rectangle/note: { x, y, width, height }
 * ellipse: { cx, cy, rx, ry }
 * All other types: {} (no-op).
 */
export function patchFromBounds(
  object: BoardObject,
  bounds: ResizableBounds,
): Record<string, number> {
  if (object.type === "rectangle" || object.type === "note") {
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }
  if (object.type === "ellipse") {
    return {
      cx: bounds.x + bounds.width / 2,
      cy: bounds.y + bounds.height / 2,
      rx: bounds.width / 2,
      ry: bounds.height / 2,
    };
  }
  return {};
}
