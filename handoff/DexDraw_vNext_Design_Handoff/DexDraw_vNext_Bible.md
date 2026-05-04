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
