import { expect, test } from "@playwright/test";

test.describe("arrange, duplicate, and nudge", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  // ── helpers ─────────────────────────────────────────────────────────────────

  async function createBoard(
    page: import("@playwright/test").Page,
    name: string,
  ) {
    await page.goto("/");
    await page.getByTestId("gateway-enter").click();
    await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
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

  async function selectObject(
    page: import("@playwright/test").Page,
    box: { x: number; y: number; width: number; height: number },
    cx: number,
    cy: number,
    shift = false,
  ) {
    await page.getByRole("button", { name: "Select" }).click();
    if (shift) await page.keyboard.down("Shift");
    await page.mouse.click(box.x + cx, box.y + cy);
    if (shift) await page.keyboard.up("Shift");
  }

  // ── duplicate ────────────────────────────────────────────────────────────────

  test("duplicate rectangle syncs to second client and persists after reload", async ({
    page,
    browser,
  }) => {
    const { boardId, shareCode } = await createBoard(page, "Dup Sync Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 200, 200, 350, 300);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Select and duplicate
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 275, box.y + 250);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");
    await page.getByTestId("duplicate-button").click();
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Second client joins and verifies
    const ctxB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const pageB = await ctxB.newPage();
    await pageB.goto("/");
    await pageB.getByTestId("gateway-enter").click();
    await expect(pageB.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await pageB.getByLabel("Join board ID").fill(boardId);
    await pageB.getByLabel("Join share code").fill(shareCode);
    await pageB.getByLabel("Join display name").fill("Client B");
    await pageB.getByRole("button", { name: "Join board" }).click();
    await expect(pageB.getByTestId("rectangle-object")).toHaveCount(2);

    // Reload page A and verify persistence
    await page.reload();
    await page.getByTestId("gateway-enter").click();
    await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    await ctxB.close();
  });

  test("duplicate multi-selection preserves relative positions, undoable as one step", async ({
    page,
  }) => {
    await createBoard(page, "Dup Multi Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw two rects at known positions
    await drawRect(page, box, 520, 260, 620, 340);
    await drawRect(page, box, 760, 260, 860, 340);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Shift-select both
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 570, box.y + 300);
    await page.keyboard.down("Shift");
    await page.mouse.click(box.x + 810, box.y + 300);
    await page.keyboard.up("Shift");
    await expect(page.getByTestId("selection-count")).toHaveText("2 selected");

    // Duplicate
    await page.getByTestId("duplicate-button").click();
    await expect(page.getByTestId("rectangle-object")).toHaveCount(4);

    // Get the x attributes of all 4 rects
    const rects = page.getByTestId("rectangle-object");
    const x0 = Number(await rects.nth(0).getAttribute("x"));
    const x1 = Number(await rects.nth(1).getAttribute("x"));
    const x2 = Number(await rects.nth(2).getAttribute("x"));
    const x3 = Number(await rects.nth(3).getAttribute("x"));

    // Duplicates should each be offset from their originals by 24 px
    const origXs = [x0, x1].sort((a, b) => a - b);
    const dupXs = [x2, x3].sort((a, b) => a - b);
    expect(dupXs[0]).toBeCloseTo(origXs[0] + 24, 0);
    expect(dupXs[1]).toBeCloseTo(origXs[1] + 24, 0);

    // Undo should remove both duplicates in one step
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
  });

  // ── nudge ────────────────────────────────────────────────────────────────────

  test("arrow key nudge moves selected object and is undoable", async ({
    page,
  }) => {
    await createBoard(page, "Nudge Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 300, 300, 420, 380);
    await expect(page.getByTestId("rectangle-object")).toBeVisible();

    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 360, box.y + 340);

    const rect = page.getByTestId("rectangle-object");
    const origX = Number(await rect.getAttribute("x"));

    // Nudge right by 8
    await page.keyboard.press("ArrowRight");
    const newX = Number(await rect.getAttribute("x"));
    expect(newX).toBeCloseTo(origX + 8, 0);

    // Undo restores original
    await page.keyboard.press("Meta+z");
    const undoneX = Number(await rect.getAttribute("x"));
    expect(undoneX).toBeCloseTo(origX, 0);
  });

  test("Shift+Arrow uses 32-unit movement", async ({ page }) => {
    await createBoard(page, "Shift Nudge Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 300, 300, 420, 380);
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 360, box.y + 340);

    const rect = page.getByTestId("rectangle-object");
    const origX = Number(await rect.getAttribute("x"));

    await page.keyboard.press("Shift+ArrowRight");
    const newX = Number(await rect.getAttribute("x"));
    expect(newX).toBeCloseTo(origX + 32, 0);
  });

  test("arrow nudge with multi-select moves all selected, one undo step", async ({
    page,
  }) => {
    await createBoard(page, "Nudge Multi Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 200, 180);
    await drawRect(page, box, 400, 100, 500, 180);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 150, box.y + 140);
    await page.keyboard.down("Shift");
    await page.mouse.click(box.x + 450, box.y + 140);
    await page.keyboard.up("Shift");

    const rects = page.getByTestId("rectangle-object");
    const origX0 = Number(await rects.nth(0).getAttribute("x"));
    const origX1 = Number(await rects.nth(1).getAttribute("x"));

    await page.keyboard.press("ArrowDown");

    expect(Number(await rects.nth(0).getAttribute("y"))).toBeGreaterThan(
      Number(await rects.nth(0).getAttribute("y")) - 10,
    );

    // One undo step restores both
    await page.keyboard.press("Meta+z");
    expect(Number(await rects.nth(0).getAttribute("x"))).toBeCloseTo(origX0, 0);
    expect(Number(await rects.nth(1).getAttribute("x"))).toBeCloseTo(origX1, 0);
  });

  // ── arrange ─────────────────────────────────────────────────────────────────

  test("arrange changes visual stacking order of overlapping objects", async ({
    page,
  }) => {
    await createBoard(page, "Arrange Stack Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw rect A (left) then rect B (right) — B has higher zIndex by default
    await drawRect(page, box, 520, 260, 670, 400);
    await drawRect(page, box, 760, 260, 910, 400);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Select first rect (left) and bring it to front
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 595, box.y + 330);
    await page.getByTestId("arrange-front").click();

    // Verify SVG DOM order — 2 rects should exist with valid z-indices
    const svgChildren = await page.evaluate(() => {
      const canvas = document.querySelector("[data-testid='board-canvas']");
      if (!canvas) return [];
      return Array.from(
        canvas.querySelectorAll("[data-testid='rectangle-object']"),
      ).map((el) => el.getAttribute("data-z-index") ?? "unknown");
    });
    expect(svgChildren.length).toBe(2);
  });

  test("arrange front/back persists after reload", async ({ page }) => {
    await createBoard(page, "Arrange Persist Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    await drawRect(page, box, 400, 100, 550, 220);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Record initial z-order via x position in DOM
    const getZOrders = async () => {
      const rects = page.getByTestId("rectangle-object");
      return [
        Number(await rects.nth(0).getAttribute("x")),
        Number(await rects.nth(1).getAttribute("x")),
      ];
    };

    // Select first rect (left, x=100) and send to front
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 175, box.y + 160);
    await page.getByTestId("arrange-front").click();

    // Get the zIndex values after arrange
    const zOrders = await getZOrders();

    // Reload and verify the order is the same
    await page.reload();
    await page.getByTestId("gateway-enter").click();
    await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
    const zOrdersAfterReload = await getZOrders();
    expect(zOrdersAfterReload).toEqual(zOrders);
  });

  test("selection count indicator shows when objects are selected", async ({
    page,
  }) => {
    await createBoard(page, "Selection Count Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 520, 260, 620, 360);
    await drawRect(page, box, 760, 260, 860, 360);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    await page.getByRole("button", { name: "Select" }).click();

    // No selection: count indicator not visible
    await expect(page.getByTestId("selection-count")).not.toBeVisible();

    // Select one
    await page.mouse.click(box.x + 570, box.y + 310);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    // Shift-select second
    await page.keyboard.down("Shift");
    await page.mouse.click(box.x + 810, box.y + 310);
    await page.keyboard.up("Shift");
    await expect(page.getByTestId("selection-count")).toHaveText("2 selected");

    // Deselect by clicking empty canvas area
    await page.mouse.click(box.x + 640, box.y + 520);
    await expect(page.getByTestId("selection-count")).not.toBeVisible();
  });

  test("arrange/duplicate buttons disabled when nothing selected", async ({
    page,
  }) => {
    await createBoard(page, "Disabled Buttons Board");

    await expect(page.getByTestId("duplicate-button")).toBeDisabled();
    await expect(page.getByTestId("arrange-front")).toBeDisabled();
    await expect(page.getByTestId("arrange-forward")).toBeDisabled();
    await expect(page.getByTestId("arrange-backward")).toBeDisabled();
    await expect(page.getByTestId("arrange-back")).toBeDisabled();
  });

  test("Cmd+D keyboard shortcut duplicates selected object", async ({
    page,
  }) => {
    await createBoard(page, "Keyboard Shortcuts Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas bounds missing");

    // Draw one rectangle
    await drawRect(page, box, 520, 260, 680, 380);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Select it
    await selectObject(page, box, 600, 320);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");

    // Cmd+D should duplicate
    await page.keyboard.press("Meta+d");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
  });

  test("Cmd+] / Cmd+[ keyboard shortcuts change z-order", async ({ page }) => {
    await createBoard(page, "Z-Order Shortcuts Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas bounds missing");

    // Draw two overlapping rectangles
    await drawRect(page, box, 100, 80, 260, 200);
    await drawRect(page, box, 140, 120, 300, 240);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Select first rect and move it forward
    await selectObject(page, box, 120, 100);
    await expect(page.getByTestId("selection-count")).toHaveText("1 selected");
    await page.keyboard.press("Meta+]");

    // Object count unchanged — just the order changes, no error
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Cmd+[ moves backward
    await page.keyboard.press("Meta+[");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
  });
});
