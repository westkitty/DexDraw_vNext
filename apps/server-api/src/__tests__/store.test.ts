import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ClientOpEnvelope } from "@dexdraw/shared-protocol";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createStore } from "../db/store";

describe("store appendOperation", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "dexdraw-store-"));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("assigns unique server sequences for concurrent appends", async () => {
    const store = await createStore(dataDir);
    const board = await store.createBoard({
      name: "Concurrent Board",
      templateId: "blank",
      displayName: "Owner",
      template: {
        id: "blank",
        name: "Blank",
        description: "Empty board",
        objects: [],
      },
    });

    const baseObject = {
      createdBy: "Owner",
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z",
      style: { color: "#111827", fontSize: 24 },
      type: "text" as const,
      x: 120,
      y: 180,
      zIndex: 0,
    };

    const opA: ClientOpEnvelope = {
      type: "client.op",
      boardId: board.boardId,
      clientId: "11111111-1111-4111-8111-111111111111",
      clientSeq: 1,
      opId: "22222222-2222-4222-8222-222222222222",
      opType: "object.create",
      payload: {
        ...baseObject,
        id: "33333333-3333-4333-8333-333333333333",
        text: "A",
      },
      sentAt: "2026-05-04T00:00:00.000Z",
    };

    const opB: ClientOpEnvelope = {
      type: "client.op",
      boardId: board.boardId,
      clientId: "11111111-1111-4111-8111-111111111111",
      clientSeq: 2,
      opId: "44444444-4444-4444-8444-444444444444",
      opType: "object.create",
      payload: {
        ...baseObject,
        id: "55555555-5555-4555-8555-555555555555",
        text: "B",
      },
      sentAt: "2026-05-04T00:00:01.000Z",
    };

    const result = await Promise.all([
      store.appendOperation(opA),
      store.appendOperation(opB),
    ]);

    expect(result.map((op) => op.serverSeq).sort((a, b) => a - b)).toEqual([
      1, 2,
    ]);

    const persisted = await store.getOps(board.boardId);
    expect(persisted).toHaveLength(2);
    expect(persisted.map((op) => op.serverSeq)).toEqual([1, 2]);

    await store.close();
  });
});
