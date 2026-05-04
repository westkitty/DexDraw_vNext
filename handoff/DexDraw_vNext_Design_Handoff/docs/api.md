# API Specification

See also `specs/api-routes.yaml`.

## REST routes

### `GET /health`

Returns service health.

### `GET /api/templates`

Returns available board templates.

### `POST /api/boards`

Creates a board.

Request:

```json
{
  "title": "Planning Board",
  "templateId": "blank"
}
```

Response:

```json
{
  "boardId": "uuid",
  "joinToken": "signed-token",
  "role": "owner"
}
```

### `POST /api/boards/:boardId/join`

Issues a token for an allowed join flow. In MVP this can be a local invite token flow; in production this must be hardened.

### `GET /api/boards/:boardId/snapshot`

Returns latest snapshot and sequence for authorized users.

### `POST /api/boards/:boardId/export/markdown`

Returns Markdown export if implemented.

## WebSocket route

### `/ws/boards/:boardId`

Requires token in query parameter or first message. Server must authenticate before accepting durable operations.
