# UI/UX Handoff

## Design direction

DexDraw vNext should feel like a focused meeting tool: calm, clean, fast, and legible. It should not feel like a decorative toy or a bloated design suite.

## Primary screens

### Home / Board Entry

Purpose: create or join a board quickly.

Components:

- app title
- create board card
- join board card
- template picker
- recent boards if available
- environment status / local server indicator

States:

- empty
- loading templates
- template load error
- invalid board code
- creating board

### Board Workspace

Purpose: collaborative drawing and meeting work.

Regions:

- top status bar
- left toolbar
- central canvas
- right panel for comments/parking/export when enabled
- bottom minimap/timeline later

### Export Panel

Purpose: save useful meeting artifacts.

Options:

- PNG image
- PDF snapshot
- Markdown meeting summary

## Component hierarchy

- `AppShell`
- `HomeScreen`
- `CreateBoardCard`
- `JoinBoardCard`
- `TemplatePicker`
- `BoardScreen`
- `BoardStatusBar`
- `ToolPalette`
- `CanvasSurface`
- `PresenceLayer`
- `LaserLayer`
- `TextEditorOverlay`
- `ExportMenu`
- `ErrorBanner`

## Accessibility requirements

- Toolbar buttons must have accessible names.
- Toolbar must support keyboard navigation.
- Active tool must be announced visually and semantically.
- Escape cancels current drawing/text entry.
- Enter confirms text entry.
- Focus returns predictably after modal/panel close.
- Export actions must be reachable by keyboard.
- Error banners must include recovery action.
- Cursor/laser animations must respect reduced motion.

```text
UIUX_HANDOFF_PACKET
product_name: DexDraw vNext
product_type: web app
source_input_type: mixed repository audit and product brief
platforms: desktop-first responsive web, local/private server deployment
audience:
- meeting facilitator: creates boards, templates, checkpoints, and exports
- collaborator: draws, writes, comments, and points in real time
- viewer: watches without mutating board state
primary_jobs:
- create or join a board quickly
- draw and write collaboratively
- preserve board state across reloads
- export useful meeting output
design_direction:
  theme: focused private meeting workspace
  tone: calm, direct, technical, reliable
  density: balanced
  accessibility_baseline: keyboard navigation, visible focus, labels, contrast, reduced motion
information_architecture:
- Home: create/join/template selection
- Board Workspace: canvas, tools, presence, status
- Export Panel: PNG, PDF, Markdown outputs
screens:
- name: Home
  purpose: start or join board
  primary_action: create board
  layout: two-card entry with template picker below
  key_components:
  - CreateBoardCard
  - JoinBoardCard
  - TemplatePicker
  states:
  - loading
  - error
  - creating
  - invalid board code
  responsive_behavior: cards stack on narrow screens
- name: Board Workspace
  purpose: collaborate on canvas
  primary_action: draw or place object
  layout: status bar top, toolbar left, canvas center, optional side panel right
  key_components:
  - ToolPalette
  - CanvasSurface
  - PresenceLayer
  - LaserLayer
  - ExportMenu
  states:
  - connecting
  - connected
  - reconnecting
  - unauthorized
  - read-only
  responsive_behavior: toolbar collapses to bottom rail on narrow screens
components:
- name: ToolPalette
  role: choose drawing/editing tool
  props_or_data: active tool, role permissions, color, stroke width
  interactions: click, keyboard arrow navigation, shortcuts
  accessibility: aria-labels, roving tabindex, visible focus
- name: CanvasSurface
  role: render board and capture pointer input
  props_or_data: board objects, viewport, active tool, permission state
  interactions: pointer down/move/up, keyboard escape, wheel zoom later
  accessibility: labeled region, fallback instructions, focusable canvas wrapper
- name: PresenceLayer
  role: show remote cursors and users
  props_or_data: ephemeral presence state
  interactions: none required
  accessibility: respect reduced motion; do not steal focus
user_flows:
- name: Create board
  steps: home -> choose template -> create -> receive board token -> open board -> connected
- name: Draw stroke
  steps: select pen -> pointer draw -> optimistic render -> server canonical op -> reconcile -> broadcast
- name: Export PNG
  steps: open export menu -> choose PNG -> generate from canonical board render -> download
copy_changes:
- location: empty board
  suggested_copy: Start with a pen stroke, shape, or text note.
  reason: simple recovery from blank state
accessibility_requirements:
- toolbar keyboard navigation
- visible focus
- labeled controls
- error recovery text
- reduced motion support
responsive_rules:
- desktop: left toolbar and right panel
- tablet: compact side panel
- mobile: bottom toolbar; board still usable but not primary target
design_tokens:
  color_roles: background, surface, text, muted_text, accent, danger, success, warning, focus
  typography_roles: display, heading, body, label, caption, code
  spacing: 4px base scale
  radius: 8px controls, 12px panels
  elevation: subtle panel shadows only
implementation_constraints:
- React + Vite
- no giant Board component
- role-aware disabled states
github_or_tool_research_needed:
- verify existing repo implementation before porting old code
acceptance_criteria:
- user can create board and draw synced stroke across two clients
- toolbar is keyboard accessible
- view role cannot mutate board
open_questions:
- final brand palette and iconography
END_UIUX_HANDOFF_PACKET
```
