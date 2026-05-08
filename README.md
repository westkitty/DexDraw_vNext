# DexDraw vNext

A collaborative, real-time whiteboard. Local-first, self-hosted, server-authoritative.

**Status: v0.1.0-rc1 — developer release candidate. Not production-ready.**

---

## Features

- **Gateway shell** — atmospheric intro screen with local video; shows once per browser profile, bypassed by Playwright tests via `storageState`
- **Metrics strip** — persistent status bar showing connection, participants, object/selected/checkpoint/undo/redo counts
- **Real-time collaboration** — multiple clients, WebSocket sync, remote cursors and laser pointer
- **Drawing tools** — freehand pen, rectangle, ellipse, text, sticky note
- **Editing** — inline text/note editing, selection, multi-select, marquee, drag, resize
- **Arrange** — z-order (forward/backward/front/back), duplicate, keyboard nudge
- **Board title** — editable by owner, synced live to all clients
- **Checkpoints** — named save points; restore rolls back to that snapshot
- **Export** — PNG (cropped to content), Markdown, PDF
- **Undo/redo** — per-client, full history
- **Reconnect/replay** — clients catch up on missed ops after disconnect
- **Templates** — Blank and Meeting Grid starter boards
- **Keyboard shortcuts** — see [Architecture section](#architecture) for full list

---

## Known Limitations

- Auth tokens are signed JWTs stored in `sessionStorage` — no user accounts.
- Board state is persisted to PGlite (an in-process Postgres) in `.dexdraw-data/` — a local directory, not a production DB.
- Share codes are generated per-board; anyone with the code can join.
- No rate limiting beyond in-memory per-connection throttling (60 msg/s per client).
- No horizontal scaling — one process, one PGlite instance.
- No JSON import/export, no image objects, no infinite canvas.

Do not deploy with real user data without replacing the storage and auth layers.

## Security Tradeoffs

| Area | Current behavior | Why / tradeoff |
|------|-----------------|----------------|
| **Join role default** | Guests who join without `requestedRole` receive `"edit"` access | Collaborative whiteboard; edit-by-default is the intended product flow. Change `const role = payload.requestedRole ?? "edit"` in `apps/server-api/src/app.ts` (and update the join test) if you want `"view"` as the default. |
| **CORS** | Allows all origins when `PUBLIC_CLIENT_ORIGIN` is unset | Dev-friendly. Set `PUBLIC_CLIENT_ORIGIN` in production (see `.env.example`). |
| **Token storage** | JWTs in `sessionStorage` | Not shared across tabs, not persistent — acceptable for a prototype. Use `httpOnly` cookies for production. |

---

## Requirements

- **Node.js** ≥ 22
- **pnpm** ≥ 9 (`corepack enable` to activate)

---

## Quickstart

```bash
corepack enable
pnpm install

# Copy environment config
cp .env.example apps/server-api/.env

# Start server + client in parallel (hot-reload)
pnpm dev
```

- Client: http://127.0.0.1:5173
- Server API: http://127.0.0.1:4000
- Server health: http://127.0.0.1:4000/health

---

## One-Command Verification

```bash
# Unit tests, typecheck, build, lint
bash scripts/verify.sh

# Full release verification — includes E2E browser tests (recommended)
bash scripts/verify.sh --e2e
```

`bash scripts/verify.sh` runs: `pnpm install` → `typecheck` → `test` → `build` → `lint`.
`bash scripts/verify.sh --e2e` additionally runs `pnpm test:e2e --workers=1` for stable E2E results.

Install Playwright browsers once: `pnpm exec playwright install --with-deps chromium`

> **Note:** Vite's WS proxy emits `ECONNREFUSED`/`EPIPE` log messages when the dev server is
> shut down while WebSocket connections are still open. These are benign teardown artifacts and
> are filtered from verification output by the custom logger in `apps/client-web/vite.config.ts`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start server + client with hot-reload |
| `pnpm build` | Production build of all packages |
| `pnpm typecheck` | TypeScript type check (no emit) |
| `pnpm test` | Unit + server tests (vitest) |
| `pnpm test:e2e` | E2E browser tests (Playwright) |
| `pnpm lint` | Lint + format check (Biome) |
| `pnpm format` | Auto-format (Biome) |
| `bash scripts/verify.sh` | Local CI: typecheck + test + build + lint |
| `bash scripts/verify.sh --e2e` | Full release verification (adds E2E with `--workers=1`) |

---

## Architecture

```
dexdraw-vnext/
├── apps/
│   ├── client-web/          # React + Vite + TypeScript (SVG canvas)
│   └── server-api/          # Fastify + PGlite + Drizzle ORM
├── packages/
│   ├── shared-protocol/     # Zod schemas: ops, messages, templates
│   └── shared-core/         # Shared utilities
└── tests/e2e/               # Playwright end-to-end tests
```

**Sync model:** Clients connect via WebSocket. Each mutation is a `ClientOpEnvelope` — the server assigns a `serverSeq`, persists it to PGlite, and broadcasts `ServerOpEnvelope` to all peers in the room. On reconnect, clients replay from their last known `serverSeq` via `GET /api/boards/:id/ops?since=N`.

**Checkpoints:** A `checkpoint.create` op marks a point-in-time snapshot name. `checkpoint.restore` replays the op log up to that checkpoint and broadcasts a `server.snapshot_reset` to all peers. The checkpoint dropdown shows each checkpoint's name and creation timestamp. Restoring requires confirmation.

**Board title:** The board name is editable by the owner after creation. Click the title in the header to rename; the change is persisted via `PATCH /api/boards/:boardId/title` and broadcast to all connected clients as `server.board_title_update`.

**Keyboard shortcuts (select mode):**

| Shortcut | Action |
|---|---|
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y | Redo |
| Cmd/Ctrl+D | Duplicate selection |
| Cmd/Ctrl+] | Bring forward |
| Cmd/Ctrl+Shift+] | Bring to front |
| Cmd/Ctrl+[ | Send backward |
| Cmd/Ctrl+Shift+[ | Send to back |
| Delete / Backspace | Delete selection |
| Arrow keys | Nudge (8px); Shift+Arrow = 32px |
| Escape | Deselect |

---

## Manual Smoke Test

1. `pnpm dev` — wait for both server and client to report ready.
2. Open http://127.0.0.1:5173 in two browser tabs.
3. Create a board in tab 1; copy the share code and join from tab 2.
4. Draw a stroke in tab 1 — confirm it appears in tab 2 within ~100ms.
5. Export as PNG from the toolbar.

See [`docs/demo-script.md`](docs/demo-script.md) for the full 5-minute demo walkthrough.
See [`docs/release-checklist.md`](docs/release-checklist.md) for the pre-release verification checklist.

---

## Environment Variables

See `.env.example`. The server reads:

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `4000` | Server listen port |
| `HOST` | `0.0.0.0` | Server listen host |
| `TOKEN_SECRET` | `dev-only-secret-change-me` | JWT signing key — **must be changed in production** |
| `PUBLIC_CLIENT_ORIGIN` | *(allow all)* | CORS allowed origin (e.g. `http://127.0.0.1:5173`) |

---

## Roadmap (future — not in this repo)

See [`docs/architecture-roadmap.md`](docs/architecture-roadmap.md) for the full architecture overview and future options with tradeoff notes.

The following are architecture decisions deferred to future milestones. They are **not implemented** here:

- Yjs / CRDT-based conflict resolution
- IndexedDB offline-first storage
- WebRTC peer sync
- OffscreenCanvas rendering
- Spatial indexing (R-tree) for large boards
- Fractional indexing for z-order
- End-to-end encryption
- MessagePack / Protocol Buffers wire format
- Wasm geometry acceleration
