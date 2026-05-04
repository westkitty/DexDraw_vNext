# Citation Map

## Source Inventory

| Source ID | Source title/name | Type | Date | Notes |
|---|---|---|---|---|
| S1 | DexDraw Repository Comparison Master Record | Uploaded Markdown audit record | 2026-05-04 | Consolidates two repository audits and final recommendations. |
| S2 | GitHub metadata for westkitty/dexDraw | Repository metadata | 2026-05-04 | Confirms canonical repository identity, default branch, visibility, and access. |
| S3 | GitHub metadata for westkitty/https-github.com-westkitty-DexDraw_Redux | Repository metadata | 2026-05-04 | Confirms Lite/Redux repository identity, default branch, visibility, and access. |

## Claim Map

| Claim ID | Claim | Evidence Source IDs | Confidence | Artifact use | Notes |
|---|---|---|---|---|---|
| C1 | Repository B should be canonical for DexDraw vNext. | S1, S2 | High | All implementation docs | Repeated final verdict in master record. |
| C2 | Repository A should be treated as AI Studio / Lite / UX reference, not equal canonical product. | S1, S3 | High | Migration and UX specs | Master record identifies A as root Lite runtime plus vendored old code. |
| C3 | Repository A contributes useful visible UX patterns. | S1 | High | UX spec, backlog | Includes create/join, templates, shapes, text, laser, cursors, PNG/PDF export. |
| C4 | Repository A's foundations are unsafe for canonical product use. | S1 | High | Security spec | Includes weak/no auth, ad hoc messages, browser key risk, monolithic runtime. |
| C5 | Repository B's advanced feature claims require verification. | S1 | High | Codex prompt, test plan | Master record warns docs/components are not implementation proof. |
| C6 | First acceptance proof should be two-client stroke sync. | S1 | Medium/High | Test plan | Derived from audit priority that client-server drawing loop must be proven. |
| C7 | vNext should use shared-core and shared-protocol packages. | S1 | High | Architecture spec | Directly supported by cross-repo recommendations. |
| C8 | Default-deny auth and role enforcement are critical. | S1 | High | Security spec | Directly supported by risk register and immediate B priorities. |

## Unsupported / Needs Verification

| ID | Unsupported or unverified claim | Handling |
|---|---|---|
| U1 | B has fully working shape/text/comment/timeline end-to-end behavior. | Codex must verify by code path and tests before preserving or claiming. |
| U2 | B's WebSocket route already enforces tokens correctly. | Codex must inspect and implement default-deny auth if missing. |
| U3 | Long-poll fallback is complete. | Treat as not complete unless tests prove otherwise. |

## Contradictions

| ID | Issue | Resolution |
|---|---|---|
| X1 | Supplied external report scored B higher than first audit. | Use merged verdict: B is stronger, but advanced features require verification. |
| X2 | A looked small at root but also contains vendored old code. | Treat A as root Lite runtime plus historical snapshot, not a clean product base. |
