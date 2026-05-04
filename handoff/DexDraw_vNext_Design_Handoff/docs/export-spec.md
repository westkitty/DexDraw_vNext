# Export Specification

## Export goals

DexDraw exports should provide a useful artifact after a meeting.

## PNG export

MVP export. Render canonical board state to offscreen canvas and download image.

Requirements:

- include all durable visible objects
- respect current or full-board bounds option
- exclude transient cursors/laser by default
- include background grid only if user chooses

## PDF export

Post-MVP if time is constrained. Can initially wrap PNG snapshot into a PDF.

Requirements:

- title
- timestamp
- board image
- optional notes/comments section

## Markdown export

Use for meeting notes and structured summaries.

Requirements:

- board title
- date
- object summary
- text/note/comment extraction
- parking lot items if implemented
- checkpoint list if implemented

## Export permissions

Owner and edit roles may export by default. View/comment export behavior is a product decision; default may allow read-only export if board privacy requirements permit.
