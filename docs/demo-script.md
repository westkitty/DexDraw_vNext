# DexDraw — 5-Minute Demo Script

## Prerequisites

```bash
corepack enable
pnpm install
cp .env.example apps/server-api/.env
pnpm dev
```

Wait until both `[server-api]` and `[client-web]` report ready.

---

## Step 0 — Enter the gateway

1. Open **http://127.0.0.1:5173** in a fresh browser tab.
2. The atmospheric opening animation appears first. The app/canvas is not available during this phase.
3. After the opening animation completes, the post-animation entry barrier appears.
4. Click **Enter Canvas**.
5. The gateway fades out (600 ms). The app shell loads.
6. On every fresh app/page load, repeat the required sequence: opening animation → post-animation barrier → app/canvas entry.

---

## Step 1 — Create a board (Tab A)

1. Open **http://127.0.0.1:5173** in a browser tab and complete the gateway sequence.
2. Fill in:
   - **Board name:** `Demo Board`
   - **Your name:** `Alice`
   - **Template:** `Blank` (or `Meeting Grid`)
3. Click **Create board**.
4. Note the **Share code** shown in the header (e.g. `AB12CD`).

---

## Step 2 — Join from a second client (Tab B)

1. Open **http://127.0.0.1:5173** in a second tab (or a different browser) and complete the gateway sequence.
2. Fill in the **Join** panel:
   - **Board ID:** paste the board UUID from Tab A's URL (`/boards/<uuid>`)
   - **Share code:** the code from step 1
   - **Your name:** `Bob`
3. Click **Join board**.
4. Both tabs should now show the same empty board.

---

## Step 3 — Draw and sync

1. In **Tab A**, select the **Pen** tool and draw a freehand stroke.
2. Confirm the stroke appears in **Tab B** within ~100 ms.
3. In **Tab B**, draw a stroke — confirm it appears in **Tab A**.

---

## Step 4 — Shapes, text, and notes

1. Select **Rectangle** and drag to draw a rectangle on the canvas.
2. Select **Ellipse** and drag to draw an ellipse.
3. Select **Text**, click the canvas — a text object appears; type some text, press Escape.
4. Select **Note**, click the canvas — a yellow sticky note appears; type, press Escape.
5. Confirm all objects sync to the other tab.

---

## Step 5 — Edit inline

1. Switch to **Select** tool.
2. Double-click the text or note object — the inline editor opens.
3. Edit the content, press **Enter** (or click outside) to commit.
4. Confirm the edit syncs live to the other tab.

---

## Step 6 — Selection, multi-select, and marquee

1. Click a shape to select it (handles appear).
2. Shift-click a second shape to add it to the selection.
3. Or: drag on empty canvas to draw a **marquee** — all objects inside are selected.
4. Drag the group — all move together.
5. Press **Escape** to deselect.

---

## Step 7 — Duplicate, arrange, nudge, resize

1. Select an object. Press **Cmd+D** (Mac) / **Ctrl+D** (Windows) to duplicate.
2. With an object selected, use **Cmd+]** / **Cmd+[** to move it forward/backward in z-order.
3. With an object selected, press **Arrow keys** to nudge (8 px); hold **Shift** for 32 px.
4. Select a rectangle or ellipse — drag a **resize handle** to resize.

---

## Step 8 — Board title rename

1. In **Tab A**, click the bold board title in the header.
2. An editable input appears — type a new name and press **Enter**.
3. Confirm the new title appears in **Tab B** immediately (WS broadcast).

---

## Step 9 — Save and restore checkpoint

1. Click **Save Checkpoint** in the toolbar.
2. Enter a name in the prompt (e.g. `v1 — clean state`) and click OK.
3. Draw a few more objects after the checkpoint.
4. In the checkpoint dropdown, confirm your checkpoint is selected (with timestamp).
5. Click **Restore** — confirm the dialog, watch objects revert to the checkpoint state.
6. Confirm the restore syncs to the other tab.

---

## Step 10 — Export

1. Make sure there are objects on the canvas (export is disabled on empty boards).
2. Click **Export PNG** — a PNG of the board crops to content and downloads.
3. Click **Export Markdown** — a `.md` file downloads with text content.
4. Click **Export PDF** — a new browser window opens with the board SVG; use browser print to save as PDF.

---

## Step 11 — Undo/redo

1. Press **Cmd+Z** / **Ctrl+Z** to undo the last operation.
2. Press **Cmd+Shift+Z** / **Ctrl+Y** to redo.
3. Undo/redo is per-client and does not affect the other tab.

---

## Step 12 — Reconnect replay (bonus)

1. In **Tab B**, open DevTools → Network, set throttle to **Offline**.
2. In **Tab A**, draw several new objects.
3. Restore **Tab B** to online.
4. Confirm **Tab B** catches up to the current board state within a few seconds.

---

## Done

Full demo complete. All features demonstrated: create, join, draw, edit, collaborate, checkpoint, export, undo, reconnect.
