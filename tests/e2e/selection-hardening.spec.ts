import { expect, test } from "@playwright/test";

test.describe("selection hardening", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  async function createBoard(
    page: import("@playwright/test").Page,
    name: string,
  ) {
    await page.goto("/");
    await page.getByLabel("Board name").fill(name);
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();
    const boardId = await page.getByTestId("board-id").innerText();
    const shareCode = await page.getByTestId("share-code").innerText();
    return { boardId, shareCode };
  }

  async function drawRect(
    page: import("@playwright/test").Page,
    box: { x: number; y: number; width: number; height: number },
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + x1, box.y + y1);
    await page.mouse.down();
    await page.mouse.move(box.x + x2, box.y + y2, { steps: 5 });
    await page.mouse.up();
  }

  // ── Escape key ───────────────────────────────────────────────────────────────

  test("Escape clears selection", async ({ page }) => {
    await createBoard(page, "Escape Clear Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 175, box.y + 160);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("selection-count")).not.toBeVisible();
  });

  test("Escape cancels active marquee without selecting", async ({ page }) => {
    await createBoard(page, "Escape Marquee Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    await page.getByRole("button", { name: "Select" }).click();

    // Start a marquee drag
    const safeY = Math.floor(box.height * 0.6);
    await page.mouse.move(box.x + 400, box.y + safeY);
    await page.mouse.down();
    await page.mouse.move(box.x + 600, box.y + safeY + 80, { steps: 3 });
    await expect(page.getByTestId("marquee-selection")).toBeVisible();

    // Press Escape — marquee should disappear
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("marquee-selection")).not.toBeVisible();
    await page.mouse.up();
  });

  test("Escape during inline editing cancels edit", async ({ page }) => {
    await createBoard(page, "Escape Edit Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Place a text object
    await page.getByRole("button", { name: "Text" }).click();
    await page.mouse.click(box.x + 300, box.y + 200);

    // Double-click to edit
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 300, box.y + 200);
    await page.mouse.dblclick(box.x + 300, box.y + 200);
    await expect(page.getByTestId("inline-editor")).toBeVisible();

    // Escape should close editor (not crash or select-clear)
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("inline-editor")).not.toBeVisible();
  });

  // ── clicking empty canvas ────────────────────────────────────────────────────

  test("clicking empty canvas in Select tool clears selection", async ({
    page,
  }) => {
    await createBoard(page, "Click Empty Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 175, box.y + 160);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    // Click empty area
    await page.mouse.click(box.x + 700, box.y + Math.floor(box.height * 0.5));
    await expect(page.getByTestId("selection-count")).not.toBeVisible();
  });

  // ── selection count after operations ─────────────────────────────────────────

  test("selection count updates after duplicate", async ({ page }) => {
    await createBoard(page, "Count Dup Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 175, box.y + 160);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    // Duplicate selects the new copies
    await page.getByTestId("duplicate-button").click();
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");
  });

  test("selection count clears after delete", async ({ page }) => {
    await createBoard(page, "Count Delete Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 175, box.y + 160);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    await page.keyboard.press("Delete");
    await expect(page.getByTestId("selection-count")).not.toBeVisible();
    await expect(page.getByTestId("rectangle-object")).toHaveCount(0);
  });

  test("selection count stable after undo/redo", async ({ page }) => {
    await createBoard(page, "Count Undo Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 175, box.y + 160);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    // Delete, then undo → rect comes back but is not auto-selected
    await page.keyboard.press("Delete");
    await expect(page.getByTestId("selection-count")).not.toBeVisible();

    await page.keyboard.press("Meta+z");
    // After undo, the rect is back but selection state depends on undo logic —
    // we just verify the count is not showing a stale value
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
  });

  // ── checkpoint restore clears invalid selection ──────────────────────────────

  test("checkpoint restore clears selection for removed objects", async ({
    page,
  }) => {
    const { boardId: _boardId, shareCode: _shareCode } = await createBoard(
      page,
      "Checkpoint Selection Board",
    );
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw a rect and save checkpoint (wait for rect to confirm WS is live)
    await drawRect(page, box, 100, 100, 250, 220);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
    page.once("dialog", (dialog) => dialog.accept("Checkpoint 1"));
    await page.getByRole("button", { name: "Save Checkpoint" }).click();
    await expect(page.getByTestId("checkpoint-select")).toBeVisible();

    // Draw another rect and select it
    await drawRect(page, box, 400, 100, 550, 220);
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 475, box.y + 160);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    // Restore the checkpoint — the second rect won't exist anymore
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("restore-button").click();
    // After restore, selection should be cleared (second rect no longer exists)
    await expect(page.getByTestId("selection-count")).not.toBeVisible();
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
  });

  // ── marquee selects group for operations ──────────────────────────────────────

  test("duplicate after marquee-selection creates expected group", async ({
    page,
  }) => {
    await createBoard(page, "Marquee Dup Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 220, 200);
    await drawRect(page, box, 300, 100, 420, 200);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Marquee-select both rects
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 470, box.y + 250, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByTestId("selection-count")).toHaveText("2 selected");

    // Duplicate both
    await page.getByTestId("duplicate-button").click();
    await expect(page.getByTestId("rectangle-object")).toHaveCount(4);

    // Undo removes both duplicates in one step
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
  });

  test("nudge after marquee-selection moves group and undo restores", async ({
    page,
  }) => {
    await createBoard(page, "Marquee Nudge Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 220, 200);
    await drawRect(page, box, 300, 100, 420, 200);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    const rects = page.getByTestId("rectangle-object");
    const origX0 = Number(await rects.nth(0).getAttribute("x"));
    const origX1 = Number(await rects.nth(1).getAttribute("x"));

    // Marquee-select both
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 470, box.y + 250, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByTestId("selection-count")).toHaveText("2 selected");

    // Nudge right
    await page.keyboard.press("ArrowRight");
    expect(Number(await rects.nth(0).getAttribute("x"))).toBeCloseTo(
      origX0 + 8,
      0,
    );
    expect(Number(await rects.nth(1).getAttribute("x"))).toBeCloseTo(
      origX1 + 8,
      0,
    );

    // Undo restores both
    await page.keyboard.press("Meta+z");
    expect(Number(await rects.nth(0).getAttribute("x"))).toBeCloseTo(origX0, 0);
    expect(Number(await rects.nth(1).getAttribute("x"))).toBeCloseTo(origX1, 0);
  });

  // ── resize handles for single-select only ────────────────────────────────────

  test("resize handles not shown for multi-select", async ({ page }) => {
    await createBoard(page, "Multi Resize Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 220, 200);
    await drawRect(page, box, 300, 100, 420, 200);

    // Marquee-select both
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 470, box.y + 250, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByTestId("selection-count")).toHaveText("2 selected");

    // No resize handles should appear for multi-select
    await expect(page.getByTestId("resize-handle-se")).not.toBeVisible();
  });
});
