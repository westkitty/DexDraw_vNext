# DexDraw — Testing Guide

## Test suite layout

| Layer | Tool | Location |
|---|---|---|
| Unit (client) | Vitest | `apps/client-web/src/__tests__/` (122 tests: transforms, marquee, resize, hit-test, export, presence, recoveryJournal, viewport) |
| Server tests | Vitest | `apps/server-api/src/__tests__/` (24 tests: API, store idempotency, conflict resilience, import/export) |
| Protocol / Core | Vitest | `packages/shared-protocol/`, `packages/shared-core/` (8 tests: schemas, op envelopes, board archives) |
| Smoke (headless E2E) | Node / Fastify / WS | `scripts/e2e-smoke.ts` (12-stage multi-client concurrent collaboration, reconnection, snapshot convergence, JSON archive roundtrip, touch viewport) |
| Browser E2E | Playwright | `tests/e2e/` (88 tests) |

## Running tests

```bash
# All unit and server tests (154 tests)
pnpm test

# Client unit tests only
pnpm --filter @dexdraw/client-web test

# Server unit & integration tests only
pnpm --filter @dexdraw/server-api test

# End-to-end multi-client headless collaboration smoke test (12 stages)
pnpm test:smoke

# E2E browser tests (requires Chromium — install once with the command below)
pnpm exec playwright install --with-deps chromium

# Stable single-worker run (used by bash scripts/verify.sh --e2e)
pnpm test:e2e --workers=1

# Parallel run (faster but presence tests may flake under load)
pnpm test:e2e

# Type check all packages
pnpm typecheck

# Lint + format check
pnpm lint

# Unified local CI verification pipeline
bash scripts/verify.sh
```

## Adversarial Conflict & Resilience Test Suite

Located at `apps/server-api/src/__tests__/conflict.test.ts`, this suite verifies multi-client concurrency and edge-case behavior:

- **Scenario A (Same Object / Same Time):** Two peers mutate different properties of the same object concurrently; monotonic log sequencing guarantees identical convergence across all clients.
- **Scenario B (Delete vs Edit):** Client A deletes an object while Client B edits it; the delete takes precedence and late edits do not resurrect the deleted object.
- **Scenario C (Reorder vs Delete):** Client A deletes an object while Client B reorders layer z-indexes; the reorder omits the deleted ID without resurrecting it.
- **Scenario D (Checkpoint Restore with Active Peers):** Owner triggers a checkpoint restore while peers are actively drawing; server broadcasts `server.snapshot_reset` and all peers reset state immediately.
- **Scenario E (Board Rename Concurrency):** Simultaneous rename attempts by owner and guest; owner succeeds and broadcasts, while guest receives 403 Forbidden.
- **Scenarios H & J (Sequence Gap & Catch-up):** Simulates dropped WebSocket frames causing sequence gaps; client requests missing ops via `GET /api/boards/:id/ops?since=N` and recovers cleanly without permanent divergence.

## Import/Export & Idempotency Test Suite

Located at `apps/server-api/src/__tests__/import-export.test.ts`:

- **Board JSON Export & Import:** Exports a board to the versioned `BoardArchiveSchema` JSON format, sanitizes fields, imports into a new board with a fresh ID, and validates preserved object geometry and ordering.
- **Schema Validation & Error Handling:** Rejects malformed archives and unsupported versions with structured 400 responses.
- **Duplicate Op Retransmission:** Submitting duplicate `opId`s acknowledges the sender idempotently with the existing `serverSeq` but suppresses duplicate broadcasts to peers.

## Client Recovery Journal & Viewport Tests

- `apps/client-web/src/__tests__/recoveryJournal.test.ts`: Verifies bounded snapshot persistence, pending op queueing, and recovery state in IndexedDB.
- `apps/client-web/src/__tests__/viewport.test.ts`: Verifies screen-to-board coordinate transforms, zoom boundaries, and the two-pointer pinch-zoom invariant (point under focal center remains invariant).

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
