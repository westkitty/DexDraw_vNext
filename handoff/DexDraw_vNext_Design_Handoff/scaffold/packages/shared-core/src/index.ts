export type Point = { x: number; y: number; pressure?: number };

export type Bounds = { x: number; y: number; width: number; height: number };

export function boundsFromPoints(points: Point[]): Bounds {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function normalizeStroke(points: Point[]): Point[] {
  // Codex: replace with deterministic resample/smooth/quantize implementation.
  return points.map((p) => ({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, pressure: p.pressure }));
}
