# Test Plan

## Test philosophy

Realtime collaboration breaks in integration, not in beautiful architecture diagrams. The test plan must prove the durable loop first.

## Unit tests

### shared-core

- stroke normalization is deterministic
- bounds calculation works for all object types
- hit testing works for stroke/rect/ellipse/text
- transforms round trip correctly

### shared-protocol

- valid object create ops pass
- invalid payloads fail
- durable and ephemeral envelopes are separated
- error envelope schema works

### server-api

- board creation works
- token issue/verify works
- unknown token rejected
- role permissions enforced
- duplicate client op deduped
- invalid JSON does not crash server
- oversized payload rejected
- snapshot/replay works

### client-web

- store applies canonical ops
- optimistic op reconciles to canonical op
- toolbar role disabled states work
- export menu appears only when allowed

## Integration tests

- create board then connect WebSocket
- send stroke op, persist, replay
- view role rejected on draw
- comment role only allowed comment/note ops if enabled
- reconnect with last known sequence receives missed ops

## End-to-end tests

### E2E-001: two-client stroke sync

1. Start app stack.
2. Create board.
3. Open board in browser A and browser B.
4. Browser A draws one stroke.
5. Browser B sees the stroke.
6. Reload browser B.
7. Browser B still sees stroke.

### E2E-002: role enforcement

1. Join as view.
2. Try to draw.
3. UI disables draw tools.
4. Server rejects any forged draw op.

### E2E-003: export smoke

1. Draw stroke and shape.
2. Export PNG.
3. File is produced and non-empty.

## CI gates

- install
- lint
- typecheck
- unit tests
- build
- E2E smoke test
