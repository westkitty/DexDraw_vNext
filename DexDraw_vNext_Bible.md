# DexDraw vNext Project Bible

## Bootstrap Prompt for Successor AI

```text
Read `DexDraw_vNext_Bible.md` first and treat it as the authoritative project state record for this handoff package. Then inspect the repository or generated package itself to verify the current state, file layout, and implementation details. If repository work exists that is missing from the bible, append a reconciliation entry to `DexDraw_vNext_Bible.md` instead of rewriting prior history. Continue the project from the current state, and after each meaningful completed work unit, append a new additive ledger entry recording files changed, commands run, command intent, outputs, decisions, bugs, corrections, resulting state, and next steps. Never delete or rewrite older entries.
```

## Project Goal

- Primary objective: Create a complete DexDraw vNext design and Codex handoff package.
- Success criteria: Package contains implementation specs, structured data, local scaffold, tests/acceptance plan, and a Codex prompt.

## Scope

- Included: design package, architecture, UX, security, protocol, data model, testing, migration, Codex prompt.
- Excluded: compiling the actual app in this chat; mutating old repositories.

## Constraints

- Technical constraints: Use B-style architecture and A only as selective UX reference.
- Tooling constraints: Generated as local files and zipped.
- Delivery constraints: Must be downloadable and usable by Codex.

## Assumptions

- DexDraw vNext will use TypeScript, pnpm, React/Vite, Fastify, PostgreSQL/Drizzle, Zod, Vitest, and Playwright unless repo reality forces changes.

## Architecture / Design

- System shape: monorepo with client, server, shared-core, shared-protocol, docs, tests.
- Key components: board entry, canvas, tool palette, presence, WebSocket rooms, operation log, role enforcement.
- Important patterns: server-authoritative durable ops; ephemeral presence; default-deny auth; shared schemas.

## File Map

- `README.md`: package overview.
- `CODEX_IMPLEMENTATION_PROMPT.md`: main prompt for Codex.
- `docs/`: human-readable design specs.
- `specs/`: structured implementation specs.
- `scaffold/`: starter monorepo shape.
- `source/`: copied source audit record if available.

## Current State Summary

- Project status: design handoff package generated.
- What already exists: full artifact pack and Codex prompt.
- What is missing: actual implemented/compiled app; must be built by Codex from this package.

## Open Questions

- Should vNext be implemented in `westkitty/dexDraw`, a branch, or a new repo?
- Which export formats are MVP?
- Should Lite/AI Studio adapter remain separate?

## Chronological Ledger

### Entry 1 - Design handoff package generated

Summary:
- Created the DexDraw vNext design package.

Reason / Intent:
- User asked to design the elements of the rebuilt project and provide a zip plus Codex prompt.

Files Changed:
- Entire generated package under `DexDraw_vNext_Design_Handoff/`.

Commands Run:
```text
python create_dexdraw_vnext_pack.py
python /home/oai/skills/deep-research-to-artifact-pipeline/scripts/validate_artifact_pack.py /mnt/data/DexDraw_vNext_Design_Handoff --machine-md research-artifact-source.md
zip -r DexDraw_vNext_Design_Handoff.zip DexDraw_vNext_Design_Handoff
```

Command Intent:
- Generate files, validate artifact pack, and zip output.

Outputs Generated:
- `DexDraw_vNext_Design_Handoff.zip`

Decisions:
- B architecture is canonical.
- A is UX/reference only.
- First proof is two-client stroke sync.
- Default-deny security is mandatory.

Bugs / Blockers:
- Live GitHub code search timed out once; package uses uploaded master comparison plus verified repo metadata instead.

Correction:
- Prior attempt incorrectly prioritized GitHub Bible persistence before artifact generation. This package corrects that by producing local deliverables first.

State After Completion:
- Handoff package is ready for Codex implementation.

Next Step / Handoff:
- Give `CODEX_IMPLEMENTATION_PROMPT.md` and the zip to Codex.


### Entry 2 - Validation warning repaired

Summary:
- Repaired the machine-optimized Markdown heading so the artifact validator recognizes the source registry section.

Reason / Intent:
- Remove the validator warning and make the handoff package cleaner for downstream agents.

Files Changed:
- `research-artifact-source.md`
- `quality-score.md`
- `DexDraw_vNext_Bible.md`

Commands Run:
```text
python /home/oai/skills/deep-research-to-artifact-pipeline/scripts/validate_artifact_pack.py /mnt/data/DexDraw_vNext_Design_Handoff --machine-md research-artifact-source.md
zip -r DexDraw_vNext_Design_Handoff.zip DexDraw_vNext_Design_Handoff
```

Command Intent:
- Confirm artifact-pack validation and rebuild the zip.

Outputs Generated:
- Updated `DexDraw_vNext_Design_Handoff.zip`.

Decisions:
- Keep `research-artifact-source.md` as the canonical machine-optimized file.

Bugs / Blockers:
- Initial validation pass had one non-blocking warning: expected machine-optimized section `source registry` missing or renamed.

Correction:
- Renamed the source section to `Source Registry / Source Inventory`.

State After Completion:
- Package validates cleanly.

Next Step / Handoff:
- Give the zip and Codex prompt to Codex for implementation.


### Entry 3 - Local implementation workspace initialized

Summary:
- Began the actual vNext implementation in this workspace using the handoff package as the governing contract.

Reason / Intent:
- User instructed that implementation must start by reading the handoff package, then inspecting Repository B and Repository A before writing code.

Files Changed:
- `DexDraw_vNext_Bible.md`
- Root scaffold/bootstrap files copied into the workspace:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `apps/`
  - `packages/`
- Root tooling/config added:
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `biome.json`
  - `.gitignore`
- Package manifests/config added:
  - `apps/client-web/package.json`
  - `apps/client-web/tsconfig.json`
  - `apps/client-web/vite.config.ts`
  - `apps/client-web/index.html`
  - `apps/server-api/package.json`
  - `apps/server-api/tsconfig.json`
  - `packages/shared-core/package.json`
  - `packages/shared-core/tsconfig.json`
  - `packages/shared-protocol/package.json`
  - `packages/shared-protocol/tsconfig.json`

Commands Run:
```text
unzip -o DexDraw_vNext_Design_Handoff.zip -d handoff
sed -n '1,260p' CODEX_IMPLEMENTATION_PROMPT.md
sed -n '1,220p' handoff/DexDraw_vNext_Design_Handoff/README.md
sed -n '1,220p' handoff/DexDraw_vNext_Design_Handoff/research-artifact-source.md
sed -n '1,220p' handoff/DexDraw_vNext_Design_Handoff/citation-map.md
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/docs/product-requirements.md
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/docs/architecture.md
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/docs/protocol.md
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/docs/security.md
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/docs/test-plan.md
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/specs/package-structure.json
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/specs/board-object-schema.json
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/specs/operation-protocol.json
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/specs/api-routes.yaml
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/specs/implementation-backlog.csv
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/docs/implementation-plan.md
sed -n '1,260p' handoff/DexDraw_vNext_Design_Handoff/docs/acceptance-checklist.md
git clone --depth 1 https://github.com/westkitty/dexDraw refs/repo-b
git clone --depth 1 https://github.com/westkitty/https-github.com-westkitty-DexDraw_Redux refs/repo-a
sed -n '1,240p' refs/repo-b/README.md
sed -n '1,260p' refs/repo-b/package.json
sed -n '1,260p' refs/repo-b/apps/server-api/src/routes/ws.ts
sed -n '1,260p' refs/repo-b/apps/server-api/src/routes/boards.ts
sed -n '1,260p' refs/repo-b/packages/shared-protocol/src/schemas/op.ts
sed -n '1,260p' refs/repo-b/packages/shared-core/src/stroke/normalizeStroke.ts
sed -n '1,260p' refs/repo-b/apps/server-api/src/auth/token.ts
sed -n '1,260p' refs/repo-b/apps/server-api/src/auth/roles.ts
sed -n '1,260p' refs/repo-b/apps/server-api/src/app.ts
sed -n '1,260p' refs/repo-b/apps/server-api/src/__tests__/roles.test.ts
sed -n '1,260p' refs/repo-b/apps/client-web/e2e/board.spec.ts
sed -n '1,220p' refs/repo-a/README.md
sed -n '1,260p' refs/repo-a/package.json
sed -n '1,260p' refs/repo-a/server.ts
sed -n '1,260p' refs/repo-a/src/App.tsx
sed -n '1,320p' refs/repo-a/src/components/Board.tsx
sed -n '1,260p' refs/repo-a/src/lib/socket.ts
mkdir -p apps packages tests docs
cp -R handoff/DexDraw_vNext_Design_Handoff/scaffold/apps/. apps/
cp -R handoff/DexDraw_vNext_Design_Handoff/scaffold/packages/. packages/
cp handoff/DexDraw_vNext_Design_Handoff/scaffold/package.json .
cp handoff/DexDraw_vNext_Design_Handoff/scaffold/pnpm-workspace.yaml .
```

Command Intent:
- Verify the handoff package, inspect both reference repositories in the required order, and seed a clean workspace scaffold before implementation.

Outputs Generated:
- Root implementation workspace with monorepo structure.
- Local reference clones in `refs/repo-b` and `refs/repo-a`.
- Root-level working bible `DexDraw_vNext_Bible.md`.

Decisions:
- Repository B remains the architecture reference only, not a source to merge.
- Repository A remains a UX behavior reference only, not a source to port structurally.
- Repo B confirms the desired monorepo/package split and some reusable protocol/core ideas.
- Repo B also confirms the warning from the handoff package: its current WebSocket route is not sufficient as-is for token-enforced default-deny auth.
- Repo A confirms the desired create/join/template/canvas UX direction and also confirms the anti-patterns to avoid: monolithic client/server, ad hoc WebSocket messages, permissive default edit, and SQLite-first storage.
- The implementation will keep B’s package boundaries and typed/server-authoritative model while rebuilding the first user flow from A in smaller modules.
- Because no PostgreSQL server is provisioned in this workspace, the first implementation pass will keep Drizzle-based persistence with a local embedded Postgres-compatible store so the two-client proof can be executed end-to-end without inventing a different architecture.

Bugs / Blockers:
- No blocker yet, but the workspace started effectively empty and required scaffold promotion before feature work.
- The handoff package expects PostgreSQL/Drizzle semantics while the current local environment does not yet provide a running PostgreSQL service.

Correction:
- Created a root-level live bible immediately so future agents can resume from the actual implementation workspace instead of only from the packaged handoff copy.

State After Completion:
- The workspace now contains the seeded monorepo structure and root implementation record.
- Next implementation step is to write failing tests for shared protocol/core and then implement the P0 proof path test-first.

Next Step / Handoff:
- Implement the shared protocol and shared core packages with tests, then build the authoritative server/client stroke loop and verify it with real commands.


### Entry 4 - Two-client collaborative proof implemented and verified

Summary:
- Implemented the first working DexDraw vNext proof milestone end-to-end: create board, join from a second client, draw one stroke, persist it server-side, broadcast it, and reload the second client with the stroke restored.

Reason / Intent:
- The handoff package and implementation prompt explicitly state that nothing outranks the two-client persisted stroke proof. This entry records the implementation of that required proof.

Files Changed:
- Root tooling and verification:
  - `biome.json`
  - `playwright.config.ts`
- Shared packages:
  - `packages/shared-core/src/index.ts`
  - `packages/shared-core/src/__tests__/index.test.ts`
  - `packages/shared-protocol/src/index.ts`
  - `packages/shared-protocol/src/__tests__/index.test.ts`
  - `packages/shared-core/tsconfig.json`
  - `packages/shared-protocol/tsconfig.json`
- Server application:
  - `apps/server-api/src/index.ts`
  - `apps/server-api/src/app.ts`
  - `apps/server-api/src/auth/token.ts`
  - `apps/server-api/src/auth/roles.ts`
  - `apps/server-api/src/db/schema.ts`
  - `apps/server-api/src/db/store.ts`
  - `apps/server-api/src/__tests__/server.test.ts`
  - `apps/server-api/tsconfig.json`
- Client application:
  - `apps/client-web/src/App.tsx`
  - `apps/client-web/src/main.tsx`
  - `apps/client-web/src/styles.css`
  - `apps/client-web/src/lib/session.ts`
  - `apps/client-web/src/lib/api.ts`
  - `apps/client-web/src/lib/boardState.ts`
  - `apps/client-web/src/components/HomePage.tsx`
  - `apps/client-web/src/components/BoardPage.tsx`
  - `apps/client-web/src/components/BoardCanvas.tsx`
  - `apps/client-web/src/components/Toolbar.tsx`
  - `apps/client-web/src/__tests__/boardState.test.ts`
  - `apps/client-web/tsconfig.json`
  - `apps/client-web/vite.config.ts`
  - `apps/client-web/index.html`
- Root TypeScript config:
  - `tsconfig.base.json`

Commands Run:
```text
pnpm install
pnpm --filter @dexdraw/shared-core test
pnpm --filter @dexdraw/shared-protocol test
pnpm --filter @dexdraw/server-api test
pnpm --filter @dexdraw/client-web test
pnpm --filter @dexdraw/client-web typecheck
pnpm --filter @dexdraw/server-api typecheck
pnpm test:e2e
pnpm typecheck
pnpm build
pnpm test
pnpm format
pnpm exec biome check --write .
pnpm lint
```

Command Intent:
- Install dependencies, drive shared package and server implementation with failing tests first, prove the two-client collaborative flow with Playwright, and then verify workspace-level typecheck/build/test/lint gates.

Outputs Generated:
- Working vNext client/server implementation in the current workspace.
- Passing end-to-end proof test:
  - `tests/e2e/two-client-sync.spec.ts`
- Production client build output under `apps/client-web/dist/`.

Decisions:
- Implemented persistence with Drizzle ORM over embedded `PGlite` to stay aligned with PostgreSQL/Drizzle semantics in a local self-contained environment without requiring an externally provisioned PostgreSQL server.
- Preserved the architecture rule from the handoff package:
  - shared-core owns deterministic point/stroke helpers
  - shared-protocol owns typed schemas and envelope validation
  - server is authoritative for durable board state
  - client uses Repo A-style simple create/join/draw flow in smaller B-style modules
- Token validation happens before durable WebSocket mutation.
- Unknown users do not receive edit access implicitly; joining requires board ID plus share code and issues a signed role token.
- The first durable operation implemented is `object.create` for strokes, which is enough to satisfy the first acceptance proof before advancing to richer tools.

Bugs / Blockers:
- Initial client drawing implementation stored in-progress stroke points only in React state, which caused pointer-move events to race stale render state during Playwright interaction. Fixed by tracking the active stroke in a ref and mirroring it to state for rendering.
- Initial lint pass failed because the workspace included cloned reference repositories and generated test artifacts. Fixed by scoping Biome away from `refs/`, `handoff/`, build artifacts, and Playwright output.
- Server tests are slower than ideal because embedded database startup is non-trivial. Timeouts were increased only where needed; behavior was still verified with real commands.

Correction:
- The earlier scaffold-only state is now superseded by real implementation and proof. The workspace is no longer just a handoff shell.

State After Completion:
- `pnpm typecheck` passes.
- `pnpm build` passes.
- `pnpm test` passes.
- `pnpm test:e2e` passes.
- `pnpm lint` passes.
- The required proof path works:
  1. Create a board.
  2. Open a second browser client and join with board ID + share code.
  3. Draw one stroke in client A.
  4. See the same stroke in client B.
  5. Reload client B.
  6. See the persisted stroke restored.

Known Gaps:
- Advanced post-proof milestones are still pending:
  - shape tools beyond template rendering
  - text/note editing flow
  - presence cursor/laser UI
  - PNG/PDF/Markdown export
  - checkpoints and restore
  - reconnect/replay beyond initial snapshot-on-connect behavior

Next Step / Handoff:
- Continue milestone expansion after the verified proof baseline:
  1. add rectangle/ellipse/text/note durable tools
  2. add presence cursor/laser overlays
  3. add PNG export smoke path
  4. add checkpoints/recovery and richer replay behavior


### Entry 5 - Product tools, presence, and PNG export added

Summary:
- Extended the post-proof baseline with the next useful milestone tranche:
  - rectangle, ellipse, text, and note tools
  - remote cursor and laser presence overlays
  - PNG export
  - browser tests covering the new surface

Reason / Intent:
- User asked to continue building and to keep the Bible current. This work advances Milestone 4 and the PNG part of Milestone 5 from the handoff package while preserving the already-verified collaborative drawing proof.

Files Changed:
- Client UI and behavior:
  - `apps/client-web/src/components/Toolbar.tsx`
  - `apps/client-web/src/components/BoardCanvas.tsx`
  - `apps/client-web/src/components/BoardPage.tsx`
  - `apps/client-web/src/styles.css`
  - `apps/client-web/src/lib/export.ts`
  - `apps/client-web/src/lib/presence.ts`
- Client tests:
  - `apps/client-web/src/__tests__/presence.test.ts`
  - `tests/e2e/two-client-sync.spec.ts`
- Shared protocol:
  - `packages/shared-protocol/src/index.ts`

Commands Run:
```text
pnpm --filter @dexdraw/client-web test
pnpm --filter @dexdraw/client-web typecheck
pnpm test:e2e
pnpm --filter @dexdraw/shared-protocol test
pnpm typecheck
pnpm test
pnpm format
pnpm lint
pnpm build
```

Command Intent:
- Add the next product-facing features, verify client-only behavior, then re-run the workspace gates and browser acceptance suite.

Outputs Generated:
- Additional passing browser acceptance coverage:
  - rectangle + text durable object creation
  - remote cursor/laser presence rendering
  - PNG export smoke path

Decisions:
- Kept the interaction model simple and additive:
  - `Pen` remains the default durable drawing tool
  - `Rectangle` and `Ellipse` use drag-to-place
  - `Text` and `Note` create default seeded objects on click
  - `Laser` is ephemeral presence only and never creates durable board objects
- Presence is still ephemeral and client-maintained; no board-state persistence was added for cursors or laser, which matches the handoff rules.
- PNG export is implemented from the client’s SVG render surface to avoid inventing a separate server export pipeline before the basic smoke path exists.

Bugs / Blockers:
- Initial shape implementation used a single union-typed `object` branch that annoyed TypeScript when checking rectangle vs ellipse properties. Fixed by splitting the rectangle and ellipse creation paths explicitly.
- Playwright runs produce non-fatal Vite WebSocket proxy `EPIPE` warnings during browser/page teardown. The tests still passed; this appears to be a cleanup timing issue rather than a feature failure.

Correction:
- The earlier baseline only supported pen/stroke authoring. This entry extends the actual usable whiteboard surface rather than leaving the board as a pen-only proof.

State After Completion:
- `pnpm test:e2e` passes with three browser tests:
  1. two-client persisted stroke sync
  2. rectangle and text durable object creation
  3. remote presence and PNG export smoke
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm lint` passes.
- `pnpm build` passes.

Known Gaps:
- Notes and text are still seeded with default content instead of inline editing.
- Undo/redo is still absent from the vNext implementation even though the handoff mentions accurate disabled states.
- Export is currently PNG-only; Markdown/PDF are still pending.
- Checkpoints, checkpoint restore, and richer reconnect/replay behavior are still pending.

Next Step / Handoff:
- Continue with the next hardening and product tranche:
  1. inline editing for text/note objects
  2. durable update/delete operations plus selection
  3. undo/redo
  4. checkpoints and restore
  5. Markdown/PDF export


### Entry 6 - Git initialized, committed, and pushed

Summary:
- Initialized Git in the workspace, created the first repository commit, created a new private GitHub repository, and pushed `main`.

Reason / Intent:
- User explicitly requested stage, commit, push, and Git initialization.

Files Changed:
- `DexDraw_vNext_Bible.md`
- `.gitignore`

Commands Run:
```text
git init
git branch -m main
git add -A -- .
git rm -r --cached --ignore-unmatch -- ':(glob)**/.dexdraw-data/**' ':(glob)**/*.tsbuildinfo'
git commit -m "feat: build DexDraw vNext proof and tooling baseline"
gh repo create westkitty/DexDraw_vNext --private --source=. --remote=origin --push
```

Command Intent:
- Initialize source control, ensure generated database/build artifacts are excluded from the initial history, create the first commit, and push the project to a new remote.

Outputs Generated:
- Local Git repository in this workspace.
- Initial commit:
  - `f2450d0` `feat: build DexDraw vNext proof and tooling baseline`
- New private GitHub repository:
  - [westkitty/DexDraw_vNext](https://github.com/westkitty/DexDraw_vNext)

Decisions:
- Created a new private repository instead of pushing into `westkitty/dexDraw` or either Redux reference repository. That avoids contaminating the historical/reference repos with vNext’s separate history.
- Added ignore coverage for:
  - `refs`
  - embedded `.dexdraw-data`
  - `*.tsbuildinfo`

Bugs / Blockers:
- Running Git mutations in parallel produced stale `index.lock` conflicts. Resolved by switching back to sequential Git operations.
- The first staging pass accidentally captured generated `PGlite` files and TypeScript build metadata before the ignore rules were tightened. These were removed from the index before committing.

State After Completion:
- Branch: `main`
- Remote: `origin`
- Push target is configured and tracking:
  - `origin/main`

Next Step / Handoff:
- Continue implementation from the pushed `main` branch in `westkitty/DexDraw_vNext`.


### Entry 7 - Inline editing, selection, delete, and undo/redo added

Summary:
- Implemented inline text and note editing via double-click (floating textarea overlay positioned using SVG-to-screen coordinate transform).
- Added a Select tool with hit-testing for all object types (stroke, rectangle, ellipse, text, note).
- Added durable `object.delete` triggered by the Delete/Backspace key when an object is selected.
- Added a client-side undo/redo stack covering `object.create`, `object.update`, and `object.delete` operations. Undo/Redo buttons show accurate disabled state.
- Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y / Ctrl+Shift+Z redo.
- Selection ring rendered in SVG around the selected object.
- While inline editor is open, the SVG text is hidden so the overlay appears to replace it cleanly.

Reason / Intent:
- "Inline editing for text/note objects" was the top remaining priority per Entry 5 Known Gaps. This tranche also closes "durable update/delete" and "undo/redo".

Files Changed:
- New files:
  - `apps/client-web/src/lib/hitTest.ts`
  - `apps/client-web/src/components/InlineEditor.tsx`
  - `apps/client-web/src/__tests__/hitTest.test.ts`
  - `tests/e2e/inline-edit.spec.ts`
  - `tests/e2e/selection-undo.spec.ts`
- Modified files:
  - `apps/client-web/src/components/BoardCanvas.tsx`
  - `apps/client-web/src/components/BoardPage.tsx`
  - `apps/client-web/src/components/Toolbar.tsx`
  - `apps/client-web/src/__tests__/boardState.test.ts`

Commands Run:
```text
pnpm --filter @dexdraw/client-web test
pnpm --filter @dexdraw/client-web typecheck
pnpm exec biome check --write .
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Command Intent:
- TDD: wrote failing unit tests and e2e tests before feature code, then implemented to make them pass.
- Biome auto-fix applied after initial implementation, then manual fixes for non-null assertions and exhaustive-deps.
- Workspace-level gates verified after all fixes.

Outputs Generated:
- 17 unit tests passing (up from 6).
- 10 e2e tests passing (up from 3).
- Production client bundle at `apps/client-web/dist/`.

Decisions:
- InlineEditor uses a `position: absolute` HTML `<textarea>` overlaid on the `.board-stage` (already `position: relative`). SVG coordinates are transformed to screen space using `getBoundingClientRect()` and the 1600×900 viewBox scale.
- Text objects commit on Enter (single-line); note objects commit on Ctrl+Enter (multi-line) or blur.
- Escape cancels without sending an op.
- The SVG text element renders `null` for its text content while `editingObjectId` matches, so the floating textarea appears to replace the SVG element cleanly.
- Hit testing lives in a dedicated `hitTest.ts` module with accurate geometry for each object type (AABB for rect/note, ellipse formula, segment-distance ≤ 10 SVG units for strokes, approximate bounding box for text).
- `sendObjectDelete`, `handleUndo`, `handleRedo` are plain (unmemoized) functions; the keyboard `useEffect` uses a `// biome-ignore` for `useExhaustiveDependencies` because the key state they depend on (selectedObjectId, role) is already in the deps array, preventing stale closure bugs while avoiding infinite re-registration.
- Undo/redo stack entries carry enough data for full inverse ops: `{ kind: "create", object }`, `{ kind: "update", id, prev, next }`, `{ kind: "delete", object }`.
- Each `sendObjectCreate/Update/Delete` resets the redo stack, matching standard undo semantics.

Bugs / Blockers:
- Non-null assertions (`start!`, `end!`) on the shape drawing destructure flagged by Biome. Fixed by using indexed access with an early-return guard.
- `useCallback` on `sendObjectUpdate` and `sendObjectDelete` triggered cascading `useExhaustiveDependencies` errors because their transitive deps (`sendRaw`, `pushUndo`) were themselves non-memoized. Fixed by converting to plain functions.
- Import sort order in `hitTest.test.ts` flagged by Biome (type imports should come first). Fixed by `biome check --write`.
- Vite WebSocket proxy `EPIPE` warnings during test teardown (same as Entry 5 — non-fatal, tests still passed).

Correction:
- None from prior entries; this is forward-only new feature work.

State After Completion:
- `pnpm lint` passes (0 errors).
- `pnpm typecheck` passes (all 4 packages).
- `pnpm test` passes (17 unit tests, up from 6).
- `pnpm build` passes.
- `pnpm test:e2e` passes (10 browser tests, up from 3):
  - two-client persisted stroke sync (existing)
  - rectangle and text tools create durable objects (existing)
  - presence and PNG export smoke (existing)
  - inline text editing commits and persists (new)
  - inline note editing commits and persists (new)
  - Escape cancels inline editing (new)
  - Select tool + Delete key removes object (new)
  - Ctrl+Z undoes delete / Ctrl+Y redoes it (new)
  - Ctrl+Z undoes object.create (new)
  - Undo/Redo buttons show correct disabled state (new)

Known Gaps:
- Drag-to-move selected objects (defer).
- Object resize handles (defer).
- Checkpoints and restore (next priority per handoff).
- Markdown/PDF export (next priority per handoff).
- Reconnect/replay refinements (next priority per handoff).

Next Step / Handoff:
- Continue with remaining milestones:
  1. checkpoints and restore (`checkpoint.create` / `checkpoint.restore` ops)
  2. Markdown export (board objects → .md)
  3. PDF export (browser print API or canvas-to-PDF)
  4. Reconnect/replay improvements (client tracks `serverSeq` and requests missed ops on reconnect)
