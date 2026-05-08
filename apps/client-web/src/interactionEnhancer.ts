declare global {
  interface Window {
    __dexDrawInteractionEnhancerInstalled?: boolean;
  }
}

type Point = {
  x: number;
  y: number;
};

const PANEL_STORAGE_PREFIX = "dexdraw-floating-panel:";

function isReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function safeClosest(
  element: EventTarget | null,
  selector: string,
): Element | null {
  return element instanceof Element ? element.closest(selector) : null;
}

function makeInkTrail(event: PointerEvent): void {
  if (isReducedMotion()) {
    return;
  }

  const button = safeClosest(
    event.target,
    ".home-page button, .home-shell button, .home-screen button",
  );

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  if (button.closest(".gateway")) {
    return;
  }

  const rect = button.getBoundingClientRect();
  const ink = document.createElement("span");
  ink.className = "dexdraw-ink-drop";
  ink.style.left = `${event.clientX - rect.left}px`;
  ink.style.top = `${event.clientY - rect.top}px`;
  ink.style.setProperty("--ink-size", `${22 + Math.random() * 30}px`);
  ink.style.setProperty("--ink-x", `${(Math.random() - 0.5) * 42}px`);
  ink.style.setProperty("--ink-y", `${(Math.random() - 0.5) * 32}px`);
  ink.style.setProperty("--ink-r", `${(Math.random() - 0.5) * 80}deg`);

  button.appendChild(ink);
  window.setTimeout(() => ink.remove(), 900);
}

function installInkTrail(): void {
  let lastInkAt = 0;

  window.addEventListener(
    "pointermove",
    (event) => {
      const now = performance.now();
      if (now - lastInkAt < 20) {
        return;
      }

      lastInkAt = now;
      makeInkTrail(event);
    },
    { passive: true },
  );
}

function textIncludes(element: Element, terms: string[]): boolean {
  const text = (element.textContent ?? "").toLowerCase();
  return terms.every((term) => text.includes(term.toLowerCase()));
}

function findPanelByTerms(terms: string[]): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      "header, nav, aside, section, main > div, body > div div",
    ),
  );

  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (!textIncludes(candidate, terms)) {
      continue;
    }

    const buttonCount = candidate.querySelectorAll("button").length;
    const score = candidate.getBoundingClientRect().width + buttonCount * 24;

    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function hasBoardCanvas(): boolean {
  return Boolean(
    document.querySelector(
      '[aria-label*="Collaborative drawing canvas"], svg, canvas',
    ),
  );
}

function isBoardRoute(): boolean {
  return window.location.pathname.includes("/boards/") || hasBoardCanvas();
}

function isHomeRoute(): boolean {
  return !isBoardRoute() && !document.querySelector(".gateway");
}

function restorePanel(panel: HTMLElement, key: string): void {
  const raw = window.localStorage.getItem(`${PANEL_STORAGE_PREFIX}${key}`);
  if (!raw) {
    return;
  }

  try {
    const state = JSON.parse(raw) as {
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      collapsed?: boolean;
    };

    if (typeof state.left === "number") {
      panel.style.left = `${state.left}px`;
      panel.style.right = "auto";
    }

    if (typeof state.top === "number") {
      panel.style.top = `${state.top}px`;
      panel.style.bottom = "auto";
    }

    if (typeof state.width === "number") {
      panel.style.width = `${state.width}px`;
    }

    if (typeof state.height === "number") {
      panel.style.height = `${state.height}px`;
    }

    if (state.collapsed) {
      panel.classList.add("dexdraw-panel--collapsed");
    }
  } catch {
    window.localStorage.removeItem(`${PANEL_STORAGE_PREFIX}${key}`);
  }
}

function savePanel(panel: HTMLElement, key: string): void {
  const rect = panel.getBoundingClientRect();
  window.localStorage.setItem(
    `${PANEL_STORAGE_PREFIX}${key}`,
    JSON.stringify({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      collapsed: panel.classList.contains("dexdraw-panel--collapsed"),
    }),
  );
}

function clampPanel(panel: HTMLElement): void {
  const rect = panel.getBoundingClientRect();
  const margin = 8;
  const left = Math.min(
    Math.max(rect.left, margin),
    Math.max(margin, window.innerWidth - rect.width - margin),
  );
  const top = Math.min(
    Math.max(rect.top, margin),
    Math.max(margin, window.innerHeight - rect.height - margin),
  );

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
}

function addPanelControls(
  panel: HTMLElement,
  key: string,
  label: string,
): void {
  if (panel.dataset.dexdrawPanelReady === "1") {
    return;
  }

  panel.dataset.dexdrawPanelReady = "1";
  panel.dataset.dexdrawPanelKey = key;

  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "dexdraw-panel-handle";
  handle.setAttribute("aria-label", `Move ${label} panel`);
  handle.title = `Move ${label}`;
  handle.textContent = "⋮⋮";

  const collapse = document.createElement("button");
  collapse.type = "button";
  collapse.className = "dexdraw-panel-collapse";
  collapse.setAttribute("aria-label", `Collapse ${label} panel`);
  collapse.title = `Collapse ${label}`;
  collapse.textContent = "−";

  const resize = document.createElement("span");
  resize.className = "dexdraw-panel-resize";
  resize.setAttribute("aria-hidden", "true");

  panel.prepend(collapse);
  panel.prepend(handle);
  panel.appendChild(resize);

  restorePanel(panel, key);

  let dragStart: Point | null = null;
  let panelStart: Point | null = null;

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = panel.getBoundingClientRect();
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";

    dragStart = { x: event.clientX, y: event.clientY };
    panelStart = { x: rect.left, y: rect.top };

    handle.setPointerCapture(event.pointerId);
    panel.classList.add("dexdraw-panel--moving");
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragStart || !panelStart) {
      return;
    }

    const nextLeft = panelStart.x + event.clientX - dragStart.x;
    const nextTop = panelStart.y + event.clientY - dragStart.y;

    panel.style.left = `${nextLeft}px`;
    panel.style.top = `${nextTop}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  });

  handle.addEventListener("pointerup", (event) => {
    if (dragStart) {
      handle.releasePointerCapture(event.pointerId);
      clampPanel(panel);
      savePanel(panel, key);
    }

    dragStart = null;
    panelStart = null;
    panel.classList.remove("dexdraw-panel--moving");
  });

  let resizeStart: Point | null = null;
  let sizeStart: { width: number; height: number } | null = null;

  resize.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = panel.getBoundingClientRect();
    resizeStart = { x: event.clientX, y: event.clientY };
    sizeStart = { width: rect.width, height: rect.height };
    resize.setPointerCapture(event.pointerId);
    panel.classList.add("dexdraw-panel--resizing");
  });

  resize.addEventListener("pointermove", (event) => {
    if (!resizeStart || !sizeStart) {
      return;
    }

    panel.style.width = `${Math.max(220, sizeStart.width + event.clientX - resizeStart.x)}px`;
    panel.style.height = `${Math.max(56, sizeStart.height + event.clientY - resizeStart.y)}px`;
  });

  resize.addEventListener("pointerup", (event) => {
    if (resizeStart) {
      resize.releasePointerCapture(event.pointerId);
      savePanel(panel, key);
    }

    resizeStart = null;
    sizeStart = null;
    panel.classList.remove("dexdraw-panel--resizing");
  });

  collapse.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel.classList.toggle("dexdraw-panel--collapsed");
    collapse.textContent = panel.classList.contains("dexdraw-panel--collapsed")
      ? "+"
      : "−";
    savePanel(panel, key);
  });
}

function decorateBoardPanels(): void {
  if (!isBoardRoute()) {
    document.body.classList.remove("dexdraw-board-mode");
    return;
  }

  document.body.classList.add("dexdraw-board-mode");

  const titlePanel = findPanelByTerms(["share code"]);
  const toolPanel = findPanelByTerms(["select", "pen", "rectangle"]);
  const exportPanel = findPanelByTerms(["export png"]);
  const statusPanel = findPanelByTerms(["connected", "participant"]);

  const panels: Array<[HTMLElement | null, string, string, string]> = [
    [titlePanel, "title", "Board title", "dexdraw-title-panel"],
    [toolPanel, "tools", "Tools", "dexdraw-tool-panel"],
    [
      exportPanel && exportPanel !== toolPanel ? exportPanel : null,
      "exports",
      "Export",
      "dexdraw-export-panel",
    ],
    [statusPanel, "status", "Status", "dexdraw-status-panel"],
  ];

  for (const [panel, key, label, className] of panels) {
    if (!panel) {
      continue;
    }

    panel.classList.add("dexdraw-floating-panel", className);
    addPanelControls(panel, key, label);
  }
}

function decorateHome(): void {
  if (!isHomeRoute()) {
    document.body.classList.remove("dexdraw-home-mode");
    return;
  }

  document.body.classList.add("dexdraw-home-mode");

  const formSections = Array.from(
    document.querySelectorAll<HTMLElement>("section, article, div"),
  ).filter((element) => element.querySelector("form"));

  for (const section of formSections) {
    section.classList.add("dexdraw-home-card");
  }
}

function runDecorators(): void {
  decorateHome();
  decorateBoardPanels();
}

export function installDexDrawInteractionEnhancer(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__dexDrawInteractionEnhancerInstalled) {
    return;
  }

  window.__dexDrawInteractionEnhancerInstalled = true;

  installInkTrail();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(runDecorators);
  });

  function start(): void {
    runDecorators();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("resize", () => {
    for (const panel of document.querySelectorAll<HTMLElement>(
      ".dexdraw-floating-panel",
    )) {
      clampPanel(panel);
      savePanel(panel, panel.dataset.dexdrawPanelKey ?? "unknown");
    }
  });
}
