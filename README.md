# DexDraw vNext

A collaborative, real-time whiteboard — developer prototype / alpha. **Not production-ready.**

Built as a reference implementation: SVG canvas, WebSocket sync, durable operation log, checkpoints, PNG/Markdown/PDF export.

---

## Status

Alpha / developer prototype. The sync model, auth, and storage are intentionally minimal:

- Auth tokens are signed JWTs stored in `sessionStorage` — no user accounts.
- Board state is persisted to PGlite (an in-process Postgres) in `.dexdraw-data/` — a local directory, not a production DB.
- Share codes are generated per-board; anyone with the code can join.
- No rate limiting beyond in-memory per-connection throttling.
- No horizontal scaling — one process, one PGlite instance.

Do not deploy this with real user data without replacing the storage and auth layers.

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
bash scripts/verify.sh
```

Runs: `pnpm install` → `typecheck` → `test` → `build` → `lint`.

For E2E browser tests (requires Playwright browsers installed):

```bash
pnpm test:e2e
```

Install browsers once with: `pnpm exec playwright install --with-deps chromium`

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
| `bash scripts/verify.sh` | Full local CI: typecheck + test + build + lint |

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

**Checkpoints:** A `checkpoint.create` op marks a point-in-time snapshot name. `checkpoint.restore` replays the op log up to that checkpoint and broadcasts a `server.snapshot_reset` to all peers.

---

## Manual Smoke Test

1. `pnpm dev` — wait for both server and client to report ready.
2. Open http://127.0.0.1:5173 in two browser tabs.
3. Create a board in tab 1; copy the share code and join from tab 2.
4. Draw a stroke in tab 1 — confirm it appears in tab 2 within ~100ms.
5. Export as PNG from the toolbar.

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
