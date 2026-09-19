# DexDraw vNext — Operational State & System Reference

**Version:** `v0.1.0-rc1` (Hardened)  
**Date:** 2026-09-19  
**Status:** Verification Complete — Local Verification & Multi-Client E2E Smoke Passing Cleanly

---

## 1. Executive Summary & Production Readiness

DexDraw vNext is a local-first, server-authoritative, real-time collaborative whiteboard built on Fastify, PGlite (embedded PostgreSQL with Drizzle ORM), React, Vite, and SVG rendering. 

The hardening milestone establishes a rock-solid, crash-resilient collaboration foundation without compromising core architectural principles:
- **Server-authoritative ordered log**: Preserved as the singular source of truth.
- **Monotonic `serverSeq`**: Strictly sequenced per-board operations.
- **Operation Idempotency**: Deduplication via `opId` prevents duplicate execution while guaranteeing identical acknowledgment.
- **Sequence Gap & Catch-Up Recovery**: Dynamic gap detection over WebSockets with automatic replay via `GET /api/boards/:id/ops?since=N` and authoritative snapshot fallback.
- **Client Recovery Journal (IndexedDB)**: Bounded local persistence storing the last confirmed snapshot and pending op metadata, enabling safe recovery and cached view visualization.
- **Portable Board JSON Export & Import**: Zod-validated schema with content sanitization, importing by default as a brand-new board while preserving relative geometry and layer order.
- **Recovery Center UI**: User-facing modal diagnostics for real-time connection status, sequence positions, pending operations, cached data age, local JSON backups, and manual snapshot synchronization.
- **Mobile & Touch Interaction**: Full pointer-events stack with responsive pinch-to-zoom, two-finger panning, touch-action constraints, and 44px touch targets.
- **Viewport & Coordinate Authority**: Board-space zoom, pan, and fit controls maintaining pristine SVG coordinate fidelity.
- **Adversarial Collaboration Resilience**: Exhaustive automated testing for concurrent same-object mutations, delete vs edit races, reorder vs delete integrity, checkpoint restores with live peers, and network drop recovery.

> **Explicit Non-Goal Notice:**
> The client-side recovery journal provides bounded crash recovery, network drop resilience, and cached read-only viewing. **Local recovery is not full offline collaborative editing.** Offline branch merging or multi-master CRDTs are explicitly out of scope for this architecture. When offline, clients are presented with a clearly labeled cached view banner and can export their local state or rejoin to catch up with the server log.

---

## 2. Protected Architecture & System Invariants

The following architectural invariants are strictly maintained across the codebase:

1. **Monotonic Sequence Ordering (`serverSeq`)**:
   - Every mutating operation committed to the database is assigned an atomically incrementing `serverSeq` scoped to the board.
   - All client states are strictly derivative of this ordered sequence.
2. **Deterministic Sequence Application**:
   - Given an initial snapshot and an ordered set of operations `serverSeq ∈ [1..N]`, every connected client computes the identical board state.
3. **Store-Level Operation Deduplication**:
   - Operations include a client-generated UUID `opId`.
   - `appendOperation` enforces idempotency using `SELECT ... WHERE board_id = $1 AND op_id = $2`.
   - Retransmissions receive an immediate ACK containing the original `serverSeq` and duplicate indicator, without re-executing or re-broadcasting to other peers.
4. **Authoritative Delete Superiority**:
   - Once an object is deleted via `object.delete`, subsequent concurrent `object.update` or `object.reorder` operations targeting that deleted ID are safely ignored and do not resurrect the object.
5. **Checkpoint Atomicity**:
   - Checkpoints represent immutable snapshots at a specific `serverSeq`.
   - Restoring a checkpoint broadcasts `server.snapshot_reset` to all active participants, resetting local state to the restored checkpoint snapshot and resuming monotonic sequencing.
6. **Role-Based Ingress Validation**:
   - Guests join with `"edit"` role by default (collaborative whiteboard design).
   - Read-only tokens (`role: "view"`) are rejected at the server level for all mutation operations (`stroke.create`, `object.create`, `object.update`, `object.delete`, `object.reorder`, `checkpoint.create`, `checkpoint.restore`).
   - Board renaming (`PATCH /api/boards/:id/title`) is strictly restricted to the `"owner"` role.

---

## 3. Implemented Hardening Subsystems

### 3.1. Operation Idempotency
- **Client Protocol**: `ClientOpEnvelope` mandates `opId: string` (UUID v4) and `boardId: string`.
- **Database Layer**: `appendOperation` in `apps/server-api/src/db/store.ts` checks for existing operations matching `(boardId, opId)` within a single transaction.
- **Idempotency Result**:
  - `isDuplicate: false` -> Operation appended, monotonic `serverSeq` generated, broadcast to peers.
  - `isDuplicate: true` -> Existing `serverSeq` returned, ACK sent only to the submitting client; peer broadcast is skipped to eliminate phantom mutations.

### 3.2. Sequence Gap Detection & Self-Healing
- **Client Gap Monitor**: When receiving `server.op` messages via WebSocket:
  - If incoming `serverSeq === localServerSeq + 1`: Normal application, increment `localServerSeq`.
  - If incoming `serverSeq <= localServerSeq`: Duplicate/stale frame, safely ignored.
  - If incoming `serverSeq > localServerSeq + 1`: Sequence gap detected! Client flags catch-up mode and queries `GET /api/boards/:id/ops?since=${localServerSeq}`.
- **Replay / Snapshot Fallback**:
  - If the ops-since catch-up returns the contiguous log, ops are applied sequentially to close the gap.
  - If catch-up fails or returns non-contiguous ops, the client automatically falls back to `GET /api/boards/:id/snapshot` to refresh state authoritatively without user intervention.

### 3.3. Client Recovery Journal (IndexedDB)
- **Database**: `dexdraw_recovery_journal_v1` using browser IndexedDB with memory-backed fallback for environments without storage access.
- **Bounded Storage**:
  - `confirmed_snapshots`: Stores the latest server-acknowledged snapshot, board metadata, and timestamp.
  - `pending_ops`: Stores unacknowledged optimistic ops queued during network disconnects.
- **Cached View Indication**: When opening an offline or unreachable board with cached data, an amber warning banner appears: `"Viewing cached board from [timestamp]. Read-only until reconnected."`
- **Reconciliation**: Upon network reconnection, pending ops are dispatched through WebSocket with their original `opId`s; the server's idempotent store safely de-duplicates any that were already received.

### 3.4. Portable Board JSON Import & Export
- **Schema & Validation**: Defined in `packages/shared-protocol/src/index.ts` as `BoardArchiveSchema` with Zod validation.
  - Version: `formatVersion: 1`
  - Manifest: `exportedAt`, `schemaVersion: "vNext-1.0"`, `boardName`
  - Payload: Strict array of `BoardObjectSchema` items.
- **REST Endpoints**:
  - `GET /api/boards/:boardId/export`: Serializes board snapshot with sanitized properties.
  - `POST /api/boards/import`: Accepts valid board archive JSON, creates a brand-new board with fresh `boardId` and `shareCode`, inserts objects in preserved z-index order, and returns owner credentials.
- **Safety Invariant**: Importing an archive **never** overwrites existing board state; it creates an independent board instance.

### 3.5. Recovery Center UI
- **Accessible Modal**: Opened via the status strip trigger or `Help & Recovery` menu.
- **Diagnostics Dashboard**:
  - Connection status badge (Connected, Reconnecting, Disconnected, Viewing Cache).
  - Sequence metrics: Current `serverSeq` and acknowledged status.
  - Pending mutations count: Active operations awaiting server ACK.
  - Cache freshness: Human-readable timestamp of last IndexedDB snapshot.
- **Actions**:
  - `Export Local Backup (.json)`: Instantly downloads current board state as a recovery file.
  - `Force Reconnect & Catch Up`: Closes stale WebSocket and reconnects with sequence handshake.
  - `Refresh from Server Snapshot`: Bypasses incremental catch-up and pulls complete server state.

### 3.6. Mobile & Touch Navigation
- **Pointer Events**: Standardized across desktop mouse, stylus pen, and mobile touch.
- **Multi-Touch Gestures**:
  - 2-pointer pinch-to-zoom calculating dynamic focal points.
  - 2-pointer drag-to-pan updating board viewport offsets.
- **Touch Ergonomics**:
  - Canvas container styled with `touch-action: none` to eliminate browser pull-to-refresh collisions.
  - Bounding box resize handles enlarged to 44px touch targets on mobile/tablet screens.
  - Dedicated Viewport Zoom HUD (+ / - / Reset / Fit) accessible on all screen sizes.

---

## 4. Adversarial Conflict Matrix & Test Coverage

The test suite systematically covers all real-world concurrent conflict scenarios:

| Scenario | Trigger Condition | System Resolution | Automated Test |
|---|---|---|---|
| **A: Same Object / Same Time** | Client 1 & Client 2 mutate different fields of object simultaneously | Monotonic log ordering; latter `serverSeq` wins deterministically; all clients converge to identical state | `conflict.test.ts` (Scenario A) |
| **B: Delete vs Edit** | Client 1 deletes object while Client 2 edits it concurrently | Object is permanently deleted; late edit targeting dead ID is dropped; no resurrection | `conflict.test.ts` (Scenario B) |
| **C: Reorder vs Delete** | Client 1 deletes object while Client 2 changes its z-order | Deleted ID is pruned from order list; reorder does not resurrect deleted object | `conflict.test.ts` (Scenario C) |
| **D: Checkpoint Restore with Peers** | Owner restores checkpoint while peers are drawing actively | Server rolls back log, broadcasts `server.snapshot_reset`; all peers sync immediately | `conflict.test.ts` (Scenario D) |
| **E: Board Rename Concurrency** | Owner renames board while guest attempts unauthorized rename | Owner rename succeeds and broadcasts `board_title_update`; guest rename returns 403 Forbidden | `conflict.test.ts` (Scenario E) |
| **F: Duplicate Op Retransmission** | Client resends op due to network timeout or retry | Store detects duplicate `opId`, replies with ACK + duplicate flag; peers receive no duplicate | `import-export.test.ts` |
| **G: Disconnect After Send** | Client sends op, disconnects before ACK, reconnects | Reconnecting client fetches missed ops since sequence; state reconciles cleanly | `conflict.test.ts` (Scenario H & J) |
| **H: WebSocket Sequence Gap** | Network drops frame, next frame has `serverSeq + K` | Client detects gap, requests `ops?since=N`, replays missed ops, resumes sync | `conflict.test.ts` (Scenario H & J) |
| **I: JSON Archive Portability** | Export board to JSON, validate schema, import into new room | Generates new board ID, retains all object IDs and geometry, validates against Zod | `import-export.test.ts` & `e2e-smoke.ts` |
| **J: Multi-Touch Viewport** | 2-finger pinch-zoom on touch device | Preserves board coordinate invariant: board point under pinch center remains invariant | `viewport.test.ts` & `e2e-smoke.ts` |

---

## 5. Verification Commands & Results

All verification checks run cleanly without warnings or failures:

```bash
# 1. Typecheck all packages
pnpm typecheck
# Result: 4 of 4 packages clean (0 errors)

# 2. Comprehensive Vitest suite (15 test suites, 154 unit & server tests)
pnpm test
# Result: 154 passed (100% passing)
#   - packages/shared-core: 2 tests passed
#   - packages/shared-protocol: 6 tests passed
#   - apps/client-web: 122 tests passed (9 test files)
#   - apps/server-api: 24 tests passed (4 test files)

# 3. Multi-client End-to-End Smoke Test (12 headless collaboration stages)
pnpm test:smoke
# Result: 12 of 12 steps PASSED cleanly

# 4. Production build
pnpm build
# Result: Client Vite bundle (gzip ~117 kB) + Server tsc compiled clean

# 5. Linter and formatter (Biome)
pnpm lint
# Result: 87 files checked, 0 errors, 0 warnings

# 6. Unified local CI verification pipeline
bash scripts/verify.sh
# Result: All gates pass, exits with code 0
```

---

## 6. Runtime Configuration & Environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Fastify backend listening port |
| `HOST` | `0.0.0.0` | Backend bind host (bound to `0.0.0.0` for container proxy support) |
| `TOKEN_SECRET` | `dev-only-secret-change-me` | Secret key for signing board access JWTs |
| `PUBLIC_CLIENT_ORIGIN` | `""` (allow all) | CORS allowed origin for client web requests |

---

## 7. Operational Summary & Handoff Checklist

- [x] Monotonic `serverSeq` verified across concurrent mutations.
- [x] Store-level `opId` deduplication verified against network retransmissions.
- [x] Sequence gap recovery verified with automatic catch-up and snapshot fallback.
- [x] IndexedDB recovery journal verified with bounded storage and cached view alerts.
- [x] JSON board export and import verified with schema validation and ID preservation.
- [x] Recovery Center UI integrated with diagnostics and backup actions.
- [x] Touch-action, pinch-to-zoom, and 44px handle touch targets verified.
- [x] Viewport navigation with board coordinate authority verified.
- [x] All 154 unit/integration tests and 12-step E2E smoke tests passing cleanly.
- [x] Biome lint and TypeScript strict typechecks 100% clean.
