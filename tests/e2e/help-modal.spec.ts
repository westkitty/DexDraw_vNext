import { expect, test } from "@playwright/test";

test("toolbar FAQ opens from an accessible trigger and closes on Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Board name").fill("Tools FAQ Board");
  await page.getByLabel("Your name").fill("Owner");
  await page.getByRole("button", { name: "Create board" }).click();

  await expect(page.getByTestId("board-canvas")).toBeVisible();

  const trigger = page.getByRole("button", { name: "Tools FAQ" });
  await expect(trigger).toBeVisible();

  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Tools FAQ" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Tools FAQ" }),
  ).not.toBeVisible();
});
