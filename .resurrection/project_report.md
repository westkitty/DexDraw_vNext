# Project Resurrection Report: DexDraw_vNext

## Identity
- Name: DexDraw_vNext
- Path: /Users/andrew/DexDraw_vNext
- Project type: node_web_app
- Confidence: 0.71
- Inferred purpose: A web or Node.js project named DexDraw vNext.
- Evidence:
  - Found package.json
  - Found playwright.config.ts

## Git State
- Summary: Repo root: /Users/andrew/DexDraw_vNext | Branch: main | Status: dirty | Remote: git@github.com:westkitty/DexDraw_vNext.git
- Latest commit: ca7c6083a70235279c9d50520996c2b4f1e3e366 fix: use semantic output for board metrics
- Tracked modified count: 0
- Untracked count: 2
- Staged count: 0

## Commands Detected
- [build] npm run build (package.json:scripts.build)
- [run/dev] npm run dev (package.json:scripts.dev)
- [unknown] npm run format (package.json:scripts.format)
- [unknown] npm run lint (package.json:scripts.lint)
- [test] npm run test (package.json:scripts.test)
- [test] npm run test:e2e (package.json:scripts.test:e2e)
- [unknown] npm run typecheck (package.json:scripts.typecheck)
- [test] npx playwright test (playwright.config.*)

## Fragile Files
- .env.example
- apps/client-web/package.json
- apps/client-web/src/components/README.md
- apps/client-web/vite.config.ts
- apps/server-api/package.json
- handoff/DexDraw_vNext_Design_Handoff/README.md
- handoff/DexDraw_vNext_Design_Handoff/scaffold/apps/client-web/package.json
- handoff/DexDraw_vNext_Design_Handoff/scaffold/apps/client-web/src/components/README.md
- handoff/DexDraw_vNext_Design_Handoff/scaffold/apps/server-api/package.json
- handoff/DexDraw_vNext_Design_Handoff/scaffold/package.json
- handoff/DexDraw_vNext_Design_Handoff/scaffold/packages/shared-core/package.json
- handoff/DexDraw_vNext_Design_Handoff/scaffold/packages/shared-protocol/package.json
- package.json
- packages/shared-core/package.json
- packages/shared-protocol/package.json
- playwright.config.ts
- pnpm-lock.yaml
- README.md

## Duplicate Or Stale Candidates
- sibling-near-duplicate: DexDraw
- sibling-near-duplicate: dex

## Secret-Risk Findings
- handoff/DexDraw_vNext_Design_Handoff/research-artifact-source.md:125 (openai_sk_prefix)

## Recommended Next Actions
1. Inspect the current uncommitted Git changes before making new edits.
2. Review secret-risk findings and move sensitive values out of tracked files.
3. Back up or review fragile configuration files before any risky changes.
4. Validate the project with the hinted test command: npm run test
5. Validate the project with the hinted run/dev command: npm run dev

## Scan Metadata
- Timestamp: 2026-06-29T04:21:29+00:00
- Scanner version: 1.1.0
