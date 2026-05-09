import { expect, test } from "@playwright/test";

test.describe("Drag-to-move", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("select tool + drag moves a rectangle", async ({ page, browser }) => {
    // Client A: Create board and rectangle
    await page.goto("/");
    await page.getByTestId("gateway-enter").click();
    await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await page.getByLabel("Board name").fill("Drag Test Board");
    await page.getByLabel("Your name").fill("Client A");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-id")).toBeVisible();

    const boardId = await page.getByTestId("board-id").innerText();
    const shareCode = await page.getByTestId("share-code").innerText();

    await page.getByRole("button", { name: "Rectangle" }).click();
    const canvas = page.getByTestId("board-canvas");

    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 300, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("rectangle-object")).toBeVisible();
    const rectA = page.getByTestId("rectangle-object");
    const rectAX = await rectA.getAttribute("x");
    const rectAY = await rectA.getAttribute("y");

    // Client B: Join and verify rectangle
    const contextB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const pageB = await contextB.newPage();
    await pageB.goto("/");
    await pageB.getByTestId("gateway-enter").click();
    await expect(pageB.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await pageB.getByLabel("Join board ID").fill(boardId);
    await pageB.getByLabel("Join share code").fill(shareCode);
    await pageB.getByLabel("Join display name").fill("Client B");
    await pageB.getByRole("button", { name: "Join board" }).click();

    await expect(pageB.getByTestId("rectangle-object")).toBeVisible();
    const rectB = pageB.getByTestId("rectangle-object");
    await expect(rectB).toHaveAttribute("x", rectAX ?? "");
    await expect(rectB).toHaveAttribute("y", rectAY ?? "");

    // Client A: Drag the rectangle
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 });
    await page.mouse.up();

    const rectAXAfter = await rectA.getAttribute("x");
    expect(Number(rectAXAfter)).toBeGreaterThan(Number(rectAX) + 50);

    // Client B: Verify move sync
    await expect(rectB).toHaveAttribute("x", rectAXAfter ?? "");

    // Client A: Undo the move
    await page.keyboard.press("Control+z");
    await expect(rectA).toHaveAttribute("x", rectAX ?? "");

    // Client B: Verify undo sync
    await expect(rectB).toHaveAttribute("x", rectAX ?? "");
  });

  test("select tool + drag moves a text object", async ({ page, browser }) => {
    await page.goto("/");
    await page.getByTestId("gateway-enter").click();
    await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await page.getByLabel("Board name").fill("Text Drag Board");
    await page.getByLabel("Your name").fill("Client A");
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-id")).toBeVisible();

    const boardId = await page.getByTestId("board-id").innerText();
    const shareCode = await page.getByTestId("share-code").innerText();

    await page.getByRole("button", { name: "Text" }).click();
    const canvas = page.getByTestId("board-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await page.mouse.click(box.x + 400, box.y + 400);
    await expect(page.getByTestId("text-object")).toBeVisible();
    const textA = page.getByTestId("text-object");
    const textAX = await textA.getAttribute("x");

    // Client B: Join
    const contextB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const pageB = await contextB.newPage();
    await pageB.goto("/");
    await pageB.getByTestId("gateway-enter").click();
    await expect(pageB.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
    await pageB.getByLabel("Join board ID").fill(boardId);
    await pageB.getByLabel("Join share code").fill(shareCode);
    await pageB.getByLabel("Join display name").fill("Client B");
    await pageB.getByRole("button", { name: "Join board" }).click();

    await expect(pageB.getByTestId("text-object")).toBeVisible();
    const textB = pageB.getByTestId("text-object");

    // Client A: Drag the text
    await page.getByRole("button", { name: "Select" }).click();
    await page.mouse.move(box.x + 400, box.y + 400);
    await page.mouse.down();
    await page.mouse.move(box.x + 600, box.y + 500, { steps: 10 });
    await page.mouse.up();

    const textAXAfter = await textA.getAttribute("x");
    expect(Number(textAXAfter)).toBeGreaterThan(Number(textAX) + 20);

    // Client B: Verify move sync
    await expect(textB).toHaveAttribute("x", textAXAfter ?? "");

    // Client A: Undo
    await page.keyboard.press("Control+z");
    await expect(textA).toHaveAttribute("x", textAX ?? "");
    await expect(textB).toHaveAttribute("x", textAX ?? "");
  });
});
