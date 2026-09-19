# DexDraw — Architecture & Roadmap

> **Status:** Developer prototype / alpha.
> The items marked **Future** are **not implemented** in this repo.
> They are recorded here to document known tradeoffs and avoid re-litigating them.

---

## Current Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Client renderer | React + Vite + **SVG** | Direct SVG elements for strokes, shapes, and text; no canvas or WebGL |
| Viewport navigation | Zoom & Pan transform matrix | Client-side viewport transformation with pinch-zoom, pan, and fit preserving board coordinate authority |
| Client state | React `useState` / `useReducer` | Optimistic local updates; server-authoritative reconciliation |
| Local recovery journal | **IndexedDB** (`dexdraw_recovery_journal_v1`) | Bounded local snapshot caching and pending op queue for crash resilience and cached viewing (not full offline CRDT editing) |
| Transport | **WebSocket** (Fastify `@fastify/websocket`) | One persistent connection per board session; dynamic gap detection & catch-up replay |
| Sync model | **Server-authoritative operation log** | Client sends `ClientOpEnvelope` with `opId`; server deduplicates, assigns monotonic `serverSeq`, and broadcasts to peers |
| Persistence | **PGlite + Drizzle ORM** | In-process Postgres with idempotent op store — fine for development, not a distributed production database |
| API | **Fastify** REST + WebSocket | Board creation, join, snapshot, ops-since, checkpoints, portable JSON export/import |
| Protocol schemas | **Zod** (`packages/shared-protocol`) | Validated on both server ingress, test assertions, and portable JSON archives |
| Auth | Signed **JWT** (`jose`) stored in `sessionStorage` | No user accounts; per-board tokens with a role |
| Build / tooling | pnpm workspaces, Vite, TypeScript, Biome, Vitest, Playwright |  |

### Operation Log Replay & Idempotency

All board state is derived by replaying the ordered operation log (`serverSeq` ascending). 
- **Operation deduplication:** Incoming operations with a matching `opId` return their original `serverSeq` idempotently without duplicate broadcast.
- **Gap detection:** If a client detects a non-contiguous `serverSeq`, it queries `GET /api/boards/:id/ops?since=N` to catch up; falls back to `GET /api/boards/:id/snapshot` on catch-up failure.
- **Checkpoints:** A checkpoint snapshots the log at a named point; restore replays up to that point and resets all peers with `server.snapshot_reset`.

---

## Future Options (not implemented)

The following are architecture paths worth exploring as the product matures.
**None of these are implemented.** Evaluating them requires evidence of need before adoption.

### Production Storage
- **Replace PGlite with PostgreSQL** — swap Drizzle's PGlite adapter for `pg` or `postgres.js`. The schema and queries are already Drizzle/SQL-standard; no application logic changes needed.

### Conflict Resolution & Full Offline Editing
- **Yjs / CRDT Multi-Master Editing** — Replace or augment the server-authoritative log with a CRDT document (Yjs or Automerge). DexDraw v0.1.0-rc1 implements bounded IndexedDB crash recovery and cached viewing, but true offline editing with branch merging across disconnected peers is deferred to a CRDT architecture.

### Real-Time Transport
- **WebRTC data channels** — Direct peer-to-peer sync for latency-sensitive presence and drawing, with the server as signalling relay. Reduces server load but adds connection management complexity.
- **Binary transport (MessagePack / Protocol Buffers)** — Replace JSON `ClientOpEnvelope` / `ServerOpEnvelope` with a binary format. Worthwhile only with profiling evidence that JSON serialization is a bottleneck.

### Rendering
- **OffscreenCanvas** — Move canvas rasterization off the main thread. Only relevant if profiling shows paint jank that SVG/DOM cannot fix. Not applicable to the current SVG renderer; requires a renderer migration first.
- **Infinite canvas spatial tiling** — Add dynamic chunked rendering for truly unbounded boards. Current renderer uses a generous board space with viewport pan and zoom controls.

### Spatial Queries
- **Spatial indexing (R-tree)** — Replace linear hit-test scans with an R-tree (`rbush`) for large boards (10 k+ objects). Implement when profiling shows hit-test is measurably slow.

### Security
- **End-to-end encryption (E2EE)** — Encrypt operation payloads before sending so the server cannot read object content. Requires key-exchange protocol and impacts checkpoint/snapshot APIs.

### Geometry
- **Wasm geometry acceleration** — Offload stroke simplification, boolean shape ops, or spatial queries to a Wasm module. Only warranted if JS geometry code is a measured bottleneck.
