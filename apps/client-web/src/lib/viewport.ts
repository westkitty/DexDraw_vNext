import type { BoardObject } from "@dexdraw/shared-protocol";
import { getBoundsForObject } from "./resize";

export type ViewportState = {
  zoom: number;
  pan: { x: number; y: number };
};

export const DEFAULT_VIEWPORT: ViewportState = {
  zoom: 1.0,
  pan: { x: 0, y: 0 },
};

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;
export const BASE_WIDTH = 1600;
export const BASE_HEIGHT = 900;

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

export function clientToBoardCoordinates(
  clientX: number,
  clientY: number,
  svgRect: { left: number; top: number; width: number; height: number },
  pan: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  if (svgRect.width <= 0 || svgRect.height <= 0) {
    return { x: pan.x, y: pan.y };
  }
  const normX = (clientX - svgRect.left) / svgRect.width;
  const normY = (clientY - svgRect.top) / svgRect.height;
  return {
    x: pan.x + normX * (BASE_WIDTH / zoom),
    y: pan.y + normY * (BASE_HEIGHT / zoom),
  };
}

export function zoomAtClientPoint(
  currentZoom: number,
  targetZoom: number,
  currentPan: { x: number; y: number },
  pointerClientX: number,
  pointerClientY: number,
  svgRect: { left: number; top: number; width: number; height: number },
): ViewportState {
  const newZoom = clampZoom(targetZoom);
  if (svgRect.width <= 0 || svgRect.height <= 0) {
    return { zoom: newZoom, pan: currentPan };
  }

  const normX = (pointerClientX - svgRect.left) / svgRect.width;
  const normY = (pointerClientY - svgRect.top) / svgRect.height;

  // The point on the canvas under the pointer must remain under the pointer after zoom
  const boardX = currentPan.x + normX * (BASE_WIDTH / currentZoom);
  const boardY = currentPan.y + normY * (BASE_HEIGHT / currentZoom);

  const newPanX = boardX - normX * (BASE_WIDTH / newZoom);
  const newPanY = boardY - normY * (BASE_HEIGHT / newZoom);

  return {
    zoom: newZoom,
    pan: { x: Math.round(newPanX), y: Math.round(newPanY) },
  };
}

export function fitContentToViewport(objects: BoardObject[]): ViewportState {
  if (objects.length === 0) {
    return DEFAULT_VIEWPORT;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const obj of objects) {
    const b = getBoundsForObject(obj);
    if (b) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
  }

  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) {
    return DEFAULT_VIEWPORT;
  }

  const padding = 80;
  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  const zoomX = BASE_WIDTH / contentWidth;
  const zoomY = BASE_HEIGHT / contentHeight;
  const targetZoom = clampZoom(Math.min(zoomX, zoomY, 1.5));

  const viewBoxW = BASE_WIDTH / targetZoom;
  const viewBoxH = BASE_HEIGHT / targetZoom;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    zoom: targetZoom,
    pan: {
      x: Math.round(centerX - viewBoxW / 2),
      y: Math.round(centerY - viewBoxH / 2),
    },
  };
}
