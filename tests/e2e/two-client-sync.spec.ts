import { expect, test } from "@playwright/test";

test("two clients sync one persisted stroke", async ({ browser, page }) => {
  await page.goto("/");

  await page.getByLabel("Board name").fill("Planning Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  await expect(page.getByTestId("board-canvas")).toBeVisible();

  const boardId = await page.getByTestId("board-id").textContent();
  const shareCode = await page.getByTestId("share-code").textContent();

  expect(boardId).toBeTruthy();
  expect(shareCode).toBeTruthy();

  const secondPage = await browser.newPage();
  await secondPage.goto("/");
  await secondPage.getByLabel("Join board ID").fill(boardId ?? "");
  await secondPage.getByLabel("Join share code").fill(shareCode ?? "");
  await secondPage.getByLabel("Join display name").fill("Guest");
  await secondPage.getByRole("button", { name: "Join board" }).click();

  await expect(secondPage.getByTestId("board-canvas")).toBeVisible();

  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();

  if (!box) {
    throw new Error("Canvas bounds missing");
  }

  await page.mouse.move(box.x + 80, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 150, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId("stroke-object")).toHaveCount(1);
  await expect(secondPage.getByTestId("stroke-object")).toHaveCount(1);

  await secondPage.reload();
  await expect(secondPage.getByTestId("stroke-object")).toHaveCount(1);
});

test("rectangle and text tools create durable objects", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Board name").fill("Tools Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) {
    throw new Error("Canvas bounds missing");
  }

  await page.getByRole("button", { name: "Rectangle" }).click();
  await page.mouse.move(box.x + 220, box.y + 120);
  await page.mouse.down();
  await page.mouse.move(box.x + 360, box.y + 240, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByTestId("rectangle-object")).toHaveCount(1);

  await page.getByRole("button", { name: "Text" }).click();
  await page.mouse.click(box.x + 400, box.y + 200);
  await expect(page.getByTestId("text-object")).toHaveCount(1);
});

test("presence and PNG export work", async ({ browser, page }) => {
  await page.goto("/");

  await page.getByLabel("Board name").fill("Presence Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  const boardId = await page.getByTestId("board-id").textContent();
  const shareCode = await page.getByTestId("share-code").textContent();
  const secondPage = await browser.newPage();
  await secondPage.goto("/");
  await secondPage.getByLabel("Join board ID").fill(boardId ?? "");
  await secondPage.getByLabel("Join share code").fill(shareCode ?? "");
  await secondPage.getByLabel("Join display name").fill("Guest");
  await secondPage.getByRole("button", { name: "Join board" }).click();

  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) {
    throw new Error("Canvas bounds missing");
  }

  await page.mouse.move(box.x + 150, box.y + 150);
  await expect(secondPage.getByTestId("remote-cursor")).toHaveCount(1);

  await page.getByRole("button", { name: "Laser" }).click();
  await page.mouse.move(box.x + 280, box.y + 180);
  await expect(secondPage.getByTestId("remote-laser")).toHaveCount(1);

  await page.getByRole("button", { name: "Pen" }).click();
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 170, { steps: 5 });
  await page.mouse.up();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain(".png");
});
