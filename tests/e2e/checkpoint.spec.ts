import { expect, test } from "@playwright/test";

test("create checkpoint and restore it removes objects added after checkpoint", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("Checkpoint Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Draw a text object — this will be in the checkpoint
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.click(box.x + 200, box.y + 150);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  // Save checkpoint
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("prompt");
    await dialog.accept("v1 — before second object");
  });
  await page.getByRole("button", { name: "Save Checkpoint" }).click();

  // Wait for checkpoint to be acknowledged (checkpoint selector appears)
  await expect(page.getByTestId("checkpoint-select")).toBeVisible();

  // Add another text object after the checkpoint
  await page.getByRole("button", { name: "Text" }).click();
  await page.mouse.click(box.x + 500, box.y + 300);
  await expect(page.getByTestId("text-object")).toHaveCount(2);

  // Restore the checkpoint — the second object should disappear
  await page.getByTestId("checkpoint-select").selectOption({ index: 0 });
  page.once("dialog", async (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByTestId("text-object")).toHaveCount(1);
});

test("checkpoint state persists across page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("Persist Checkpoint Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Create text object and checkpoint
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.click(box.x + 200, box.y + 150);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  page.once("dialog", async (dialog) => dialog.accept("saved checkpoint"));
  await page.getByRole("button", { name: "Save Checkpoint" }).click();
  await expect(page.getByTestId("checkpoint-select")).toBeVisible();

  // Reload — checkpoint list should still appear
  await page.reload();
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId("checkpoint-select")).toBeVisible();
});

test("Markdown export downloads a .md file", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("Export MD Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Create text + note objects
  await page.getByRole("button", { name: "Text" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.click(box.x + 200, box.y + 150);
  await expect(page.getByTestId("text-object")).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Markdown" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.md$/);
});

test("PDF export opens a print window", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("Export PDF Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Create a stroke so export is not disabled
  await page.getByRole("button", { name: "Pen" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounds missing");
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 150, { steps: 5 });
  await page.mouse.up();

  // PDF export opens a new page
  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    page.getByRole("button", { name: "Export PDF" }).click(),
  ]);
  expect(newPage).toBeTruthy();
  await newPage.close();
});
