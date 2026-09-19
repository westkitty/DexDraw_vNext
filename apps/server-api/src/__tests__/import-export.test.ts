import { mkdtemp, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BoardArchiveSchema } from "@dexdraw/shared-protocol";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("import-export API & duplicate resilience", () => {
  let dataDir: string;

  function getPort(address: AddressInfo | string | null) {
    if (!address || typeof address === "string") {
      throw new Error("Server address unavailable");
    }
    return address.port;
  }

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "dexdraw-import-test-"));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("exports board as valid archive and imports into a new board with fresh ID", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    // 1. Create original board
    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Source Board",
        templateId: "meeting-grid",
        displayName: "Alice",
      }),
    });
    const original = await createRes.json();
    expect(original.boardId).toBeDefined();

    // 2. Export board via GET /api/boards/:id/export
    const exportRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${original.boardId}/export`,
      {
        headers: { authorization: `Bearer ${original.ownerToken}` },
      },
    );
    expect(exportRes.status).toBe(200);
    const archive = await exportRes.json();
    const parsed = BoardArchiveSchema.parse(archive);
    expect(parsed.formatVersion).toBe(1);
    expect(parsed.board.name).toBe("Source Board");
    expect(parsed.objects.length).toBeGreaterThan(0);

    // 3. Import board as a NEW board
    const importRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/import`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "Bob",
          archive: parsed,
        }),
      },
    );
    expect(importRes.status).toBe(200);
    const imported = await importRes.json();

    // Must be a BRAND NEW board, not overwriting the source
    expect(imported.boardId).not.toBe(original.boardId);
    expect(imported.shareCode).not.toBe(original.shareCode);
    expect(imported.ownerToken).toBeDefined();

    // Verify snapshot of imported board
    const snapshotRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${imported.boardId}/snapshot`,
      {
        headers: { authorization: `Bearer ${imported.ownerToken}` },
      },
    );
    const snapshot = await snapshotRes.json();
    expect(snapshot.objects.length).toBe(parsed.objects.length);

    await app.close();
  });

  it("rejects malformed or unsupported version archive on import", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const badVersionRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/import`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "Bob",
          archive: {
            formatVersion: 999,
            sourceBoardId: "3ec3281a-fd71-4dfe-935f-445aa7c7f8f4",
            exportedAt: new Date().toISOString(),
            board: { name: "Bad Version" },
            objects: [],
          },
        }),
      },
    );
    expect(badVersionRes.status).toBe(400);

    await app.close();
  });

  it("duplicate op sent over WebSocket sends ACK to sender but does NOT broadcast duplicate to peer", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Deduplication Board",
        templateId: "blank",
        displayName: "Owner",
      }),
    });
    const board = await createRes.json();

    const joinRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/join`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "Peer",
          shareCode: board.shareCode,
        }),
      },
    );
    const peer = await joinRes.json();

    // Connect sender and peer
    const wsSender = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${board.ownerToken}`,
    );
    const wsPeer = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${peer.token}`,
    );

    const senderMessages: Array<Record<string, unknown>> = [];
    const peerMessages: Array<Record<string, unknown>> = [];
    wsSender.addEventListener("message", (event) =>
      senderMessages.push(JSON.parse(String(event.data))),
    );
    wsPeer.addEventListener("message", (event) =>
      peerMessages.push(JSON.parse(String(event.data))),
    );

    await Promise.all([
      new Promise<void>((resolve) =>
        wsSender.addEventListener("open", () => resolve(), { once: true }),
      ),
      new Promise<void>((resolve) =>
        wsPeer.addEventListener("open", () => resolve(), { once: true }),
      ),
    ]);

    // Wait until both received welcome
    while (
      !senderMessages.some((m) => m.type === "server.welcome") ||
      !peerMessages.some((m) => m.type === "server.welcome")
    ) {
      await new Promise((r) => setTimeout(r, 20));
    }

    const opId = crypto.randomUUID();
    const testOp = {
      type: "client.op",
      boardId: board.boardId,
      clientId: crypto.randomUUID(),
      clientSeq: 1,
      opId,
      opType: "object.create",
      payload: {
        id: crypto.randomUUID(),
        type: "rectangle",
        x: 10,
        y: 20,
        width: 100,
        height: 80,
        style: { strokeColor: "#111" },
        createdBy: "Owner",
        createdAt: "2026-05-04T00:00:00.000Z",
        updatedAt: "2026-05-04T00:00:00.000Z",
        zIndex: 1,
      },
      sentAt: "2026-05-04T00:00:00.000Z",
    };

    // Send original op
    wsSender.send(JSON.stringify(testOp));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Both sender and peer should have received 1 message
    expect(senderMessages.filter((m) => m.opId === opId)).toHaveLength(1);
    expect(peerMessages.filter((m) => m.opId === opId)).toHaveLength(1);

    // Send DUPLICATE op
    wsSender.send(JSON.stringify(testOp));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Sender receives second message (the ACK confirming it), but Peer receives NOTHING new!
    expect(senderMessages.filter((m) => m.opId === opId)).toHaveLength(2);
    expect(peerMessages.filter((m) => m.opId === opId)).toHaveLength(1);

    wsSender.close();
    wsPeer.close();
    await app.close();
  });
});
