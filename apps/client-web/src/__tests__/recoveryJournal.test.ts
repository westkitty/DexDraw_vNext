import { describe, expect, it } from "vitest";
import {
  clearRecoverySnapshot,
  formatSnapshotAge,
  loadRecoverySnapshot,
  saveRecoverySnapshot,
} from "../lib/recoveryJournal";

describe("recoveryJournal", () => {
  it("saves and loads recovery record via memory fallback when IndexedDB is absent", async () => {
    const boardId = "60a4f6bb-7313-41bb-b0db-112233445566";
    const testRecord = {
      boardId,
      boardTitle: "Journal Test",
      serverSeq: 42,
      objects: [],
      pendingOps: [
        {
          opId: "op-1",
          clientSeq: 1,
          opType: "object.create",
          payload: {},
          sentAt: new Date().toISOString(),
        },
      ],
      savedAt: new Date().toISOString(),
    };

    await saveRecoverySnapshot(testRecord);
    const loaded = await loadRecoverySnapshot(boardId);
    expect(loaded).toBeDefined();
    expect(loaded?.boardTitle).toBe("Journal Test");
    expect(loaded?.serverSeq).toBe(42);
    expect(loaded?.pendingOps).toHaveLength(1);

    await clearRecoverySnapshot(boardId);
    const cleared = await loadRecoverySnapshot(boardId);
    expect(cleared).toBeNull();
  });

  it("bounds pending operations to prevent memory explosion", async () => {
    const boardId = "bound-test-board";
    const manyOps = Array.from({ length: 150 }, (_, i) => ({
      opId: `op-${i}`,
      clientSeq: i + 1,
      opType: "object.create",
      payload: {},
      sentAt: new Date().toISOString(),
    }));

    await saveRecoverySnapshot({
      boardId,
      boardTitle: "Bounded Test",
      serverSeq: 1,
      objects: [],
      pendingOps: manyOps,
      savedAt: new Date().toISOString(),
    });

    const loaded = await loadRecoverySnapshot(boardId);
    expect(loaded?.pendingOps.length).toBe(100);
  });

  it("formats snapshot age humanely", () => {
    expect(formatSnapshotAge(new Date().toISOString())).toBe("just now");
    expect(formatSnapshotAge(new Date(Date.now() - 30_000).toISOString())).toBe(
      "30s ago",
    );
    expect(
      formatSnapshotAge(new Date(Date.now() - 120_000).toISOString()),
    ).toBe("2m ago");
  });
});
