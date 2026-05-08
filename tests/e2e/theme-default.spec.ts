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
