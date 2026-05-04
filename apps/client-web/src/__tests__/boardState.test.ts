import { describe, expect, it } from "vitest";
import { applyCanonicalOperation } from "../lib/boardState";

describe("applyCanonicalOperation", () => {
  it("adds canonical objects by id", () => {
    const result = applyCanonicalOperation([], {
      type: "server.op",
      boardId: "b807ee76-1308-46a0-a672-a0f259e95a3f",
      serverSeq: 1,
      clientId: "d1e8b85c-b936-4517-a20c-f436a97e19a3",
      clientSeq: 1,
      opId: "9124109d-8a72-4c3f-948c-9d7ffeb53932",
      opType: "object.create",
      payload: {
        id: "babefa0d-6575-4dcb-b6ce-bdcdd2c435af",
        type: "stroke",
        points: [
          { x: 1, y: 2, pressure: 0.5 },
          { x: 3, y: 4, pressure: 0.5 },
        ],
        style: { color: "#111111", width: 3 },
        createdBy: "Owner",
        createdAt: "2026-05-04T00:00:00.000Z",
        updatedAt: "2026-05-04T00:00:00.000Z",
        zIndex: 0,
      },
      createdAt: "2026-05-04T00:00:00.000Z",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("babefa0d-6575-4dcb-b6ce-bdcdd2c435af");
  });
});
