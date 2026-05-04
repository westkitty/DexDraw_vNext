# DexDraw vNext Design Handoff

This package is an implementation-ready design handoff for rebuilding DexDraw as a clean vNext tool.

It does **not** claim to be the compiled working app. It is the complete design pack and Codex handoff package that tells Codex how to assemble the working tool.

## Bottom line

DexDraw vNext should use Repository B (`westkitty/dexDraw`) as the architectural parent and Repository A (`westkitty/https-github.com-westkitty-DexDraw_Redux`) only as a UX/reference source. The rule is simple:

```text
B's bones. A's usable muscle. Neither repo's bad habits.
```

## Included

- `CODEX_IMPLEMENTATION_PROMPT.md`: the primary prompt to give Codex.
- `executive-brief.md`: decision-level summary.
- `research-artifact-source.md`: machine-optimized source of truth.
- `citation-map.md`: claim-to-source map.
- `docs/`: architecture, UX, security, implementation, testing, migration, and acceptance specs.
- `specs/`: JSON/YAML/CSV structured implementation specs.
- `scaffold/`: starter monorepo shape for Codex to use as a construction target.
- `DexDraw_vNext_Bible.md`: local project ledger for successor agents.
- `source/`: copied source audit record when available.

## Non-goals

- Do not merge Repository A into Repository B wholesale.
- Do not preserve Repository A's ad hoc WebSocket protocol.
- Do not preserve default-everyone-edit behavior.
- Do not expose Gemini or other provider keys to the browser.
- Do not treat docs/scaffolds in old repos as proof that features are implemented.

## Source grounding

- S1: Uploaded DexDraw Repository Comparison Master Record, 2026-05-04 conversation artifact.
- S2: GitHub metadata for westkitty/dexDraw verified during package generation; public repo, default branch main, size 5036, permissions available to user.
- S3: GitHub metadata for westkitty/https-github.com-westkitty-DexDraw_Redux verified during package generation; public repo, default branch main, size 1981, permissions available to user.
