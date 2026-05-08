# DexDraw — Architecture & Roadmap

> **Status:** Developer prototype / alpha.
> The items marked **Future** are **not implemented** in this repo.
> They are recorded here to document known tradeoffs and avoid re-litigating them.

---

## Current Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Client renderer | React + Vite + **SVG** | Direct SVG elements for strokes, shapes, and text; no canvas or WebGL |
| Client state | React `useState` / `useReducer` | Optimistic local updates; server-authoritative reconciliation |
| Transport | **WebSocket** (Fastify `@fastify/websocket`) | One persistent connection per board session |
| Sync model | **Server-authoritative operation log** | Client sends `ClientOpEnvelope`; server assigns `serverSeq` and broadcasts `ServerOpEnvelope` to all peers |
| Persistence | **PGlite + Drizzle ORM** | In-process Postgres — fine for development, not a production database |
| API | **Fastify** REST + WebSocket | Board creation, join, snapshot, ops-since, checkpoints |
| Protocol schemas | **Zod** (`packages/shared-protocol`) | Validated on both server ingress and test assertions |
| Auth | Signed **JWT** (`jose`) stored in `sessionStorage` | No user accounts; per-board tokens with a role |
| Build / tooling | pnpm workspaces, Vite, TypeScript, Biome, Vitest, Playwright |  |

### Operation Log Replay

All board state is derived by replaying the ordered operation log (`serverSeq` ascending). Checkpoints snapshot the log at a named point; restore replays up to that point and resets all peers with `server.snapshot_reset`.

---

## Future Options (not implemented)

The following are architecture paths worth exploring as the product matures.
**None of these are implemented.** Evaluating them requires evidence of need before adoption.

### Production Storage
- **Replace PGlite with PostgreSQL** — swap Drizzle's PGlite adapter for `pg` or `postgres.js`. The schema and queries are already Drizzle/SQL-standard; no application logic changes needed.

### Conflict Resolution & Offline-First
- **Yjs / CRDT** — Replace the server-authoritative log with a CRDT document (Yjs or Automerge). Enables true peer-to-peer merge, offline editing, and eventual consistency. Significant architectural change; requires migrating object identity, undo/redo, and checkpoints.
- **IndexedDB offline-first** — Persist the operation log client-side so the board survives network drops. Pairs naturally with a CRDT approach. Adds complexity to snapshot/replay and sync-on-reconnect.

### Real-Time Transport
- **WebRTC data channels** — Direct peer-to-peer sync for latency-sensitive presence and drawing, with the server as signalling relay. Reduces server load but adds connection management complexity.
- **Binary transport (MessagePack / Protocol Buffers)** — Replace JSON `ClientOpEnvelope` / `ServerOpEnvelope` with a binary format. Worthwhile only with profiling evidence that JSON serialization is a bottleneck.

### Rendering
- **OffscreenCanvas** — Move canvas rasterization off the main thread. Only relevant if profiling shows paint jank that SVG/DOM cannot fix. Not applicable to the current SVG renderer; requires a renderer migration first.
- **Camera matrix / infinite canvas** — Add a viewport transform (`scale`, `translateX`, `translateY`) so the board extends beyond the initial viewport. Current renderer uses fixed SVG `viewBox`.

### Spatial Queries
- **Spatial indexing (R-tree)** — Replace linear hit-test scans with an R-tree (`rbush`) for large boards (10 k+ objects). Implement when profiling shows hit-test is measurably slow.

### Security
- **End-to-end encryption (E2EE)** — Encrypt operation payloads before sending so the server cannot read object content. Requires key-exchange protocol and impacts checkpoint/snapshot APIs.

### Geometry
- **Wasm geometry acceleration** — Offload stroke simplification, boolean shape ops, or spatial queries to a Wasm module. Only warranted if JS geometry code is a measured bottleneck.
