# Codex Handoff: DexDraw_vNext

Read this handoff and project_report.md first.

## Project Identity
- Name: DexDraw_vNext
- Path: /Users/andrew/DexDraw_vNext
- Purpose: A web or Node.js project named DexDraw vNext.

## Current Git State
- Repo root: /Users/andrew/DexDraw_vNext | Branch: main | Status: dirty | Remote: git@github.com:westkitty/DexDraw_vNext.git
- Latest commit: ca7c6083a70235279c9d50520996c2b4f1e3e366 fix: use semantic output for board metrics

## Detected Project Type
- Type: node_web_app
- Confidence: 0.71
- Evidence:
  - Found package.json
  - Found playwright.config.ts

## Likely Commands
- [build] npm run build
- [run/dev] npm run dev
- [unknown] npm run format
- [unknown] npm run lint
- [test] npm run test
- [test] npm run test:e2e
- [unknown] npm run typecheck
- [test] npx playwright test

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

## Secret-Risk Warning Summary
- handoff/DexDraw_vNext_Design_Handoff/research-artifact-source.md:125 (openai_sk_prefix)

## Top 5 Recommended Next Actions
1. Inspect the current uncommitted Git changes before making new edits.
2. Review secret-risk findings and move sensitive values out of tracked files.
3. Back up or review fragile configuration files before any risky changes.
4. Validate the project with the hinted test command: npm run test
5. Validate the project with the hinted run/dev command: npm run dev

## Strict Codex Instruction Block

Read this handoff and project_report.md first.
Make one bounded change only.
Do not rewrite the project.
Do not delete or reorganize files.
Inspect existing files before editing.
Run the smallest relevant validation command available.
If validation cannot be run, explain why.
Report changed files, commands run, test results, and remaining risks.
