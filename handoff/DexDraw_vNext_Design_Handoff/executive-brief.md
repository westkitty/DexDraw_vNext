# Executive Brief: DexDraw vNext

## Bottom line

Build DexDraw vNext as a clean monorepo implementation based on Repository B's architecture, using Repository A only as a feature-reference source for simple user entry, templates, shapes, text, laser pointer, cursors, and screenshot-style exports. This is supported by the audit conclusion that Repository B is canonical while Repository A is best treated as an AI Studio / Lite adapter and UX reference. Sources: S1, S2, S3.

## Key findings

1. **Repository B is the canonical base.** It has the stronger architecture: monorepo layout, shared core, shared protocol, server API, PostgreSQL/Drizzle direction, tests, docs, and deployment framing. Sources: S1, S2.
2. **Repository A has useful UX instincts but unsafe foundations.** The useful parts are simple board create/join flow, template picker, visible tools, cursors, and PNG/PDF export proof-of-concept. Its bad parts are ad hoc protocol, weak/no auth, monolithic files, possible client key exposure, and duplicate vendored lineage. Sources: S1, S3.
3. **The rebuild should start from lessons, not code salvage.** A direct merge would import confusing assumptions. A clean vNext design reduces risk and makes Codex implementation more reliable. Source: S1.
4. **First proof must be two-client drawing sync.** Nothing else matters until one client draws a stroke, the server validates/persists/sequences it, and a second client receives the same canonical object. Source: S1.
5. **Security must be default-deny.** Unknown clients must never default to edit permissions; tokens and board roles must be resolved before durable operations are accepted. Source: S1.

## Recommended implementation sequence

1. Scaffold monorepo.
2. Implement shared schema/protocol packages.
3. Implement server auth, board creation, operation log, WebSocket sequencing.
4. Implement minimal client create/join + canvas drawing.
5. Prove two-client stroke sync with an automated test.
6. Add templates, shapes, text, cursors, laser, comments, checkpoints, exports.
7. Convert acceptance checklist into automated tests.

## Risks

- Treating Repository B's documented/scaffolded features as fully implemented without verification.
- Accidentally porting Repository A's ad hoc protocol or security model.
- Adding tools before the durable op loop is proven.
- Implementing UI without accessibility and keyboard recovery states.

## Open questions

- Should vNext live in `westkitty/dexDraw` on a new branch, or in a new repo first?
- Should the Lite / AI Studio adapter remain a separate project after vNext stabilizes?
- Which exports are minimum viable: PNG only, PDF screenshot, Markdown, or all three?
