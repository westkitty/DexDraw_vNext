import { expect, test } from "@playwright/test";

test("inline text editing commits and persists", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Edit Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Place a text object
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) throw new Error("canvas bounds missing");

  await page.mouse.click(box.x + 300, box.y + 200);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  // Switch to Select, then double-click to open inline editor
  await page.getByRole("button", { name: "Select" }).click();
  await page.mouse.dblclick(box.x + 300, box.y + 200);
  const editor = page.getByTestId("inline-editor");
  await expect(editor).toBeVisible();

  // Type new content
  await editor.fill("Hello Board");
  await editor.press("Enter");

  // Editor should close and SVG text should show new content
  await expect(editor).not.toBeVisible();
  await expect(page.getByTestId("text-object")).toContainText("Hello Board");

  // Reload and verify persistence
  await page.reload();
  await expect(page.getByTestId("text-object")).toHaveCount(1);
  await expect(page.getByTestId("text-object")).toContainText("Hello Board");
});

test("inline note editing commits and persists", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Note Edit Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Place a note object
  await page.getByRole("button", { name: "Note" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) throw new Error("canvas bounds missing");

  await page.mouse.click(box.x + 400, box.y + 300);
  await expect(page.getByTestId("note-object")).toHaveCount(1);

  // Switch to Select, then double-click to open inline editor
  await page.getByRole("button", { name: "Select" }).click();
  await page.mouse.dblclick(box.x + 400, box.y + 320);
  const editor = page.getByTestId("inline-editor");
  await expect(editor).toBeVisible();

  // Type new content (notes allow newlines; use Ctrl+Enter to commit)
  await editor.fill("My note text");
  await editor.press("Control+Enter");

  await expect(editor).not.toBeVisible();
  await expect(page.getByTestId("note-object")).toContainText("My note text");

  // Reload and verify persistence
  await page.reload();
  await expect(page.getByTestId("note-object")).toHaveCount(1);
  await expect(page.getByTestId("note-object")).toContainText("My note text");
});

test("Escape cancels inline editing without changing content", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Cancel Edit Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");

  await page.mouse.click(box.x + 300, box.y + 200);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  // Switch to Select, then open inline editor
  await page.getByRole("button", { name: "Select" }).click();
  await page.mouse.dblclick(box.x + 300, box.y + 200);
  const editor = page.getByTestId("inline-editor");
  await expect(editor).toBeVisible();

  // Type something then Escape
  await editor.fill("Should not appear");
  await editor.press("Escape");

  await expect(editor).not.toBeVisible();
  // Original default text should remain
  await expect(page.getByTestId("text-object")).toContainText("Text");
});
