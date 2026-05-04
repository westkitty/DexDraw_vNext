---
title: "DexDraw vNext Machine-Optimized Source"
created: "2026-05-04"
updated: "2026-05-04"
source_type: "machine_optimized_research_artifact_source"
canonical_status: "active"
intended_project: "DexDraw vNext"
source_dump_origin: "Uploaded DexDraw Repository Comparison Master Record plus verified GitHub metadata"
---

# DexDraw vNext Machine-Optimized Source

## 00 Project Use Instructions

This markdown file is the canonical source for future artifact generation about DexDraw vNext. Future ChatGPT or Codex work should read this file before answering, drafting, summarizing, designing, or planning related outputs. Treat source IDs and claim IDs as stable references.

## 01 Scope

- Topic: DexDraw vNext rebuild strategy and implementation handoff.
- Research question: How should DexDraw be rebuilt using lessons from Repository A and Repository B?
- Audience: AI coding agent, developer, and project owner.
- Included material: Repository comparison findings, repo relationship model, risks, migration plan, implementation plan, UX strategy, security requirements.
- Excluded material: Live build execution of the two old repositories; mutation of old repositories.
- Last meaningful source date: 2026-05-04.

## 02 Source Registry / Source Inventory

| Source ID | Source title/name | Author/org | Date | Type | Location/link | Notes |
|---|---|---|---|---|---|---|
| S1 | DexDraw Repository Comparison Master Record | ChatGPT conversation artifact | 2026-05-04 | Uploaded Markdown audit | `source/dexdraw_repository_comparison_master_record.md` | Primary grounding source. |
| S2 | GitHub metadata for `westkitty/dexDraw` | GitHub connector | 2026-05-04 | Repository metadata | GitHub | Confirms repo identity and default branch. |
| S3 | GitHub metadata for `westkitty/https-github.com-westkitty-DexDraw_Redux` | GitHub connector | 2026-05-04 | Repository metadata | GitHub | Confirms repo identity and default branch. |

## 03 Key Findings

### KF-001: Repository B is canonical
- Summary: Repository B should be treated as the canonical DexDraw architecture.
- Evidence: S1, S2
- Confidence: high
- Caveats: Feature claims must still be code-path verified.

### KF-002: Repository A is Lite/reference
- Summary: Repository A is useful as AI Studio / Lite adapter and UX reference, but not as the canonical product base.
- Evidence: S1, S3
- Confidence: high
- Caveats: It may contain useful code snippets, but they should be re-modeled into B-style modules.

### KF-003: Clean rebuild beats merge
- Summary: A clean vNext rebuild is safer than direct merge.
- Evidence: S1
- Confidence: high
- Caveats: Codex must inspect old repos before implementing detailed port behavior.

### KF-004: Two-client sync is first proof
- Summary: vNext is not real until one client draws and another client sees the same server-sequenced stroke.
- Evidence: S1
- Confidence: medium/high
- Caveats: Exact test implementation depends on chosen testing stack.

## 04 Claim Registry

| Claim ID | Claim | Evidence Source IDs | Confidence | Artifact use | Notes |
|---|---|---|---|---|---|
| C1 | B is canonical. | S1, S2 | High | Architecture, Codex prompt | Core decision. |
| C2 | A is Lite/reference. | S1, S3 | High | Migration plan | Do not merge wholesale. |
| C3 | Use shared-core and shared-protocol as single sources of truth. | S1 | High | Architecture | Core implementation rule. |
| C4 | Default-deny auth required. | S1 | High | Security | Prevents repeating old risk. |
| C5 | First test is two-client stroke sync. | S1 | Medium/High | Testing | Acceptance gate. |
| C6 | Advanced B feature claims need verification. | S1 | High | Codex prompt | Prevents false confidence. |

## 05 Evidence Notes

### S1 Notes
- Important facts: B canonical; A Lite/adapter; do not merge wholesale; verify B advanced claims; port A UX selectively.
- Relevant paraphrase: Source recommends B as canonical and A as UX/reference or AI Studio Lite adapter.
- Date/freshness issues: Represents current audit state as of 2026-05-04.

### S2 Notes
- Important facts: `westkitty/dexDraw` exists, public, default branch main.
- Date/freshness issues: Metadata verified during package creation.

### S3 Notes
- Important facts: `westkitty/https-github.com-westkitty-DexDraw_Redux` exists, public, default branch main.
- Date/freshness issues: Metadata verified during package creation.

## 06 Definitions and Glossary

| Term | Definition | Source IDs | Notes |
|---|---|---|---|
| Repository A | `westkitty/https-github.com-westkitty-DexDraw_Redux`; AI Studio / Lite / UX reference. | S1, S3 | Not canonical. |
| Repository B | `westkitty/dexDraw`; canonical DexDraw architecture. | S1, S2 | Use as architecture parent. |
| vNext | Clean rebuild target that uses B architecture and selected A UX. | S1 | This package defines it. |
| Server-authoritative operation log | Server validates, sequences, persists, and broadcasts durable board operations. | S1 | Required for collaboration. |
| Shared protocol | Zod/TypeScript package defining canonical wire messages and operation schemas. | S1 | Must be used by client and server. |

## 07 Contradictions and Uncertainties

| ID | Issue | Sources involved | Current resolution | Follow-up needed |
|---|---|---|---|---|
| X1 | B was scored differently across reports. | S1 | Treat B as strongest, but verify advanced features. | Codex must inspect actual code. |
| X2 | A is both active root runtime and contains vendored older code. | S1 | Treat A as Lite root runtime plus historical snapshot. | Do not let vendored code become second truth. |
| U1 | Exact current implementation status of B features. | S1, S2 | Unknown until Codex inspects. | Verification phase first. |

## 08 Artifact Inventory

- Executive brief: generated.
- Infographic spec: generated.
- Slide outline: generated.
- Citation map: generated.
- Public summary: generated.
- Codex implementation prompt: generated.
- UX handoff packet: generated in `docs/ui-ux-handoff.md`.
- Security and test specs: generated.
- Structured JSON/YAML/CSV specs: generated.

## 09 Reusable Messaging

### One-sentence summary
DexDraw vNext should be a clean rebuild that uses Repository B as architecture and Repository A only as selected UX reference.

### Short public summary
The safest DexDraw path is not to merge both repositories, but to rebuild from the audit: keep B's structured architecture, preserve A's useful simple UX ideas, and prove collaboration with an end-to-end two-client drawing test.

### Decision-maker framing
This is a risk-reduction rebuild: one canonical architecture, one protocol, one server-authoritative operation log, and no duplicate source of truth.

## 10 Recommended Future Outputs

- Architecture diagram: explain data and operation flow.
- GitHub issue set: convert backlog CSV into tracked issues.
- Playwright end-to-end test suite: encode acceptance checklist.
- Implementation pull request: scaffold vNext branch or repo.

## 11 Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-05-04 | Initial machine-optimized source created. | Package DexDraw vNext design handoff for Codex. |

## Project-use Notes

Future agents should first run repository inspection and build/test verification before preserving any old feature implementation. If a feature is only documented or scaffolded, mark it as planned until an implementation path and test prove it.
