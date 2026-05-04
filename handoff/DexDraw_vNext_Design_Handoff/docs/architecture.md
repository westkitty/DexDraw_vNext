# Architecture Specification

## System shape

```text
apps/client-web        React + Vite app
apps/server-api        Fastify + WebSocket API
packages/shared-core   deterministic math, geometry, ink, object helpers
packages/shared-protocol Zod schemas and typed wire protocol
docs                   architecture, API, UX, security, test docs
tests                  cross-package integration and E2E tests
```

## Architectural principles

1. Shared packages define truth.
2. Server is authoritative for durable board state.
3. Clients may optimistically render but must reconcile to server sequence.
4. Presence is ephemeral; board objects are durable.
5. Auth and role checks happen before durable mutation.
6. Documentation is not proof; tests are proof.

## Runtime data flow

1. Client loads board route.
2. Client obtains or presents board access token.
3. Client opens WebSocket.
4. Server verifies token and resolves role.
5. Client sends join envelope with last known sequence.
6. Server replies with snapshot/replay.
7. Client draws locally.
8. Client sends durable operation envelope.
9. Server validates schema, role, limits, and sequence fields.
10. Server assigns `serverSeq` and persists op.
11. Server broadcasts canonical operation.
12. Clients apply canonical operation and update local state.

## Package boundaries

### `packages/shared-core`

No browser or server framework imports. Pure TypeScript only.

Responsibilities:

- points
- bounds
- transforms
- stroke normalization
- hit testing
- object z-order
- export geometry helpers

### `packages/shared-protocol`

No database or UI imports.

Responsibilities:

- operation types
- object schemas
- envelope schemas
- error schemas
- board create/join schemas
- token payload types if safe to share

### `apps/server-api`

Responsibilities:

- environment loading
- database connection
- auth/token verification
- board and member routes
- WebSocket rooms
- operation persistence
- replay/snapshots/checkpoints
- rate/payload limits

### `apps/client-web`

Responsibilities:

- app shell
- board home flow
- canvas rendering
- input tools
- WebSocket client
- local optimistic state
- presence UI
- export UI

## Anti-patterns forbidden

- One giant `Board.tsx` owning networking/rendering/history/export/tools.
- One giant `server.ts` owning DB/API/WebSocket/Vite/config.
- `any` protocol payloads.
- Browser-exposed provider secrets.
- Unknown user defaulting to edit.
- Durable laser/cursor objects.
