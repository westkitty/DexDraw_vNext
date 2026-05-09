import { expect, test } from "@playwright/test";

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
}

test.describe("responsive layout smoke", () => {
  test("mobile toolbar uses controlled horizontal scrolling and FAQ modal fits", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await createBoard(page, "Mobile Layout Board");

    const toolbar = page.locator(".toolbar").first();
    await expect(toolbar).toBeVisible();

    const fitsViewport = await toolbar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth;
    });
    expect(fitsViewport).toBe(true);

    await page.getByRole("button", { name: "Tools FAQ" }).click();
    const dialog = page.getByRole("dialog", { name: "Tools FAQ" });
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    if (!box) throw new Error("FAQ dialog bounds missing");
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
  });

  test("tablet board shell avoids obvious horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await createBoard(page, "Tablet Layout Board");

    const widthFits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(widthFits).toBe(true);
  });

  test("desktop board shell keeps key controls visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await createBoard(page, "Desktop Layout Board");

    await expect(page.getByTestId("board-title")).toBeVisible();
    await expect(page.getByTestId("presence-panel")).toBeVisible();
    await expect(page.getByTestId("metrics-strip")).toBeVisible();
  });

  test("desktop board chrome uses draggable side panels", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await createBoard(page, "Draggable Chrome Board");

    await expect(page.getByTestId("chrome-panel-tools")).toBeVisible();
    await expect(page.getByTestId("chrome-panel-status")).toBeVisible();

    const handle = page.getByTestId("chrome-drag-tools");
    await expect(handle).toBeVisible();
    const before = await handle.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });

    await page.mouse.move(
      before.x + before.width / 2,
      before.y + before.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(620, 320, { steps: 8 });
    await page.mouse.up();

    const after = await handle.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });
    expect(Math.abs(after.x - before.x)).toBeGreaterThan(20);
  });
});
