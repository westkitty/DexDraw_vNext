import { expect, test } from "@playwright/test";

test("board title is shown in the header after creation", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("My Test Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  await expect(page.getByTestId("board-canvas")).toBeVisible();
  await expect(page.getByTestId("board-title")).toHaveText("My Test Board");
});

test("owner can rename board title inline", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("Original Title");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  await expect(page.getByTestId("board-canvas")).toBeVisible();
  await expect(page.getByTestId("board-title")).toHaveText("Original Title");

  // Click title to start editing
  await page.getByTestId("board-title").dispatchEvent("mousedown");
  const input = page.getByTestId("board-title-input");
  await expect(input).toBeVisible();

  // Replace with new title and press Enter
  await input.fill("Renamed Title");
  await input.press("Enter");

  await expect(page.getByTestId("board-title")).toHaveText("Renamed Title");
});

test("renamed title persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("Persist Title");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  await expect(page.getByTestId("board-canvas")).toBeVisible();
  await expect(page.getByTestId("board-title")).toHaveText("Persist Title");

  // Rename
  await page.getByTestId("board-title").dispatchEvent("mousedown");
  await page.getByTestId("board-title-input").fill("New Persisted Title");
  await page.getByTestId("board-title-input").press("Enter");
  await expect(page.getByTestId("board-title")).toHaveText(
    "New Persisted Title",
  );

  // Reload page
  await page.reload();
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId("board-canvas")).toBeVisible();
  await expect(page.getByTestId("board-title")).toHaveText(
    "New Persisted Title",
  );
});

test("title update is broadcast to second connected client", async ({
  browser,
  page,
}) => {
  // Owner creates board
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await page.getByLabel("Board name").fill("Shared Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  const boardId = await page.getByTestId("board-id").textContent();
  const shareCode = await page.getByTestId("share-code").textContent();

  // Guest joins
  const guest = await browser.newPage();
  await guest.goto("/");
  await guest.getByTestId("gateway-enter").click();
  await expect(guest.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await guest.getByLabel("Join board ID").fill(boardId ?? "");
  await guest.getByLabel("Join share code").fill(shareCode ?? "");
  await guest.getByLabel("Join display name").fill("Guest");
  await guest.getByRole("button", { name: "Join board" }).click();
  await expect(guest.getByTestId("board-canvas")).toBeVisible();

  // Owner renames board
  await page.getByTestId("board-title").dispatchEvent("mousedown");
  await page.getByTestId("board-title-input").fill("Broadcast Title");
  await page.getByTestId("board-title-input").press("Enter");

  // Guest should see the updated title via WS broadcast
  await expect(guest.getByTestId("board-title")).toHaveText("Broadcast Title", {
    timeout: 5000,
  });
});
