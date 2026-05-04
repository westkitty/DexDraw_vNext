# Migration Plan From Existing Repositories

## Repository B to vNext

Use as architecture reference:

- monorepo layout
- shared-core concept
- shared-protocol concept
- Fastify server direction
- PostgreSQL/Drizzle operation log direction
- auth/role utilities concept
- tests/docs/deployment direction

Verify before preserving:

- WebSocket auth enforcement
- client stroke networking
- shape/text/comment/timeline behavior
- long-poll fallback
- export implementations
- checkpoint UI

## Repository A to vNext

Use as UX reference:

- home create/join flow
- template picker
- rectangle/ellipse behavior
- text placement behavior
- laser pointer behavior
- cursor overlay
- PNG/PDF export idea

Reject:

- ad hoc protocol
- local-only undo as product truth
- default edit role for everyone
- client-exposed provider keys
- monolithic Board component and server file
- vendored `dexDraw_old/` as active architecture source

## Migration rules

1. Do not copy files blindly.
2. Rebuild behavior inside vNext modules.
3. Add tests per feature.
4. Mark features planned until tested.
5. Keep one source of truth for protocol and core object schema.
