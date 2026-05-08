# DexDraw — Testing Guide

## Test suite layout

| Layer | Tool | Location |
|---|---|---|
| Unit (client) | Vitest | `apps/client-web/src/__tests__/` |
| Unit (server) | Vitest | `apps/server-api/src/__tests__/` |
| E2E (browser) | Playwright | `tests/e2e/` |

## Running tests

```bash
# All unit tests
pnpm test

# Client unit tests only
pnpm --filter @dexdraw/client-web test

# Server unit tests only
pnpm --filter @dexdraw/server-api test

# E2E (requires Chromium — install once with the command below)
pnpm exec playwright install --with-deps chromium

# Stable single-worker run (used by bash scripts/verify.sh --e2e)
pnpm test:e2e --workers=1

# Parallel run (faster but presence tests may flake under load)
pnpm test:e2e

# Type check all packages
pnpm typecheck

# Lint + format check
pnpm lint
```

## E2E test files

| File | What it covers |
|---|---|
| `arrange-duplicate-nudge.spec.ts` | Arrange (front/back/forward/backward), duplicate toolbar button, keyboard shortcuts (Cmd+D, Cmd+]/[), nudge arrow keys |
| `board-title.spec.ts` | Board title displayed on creation, inline rename by owner, title persists across reload, WS broadcast to second client |
| `checkpoint.spec.ts` | Create checkpoint, restore removes post-checkpoint objects, state persists across reload, Markdown/PDF export |
| `drag-move.spec.ts` | Drag-to-move objects, undo drag move |
| `inline-edit.spec.ts` | Double-click text/note in Select mode to open inline editor; pen mode must not trigger editor |
| `marquee.spec.ts` | Marquee selection, shift-click multi-select, Escape to deselect |
| `multi-select.spec.ts` | Multi-select drag, group arrange, group nudge |
| `pointer-event-routing.spec.ts` | Pointer events dispatched to correct handler in each tool mode; double-click in pen mode does not open editor |
| `presence.spec.ts` | Remote cursor appears and expires; presence cleared after disconnect/reload |
| `resize.spec.ts` | Resize handles on rectangles/ellipses, undo resize |
| `selection-hardening.spec.ts` | Selection clears on delete; stale selections cleaned up after restore |
| `selection-undo.spec.ts` | Undo/redo of create, update, delete |
| `two-client-sync.spec.ts` | Two-client stroke sync, rectangle/text tools, presence, offline reconnect replay |

## Writing new E2E tests

- Use `page.getByTestId(...)` over CSS selectors where a `data-testid` is available.
- For dialogs triggered by `window.prompt` / `window.confirm`, register a `page.once("dialog", ...)` handler **before** clicking the button that triggers it.
- For WS-dependent assertions, prefer `await expect(...).toHaveText(..., { timeout: 5000 })` to tolerate latency.
- Playwright `workers: 3` is the default in `playwright.config.ts`. The release verification script uses `--workers=1` to prevent WS relay timing flakes in presence tests.
- Vite's WS proxy emits `ECONNREFUSED`/`EPIPE`/`ECONNRESET` log messages when the dev server is torn down while proxy sockets are open. This is benign teardown noise and is suppressed by the custom logger in `apps/client-web/vite.config.ts`. It does not affect test pass/fail results.

## Adding `data-testid` attributes

The convention is kebab-case nouns: `board-canvas`, `stroke-object`, `rect-object`, `text-object`, `note-object`, `checkpoint-select`, `restore-button`, `board-title`, `board-title-input`, `board-id`, `share-code`.

When adding new interactive UI, add a `data-testid` so E2E tests can target it without fragile CSS or aria queries.
