import { expect, test } from "@playwright/test";

// Override the default storageState so the gateway is not pre-bypassed
test.use({ storageState: { cookies: [], origins: [] } });

test("gateway screen is shown before the app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("gateway-screen")).toBeVisible();
  await expect(page.getByTestId("app-shell")).not.toBeVisible();
});

test("clicking Enter hides gateway and reveals app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("gateway-screen")).toBeVisible();
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId("gateway-screen")).not.toBeVisible();
});

test("gateway video uses local source path", async ({ page }) => {
  await page.goto("/");
  const src = await page.getByTestId("gateway-video").getAttribute("src");
  expect(src).toBe("/DexDraw_Opening.mp4");
});

test("gateway is shown again on every fresh app load", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });

  // A fresh app load must always pass through the animated gateway.
  await page.goto("/");
  await expect(page.getByTestId("gateway-screen")).toBeVisible();
  await expect(page.getByTestId("app-shell")).not.toBeVisible();
});

test("board page works after entering through gateway", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });

  await page.getByLabel("Board name").fill("Gateway Flow Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();
  await expect(page.getByTestId("metrics-strip")).toBeVisible();
});

test("metrics strip updates object count after drawing", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });

  await page.getByLabel("Board name").fill("Metrics Object Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Initially 0 objects
  await expect(page.getByTestId("metric-objects")).toContainText("0");

  // Draw a rectangle
  await page.getByRole("button", { name: "Rectangle" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");
  await page.mouse.move(box.x + 520, box.y + 260);
  await page.mouse.down();
  await page.mouse.move(box.x + 680, box.y + 380, { steps: 5 });
  await page.mouse.up();

  await expect(page.getByTestId("metric-objects")).toContainText("1");
});

test("metrics strip updates selected count after selecting", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });

  await page.getByLabel("Board name").fill("Metrics Select Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Draw a rectangle
  await page.getByRole("button", { name: "Rectangle" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");
  await page.mouse.move(box.x + 520, box.y + 260);
  await page.mouse.down();
  await page.mouse.move(box.x + 680, box.y + 380, { steps: 5 });
  await page.mouse.up();

  // Before selecting: selected count is 0
  await page.getByRole("button", { name: "Select" }).click();
  await expect(page.getByTestId("metric-selected")).toContainText("0");

  // Select the rectangle
  await page.getByTestId("rectangle-object").click();
  await expect(page.getByTestId("metric-selected")).toContainText("1");
});

test("no external network requests are made on the board page", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (
      !url.startsWith("http://127.0.0.1") &&
      !url.startsWith("http://localhost") &&
      !url.startsWith("ws://127.0.0.1") &&
      !url.startsWith("ws://localhost")
    ) {
      externalRequests.push(url);
    }
  });

  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });

  await page.getByLabel("Board name").fill("Offline Audit Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByTestId("board-canvas")).toBeVisible();

  // Draw something to exercise the full render path
  await page.getByRole("button", { name: "Rectangle" }).click();
  const canvas = page.getByTestId("board-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 250, box.y + 200, { steps: 5 });
  await page.mouse.up();

  expect(
    externalRequests,
    `External requests detected: ${externalRequests.join(", ")}`,
  ).toHaveLength(0);
});
