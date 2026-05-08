import { mkdtemp, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app";

const strokePayload = {
  id: "0bc3d8bf-12ed-4f10-9c11-55b85855c680",
  type: "stroke",
  points: [
    { x: 12, y: 18, pressure: 0.5 },
    { x: 42, y: 48, pressure: 0.6 },
  ],
  style: {
    color: "#111111",
    width: 3,
  },
  createdBy: "Owner",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
  zIndex: 0,
};

describe("server api", () => {
  let dataDir: string;

  function getPort(address: AddressInfo | string | null) {
    if (!address || typeof address === "string") {
      throw new Error("Server address unavailable");
    }

    return address.port;
  }

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "dexdraw-vnext-"));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("creates a board and issues an owner token", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });

    const response = await app.inject({
      method: "POST",
      url: "/api/boards",
      payload: {
        name: "Sprint Planning",
        templateId: "blank",
        displayName: "Owner",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: "Sprint Planning",
      templateId: "blank",
    });

    await app.close();
  });

  it("joins a board with the share code and returns an edit token", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    const created = await app.inject({
      method: "POST",
      url: "/api/boards",
      payload: {
        name: "Sprint Planning",
        templateId: "blank",
        displayName: "Owner",
      },
    });
    const board = created.json();

    const joined = await app.inject({
      method: "POST",
      url: `/api/boards/${board.boardId}/join`,
      payload: {
        displayName: "Guest",
        shareCode: board.shareCode,
      },
    });

    expect(joined.statusCode).toBe(200);
    expect(joined.json()).toMatchObject({
      boardId: board.boardId,
      role: "edit",
    });

    await app.close();
  });

  it("persists a stroke sent through websocket and returns it in snapshot", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });

    const address = new URL(
      `http://127.0.0.1:${getPort(app.server.address() as AddressInfo | string | null)}`,
    );

    const created = await fetch(new URL("/api/boards", address), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Live Board",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((response) => response.json());

    const socket = new WebSocket(
      `ws://127.0.0.1:${address.port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );

    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", (event) => reject(event), {
        once: true,
      });
    });

    await new Promise<void>((resolve, reject) => {
      socket.addEventListener(
        "message",
        (event) => {
          const message = JSON.parse(String(event.data));
          if (message.type === "server.welcome") {
            resolve();
          }
        },
        { once: false },
      );

      socket.send(
        JSON.stringify({
          type: "client.op",
          boardId: created.boardId,
          clientId: "d6715ef5-b6f7-4b74-b94a-b1b1e72ff8b8",
          clientSeq: 1,
          opId: "4be8cb8b-7f32-4405-ab54-c1ef8f9d5945",
          opType: "object.create",
          payload: strokePayload,
          sentAt: "2026-05-04T00:00:00.000Z",
        }),
      );

      socket.addEventListener("error", (event) => reject(event), {
        once: true,
      });
    });

    const snapshot = await fetch(
      new URL(`/api/boards/${created.boardId}/snapshot`, address),
      {
        headers: {
          authorization: `Bearer ${created.ownerToken}`,
        },
      },
    ).then((response) => response.json());

    expect(snapshot.objects).toHaveLength(1);
    expect(snapshot.objects[0]).toMatchObject({
      id: strokePayload.id,
      type: "stroke",
    });

    socket.close();
    await app.close();
  });

  it("rejects draw attempts from a view token", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const port = getPort(app.server.address() as AddressInfo | string | null);

    const created = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Secure Board",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((response) => response.json());

    const join = await fetch(
      `http://127.0.0.1:${port}/api/boards/${created.boardId}/join`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "Viewer",
          shareCode: created.shareCode,
          requestedRole: "view",
        }),
      },
    ).then((response) => response.json());

    const socket = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${created.boardId}?token=${join.token}`,
    );

    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", (event) => reject(event), {
        once: true,
      });
    });

    const errorMessage = await new Promise<{ code: string }>(
      (resolve, reject) => {
        socket.addEventListener("message", (event) => {
          const message = JSON.parse(String(event.data));
          if (message.type === "server.error") {
            resolve(message);
          }
        });

        socket.send(
          JSON.stringify({
            type: "client.op",
            boardId: created.boardId,
            clientId: "ba9e6b03-5cef-489e-8e3d-a89615bc8f31",
            clientSeq: 1,
            opId: "9838015d-7d3d-4f74-b732-ab19bb2f91d4",
            opType: "object.create",
            payload: strokePayload,
            sentAt: "2026-05-04T00:00:00.000Z",
          }),
        );

        socket.addEventListener("error", (event) => reject(event), {
          once: true,
        });
      },
    );

    expect(errorMessage.code).toBe("forbidden");

    socket.close();
    await app.close();
  });

  it("lists checkpoints via REST endpoint", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const port = getPort(app.server.address() as AddressInfo | string | null);

    const created = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "CP Board",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((r) => r.json());

    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );

    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    // Wait for server.welcome
    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === "server.welcome") resolve();
      });
    });

    // Send checkpoint.create
    ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: created.boardId,
        clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        clientSeq: 1,
        opId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
        opType: "checkpoint.create",
        payload: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "v1" },
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );

    // Wait for server.op acknowledgement
    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === "server.op" && msg.opType === "checkpoint.create")
          resolve();
      });
    });

    const checkpoints = await fetch(
      `http://127.0.0.1:${port}/api/boards/${created.boardId}/checkpoints`,
      { headers: { authorization: `Bearer ${created.ownerToken}` } },
    ).then((r) => r.json());

    expect(checkpoints.checkpoints).toHaveLength(1);
    expect(checkpoints.checkpoints[0]).toMatchObject({ name: "v1" });

    ws.close();
    await app.close();
  });

  it("lists canonical ops after a given server sequence", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const port = getPort(app.server.address() as AddressInfo | string | null);

    const created = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Replay Board",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((response) => response.json());

    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );

    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        if (JSON.parse(String(ev.data)).type === "server.welcome") resolve();
      });
    });

    const textPayload = {
      id: "33333333-3333-4333-8333-333333333333",
      type: "text",
      x: 120,
      y: 180,
      text: "Replay me",
      style: { color: "#111827", fontSize: 24 },
      createdBy: "Owner",
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z",
      zIndex: 1,
    };

    await new Promise<void>((resolve) => {
      let opCount = 0;
      ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(String(ev.data));
        if (msg.type !== "server.op") return;
        opCount += 1;
        if (opCount === 1) {
          ws.send(
            JSON.stringify({
              type: "client.op",
              boardId: created.boardId,
              clientId: "11111111-1111-4111-8111-111111111111",
              clientSeq: 2,
              opId: "44444444-4444-4444-8444-444444444444",
              opType: "object.create",
              payload: textPayload,
              sentAt: "2026-05-04T00:00:01.000Z",
            }),
          );
          return;
        }
        if (opCount === 2) resolve();
      });

      ws.send(
        JSON.stringify({
          type: "client.op",
          boardId: created.boardId,
          clientId: "11111111-1111-4111-8111-111111111111",
          clientSeq: 1,
          opId: "22222222-2222-4222-8222-222222222222",
          opType: "object.create",
          payload: strokePayload,
          sentAt: "2026-05-04T00:00:00.000Z",
        }),
      );
    });

    const replay = await fetch(
      `http://127.0.0.1:${port}/api/boards/${created.boardId}/ops?since=1`,
      {
        headers: { authorization: `Bearer ${created.ownerToken}` },
      },
    ).then((response) => response.json());

    expect(replay.boardId).toBe(created.boardId);
    expect(replay.ops).toHaveLength(1);
    expect(replay.ops[0]).toMatchObject({
      type: "server.op",
      serverSeq: 2,
      opType: "object.create",
    });
    expect((replay.ops[0].payload as { id: string }).id).toBe(textPayload.id);

    ws.close();
    await app.close();
  });

  it("snapshot_reset is broadcast on checkpoint.restore", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const port = getPort(app.server.address() as AddressInfo | string | null);

    const created = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Restore Board",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((r) => r.json());

    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );

    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        if (JSON.parse(String(ev.data)).type === "server.welcome") resolve();
      });
    });

    // Create an object
    ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: created.boardId,
        clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        clientSeq: 1,
        opId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        opType: "object.create",
        payload: strokePayload,
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );
    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        const m = JSON.parse(String(ev.data));
        if (m.type === "server.op" && m.opType === "object.create") resolve();
      });
    });

    // Checkpoint
    ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: created.boardId,
        clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        clientSeq: 2,
        opId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        opType: "checkpoint.create",
        payload: { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", name: "snap" },
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );
    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        const m = JSON.parse(String(ev.data));
        if (m.type === "server.op" && m.opType === "checkpoint.create")
          resolve();
      });
    });

    // Add another object after checkpoint
    const afterPayload = {
      ...strokePayload,
      id: "11111111-1111-1111-8111-111111111111",
      zIndex: 1,
    };
    ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: created.boardId,
        clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        clientSeq: 3,
        opId: "22222222-2222-2222-8222-222222222222",
        opType: "object.create",
        payload: afterPayload,
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );
    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        const m = JSON.parse(String(ev.data));
        if (
          m.type === "server.op" &&
          m.opType === "object.create" &&
          (m.payload as { id: string }).id === afterPayload.id
        )
          resolve();
      });
    });

    // Restore checkpoint
    ws.send(
      JSON.stringify({
        type: "client.op",
        boardId: created.boardId,
        clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        clientSeq: 4,
        opId: "33333333-3333-3333-8333-333333333333",
        opType: "checkpoint.restore",
        payload: { id: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
        sentAt: "2026-05-04T00:00:00.000Z",
      }),
    );

    const resetMsg = await new Promise<{ type: string; snapshot: unknown[] }>(
      (resolve) => {
        ws.addEventListener("message", (ev) => {
          const m = JSON.parse(String(ev.data));
          if (m.type === "server.snapshot_reset") resolve(m);
        });
      },
    );

    // The snapshot should have only 1 object (the one before the checkpoint)
    expect(resetMsg.snapshot).toHaveLength(1);
    expect((resetMsg.snapshot[0] as { id: string }).id).toBe(strokePayload.id);

    ws.close();
    await app.close();
  });

  it("rejects object.update patches that attempt to overwrite id or type", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const port = (app.server.address() as import("node:net").AddressInfo).port;

    const created = await fetch(`http://127.0.0.1:${port}/api/boards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Patch Test",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((r) => r.json());

    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    await new Promise<void>((resolve) => {
      ws.addEventListener("message", (ev) => {
        if (JSON.parse(String(ev.data)).type === "server.welcome") resolve();
      });
    });

    const errorMsg = await new Promise<{ type: string; code: string }>(
      (resolve, reject) => {
        ws.addEventListener("message", (ev) => {
          const m = JSON.parse(String(ev.data));
          if (m.type === "server.error") resolve(m);
        });
        ws.addEventListener("error", reject, { once: true });

        ws.send(
          JSON.stringify({
            type: "client.op",
            boardId: created.boardId,
            clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            clientSeq: 1,
            opId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            opType: "object.update",
            payload: {
              id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              patch: {
                id: "00000000-0000-0000-0000-000000000000",
                x: 100,
              },
            },
            sentAt: "2026-05-05T00:00:00.000Z",
          }),
        );
      },
    );

    expect(errorMsg.code).toBe("invalid_payload");

    ws.close();
    await app.close();
  });

  it("restricts CORS to the configured public client origin", async () => {
    const { app } = await buildApp({
      dataDir,
      tokenSecret: "test-secret-key",
      publicClientOrigin: "http://app.example.com",
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example.com" },
    });

    // When a specific origin is configured, @fastify/cors reflects only that
    // string — not the request's Origin. A browser seeing a mismatched ACAO
    // header will block the response.
    const acao = response.headers["access-control-allow-origin"];
    expect(acao).toBe("http://app.example.com");

    await app.close();
  });

  it("PATCH /api/boards/:boardId/title updates title and broadcasts to WS clients", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });
    await app.listen({ port: 0, host: "127.0.0.1" });

    const address = new URL(
      `http://127.0.0.1:${getPort(app.server.address() as AddressInfo | string | null)}`,
    );

    const created = (await fetch(new URL("/api/boards", address), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Original Name",
        templateId: "blank",
        displayName: "Owner",
      }),
    }).then((r) => r.json())) as { boardId: string; ownerToken: string };

    // Connect a WS client to receive broadcasts
    const socket = new WebSocket(
      `ws://127.0.0.1:${address.port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", (e) => reject(e), { once: true });
    });

    // Consume the welcome message
    await new Promise<void>((resolve) => {
      socket.addEventListener("message", () => resolve(), { once: true });
    });

    // Register listener BEFORE the PATCH so we don't miss the broadcast
    const broadcastPromise = new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("timeout waiting for broadcast")),
        3000,
      );
      socket.addEventListener(
        "message",
        (event) => {
          clearTimeout(timeout);
          resolve(JSON.parse(String(event.data)));
        },
        { once: true },
      );
    });

    // Rename the board
    const patchResp = await fetch(
      new URL(`/api/boards/${created.boardId}/title`, address),
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${created.ownerToken}`,
        },
        body: JSON.stringify({ title: "Renamed Board" }),
      },
    );
    expect(patchResp.status).toBe(200);
    expect(await patchResp.json()).toMatchObject({ title: "Renamed Board" });

    const broadcastMsg = await broadcastPromise;
    expect(broadcastMsg).toMatchObject({
      type: "server.board_title_update",
      boardId: created.boardId,
      title: "Renamed Board",
    });

    // server.welcome should contain updated boardTitle after reconnect
    const newSocket = new WebSocket(
      `ws://127.0.0.1:${address.port}/ws/boards/${created.boardId}?token=${created.ownerToken}`,
    );
    const welcomeMsg = await new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("timeout waiting for welcome")),
        3000,
      );
      newSocket.addEventListener(
        "message",
        (event) => {
          clearTimeout(timeout);
          resolve(JSON.parse(String(event.data)));
        },
        { once: true },
      );
    });
    expect(welcomeMsg).toMatchObject({
      type: "server.welcome",
      boardTitle: "Renamed Board",
    });

    socket.close();
    newSocket.close();
    await app.close();
  });

  it("PATCH title returns 403 for non-owner tokens", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });

    const created = await app.inject({
      method: "POST",
      url: "/api/boards",
      payload: { name: "My Board", templateId: "blank", displayName: "Owner" },
    });
    const board = created.json() as {
      boardId: string;
      shareCode: string;
    };

    const joined = await app.inject({
      method: "POST",
      url: `/api/boards/${board.boardId}/join`,
      payload: { displayName: "Guest", shareCode: board.shareCode },
    });
    const { token: editToken } = joined.json() as { token: string };

    const patchResp = await app.inject({
      method: "PATCH",
      url: `/api/boards/${board.boardId}/title`,
      headers: { authorization: `Bearer ${editToken}` },
      payload: { title: "Hacked Name" },
    });
    expect(patchResp.statusCode).toBe(403);

    await app.close();
  });

  it("returns valid ops for a board created from a non-blank template", async () => {
    const { app } = await buildApp({ dataDir, tokenSecret: "test-secret-key" });

    const created = await app.inject({
      method: "POST",
      url: "/api/boards",
      payload: {
        name: "Meeting",
        templateId: "meeting-grid",
        displayName: "Owner",
      },
    });
    const board = created.json() as { boardId: string; ownerToken: string };

    const ops = await app.inject({
      method: "GET",
      url: `/api/boards/${board.boardId}/ops?since=0`,
      headers: { authorization: `Bearer ${board.ownerToken}` },
    });

    expect(ops.statusCode).toBe(200);
    const { OpsSinceResponseSchema } = await import("@dexdraw/shared-protocol");
    expect(() => OpsSinceResponseSchema.parse(ops.json())).not.toThrow();

    await app.close();
  });
});
