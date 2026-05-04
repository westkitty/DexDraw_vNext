# DexDraw Repository Comparison Master Record

## Purpose of This Document

This document consolidates the full repository-comparison work from this conversation into one exhaustive Markdown record.

It includes:

1. The original user-requested audit scope and required structure.
2. The first repository comparison findings produced in this conversation.
3. The supplied external comparison report that was uploaded afterward.
4. A direct comparison between the two reports.
5. Corrections to the first audit.
6. Confirmed facts, disputed claims, and remaining verification gaps.
7. Updated scores, verdicts, and recommended next actions.
8. A practical consolidation plan for Repository A and Repository B.

This document does **not** modify either repository. It is a read-only synthesis and audit record.

---

# 0. Repositories Under Review

## Repository A

```text
https://github.com/westkitty/https-github.com-westkitty-DexDraw_Redux
```

Short name used in this document:

```text
Repository A
DexDraw_Redux
AI Studio / Lite / single-process variant
```

## Repository B

```text
https://github.com/westkitty/dexDraw
```

Short name used in this document:

```text
Repository B
dexDraw
Canonical / monorepo / full product architecture
```

---

# 1. Original Audit Request

The requested task was a deep comparative audit of two GitHub repositories owned by the user.

The requested roles were:

- Expert software architect.
- Code reviewer.
- Technical writer.
- Product analyst.

The requested analysis categories were:

- Repository purpose.
- Architecture.
- Feature comparison.
- Function/module comparison.
- Build/run/install comparison.
- Testing and reliability.
- Documentation.
- Code quality.
- Security/privacy/risk.
- Performance/scalability.
- User/product experience.
- Missing features.
- Cross-pollination opportunities.
- Merge/replace/keep-separate recommendation.
- Priority fix list.
- Roadmap.
- Final verdict.

The user required conclusions to be based on actual repository contents, not guesses.

The user explicitly required:

1. Read README files, documentation, configuration files, package files, build files, source folders, tests, scripts, workflows, issues if available, and other purpose/behavior files.
2. Identify languages, frameworks, libraries, runtimes, build tools, test tools, deployment targets, and architectural patterns.
3. Mark unclear items as “unclear” or “needs verification.”
4. Do not modify either repository unless explicitly asked.
5. Do not expose secrets, tokens, private keys, or credentials. If any are found, report only file path and risk category.
6. Be direct, specific, practical, and evidence-based.
7. Do not merely summarize README files.
8. Inspect code and structure.
9. Use tables where helpful.
10. End with a concrete action plan.

---

# 2. Inspection Method Used in Conversation

The first audit used the available GitHub connector and inspected specific repository files directly.

Direct local cloning in the sandbox was attempted conceptually as a path, but the available evidence came through GitHub connector file retrieval and metadata access. The internal GitHub search endpoint returned poor/no results for some searches, so inspection relied heavily on direct path fetches.

Important limitation from the first audit:

```text
Direct git clone from the sandbox was not successfully used because the sandbox could not resolve github.com. The internal GitHub code search endpoint returned no useful file-search results. The audit was therefore a static repository-content audit, not a successful local build/test execution.
```

This limitation matters because:

- Build behavior was inferred from package/config/source files.
- Test coverage was inferred from package scripts and located test files.
- Runtime behavior was inferred from code paths.
- Some “feature present” claims were deliberately marked as partial or needs verification.

---

# 3. Repository Metadata Observed

## Repository A Metadata

Repository:

```text
westkitty/https-github.com-westkitty-DexDraw_Redux
```

Observed metadata:

```text
name: https-github.com-westkitty-DexDraw_Redux
owner: westkitty
visibility: public
default_branch: main
size: 0 in metadata response
archived: false
permissions: user has admin/maintain/pull/push/triage
clone_url: https://github.com/westkitty/https-github.com-westkitty-DexDraw_Redux.git
```

Important note:

The repository metadata response reported size `0`, but later file fetches proved the repository does contain files. Do not interpret that size field as proof of emptiness.

## Repository B Metadata

Repository:

```text
westkitty/dexDraw
```

Observed metadata:

```text
name: dexDraw
owner: westkitty
visibility: public
default_branch: main
size: 5036
archived: false
permissions: user has admin/maintain/pull/push/triage
clone_url: https://github.com/westkitty/dexDraw.git
```

---

# 4. First Audit — Executive Summary

## Repository A First-Audit Identity

Repository A was initially identified as a single-package AI Studio-generated collaborative whiteboard prototype.

Evidence from root README:

```text
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b42cedc1-6b8c-4ef2-ab82-25f3740c188c

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   npm install
2. Set the GEMINI_API_KEY in .env.local to your Gemini API key
3. Run the app:
   npm run dev
```

First-audit conclusion:

Repository A appeared to be:

```text
React/Vite frontend + Express/WebSocket/SQLite server in one repo.
```

Product features identified in active root runtime:

- Board creation.
- Board joining.
- Templates.
- Pen strokes.
- Rectangles.
- Ellipses.
- Text placement.
- Laser cursor.
- Realtime cursors.
- Local undo.
- PNG export.
- PDF export.

## Repository B First-Audit Identity

Repository B was identified as a deliberate monorepo architecture for a self-hosted real-time collaborative whiteboard.

Evidence from README:

```text
DexDraw
A high-performance, real-time shared whiteboard for business meetings.
DexDraw runs locally or on your private server, offering server-authoritative state management and a deterministic ink engine for smooth, latency-free collaboration.
```

README-stated features:

- Real-time collaboration.
- Server-authoritative ordered operation log.
- Deterministic ink engine.
- Hybrid sync model using operation logs and Yjs CRDTs.
- Privacy-first self-hosting.
- Smart export to Markdown/PDF.

First-audit conclusion:

Repository B appeared to be:

```text
A pnpm workspace monorepo with separate client, server, shared-core, and shared-protocol packages.
```

Stack identified:

- React.
- Vite.
- Fastify.
- WebSocket.
- PostgreSQL.
- Drizzle ORM.
- Zod.
- Yjs.
- Docker Compose.
- Optional Tailscale support.

## First-Audit Biggest Similarities

Both repositories are DexDraw-style collaborative whiteboard projects built around:

| Shared Theme | Repository A Evidence | Repository B Evidence |
|---|---|---|
| TypeScript + React frontend | `src/main.tsx`, `src/App.tsx` | `apps/client-web/src/main.tsx`, `apps/client-web/src/App.tsx` |
| Canvas drawing | `src/components/Board.tsx` | `apps/client-web/src/components/Canvas/Canvas.tsx` |
| Deterministic ink / normalized strokes | `src/lib/ink.ts` | `packages/shared-core/src/stroke/normalizeStroke.ts` |
| Real-time collaboration intent | `src/lib/socket.ts`, `server.ts` | `apps/server-api/src/rooms/Room.ts`, `routes/ws.ts` |
| Board templates | `src/lib/templates.ts` | `packages/shared-protocol` templates and `/api/templates` route |
| Operation log concept | SQLite `ops` table in `server.ts` | PostgreSQL `ops` schema and `Room` persistence |
| Roles named `view`, `comment`, `edit` | `server.ts`, `src/components/Board.tsx` | `auth/roles.ts`, `db/schema/users.ts` |

## First-Audit Biggest Differences

| Area | Repository A | Repository B |
|---|---|---|
| Project shape | Single package / single server file | Monorepo with app/server/shared packages |
| Persistence | SQLite via `better-sqlite3` in `data/dexdraw.db` | PostgreSQL via Drizzle ORM |
| Server | Express + `ws` + Vite middleware | Fastify + plugins + route modules + room manager |
| Protocol | Ad hoc `any` messages | Zod schemas, protocol constants, encode/decode layer |
| Client completeness | More visible drawing/product features | Cleaner engine split but inspected client drawing mostly pen/stroke only |
| Testing | No test script found | Vitest configured, but some scripts use `--passWithNoTests` |
| Documentation | Minimal AI Studio scaffold README | Substantive README with architecture, install, Docker, Tailscale |
| Security posture | Minimal/no real auth | Better primitives, but enforcement incomplete in inspected WebSocket path |

## First-Audit Maturity Verdict

First-audit conclusions:

```text
Repository B appeared more mature.
Repository B appeared more maintainable.
Repository B appeared architecturally stronger.
Repository A appeared more immediately product-visible in the active UI.
Repository B appeared more complete as a long-term architecture.
Repository B had the clearer purpose.
```

Important first-audit nuance:

```text
Repository A had more visible UI features in the inspected active root code.
Repository B had stronger infrastructure, architecture, protocol, deployment, and maintainability foundations.
```

---

# 5. First Audit — Repository Identity and Purpose

## Repository A — First-Audit Purpose

Repository A was identified as a browser-based collaborative whiteboard prototype with real-time board sessions.

Supported workflow in active root runtime:

1. User opens app.
2. User creates a new board or enters an existing board ID.
3. User selects a template or blank board.
4. User draws/places shapes/text.
5. Server persists operations in SQLite.
6. Other connected clients receive operations and cursor updates over WebSocket.
7. User exports board as PNG or PDF.

Likely users:

- Owner/developer testing a quick DexDraw prototype.
- Small teams wanting local real-time whiteboard use.
- People experimenting with AI Studio-generated app scaffolds.

Problem solved:

```text
Quick collaborative sketching and meeting-board creation with lightweight persistence and export.
```

Maturity level:

```text
Prototype / early alpha.
```

Reasons:

- Minimal generated README.
- Single large frontend component.
- Single server file.
- Weak validation.
- No tests in active root runtime.
- Local-only undo.
- No real authorization despite role fields.

## Repository B — First-Audit Purpose

Repository B was identified as a self-hosted real-time shared whiteboard for business meetings.

Likely users:

- Teams needing a private whiteboard.
- Developers/self-hosters.
- Business meeting facilitators.
- The project owner building a serious long-term DexDraw architecture.

Problem solved:

```text
Reliable private real-time collaboration with deterministic rendering and replayable operation history.
```

Main workflow:

1. Developer installs dependencies with pnpm.
2. Developer runs client/server or Docker Compose.
3. Server exposes board/template/health/checkpoint/WebSocket routes.
4. Clients join a room by board ID.
5. Server manages rooms, ordered operation logs, role checks, snapshots, checkpoints, presence, and replay.
6. Client renders canvas using separated input/ink/render/store architecture.

Maturity level:

```text
Architecture-stage alpha.
```

Reasons:

- More mature structure than A.
- Still had unfinished or mismatched inspected pieces.
- Client canvas inspected path only attached drawing for pen.
- Renderer inspected path only drew stroke objects and explicitly said other object types were future work.
- WebSocket auth was not enforced in inspected route.
- Long-poll fallback routes were placeholders.
- Test scripts allowed no-test passing in some packages.
- Board template insertion likely had a UUID mismatch.

---

# 6. First Audit — Technical Stack Comparison

| Category | Repository A | Repository B | Notes |
|---|---|---|---|
| Primary language | TypeScript | TypeScript | Both TypeScript-first. |
| Secondary languages | HTML, CSS, SQL strings | HTML, CSS, Dockerfile, SQL/Drizzle schema | B has more deployment/system code. |
| Frameworks | React, Vite, Express | React, Vite, Fastify | B uses a more structured backend framework. |
| Package manager | npm | pnpm workspaces | A has `package-lock.json`; B has `pnpm-workspace.yaml`. |
| Runtime | Node.js | Node.js >= 22 | B explicitly declares runtime requirements. |
| Build system | Vite + esbuild server bundle | TypeScript project references + Vite + pnpm recursive build | B is cleaner for multi-package builds. |
| Test framework | None found in active root runtime | Vitest configured | B stronger, but some no-test pass flags observed. |
| Linting/formatting | `tsc --noEmit` as `lint` | Biome + TypeScript build mode | B better. |
| CI/CD | No evidence in inspected files | No confirmed GitHub Actions; Docker Compose present | Needs verification. |
| Database/storage | SQLite via `better-sqlite3` | PostgreSQL via Drizzle ORM | A simpler; B more scalable. |
| API style | REST-ish Express routes + raw WebSocket | Fastify REST routes + WebSocket rooms + protocol schemas | B stronger abstraction. |
| UI approach | Single large board component + shadcn-style UI | Componentized UI: Toolbar, Canvas, comments, parking lot, timeline, status bar | B cleaner; implementation status varied by feature. |
| Authentication/permissions | Roles exist but everyone joins as edit | JWT utility + role functions + board members schema; WebSocket enforcement unclear | B better foundation but incomplete enforcement. |
| Deployment target | Local Node server / AI Studio-style | Local, Docker, private server, optional Tailscale | B more production-oriented. |
| Platform assumptions | Browser + local filesystem SQLite | Browser + Node 22 + pnpm + PostgreSQL; Docker optional | B has more moving parts. |

## First-Audit Stack Implications

Repository A:

- Easier to start conceptually.
- One package.
- One local SQLite DB.
- Simpler but weaker.
- Frontend/protocol/server/database/authorization loosely structured.

Repository B:

- Heavier but better for long-term work.
- Workspace boundaries explicit.
- Shared core/protocol packages reduce duplication.
- PostgreSQL supports durable multi-user use better than SQLite.
- Zod schemas and Drizzle schema definitions are correct long-term direction.
- Docker Compose gives repeatable environment.
- Biome and strict TypeScript improve maintainability.

First-audit conclusion:

```text
B’s complexity is justified. The problem is not overengineering; the problem is unfinished integration in inspected paths.
```

---

# 7. First Audit — Architecture Comparison

## Repository A Architecture

### Main folders/files inspected

| Path | Meaning |
|---|---|
| `src/App.tsx` | Router, home screen, board creation/join flow |
| `src/components/Board.tsx` | Main whiteboard UI, canvas rendering, tool handling, socket handling, export |
| `src/lib/socket.ts` | Browser WebSocket wrapper |
| `src/lib/ink.ts` | Stroke normalization and drawing |
| `src/lib/templates.ts` | Built-in board templates |
| `src/store/index.ts` | Zustand app state |
| `src/model/types.ts` | Board object and operation types |
| `server.ts` | Express API, WebSocket server, SQLite schema, persistence, Vite middleware |
| `vite.config.ts` | Vite + React + Tailwind config, Gemini key define |
| `package.json` | npm scripts and dependencies |

### Repository A entry points

- Frontend: `src/main.tsx`.
- App: `src/App.tsx`.
- Server/dev: `server.ts` via `npm run dev`.
- Production server bundle: `dist/server.cjs`.

### Repository A core modules

| Module | Responsibility |
|---|---|
| `Board.tsx` | Almost everything user-facing. |
| `server.ts` | Almost everything server-side. |
| `BoardSocket` | WebSocket connection/reconnection/message fanout. |
| `drawStroke` / `normalizeStroke` | Stroke rendering pipeline. |
| `useAppStore` | UI and board state. |

### Repository A data flow

1. User draws or creates object in `Board.tsx`.
2. `Board.tsx` updates local Zustand state.
3. `Board.tsx` sends `{ type: "op", op: { opType, payload } }`.
4. `server.ts` assigns `server_seq`, stores operation in SQLite, broadcasts to clients.
5. Other clients apply `sync` or `op` messages to local state.

### Repository A control flow

- React pointer handlers mutate state.
- Render loop redraws every animation frame.
- WebSocket messages mutate board/user state.
- Server WebSocket switch handles `join`, `op`, and `cursor`.

### Repository A state management

- Client: Zustand store with `Map` objects and users.
- Server: SQLite operation log plus in-memory `clients` map.
- Undo/redo: local React state only.
- Undo does not synchronize to server.

### Repository A configuration handling

- `PORT` from environment in `server.ts`.
- `GEMINI_API_KEY` passed into Vite define in `vite.config.ts`.
- `.env.local` referenced by README.
- No config schema.

### Repository A error handling

Weak:

- Client mostly `console.error`.
- Server catches JSON/message errors and logs to console.
- No structured error responses for many invalid inputs.
- No validation of WebSocket payloads.

### Repository A logging/diagnostics

- Minimal console logging only.

### Repository A dependency boundaries

Weak:

- `Board.tsx` imports UI, socket, ink, model types, store, router, and PDF export directly.
- `server.ts` imports templates from frontend `src/lib/templates`, coupling server runtime to frontend source.

### Repository A internal abstractions

Small abstractions:

- `BoardSocket`.
- `drawStroke`.
- Zustand store.
- model types.

But the main behavior remains concentrated in `Board.tsx` and `server.ts`.

## Repository B Architecture

### Main folders/files inspected

| Path | Meaning |
|---|---|
| `apps/client-web/` | React/Vite frontend |
| `apps/server-api/` | Fastify backend |
| `packages/shared-core/` | Geometry, math, deterministic ink normalization |
| `packages/shared-protocol/` | Zod schemas, protocol constants, templates, wire encoding/decoding |
| `docker-compose.yml` | PostgreSQL + server + client + optional Tailscale |
| `pnpm-workspace.yaml` | Monorepo package layout |
| `tsconfig.base.json` | Strict shared TypeScript settings |
| `biome.json` | Formatting/linting config |

### Repository B entry points

- Client: `apps/client-web/src/main.tsx`.
- Client app: `apps/client-web/src/App.tsx`.
- Server: `apps/server-api/src/index.ts`.
- Server app construction: `apps/server-api/src/app.ts`.

### Repository B core modules

| Module | Responsibility |
|---|---|
| `Canvas.tsx` | Canvas layer setup and input/render attachment. |
| `InputEngine.ts` | Pointer event capture. |
| `InkEngine.ts` | Active stroke lifecycle and local object commit. |
| `CanvasRenderer.ts` | Imperative canvas rendering loop. |
| `useAppStore.ts` | Tool/color/view state. |
| `useCanvasStore.ts` | Object map and selection state. |
| `RoomManager.ts` | Room lifecycle and WebSocket connection dispatch. |
| `Room.ts` | Server-authoritative op processing, persistence, snapshots, checkpoint restore, presence. |
| `auth/roles.ts` | Role permission rules. |
| `auth/limits.ts` | Payload/rate/object limits. |
| `shared-core` | Geometry and ink pipeline. |
| `shared-protocol` | Operation/envelope schemas and protocol exports. |

### Repository B server-side intended data flow

1. Client joins `/ws/:boardId`.
2. `routes/ws.ts` receives first join message.
3. `RoomManager` gets/creates a room.
4. `Room` loads latest snapshot and operations.
5. Durable messages are parsed, rate-limited, role-checked, persisted, applied to in-memory state, and broadcast.
6. Periodic snapshots/checkpoints support replay/restore.

### Repository B inspected client-side flow

1. `Canvas.tsx` creates singleton `InputEngine`, `InkEngine`, and `CanvasRenderer`.
2. Pointer events feed raw points into `InkEngine`.
3. `InkEngine` normalizes stroke using `@dexdraw/shared-core`.
4. `InkEngine` optimistically adds object to local Zustand canvas store.
5. Optional commit handler exists, but first audit did not find it wired in inspected `Canvas.tsx`.

Important first-audit note:

```text
B’s server is more advanced than A’s, but inspected client-server integration was not proven complete.
```

### Repository B control flow

Cleaner than A:

- UI components compose in `App.tsx`.
- Canvas work split into input, ink, renderer, and store.
- Server app setup modular.
- Room lifecycle explicit.
- Permission and limit checks separated into auth modules.

### Repository B state management

- Client app state: Zustand.
- Client board objects: Zustand + Immer Map/Set.
- Server rooms: in-memory room map.
- Durable state: PostgreSQL operation log + snapshots.
- Ephemeral state: WebSocket broadcast.
- Hybrid text/presence: Yjs schema/storage exists, full client usage needed verification.

### Repository B configuration handling

Strong:

- `loadEnv()` uses Zod.
- Docker Compose supplies variables.
- Root `package.json` declares Node and pnpm engines.

Caveat:

- Production safety incomplete because development defaults exist.

### Repository B error handling

Better than A:

- Server logs caught message errors.
- JSON parse errors handled.
- Payload size and rate limits exist.
- Database insert errors partially handled.
- Shared protocol validation exists.

Caveat:

- Shared protocol Zod validation was not seen applied in `Room.handleMessage` during first audit.

### Repository B logging/diagnostics

- Fastify/Pino logging through `app.log`.
- Dev pretty logging.
- Production info-level logging.

### Repository B dependency boundaries

Much better than A:

- Shared pure logic in `packages/shared-core`.
- Shared schemas/protocol in `packages/shared-protocol`.
- Server database and auth separated.
- Client rendering and input separated.

## First-Audit Architecture Verdict

| Question | Better Repo | Why |
|---|---|---|
| Cleaner architecture | B | Clear package boundaries and modular server/client layers. |
| Easier to understand quickly | A | Fewer moving parts, but messier. |
| Easier to extend safely | B | Shared packages and strict TypeScript. |
| Tighter coupling | A | Server imports frontend templates; board UI owns too much. |
| Better separation of concerns | B | Input, ink, render, protocol, server, DB separated. |
| More technical debt | A | Large component/server file, weak typing, minimal docs/tests. |
| Smarter design choices | B | Operation log, snapshots, role utilities, protocol schemas. |
| More fragile choices | A | Ad hoc messages, local-only undo, no validation. |
| Hidden fragility | B | Better design but unfinished wiring; auth/protocol not consistently enforced. |

---

# 8. First Audit — Feature Matrix

| Feature / Function | Repository A | Repository B | First-Audit Comparison Notes |
|---|---:|---:|---|
| Create board | Present | Present | A `/api/boards`; B `/api/boards`. |
| Join board by ID | Present | Partial | A has UI join form. B server supports `/ws/:boardId`; inspected B UI join flow not found. |
| Templates | Present | Present | A local frontend/server templates. B shared protocol templates and `/api/templates`. |
| Pen drawing | Present | Present | A wired to socket. B client draws locally; server commit wiring needed verification. |
| Deterministic ink | Partial | Present | A inline deterministic-ish normalization. B shared-core pipeline. |
| Shapes | Present | Partial / needs verification | A rect/ellipse. B renderer inspected only strokes. |
| Text objects | Present | Partial / needs verification | A textarea flow. B protocol/Yjs concepts, but inspected Canvas did not implement placement. |
| Eraser | Partial | Partial / Missing | A button but no pointer behavior. B tool enum but no inspected behavior. |
| Laser pointer | Present | Partial / needs verification | A visible laser behavior. B protocol/presence concepts needed client verification. |
| Realtime cursors | Present | Present server-side / needs client verification | A overlay present. B server handles ephemeral presence/cursor. |
| Presence users | Present | Present server-side | A users overlay. B server join/leave messages. |
| Operation log | Present | Present | A SQLite ops. B PostgreSQL ops. |
| Server authoritative sequence | Partial | Present | A assigns server sequence. B stronger server sequence/dedupe. |
| Client sequence dedupe | Missing | Present | B has `clientSeq` and unique dedupe index. |
| Snapshots | Missing | Present | B snapshot table and snapshot creation every interval. |
| Checkpoint create | Partial | Present | A stores checkpoints. B implements create/restore logic. |
| Checkpoint restore | Missing | Present server-side | B has restore logic; client flow needed verification. |
| Undo | Partial | Schema/server partial | A local-only. B protocol schema; implementation unclear. |
| Redo | Missing / stub | Schema only | A disabled redo. B schema includes redo. |
| Export PNG | Present | Not found in inspected B files | A exports PNG. |
| Export PDF | Present | README says smart export; package has jsPDF; concrete UI not verified | A concrete implementation found. |
| Export Markdown | Missing | Claimed by README; concrete implementation initially not inspected | Later corrected: B has implementation and tests. |
| Authentication | Missing | Partial | B has JWT utilities but inspected WS route did not verify token. |
| Roles/permissions | Weak | Partial | A all join edit. B role rules, enforcement incomplete/needs verification. |
| Input validation | Weak | Partial | B has Zod schemas; not consistently applied in inspected server path. |
| Rate limiting | Missing | Present | B has rate limiter and Fastify rate plugin. |
| Payload limits | Missing | Present | B has max message/payload/batch/object limits. |
| Database schema | Inline SQLite strings | Drizzle schema modules | B stronger. |
| Docker | Missing | Present | B has Docker Compose. |
| Tailscale support | Missing | Present | B Docker Compose and README support remote access. |
| Linting | TypeScript noEmit only | Biome + TypeScript | B better. |
| Testing | Missing | Weak/partial | B has Vitest scripts; no-test pass caveat. |
| Documentation | Minimal | Good README | B better. |
| Accessibility | Weak / not explicit | Weak / not explicit | Neither had clear accessibility strategy in inspected files. |
| Performance optimization | Weak | Partial | B uses layered canvas and requestAnimationFrame; also had leak/resize concerns. |
| Offline/local persistence | SQLite server persistence | PostgreSQL server persistence; client `idb` dependency | B client local persistence needed verification. |

---

# 9. First Audit — Features Present in Both Repositories

## Realtime whiteboard concept

Both projects model a board as objects and operations.

Repository A:

- `server.ts` stores ops in SQLite.
- Broadcasts WebSocket messages.

Repository B:

- `Room.ts` persists ops to PostgreSQL.
- Broadcasts ordered operations.

## Deterministic/freehand stroke rendering

Repository A:

- `src/lib/ink.ts` performs resampling, smoothing, quantization, velocity pressure shimming, and `perfect-freehand` rendering.

Repository B:

- `packages/shared-core/src/stroke/normalizeStroke.ts` performs resampling, quantization, velocity pressure shim, and polygon generation.

First-audit conclusion:

```text
B’s version is cleaner because it is in a shared pure package instead of mixed into frontend rendering.
```

## Templates

Repository A:

- `src/lib/templates.ts` contains blank, SWOT, Kanban, and meeting agenda templates.

Repository B:

- `routes/boards.ts` exposes `/api/templates` and applies shared templates during board creation.

## Board sessions

Repository A:

- Board ID passed to `Board`.

Repository B:

- WebSocket route is `/ws/:boardId`.

## Roles

Both include `view`, `comment`, and `edit` role concepts.

First-audit conclusion:

```text
B’s role model is more serious.
```

---

# 10. First Audit — Features Only Present in Repository A

| Feature | Where | Valuable to Add to B? | Notes |
|---|---|---:|---|
| Home screen board join/create flow | `src/App.tsx` | Yes | B needs concrete onboarding flow if absent elsewhere. |
| Template chooser UI | `src/App.tsx` | Yes | B has templates API; A has usable picker behavior. |
| Rectangle/ellipse drawing | `src/components/Board.tsx` | Yes | B inspected renderer only drew strokes. |
| Text placement via textarea | `src/components/Board.tsx` | Yes | Port carefully; B should use protocol/Yjs model. |
| Laser pointer UI | `src/components/Board.tsx` | Yes | Useful meeting feature. |
| Realtime cursor overlay | `src/components/Board.tsx` | Yes if B client lacks it | B server has presence. |
| PNG export | `src/components/Board.tsx` | Yes | B README promised export; A had concrete implementation. |
| Concrete PDF export implementation | `src/components/Board.tsx` | Maybe | B should export from canonical object model, not raw screenshot only. |
| Simple SQLite local mode | `server.ts` | Maybe | Useful as dev/local mode, not canonical production path. |

---

# 11. First Audit — Features Only Present in Repository B

| Feature | Where | Valuable to Add to A? | Notes |
|---|---|---:|---|
| pnpm monorepo | `pnpm-workspace.yaml` | No, prefer B as base | Better to move A features into B. |
| Strict TypeScript base config | `tsconfig.base.json` | Yes conceptually | A should be strict if retained. |
| Shared core package | `packages/shared-core/` | Yes | A ink logic should be replaced with shared-core. |
| Shared protocol package | `packages/shared-protocol/` | Yes | A ad hoc messages should be replaced. |
| Fastify server app modules | `apps/server-api/src/app.ts` | Yes conceptually | Prefer B as canonical. |
| PostgreSQL schema | `apps/server-api/src/db/schema/` | Yes for production | More durable/scalable. |
| Drizzle ORM | `apps/server-api/src/db/client.ts` | Yes | Cleaner than raw SQL. |
| RoomManager/Room model | `rooms/RoomManager.ts`, `rooms/Room.ts` | Yes | Server-authoritative collaboration belongs here. |
| Operation dedupe | `db/schema/ops.ts`, `Room.ts` | Yes | Essential for reliable collaboration. |
| Snapshots | `db/schema/snapshots.ts`, `Room.ts` | Yes | Needed for replay scalability. |
| Checkpoint restore | `Room.ts` | Yes | A only stores checkpoint records. |
| Role rules | `auth/roles.ts` | Yes | A has role names, not real permission enforcement. |
| Payload/rate limits | `auth/limits.ts` | Yes | A lacks basic abuse protection. |
| JWT token utilities | `auth/token.ts` | Maybe | Must be enforced before it matters. |
| Docker Compose | `docker-compose.yml` | Maybe | B already owns deployment story. |
| Tailscale deployment | `docker-compose.yml`, README | Maybe | Useful private access path. |

---

# 12. First Audit — Features Missing From Both

| Missing Feature | Why It Matters |
|---|---|
| Real end-to-end authentication enforcement | Both unsafe if exposed publicly without it. |
| Strong WebSocket schema validation in hot path | Prevents malformed ops and client/server drift. |
| Automated integration tests | Realtime collaboration will regress without them. |
| End-to-end browser tests | Drawing apps break in subtle pointer/canvas ways. |
| Production secret handling docs | B had dev defaults; A had API key exposure risk. |
| Migrations workflow | B schema files seen; migration flow not verified. A inline schema creation. |
| Accessible keyboard workflows | Canvas apps need non-pointer alternatives and ARIA-supported controls. |
| Robust reconnect/backoff/session resume | A reconnects blindly; B has replay pieces but client resume needed verification. |
| Server-synced undo/redo semantics | A local-only; B schema-only/unclear. |
| Structured board-state import/export | A screenshot exports only; B claimed Markdown/PDF, later Markdown verified. |
| Observability/diagnostics dashboard | Needed for collaboration bugs. |
| Conflict/failure recovery documentation | Later corrected: B has MEETING_READY acceptance docs. |

---

# 13. First Audit — Function/Module Comparison

## Repository A Important Modules

| File / Module | Main Responsibility | Important Functions / Classes | Quality Notes |
|---|---|---|---|
| `src/App.tsx` | Routing, home screen, create/join flow | `Home`, `BoardRoute`, `App`, `createBoard`, `joinBoard` | Useful product flow, minimal error handling. |
| `src/components/Board.tsx` | Main whiteboard UI and behavior | `Board`, `handlePointerDown`, `handlePointerMove`, `handlePointerUp`, `exportCanvas`, `handleUndo` | Too large; mixes rendering, tools, sockets, history, export, UI. |
| `src/lib/socket.ts` | WebSocket client wrapper | `BoardSocket.connect`, `send`, `onMessage`, `disconnect` | Simple but weakly typed; reconnect lacks backoff/stop guard. |
| `src/lib/ink.ts` | Stroke normalization/drawing | `normalizeStroke`, `drawStroke` | Good prototype logic, should be shared/pure-tested. |
| `src/store/index.ts` | Client state | `useAppStore` actions | Clear enough; mutable Maps/Sets and weak domain boundaries. |
| `src/model/types.ts` | Object/op types | `BoardObject`, `OpType`, `OpEnvelope` | First audit flagged likely broken import; uses `payload: any`; declares image type but not union member. |
| `src/lib/templates.ts` | Board templates | `TEMPLATES` | Useful; uses `crypto.randomUUID()` at module load and couples server/frontend. |
| `server.ts` | Server, API, SQLite, WebSocket, Vite integration | `startServer`, `broadcast`, DB statements | Too much in one file; lacks validation/auth; fine for prototype. |

## Repository B Important Modules

| File / Module | Main Responsibility | Important Functions / Classes | Quality Notes |
|---|---|---|---|
| `apps/client-web/src/App.tsx` | App layout | `App` | Clean composition; imports toolbar/canvas/comments/timeline/status. |
| `apps/client-web/src/components/Canvas/Canvas.tsx` | Canvas layer setup | `Canvas`, `resize` | Good separation; DPR scaling concern; only pen attachment verified. |
| `apps/client-web/src/engine/InputEngine.ts` | Pointer capture | `attach`, `detach`, `extractPoint`, `extractCoalesced` | Clean focused class. |
| `apps/client-web/src/engine/InkEngine.ts` | Active stroke lifecycle | `onStrokeStart`, `onStrokeMove`, `onStrokeEnd`, `setCommitHandler` | Good abstraction; commit handler not wired in inspected Canvas. |
| `apps/client-web/src/renderer/CanvasRenderer.ts` | Canvas rendering loop | `attach`, `renderCommitted`, `renderActiveStroke`, `invalidate` | Good direction; only strokes rendered; store subscription not unsubscribed. |
| `apps/client-web/src/store/useAppStore.ts` | Tool/view state | Zustand setters | Clean but many tools not fully implemented in inspected canvas. |
| `apps/client-web/src/store/useCanvasStore.ts` | Board object state | `addObject`, `updateObject`, `removeObject`, selection actions | Cleaner than A; generic object data loses type specificity. |
| `apps/server-api/src/index.ts` | Server executable entry | `main` | Small and clean. |
| `apps/server-api/src/app.ts` | Fastify app builder | `buildApp` | Clean server composition. |
| `apps/server-api/src/rooms/RoomManager.ts` | Room lifecycle | `getOrCreate`, `handleConnection`, metrics | Good separation. |
| `apps/server-api/src/rooms/Room.ts` | Server-authoritative collaboration core | `load`, `addClient`, `handleMessage`, `handleDurable`, `applyOpToState`, `createSnapshot`, checkpoint methods | Strongest file, but large and needs tests. |
| `apps/server-api/src/routes/ws.ts` | WebSocket join route | `createWsRoutes` | Simple, but no inspected token verification. |
| `apps/server-api/src/routes/boards.ts` | Board/template API | `createBoardRoutes` | Useful, but likely UUID bug using system client ID. |
| `apps/server-api/src/auth/roles.ts` | Role checks | `isOpAllowed`, `canSendPresence`, `canSendHybrid` | Good, focused, testable. |
| `apps/server-api/src/auth/limits.ts` | Abuse limits | `LIMITS`, `ClientRateLimiter`, `isPayloadSizeOk` | Good, but cleanup not seen used. |
| `packages/shared-core/src/stroke/normalizeStroke.ts` | Deterministic stroke normalization | `normalizeStroke` | Good pure function; needs tests. |
| `packages/shared-protocol/src/schemas/op.ts` | Operation schemas | Zod operation schemas | Good protocol foundation. |
| `packages/shared-protocol/src/schemas/envelope.ts` | Envelope schemas | `validateEnvelopeWithDirection` | Good, but should be used server-side. |

## Similar Modules Doing Same Job Differently

| Job | Repository A | Repository B | First-Audit Verdict |
|---|---|---|---|
| Stroke normalization | `src/lib/ink.ts` | `packages/shared-core/src/stroke/normalizeStroke.ts` | B should win; port useful smoothing from A if desired. |
| Socket handling | `src/lib/socket.ts` + `server.ts` | `routes/ws.ts` + `RoomManager` + `Room` | B architecturally superior. |
| State management | One Zustand store | Split app store and canvas store | B cleaner. |
| Templates | Frontend/server import same file | Shared protocol templates + API route | B cleaner, but UUID bug risk. |
| Roles | Stored but everyone edit | Role utility functions and schema | B better, enforcement incomplete. |
| Checkpoints | Stored record only | Snapshot-linked create/restore | B better. |
| Export | Concrete canvas PNG/PDF | Claimed/dependency present; concrete implementation initially unclear | Later corrected: Markdown export verified in B. |

---

# 14. First Audit — Build, Run, Installation

## Repository A Install

```bash
npm install
```

## Repository A Run Locally

```bash
npm run dev
```

Runs:

```bash
tsx server.ts
```

## Repository A Build

```bash
npm run build
```

Build behavior:

```text
vite build && npm run build:server
```

Server build:

```text
esbuild server.ts --bundle --platform=node --format=cjs --outfile=dist/server.cjs --external:express --external:ws --external:better-sqlite3
```

## Repository A Test

No active root test script was found in `package.json`.

## Repository A Required Environment Variables

- `GEMINI_API_KEY` according to README and Vite config.
- `PORT` optionally for server.

## Repository A Required Local Services

None external.

SQLite database created under:

```text
data/dexdraw.db
```

## Repository A Setup Likely Works?

First-audit conclusion:

```text
Likely no / needs verification after fixing import bug.
```

Reason:

`src/model/types.ts` imported `Point` from `./ink`, while inspected ink file was `src/lib/ink.ts`; `src/model/ink.ts` was not found.

This was flagged as a likely type/build issue.

## Repository B Install

```bash
pnpm install
```

## Repository B Run Locally

```bash
pnpm dev
```

Also supported:

```bash
pnpm dev:client
pnpm dev:server
```

## Repository B Build

```bash
pnpm build
```

Runs:

```text
pnpm -r build
```

## Repository B Test

```bash
pnpm test
```

Caveat from first audit:

Some package scripts used:

```text
vitest run --passWithNoTests
```

So a passing test command alone may not prove coverage in every package.

## Repository B Package/Deploy

- Native Node/pnpm.
- Docker Compose.
- Optional Tailscale sidecar.

## Repository B Required Environment Variables

- `PORT`.
- `DATABASE_URL`.
- `TOKEN_SECRET`.
- `ALLOWED_ORIGINS`.
- `NODE_ENV`.
- Optional Tailscale auth key.

## Repository B Required Local Services

- PostgreSQL, unless using Docker Compose.
- Client process.
- Server process.

## Repository B Setup Likely Works?

First-audit conclusion:

```text
More likely than A, but not cleanly proven.
```

Reason:

Static inspection found a likely runtime/database bug:

```text
routes/boards.ts inserts clientId: 'system' into ops.clientId, but ops.clientId is defined as UUID.
```

## Build/Run Workflow Comparison

| Workflow | Repository A | Repository B | Better Implementation |
|---|---|---|---|
| Install | `npm install` | `pnpm install` | B for workspace correctness; A for simplicity. |
| Run locally | `npm run dev` | `pnpm dev`, `pnpm dev:client`, `pnpm dev:server` | B. |
| Build | Vite + esbuild server | Recursive package builds | B. |
| Test | No script | Vitest recursive, weak no-test pass caveat | B, but needs stronger enforcement. |
| Package | `dist/server.cjs` | Package builds + Docker | B. |
| Deploy | Manual Node server / AI Studio | Docker Compose + optional Tailscale | B. |
| Configure | Gemini key mention; no schema | Zod env loader + Docker env | B. |

---

# 15. First Audit — Testing and Reliability

## Repository A Testing

First-audit findings:

- No test script found in active root runtime.
- No unit tests found in active root runtime.
- No integration tests found in active root runtime.
- No end-to-end tests found in active root runtime.
- README only covered install/run.
- No whiteboard-specific manual test plan.
- No confirmed CI.

Reliability weaknesses:

- JSON parse errors logged but not structured.
- Socket errors mostly console-level.
- Invalid operations not schema-validated.
- Client/server payloads use `any`.
- Client reconnects every 2 seconds.
- No exponential backoff.
- No safe disconnect stop flag.
- No op queue.
- No robust resume beyond `lastSeq: 0`.
- Undo local-only.
- Redo disabled.
- Eraser missing behavior.
- Comment role not meaningfully enforced.
- Import bug likely blocks build.

## Repository B Testing

First-audit findings:

- Test framework exists.
- Coverage not fully proven in first pass.
- Root `test` runs `pnpm -r test`.
- Package-level `--passWithNoTests` means empty test packages can pass.
- Playwright listed in client dev dependencies, but actual end-to-end tests were not verified in first pass.

Reliability strengths:

- Room handles invalid JSON.
- Message size limit exists.
- Op payload limit exists.
- Batch size limit exists.
- Per-client rate limiter exists.
- Duplicate ops handled via in-memory and database unique constraints.
- Checkpoint restore logs warnings/errors.
- Room loads latest snapshot and replays ops.
- Recent ops buffer supports fast replay.

Reliability caveats:

- Recent ops buffer bounded; clients missing older ops need full snapshot/replay path.
- Client reconnect/resume not verified in inspected client code.
- WebSocket authentication/role restoration incomplete in inspected route.

## First-Audit Safety Verdict

| Question | Answer |
|---|---|
| Safer to change | Repository B |
| More likely to regress | Repository A |
| Better validation | Repository B, but must actually use shared protocol schemas in hot path |
| Needs testing most urgently | Both; B server tests first, A smoke/build test if retained |

## Recommended Tests From First Audit

### Repository A

| Test | Why |
|---|---|
| Build smoke test | Catch broken imports. |
| Board creation API test | Validate SQLite board creation and template insertion. |
| WebSocket join/sync test | Ensure join returns existing ops. |
| Create stroke op test | Ensure op persists and broadcasts. |
| Role enforcement test | Should fail today; needed before exposure. |
| Export smoke test | Ensure PNG/PDF export does not crash. |
| Undo behavior test | Document local-only behavior or replace it. |

### Repository B

| Test | Why |
|---|---|
| Shared-core deterministic stroke test | Same raw points must produce identical polygon. |
| Protocol schema validation test | Reject malformed ops/envelopes. |
| Room durable op test | Persist, apply, broadcast, dedupe. |
| Role enforcement test | view/comment/edit permissions. |
| Payload/rate limit test | Prevent abuse regressions. |
| Snapshot/replay test | Load latest snapshot and replay following ops. |
| Checkpoint restore test | Restore correct state and broadcast reset. |
| Board template creation test | Catch `clientId` UUID bug. |
| WebSocket auth test | Ensure token/role enforced. |
| Client/server drawing integration test | Draw stroke in browser A; verify browser B sees it. |

---

# 16. First Audit — Documentation Comparison

| Documentation Area | Repository A | Repository B | First-Audit Recommendation |
|---|---|---|---|
| README quality | Minimal AI Studio scaffold | Strong product + setup README | Replace A README or deprecate A. |
| Setup instructions | Basic npm run | Detailed pnpm, Docker, native, Tailscale | B good; add troubleshooting matrix. |
| Architecture documentation | None found beyond code | README architecture section | Expand B with diagrams/protocol docs. |
| Feature documentation | Weak | Moderate README claims | Add implemented-vs-planned status. |
| API documentation | Missing | Missing/partial | Add REST/WebSocket protocol docs. |
| Troubleshooting | Minimal | Some Docker troubleshooting | Expand both if retained. |
| Comments in code | Some useful comments | Good comments in core modules | B stronger. |
| Changelog/release notes | Not inspected/found | `CHANGELOG.md` exists in root listing | Inspect before relying. |
| Contributor guidance | Missing | Not verified | Add `CONTRIBUTING.md` if public collaboration matters. |
| Security docs | Missing | Missing/weak | Add production secret/auth guidance. |

## Top Documentation Improvements for Repository A

1. Replace AI Studio scaffold README with real DexDraw README.
2. Document architecture: React frontend, Express server, SQLite, WebSocket.
3. Document known limitations: no real auth, local-only undo, eraser missing, likely broken import.
4. Add API/WebSocket message examples.
5. Add prototype/deprecated status if B is canonical.

## Top Documentation Improvements for Repository B

1. Add implemented vs planned feature status.
2. Document WebSocket protocol with examples.
3. Document auth model and production secret requirements.
4. Add database migration/setup instructions.
5. Add real-time collaboration troubleshooting.
6. Add test plan and acceptance checklist.
7. Add architecture diagram.

Later correction:

B already has a meeting-ready acceptance checklist in `docs/MEETING_READY.md`, though it should still be treated as an acceptance target unless each scenario is backed by implementation and passing tests.

---

# 17. First Audit — Code Quality Scores

| Category | Repository A Score | Repository B Score | First-Audit Notes |
|---|---:|---:|---|
| Readability | 5 | 7 | A readable but concentrated. B modular and cleaner. |
| Maintainability | 3 | 7 | A large mixed-responsibility files. B workspaces/boundaries. |
| Modularity | 3 | 8 | B separates client/server/core/protocol. |
| Testability | 2 | 4 | A no tests. B configured but weak/no-test tolerant. |
| Documentation | 3 | 7 | A scaffold. B useful README. |
| Reliability | 3 | 5 | A likely build bug and weak sync. B better server, integration gaps. |
| Security posture | 2 | 5 | A lacks auth. B has primitives but incomplete enforcement/default-secret risk. |
| Developer experience | 4 | 7 | A simple but likely broken. B scripts/Docker/engines. |
| Feature completeness | 5 | 6 | A more visible UI features; B stronger infrastructure. |
| Overall maturity | 3 | 6 | B more serious. |

First-audit score rationale:

- A loses maintainability because `Board.tsx` and `server.ts` handle too much.
- B gains maintainability through `pnpm-workspace.yaml`, TypeScript references, strict config, package boundaries.
- B loses reliability because protocol schemas were not visibly enforced in inspected room path, WebSocket auth was not verified, and template route had likely UUID mismatch.

Later correction:

Scores should be adjusted upward for B after verifying Markdown export, tests, auth route, role tests, and MEETING_READY docs.

---

# 18. First Audit — Security, Privacy, and Risk Review

| Risk | Repository | Severity | Evidence Summary | Recommended Fix |
|---|---|---:|---|---|
| Potential client exposure of Gemini API key | A | High | `vite.config.ts` defines `process.env.GEMINI_API_KEY` into Vite client build. | Never expose provider API keys in browser; route through server. |
| No real auth for board access | A | High | Server joins users and assigns edit role by default. | Add token-based auth or signed board invite tokens. |
| Weak role enforcement | A | High | Role fields exist, all joining clients become edit. | Enforce roles server-side on every op. |
| Unvalidated WebSocket payloads | A | High | Server parses JSON and trusts shape. | Add Zod schemas and reject invalid payloads. |
| Ad hoc `any` protocol | A | Medium | `socket.ts`, `types.ts` use `any`. | Replace with shared typed protocol. |
| Blind reconnect loop | A | Medium | Fixed reconnect after close. | Add backoff/manual close/max retry. |
| Default development token secret | B | High if deployed unchanged | Env/config and compose define dev defaults. | Require production secret; fail startup in prod if placeholder. |
| Database default credential in compose | B | High if exposed | Compose publishes PostgreSQL and dev DB credentials. | Use local binding or secrets; document dev-only. |
| WebSocket join lacks verified auth in inspected route | B | High | `routes/ws.ts` accepts join and calls `handleConnection`; token verification not shown. | Require JWT/invite token in join query/header/message. |
| `Room.addClient` defaults role to edit | B | High | Default parameter `role = 'edit'`. | Never default unknown users to edit; resolve from verified token/member table. |
| Protocol schemas not enforced in hot path | B | Medium/High | Shared protocol exists; `Room.handleMessage` casts parsed JSON. | Use schema validation before processing. |
| Template seeding UUID mismatch | B | High reliability | Route inserts `clientId: 'system'` into UUID field. | Use constant UUID system actor or schema change. |
| Tailscale sidecar privileges | B | Medium | Compose grants network capabilities/tun device. | Document optional; isolate deployment. |
| Rate limiter cleanup not used | B | Low/Medium | Cleanup exists but no inspected call. | Schedule cleanup or expire entries. |
| CanvasRenderer subscription leak | B | Low/Medium | Store subscription return not retained/unsubscribed. | Store unsubscribe and call on detach. |

No secret values were printed.

---

# 19. First Audit — Performance and Scalability

## Repository A Strengths

- SQLite simple and low overhead for local use.
- Single process easy to run.
- Canvas rendering straightforward.
- Operation log simple.

## Repository A Risks

| Area | Risk |
|---|---|
| Startup | Fine locally, but single process couples server and dev middleware. |
| Runtime rendering | Full canvas redraw every animation frame, even when nothing changes. |
| Memory | Large objects/history Maps copied for undo; no cap. |
| Network | Cursor broadcasts every ~50ms, no server-side rate limit. |
| Database | `SELECT MAX(server_seq)+1` per op does not scale well under concurrency. |
| Large files | No large-board strategy. |
| Reconnect | Fixed reconnect loop can hammer server. |
| API rate limits | None found. |
| Frontend | One giant component increases render/debug cost. |

## Repository B Strengths

- Server-authoritative operation log.
- Dedupe indexes.
- Snapshot system.
- PostgreSQL connection pooling.
- Rate and payload limits.
- Room lifecycle management.
- Layered canvas rendering.
- Shared pure stroke functions.

## Repository B Risks

| Area | Risk |
|---|---|
| Startup | More services: client, server, PostgreSQL. |
| Runtime | `Room` keeps in-memory object maps/recent op buffers; needs load testing. |
| Memory | Rate limiter cleanup not visibly scheduled; room state may grow. |
| Network | Better limits, but presence/hybrid behavior needs verification. |
| Database | Snapshot/ops design good; migrations/index tuning need verification. |
| Rendering | RAF loop runs continuously; active stroke normalization can be costly for long strokes. |
| Resize | Canvas resize scales context repeatedly without resetting transform; may compound. |
| Large boards | Has object limit; still needs pagination/snapshot compaction policy. |

First-audit scalability verdict:

```text
Repository B scales better architecturally.
Repository A is suitable for local prototype use.
Repository B is better for multi-user persistent private-server deployment.
```

---

# 20. First Audit — UX/Product Experience

## Repository A UX Strengths

Repository A gives a user something concrete:

- Home screen.
- Join board.
- Create board.
- Template picker.
- Toolbar.
- Pen/shape/text/laser tools.
- Cursor overlay.
- PNG/PDF export.

## Repository A UX Weaknesses

- Error messages mostly absent.
- View/comment/edit roles not clearly surfaced.
- Undo misleading because local-only.
- Redo button disabled.
- Eraser button exists but behavior missing.
- Build may fail due import bug.
- README does not explain DexDraw itself.

## Repository B UX Strengths

- README gives clearer product promise.
- App layout imports toolbar, canvas, comments, parking lot, timeline scrubber, status bar, comment panel.
- Stronger product direction.

## Repository B UX Weaknesses

- Inspected canvas pipeline only proved pen/stroke drawing.
- Shape/text/comment/timeline behavior needed verification in uninspected components.
- Client-server operation commit not proven from inspected `Canvas.tsx` / `InkEngine.ts`.
- Product features may be partially scaffolded rather than fully wired.

## First-Audit UX Verdict

| Question | Answer |
|---|---|
| Easier for a new user | Repository A, if it builds. |
| Easier for a developer to operate | Repository B. |
| More polished product surface | A has immediately visible interactions; B has stronger direction. |
| Better product direction | Repository B. |

---

# 21. First Audit — Cross-Pollination Opportunities

## Add From Repository A Into Repository B

| Item | What It Is | Why It Matters | Where in A | Port Difficulty | Risk | Suggested Approach |
|---|---|---|---|---:|---:|---|
| Board home/create/join UI | User entry flow | B needs concrete onboarding if missing | `src/App.tsx` | Low/Medium | Low | Rebuild using B UI and `/api/boards`. |
| Template picker UI | Select template before board creation | B has template API | `src/App.tsx`, `src/lib/templates.ts` | Medium | Medium | Fetch B `/api/templates`; create with `templateId`. |
| Shape drawing | Rect/ellipse creation | Core whiteboard feature | `Board.tsx` | Medium | Medium | Implement as typed `createObject` ops. |
| Text placement | Click-to-place textarea | Meeting notes need text | `Board.tsx` | Medium/High | Medium | Use B text/Yjs model. |
| Laser pointer | Temporary pointer/highlight | Useful meetings | `Board.tsx` | Low/Medium | Low | Send as ephemeral presence payload. |
| Cursor overlay | Remote cursor rendering | Collaboration feedback | `Board.tsx` | Low | Low | Bind to B presence state. |
| PNG export | Canvas screenshot export | Quick win | `Board.tsx` | Low | Low | Add export service. |
| PDF export | Canvas-to-PDF | Useful | `Board.tsx` | Medium | Low | Start screenshot-based; later object-model export. |
| Simple local demo mode | SQLite one-process model | Useful demos | `server.ts` | High | Medium | Consider optional dev adapter only. |

## Add From Repository B Into Repository A

| Item | What It Is | Why It Matters | Where in B | Port Difficulty | Risk | Suggested Approach |
|---|---|---|---|---:|---:|---|
| Shared stroke core | Pure deterministic ink package | Removes duplicate ink | `packages/shared-core/` | Medium | Low | Replace A `ink.ts`. |
| Shared protocol | Zod ops/envelopes | Avoids `any` messages | `packages/shared-protocol/` | High | Medium | Better to migrate A features into B. |
| Role enforcement | Permission rules | A unsafe | `auth/roles.ts` | Medium | Medium | Server-check every op. |
| Rate/payload limits | Abuse protection | Needed before exposure | `auth/limits.ts` | Low/Medium | Low | Add to A WS path. |
| Snapshot/checkpoint restore | State recovery | A only stores checkpoints | `Room.ts`, schema | High | Medium | Not worth porting if A is retired. |
| Docker deployment | Reproducible stack | Better dev ops | `docker-compose.yml` | Medium | Medium | Only if A remains separately useful. |
| Strict TypeScript | Safer builds | A likely import bug | `tsconfig.base.json` | Medium | Medium | Enable strict gradually. |

---

# 22. First Audit — Merge / Replace / Keep Separate Recommendation

First-audit recommendation:

```text
Treat Repository B as the canonical future DexDraw.
Treat Repository A as prototype/reference implementation for UI features.
Do not merge wholesale.
Do not keep both as equal long-term products.
```

## Why

Repository B has the architecture.
Repository A has useful product interactions but weaker foundations.

Merging A directly into B would pollute B with:

- Ad hoc message formats.
- Local-only undo.
- Weak auth assumptions.
- Large mixed-responsibility component patterns.

## Canonical Base

```text
Repository B should become the canonical base.
```

## Migrate From A Into B

1. Home/create/join flow.
2. Template picker UX.
3. Shape tools.
4. Text tool.
5. Laser pointer.
6. Cursor overlay if B lacks concrete implementation.
7. PNG/PDF export logic, redesigned around B’s object model.
8. Useful stroke smoothing choices from A after testing against B deterministic pipeline.

## Delete or Deprecate

- A ad hoc protocol.
- A local-only undo semantics.
- A role-default-to-edit behavior.
- A server-side import of frontend templates.
- A generic AI Studio README.

## Preserve

- A fast UX ideas.
- A simple board creation flow.
- A export proof of concept.
- A practical template examples.

## Rewrite

- A WebSocket protocol.
- A auth/role handling.
- A Board component as modular B components.
- A SQLite operation model if production matters.

## Test Before Migration

1. B builds cleanly.
2. B server can create blank board.
3. B server can create templated board after fixing UUID bug.
4. B client can create stroke object and send it to server.
5. Second client receives same stroke.
6. Shape/text ops round-trip.
7. Checkpoint create/restore works.
8. Export works from canonical B state.

---

# 23. First Audit — Priority Fix List

| Priority | Repository | Issue / Opportunity | Impact | Effort | Recommended Action |
|---:|---|---|---|---|---|
| 1 | B | WebSocket auth not enforced in inspected route | High | Medium | Require verified board token before `handleConnection`. |
| 2 | B | Template seeding likely inserts non-UUID system client ID | High | Low | Replace with constant valid system UUID or schema change. |
| 3 | B | Protocol schemas not enforced in `Room.handleMessage` | High | Medium | Validate parsed messages with shared protocol schemas. |
| 4 | B | Tests can pass with no tests | High | Medium | Add real tests, then remove `--passWithNoTests` package by package. |
| 5 | A | Broken import in `src/model/types.ts` | High | Low | Change import to correct path or move shared type. |
| 6 | A | No real auth; everyone edit | High | Medium | Add server-side permission checks or retire A. |
| 7 | B | Client-server drawing commit unclear | High | Medium | Wire `InkEngine.setCommitHandler` into networking and test two clients. |
| 8 | B | Renderer only handles strokes | Medium | Medium | Add shape/text/image renderers via object-type strategy. |
| 9 | A | Local-only undo misleading | Medium | Medium | Label local-only or implement server op undo. |
| 10 | B | Default dev secrets in production path | High | Low | Fail startup in production if placeholder/default detected. |
| 11 | B | CanvasRenderer subscription leak | Medium | Low | Store unsubscribe and call in `detach`. |
| 12 | A | Fixed reconnect loop | Medium | Low | Add manual close flag and exponential backoff. |
| 13 | B | Long-poll fallback placeholders | Medium | Medium | Implement or remove until real. |
| 14 | B | Documentation lacks implemented/planned status | Medium | Low | Add feature status table. |
| 15 | Shared | No end-to-end collaborative drawing test | High | Medium | Add Playwright two-client test. |

---

# 24. First Audit — Roadmaps

## Repository A Roadmap

### Short-Term

1. Fix `src/model/types.ts` import.
2. Run `npm run lint` and `npm run build`.
3. Update README to say what project actually is.
4. Mark known limitations: no real auth, local-only undo, redo missing, eraser missing.
5. Decide whether A is deprecated or prototype branch.

### Medium-Term

If keeping A:

1. Add Zod message validation.
2. Add server-side role enforcement.
3. Add tests for board creation, WebSocket join, op persistence, export.
4. Split `Board.tsx` into toolbar, canvas renderer, tools, export, socket sync.
5. Move templates into shared model.

### Long-Term

Do not invest heavily unless there is a reason to keep SQLite single-process edition.
Otherwise, freeze A after harvesting features into B.

## Repository B Roadmap

### Short-Term

1. Fix template seeding UUID bug.
2. Enforce WebSocket auth.
3. Wire client stroke commits to server operations.
4. Add first integration test: two clients, one stroke, both see same object.
5. Add server unit tests for roles, limits, op dedupe, snapshots, checkpoint restore.
6. Remove production-unsafe defaults or fail startup in production.

### Medium-Term

1. Implement shape/text tools using shared protocol.
2. Implement export from canonical object model.
3. Add proper board creation/join UX.
4. Add migrations and seed docs.
5. Add protocol documentation.
6. Add reconnection/resume behavior.
7. Add observability: room count, client count, op rate, DB error metrics.

### Long-Term

1. Build stable plugin/tool architecture for board object types.
2. Add full permission system: owner/member/invite links.
3. Add offline queue/local persistence if needed.
4. Add structured Markdown export.
5. Add load tests for large boards and many clients.
6. Consider optional local SQLite adapter only after PostgreSQL path stable.

## Shared / Cross-Repo Roadmap

### Short-Term

1. Pick B as canonical.
2. Create migration checklist from A features to B.
3. Write “DexDraw Canonical Architecture” doc.
4. Open tasks for each A feature to port.

### Medium-Term

1. Port A template picker, shapes, text, laser pointer, cursor overlay, export into B.
2. Use B shared protocol for all ported features.
3. Add tests around every ported feature.

### Long-Term

1. Archive or clearly mark A as prototype.
2. Keep B as only active DexDraw product.
3. Optionally preserve A as `dexdraw-prototype-ai-studio` if lineage matters.

---

# 25. First Audit — Final Verdict

## Stronger Overall

```text
Repository B.
```

## Better Architecture

```text
Repository B, decisively.
```

Reasons:

- Monorepo.
- Shared core.
- Shared protocol.
- Fastify server.
- PostgreSQL schema.
- Room manager.
- Snapshot/checkpoint model.
- Strict TypeScript setup.

## Better Features

Split verdict:

```text
Immediately visible UI features: Repository A.
Durable collaboration/server features: Repository B.
Best product after sane investment: Repository B with A’s UI features ported in.
```

## Easier to Maintain

```text
Repository B.
```

## Riskier

```text
Engineering risk: Repository A.
False confidence risk: Repository B.
```

Meaning:

Repository B has strong architecture language, but some critical paths were incomplete or mismatched in inspected code.

## Should Receive More Investment

```text
Repository B.
```

## Smartest Next Move From First Audit

1. Declare B canonical.
2. Fix B critical backend correctness issues:
   - WebSocket auth enforcement.
   - Template UUID bug.
   - Protocol validation in `Room.handleMessage`.
   - Production secret guardrails.
3. Prove B collaboration loop with one end-to-end test:
   - Browser A draws stroke.
   - Server persists op.
   - Browser B receives and renders same stroke.
4. Port A useful UI features into B:
   - Board join/create.
   - Template picker.
   - Shapes.
   - Text.
   - Laser pointer.
   - Cursor overlay.
   - PNG/PDF export.
5. Retire or label A as prototype.

---

# 26. Supplied External Report — Core Claims

The user then uploaded a second comparison report and asked to compare and contrast the results.

The supplied report’s executive summary said:

```text
Repository A is a single-node, AI-Studio-oriented DexDraw variant: an Express + Vite + React 19 app with a built-in SQLite persistence layer and a simplified real-time whiteboard UI, plus a vendored copy of the older DexDraw monorepo under dexDraw_old/.

Repository B is the full DexDraw monorepo: React 19 client, Fastify + WebSocket + PostgreSQL server, and two shared packages that implement the deterministic ink engine and the structured wire protocol, with Docker, Tailscale integration, tests, and extensive docs.
```

The supplied report’s largest new claim versus first audit:

```text
Repository A contains a vendored copy of the older DexDraw monorepo under dexDraw_old/.
```

This was later verified in conversation by directly fetching:

```text
Repository A: dexDraw_old/package.json
```

That file contained the same package identity as Repository B:

```text
name: dexdraw
description: DexDraw — shared real-time whiteboard for business meetings
scripts: pnpm workspace scripts
engines: Node >=22, pnpm >=9
```

## Supplied Report’s Biggest Similarities

The supplied report said both repos implement:

- Real-time collaborative whiteboard.
- Deterministic ink.
- WebSocket sync.
- Board templates.
- Export to at least PNG/PDF.
- TypeScript/React 19.
- Zustand client state.

## Supplied Report’s Biggest Differences

The supplied report said:

Repository B is:

- Multi-package.
- Server-authoritative.
- Protocol-driven.
- PostgreSQL-backed.
- JWT-auth-capable.
- Rate-limited.
- Richer product surface.

Repository A is:

- Compact.
- Mostly unauthenticated.
- Demo-style.
- Single Express process.
- Local SQLite file.

## Supplied Report’s Maturity Verdict

The supplied report judged Repository B as:

- More mature.
- More maintainable.
- More complete.
- Clearer product story.

Repository A was judged:

- Newer but more prototype-like.
- Duplicative because it vendors older code.
- Minimally documented around its own architecture/features.

## Supplied Report’s Key Risks

### Repository A risks in supplied report

- No authentication.
- No rate limiting.
- Ad hoc WebSocket protocol.
- No tests at top level.
- SQLite file database.
- Potential exposure of `GEMINI_API_KEY` via client build.

### Repository B risks in supplied report

- Hard-coded dev secrets in `docker-compose.yml`.
- No CI workflows checked in.
- Complex architecture requiring discipline.

---

# 27. Supplied Report — Purpose Analysis

## Repository A in Supplied Report

The supplied report described A as:

```text
An AI Studio-packaged DexDraw instance.
```

Stated purpose:

- Run/deploy an AI Studio app.
- Provide DexDraw whiteboard as core interactive surface.
- Real-time collaborative whiteboard.
- Pen, shapes, text, cursors, basic undo, templates, PNG/PDF export.
- Local SQLite DB.

Likely users:

- People running Google AI Studio apps.
- Users wanting a collaborative canvas inside AI workflow.
- Users wanting an easily deployable single-binary DexDraw demo/runtime.

Problem solved:

```text
I want an immediately deployable, self-contained collaborative whiteboard that fits AI Studio’s hosting model.
```

Main workflow:

1. Start server with `npm run dev`.
2. Express + Vite + WebSocket server boots.
3. `better-sqlite3` database at `./data/dexdraw.db`.
4. Home screen joins board or creates template board.
5. Board screen connects to WebSocket.
6. Operations sync for board.
7. Canvas renders strokes/shapes/text.
8. Other users’ cursors display.
9. Export PNG/PDF.

Maturity:

```text
Early working prototype or Lite integration, not canonical product.
```

## Repository B in Supplied Report

The supplied report described B as:

```text
The main DexDraw product.
```

Purpose:

- High-performance real-time shared whiteboard for business meetings.
- Self-hosting.
- Strong determinism.
- Privacy.

Likely users:

- Teams running private collaboration tools.
- Facilitators running structured meetings.

Problem solved:

- Real-time multi-user whiteboarding.
- Server-authoritative state.
- Deterministic ink.
- Robust meeting workflows.
- Checkpoints.
- Time travel.
- Comments.
- Parking lot.
- Exports.
- Acceptance suite.

Maturity:

```text
Primary, production-oriented DexDraw codebase.
```

## Supplied Purpose Comparison

The supplied report stated:

- Both solve the same core product problem.
- B targets complete meeting workflows.
- A targets simpler board/cursor/basic tools in single-service deployment.
- `dexDraw_old/` inside A strongly indicates A is derivative/repackaging of B.
- A does not supersede B.
- A strips features/architecture complexity to fit AI Studio.
- A and B are complementary.
- B should be canonical product.
- A should be AI Studio-friendly single-process adapter/demo.

---

# 28. Supplied Report — Technical Stack Table

| Category | Repository A | Repository B | Supplied Notes |
|---|---|---|---|
| Primary language | TypeScript | TypeScript | Both TypeScript end-to-end. |
| Secondary languages | HTML, CSS | HTML, CSS, Docker YAML | B has infra. |
| Frameworks | React 19 + Vite, Express | React 19 + Vite, Fastify, Yjs, Drizzle | B structured backend. |
| Package manager | npm | pnpm monorepo | B workspaces. |
| Runtime | Node.js not pinned | Node >=22 pinned | B explicit. |
| Build system | Vite + esbuild server | TS project refs + Vite + tsc builds | B more scalable. |
| Test framework | None at root; tests only under vendored old repo | Vitest across apps/packages | B wired via `pnpm test`. |
| Linting/formatting | None visible | Biome | B enforces style. |
| CI/CD | Unclear | Unclear | Neither has CI checked in. |
| Database/storage | SQLite local file | PostgreSQL 16 + Drizzle | B scalable. |
| API style | Minimal REST + raw WS | REST routes + WS shared protocol | B structured/validated. |
| UI approach | Single-page app, shadcn-style, single Board screen | Multi-pane UI with toolbar/canvas/comments/parking/timeline/status | B richer. |
| Auth/permissions | None; role always edit | JWT tokens, roles, rate limiting, CORS | Supplied report says B has actual auth/security controls. |
| Deployment target | AI Studio / Cloud Run style single service | Docker Compose + Tailscale + native pnpm | B self-hosting. |
| Platform assumptions | Single Node + SQLite | Multi-container stack + Postgres | B heavier but production-grade. |

---

# 29. Supplied Report — Architecture Claims

## Repository A Architecture in Supplied Report

Main folders/contents:

- Root `server.ts`.
- `src/` client.
- `lib/`.
- `components/`.
- `dexDraw_old/` vendored monorepo.
- `metadata.json`.
- `tsconfig.json`.
- `vite.config.ts`.
- `index.html`.

A active modules:

- `server.ts` initializes SQLite schema for boards, members, ops, checkpoints.
- `server.ts` defines REST routes.
- `server.ts` manages WebSocket connections and clients map.
- `Board.tsx` renders toolbar/canvas/cursors.
- `Board.tsx` handles pointer events, undo, PNG/PDF export.
- `socket.ts` reconnects and dispatches messages.
- `ink.ts` uses deterministic pipeline.
- `store/index.ts` stores board state.

Supplied report described A as:

```text
Light abstractions, otherwise fairly monolithic.
```

## Repository B Architecture in Supplied Report

Main folders:

- `apps/client-web`.
- `apps/server-api`.
- `packages/shared-core`.
- `packages/shared-protocol`.
- `docs`.
- `deploy`.
- `tools`.
- Docker Compose.
- lockfile.
- workspace config.

Important supplied claim:

B has richer folders than first audit inspected, including:

- client `export/`.
- client `presence/`.
- client `text/`.
- client `recognition/`.
- client `workers/`.
- server `yjs/`.
- tests and E2E setup.

B active modules described:

- `buildApp()` loads env, DB, RoomManager, plugins, routes.
- `routes/boards.ts` handles templates and board creation.
- `routes/ws.ts` handles WebSocket join handshake.
- `shared-core` handles deterministic ink.
- `shared-protocol` handles operation and envelope schemas.
- client engine/renderer/store modules split responsibilities.
- `exportMarkdown.ts` handles meeting summary export.

Supplied report architecture verdict:

```text
B’s separation into apps and packages, RoomManager, and protocol packages is significantly cleaner and more modular than A’s single-file server and monolithic Board component.
```

---

# 30. Supplied Report — Feature Matrix Claims

The supplied report marked many Repository B features as Present.

Notable claims:

| Feature | Repository A | Repository B | Supplied Claim |
|---|---:|---:|---|
| Realtime collaborative drawing | Present | Present | Both support multi-user drawing. |
| Deterministic ink engine | Present | Present | A local, B shared-core. |
| Board templates | Present | Present | B API + shared-protocol templates. |
| Text objects | Present | Present | Supplied says B CRDT-backed text/export. |
| Shapes | Present | Present | Supplied says both support. |
| Selection/transform | Present basic | Present | Supplied says B more complete. |
| Undo/redo | Partial | Present | Supplied says B robust. |
| Comments | Missing | Present | B comment overlay/panel/store/export. |
| Parking lot | Missing | Present | B ParkingLot component/export behavior. |
| Timeline/checkpoint scrubber | Partial | Present | B API/UI. |
| Offline/outbox/reconnect | Missing | Present | B scenarios described/code implied. |
| Long-poll fallback | Missing | Partial | B routes stubbed/TODO. |
| Export PNG/PDF | Present | Present | B plus Markdown. |
| Export Markdown | Missing | Present | B exportMarkdown + tests. |
| Authentication | Missing | Present | B JWT tokens. |
| Authorization/roles | Partial | Present | B roles/limits tests. |
| Rate limiting | Missing | Present | B Fastify rate limit. |
| CORS/CSP | Missing | Present | B CORS + Helmet CSP. |
| Meeting acceptance tests | Missing | Present | B MEETING_READY. |
| Unit tests | Missing root | Present | B Vitest. |
| E2E tests | Missing | Partial | B Playwright config scaffold. |
| Lint/format | Missing | Present | B Biome. |
| Dockerization | Missing | Present | B Compose. |
| Tailscale | Missing | Present | B sidecar. |
| Security/privacy framing | Unclear | Present | README. |
| Accessibility | Unclear | Unclear | Neither explicit. |

Important later comparison finding:

Some of these “Present” labels are too strong unless the exact code paths and passing tests are verified.

---

# 31. Supplied Report — Testing Claims

The supplied report said Repository A has:

- No tests defined at active root.
- Tests only in vendored `dexDraw_old`.
- No A-root integration or E2E tests.
- No feature acceptance plan.

The supplied report said Repository B has:

- Vitest tests for client:
  - stores.
  - replay engine.
  - Markdown export.
- Vitest tests for server:
  - board routes.
  - roles.
  - limits.
- root `pnpm test`.
- Fastify inject/mock DB tests.
- Playwright config for E2E.
- `docs/MEETING_READY.md` with ten acceptance scenarios.

Later verification in conversation confirmed:

- `exportMarkdown.ts` exists.
- `exportMarkdown.test.ts` exists.
- `roles.test.ts` exists.
- `MEETING_READY.md` exists.

The board route test file specifically requested during comparison was not found at path:

```text
apps/server-api/src/__tests__/boards.test.ts
```

So board route test presence remains not fully verified from the path checked.

---

# 32. Supplied Report — Documentation Claims

The supplied report said Repository A docs are weak:

- Minimal AI Studio run instructions only.
- No architecture docs.
- No feature docs.
- No API docs.
- No troubleshooting.
- No changelog.
- No contributor guidance.

The supplied report said Repository B docs are strong:

- README with features/install/Docker/architecture/governance.
- `CLAUDE.md`.
- `MEETING_READY.md`.
- `RUNBOOK_MACOS.md`.
- `CHANGELOG.md`.
- Docker and Tailscale docs.

Later verification confirmed at least `MEETING_READY.md` exists and is substantial.

---

# 33. Supplied Report — Code Quality Scores

The supplied report scored:

| Category | Repository A | Repository B |
|---|---:|---:|
| Readability | 7 | 9 |
| Maintainability | 5 | 9 |
| Modularity | 4 | 9 |
| Testability | 3 | 8 |
| Documentation | 3 | 9 |
| Reliability | 5 | 8 |
| Security posture | 3 | 7 |
| Developer experience | 6 | 9 |
| Feature completeness | 5 | 9 |
| Overall maturity | 5 | 9 |

Compared to first audit, supplied report was much more generous toward B and somewhat more generous toward A.

Later comparison conclusion:

- B should be scored higher than first audit originally scored because more docs/tests/export files were confirmed.
- B should probably not be scored as high as the supplied report unless end-to-end feature implementation is verified.

---

# 34. Supplied Report — Security/Risk Claims

The supplied report’s risk table included:

## Repository A Risks

| Risk | Severity | Recommended Fix |
|---|---:|---|
| No authentication on board access | High | Introduce simple token/user model; restrict board access. |
| No rate limiting or CORS | Medium | Add rate limiting and CORS or deployment protection. |
| Potential exposure of `GEMINI_API_KEY` to client | High if used | Make Gemini calls server-side/proxied; avoid embedding secrets in client. |
| Weak/no input validation | Medium | Add schema validation for WS and request bodies. |

## Repository B Risks

| Risk | Severity | Recommended Fix |
|---|---:|---|
| Hardcoded dev DB credentials | Low/Medium | Document dev-only and override in production. |
| Hardcoded JWT secret in Docker Compose | Medium | Override in production; fail startup with default in production. |
| Missing full input validation on routes | Low/Medium | Add Zod schemas for request bodies/queries. |
| Logging sensitive board content | Low caution | Avoid logging raw board content/user text. |

The supplied report did **not** highlight the same WebSocket auth enforcement issue as strongly as first audit.

Later comparison preserved the first audit’s concern:

```text
B has auth primitives, but inspected WebSocket join path did not verify token before connection handling.
```

---

# 35. Supplied Report — Performance/Scalability Claims

## Repository A

Strengths:

- Lightweight single process.
- Express + Vite or static.
- SQLite.
- Quick startup.
- Low memory footprint.

Risks:

- In-memory client map and broadcast logic fine for small groups, but not scale.
- SQLite writes synchronous.
- No backpressure.
- No op batching.
- SQLite DB grows with ops/checkpoints.
- No pruning.

## Repository B

Strengths:

- Fastify + Postgres.
- RoomManager.
- Shared protocol.
- More scalable architecture.
- Can theoretically scale with multiple server instances plus shared DB, though care required.

Verdict:

```text
B more likely to scale to many boards/users with acceptable latency and consistency.
A ideal for small teams or AI Studio scenarios with modest concurrency.
```

---

# 36. Supplied Report — UX/Product Claims

## Repository A UX

- Simpler.
- Home page with board ID and template selection.
- Easier for first-time users needing just a canvas.
- No in-UI guidance.
- Limited failure recovery.

## Repository B UX

- More complex.
- Toolbar, comments, timeline, parking lot.
- Better supported by docs like MEETING_READY.
- Built for structured meetings.
- More learning curve.

Supplied UX verdict:

| Question | Answer |
|---|---|
| Easier for new user | A |
| Easier for developer/operator | B |
| More polished product direction | B |

---

# 37. Supplied Report — Cross-Pollination Recommendations

## Add From A Into B

1. AI Studio-friendly single-service deployment pattern.
2. Shadcn-style UI polish.
3. Simple undo stack model for local-only changes.

## Add From B Into A

1. Shared-core stroke engine.
2. Shared-protocol.
3. Authentication, roles, basic security.
4. Meeting-ready export and Markdown.
5. Checkpoints and time travel UI.
6. Docs and runbooks.

## Supplied Merge Recommendation

The supplied report recommended:

```text
Keep separate, with B as canonical DexDraw and A as AI Studio / Lite adapter.
Refactor shared logic into shared packages and make A depend on them.
```

If merging:

- Canonical base: B.
- Migrate from A:
  - AI Studio-specific integration files.
  - metadata.
  - env example.
  - AI Studio README sections.
  - shadcn UI improvements.
- Delete/deprecate:
  - `dexDraw_old/` in A once relationship is formalized.
- Preserve:
  - B monorepo.
  - shared-core/protocol.
  - tests.
  - Docker stack.
  - docs.
- Rewrite:
  - A `server.ts` and `Board.tsx` to consume shared-protocol/shared-core.

---

# 38. Supplied Report — Priority Fixes

| Priority | Repository | Issue / Opportunity | Impact | Effort | Recommended Action |
|---:|---|---|---|---|---|
| 1 | A | No auth, open boards | High security/privacy | Medium | Introduce access control/token auth. |
| 2 | A | Ad hoc WS protocol/no validation | High runtime/divergence risk | Medium | Adopt shared-protocol or Zod validation. |
| 3 | A | No tests | High regression risk | Medium | Add Vitest, port key tests. |
| 4 | A | Potential Gemini key exposure | High | Low | Server-side/proxy Gemini calls. |
| 5 | B | Hardcoded dev secrets | Medium prod misuse | Low | Document dev-only; prod override; fail if default in prod. |
| 6 | B | Long-poll fallback endpoints stubbed | Medium reliability | Medium | Implement/test fallback. |
| 7 | B | No CI pipeline | Medium | Low | Add CI for lint/typecheck/tests. |
| 8 | A | Monolithic `Board.tsx` and `server.ts` | Medium maintainability | Medium | Split into smaller modules. |
| 9 | Both | Accessibility improvements | Medium | Medium | Review keyboard/ARIA. |
| 10 | Both | High-level API docs | Medium DX | Low | Add endpoint and WS handshake docs. |

---

# 39. Supplied Report — Roadmap

## Repository A

### Short-Term

- Add minimal tests/linting.
- Add unit tests for ink pipeline.
- Add integration tests for board creation/basic WebSocket sync.
- Introduce simple auth or board owner tokens.
- Clarify README relationship to main DexDraw.

### Medium-Term

- Replace custom ink/op types with B shared-core/shared-protocol.
- Factor `server.ts` into DB, WS handler, HTTP routes.
- Factor `Board.tsx` into canvas renderer, tool palette, export panel, cursor overlay.

### Long-Term

- Define A as DexDraw AI Studio adapter.
- Possibly manage A inside B monorepo or as package referencing B core.
- Add selective comments/parking/timeline features if feasible.
- Consider Docker Lite image.

## Repository B

### Short-Term

- Implement long-poll fallback endpoints and tests.
- Add CI pipeline.
- Update docs to clarify relationship with A.

### Medium-Term

- Expand Playwright E2E coverage to automate MEETING_READY suite.
- Add more request validation using Zod.
- Harden security defaults.

### Long-Term

- Explore multi-tenant/org-level ownership/sharing.
- Add observability.
- Expose public SDK or API client built on shared-protocol.

## Shared Work

- Single source of truth for ink/protocol.
- Central DexDraw design/product spec.
- Feature matrix for full, lite, AI Studio variants.
- Shared docs and test scenarios.

---

# 40. Supplied Report — Final Verdict

The supplied report concluded:

```text
Repository B is stronger overall by a wide margin.
Repository B has better architecture.
Repository B has better features.
Repository B is easier to maintain.
Repository A is riskier.
Repository B should receive more investment.
Repository A should become a thin, documented adapter built on B shared packages.
```

Smartest next move in supplied report:

1. In B, solidify CI, fallback transport, and E2E coverage.
2. In A, position it as “DexDraw AI Studio / Lite.”
3. Refactor A to depend on B shared-core/shared-protocol.
4. Add minimum security and tests to A.
5. Remove or deprecate `dexDraw_old/` after relationship is explicit.

---

# 41. Direct Comparison — My First Audit vs Supplied Report

## Where Supplied Report Was Clearly Right and First Audit Was Incomplete

| Area | First Audit | Supplied Report | Corrected View |
|---|---|---|---|
| A contains `dexDraw_old/` | Missed it. | Says A includes vendored older DexDraw monorepo. | Correct. Verified by fetching `dexDraw_old/package.json`. |
| B Markdown export | Marked as claimed/needs verification. | Says B has Markdown export and tests. | Correct. Verified `exportMarkdown.ts` and `exportMarkdown.test.ts`. |
| B meeting-readiness docs | Not inspected. | Says B has Meeting-Ready Acceptance Suite. | Correct. Verified `docs/MEETING_READY.md`. |
| B auth route/tests | Saw token utilities/role functions but not route/tests. | Says B has JWT auth and role tests. | Mostly correct. Verified `routes/auth.ts` and `roles.test.ts`. |
| A as AI Studio/Lite adapter | Called AI Studio-generated prototype. | Calls it AI Studio/Lite adapter derivative of B. | Supplied framing stronger because `dexDraw_old/` supports derivative/repackaging interpretation. |

## Where First Audit Was More Cautious and Still Correct

The supplied report treated documented acceptance scenarios, component imports, and architecture intent as implemented features in some cases.

That is too generous unless exact code paths are verified.

| Feature / Claim | Supplied Report Says | Corrected View | Reason |
|---|---|---|---|
| B long-poll fallback | Present / partial, supported | Partial / placeholder | First audit found `/api/poll` and `/api/ops` placeholders returning empty ops / ok. |
| B shapes/text rendering | Present | Needs verification / partial | Inspected `CanvasRenderer.ts` only rendered strokes and comments said other object types future. |
| B full collaborative drawing client-server loop | Present | Needs verification | `InkEngine` has commit handler; inspected `Canvas.tsx` did not show wiring to networking. |
| B authentication enforced | Present | Auth primitives present; enforcement incomplete/needs verification | Token route exists, but inspected WebSocket join route did not verify token. |
| B undo/redo robust | Present | Schema/docs suggest intent; implementation not fully verified | Protocol has undo/redo schemas, but inspected `Room.applyOpToState` did not implement undo/redo mutation. |
| B offline/outbox | Present | Not verified | `MEETING_READY.md` describes expected behavior, but doc is acceptance target, not proof. |

---

# 42. Biggest Correction to First Audit

The first audit should have separated Repository A into two layers:

## Layer 1 — Active Root Runtime

```text
Express + Vite + React + SQLite single-process app.
```

This is the code likely executed by Repository A root scripts.

## Layer 2 — Vendored Legacy/Canonical Code Snapshot

```text
dexDraw_old/
```

This appears to be an embedded copy/snapshot of the older/full DexDraw monorepo-style project.

This changes the identity analysis:

```text
Repository A is not merely a small prototype repo.
Repository A is a small runnable AI Studio-style app plus an embedded copy of the older/full DexDraw architecture.
```

The supplied report caught this; first audit missed it.

---

# 43. Biggest Overreach in Supplied Report

The supplied report was too confident about B feature completeness.

It marked many features as “Present” based on:

- README claims.
- Acceptance-suite expectations.
- Imported UI components.
- Tests for isolated utilities.
- Planned placeholder routes.

But these are different levels of evidence.

## Evidence Strength Ladder

| Evidence Type | Reliability |
|---|---:|
| README marketing claim | Low to medium |
| Acceptance checklist | Medium for intent, low for implementation proof |
| Component import | Medium for existence, low for full behavior |
| Utility function file | Medium/high for that isolated feature |
| Unit test file | High for tested utility behavior |
| Integration test | Higher |
| End-to-end passing test | Highest |
| Successful local build/run/test execution | Highest practical confidence |

Correct wording should be:

```text
Repository B has the stronger architecture, broader intended feature surface, and verified pieces of Markdown export, roles, auth-token routes, and meeting-readiness documentation. Some advanced features still need code-path verification before being called fully implemented.
```

---

# 44. Updated Verdict After Comparing Both Reports

| Question | Updated Answer |
|---|---|
| Which report was more complete on repo inventory? | Supplied report. It found `dexDraw_old/`, B docs, Markdown export, and tests missed in first audit. |
| Which report was more careful about implementation certainty? | First audit. It avoided calling documented/planned behavior fully implemented without direct code-path proof. |
| Does supplied report change main strategic recommendation? | No. B is still canonical; A should be Lite/AI Studio/prototype/adapter. |
| Does it change A/B relationship? | Yes. A appears more clearly derivative of B because it vendors `dexDraw_old/`. |
| Does B look stronger after new evidence? | Yes. Added docs/tests/export strengthen B’s maturity score. |
| Does B still have risks? | Yes. Auth enforcement, long-poll fallback, client-server wiring, and feature completeness still need verification. |

---

# 45. Revised Scores After Comparing Both Reports

| Category | First-Audit A | Revised A | First-Audit B | Revised B | Reason |
|---|---:|---:|---:|---:|---|
| Documentation | 3 | 4 | 7 | 8 | A has vendored docs indirectly; B has MEETING_READY. |
| Feature completeness | 5 | 5 | 6 | 7 | B has verified Markdown export/tests and broader documented target. |
| Testability | 2 | 3 | 4 | 6 | B has verified tests; A root runtime still lacks tests. |
| Overall maturity | 3 | 4 | 6 | 7 | B more mature than first pass credited; A still runtime prototype plus vendored code. |
| Security posture | 2 | 2 | 5 | 5 | B has auth route/tests, but WebSocket enforcement remains unresolved. |

## Revised Code Quality Table

| Category | Repository A Revised Score | Repository B Revised Score | Notes |
|---|---:|---:|---|
| Readability | 5 | 7.5 | A active runtime readable but monolithic; B modular. |
| Maintainability | 4 | 7.5 | A has vendored complexity; B structured but incomplete integration risks. |
| Modularity | 4 | 8 | A active runtime low modularity; vendored old code more modular but not root runtime. |
| Testability | 3 | 6 | B verified some tests; A root weak. |
| Documentation | 4 | 8 | B much stronger; A root weak but includes vendored docs/code. |
| Reliability | 3.5 | 6 | B better primitives; runtime paths need verification. |
| Security posture | 2 | 5 | B has primitives/tests; enforcement still key. |
| Developer experience | 4.5 | 7.5 | B scripts/docs/Docker better. |
| Feature completeness | 5 | 7 | B stronger after export/docs/tests; still not 9 without E2E proof. |
| Overall maturity | 4 | 7 | B canonical; A adapter/prototype. |

---

# 46. Clean Final Synthesis

The most accurate combined conclusion is:

```text
Repository B is the canonical DexDraw architecture and should receive primary investment.

Repository A is an AI Studio/Lite runtime that appears to vendor an older/full DexDraw copy under dexDraw_old/.

Repository A has simpler runnable behavior and useful UI ideas, but Repository B has the better architecture, stronger docs, shared protocol/core packages, tests, Markdown export, and deployment story.
```

Important caution:

```text
Do not let the supplied report’s optimism blur the distinction between documented/scaffolded features and verified implementation.
```

Documentation is a promise.
Code is evidence.
Tests are stronger evidence.
End-to-end passing behavior is the final proof.

---

# 47. Updated Canonical Relationship Model

## Repository B

Repository B should be treated as:

```text
Canonical DexDraw product and architecture.
```

Why:

- Monorepo structure.
- Shared packages.
- Stronger README/docs.
- Docker Compose.
- Tailscale support.
- PostgreSQL persistence.
- Fastify backend.
- Protocol schemas.
- Auth primitives.
- Role tests.
- Markdown export and tests.
- Meeting-ready acceptance suite.

## Repository A

Repository A should be treated as:

```text
DexDraw AI Studio / Lite / single-process adapter, plus vendored older DexDraw code snapshot.
```

Why:

- Root README is AI Studio scaffold.
- Root active runtime uses Express + Vite + SQLite.
- It has simpler UI and local deployment model.
- It vendors `dexDraw_old/`, strongly implying derivative/repackaging lineage.

## Best Relationship

```text
Keep separate for now.
Make B canonical.
Make A a documented adapter/lite runtime.
Remove or deprecate vendored dexDraw_old once A depends on shared packages properly.
```

---

# 48. Final Consolidated Feature Matrix

This matrix combines first audit, supplied report, and later corrections.

| Feature / Function | Repository A Root Runtime | Repository A `dexDraw_old/` | Repository B | Final Status Notes |
|---|---:|---:|---:|---|
| React frontend | Present | Present | Present | Both roots use React-style frontend; A also vendors older monorepo. |
| Vite | Present | Present | Present | A root and B both use Vite. |
| TypeScript | Present | Present | Present | Both TypeScript. |
| Single-process server | Present | Not primary | Missing / not primary | A root has Express+Vite+WS in one process. |
| Express server | Present | No / not primary | No | A root only. |
| Fastify server | Missing root | Present in vendored old | Present | B canonical uses Fastify. |
| SQLite persistence | Present | Missing / not primary | Missing | A root only. |
| PostgreSQL persistence | Missing root | Present in vendored old | Present | B canonical. |
| Drizzle ORM | Missing root | Present | Present | B canonical. |
| WebSocket sync | Present | Present | Present | Protocol sophistication differs. |
| Shared protocol | Missing root | Present | Present | A root ad hoc; B formal. |
| Shared core ink | Missing root | Present | Present | A root has local ink pipeline. |
| Deterministic ink | Present local | Present shared | Present shared | B architecture cleaner. |
| Board creation | Present | Present | Present | B route likely needs UUID fix. |
| Board join UI | Present | Needs verification | Needs verification | A root concrete. |
| Template picker UI | Present | Needs verification | Needs verification | A root concrete; B API exists. |
| Templates API | Missing or basic via board create | Present | Present | B exposes `/api/templates`. |
| Pen drawing | Present | Present | Present local; server sync needs verification | B inspected local drawing; network commit unclear. |
| Shape drawing | Present | Present/claimed | Partial/needs verification | B renderer inspected strokes only. |
| Text tool | Present simple | Present/claimed | Partial/needs verification | B has Yjs/protocol/docs; path needs verification. |
| Laser pointer | Present | Present/claimed | Partial/needs verification | A concrete; B docs/protocol likely. |
| Realtime cursor overlay | Present | Present/claimed | Needs verification | A concrete. |
| Comments | Missing root | Present/claimed | Present/needs path verification | B components/docs/export mention comments. |
| Parking lot | Missing root | Present/claimed | Present/verified in exportMarkdown/tests | B export handles parked items. |
| Timeline/checkpoints UI | Missing root | Present/claimed | Present/needs path verification | B docs and server checkpoint logic exist. |
| Checkpoint DB table | Present | Present | Present | A stores; B richer. |
| Checkpoint restore | Missing root | Present/claimed | Present server-side | B `Room.ts` restore logic observed earlier. |
| PNG export | Present | Present/claimed | Needs verification | A concrete. |
| PDF export | Present | Present/claimed | Needs verification | A concrete; B README/docs claim. |
| Markdown export | Missing root | Present/claimed | Present verified | B `exportMarkdown.ts` and test verified. |
| Undo | Local-only | Present/claimed | Partial/needs verification | B protocol/docs suggest; implementation needs proof. |
| Redo | Disabled/stub | Present/claimed | Partial/needs verification | Same. |
| Auth token route | Missing root | Present | Present verified | B `routes/auth.ts` verified. |
| WebSocket auth enforcement | Missing | Needs verification | Needs verification / concerning | Token route exists, WS verification not seen. |
| Role enforcement | Weak | Present/claimed | Partial/verified utility tests | B roles utility tests verified; runtime enforcement path still key. |
| Rate limiting | Missing root | Present | Present | B has limits/rate plugin. |
| CORS/CSP | Missing root | Present | Present | B has plugins/Helmet. |
| Docker Compose | Missing root | Present | Present | B canonical. |
| Tailscale | Missing root | Present | Present | B Compose/README. |
| Vitest tests | Missing root | Present | Present verified partially | B tests verified for exportMarkdown/roles. |
| E2E tests | Missing root | Possible scaffold | Partial/needs verification | Supplied report says Playwright scaffold. |
| CI workflows | Not found | Not found | Not found | Both need CI. |
| Accessibility docs | Not found | Not found | Not found | Both need accessibility work. |

---

# 49. Final Consolidated Risk Register

| Risk | Repository | Severity | Confidence | Explanation | Recommended Fix |
|---|---|---:|---:|---|---|
| No root runtime auth | A | High | High | A root WebSocket/board access appears open and defaults users to edit. | Add token/auth or keep A internal only. |
| Gemini key exposure via Vite define | A | High if key used | High | Vite config injects `GEMINI_API_KEY` into client build. | Move Gemini calls server-side/proxy. |
| Ad hoc WebSocket protocol | A | High | High | A root messages are raw JSON/`any`. | Use shared-protocol or Zod validation. |
| No root active tests | A | High | High | A root package lacks test script. | Add Vitest and integration tests. |
| Monolithic root server | A | Medium | High | `server.ts` mixes DB/API/WS/Vite. | Split DB/routes/ws/config. |
| Monolithic board component | A | Medium | High | `Board.tsx` handles tools/render/network/export/history. | Split into hooks/components/services. |
| Vendored `dexDraw_old/` confusion | A | Medium | High | A contains old monorepo copy. | Document relationship; remove after shared packages. |
| WebSocket auth enforcement unclear | B | High | High | Auth route exists; inspected WS route did not verify token. | Require/verify board token before room join. |
| Default dev secrets | B | Medium/High | High | Compose/env defaults include dev secrets. | Fail in production if default secret used. |
| Template seeding UUID mismatch | B | High reliability | Medium/High | Earlier inspection saw `clientId: 'system'` inserted into UUID field. | Use fixed system UUID or schema change. |
| Protocol schemas not enforced in hot path | B | Medium/High | Medium | Shared schemas exist; Room parse/cast path looked manual. | Validate all inbound messages. |
| Long-poll fallback placeholder | B | Medium | High | App route placeholders earlier inspected. | Implement or remove until real. |
| Feature overclaim risk | B | Medium | High | Docs/components may imply features not fully wired. | Add implemented/planned matrix and E2E tests. |
| No CI | Both | Medium | High | No confirmed workflows. | Add GitHub Actions for lint/typecheck/test/build. |
| Accessibility missing | Both | Medium | High | No explicit accessibility strategy. | Add keyboard/ARIA review and tests. |

---

# 50. Final Consolidated Recommendations

## Strategic Recommendation

```text
Repository B should be canonical.
Repository A should be a documented AI Studio / Lite adapter.
Do not merge wholesale.
Do not maintain both as equal products.
```

## Immediate Repository B Priorities

1. Verify and enforce WebSocket authentication.
2. Fix or verify template seeding UUID behavior.
3. Ensure inbound WebSocket messages use shared-protocol validation.
4. Confirm client-server stroke commit wiring.
5. Confirm shape/text/comment/timeline features are actually implemented end-to-end.
6. Convert MEETING_READY scenarios into automated end-to-end tests.
7. Add CI.
8. Add implemented/planned feature matrix to docs.
9. Fail production startup when default dev secrets are used.
10. Implement or remove placeholder long-poll fallback endpoints.

## Immediate Repository A Priorities

1. Document A’s identity:
   - AI Studio / Lite.
   - Single-process Express/Vite/SQLite.
   - Contains vendored `dexDraw_old/` snapshot.
2. Decide whether A root runtime remains active.
3. If active, fix likely import/build issues.
4. Add root tests.
5. Add auth or mark internal-only.
6. Remove Gemini key exposure risk.
7. Replace ad hoc protocol with B shared-protocol.
8. Replace local ink logic with B shared-core if preserving A.
9. Split `server.ts` and `Board.tsx`.
10. Remove/deprecate `dexDraw_old/` after shared dependency relationship is established.

## Cross-Repo Priorities

1. Define a single source of truth for:
   - Ink behavior.
   - Operation protocol.
   - Board object schema.
   - Template format.
2. Create a DexDraw variant matrix:
   - Full/canonical B.
   - AI Studio/Lite A.
   - Possible future local-only/Docker Lite.
3. Decide package distribution method:
   - Publish shared packages.
   - Use Git submodule/subtree.
   - Move A into B monorepo as app variant.
4. Create migration tasks for A features worth preserving.
5. Create retirement/archive plan for duplicate old code.

---

# 51. Concrete Action Plan

## Phase 1 — Verification Lockdown

Goal:

```text
Stop guessing which B features are implemented. Verify by code path and tests.
```

Tasks:

1. Run B build:

```bash
pnpm install
pnpm typecheck
pnpm build
```

2. Run B tests:

```bash
pnpm test
```

3. Search/verify B code paths for:

- WebSocket token verification.
- Client stroke networking.
- Shape rendering.
- Text object creation/editing.
- Yjs text integration.
- Undo/redo implementation.
- Checkpoint restore UI.
- Long-poll fallback implementation.
- Export PNG/PDF implementation.
- Playwright E2E tests.

4. Create an implemented/planned matrix in B docs.

## Phase 2 — Fix Canonical B Critical Bugs

Tasks:

1. Fix template seeding actor ID.
2. Require token verification for WebSocket join.
3. Pass role from verified token/member table into `Room.addClient`.
4. Remove default `role = 'edit'` behavior for unknown users.
5. Validate incoming messages with shared protocol.
6. Add tests for all of the above.

## Phase 3 — Port A’s Useful UX Into B

Port in this order:

1. Home create/join flow.
2. Template picker.
3. Cursor overlay if missing.
4. Laser pointer.
5. Shape tools.
6. Text placement/editing.
7. PNG export.
8. PDF export.
9. Any useful shadcn-style UI polish.

Rule:

```text
Do not port A’s ad hoc protocol or local-only undo semantics into B.
```

## Phase 4 — Reposition or Retire A

Decision point:

If A is useful as a Lite/AI Studio runtime:

- Document it clearly.
- Make it depend on B shared-core/shared-protocol.
- Add tests/security.
- Remove vendored old code.

If A is not useful:

- Archive it.
- Add README pointing to B.
- Preserve only useful UI snippets/migration notes.

## Phase 5 — CI and Acceptance Automation

For B:

1. Add GitHub Actions.
2. Run:
   - install.
   - lint.
   - typecheck.
   - unit tests.
   - build.
   - E2E smoke test.
3. Convert `MEETING_READY.md` scenarios into Playwright tests.
4. Block release if any meeting-ready scenario fails.

---

# 52. Final Master Verdict

The complete, corrected position is:

```text
Repository B is the stronger and more important repository.
It should be the canonical DexDraw implementation.

Repository A is not just a tiny prototype: it is a root AI Studio/Lite runtime plus a vendored older DexDraw monorepo under dexDraw_old/.
That makes it useful as a deployment adapter or historical snapshot, but dangerous as a second independent source of truth.

The supplied report was better at inventory completeness.
The first audit was better at refusing to treat docs/scaffolds as implementation proof.
The merged conclusion is stronger than either one alone.
```

## Stronger Overall

```text
Repository B.
```

## Better Architecture

```text
Repository B.
```

## Better Active Simple UX

```text
Repository A root runtime has some immediately visible simple UI flows.
```

## Better Product Direction

```text
Repository B.
```

## Easier to Maintain Long-Term

```text
Repository B.
```

## Riskier

```text
Repository A as a public deployment.
Repository B if its documented/scaffolded features are assumed complete without verification.
```

## Should Receive More Investment

```text
Repository B.
```

## Smartest Next Move

```text
Use Repository B as canonical.
Audit B feature claims against actual implementation.
Fix B auth/protocol/template issues.
Port only useful A UX patterns into B.
Recast A as Lite/AI Studio adapter or archive it.
Delete/deprecate dexDraw_old once shared-package dependency is formalized.
```

---

# 53. Appendix — Files and Paths Mentioned

## Repository A Paths

```text
README.md
package.json
package-lock.json
index.html
src/main.tsx
src/App.tsx
src/components/Board.tsx
src/lib/socket.ts
src/lib/ink.ts
src/lib/templates.ts
src/store/index.ts
src/model/types.ts
vite.config.ts
tsconfig.json
server.ts
data/dexdraw.db
dexDraw_old/package.json
```

## Repository B Paths

```text
README.md
package.json
pnpm-workspace.yaml
tsconfig.json
tsconfig.base.json
docker-compose.yml
apps/client-web/package.json
apps/server-api/package.json
packages/shared-core/package.json
packages/shared-protocol/package.json
apps/client-web/src/main.tsx
apps/client-web/src/App.tsx
apps/client-web/src/components/Canvas/Canvas.tsx
apps/client-web/src/engine/InputEngine.ts
apps/client-web/src/engine/InkEngine.ts
apps/client-web/src/renderer/CanvasRenderer.ts
apps/client-web/src/store/useAppStore.ts
apps/client-web/src/store/useCanvasStore.ts
apps/client-web/src/export/exportMarkdown.ts
apps/client-web/src/__tests__/exportMarkdown.test.ts
apps/server-api/src/index.ts
apps/server-api/src/app.ts
apps/server-api/src/config/env.ts
apps/server-api/src/db/client.ts
apps/server-api/src/db/schema/index.ts
apps/server-api/src/db/schema/boards.ts
apps/server-api/src/db/schema/ops.ts
apps/server-api/src/db/schema/checkpoints.ts
apps/server-api/src/db/schema/snapshots.ts
apps/server-api/src/db/schema/users.ts
apps/server-api/src/db/schema/yjsUpdates.ts
apps/server-api/src/rooms/RoomManager.ts
apps/server-api/src/rooms/Room.ts
apps/server-api/src/routes/ws.ts
apps/server-api/src/routes/boards.ts
apps/server-api/src/routes/auth.ts
apps/server-api/src/auth/token.ts
apps/server-api/src/auth/roles.ts
apps/server-api/src/auth/limits.ts
apps/server-api/src/__tests__/roles.test.ts
packages/shared-core/src/index.ts
packages/shared-core/src/stroke/normalizeStroke.ts
packages/shared-protocol/src/index.ts
packages/shared-protocol/src/schemas/op.ts
packages/shared-protocol/src/schemas/envelope.ts
docs/MEETING_READY.md
```

---

# 54. Appendix — Terminology

## Active Root Runtime

The files at the root of Repository A that are actually used by root scripts such as:

```bash
npm run dev
npm run build
npm start
```

These include:

```text
server.ts
src/App.tsx
src/components/Board.tsx
src/lib/*
src/store/*
```

## Vendored Old Monorepo

The embedded copy under:

```text
dexDraw_old/
```

This appears to contain an older/full DexDraw monorepo structure and should not be confused with A’s active root runtime unless scripts explicitly reference it.

## Canonical Repository

The repository that should be treated as the main source of truth for the product.

Final recommendation:

```text
Repository B should be canonical.
```

## Lite / Adapter Repository

A simplified runtime variant built for a specific deployment context.

Final recommendation:

```text
Repository A should be Lite / AI Studio adapter if retained.
```

## Implementation Proof

A feature should only be called fully implemented when there is enough evidence from:

- Source code.
- Wired code path.
- Tests.
- Build/run verification.
- End-to-end behavior.

Documentation alone is not enough.

---

# 55. Final Practical Checklist

## For Repository B

```text
[ ] Confirm build passes.
[ ] Confirm test suite passes.
[ ] Confirm WebSocket auth is enforced.
[ ] Fix/default-deny room join roles.
[ ] Fix template system actor UUID if still present.
[ ] Validate inbound WebSocket envelopes.
[ ] Confirm client stroke commit reaches server.
[ ] Confirm two-client realtime stroke sync.
[ ] Confirm shape rendering and sync.
[ ] Confirm text/Yjs editing and sync.
[ ] Confirm undo/redo implementation.
[ ] Confirm checkpoint restore UI and server behavior.
[ ] Confirm long-poll fallback or remove placeholder claim.
[ ] Confirm PNG/PDF export implementation.
[ ] Keep Markdown export and tests.
[ ] Convert MEETING_READY scenarios to automated E2E tests.
[ ] Add CI.
[ ] Add implemented/planned docs matrix.
```

## For Repository A

```text
[ ] Decide whether A remains active.
[ ] Document A as AI Studio / Lite adapter.
[ ] Document dexDraw_old relationship.
[ ] Fix root build/type issues.
[ ] Add root test script.
[ ] Add board creation test.
[ ] Add WebSocket sync test.
[ ] Add export smoke test.
[ ] Remove client-exposed Gemini secret risk.
[ ] Add auth or mark internal-only.
[ ] Replace ad hoc protocol with shared-protocol.
[ ] Replace local ink logic with shared-core.
[ ] Split server.ts.
[ ] Split Board.tsx.
[ ] Remove/deprecate dexDraw_old after formal shared package dependency.
```

## For Both

```text
[ ] Add accessibility review.
[ ] Add API documentation.
[ ] Add WebSocket protocol documentation.
[ ] Add production deployment security notes.
[ ] Add CI.
[ ] Add variant relationship documentation.
[ ] Maintain one source of truth for protocol and ink.
```

