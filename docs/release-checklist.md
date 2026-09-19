# DexDraw — Release Checklist

Use this checklist before tagging a release candidate.

---

## Environment Setup

- [ ] Node.js ≥ 22 installed (`node --version`)
- [ ] pnpm ≥ 9 available (`pnpm --version`; run `corepack enable` if not)
- [ ] Playwright Chromium installed (`pnpm exec playwright install --with-deps chromium`)

---

## Install & Config

- [ ] `pnpm install` — no errors
- [ ] `.env.example` exists in repo root
- [ ] `cp .env.example apps/server-api/.env` — server env configured

---

## Automated Gates

Run in order. All must pass before proceeding.

```bash
pnpm typecheck                    # TypeScript type check — no errors
pnpm test                         # Unit + server vitest tests (154 tests) — all pass
pnpm test:smoke                   # End-to-end headless multi-client collaboration smoke test — all pass
pnpm build                        # Production build — no errors
pnpm lint                         # Biome lint + format — no errors
pnpm test:e2e --workers=1         # Playwright E2E — all pass (use --workers=1 for stable presence timing)
bash scripts/verify.sh            # Local CI: typecheck + test + smoke + build + lint — exits 0
bash scripts/verify.sh --e2e      # Full release verification — exits 0 (recommended)
```

> **Official release verification command:** `bash scripts/verify.sh`
> This runs all standard CI gates including the 12-stage multi-client collaboration smoke test.
> For browser E2E, use `bash scripts/verify.sh --e2e`.

- [ ] `pnpm typecheck` — clean
- [ ] `pnpm test` — all pass (`122/122` client, `24/24` server, `8/8` core/protocol — 154 total as of v0.1.0-rc1)
- [ ] `pnpm test:smoke` — all pass (12-step multi-client concurrent collaboration, reconnection, convergence, import/export, viewport invariants)
- [ ] `pnpm build` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm test:e2e --workers=1` — all pass (when running with browser installed)
- [ ] `bash scripts/verify.sh` — exits 0

---

## Manual Smoke Test

Run `pnpm dev` and open http://127.0.0.1:5173.

- [ ] Gateway starts in opening animation phase; no app shell or entry button is available during the opening phase
- [ ] Post-animation barrier appears only after the opening animation completes
- [ ] Enter Canvas transitions through the intentional gateway fade into the app shell
- [ ] Reloading or freshly opening the app repeats the required sequence: opening animation → post-animation barrier → app/canvas entry
- [ ] Metrics strip visible on board page: connection, participants, objects, selected, checkpoints, undo/redo
- [ ] Home page loads; Create, Join, and Import JSON Archive panels visible
- [ ] Create board → navigates to board page, title shown, status "Connected"
- [ ] Share code visible in header
- [ ] Pen tool draws a stroke; stroke persists on reload
- [ ] Rectangle, Ellipse, Text, Note tools create objects
- [ ] Inline editing works for Text and Note objects
- [ ] Select tool: click-select, shift-click multi-select, marquee drag
- [ ] Drag moves objects; resize handles work for rect/ellipse/note (44px touch targets on touch)
- [ ] Duplicate (Cmd+D), arrange (Cmd+]/[), nudge (Arrow keys)
- [ ] Undo (Cmd+Z) / Redo (Cmd+Shift+Z) works correctly
- [ ] Board title click-to-rename works (owner only)
- [ ] Save Checkpoint → checkpoint appears in dropdown with timestamp
- [ ] Restore Checkpoint → confirm dialog → board reverts
- [ ] Export JSON downloads a `.json` board archive file
- [ ] Import JSON from Home creates a new board with all objects and ordering preserved
- [ ] Recovery Center opens from metrics strip or toolbar; displays live sequence, pending ops count, and connection health
- [ ] Viewport controls (+, -, Reset, Fit) zoom and pan canvas smoothly while preserving board coordinate authority
- [ ] Touch gestures: two-finger pinch-to-zoom and two-finger pan work smoothly without page scroll collisions
- [ ] Export PNG downloads a PNG file
- [ ] Export Markdown downloads a .md file
- [ ] Export PDF opens print window

---

## Two-Client Sync

- [ ] Open board in second tab/browser; join with share code
- [ ] Objects drawn in tab A appear in tab B within ~100 ms
- [ ] Remote cursor visible when the other client moves the mouse
- [ ] Board title rename in tab A propagates to tab B
- [ ] Checkpoint restore in tab A propagates to tab B
- [ ] Concurrent edits to different objects both persist without data loss
- [ ] Network disconnect and reconnect automatically catches up missed operations

---

## Known Caveats (not blocking)

- PGlite data is local to `.dexdraw-data/` — not suitable for multi-process or cloud deployment
- `sessionStorage` tokens are tab-scoped and not persistent across sessions
- Client-side recovery journal provides crash protection and cached views; local recovery is not full offline collaborative editing (no CRDT multi-master merge)
- Presence flake: under heavy parallel test load, the remote-cursor WS relay assertion may need a slightly longer timeout; this is a test infrastructure concern, not a product bug
- PDF export uses browser print dialog — appearance depends on browser/OS print settings

---

## Git

- [ ] `git status` clean (no uncommitted changes)
- [ ] `git log --oneline -3` shows release commit at HEAD
- [ ] `git tag v0.1.0-rc1` created
