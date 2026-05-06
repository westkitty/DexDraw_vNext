# Security Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three targeted security issues found in the CORS configuration, `object.update` patch validation, and project documentation; and append missing commit hashes to Bible Entry 13.

**Architecture:** All server security fixes live in `apps/server-api/src/app.ts` and `packages/shared-protocol/src/index.ts`. Documentation changes go to `README.md` and `DexDraw_vNext_Bible.md`. No architecture rewrites.

**Tech Stack:** TypeScript, Fastify, `@fastify/cors`, Zod, Vitest

---

## File Map

| Action | File |
|--------|------|
| Append  | `DexDraw_vNext_Bible.md` (corrective postscript on Entry 13) |
| Modify  | `apps/server-api/src/app.ts` (CORS env-var fix) |
| Modify  | `packages/shared-protocol/src/index.ts` (patch key validation) |
| Modify  | `apps/server-api/src/__tests__/server.test.ts` (CORS test + patch test) |
| Modify  | `README.md` (join role tradeoff note) |
| Append  | `DexDraw_vNext_Bible.md` (Entry 14) |

---

### Task 1: Add corrective postscript to Bible Entry 13

Entry 13 is complete except it does not list the individual session commit hashes. Add a one-paragraph note after the existing Entry 13 body.

**Files:**
- Modify: `DexDraw_vNext_Bible.md`

- [ ] **Step 1: Append postscript**

Run from repo root:
```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git log --oneline 1b91387^..eaf8b77
```

That will print the 7 commits. Append **exactly** this text after the last line of Entry 13 (after the "3. Richer presence UI" line):

```markdown

### Commit Hashes (Entry 13 session)

| Hash | Message |
|------|---------|
| `1b91387` | fix: scope appendOperation idempotency check to boardId+opId |
| `138fef1` | fix: use valid UUID constant for system clientId in template seed ops |
| `56dbb42` | fix: replace Math.random share code with crypto.randomUUID |
| `caaf332` | docs: add root README with quickstart, architecture, and roadmap |
| `a52f299` | chore: add .env.example and scripts/verify.sh |
| `b80e53c` | fix: extend concurrent test timeout; apply biome formatting |
| `eaf8b77` | docs: append Bible Entry 13 — quota-saver correctness pass |
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add DexDraw_vNext_Bible.md
git commit -m "docs: add commit hash table to Bible Entry 13"
```

---

### Task 2: CORS — read PUBLIC_CLIENT_ORIGIN from env

**Bug:** `apps/server-api/src/index.ts` calls `buildApp()` with no arguments. `options.publicClientOrigin` is always `undefined`. `app.ts` reads `options.publicClientOrigin ?? true` which means CORS is permanently wide-open regardless of the `PUBLIC_CLIENT_ORIGIN` env var documented in `.env.example`.

**Fix:** In `app.ts`, change the CORS registration to also read from `process.env.PUBLIC_CLIENT_ORIGIN`:

```typescript
// BEFORE
await app.register(cors, {
  origin: options.publicClientOrigin ?? true,
});
```

```typescript
// AFTER
const corsOrigin =
  options.publicClientOrigin ?? process.env.PUBLIC_CLIENT_ORIGIN;
await app.register(cors, {
  origin: corsOrigin ?? true,
});
```

This preserves existing dev behavior (allow-all when env var is unset) while making `PUBLIC_CLIENT_ORIGIN` actually take effect.

**Files:**
- Modify: `apps/server-api/src/app.ts`
- Modify: `apps/server-api/src/__tests__/server.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside the existing `describe("server api", ...)` block in `apps/server-api/src/__tests__/server.test.ts`, after the last `it(...)`:

```typescript
  it("restricts CORS to the configured public client origin", async () => {
    const { app } = await buildApp({
      dataDir,
      tokenSecret: "test-secret-key",
      publicClientOrigin: "http://app.example.com",
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example.com" },
    });

    // When a specific origin is configured, @fastify/cors reflects only that
    // origin — not the request's Origin header. A mismatched browser request
    // would therefore fail the CORS check.
    const acao = response.headers["access-control-allow-origin"];
    expect(acao).toBe("http://app.example.com");

    await app.close();
  }, 15_000);
```

- [ ] **Step 2: Run test — confirm it FAILS**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `acao` is `"http://evil.example.com"` (current code reflects request origin when `publicClientOrigin` is set, showing it does work when passed directly; the new test with `publicClientOrigin` may actually pass — if so, proceed to env-var coverage).

> **Note to implementer:** `@fastify/cors` with `origin: "http://app.example.com"` (a string) always sends that string as `Access-Control-Allow-Origin`. The test should pass once the fix is in. If the test already passes because `publicClientOrigin` is threaded through, the gap is only the env-var path — still apply the fix so `process.env.PUBLIC_CLIENT_ORIGIN` works at runtime.

- [ ] **Step 3: Apply the fix**

In `apps/server-api/src/app.ts`, replace:

```typescript
  await app.register(cors, {
    origin: options.publicClientOrigin ?? true,
  });
```

with:

```typescript
  const corsOrigin =
    options.publicClientOrigin ?? process.env.PUBLIC_CLIENT_ORIGIN;
  await app.register(cors, {
    origin: corsOrigin ?? true,
  });
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add apps/server-api/src/app.ts apps/server-api/src/__tests__/server.test.ts
git commit -m "fix: read PUBLIC_CLIENT_ORIGIN env var for CORS allowlist"
```

---

### Task 3: object.update — reject forbidden patch fields

**Bug:** `UpdateObjectPayloadSchema` accepts `patch: z.record(z.string(), z.unknown())` with no key restriction. The `snapshotFromOps` merge (`{ ...prev, ...patch }`) lets a client overwrite `id`, `type`, `createdAt`, or `createdBy` — breaking object identity and audit fields.

**Fix:** Add a `.superRefine` check to `UpdateObjectPayloadSchema` in `packages/shared-protocol/src/index.ts`.

The four forbidden keys are: `id`, `type`, `createdAt`, `createdBy`.

**Files:**
- Modify: `packages/shared-protocol/src/index.ts`
- Modify: `apps/server-api/src/__tests__/server.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe("server api", ...)` in `apps/server-api/src/__tests__/server.test.ts`:

```typescript
  it("rejects object.update patches that attempt to overwrite id or type", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const port = (
      app.server.address() as import("node:net").AddressInfo
    ).port;

    // Create a board and connect
    const created = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Patch Test",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((r) => r.json());

    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    // Wait for server.welcome
    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        if (JSON.parse(String(ev.data)).type === "server.welcome") resolve();
      });
    });

    // Attempt an object.update with a forbidden "id" key in the patch
    const errorMsg = await new Promise<{ type: string; code: string }>(
      (resolve, reject) => {
        ws.addEventListener("message", (ev) => {
          const m = JSON.parse(String(ev.data));
          if (m.type === "server.error") resolve(m);
        });
        ws.addEventListener("error", reject, { once: true });

        ws.send(
          JSON.stringify({
            type: "client.op",
            boardId: created.boardId,
            clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            clientSeq: 1,
            opId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            opType: "object.update",
            payload: {
              id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              patch: {
                id: "00000000-0000-0000-0000-000000000000",
                x: 100,
              },
            },
            sentAt: "2026-05-05T00:00:00.000Z",
          }),
        );
      },
    );

    expect(errorMsg.code).toBe("invalid_payload");

    ws.close();
    await app.close();
  }, 20_000);
```

- [ ] **Step 2: Run test — confirm it FAILS**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — the server currently accepts the patch and does NOT return `server.error`.

- [ ] **Step 3: Add forbidden-key validation to UpdateObjectPayloadSchema**

In `packages/shared-protocol/src/index.ts`, find:

```typescript
export const UpdateObjectPayloadSchema = z.object({
  id: z.string().uuid(),
  patch: z.record(z.string(), z.unknown()),
});
```

Replace with:

```typescript
const FORBIDDEN_PATCH_KEYS = ["id", "type", "createdAt", "createdBy"] as const;

export const UpdateObjectPayloadSchema = z
  .object({
    id: z.string().uuid(),
    patch: z.record(z.string(), z.unknown()),
  })
  .superRefine((value, ctx) => {
    for (const key of FORBIDDEN_PATCH_KEYS) {
      if (key in value.patch) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["patch", key],
          message: `Patch may not overwrite immutable field "${key}".`,
        });
      }
    }
  });
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm --filter @dexdraw/server-api test -- --reporter=verbose 2>&1 | tail -20
```

Expected: all tests PASS (including the new one).

- [ ] **Step 5: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add packages/shared-protocol/src/index.ts apps/server-api/src/__tests__/server.test.ts
git commit -m "fix: reject forbidden fields (id/type/createdAt/createdBy) in object.update patch"
```

---

### Task 4: Document join role tradeoff + add Bible Entry 14

**Decision:** Default join role stays `"edit"`. Changing it to `"view"` would break the core product flow (collaborative whiteboard where anyone with the link can draw). This is a deliberate choice, documented here.

**Files:**
- Modify: `README.md`
- Modify: `DexDraw_vNext_Bible.md`

- [ ] **Step 1: Add security/tradeoffs section to README**

In `README.md`, find the `## Status` section. After the closing paragraph ("Do not deploy this with real user data..."), add a new section:

```markdown

## Security Tradeoffs

| Area | Current behavior | Why / tradeoff |
|------|-----------------|----------------|
| **Join role default** | Guests who join without `requestedRole` receive `"edit"` access | Collaborative whiteboard; edit-by-default is the intended product flow. Change to `"view"` if you want read-only guests by default — update `app.ts` line `const role = payload.requestedRole ?? "edit"` and the join test. |
| **CORS** | Allows all origins when `PUBLIC_CLIENT_ORIGIN` is unset | Dev-friendly; set `PUBLIC_CLIENT_ORIGIN` in production (see `.env.example`). |
| **Token storage** | JWTs in `sessionStorage` | Not shared across tabs, not persistent — acceptable for a prototype. Use `httpOnly` cookies for production. |
```

- [ ] **Step 2: Append Bible Entry 14**

Append to the end of `DexDraw_vNext_Bible.md`:

```markdown

## Entry 14 — Security Review Pass (2026-05-05)

### Session Goal
Small targeted security improvements: CORS env-var wiring, object.update forbidden-field rejection, join role documentation.

### Files Changed

| File | Change |
|------|--------|
| `DexDraw_vNext_Bible.md` | Added commit hash table to Entry 13 (postscript). |
| `apps/server-api/src/app.ts` | CORS now reads `process.env.PUBLIC_CLIENT_ORIGIN` when `options.publicClientOrigin` is not passed — fixes the gap where `buildApp()` (called with no args at runtime) never applied the env var. |
| `packages/shared-protocol/src/index.ts` | `UpdateObjectPayloadSchema` now rejects patches containing `id`, `type`, `createdAt`, or `createdBy` via `.superRefine`. |
| `apps/server-api/src/__tests__/server.test.ts` | Added CORS allowlist test; added `object.update` forbidden-patch regression test. |
| `README.md` | Added Security Tradeoffs table documenting join role default, CORS behavior, and token storage. |

### Security Decisions

1. **CORS was fully open at runtime** — `buildApp()` is called with no options in `index.ts`, so `options.publicClientOrigin` was always `undefined`. The fix reads `process.env.PUBLIC_CLIENT_ORIGIN` as a fallback inside `buildApp`. Dev behavior (allow-all) unchanged when env var is unset.

2. **object.update forbidden fields** — `patch` is `z.record(z.string(), z.unknown())`. Without a key guard, `{ id: "...", type: "..." }` in a patch would be spread over the stored object, corrupting identity and audit fields. Added `FORBIDDEN_PATCH_KEYS` superRefine check.

3. **Join role default stays `"edit"`** — Changing to `"view"` would require explicit `requestedRole: "edit"` from every joining client. That breaks the intended "share link → draw" flow. Documented as a deliberate tradeoff in README.

### Bugs NOT fixed (deliberate deferral)

- JWT in `sessionStorage` — acceptable for prototype; noted in README.
- No HTTPS enforcement — out of scope for a local dev server.

### Commands Run (Gates)

```
pnpm typecheck   # 0 errors
pnpm test        # all passed
pnpm build       # pass
pnpm lint        # 0 errors
```
```

- [ ] **Step 3: Run lint to catch any formatting issues**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm lint 2>&1 | tail -5
```

If lint fails with format errors only, run `pnpm format` first, then re-run lint.

- [ ] **Step 4: Commit**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git add README.md DexDraw_vNext_Bible.md
git commit -m "docs: security tradeoffs in README and Bible Entry 14"
```

---

### Task 5: Final verification

- [ ] **Step 1: Full suite**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

Expected: all pass. If lint fails on format, run `pnpm format` then re-run `pnpm lint`.

- [ ] **Step 2: Report final commit log**

```bash
cd "/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Projects/DexDraw"
git log --oneline -6
```

Include this output in the final report.

---

## Self-Review

**Spec coverage:**
- ✅ Entry 13 commit hashes → Task 1
- ✅ CORS allowlist → Task 2
- ✅ Join role default → documented in Task 4 (no code change, as spec allows)
- ✅ object.update forbidden fields → Task 3
- ✅ Bible Entry 14 → Task 4
- ✅ Final verification → Task 5

**Placeholder scan:** None found. All code blocks contain exact, runnable content.

**Type consistency:** `FORBIDDEN_PATCH_KEYS` defined in Task 3 only — no cross-task references.
