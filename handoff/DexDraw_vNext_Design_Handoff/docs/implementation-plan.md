# Implementation Plan

## Phase 0 - Verification and setup

- Decide target repository or new branch.
- Inspect existing files if working inside old repo.
- Confirm Node and pnpm versions.
- Install dependencies.
- Run current tests if any.
- Record baseline in `DexDraw_vNext_Bible.md`.

## Phase 1 - Monorepo scaffold

- Create workspace layout.
- Add package scripts.
- Add TypeScript base config.
- Add lint/test/build tooling.
- Add environment examples.

## Phase 2 - Shared packages

- Define board object schemas.
- Define operation envelope schemas.
- Define error schemas.
- Add stroke and geometry helpers.
- Unit test schemas and pure helpers.

## Phase 3 - Server core

- Build Fastify app.
- Load environment safely.
- Connect database.
- Define tables.
- Implement board creation.
- Implement token issue/verify.
- Implement WebSocket join.
- Implement durable op validation and persistence.

## Phase 4 - Client core

- Build app shell.
- Implement home create/join.
- Implement canvas surface.
- Implement pen tool.
- Implement WebSocket client and reconnect/replay.

## Phase 5 - First proof

- Automated two-client test.
- Draw one stroke.
- Assert second client sees it.
- Assert reload restores it.

## Phase 6 - Tools

- Shape tools.
- Text tool.
- Cursor overlay.
- Laser pointer.
- Selection and delete.

## Phase 7 - Outputs and recovery

- PNG export.
- PDF export.
- Markdown export.
- Checkpoint create/restore.

## Phase 8 - Hardening

- Role matrix tests.
- Malformed payload tests.
- Rate limit tests.
- CI workflow.
- README and deployment docs.
