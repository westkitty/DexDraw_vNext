import { expect, test } from "@playwright/test";

test.describe("marquee selection", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("drag around two objects selects both", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("Marquee Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw two rectangles side by side
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 260, box.y + 230, { steps: 5 });
    await page.mouse.up();

    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 460, box.y + 230, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Switch to select and marquee-drag around both rectangles
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 520, box.y + 280, { steps: 10 });

    await expect(page.getByTestId("marquee-selection")).toBeVisible();

    await page.mouse.up();

    // Both selection rings should appear
    const rings = page.locator(
      "[data-testid='board-canvas'] rect[stroke='#f97316']",
    );
    await expect(rings).toHaveCount(2);
  });

  test("marquee then grouped delete then undo restores objects", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("Marquee Delete Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw two rectangles
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 260, box.y + 230, { steps: 5 });
    await page.mouse.up();

    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 460, box.y + 230, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Marquee-select both
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 520, box.y + 280, { steps: 10 });
    await page.mouse.up();

    // Delete
    await page.keyboard.press("Delete");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(0);

    // Undo
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);
  });

  test("marquee then grouped drag moves all selected objects", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("Marquee Drag Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw two rectangles
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 260, box.y + 230, { steps: 5 });
    await page.mouse.up();

    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 460, box.y + 230, { steps: 5 });
    await page.mouse.up();

    // Marquee-select both
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 520, box.y + 280, { steps: 10 });
    await page.mouse.up();

    const rings = page.locator(
      "[data-testid='board-canvas'] rect[stroke='#f97316']",
    );
    await expect(rings).toHaveCount(2);

    // Grab first rect and drag both together
    const rect1 = page.getByTestId("rectangle-object").first();
    const r1box = await rect1.boundingBox();
    if (!r1box) throw new Error("Rect 1 not found");

    const dragFromX = r1box.x + r1box.width / 2;
    const dragFromY = r1box.y + r1box.height / 2;
    await page.mouse.move(dragFromX, dragFromY);
    await page.mouse.down();
    await page.mouse.move(dragFromX + 100, dragFromY + 100, { steps: 10 });
    await page.mouse.up();

    // Still two selection rings after drag
    await expect(rings).toHaveCount(2);
  });

  test("dragging on an object starts object drag, not marquee", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("No Marquee Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw a rectangle
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 450, box.y + 400, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toBeVisible();

    // Select the object
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 375, box.y + 350);

    // Drag from inside the object — marquee must NOT appear
    await page.mouse.move(box.x + 375, box.y + 350);
    await page.mouse.down();
    await page.mouse.move(box.x + 475, box.y + 450, { steps: 10 });

    await expect(page.getByTestId("marquee-selection")).not.toBeVisible();

    await page.mouse.up();
  });

  test("non-select tools do not show marquee", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("Pen No Marquee");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Pen tool drag
    await page.getByRole("button", { name: "Pen" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 });

    await expect(page.getByTestId("marquee-selection")).not.toBeVisible();

    await page.mouse.up();
  });

  test("Shift-marquee adds to existing selection", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Board name").fill("Shift Marquee Board");
    await page.getByLabel("Your name").fill("Owner");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw two rectangles far apart
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 180, { steps: 5 });
    await page.mouse.up();

    await page.mouse.move(box.x + 600, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 700, box.y + 180, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toHaveCount(2);

    // Click-select the first rectangle
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.click(box.x + 150, box.y + 140);

    const rings = page.locator(
      "[data-testid='board-canvas'] rect[stroke='#f97316']",
    );
    await expect(rings).toHaveCount(1);

    // Shift-marquee around the second rectangle
    await page.keyboard.down("Shift");
    await page.mouse.move(box.x + 560, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 740, box.y + 220, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up("Shift");

    // Both rectangles should now be selected
    await expect(rings).toHaveCount(2);
  });
});
