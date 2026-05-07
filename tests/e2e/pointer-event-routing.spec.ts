import { expect, test } from "@playwright/test";

test.describe("pointer-event routing", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  // ── helpers ─────────────────────────────────────────────────────────────────

  async function createBoard(
    page: import("@playwright/test").Page,
    name: string,
  ) {
    await page.goto("/");
    await page.getByLabel("Board name").fill(name);
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();
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

  // ── drawing over existing objects ────────────────────────────────────────────

  test("rectangle tool can draw starting on top of an existing rectangle", async ({
    page,
  }) => {
    await createBoard(page, "Rect Over Rect Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw first rectangle (non-overlapping start position for second draw)
    await drawRect(page, box, 100, 100, 300, 250);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Draw second rectangle starting INSIDE the first rectangle
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350, { steps: 5 });
    await page.mouse.up();

    // Both rectangles should exist
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
  });

  test("ellipse tool can draw starting on top of an existing rectangle", async ({
    page,
  }) => {
    await createBoard(page, "Ellipse Over Rect Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 300, 250);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Draw ellipse starting inside the rectangle
    await page.getByRole("button", { name: "Ellipse" }).click();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 330, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("ellipse-object")).toHaveCount(1);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
  });

  test("pen tool can draw starting on top of an existing rectangle", async ({
    page,
  }) => {
    await createBoard(page, "Pen Over Rect Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 300, 250);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Draw stroke starting inside the rectangle
    await page.getByRole("button", { name: "Pen" }).click();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200, { steps: 5 });
    await page.mouse.move(box.x + 350, box.y + 150, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("stroke-object")).toHaveCount(1);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
  });

  test("text tool can place text on top of an existing rectangle", async ({
    page,
  }) => {
    await createBoard(page, "Text Over Rect Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 300, 250);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Place text inside the rectangle
    await page.getByRole("button", { name: "Text" }).click();
    await page.mouse.click(box.x + 150, box.y + 150);

    await expect(page.getByTestId("text-object")).toHaveCount(1);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
  });

  test("note tool can place note on top of an existing rectangle", async ({
    page,
  }) => {
    await createBoard(page, "Note Over Rect Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 400, 350);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Place note inside the rectangle
    await page.getByRole("button", { name: "Note" }).click();
    await page.mouse.click(box.x + 150, box.y + 150);

    await expect(page.getByTestId("note-object")).toHaveCount(1);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
  });

  // ── double-click in non-select mode must not open inline editor ─────────────

  test("double-clicking a text object in pen mode does not open inline editor", async ({
    page,
  }) => {
    await createBoard(page, "Pen DblClick No Edit Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Place a text object via the Text tool
    await page.getByRole("button", { name: "Text" }).click();
    await page.mouse.click(box.x + 300, box.y + 200);
    await expect(page.getByTestId("text-object")).toHaveCount(1);

    // Switch to Pen and double-click on the text object — must NOT open the editor
    await page.getByRole("button", { name: "Pen" }).click();
    await page.mouse.dblclick(box.x + 300, box.y + 200);
    await expect(page.getByTestId("inline-editor")).not.toBeVisible();
  });

  // ── select tool still works ──────────────────────────────────────────────────

  test("select tool still selects and drag-moves objects", async ({ page }) => {
    await createBoard(page, "Select Drag Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);
    const rect = page.getByTestId("rectangle-object");
    const origX = Number(await rect.getAttribute("x"));

    // Select then drag
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 175, box.y + 160);
    await page.mouse.down();
    await page.mouse.move(box.x + 275, box.y + 260, { steps: 5 });
    await page.mouse.up();

    const newX = Number(await rect.getAttribute("x"));
    expect(newX).toBeGreaterThan(origX);
  });

  // ── resize handles still work ────────────────────────────────────────────────

  test("resize handles resize without creating a new object", async ({
    page,
  }) => {
    await createBoard(page, "Resize No Create Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 300, 250);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

    // Select the rectangle to reveal resize handles
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 200, box.y + 175);
    await expect(page.getByTestId("resize-handle-se")).toBeVisible();

    const rect = page.getByTestId("rectangle-object");
    const origWidth = Number(await rect.getAttribute("width"));

    // Drag the SE handle
    const seHandle = page.getByTestId("resize-handle-se");
    const handleBox = await seHandle.boundingBox();
    if (!handleBox) throw new Error("SE handle not found");

    await page.mouse.move(handleBox.x + 3, handleBox.y + 3);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 53, handleBox.y + 53, { steps: 5 });
    await page.mouse.up();

    // Still only 1 rectangle, and it got wider
    await expect(page.getByTestId("rectangle-object")).toHaveCount(1);
    const newWidth = Number(await rect.getAttribute("width"));
    expect(newWidth).toBeGreaterThan(origWidth);
  });

  // ── marquee still starts from empty canvas ───────────────────────────────────

  test("marquee only starts from empty canvas in select mode", async ({
    page,
  }) => {
    await createBoard(page, "Marquee Empty Canvas Board");
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await drawRect(page, box, 100, 100, 250, 220);

    // Select tool — drag on EMPTY area should show marquee
    await page.getByRole("button", { name: "Select" }).click();
    const safeY = Math.floor(box.height * 0.6);
    await page.mouse.move(box.x + 500, box.y + safeY);
    await page.mouse.down();
    await page.mouse.move(box.x + 700, box.y + safeY + 80, { steps: 5 });
    await expect(page.getByTestId("marquee-selection")).toBeVisible();
    await page.mouse.up();
    await expect(page.getByTestId("marquee-selection")).not.toBeVisible();

    // Drag on the OBJECT should NOT start a marquee (starts a drag instead)
    await page.mouse.move(box.x + 175, box.y + 160);
    await page.mouse.down();
    await page.mouse.move(box.x + 225, box.y + 210, { steps: 5 });
    await expect(page.getByTestId("marquee-selection")).not.toBeVisible();
    await page.mouse.up();
  });
});
