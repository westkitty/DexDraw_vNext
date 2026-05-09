import { expect, test } from "@playwright/test";

test.describe("Multi-select and Grouped Delete", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("select multiple objects with Shift and delete them", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("gateway-enter").click();
    await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await page.getByLabel("Board name").fill("Multi Select Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");

    // 1. Create two rectangles
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // 2. Select both with Shift
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 150, box.y + 150); // First
    await page.keyboard.down("Shift");
    await page.mouse.click(box.x + 350, box.y + 150); // Second
    await page.keyboard.up("Shift");

    // 3. Delete them
    await page.keyboard.press("Delete");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(0);

    // 4. Undo the delete
    await page.keyboard.press("Control+z");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
  });

  test("drag multiple objects", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("gateway-enter").click();
    await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await page.getByLabel("Board name").fill("Multi Drag Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas missing");

    // Create two rectangles
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();

    const rects = page.getByTestId("rectangle-object");
    const firstX = await rects.nth(0).getAttribute("x");
    const secondX = await rects.nth(1).getAttribute("x");

    // Select both
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 150, box.y + 150);
    await page.keyboard.down("Shift");
    await page.mouse.click(box.x + 350, box.y + 150);
    await page.keyboard.up("Shift");

    // Drag both
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 150, { steps: 10 });
    await page.mouse.up();

    const firstXAfter = await rects.nth(0).getAttribute("x");
    const secondXAfter = await rects.nth(1).getAttribute("x");

    expect(Number(firstXAfter)).toBeGreaterThan(Number(firstX) + 50);
    expect(Number(secondXAfter)).toBeGreaterThan(Number(secondX) + 50);

    // Undo
    await page.keyboard.press("Control+z");
    await expect(rects.nth(0)).toHaveAttribute("x", firstX ?? "");
    await expect(rects.nth(1)).toHaveAttribute("x", secondX ?? "");
  });
});
