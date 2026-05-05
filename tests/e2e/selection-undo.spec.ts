import { expect, test } from "@playwright/test";

test("Select tool selects and Delete key removes an object", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Select Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Create a text object
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.click(box.x + 300, box.y + 200);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  // Switch to Select tool and click the text object
  await page.getByRole("button", { name: "Select" }).click();
  await page.mouse.click(box.x + 300, box.y + 200);

  // Press Delete — the text object should be removed
  await page.keyboard.press("Delete");
  await expect(page.getByTestId("text-object")).toHaveCount(0);
});

test("Ctrl+Z undoes a delete and Ctrl+Y redoes it", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Undo Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Create a text object
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.click(box.x + 300, box.y + 200);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  // Delete via Select + keyboard
  await page.getByRole("button", { name: "Select" }).click();
  await page.mouse.click(box.x + 300, box.y + 200);
  await page.keyboard.press("Delete");
  await expect(page.getByTestId("text-object")).toHaveCount(0);

  // Undo — object should come back
  await page.keyboard.press("Control+z");
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  // Redo — object should be deleted again
  await page.keyboard.press("Control+y");
  await expect(page.getByTestId("text-object")).toHaveCount(0);
});

test("Ctrl+Z undoes object.create", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Undo Create Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Create a text object
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.click(box.x + 300, box.y + 200);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  // Undo the create — object should vanish
  await page.keyboard.press("Control+z");
  await expect(page.getByTestId("text-object")).toHaveCount(0);

  // Redo — object should come back
  await page.keyboard.press("Control+y");
  await expect(page.getByTestId("text-object")).toHaveCount(1);
});

test("Undo and Redo buttons have correct disabled state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Button State Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Both Undo and Redo should start disabled
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();

  // Create a text object — Undo should become enabled
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.click(box.x + 300, box.y + 200);

  await expect(page.getByRole("button", { name: "Undo" })).not.toBeDisabled();
  await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();

  // Click Undo — Redo should become enabled, Undo goes back to disabled
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Redo" })).not.toBeDisabled();
});
