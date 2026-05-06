# DexDraw vNext Quota-Saver Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three highest-impact correctness bugs in the server store, add targeted regression tests, and create the missing README / .env.example / verify script so the repo is easy to test and share.

**Architecture:** PGlite-backed Fastify API + React/Vite client in a pnpm monorepo. All store mutations go through `apps/server-api/src/db/store.ts`; protocol schemas live in `packages/shared-protocol/src/index.ts`. Tests use vitest; E2E uses Playwright.

**Tech Stack:** TypeScript, Fastify, PGlite, Drizzle ORM, Zod, Vitest, Biome, pnpm workspaces

---

## File Map

| Action | File |
|--------|------|
| Modify | `apps/server-api/src/db/store.ts` |
| Modify | `apps/server-api/src/__tests__/store.test.ts` |
| Modify | `apps/server-api/src/__tests__/server.test.ts` |
| Create | `README.md` |
| Create | `.env.example` |
| Create | `scripts/verify.sh` |
| Append | `DexDraw_vNext_Bible.md` |

---

### Task 1: Fix boardId-scoped idempotency in `appendOperation`

**Bug:** `appendOperation` in `store.ts` checks for duplicate ops using only `opId`, without scoping by `boardId`. The same `opId` used on two different boards would return the *first* board's canonical op — wrong `boardId`, wrong `serverSeq`, potential data corruption.

Two places are affected:
- **Early-exit check** (~line 80): `where(eq(operations.opId, op.opId))`
- **Conflict-recovery query** inside the `board_op_unique` catch (~line 116): same un-scoped query

**Files:**
- Modify: `apps/server-api/src/db/store.ts`
- Modify: `apps/server-api/src/__tests__/store.test.ts`

- [ ] **Step 1: Write the failing test**

Add this `describe` block to `apps/server-api/src/__tests__/store.test.ts`, after the existing `describe("store appendOperation", ...)` block:

```typescript
describe("store appendOperation — boardId scoping", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "dexdraw-scope-"));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("same opId on two boards returns each board's own canonical op", async () => {
    const store = await createStore(dataDir);
    const blankTemplate = {
      id: "blank",
      name: "Blank",
      description: "Empty board",
      objects: [],
    };

    const board1 = await store.createBoard({
      name: "Board One",
      templateId: "blank",
      displayName: "Owner",
      template: blankTemplate,
    });
    const board2 = await store.createBoard({
      name: "Board Two",
      templateId: "blank",
      displayName: "Owner",
      template: blankTemplate,
    });

    const sharedOpId = "aaaabbbb-cccc-4ddd-8eee-ffffffffffff";
    const baseObj = {
      createdBy: "Owner",
      createdAt: "2026-05-05T00:00:00.000Z",
      updatedAt: "2026-05-05T00:00:00.000Z",
      style: { color: "#000000", width: 2 },
      type: "stroke" as const,
      points: [
        { x: 0, y: 0, pressure: 0.5 },
        { x: 10, y: 10, pressure: 0.5 },
      ],
      zIndex: 0,
    };

    const op1: ClientOpEnvelope = {
      type: "client.op",
      boardId: board1.boardId,
      clientId: "11111111-1111-4111-8111-111111111111",
      clientSeq: 1,
      opId: sharedOpId,
      opType: "object.create",
      payload: { ...baseObj, id: "00000001-0000-4000-8000-000000000001" },
      sentAt: "2026-05-05T00:00:00.000Z",
    };
    const op2: ClientOpEnvelope = {
      type: "client.op",
      boardId: board2.boardId,
      clientId: "22222222-2222-4222-8222-222222222222",
      clientSeq: 1,
      opId: sharedOpId,
      opType: "object.create",
      payload: { ...baseObj, id: "00000002-0000-4000-8000-000000000002" },
      sentAt: "2026-05-05T00:00:00.000Z",
    };

    const result1 = await store.appendOperation(op1);
    const result2 = await store.appendOperation(op2);

    // Each result must report its own board — not board1's data for board2
    expect(result1.boardId).toBe(board1.boardId);
    expect(result2.boardId).toBe(board2.boardId);
    // payloads must differ — board2 didn't get board1's object
    expect((result2.payload as { id: string }).id).toBe(
      "00000002-0000-4000-8000-000000000002",
    );

    await store.close();
  });
});
```

- [ ] **Step 2: Run the test — confirm it FAILS**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — result2.boardId equals board1.boardId (the bug).

- [ ] **Step 3: Fix `appendOperation` in `store.ts`**

In `apps/server-api/src/db/store.ts`, find the early-exit duplicate check:

```typescript
// BEFORE
const existing = await db
  .select()
  .from(operations)
  .where(eq(operations.opId, op.opId))
  .limit(1);
```

Replace with:

```typescript
// AFTER
const existing = await db
  .select()
  .from(operations)
  .where(and(eq(operations.boardId, op.boardId), eq(operations.opId, op.opId)))
  .limit(1);
```

Then find the conflict-recovery query inside the `board_op_unique` catch block:

```typescript
// BEFORE
const duplicate = await db
  .select()
  .from(operations)
  .where(eq(operations.opId, op.opId))
  .limit(1);
```

Replace with:

```typescript
// AFTER
const duplicate = await db
  .select()
  .from(operations)
  .where(and(eq(operations.boardId, op.boardId), eq(operations.opId, op.opId)))
  .limit(1);
```

- [ ] **Step 4: Run the test — confirm it PASSES**

```bash
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add apps/server-api/src/db/store.ts apps/server-api/src/__tests__/store.test.ts
git commit -m "fix: scope appendOperation idempotency check to boardId+opId"
```

---

### Task 2: Fix template `clientId: "system"` → valid UUID constant

**Bug:** When a board is created from a non-blank template (e.g., `meeting-grid`), the seed operations are stored with `clientId: "system"`. But `ServerOpEnvelopeSchema` (and the `/api/boards/:boardId/ops` response that parses through it) requires `clientId: z.string().uuid()`. Calling `/api/boards/:boardId/ops?since=0` on a templated board would throw a Zod parse error.

**Files:**
- Modify: `apps/server-api/src/db/store.ts`
- Modify: `apps/server-api/src/__tests__/server.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test inside the existing `describe("server api", ...)` block in `apps/server-api/src/__tests__/server.test.ts`:

```typescript
  it("returns valid ops for a board created from a non-blank template", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });

    const created = await app.inject({
      method: "POST",
      url: "/api/boards",
      payload: {
        name: "Meeting",
        templateId: "meeting-grid",
        displayName: "Owner",
      },
    });
    const board = created.json() as { boardId: string; ownerToken: string };

    const ops = await app.inject({
      method: "GET",
      url: `/api/boards/${board.boardId}/ops?since=0`,
      headers: { authorization: `Bearer ${board.ownerToken}` },
    });

    expect(ops.statusCode).toBe(200);
    // OpsSinceResponseSchema.parse must not throw — clientId must be a UUID
    const { OpsSinceResponseSchema } = await import("@dexdraw/shared-protocol");
    expect(() => OpsSinceResponseSchema.parse(ops.json())).not.toThrow();

    await app.close();
  }, 15_000);
```

- [ ] **Step 2: Run the test — confirm it FAILS**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — Zod validation error on `clientId`.

- [ ] **Step 3: Fix `createBoard` in `store.ts`**

At the top of `createStore` (before the returned object), add:

```typescript
const SYSTEM_CLIENT_ID = "00000000-0000-4000-8000-000000000000";
```

Then in `createBoard`, replace:

```typescript
// BEFORE
clientId: "system",
```

with:

```typescript
// AFTER
clientId: SYSTEM_CLIENT_ID,
```

- [ ] **Step 4: Run the test — confirm it PASSES**

```bash
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add apps/server-api/src/db/store.ts apps/server-api/src/__tests__/server.test.ts
git commit -m "fix: use valid UUID constant for system clientId in template seed ops"
```

---

### Task 3: Replace `Math.random` share code with crypto

**Bug:** `createShareCode()` uses `Math.random()`, which is not cryptographically random. Share codes are used as board access tokens — they should come from a secure source.

**Files:**
- Modify: `apps/server-api/src/db/store.ts`

- [ ] **Step 1: Replace `createShareCode` in `store.ts`**

Find:

```typescript
function createShareCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
```

Replace with:

```typescript
function createShareCode() {
  // Use the same Web Crypto API already used for randomUUID — available in Node 22+
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -20
```

Expected: All existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/server-api/src/db/store.ts
git commit -m "fix: replace Math.random share code with crypto.randomUUID"
```

---

### Task 4: Create `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md` at repo root**

Content is in the next step; create the file with this exact content:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add README.md
git commit -m "docs: add root README with quickstart, architecture, and roadmap"
```

---

### Task 5: Create `.env.example`

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example` at repo root**

```bash
# .env.example — copy to apps/server-api/.env for local dev
PORT=4000
HOST=0.0.0.0
TOKEN_SECRET=change-me
PUBLIC_CLIENT_ORIGIN=http://127.0.0.1:5173
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add .env.example
git commit -m "chore: add .env.example with required server variables"
```

---

### Task 6: Create `scripts/verify.sh`

**Files:**
- Create: `scripts/verify.sh`

- [ ] **Step 1: Create `scripts/verify.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> DexDraw vNext — local verification"
echo ""

echo "--- corepack enable"
corepack enable

echo "--- pnpm install"
pnpm install

echo "--- typecheck"
pnpm typecheck

echo "--- test"
pnpm test

echo "--- build"
pnpm build

echo "--- lint"
pnpm lint

echo ""
echo "==> All checks passed."
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw/scripts/verify.sh"
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add scripts/verify.sh
git commit -m "chore: add scripts/verify.sh one-command local CI"
```

---

### Task 7: Final verification pass

- [ ] **Step 1: Run full suite**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

Expected: all pass, 0 errors.

- [ ] **Step 2: If any step fails, fix before continuing**

---

### Task 8: Append Bible Entry 13

- [ ] **Step 1: Append to `DexDraw_vNext_Bible.md`**

Append after the last entry:

```markdown
## Entry 13 — Quota-Saver Correctness Pass (2026-05-05)

### Session Goal
Fix the three highest-impact correctness bugs found in an audit pass, and add the missing project scaffolding (README, .env.example, verify script) to make the repo easy to test and share.

### Files Changed

| File | Change |
|------|--------|
| `apps/server-api/src/db/store.ts` | Fixed boardId-scoped idempotency in `appendOperation` (2 query sites). Added `SYSTEM_CLIENT_ID` UUID constant to replace `"system"` in template seed ops. Replaced `Math.random` share code with `crypto.randomUUID`. |
| `apps/server-api/src/__tests__/store.test.ts` | Added regression test: same opId on two boards returns each board's own canonical op. |
| `apps/server-api/src/__tests__/server.test.ts` | Added regression test: `/api/boards/:id/ops?since=0` on a templated board parses cleanly against `OpsSinceResponseSchema`. |
| `README.md` | **new** — quickstart, architecture, scripts, environment variables, manual smoke test, roadmap. |
| `.env.example` | **new** — PORT, HOST, TOKEN_SECRET, PUBLIC_CLIENT_ORIGIN. |
| `scripts/verify.sh` | **new** — one-command local CI: install → typecheck → test → build → lint. |

### Bugs Fixed

1. **boardId-scoped idempotency** — `appendOperation` was checking `WHERE op_id = ?` without a `board_id` clause. The same `opId` used on two boards would cause the second board's op to return the first board's canonical record (wrong `boardId`, wrong `serverSeq`). Fixed both the early-exit check and the conflict-recovery re-query.

2. **Template `clientId: "system"`** — Seed ops from non-blank templates stored `clientId: "system"`, which fails `ServerOpEnvelopeSchema`'s `z.string().uuid()` validation. Replaced with `SYSTEM_CLIENT_ID = "00000000-0000-4000-8000-000000000000"`.

3. **`Math.random` share codes** — Share codes are used as board access tokens; replaced with `crypto.randomUUID().replace(/-/g,"").slice(0,6)`.

### Decisions Made

- Kept CORS logic as-is (`origin: options.publicClientOrigin ?? true`): dev-open is intentional, and `PUBLIC_CLIENT_ORIGIN` is now documented in `.env.example`.
- Did NOT add Playwright to `verify.sh` — E2E requires browser install which is expensive. README documents it as a separate optional step.
- SYSTEM_CLIENT_ID placed inside `createStore` closure (not module-level) to keep it scoped to the store and not exported as protocol-layer detail.

### Commands Run (Gates)

```
pnpm typecheck   # 0 errors
pnpm test        # all pass
pnpm build       # pass
pnpm lint        # 0 errors
```

### State After Completion

- All unit and server tests pass.
- `pnpm typecheck`, `pnpm build`, `pnpm lint` clean.
- README, .env.example, and scripts/verify.sh present at repo root.

### Next Steps

1. Resize handles on selected objects.
2. Marquee (drag-to-select) on the canvas.
3. Richer presence UI (avatar bubbles).
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add DexDraw_vNext_Bible.md
git commit -m "docs: append Bible Entry 13 — quota-saver correctness pass"
```
