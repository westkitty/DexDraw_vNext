import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("post-gateway app shell defaults to dark theme", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();

  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId("app-shell")).toHaveAttribute(
    "data-app-theme",
    "dark",
  );
});

test("home surface uses dark paper and responsive interactive controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("gateway-enter").click();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 2000 });

  const shellBg = await page.locator(".shell").evaluate((element) => {
    const bg = window.getComputedStyle(element).backgroundImage;
    return bg;
  });
  expect(shellBg).toContain("radial-gradient");

  const createPanel = page.locator(".home-panel--create");
  const before = await createPanel.boundingBox();
  if (!before) throw new Error("Create panel bounds missing");
  await createPanel.hover();
  const after = await createPanel.boundingBox();
  if (!after) throw new Error("Create panel hover bounds missing");
  expect(after.y).toBeLessThan(before.y);

  const boardName = page.getByLabel("Board name");
  const inputBgBefore = await boardName.evaluate(
    (element) => window.getComputedStyle(element).boxShadow,
  );
  await boardName.hover();
  const inputBgAfter = await boardName.evaluate(
    (element) => window.getComputedStyle(element).boxShadow,
  );
  expect(inputBgAfter).not.toBe(inputBgBefore);
});
