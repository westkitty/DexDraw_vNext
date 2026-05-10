const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;
const PINCH_SENSITIVITY = 0.005;

let zoom = 1;
let controls: HTMLDivElement | null = null;
let activeCanvas: SVGSVGElement | null = null;
let lastTouchDistance: number | null = null;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getTouchDistance(event: TouchEvent) {
  if (event.touches.length < 2) return null;
  const [first, second] = Array.from(event.touches);
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function applyZoom(nextZoom: number) {
  zoom = clampZoom(nextZoom);
  document.documentElement.style.setProperty("--dexdraw-canvas-zoom", String(zoom));
  const scaleLabel = document.querySelector<HTMLElement>("[data-zoom-scale]");
  if (scaleLabel) {
    scaleLabel.textContent = `${Math.round(zoom * 100)}%`;
  }
}

function ensureControls() {
  if (controls) return controls;

  controls = document.createElement("div");
  controls.className = "canvas-zoom-controls";
  controls.setAttribute("aria-label", "Canvas zoom controls");
  controls.innerHTML = `
    <button type="button" class="canvas-zoom-button" data-zoom-out aria-label="Zoom out">−</button>
    <span class="canvas-zoom-scale" data-zoom-scale>100%</span>
    <button type="button" class="canvas-zoom-button" data-zoom-in aria-label="Zoom in">+</button>
  `;

  controls.querySelector<HTMLButtonElement>("[data-zoom-out]")?.addEventListener("click", () => {
    applyZoom(zoom - ZOOM_STEP);
  });
  controls.querySelector<HTMLButtonElement>("[data-zoom-in]")?.addEventListener("click", () => {
    applyZoom(zoom + ZOOM_STEP);
  });

  document.body.appendChild(controls);
  return controls;
}

function attachCanvas(canvas: SVGSVGElement) {
  if (activeCanvas === canvas) return;
  activeCanvas = canvas;
  canvas.tabIndex = 0;
  applyZoom(zoom);
}

function handleWheel(event: WheelEvent) {
  const canvas = document.querySelector<SVGSVGElement>("[data-testid='board-canvas']");
  if (!canvas || !(event.target instanceof Node) || !canvas.contains(event.target)) return;
  event.preventDefault();
  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  applyZoom(zoom + delta);
}

function handleKeyDown(event: KeyboardEvent) {
  if (document.activeElement !== activeCanvas) return;
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  event.preventDefault();
  applyZoom(zoom + (event.key === "ArrowUp" ? ZOOM_STEP : -ZOOM_STEP));
}

function handleTouchStart(event: TouchEvent) {
  const canvas = document.querySelector<SVGSVGElement>("[data-testid='board-canvas']");
  if (!canvas || !(event.target instanceof Node) || !canvas.contains(event.target)) return;
  lastTouchDistance = getTouchDistance(event);
}

function handleTouchMove(event: TouchEvent) {
  const canvas = document.querySelector<SVGSVGElement>("[data-testid='board-canvas']");
  if (!canvas || !(event.target instanceof Node) || !canvas.contains(event.target)) return;
  const distance = getTouchDistance(event);
  if (distance === null || lastTouchDistance === null) return;
  event.preventDefault();
  applyZoom(zoom + (distance - lastTouchDistance) * PINCH_SENSITIVITY);
  lastTouchDistance = distance;
}

function handleTouchEnd() {
  lastTouchDistance = null;
}

function syncZoomUi() {
  const canvas = document.querySelector<SVGSVGElement>("[data-testid='board-canvas']");
  const shell = document.querySelector(".board-shell");
  const control = ensureControls();
  if (canvas && shell) {
    attachCanvas(canvas);
    control.hidden = false;
    shell.appendChild(control);
    return;
  }
  control.hidden = true;
  activeCanvas = null;
}

export function installCanvasZoom() {
  applyZoom(zoom);
  syncZoomUi();
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleTouchEnd);
  window.addEventListener("touchcancel", handleTouchEnd);

  const observer = new MutationObserver(syncZoomUi);
  observer.observe(document.body, { childList: true, subtree: true });
}
