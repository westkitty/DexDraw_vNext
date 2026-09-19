import { mkdtemp, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BoardObject, ServerOpEnvelope } from "@dexdraw/shared-protocol";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("collaboration conflict & adversarial resilience", () => {
  let dataDir: string;

  function getPort(address: AddressInfo | string | null) {
    if (!address || typeof address === "string") {
      throw new Error("Server address unavailable");
    }
    return address.port;
  }

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "dexdraw-conflict-test-"));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  // Helper to connect a test client and accumulate incoming messages
  async function connectClient(url: string) {
    const ws = new WebSocket(url);
    const messages: Array<Record<string, unknown>> = [];
    ws.addEventListener("message", (ev) => {
      messages.push(JSON.parse(String(ev.data)));
    });

    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    // Wait for welcome
    while (!messages.some((m) => m.type === "server.welcome")) {
      await new Promise((r) => setTimeout(r, 10));
    }

    return { ws, messages };
  }

  // Helper to replay ops locally like a client does
  function replayOps(
    baseObjects: BoardObject[],
    ops: ServerOpEnvelope[],
  ): BoardObject[] {
    const objs = new Map(baseObjects.map((o) => [o.id, o]));
    for (const op of ops) {
      if (op.opType === "object.create") {
        const obj = op.payload as BoardObject;
        objs.set(obj.id, obj);
      } else if (op.opType === "object.update") {
        const payload = op.payload as {
          id: string;
          patch: Partial<BoardObject>;
        };
        const prev = objs.get(payload.id);
        if (prev) {
          objs.set(payload.id, { ...prev, ...payload.patch } as BoardObject);
        }
      } else if (op.opType === "object.delete") {
        const payload = op.payload as { id: string };
        objs.delete(payload.id);
      } else if (op.opType === "object.reorder") {
        const payload = op.payload as { id: string; zIndex: number };
        const prev = objs.get(payload.id);
        if (prev) {
          objs.set(payload.id, {
            ...prev,
            zIndex: payload.zIndex,
          } as BoardObject);
        }
      }
    }
    return [...objs.values()].sort((a, b) => a.zIndex - b.zIndex);
  }

  it("Scenario A: SAME OBJECT / SAME TIME — two clients update same object concurrently, both converge deterministically", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Concurrent Edit Board",
        templateId: "blank",
        displayName: "ClientA",
      }),
    });
    const board = await createRes.json();

    const joinRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/join`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "ClientB",
          shareCode: board.shareCode,
        }),
      },
    );
    const peer = await joinRes.json();

    const clientA = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${board.ownerToken}`,
    );
    const clientB = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${peer.token}`,
    );

    // Create an initial rectangle
    const rectId = crypto.randomUUID();
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 1,
        opId: crypto.randomUUID(),
        opType: "object.create",
        payload: {
          id: rectId,
          type: "rectangle",
          x: 100,
          y: 100,
          width: 150,
          height: 100,
          style: { strokeColor: "#000" },
          createdBy: "ClientA",
          createdAt: "2026-05-04T00:00:00.000Z",
          updatedAt: "2026-05-04T00:00:00.000Z",
          zIndex: 1,
        },
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    // Client A moves rect to (200, 200) and Client B moves rect to (300, 300) concurrently
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 2,
        opId: crypto.randomUUID(),
        opType: "object.update",
        payload: { id: rectId, patch: { x: 200, y: 200 } },
        sentAt: "2026-05-04T00:00:01.000Z",
      }),
    );

    clientB.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 1,
        opId: crypto.randomUUID(),
        opType: "object.update",
        payload: { id: rectId, patch: { x: 300, y: 300 } },
        sentAt: "2026-05-04T00:00:01.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 100));

    // Verify snapshot from server matches what both clients received in order
    const snapshotRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/snapshot`,
      {
        headers: { authorization: `Bearer ${board.ownerToken}` },
      },
    );
    const snapshot = await snapshotRes.json();
    const serverRect = (snapshot.objects as BoardObject[]).find(
      (o) => o.id === rectId,
    );
    expect(serverRect).toBeDefined();

    // Verify both clients received the same operations in identical serverSeq order
    const opsA = clientA.messages.filter(
      (m) => m.type === "server.op",
    ) as unknown as ServerOpEnvelope[];
    const opsB = clientB.messages.filter(
      (m) => m.type === "server.op",
    ) as unknown as ServerOpEnvelope[];
    expect(opsA.map((o) => o.serverSeq)).toEqual(opsB.map((o) => o.serverSeq));

    // Both replayed states must match the server authoritative snapshot
    const replayedA = replayOps([], opsA);
    const replayedB = replayOps([], opsB);
    expect(replayedA).toEqual(replayedB);
    expect(replayedA).toEqual(snapshot.objects);

    clientA.ws.close();
    clientB.ws.close();
    await app.close();
  });

  it("Scenario B: DELETE VS EDIT — one client deletes while another edits; all peers converge deterministically", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Delete vs Edit",
        templateId: "blank",
        displayName: "A",
      }),
    });
    const board = await createRes.json();

    const joinRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/join`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: "B", shareCode: board.shareCode }),
      },
    );
    const peer = await joinRes.json();

    const clientA = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${board.ownerToken}`,
    );
    const clientB = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${peer.token}`,
    );

    const targetId = crypto.randomUUID();
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 1,
        opId: crypto.randomUUID(),
        opType: "object.create",
        payload: {
          id: targetId,
          type: "note",
          x: 50,
          y: 50,
          width: 120,
          height: 80,
          text: "Important note",
          createdBy: "A",
          createdAt: "2026-05-04T00:00:00.000Z",
          updatedAt: "2026-05-04T00:00:00.000Z",
          zIndex: 1,
        },
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    // Client A deletes note, Client B edits text at the same time
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 2,
        opId: crypto.randomUUID(),
        opType: "object.delete",
        payload: { id: targetId },
        sentAt: "2026-05-04T00:00:01.000Z",
      }),
    );

    clientB.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 1,
        opId: crypto.randomUUID(),
        opType: "object.update",
        payload: { id: targetId, patch: { text: "Edited text" } },
        sentAt: "2026-05-04T00:00:01.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 100));

    const snapshotRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/snapshot`,
      {
        headers: { authorization: `Bearer ${board.ownerToken}` },
      },
    );
    const snapshot = await snapshotRes.json();

    const opsA = clientA.messages.filter(
      (m) => m.type === "server.op",
    ) as unknown as ServerOpEnvelope[];
    const opsB = clientB.messages.filter(
      (m) => m.type === "server.op",
    ) as unknown as ServerOpEnvelope[];

    const replayedA = replayOps([], opsA);
    const replayedB = replayOps([], opsB);

    // Both peers MUST converge to the exact same state as the server
    expect(replayedA).toEqual(replayedB);
    expect(replayedA).toEqual(snapshot.objects);

    clientA.ws.close();
    clientB.ws.close();
    await app.close();
  });

  it("Scenario C: REORDER VS DELETE — reorder arriving after delete does not resurrect object", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Reorder vs Delete",
        templateId: "blank",
        displayName: "A",
      }),
    });
    const board = await createRes.json();

    const clientA = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${board.ownerToken}`,
    );

    const id = crypto.randomUUID();
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 1,
        opId: crypto.randomUUID(),
        opType: "object.create",
        payload: {
          id,
          type: "rectangle",
          x: 10,
          y: 10,
          width: 100,
          height: 100,
          style: {},
          createdBy: "A",
          createdAt: "2026-05-04T00:00:00.000Z",
          updatedAt: "2026-05-04T00:00:00.000Z",
          zIndex: 0,
        },
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );

    // Delete then reorder
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 2,
        opId: crypto.randomUUID(),
        opType: "object.delete",
        payload: { id },
        sentAt: "2026-05-04T00:00:01.000Z",
      }),
    );

    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 3,
        opId: crypto.randomUUID(),
        opType: "object.reorder",
        payload: { id, zIndex: 10 },
        sentAt: "2026-05-04T00:00:02.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 100));

    const snapshotRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/snapshot`,
      {
        headers: { authorization: `Bearer ${board.ownerToken}` },
      },
    );
    const snapshot = await snapshotRes.json();
    expect(snapshot.objects).toHaveLength(0);

    clientA.ws.close();
    await app.close();
  });

  it("Scenario D: CHECKPOINT RESTORE WHILE PEERS CONNECTED — broadcasts snapshot_reset to all peers", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Checkpoint Board",
        templateId: "blank",
        displayName: "A",
      }),
    });
    const board = await createRes.json();

    const joinRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/join`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: "B", shareCode: board.shareCode }),
      },
    );
    const peer = await joinRes.json();

    const clientA = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${board.ownerToken}`,
    );
    const clientB = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${peer.token}`,
    );

    // Create item 1
    const item1Id = crypto.randomUUID();
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 1,
        opId: crypto.randomUUID(),
        opType: "object.create",
        payload: {
          id: item1Id,
          type: "rectangle",
          x: 10,
          y: 10,
          width: 50,
          height: 50,
          style: {},
          createdBy: "A",
          createdAt: "2026-05-04T00:00:00.000Z",
          updatedAt: "2026-05-04T00:00:00.000Z",
          zIndex: 0,
        },
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    // Create checkpoint
    const cpId = crypto.randomUUID();
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 2,
        opId: crypto.randomUUID(),
        opType: "checkpoint.create",
        payload: { id: cpId, name: "Checkpoint 1" },
        sentAt: "2026-05-04T00:00:01.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    // Create item 2 (post-checkpoint)
    const item2Id = crypto.randomUUID();
    clientB.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 1,
        opId: crypto.randomUUID(),
        opType: "object.create",
        payload: {
          id: item2Id,
          type: "rectangle",
          x: 80,
          y: 80,
          width: 50,
          height: 50,
          style: {},
          createdBy: "B",
          createdAt: "2026-05-04T00:00:02.000Z",
          updatedAt: "2026-05-04T00:00:02.000Z",
          zIndex: 1,
        },
        sentAt: "2026-05-04T00:00:02.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    // Restore checkpoint
    clientA.ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: board.boardId,
        clientId: crypto.randomUUID(),
        clientSeq: 3,
        opId: crypto.randomUUID(),
        opType: "checkpoint.restore",
        payload: { id: cpId },
        sentAt: "2026-05-04T00:00:03.000Z",
      }),
    );

    await new Promise((r) => setTimeout(r, 100));

    // Both clients must receive snapshot_reset
    const resetA = clientA.messages.find(
      (m) => m.type === "server.snapshot_reset",
    );
    const resetB = clientB.messages.find(
      (m) => m.type === "server.snapshot_reset",
    );

    expect(resetA).toBeDefined();
    expect(resetB).toBeDefined();
    expect(
      // biome-ignore lint/suspicious/noExplicitAny: test payload assertion
      ((resetA as any).snapshot as BoardObject[]).map((o) => o.id),
    ).toEqual([item1Id]);
    expect(
      // biome-ignore lint/suspicious/noExplicitAny: test payload assertion
      ((resetB as any).snapshot as BoardObject[]).map((o) => o.id),
    ).toEqual([item1Id]);

    clientA.ws.close();
    clientB.ws.close();
    await app.close();
  });

  it("Scenario E: BOARD RENAME CONCURRENCY — rejects non-owner, accepts owner, broadcasts update", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Original Title",
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
          displayName: "Guest",
          shareCode: board.shareCode,
        }),
      },
    );
    const guest = await joinRes.json();

    const clientOwner = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${board.ownerToken}`,
    );
    const clientGuest = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${guest.token}`,
    );

    // Non-owner attempt should fail with 403
    const badRename = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/title`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${guest.token}`,
        },
        body: JSON.stringify({ title: "Hacked Title" }),
      },
    );
    expect(badRename.status).toBe(403);

    // Owner attempt succeeds
    const goodRename = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/title`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${board.ownerToken}`,
        },
        body: JSON.stringify({ title: "New Authoritative Title" }),
      },
    );
    expect(goodRename.status).toBe(200);

    await new Promise((r) => setTimeout(r, 50));

    // Both connected clients received server.board_title_update
    const titleA = clientOwner.messages.find(
      (m) => m.type === "server.board_title_update",
    );
    const titleB = clientGuest.messages.find(
      (m) => m.type === "server.board_title_update",
    );
    expect(titleA?.title).toBe("New Authoritative Title");
    expect(titleB?.title).toBe("New Authoritative Title");

    clientOwner.ws.close();
    clientGuest.ws.close();
    await app.close();
  });

  it("Scenario H & J: SEQUENCE GAP & RECONNECT / JOIN DURING ACTIVE MUTATIONS", async () => {
    const { app } = await buildApp({ dataDir });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const port = getPort(app.server.address());

    const createRes = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Gap Test Board",
        templateId: "blank",
        displayName: "A",
      }),
    });
    const board = await createRes.json();

    const clientA = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${board.ownerToken}`,
    );

    // Create 5 objects sequentially
    for (let i = 1; i <= 5; i++) {
      clientA.ws.send(
        JSON.stringify({
          type: "client.op",
          boardId: board.boardId,
          clientId: crypto.randomUUID(),
          clientSeq: i,
          opId: crypto.randomUUID(),
          opType: "object.create",
          payload: {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: i * 20,
            y: i * 20,
            width: 50,
            height: 50,
            style: {},
            createdBy: "A",
            createdAt: "2026-05-04T00:00:00.000Z",
            updatedAt: "2026-05-04T00:00:00.000Z",
            zIndex: i,
          },
          sentAt: "2026-05-04T00:00:00.000Z",
        }),
      );
    }

    await new Promise((r) => setTimeout(r, 100));

    // A client querying since=2 gets ops 3, 4, 5 in exact sequence
    const catchupRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/ops?since=2`,
      {
        headers: { authorization: `Bearer ${board.ownerToken}` },
      },
    );
    const catchup = await catchupRes.json();
    expect(catchup.ops).toHaveLength(3);
    expect(catchup.ops[0].serverSeq).toBe(3);
    expect(catchup.ops[1].serverSeq).toBe(4);
    expect(catchup.ops[2].serverSeq).toBe(5);

    // Scenario J: Client C joins now during active board state, receives full current snapshot
    const joinRes = await fetch(
      `http://127.0.0.1:${port}/api/boards/${board.boardId}/join`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "ClientC",
          shareCode: board.shareCode,
        }),
      },
    );
    const joinC = await joinRes.json();
    const clientC = await connectClient(
      `ws://127.0.0.1:${port}/ws/boards/${board.boardId}?token=${joinC.token}`,
    );

    const welcomeC = clientC.messages.find((m) => m.type === "server.welcome");
    // biome-ignore lint/suspicious/noExplicitAny: test payload assertion
    expect((welcomeC as any)?.serverSeq).toBe(5);
    // biome-ignore lint/suspicious/noExplicitAny: test payload assertion
    expect((welcomeC as any)?.snapshot).toHaveLength(5);

    clientA.ws.close();
    clientC.ws.close();
    await app.close();
  });
});
