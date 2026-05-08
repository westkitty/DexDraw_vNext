import { expect, test } from "@playwright/test";

test("home surface uses DexDraw branding without vNext copy", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "DexDraw", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle("DexDraw");
  await expect(page.getByText(/vnext/i)).toHaveCount(0);
});

test("home surface drops legacy repository comparison copy", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText(/repository a/i)).toHaveCount(0);
  await expect(page.getByText(/repository b/i)).toHaveCount(0);
  await expect(page.getByText(/fewer bad habits/i)).toHaveCount(0);
  await expect(page.getByText(/^bad habits$/i)).toHaveCount(0);
});
