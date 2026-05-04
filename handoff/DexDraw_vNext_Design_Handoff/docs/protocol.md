# Protocol Specification

## Message classes

### Durable envelopes

Durable envelopes change board state and must be validated, authorized, sequenced, persisted, and broadcast.

Examples:

- `object.create`
- `object.update`
- `object.delete`
- `object.reorder`
- `checkpoint.create`
- `checkpoint.restore`

### Ephemeral envelopes

Ephemeral envelopes do not mutate board state and are not persisted.

Examples:

- `presence.cursor`
- `presence.laser`
- `presence.selection`
- `client.ping`

## Join flow

1. Client opens `/ws/boards/:boardId?token=...` or sends token as first message.
2. Server validates token before accepting durable messages.
3. Server resolves role.
4. Server sends `server.welcome` with role, current sequence, and replay/snapshot info.
5. Client sends `client.ready`.

## Durable operation envelope

```json
{
  "type": "client.op",
  "boardId": "uuid",
  "clientId": "uuid",
  "clientSeq": 1,
  "opId": "uuid",
  "opType": "object.create",
  "payload": {},
  "sentAt": "iso timestamp"
}
```

## Server canonical operation

```json
{
  "type": "server.op",
  "boardId": "uuid",
  "serverSeq": 1,
  "clientId": "uuid",
  "clientSeq": 1,
  "opId": "uuid",
  "opType": "object.create",
  "payload": {},
  "createdAt": "iso timestamp"
}
```

## Error envelope

```json
{
  "type": "server.error",
  "code": "invalid_payload",
  "message": "Operation rejected.",
  "recoverable": true,
  "ref": "opId or requestId"
}
```

## Rules

- Server never trusts client role, user ID, or server sequence.
- Client sequence is for dedupe and reconciliation only.
- Server sequence is canonical.
- Invalid durable operation is rejected and never broadcast as canonical.
- Ephemeral messages may be rate limited and dropped.
