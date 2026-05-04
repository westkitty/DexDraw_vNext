# Infographic Specification: DexDraw vNext Rebuild Strategy

## Audience

Developer or AI implementation agent preparing to rebuild DexDraw from the two-repository audit. Sources: S1, S2, S3.

## Central takeaway

DexDraw vNext should not merge the old repositories. It should rebuild cleanly with Repository B as architecture and Repository A as selected UX reference.

## Visual hierarchy

1. Top banner: "DexDraw vNext: Rebuild From Lessons, Not Wreckage"
2. Left column: Repository A strengths and hazards.
3. Right column: Repository B strengths and verification gaps.
4. Center spine: vNext canonical architecture.
5. Bottom row: implementation milestones and first proof.

## Section copy

### Repository A: Use Carefully
- Keep: create/join, templates, shapes, text, laser, cursors, screenshot export.
- Reject: ad hoc WebSocket messages, everyone-edit default, browser secrets, monoliths.
- Source: S1, S3.

### Repository B: Canonical Bones
- Keep: monorepo, shared core, shared protocol, server-authoritative ops, PostgreSQL/Drizzle direction, docs/tests/deploy story.
- Verify: WebSocket auth, client-server drawing commit, shape/text sync, long-poll fallback, exports.
- Source: S1, S2.

### vNext Spine
- `apps/client-web`
- `apps/server-api`
- `packages/shared-core`
- `packages/shared-protocol`
- `docs`
- `tests`

## Chart / diagram specs

### Diagram 1: Repository Relationship Map
- Node A: DexDraw_Redux / Lite UX reference.
- Node B: dexDraw / canonical architecture.
- Node C: DexDraw vNext / clean rebuild.
- Arrows: A -> selected UX patterns; B -> architecture/protocol/security.

### Diagram 2: Operation Flow
- Client input -> shared protocol validation -> WebSocket send -> server auth -> server sequence -> database op log -> broadcast -> client reconcile.

### Mini-table: First Milestones
| Milestone | Proof |
|---|---|
| M0 | Two clients see same stroke |
| M1 | Auth and roles enforced |
| M2 | Templates + create/join |
| M3 | Shapes/text/laser/cursors |
| M4 | Checkpoints + exports |

## Accessibility notes

- Use contrast-safe design tokens.
- Make toolbar keyboard navigable.
- Provide visible focus rings.
- Provide labels for drawing tools.
- Ensure non-pointer users can create text, navigate boards, and access exports.
- Respect reduced-motion preferences for cursor/laser animations.

## Source footnotes

- S1: Master comparison record.
- S2: Repository B metadata verification.
- S3: Repository A metadata verification.
