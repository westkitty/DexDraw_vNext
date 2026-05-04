# Slide Outline: DexDraw vNext Implementation Handoff

## Slide 1 - Title
Purpose: Establish the rebuild decision.
- Title: DexDraw vNext
- Subtitle: Clean rebuild from two repository lineages
- Source: S1

## Slide 2 - Why Not Merge
Purpose: Explain the core risk.
- Direct merging would import A's ad hoc protocol and security problems.
- Keeping both repos equal creates duplicate truth.
- Source: S1

## Slide 3 - Repository A Lessons
Purpose: Identify what to preserve.
- Useful UX: create/join, templates, shapes, text, laser, cursors, export.
- Reject: no real auth, browser key risk, monolithic Board/server, local-only undo semantics.
- Source: S1, S3

## Slide 4 - Repository B Lessons
Purpose: Identify canonical architecture.
- Keep: monorepo, shared-core, shared-protocol, server-authoritative rooms, PostgreSQL/Drizzle direction, docs/tests/deploy.
- Verify before trusting: WebSocket auth, client-server commit wiring, advanced feature implementation.
- Source: S1, S2

## Slide 5 - vNext Architecture
Purpose: Show target structure.
- `apps/client-web`
- `apps/server-api`
- `packages/shared-core`
- `packages/shared-protocol`
- `docs`
- `tests`
- Source: S1

## Slide 6 - First Proof
Purpose: Define the smallest real success.
- One client draws a stroke.
- Server validates, sequences, persists.
- Second client receives and renders identical object.
- Source: S1

## Slide 7 - Security Spine
Purpose: Prevent repeating old flaws.
- Default deny.
- Signed board tokens.
- Role checked per operation.
- No provider secrets in browser.
- Source: S1

## Slide 8 - Milestone Plan
Purpose: Convert design into execution.
- M0 monorepo + protocol.
- M1 auth + boards + WebSocket.
- M2 drawing sync.
- M3 templates/shapes/text/presence.
- M4 checkpoints/export/tests.
- Source: S1

## Slide 9 - Codex Job
Purpose: Tell the implementer what to do.
- Read `CODEX_IMPLEMENTATION_PROMPT.md`.
- Use package specs as source of truth.
- Inspect old repos only as references.
- Do not mutate old repos unless explicitly instructed.
- Source: S1
