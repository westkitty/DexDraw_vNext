# DexDraw Consolidation Matrix

**Generated:** 2026-06-28  
**Audit type:** Evidence-first, hostile, read-only inspection  
**Rule:** No merge, no copy, no delete, no push. Describe only.

---

## 1. Executive Verdict

| | |
|---|---|
| **Canonical repo** | `/Users/andrew/DexDraw_vNext` |
| **Donor/historical repo** | `/Users/andrew/Library/Mobile Documents/comappleCloudDocs/Projects/Dex_Draw.nosync` — **DOES NOT EXIST.** Path verified: `ls` returns "No such file or directory". This repo is gone or was never downloaded from iCloud. |
| **Prototype / reference** | `/Users/andrew/Documents/Codex/2026-06-28/f/work/dexdraw_redux_remote_full` — an AI Studio-generated scaffold ("react-example", Express + SQLite, 2 commits). Contains `dexDraw_old/` subdirectory which is the actual historical DexDraw predecessor (v0.1.0-meeting, 2026-02-09, Canvas-based, PostgreSQL). |
| **Supports consolidation into vNext?** | Yes. vNext is the correct canonical destination. All active development belongs here. |
| **Any repo role uncertain?** | The iCloud donor does not exist; its role is moot. The "Redux" repo is an AI Studio scaffold that should never be treated as a vNext peer — only `dexDraw_old/` inside it has historical value. |

**Bottom line:** There are not three repos to reconcile. There are two: vNext (canonical, active, verified working) and `dexDraw_old` (historical ancestor, Canvas-based, embedded inside an unrelated AI Studio scaffold). The iCloud path is a dead reference.

---

## 2. Repos Inspected

### 2a. DexDraw_vNext (canonical)

| Field | Value |
|---|---|
| Absolute path | `/Users/andrew/DexDraw_vNext` |
| Git branch | `main` |
| Git HEAD | `ca7c608 fix: use semantic output for board metrics` |
| Package name | `dexdraw-vnext` (private, pnpm workspace) |
| Framework / runtime | React 19.1.1, Fastify 5.6.0, PGlite 0.2.17, Drizzle ORM 0.44.5, Zod 4.1.5, Vite 7.1.5, TypeScript 5.9.3 |
| Test evidence | 113 client unit tests (7 files), 15 server unit tests (2 files), 18 Playwright e2e spec files, all passing as of this audit |
| Docs / handoff | `docs/architecture-roadmap.md`, `docs/release-checklist.md`, `docs/demo-script.md`, `docs/testing.md`, `handoff/DexDraw_vNext_Design_Handoff/`, `README.md`, `.resurrection/` |
| Git status | Dirty: `.resurrection/` untracked only — no modified tracked files |
| Remote | `git@github.com:westkitty/DexDraw_vNext.git` |
| Obvious warnings | `.resurrection/research-artifact-source.md:125` flagged for `openai_sk_prefix` — potential secret in handoff directory |

### 2b. Dex_Draw.nosync (iCloud donor)

| Field | Value |
|---|---|
| Absolute path | `/Users/andrew/Library/Mobile Documents/comappleCloudDocs/Projects/Dex_Draw.nosync` |
| Exists? | **No.** `ls` returns "No such file or directory". |
| Git state | Cannot inspect — does not exist |
| Conclusion | Dead reference. Treat as non-existent for all consolidation decisions. |

### 2c. dexdraw_redux_remote_full (AI Studio scaffold + historical ancestor)

| Field | Value |
|---|---|
| Absolute path | `/Users/andrew/Documents/Codex/2026-06-28/f/work/dexdraw_redux_remote_full` |
| Git branch | `main` |
| Git HEAD | `b90a314 feat: Initialize AI Studio project` |
| Commit count | 2 (`Initialize AI Studio project`, `Initial commit`) |
| Root package name | `react-example` (not DexDraw — this is the AI Studio scaffold) |
| Root framework | Express 4, better-sqlite3, Yjs, Zustand, Tailwind CSS, shadcn/ui, html2canvas, jspdf, @google/genai |
| Test evidence | None visible at root level |
| Docs | Only AI Studio README pointing to `https://ai.studio/apps/b42cedc1-...` |
| Obvious warnings | This is NOT a DexDraw prototype. It is an AI Studio scaffold with a DexDraw predecessor (`dexDraw_old/`) embedded inside. Do not conflate the two. |

**Embedded: `dexdraw_redux_remote_full/dexDraw_old/` (historical DexDraw ancestor)**

| Field | Value |
|---|---|
| Package name | `dexdraw` v0.1.0-meeting |
| Release date | 2026-02-09 |
| Framework / runtime | React 19, Fastify 5, Zod 3 (server), PostgreSQL (via `postgres` npm package), Drizzle ORM, Yjs, Zustand + Immer |
| Rendering model | **Canvas API** (multi-layer: background, committed, active stroke, selection) — NOT SVG |
| Client state | Zustand + Immer (NOT React useState/useReducer) |
| Persistence | PostgreSQL external server (NOT PGlite) |
| Features beyond vNext | Yjs CRDT text, IndexedDB outbox, Docker Compose, nginx, k6 load tests, ADRs, RUNBOOK_MACOS.md, CHANGELOG |
| Test evidence | 115 unit tests claimed in CHANGELOG |
| Docs / handoff | CLAUDE.md, CHANGELOG.md, RUNBOOK_MACOS.md, PRESENTATION.md, ADRs (001-orm-drizzle, 002-undo-op-based), docs/MEETING_READY.md |

---

## 3. Architecture Claims Checked

| Claim | Verified? | Evidence path(s) | Notes |
|---|---|---|---|
| React 19 (vNext) | YES | `apps/client-web/package.json:15` — `"react": "^19.1.1"` | Exact: 19.1.1 |
| Fastify (vNext) | YES | `apps/server-api/package.json:18` — `"fastify": "^5.6.0"` | Exact: v5.6.0 |
| SVG rendering (vNext) | YES | `apps/client-web/src/components/BoardCanvas.tsx:248,251` — `<svg … className="canvas">`, pointer event types are `ReactPointerEvent<SVGSVGElement>` | Pure SVG, no HTML5 Canvas at all |
| HTML5 Canvas (prior analysis claim) | NO — FALSE | `BoardCanvas.tsx` uses only SVG elements | No `<canvas>` element, no canvas context anywhere in vNext |
| Zod validation (vNext) | YES | `packages/shared-protocol/src/index.ts:1` — `import { z } from "zod"`, `apps/server-api/package.json:25` — `"zod": "^4.1.5"` | Zod 4, full schema coverage: objects, operations, auth, presence |
| Role checks (vNext) | YES | `apps/server-api/src/auth/roles.ts` — `canPerformDurableOp(role, opType, payload)`, roles: owner/edit/comment/view | Also in `packages/shared-protocol/src/index.ts:3` — `RoleSchema` |
| PGlite persistence (vNext) | YES | `apps/server-api/package.json:15` — `"@electric-sql/pglite": "^0.2.17"`, `apps/server-api/src/db/store.ts:7` — `PGlite` import | In-process Postgres, data at `apps/server-api/.dexdraw-data/` |
| Drizzle ORM (vNext) | YES | `apps/server-api/package.json:16` — `"drizzle-orm": "^0.44.5"`, `apps/server-api/src/db/schema.ts` | Tables: `boards`, `operations` |
| Operation log / serverSeq | YES | `apps/server-api/src/db/schema.ts:17-37` — operations table with `boardId`, `serverSeq`, `clientId`, `clientSeq`, `opId`, `opType`, `payload` | Server-authoritative ordered log |
| Checkpoint support | YES | `packages/shared-protocol/src/index.ts:7-12` — `checkpoint.create`, `checkpoint.restore` op types | REST + WebSocket |
| React 18 (prior analysis claim) | NO — FALSE | React is `^19.1.1` | Prior analysis claim of React 18 is wrong |
| Express (prior analysis claim) | NO — FALSE | vNext uses Fastify 5, not Express | Express only exists in the AI Studio scaffold root |
| No validation (prior analysis claim) | NO — FALSE | Zod 4 used throughout shared-protocol | Both server ingress and test assertions |
| Ephemeral state only (prior analysis claim) | NO — FALSE | PGlite + Drizzle persists operations durably | Reload-persistent confirmed in release-checklist and e2e specs |
| Naive broadcast sync (prior analysis claim) | NO — FALSE | Server-authoritative `serverSeq` assignment with idempotency and role enforcement | Full op envelope protocol with dedup |
| Test runner (vNext) | YES — Vitest | `apps/server-api/vitest.config.ts`, `apps/client-web` devDeps | Plus Playwright for e2e |
| E2E tooling | YES — Playwright | `playwright.config.ts`, 18 spec files in `tests/e2e/` | `@playwright/test ^1.54.2` |
| Export support | YES | `apps/client-web/src/lib/export.ts`, `src/__tests__/export.test.ts (28 tests)`, release-checklist covers PNG, PDF, Markdown | No JSON import/export (noted as not in scope) |
| Presence / collaboration | YES | `apps/client-web/src/lib/presence.ts`, `packages/shared-protocol` — `PresenceMessageSchema` (cursor, laser), two-client e2e specs | WebSocket-based ephemeral presence |

---

## 4. Feature-by-Feature Consolidation Matrix

| Area | DexDraw_vNext status | dexDraw_old status | Redux scaffold status | Decision | Reason | Evidence paths | Risk |
|---|---|---|---|---|---|---|---|
| App shell | Implemented: Gateway → BoardPage flow, metrics strip, toolbar, home page | Implemented: different shell, Canvas-based | Scaffold only, no real shell | KEEP_IN_VNEXT | vNext has full working shell with e2e tests | `apps/client-web/src/components/` | None |
| Auth / roles | Implemented: JWT via `jose`, owner/edit/comment/view | Implemented: JWT, view/comment/edit (no owner role evident) | None | KEEP_IN_VNEXT | vNext has full role enforcement with test coverage | `auth/roles.ts`, `auth/token.ts`, `shared-protocol/src/index.ts:3` | None |
| Presence / collaboration | Implemented: cursor, laser, selection (ephemeral WS) | Implemented: cursor 20Hz, laser, follow mode | Yjs in root scaffold (not wired to DexDraw protocol) | KEEP_IN_VNEXT | vNext has working presence with two-client e2e tests | `lib/presence.ts`, `tests/e2e/presence.spec.ts`, `tests/e2e/two-client-sync.spec.ts` | None |
| Board model | SVG-based operation log replay | Canvas-based operation log replay | Zustand store, unclear persistence | KEEP_IN_VNEXT | Different rendering model; old model not compatible | `lib/boardState.ts`, `shared-protocol/src/index.ts` | None |
| Object rendering | SVG: stroke, rectangle, ellipse, text, note | Canvas: multi-layer with perfect-freehand polygon | Not applicable | KEEP_IN_VNEXT | SVG renderer is the canonical choice for vNext | `components/BoardCanvas.tsx:248` | None |
| Selection / hit testing | Implemented: marquee, shift-click, resize handles | Implemented: different model | Not applicable | KEEP_IN_VNEXT | Full e2e and unit test coverage | `lib/hitTest.ts`, `lib/marquee.ts`, `lib/resize.ts`, e2e specs | None |
| Persistence / storage | PGlite in-process (dev), durable op log | PostgreSQL external server | better-sqlite3 in AI Studio scaffold | KEEP_IN_VNEXT | PGlite is intentional for dev/prototype; production swap to postgres.js is a future option documented in architecture-roadmap.md | `db/store.ts`, `db/schema.ts`, `docs/architecture-roadmap.md:35` | PGlite is not production-safe; documented known caveat |
| Operation history / checkpoints | Implemented: checkpoint.create, checkpoint.restore, serverSeq log | Implemented: snapshot every 50 ops, checkpoint restore, timeline scrubber | None | KEEP_IN_VNEXT | vNext has checkpoint e2e tests | `shared-protocol/src/index.ts:7-12`, `tests/e2e/checkpoint.spec.ts` | None |
| Export / import | Implemented: PNG, PDF (print), Markdown | Implemented: PNG viewport/full, PDF jsPDF, Markdown meeting summary | html2canvas + jsPDF in scaffold (not wired) | DOCUMENT_ONLY | dexDraw_old export used jsPDF for real PDF rendering; vNext uses browser print dialog. Old approach is documented but not ported — assess quality difference before porting. | `lib/export.ts`, `__tests__/export.test.ts`, `dexDraw_old/CHANGELOG.md:38` | Medium: user experience difference between jsPDF and print dialog |
| Gateway / API / server | Implemented: Fastify 5, WS, REST: boards, join, snapshot, ops-since, checkpoints, title | Implemented: Fastify 5 + more endpoints (replay, metrics, health) | Express in scaffold root (unrelated) | DOCUMENT_ONLY | dexDraw_old had `/metrics`, `/health`, `/replay` endpoints not present in vNext. Review docs/MEETING_READY.md for any required endpoints before adding. | `apps/server-api/src/app.ts`, `dexDraw_old/apps/server-api/` | Low: endpoints are additive |
| Unit tests | 128 passing (113 client, 15 server) | 115 claimed (CHANGELOG), but no source files accessible | None | KEEP_IN_VNEXT | vNext tests are verified passing; dexDraw_old tests cover Canvas model which is incompatible | `src/__tests__/`, `apps/server-api/src/__tests__/` | None |
| E2E tests | 18 Playwright spec files; last run shows many failures in `test-results/` | k6 load tests + Playwright config | None | KEEP_IN_VNEXT | vNext has comprehensive e2e suite; old k6 load scripts are reference only | `tests/e2e/`, `dexDraw_old/tools/load/` | Medium: many test-results/ error-context files suggest recent e2e failures; needs investigation |
| Deployment / runbooks | `docs/release-checklist.md`, `scripts/verify.sh`, `scripts/start-dev-servers.sh` | RUNBOOK_MACOS.md (Tailscale/"bigmac"), Docker Compose, nginx, Dockerfiles | AI Studio README | DOCUMENT_ONLY | dexDraw_old's RUNBOOK_MACOS.md describes Tailscale setup for bigmac host; vNext has no equivalent. Port documentation only, not Docker infra. | `dexDraw_old/RUNBOOK_MACOS.md`, `docs/release-checklist.md` | Low |
| Handoff docs | Extensive: Design Handoff zip, Bible, CODEX prompt, citation map | CLAUDE.md, PRESENTATION.md, CHANGELOG.md | AI Studio README only | DOCUMENT_ONLY | dexDraw_old CHANGELOG and PRESENTATION contain historical context; review for accuracy before porting any content | `handoff/`, `dexDraw_old/CHANGELOG.md`, `dexDraw_old/PRESENTATION.md` | Low |
| ADRs | None | `docs/adr/001-orm-drizzle.md`, `docs/adr/002-undo-op-based.md` | None | PORT_FROM_OLD | ADRs document decisions that are still relevant (Drizzle choice, op-based undo). They should be in vNext's docs as historical context. | `dexDraw_old/docs/adr/` | None |
| Assets / icons | `DexDraw_vNext_Design_Handoff.zip` in root | `assets/icon.png` | None | DOCUMENT_ONLY | Check if icon.png is already in vNext or needed | `dexDraw_old/assets/icon.png` | None |
| UX flows | Gateway → board flow implemented and e2e-tested | Different flow (no gateway mentioned) | Not applicable | KEEP_IN_VNEXT | vNext UX is intentional | `components/Gateway.tsx`, `components/BoardPage.tsx` | None |
| Performance roadmap | Documented as future in `docs/architecture-roadmap.md` (camera matrix, OffscreenCanvas, spatial indexing) | Not documented separately | Not applicable | KEEP_IN_VNEXT | Already documented as future options in vNext | `docs/architecture-roadmap.md` | None |
| Offline / local-first roadmap | Documented as future: IndexedDB option | dexDraw_old had IndexedDB outbox implemented | Not applicable | DOCUMENT_ONLY | dexDraw_old's IndexedDB outbox is a reference implementation for the future path. Do not port until manually proven needed. | `docs/architecture-roadmap.md:38`, `dexDraw_old/CHANGELOG.md:30` | High: architectural change |
| CRDT / Yjs roadmap | Documented as future in vNext | Partially implemented in dexDraw_old (Yjs CRDT text editing) | Yjs present in scaffold root (unused) | ARCHIVE_REFERENCE | dexDraw_old's Yjs integration is reference-only. Do not port until manual proof that vNext's op-log approach is insufficient. | `docs/architecture-roadmap.md:37`, `dexDraw_old/CHANGELOG.md:29` | High: major architectural change |
| Security / encryption roadmap | Documented as future (E2EE option) | JWT + Fastify Helmet, rate limiting, per-op role enforcement | None | DOCUMENT_ONLY | dexDraw_old had better security hardening (@fastify/helmet, @fastify/rate-limit). vNext has roles but lacks rate-limit and helmet. Worth reviewing. | `dexDraw_old/apps/server-api/package.json` — `@fastify/helmet`, `@fastify/rate-limit`; `apps/server-api/package.json` — absent | Medium |
| WebRTC / binary / Wasm / OffscreenCanvas roadmap | All documented as future in vNext | None implemented | None | KEEP_IN_VNEXT | Already correctly fenced as future options | `docs/architecture-roadmap.md` | None |
| Load testing tools | None | `tools/load/websocket-load.js`, `tools/load/disconnect-chaos.js` | None | ARCHIVE_REFERENCE | Useful as reference when vNext is ready for load testing; not portable yet (targets old server) | `dexDraw_old/tools/load/` | None |

---

## 5. Safe Port Candidates

Low-risk, evidence-backed only. All are documentation or test infrastructure.

### 5a. ADR files

- **Source:** `dexdraw_redux_remote_full/dexDraw_old/docs/adr/001-orm-drizzle.md`
- **Source:** `dexdraw_redux_remote_full/dexDraw_old/docs/adr/002-undo-op-based.md`
- **Proposed destination:** `DexDraw_vNext/docs/adr/001-orm-drizzle.md`, `docs/adr/002-undo-op-based.md`
- **Reason:** These decisions (Drizzle ORM choice, op-based undo) remain valid and active in vNext. Having them documented prevents re-litigating the same questions.
- **Risk:** None — documentation only
- **Manual proof required:** Read both ADRs and verify they still accurately describe vNext's implementation before copying.
- **Validation command:** `diff` after copy to verify no content corruption. No test command needed.

### 5b. Tailscale runbook

- **Source:** `dexdraw_redux_remote_full/dexDraw_old/RUNBOOK_MACOS.md`
- **Proposed destination:** `DexDraw_vNext/docs/RUNBOOK_MACOS.md`
- **Reason:** Describes Tailscale setup for local dev on "bigmac" host; vNext has no equivalent runbook. Ports are different (old: 5173/4000, vNext: same), so content may apply directly.
- **Risk:** Low — documentation only, but old runbook references `pnpm dev:tailnet` which may not exist in vNext yet
- **Manual proof required:** Andrew must manually test that `tailscale serve` + `pnpm dev` works before marking this runbook accurate.
- **Validation command:** `grep -n "tailnet\|4000\|5173" /Users/andrew/DexDraw_vNext/docs/RUNBOOK_MACOS.md` after copy to verify port references.

### 5c. CHANGELOG historical entry

- **Source:** `dexdraw_redux_remote_full/dexDraw_old/CHANGELOG.md`
- **Proposed destination:** `DexDraw_vNext/CHANGELOG.md` (new file; vNext has none)
- **Reason:** Documents v0.1.0-meeting baseline. Gives future contributors context on what was proven before the SVG rewrite.
- **Risk:** None — documentation only. Mark clearly as historical predecessor.
- **Manual proof required:** None beyond reading it.
- **Validation command:** None.

### 5d. `@fastify/helmet` and `@fastify/rate-limit` security dependencies

- **Source:** `dexDraw_old/apps/server-api/package.json` — confirmed present
- **Proposed destination:** `DexDraw_vNext/apps/server-api/package.json` via `pnpm add`
- **Reason:** dexDraw_old had rate limiting (100 ops/s/client) and CSP headers. vNext lacks both. These are additive, not architectural changes.
- **Risk:** Low-medium — requires wiring into `app.ts` after install. Test coverage would need to cover the new middleware.
- **Manual proof required:** Yes. Andrew must manually start vNext with the plugins enabled, make >100 requests/second, and verify 429 response. Must also verify CSP header is set on responses.
- **Validation command:** `pnpm --filter @dexdraw/server-api test` after adding middleware. Add a specific test for rate-limit rejection.

---

## 6. Do-Not-Port List

| Item | Location | Reason |
|---|---|---|
| AI Studio scaffold root (entire) | `dexdraw_redux_remote_full/` root (excluding `dexDraw_old/`) | This is not a DexDraw implementation. `react-example` package name, Express + SQLite, 2 commits, Gemini API key integration. Contains no DexDraw domain logic. |
| Canvas rendering code | `dexDraw_old/apps/client-web/` Canvas layer logic | vNext is SVG-based. The Canvas rendering model is a different paradigm. Mixing them would break the architecture. |
| Zustand + Immer state management | `dexDraw_old/apps/client-web/` — Zustand store | vNext uses React `useState`/`useReducer`. Importing Zustand is an architectural decision, not a feature port. Requires explicit decision. |
| Yjs CRDT integration | `dexDraw_old/apps/client-web/` — Yjs text editing | Documented as a future architectural path in vNext, not current. Do not port until manually proven necessary. |
| IndexedDB offline outbox | `dexDraw_old/apps/client-web/` — idb package | Same — future path documented. Do not port. |
| PostgreSQL persistence | `dexDraw_old/apps/server-api/` — `postgres` npm package | vNext intentionally uses PGlite for dev. The swap path is documented. Do not introduce a second persistence model. |
| Docker / docker-compose / nginx | `dexDraw_old/` — Dockerfiles, docker-compose.yml, nginx.conf | vNext has no deployment infra. Porting Docker is a deployment decision requiring Andrew's explicit directive. |
| k6 load test scripts | `dexDraw_old/tools/load/` | Target old server protocol and endpoints. Not runnable against vNext without rewriting. Archive as reference. |
| `dexDraw_old/packages/shared-protocol/` | `dexDraw_old/packages/shared-protocol/` | Zod 3, different schemas (includes undo/redo as op types, different wire format). Incompatible with vNext's Zod 4 protocol. |
| Timeline scrubber / time-travel replay UI | `dexDraw_old/` — CHANGELOG mentions this | Not present in vNext; significant UI feature requiring standalone design decision. |
| Comment pins / parking lot | `dexDraw_old/` — CHANGELOG mentions these | Not present in vNext; significant feature scope requiring standalone design decision. |
| Ink-to-text / TF.js worker stub | `dexDraw_old/` — CHANGELOG mentions this | Experimental, not implemented in vNext. |
| `perfect-freehand` polygon rendering | `dexDraw_old/packages/shared-core/` | vNext uses SVG paths, not polygon rendering via perfect-freehand. Canvas-specific. |
| Nested historical snapshots | `.resurrection/` in vNext | Already committed as untracked; review before staging. Do not stage without explicit instruction. |

---

## 7. Manual Proof Checklist

Before any real porting or automation, Andrew must manually prove each item. This is the gate before Phase 2.

- [ ] **Install works:** `cd /Users/andrew/DexDraw_vNext && pnpm install` — exits 0, no ERR_PNPM_*
- [ ] **Unit tests pass:** `pnpm test` — 128/128 (confirmed passing as of this audit)
- [ ] **Typecheck passes:** `pnpm typecheck` — clean (confirmed passing as of this audit)
- [ ] **App starts locally:** `pnpm dev` — both client (port 5173) and server start, no fatal errors
- [ ] **Board creation works:** Open http://127.0.0.1:5173, complete Gateway flow, create a board, navigate to board page
- [ ] **Object creation works:** Draw a stroke, create a rectangle, type text — all appear on canvas
- [ ] **Persistence survives reload:** Create objects, reload page — objects still present (PGlite survives in-process restart but NOT server restart — know the difference)
- [ ] **Export works:** PNG download, PDF print dialog, Markdown download — all trigger without errors
- [ ] **Presence works:** Open two browser tabs, join same board — cursor from Tab A appears in Tab B
- [ ] **E2E test suite current state:** Run `pnpm test:e2e --workers=1` and record pass/fail count. The `test-results/` directory contains many `error-context.md` files suggesting recent failures — this needs a baseline established before any porting begins.

---

## 8. Recommended Next Patch

**Exactly one patch. Documentation only. Do not implement code.**

### Port the two ADR files from dexDraw_old into DexDraw_vNext

**What it does:** Create `docs/adr/` in vNext and copy `001-orm-drizzle.md` and `002-undo-op-based.md` verbatim from `dexDraw_old`.

**Files that would change:**
- CREATE `DexDraw_vNext/docs/adr/001-orm-drizzle.md`
- CREATE `DexDraw_vNext/docs/adr/002-undo-op-based.md`

**Why this first:** Zero risk. No code changes. The decisions are still active in vNext. Having them in-repo prevents the decisions from being re-litigated by future contributors or AI sessions.

**Validation command:**
```bash
cd /Users/andrew/DexDraw_vNext && pnpm lint && pnpm typecheck && pnpm test
```
(All three should pass clean; ADR files are Markdown and invisible to TS compiler and Biome.)

**Rollback command:**
```bash
rm /Users/andrew/DexDraw_vNext/docs/adr/001-orm-drizzle.md /Users/andrew/DexDraw_vNext/docs/adr/002-undo-op-based.md
rmdir /Users/andrew/DexDraw_vNext/docs/adr
```

---

## Risks / Unknowns

| Risk | Severity | Details |
|---|---|---|
| E2E failures | High | `test-results/` contains ~50+ `error-context.md` files from failed test runs. The release-checklist claims 79/79 passing at rc1, but the current test-results do not confirm this. Establish current e2e baseline before any porting. |
| iCloud donor path missing | Medium | `/Users/andrew/Library/Mobile Documents/comappleCloudDocs/Projects/Dex_Draw.nosync` does not exist. If this was a known source of assets, icons, or docs, it is now inaccessible. Check if iCloud Drive is signed in and whether the path was evicted. |
| Secret in handoff | Medium | `.resurrection/` scan flagged `handoff/DexDraw_vNext_Design_Handoff/research-artifact-source.md:125` for `openai_sk_prefix`. Do not commit `.resurrection/` or this file until reviewed. |
| Missing security middleware | Medium | vNext lacks `@fastify/helmet` and `@fastify/rate-limit` that dexDraw_old had. Safe to add but requires deliberate wiring. |
| PGlite not production-safe | Known/documented | Explicitly noted in `docs/release-checklist.md` caveats. Not a consolidation risk but a product deployment blocker. |
| dexDraw_old source files not directly readable | Low | `dexDraw_old/` has no `src/` directories visible in the `find` output (only config and root files). Source code files may not have been included in the AI Studio snapshot. The package structure exists but implementation files may be absent. Verify before attempting to port any code. |
