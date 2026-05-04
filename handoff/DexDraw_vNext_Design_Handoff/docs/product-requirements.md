# Product Requirements: DexDraw vNext

## Product definition

DexDraw vNext is a private, self-hostable collaborative whiteboard for meetings, planning, and structured visual collaboration.

## Target users

- Meeting facilitator: creates boards, templates, checkpoints, and exports.
- Collaborator: draws, writes, comments, and points in real time.
- Viewer: watches and exports when allowed, but cannot mutate state.
- Self-hosting operator: runs the stack locally or on a private server.

## Jobs to be done

1. Create a board quickly.
2. Join an existing board by code or link.
3. Draw freehand strokes reliably.
4. Add shapes and text.
5. See collaborator presence.
6. Point temporarily without mutating the board.
7. Recover from reconnect/reload.
8. Export useful records after a session.
9. Keep board access private.

## Minimum viable product

MVP includes:

- create board
- join board
- blank and basic templates
- pen tool
- two-client sync
- durable replay
- view/comment/edit role model
- default-deny auth
- PNG export
- automated tests for critical paths

## Post-MVP

- comments
- parking lot
- timeline/checkpoint scrubber
- Markdown export
- PDF export
- images
- offline outbox
- long-poll fallback only if fully implemented and tested

## Explicit exclusions for vNext MVP

- AI provider calls in browser.
- Public multi-tenant SaaS assumptions.
- Reusing Repository A's raw protocol.
- Treating old docs as implementation proof.
