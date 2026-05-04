# Codex Implementation Prompt: Build DexDraw vNext

You are Codex acting as a senior full-stack TypeScript engineer, product-minded software architect, and test-focused implementation agent.

Your task is to build **DexDraw vNext**, a clean collaborative whiteboard tool, from this design handoff package.

Do not treat this package as optional notes. Treat it as the governing implementation contract.

## Source Package to Read First

Read these files before writing code:

1. `README.md`
2. `research-artifact-source.md`
3. `citation-map.md`
4. `docs/product-requirements.md`
5. `docs/architecture.md`
6. `docs/protocol.md`
7. `docs/security.md`
8. `docs/test-plan.md`
9. `specs/package-structure.json`
10. `specs/board-object-schema.json`
11. `specs/operation-protocol.json`
12. `specs/api-routes.yaml`
13. `specs/implementation-backlog.csv`

If you are working inside a repository, inspect the repository after reading the package and append/update the local `DexDraw_vNext_Bible.md` after each meaningful work unit.

## Core Strategy

Build vNext cleanly.

- Repository B (`westkitty/dexDraw`) is the architecture reference.
- Repository A (`westkitty/https-github.com-westkitty-DexDraw_Redux`) is only a UX/reference source.
- Do **not** merge old repositories wholesale.
- Do **not** import A's ad hoc WebSocket protocol.
- Do **not** preserve everyone-defaults-to-edit behavior.
- Do **not** expose provider API keys in browser code.
- Do **not** claim old repo features work unless you verify code path and test behavior.

The intended architecture is:

```text
apps/client-web
apps/server-api
packages/shared-core
packages/shared-protocol
docs
tests
```

## Required Technical Stack

Use these defaults unless the actual target repo already has compatible choices:

- TypeScript
- pnpm workspaces
- React + Vite client
- Fastify server
- WebSocket realtime transport
- PostgreSQL with Drizzle ORM
- Zod validation in shared protocol
- Vitest for unit/integration tests
- Playwright for two-client end-to-end tests
- Biome or equivalent lint/format tooling

If a tool choice conflicts with existing repository reality, explain the conflict in the project bible and choose the least destructive path.

## Minimum Viable vNext

The first working version is not feature-complete until this passes:

1. Start server and client locally.
2. Create a board.
3. Open the board in two browser clients.
4. Client A draws one freehand stroke.
5. Client A sends a typed durable operation.
6. Server validates the token, role, payload, and operation schema.
7. Server assigns canonical sequence.
8. Server persists the operation.
9. Server broadcasts the operation.
10. Client B receives and renders the same stroke object.
11. Reloading the board restores the stroke from persisted state.
12. Automated test proves the loop.

Nothing else outranks that proof.

## Implementation Rules

### Shared protocol

All durable client/server messages must be defined in `packages/shared-protocol`.

Use Zod schemas for:

- operation envelopes
- board create requests
- board join tokens
- durable operations
- ephemeral presence messages
- errors
- snapshots/checkpoints

Server must reject invalid messages before mutation.

### Shared core

All deterministic board math belongs in `packages/shared-core`.

Include:

- point types
- viewport transforms
- stroke normalization
- bounds calculation
- hit testing
- object ordering helpers
- export geometry helpers

Client and server must not duplicate core object logic.

### Server API

Implement server-authoritative behavior:

- board creation
- template application
- membership / role resolution
- signed board access tokens
- durable operation log
- sequence assignment
- replay since sequence
- snapshots or checkpoints
- WebSocket room lifecycle
- rate and payload limits
- safe error responses

Default role behavior must be deny, not edit.

### Client web app

Implement the first user-facing flow from A, but in B-style modules:

- home screen
- create board
- join board by code/link
- template picker
- canvas workspace
- toolbar
- color/stroke controls
- collaborator presence
- cursor overlay
- laser pointer
- export menu
- status indicator

Keep components small. Do not create a new giant `Board.tsx` that owns everything.

### Object model

Implement typed objects:

- stroke
- rectangle
- ellipse
- text
- note
- image placeholder if needed later
- cursor and laser are ephemeral presence, not durable board objects

### Security

Implement:

- no provider secrets in client bundle
- signed board invite/join tokens
- role checks per durable op
- rate limits
- payload limits
- production secret guard
- CORS origin allowlist
- safe logging that does not dump board content by default

### UX and accessibility

Implement:

- visible focus states
- labeled toolbar buttons
- keyboard navigation through toolbar
- escape to cancel active tool/text entry
- undo/redo buttons disabled accurately when unavailable
- error banners with recovery actions
- responsive layout
- reduced-motion respect for cursors/laser

## Milestones

### Milestone 0: Scaffold

- Create or verify monorepo layout.
- Add package scripts: `dev`, `build`, `typecheck`, `test`, `lint`.
- Add shared packages.
- Add environment example files without secrets.

### Milestone 1: Protocol and core

- Implement object schemas.
- Implement operation envelope schemas.
- Implement stroke normalization and geometry helpers.
- Add tests.

### Milestone 2: Server base

- Implement Fastify app.
- Implement DB schema.
- Implement board creation and token issue route.
- Implement WebSocket join with token verification.
- Implement operation validation, sequencing, persistence, replay.

### Milestone 3: Client first loop

- Implement home/create/join.
- Implement canvas and pen tool.
- Implement WebSocket client.
- Implement optimistic render and server reconciliation.
- Prove two-client stroke sync.

### Milestone 4: Product tools

- Template picker.
- Rectangle, ellipse, text, notes.
- Cursor overlay and laser pointer.
- Selection and basic delete.

### Milestone 5: Export and recovery

- PNG export.
- PDF export if practical.
- Markdown export for meeting summary.
- Checkpoint create/restore.

### Milestone 6: Hardening

- Playwright two-client tests.
- Role tests.
- Invalid payload tests.
- Reconnect/replay tests.
- CI workflow.
- Production secret guard.

## Acceptance Criteria

The project is acceptable when:

- `pnpm install` succeeds.
- `pnpm typecheck` succeeds.
- `pnpm build` succeeds.
- `pnpm test` succeeds.
- Playwright proves two-client stroke sync.
- Unknown users cannot send edit operations.
- View users cannot mutate board state.
- Comment users can only comment/note if allowed by product policy.
- Edit users can draw valid objects.
- Invalid WebSocket messages are rejected without crashing server.
- Reloading a board replays persisted operations.
- No secrets are exposed to the client bundle.
- README explains local run steps.

## Work Method

1. Inspect current repo if one exists.
2. Compare repo state to this package.
3. Create an implementation plan before writing code.
4. Work milestone by milestone.
5. Run tests after each meaningful unit.
6. Update `DexDraw_vNext_Bible.md` after each meaningful completed unit.
7. Do not quietly skip tests; if blocked, record the exact blocker.
8. When uncertain, choose the simpler implementation that preserves the architecture spine.

## Output Expected From Codex

When finished or paused, report:

- files created/changed
- commands run
- test/build results
- features completed
- known gaps
- exact next step
- any deviations from this handoff and why
