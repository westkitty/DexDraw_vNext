import { expect, test } from "@playwright/test";

test.describe("Resize handles", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("rectangle resize persists and syncs to another client", async ({
    page,
    browser,
  }) => {
    // Client A: create board + rectangle
    await page.goto("/");
    await page.getByLabel("Board name").fill("Resize Sync Board");
    await page.getByLabel("Your name").fill("Client A");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-id")).toBeVisible();

    const boardId = await page.getByTestId("board-id").innerText();
    const shareCode = await page.getByTestId("share-code").innerText();

    await page.getByRole("button", { name: "Rectangle" }).click();
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw a rectangle
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toBeVisible();
    const rect = page.getByTestId("rectangle-object");
    const origWidth = await rect.getAttribute("width");
    const origHeight = await rect.getAttribute("height");

    // Client B: join and verify initial size
    const contextB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const pageB = await contextB.newPage();
    await pageB.goto("/");
    await pageB.getByLabel("Join board ID").fill(boardId);
    await pageB.getByLabel("Join share code").fill(shareCode);
    await pageB.getByLabel("Join display name").fill("Client B");
    await pageB.getByRole("button", { name: "Join board" }).click();
    await expect(pageB.getByTestId("rectangle-object")).toBeVisible();
    const rectB = pageB.getByTestId("rectangle-object");
    await expect(rectB).toHaveAttribute("width", origWidth ?? "");

    // Client A: select the rectangle and resize via SE handle
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 300, box.y + 275);
    await expect(page.getByTestId("resize-handle-se")).toBeVisible();

    const seHandle = page.getByTestId("resize-handle-se");
    const handleBox = await seHandle.boundingBox();
    if (!handleBox) throw new Error("SE handle not found");

    const hcx = handleBox.x + handleBox.width / 2;
    const hcy = handleBox.y + handleBox.height / 2;
    await page.mouse.move(hcx, hcy);
    await page.mouse.down();
    await page.mouse.move(hcx + 80, hcy + 60, { steps: 10 });
    await page.mouse.up();

    const newWidth = await rect.getAttribute("width");
    expect(Number(newWidth)).toBeGreaterThan(Number(origWidth) + 20);

    // Client B: verify resize synced
    await expect(rectB).toHaveAttribute("width", newWidth ?? "");

    // Reload Client A and verify persistence
    await page.reload();
    await expect(page.getByTestId("rectangle-object")).toBeVisible();
    const rectAfterReload = page.getByTestId("rectangle-object");
    await expect(rectAfterReload).toHaveAttribute("width", newWidth ?? "");

    await contextB.close();
  });

  test("note resize persists", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("Note Resize Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Create a note
    await page.getByRole("button", { name: "Note" }).click();
    await page.mouse.click(box.x + 400, box.y + 300);
    await expect(page.getByTestId("note-object")).toBeVisible();

    // Find the note's background rect (first rect inside the note group)
    const noteGroup = page.getByTestId("note-object");
    const noteRect = noteGroup.locator("rect").first();
    const origWidth = await noteRect.getAttribute("width");

    // Select and resize via SE handle
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 400, box.y + 300);
    await expect(page.getByTestId("resize-handle-se")).toBeVisible();

    const seHandle = page.getByTestId("resize-handle-se");
    const handleBox = await seHandle.boundingBox();
    if (!handleBox) throw new Error("SE handle not found");

    const hcx = handleBox.x + handleBox.width / 2;
    const hcy = handleBox.y + handleBox.height / 2;
    await page.mouse.move(hcx, hcy);
    await page.mouse.down();
    await page.mouse.move(hcx + 60, hcy + 40, { steps: 10 });
    await page.mouse.up();

    const newWidth = await noteRect.getAttribute("width");
    expect(Number(newWidth)).toBeGreaterThan(Number(origWidth) + 10);

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByTestId("note-object")).toBeVisible();
    const reloadedNoteRect = page
      .getByTestId("note-object")
      .locator("rect")
      .first();
    await expect(reloadedNoteRect).toHaveAttribute("width", newWidth ?? "");
  });

  test("undo and redo work after resize", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("Resize Undo Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw a rectangle
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toBeVisible();
    const rect = page.getByTestId("rectangle-object");
    const origWidth = await rect.getAttribute("width");
    const origHeight = await rect.getAttribute("height");
    const origX = await rect.getAttribute("x");
    const origY = await rect.getAttribute("y");

    // Select and resize via SE handle
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 300, box.y + 275);
    await expect(page.getByTestId("resize-handle-se")).toBeVisible();

    const seHandle = page.getByTestId("resize-handle-se");
    const handleBox = await seHandle.boundingBox();
    if (!handleBox) throw new Error("SE handle not found");

    const hcx = handleBox.x + handleBox.width / 2;
    const hcy = handleBox.y + handleBox.height / 2;
    await page.mouse.move(hcx, hcy);
    await page.mouse.down();
    await page.mouse.move(hcx + 80, hcy + 60, { steps: 10 });
    await page.mouse.up();

    const newWidth = await rect.getAttribute("width");
    expect(Number(newWidth)).toBeGreaterThan(Number(origWidth) + 20);

    // Undo — should revert to original size
    await page.keyboard.press("Control+z");
    await expect(rect).toHaveAttribute("width", origWidth ?? "");
    await expect(rect).toHaveAttribute("height", origHeight ?? "");
    await expect(rect).toHaveAttribute("x", origX ?? "");
    await expect(rect).toHaveAttribute("y", origY ?? "");

    // Redo — should re-apply the resize
    await page.keyboard.press("Control+y");
    await expect(rect).toHaveAttribute("width", newWidth ?? "");
  });

  test("multi-select does not show resize handles", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("No Handles Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Create two rectangles
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200, { steps: 3 });
    await page.mouse.up();

    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200, { steps: 3 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Select both with shift-click
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 150, box.y + 150);
    await page.keyboard.down("Shift");
    await page.mouse.click(box.x + 350, box.y + 150);
    await page.keyboard.up("Shift");

    // No resize handles should appear for multi-select
    await expect(page.getByTestId("resize-handle-se")).not.toBeVisible();
    await expect(page.getByTestId("resize-handle-nw")).not.toBeVisible();
  });
});
