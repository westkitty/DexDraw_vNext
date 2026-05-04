# Security Specification

## Security posture

DexDraw vNext must be private-by-default and safe for self-hosting.

## Non-negotiables

1. No provider API keys in the browser bundle.
2. No unknown user defaults to edit.
3. WebSocket join must verify token before durable operations.
4. Every durable operation must pass role authorization.
5. Production must fail startup if using default development secrets.
6. Payload and rate limits must be enforced.
7. Logs must not dump board content by default.

## Role matrix

| Role | View board | Send cursor | Draw objects | Add comments/notes | Manage board | Export |
|---|---:|---:|---:|---:|---:|---:|
| owner | yes | yes | yes | yes | yes | yes |
| edit | yes | yes | yes | yes | no | yes |
| comment | yes | yes | no | yes | no | maybe |
| view | yes | yes | no | no | no | maybe |
| unknown | no | no | no | no | no | no |

## Token model

Use signed tokens for board access. Token should include:

- subject/user id or anonymous session id
- board id
- role
- expiration
- issuer
- token version

Never let role inside token override a stricter database membership record if such record exists.

## Server validation sequence

1. Parse JSON.
2. Check message size.
3. Validate envelope schema.
4. Verify authenticated connection.
5. Check rate limit.
6. Check role permission.
7. Validate operation payload schema.
8. Apply/persist/broadcast.

## Threats

- Unauthorized board edits.
- Replay or duplicate operation spam.
- Large payload denial of service.
- Browser secret exposure.
- Overly permissive CORS.
- Accidentally logging sensitive meeting text.

## Required tests

- unknown user cannot join as edit
- view user cannot create object
- comment user cannot draw object
- malformed op rejected
- oversized op rejected
- default production secret fails startup
