# Public Summary: What DexDraw vNext Should Become

## What this is

DexDraw vNext is a proposed clean rebuild of a collaborative whiteboard tool based on lessons from two existing repositories. Sources: S1, S2, S3.

## Why rebuild

The existing repositories point in two useful but different directions. One has simpler visible user flows. The other has the stronger long-term architecture. The safest path is not to merge them directly, but to rebuild the tool cleanly using the stronger architecture and selectively preserve the useful interface ideas. Sources: S1.

## What should carry forward

DexDraw vNext should keep the simple user experience of creating or joining a board, choosing templates, drawing, placing text and shapes, seeing collaborators, pointing with a laser tool, and exporting results. It should also use a proper shared protocol, server-side validation, a durable operation log, typed board objects, role-based permissions, and automated tests. Sources: S1.

## What is uncertain

Some features described or scaffolded in the stronger repository still need verification before they can be treated as fully working. Documentation is useful, but a passing end-to-end test is stronger proof. Sources: S1.

## Sources

- S1: Uploaded DexDraw Repository Comparison Master Record.
- S2: Verified GitHub metadata for `westkitty/dexDraw`.
- S3: Verified GitHub metadata for `westkitty/https-github.com-westkitty-DexDraw_Redux`.
