# DexDraw vNext — Release Checklist

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
pnpm test                         # Unit + server vitest tests — all pass
pnpm build                        # Production build — no errors
pnpm lint                         # Biome lint + format — no errors
pnpm test:e2e --workers=1         # Playwright E2E — all pass (use --workers=1 for stable presence timing)
bash scripts/verify.sh --e2e      # Full release verification — exits 0 (recommended)
```

> **Official release verification command:** `bash scripts/verify.sh --e2e`
> This runs all gates including E2E with `--workers=1`. Vite WS proxy teardown noise
> (ECONNREFUSED/EPIPE) is suppressed by the Vite custom logger — see `apps/client-web/vite.config.ts`.

- [ ] `pnpm typecheck` — clean
- [ ] `pnpm test` — all pass (`113/113` client, `15/15` server as of v0.1.0-rc1)
- [ ] `pnpm build` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm test:e2e --workers=1` — all pass (`71/71` as of v0.1.0-rc1)
- [ ] `bash scripts/verify.sh` — exits 0
- [ ] `bash scripts/verify.sh --e2e` — exits 0

---

## Manual Smoke Test

Run `pnpm dev` and open http://127.0.0.1:5173.

- [ ] Home page loads; Create and Join panels visible
- [ ] Create board → navigates to board page, title shown, status "Connected"
- [ ] Share code visible in header
- [ ] Pen tool draws a stroke; stroke persists on reload
- [ ] Rectangle, Ellipse, Text, Note tools create objects
- [ ] Inline editing works for Text and Note objects
- [ ] Select tool: click-select, shift-click multi-select, marquee drag
- [ ] Drag moves objects; resize handles work for rect/ellipse/note
- [ ] Duplicate (Cmd+D), arrange (Cmd+]/[), nudge (Arrow keys)
- [ ] Undo (Cmd+Z) / Redo (Cmd+Shift+Z) works correctly
- [ ] Board title click-to-rename works (owner only)
- [ ] Save Checkpoint → checkpoint appears in dropdown with timestamp
- [ ] Restore Checkpoint → confirm dialog → board reverts
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

---

## Known Caveats (not blocking)

- PGlite data is local to `.dexdraw-data/` — not suitable for multi-process or cloud deployment
- `sessionStorage` tokens are tab-scoped and not persistent across sessions
- Presence flake: under heavy parallel test load, the remote-cursor WS relay assertion may need a slightly longer timeout; this is a test infrastructure concern, not a product bug
- PDF export uses browser print dialog — appearance depends on browser/OS print settings
- No JSON import/export in this release

---

## Git

- [ ] `git status` clean (no uncommitted changes)
- [ ] `git log --oneline -3` shows release commit at HEAD
- [ ] `git tag v0.1.0-rc1` created
