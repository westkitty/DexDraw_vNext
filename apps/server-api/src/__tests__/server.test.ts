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
  }, 15_000);

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
  }, 15_000);

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
  }, 20_000);

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
  }, 20_000);
});
