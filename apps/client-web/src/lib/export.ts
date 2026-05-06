import type { BoardObject } from "@dexdraw/shared-protocol";

// Axis-aligned bounding box of a set of board objects.
export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Returns the axis-aligned bounding box that encloses all objects, expanded
 * by `padding` on every side.  Returns `null` for an empty array.
 *
 * Covered types: stroke (point cloud), rectangle, ellipse, text (anchor
 * point), note (positioned box).
 */
export function boundsFromBoardObjects(
  objects: BoardObject[],
  padding = 0,
): Bounds | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const obj of objects) {
    if (obj.type === "stroke") {
      for (const p of obj.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    } else if (obj.type === "rectangle") {
      const x2 = obj.x + obj.width;
      const y2 = obj.y + obj.height;
      if (obj.x < minX) minX = obj.x;
      if (obj.y < minY) minY = obj.y;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    } else if (obj.type === "ellipse") {
      const x1 = obj.cx - obj.rx;
      const y1 = obj.cy - obj.ry;
      const x2 = obj.cx + obj.rx;
      const y2 = obj.cy + obj.ry;
      if (x1 < minX) minX = x1;
      if (y1 < minY) minY = y1;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    } else if (obj.type === "text") {
      // Text has no explicit size in the schema; treat as a point.
      if (obj.x < minX) minX = obj.x;
      if (obj.y < minY) minY = obj.y;
      if (obj.x > maxX) maxX = obj.x;
      if (obj.y > maxY) maxY = obj.y;
    } else if (obj.type === "note") {
      const x2 = obj.x + obj.width;
      const y2 = obj.y + obj.height;
      if (obj.x < minX) minX = obj.x;
      if (obj.y < minY) minY = obj.y;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    }
  }

  if (!Number.isFinite(minX)) return null;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

export function boardToMarkdown(objects: BoardObject[]): string {
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);
  const lines: string[] = ["# DexDraw Board", ""];

  for (const obj of sorted) {
    if (obj.type === "text") {
      lines.push(obj.text, "");
    } else if (obj.type === "note") {
      for (const line of obj.text.split("\n")) {
        lines.push(`> ${line}`);
      }
      lines.push("");
    } else if (obj.type === "rectangle") {
      lines.push("---", "");
    }
    // strokes and ellipses: skipped
  }

  return lines.join("\n");
}

export function exportMarkdown(objects: BoardObject[], filename: string): void {
  const md = boardToMarkdown(objects);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportToPdf(svgEl: SVGSVGElement, filename: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const titleEl = printWindow.document.createElement("title");
  titleEl.textContent = filename;
  printWindow.document.head.appendChild(titleEl);
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  printWindow.document.body.appendChild(clone);
}

export async function exportSvgToPng(svg: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load SVG for export."));
    });

    image.src = url;
    await loaded;

    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas export context unavailable.");
    }

    context.fillStyle = "#fff8ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = filename;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
