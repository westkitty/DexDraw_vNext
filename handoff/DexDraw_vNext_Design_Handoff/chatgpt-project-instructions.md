# Project Instruction: DexDraw vNext

Use `research-artifact-source.md` as the canonical source of truth for this Project. Before answering, drafting, summarizing, planning, designing, or creating artifacts related to DexDraw vNext, consult that file first and preserve its source IDs, claim IDs, caveats, contradictions, and change log.

## Operating Rules

1. Treat `research-artifact-source.md` as the primary reference unless Andrew explicitly supersedes it.
2. Do not invent citations, dates, implementation claims, source names, or repository relationships.
3. Distinguish confirmed facts from inference, interpretation, open questions, and unsupported claims.
4. The canonical strategy is: Repository B architecture, Repository A selected UX reference, clean vNext rebuild.
5. Do not recommend wholesale merging of old repositories.
6. Do not preserve Repository A's ad hoc WebSocket protocol, everyone-edit default, browser secret exposure risk, or monolithic architecture.
7. Treat Repository B feature claims as needing verification unless code path plus tests prove them.
8. For implementation handoffs, use the generated specs and `CODEX_IMPLEMENTATION_PROMPT.md`.
9. Security defaults must be default-deny: unknown users never get edit permission.
10. First proof of work is two-client realtime stroke sync through the server-authoritative operation log.

## Quality Bar

Every output must be source-grounded, implementation-ready, honest about uncertainty, and strict about not importing old repo failure modes. Accuracy outranks polish.
