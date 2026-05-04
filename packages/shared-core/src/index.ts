export type Point = { x: number; y: number; pressure?: number };

export type Bounds = { x: number; y: number; width: number; height: number };

export function boundsFromPoints(points: Point[]): Bounds {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function quantize(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

export function normalizeStroke(points: Point[]): Point[] {
  const normalized: Point[] = [];

  for (const point of points) {
    const nextPoint: Point = {
      x: quantize(point.x),
      y: quantize(point.y),
      pressure:
        point.pressure === undefined ? undefined : quantize(point.pressure, 3),
    };

    const previous = normalized.at(-1);
    if (previous && previous.x === nextPoint.x && previous.y === nextPoint.y) {
      continue;
    }

    normalized.push(nextPoint);
  }

  return normalized;
}

export function pointsToSvgPath(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return `M ${first.x} ${first.y}${rest.map((point) => ` L ${point.x} ${point.y}`).join("")}`;
}
