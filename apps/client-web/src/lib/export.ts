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
      // Estimate text bounds from font-size and character count.
      const fs = obj.style?.fontSize ?? 24;
      const estimatedW = Math.max(obj.text.length * fs * 0.55, fs);
      const estimatedH = fs * 1.4;
      if (obj.x < minX) minX = obj.x;
      if (obj.y < minY) minY = obj.y;
      if (obj.x + estimatedW > maxX) maxX = obj.x + estimatedW;
      if (obj.y + estimatedH > maxY) maxY = obj.y + estimatedH;
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
    } else if (obj.type === "ellipse") {
      lines.push("*(ellipse)*", "");
    }
    // strokes: intentionally skipped (no text representation)
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

/**
 * Computes the SVG viewBox string and canvas dimensions for a content-cropped
 * PNG export.  Returns `null` when no crop should be applied (fall back to the
 * default 1600×900 full-board render).
 *
 * Exported so it can be unit-tested without browser APIs.
 */
export function computeCropViewBox(
  objects: BoardObject[] | undefined,
  options: { padding?: number; cropToContent?: boolean } | undefined,
): { viewBox: string; width: number; height: number } | null {
  if (!options?.cropToContent || !objects?.length) return null;
  const bounds = boundsFromBoardObjects(objects, options.padding ?? 32);
  if (!bounds) return null;
  return {
    viewBox: `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`,
    width: Math.max(1, Math.round(bounds.width)),
    height: Math.max(1, Math.round(bounds.height)),
  };
}

export function exportToPdf(svgEl: SVGSVGElement, filename: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const titleEl = printWindow.document.createElement("title");
  titleEl.textContent = filename;
  printWindow.document.head.appendChild(titleEl);
  const style = printWindow.document.createElement("style");
  style.textContent =
    "body{margin:0;background:#fff}svg{width:100vw;height:100vh}@media print{body{margin:0}}";
  printWindow.document.head.appendChild(style);
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  printWindow.document.body.appendChild(clone);
  printWindow.focus();
  printWindow.print();
}

export async function exportSvgToPng(
  svg: SVGSVGElement,
  filename: string,
  objects?: BoardObject[],
  options?: { padding?: number; cropToContent?: boolean },
) {
  const crop = computeCropViewBox(objects, options);

  // Clone the SVG so we can adjust its viewBox without mutating the live DOM.
  const clone = svg.cloneNode(true) as SVGSVGElement;
  let canvasWidth = 1600;
  let canvasHeight = 900;

  if (crop) {
    clone.setAttribute("viewBox", crop.viewBox);
    canvasWidth = crop.width;
    canvasHeight = crop.height;
  }

  // Set explicit dimensions so browsers reliably render the SVG at the right size
  // when loaded as an Image element (SVGs without explicit w/h use their viewBox
  // for intrinsic dimensions, which can behave inconsistently in drawImage).
  clone.setAttribute("width", String(canvasWidth));
  clone.setAttribute("height", String(canvasHeight));

  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(clone);
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
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
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
