import type { BoardObject } from "@dexdraw/shared-protocol";

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
