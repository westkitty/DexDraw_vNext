# Data Model Specification

## Core entities

### Board

- `id`: UUID
- `title`: string
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `ownerUserId`: UUID or system UUID
- `templateId`: optional string
- `lastServerSeq`: integer

### BoardMember

- `boardId`: UUID
- `userId`: UUID
- `role`: `owner | edit | comment | view`
- `createdAt`: ISO timestamp

### Operation

- `id`: UUID
- `boardId`: UUID
- `clientId`: UUID
- `clientSeq`: integer
- `serverSeq`: integer
- `actorUserId`: UUID
- `opType`: string
- `payload`: JSONB
- `createdAt`: ISO timestamp

Unique constraints:

- `(boardId, serverSeq)`
- `(boardId, clientId, clientSeq)`

### Snapshot

- `id`: UUID
- `boardId`: UUID
- `serverSeq`: integer
- `state`: JSONB board state
- `createdAt`: ISO timestamp

### Checkpoint

- `id`: UUID
- `boardId`: UUID
- `snapshotId`: UUID
- `label`: string
- `createdBy`: UUID
- `createdAt`: ISO timestamp

## Board state

Canonical board state is a map of board objects by object ID.

Object ordering should be explicit via `zIndex` or order array, not implied by map iteration.

## Ephemeral state

Not persisted as board objects:

- cursor position
- laser pointer
- active user list
- transient selection of remote users
