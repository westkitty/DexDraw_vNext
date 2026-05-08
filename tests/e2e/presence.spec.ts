import { expect, test } from "@playwright/test";

test.describe("presence UI", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  async function createBoard(
    page: import("@playwright/test").Page,
    name: string,
    userName: string,
  ) {
    await page.goto("/");
    await page.getByLabel("Board name").fill(name);
    await page.getByLabel("Your name").fill(userName);
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();
    const boardId = await page.getByTestId("board-id").innerText();
    const shareCode = await page.getByTestId("share-code").innerText();
    return { boardId, shareCode };
  }

  async function joinBoard(
    page: import("@playwright/test").Page,
    boardId: string,
    shareCode: string,
    userName: string,
  ) {
    await page.goto("/");
    await page.getByLabel("Join board ID").fill(boardId);
    await page.getByLabel("Join share code").fill(shareCode);
    await page.getByLabel("Join display name").fill(userName);
    await page.getByRole("button", { name: "Join board" }).click();
    await expect(page.getByTestId("board-canvas")).toBeVisible();
  }

  test("presence panel shows on board page", async ({ page }) => {
    await createBoard(page, "Presence Panel Board", "Alice");
    await expect(page.getByTestId("presence-panel")).toBeVisible();
    await expect(page.getByTestId("presence-count")).toHaveText("1");
    await expect(
      page.getByTestId("presence-participant").first(),
    ).toBeVisible();
  });

  test("two clients join and both appear in presence panel", async ({
    page,
    browser,
  }) => {
    const { boardId, shareCode } = await createBoard(
      page,
      "Two Client Presence Board",
      "Alice",
    );

    // Client A sees only itself initially
    await expect(page.getByTestId("presence-count")).toHaveText("1");

    // Client B joins
    const ctxB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    await ctxB.addInitScript(() => {
      localStorage.setItem("dexdraw-entered", "1");
    });
    const pageB = await ctxB.newPage();
    await joinBoard(pageB, boardId, shareCode, "Bob");

    // Client B should also see the presence panel
    await expect(pageB.getByTestId("presence-panel")).toBeVisible();

    // Move cursor in Client B to trigger a presence message to Client A
    const canvasB = pageB.getByTestId("board-canvas");
    const boxB = await canvasB.boundingBox();
    if (!boxB) throw new Error("Canvas not found");
    await pageB.mouse.move(boxB.x + 300, boxB.y + 200);

    // Client A should now see 2 participants (allow extra time for WS relay under load)
    await expect(page.getByTestId("presence-count")).toHaveText("2", {
      timeout: 10_000,
    });
    await expect(page.getByTestId("presence-participant")).toHaveCount(2);

    await ctxB.close();
  });

  test("moving client B cursor shows labeled cursor in client A", async ({
    page,
    browser,
  }) => {
    const { boardId, shareCode } = await createBoard(
      page,
      "Cursor Label Board",
      "Alice",
    );

    const ctxB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    await ctxB.addInitScript(() => {
      localStorage.setItem("dexdraw-entered", "1");
    });
    const pageB = await ctxB.newPage();
    await joinBoard(pageB, boardId, shareCode, "Bob");

    // Move cursor in B
    const canvasB = pageB.getByTestId("board-canvas");
    const boxB = await canvasB.boundingBox();
    if (!boxB) throw new Error("Canvas not found");
    await pageB.mouse.move(boxB.x + 400, boxB.y + 300);

    // Client A should see a remote cursor with Bob's label
    await expect(page.getByTestId("remote-cursor")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("remote-cursor-label")).toContainText("Bob");

    await ctxB.close();
  });

  test("client B laser mode shows labeled laser in client A", async ({
    page,
    browser,
  }) => {
    const { boardId, shareCode } = await createBoard(
      page,
      "Laser Label Board",
      "Alice",
    );

    const ctxB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    await ctxB.addInitScript(() => {
      localStorage.setItem("dexdraw-entered", "1");
    });
    const pageB = await ctxB.newPage();
    await joinBoard(pageB, boardId, shareCode, "Bob");

    // B activates laser tool and moves
    await pageB.getByRole("button", { name: "Laser" }).click();
    const canvasB = pageB.getByTestId("board-canvas");
    const boxB = await canvasB.boundingBox();
    if (!boxB) throw new Error("Canvas not found");
    await pageB.mouse.move(boxB.x + 300, boxB.y + 200);
    await pageB.mouse.down();
    await pageB.mouse.move(boxB.x + 400, boxB.y + 250, { steps: 3 });

    // Client A should see a laser with Bob's label
    await expect(page.getByTestId("remote-laser")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("remote-laser-label")).toContainText("Bob");

    await pageB.mouse.up();
    await ctxB.close();
  });

  test("presence actions do not create durable board objects", async ({
    page,
    browser,
  }) => {
    const { boardId, shareCode } = await createBoard(
      page,
      "Presence No Objects Board",
      "Alice",
    );

    const ctxB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    await ctxB.addInitScript(() => {
      localStorage.setItem("dexdraw-entered", "1");
    });
    const pageB = await ctxB.newPage();
    await joinBoard(pageB, boardId, shareCode, "Bob");

    // B moves cursor and uses laser
    const canvasB = pageB.getByTestId("board-canvas");
    const boxB = await canvasB.boundingBox();
    if (!boxB) throw new Error("Canvas not found");
    await pageB.mouse.move(boxB.x + 300, boxB.y + 200);
    await pageB.getByRole("button", { name: "Laser" }).click();
    await pageB.mouse.down();
    await pageB.mouse.move(boxB.x + 450, boxB.y + 300, { steps: 5 });
    await pageB.mouse.up();

    await ctxB.close();

    // No board objects should have been created
    await expect(page.getByTestId("stroke-object")).toHaveCount(0);
    await expect(page.getByTestId("rectangle-object")).toHaveCount(0);
    await expect(page.getByTestId("note-object")).toHaveCount(0);
  });

  test("presence does not persist as board content after reload", async ({
    page,
    browser,
  }) => {
    const { boardId, shareCode } = await createBoard(
      page,
      "Presence No Persist Board",
      "Alice",
    );

    const ctxB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    await ctxB.addInitScript(() => {
      localStorage.setItem("dexdraw-entered", "1");
    });
    const pageB = await ctxB.newPage();
    await joinBoard(pageB, boardId, shareCode, "Bob");

    // B moves cursor to send presence
    const canvasB = pageB.getByTestId("board-canvas");
    const boxB = await canvasB.boundingBox();
    if (!boxB) throw new Error("Canvas not found");
    await pageB.mouse.move(boxB.x + 400, boxB.y + 300);
    await expect(page.getByTestId("remote-cursor")).toBeVisible({
      timeout: 15_000,
    });

    await ctxB.close();

    // Reload page A
    await page.reload();
    await expect(page.getByTestId("board-canvas")).toBeVisible();

    // No remote presence should persist (it's ephemeral)
    await expect(page.getByTestId("remote-cursor")).toHaveCount(0);
    // Presence panel shows just local user
    await expect(page.getByTestId("presence-count")).toHaveText("1");
  });
});
