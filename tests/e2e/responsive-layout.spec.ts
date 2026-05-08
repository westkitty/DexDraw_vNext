import { expect, test } from "@playwright/test";

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

test.describe("responsive layout smoke", () => {
  test("mobile toolbar uses controlled horizontal scrolling and FAQ modal fits", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await createBoard(page, "Mobile Layout Board");

    const toolbar = page.locator(".toolbar");
    await expect(toolbar).toBeVisible();

    const overflowX = await toolbar.evaluate(
      (element) => window.getComputedStyle(element).overflowX,
    );
    expect(["auto", "scroll"]).toContain(overflowX);

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
});
