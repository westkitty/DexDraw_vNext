import { describe, expect, it } from "vitest";
import { applyCanonicalOperation } from "../lib/boardState";

const BASE_ENVELOPE = {
  type: "server.op" as const,
  boardId: "b807ee76-1308-46a0-a672-a0f259e95a3f",
  serverSeq: 1,
  clientId: "d1e8b85c-b936-4517-a20c-f436a97e19a3",
  clientSeq: 1,
  opId: "9124109d-8a72-4c3f-948c-9d7ffeb53932",
  createdAt: "2026-05-04T00:00:00.000Z",
};

const STROKE_OBJECT = {
  id: "babefa0d-6575-4dcb-b6ce-bdcdd2c435af",
  type: "stroke" as const,
  points: [
    { x: 1, y: 2, pressure: 0.5 },
    { x: 3, y: 4, pressure: 0.5 },
  ],
  style: { color: "#111111", width: 3 },
  createdBy: "Owner",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
  zIndex: 0,
};

const TEXT_OBJECT = {
  id: "c1d2e3f4-0000-0000-0000-000000000001",
  type: "text" as const,
  x: 100,
  y: 200,
  text: "Hello",
  style: { color: "#111827", fontSize: 24 },
  createdBy: "Owner",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
  zIndex: 1,
};

describe("applyCanonicalOperation", () => {
  it("adds canonical objects by id on object.create", () => {
    const result = applyCanonicalOperation([], {
      ...BASE_ENVELOPE,
      opType: "object.create",
      payload: STROKE_OBJECT,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("babefa0d-6575-4dcb-b6ce-bdcdd2c435af");
  });

  it("patches an existing object on object.update", () => {
    const initial = applyCanonicalOperation([], {
      ...BASE_ENVELOPE,
      opType: "object.create",
      payload: TEXT_OBJECT,
    });

    const result = applyCanonicalOperation(initial, {
      ...BASE_ENVELOPE,
      serverSeq: 2,
      clientSeq: 2,
      opType: "object.update",
      payload: { id: TEXT_OBJECT.id, patch: { text: "Updated" } },
    });

    expect(result).toHaveLength(1);
    expect((result[0] as typeof TEXT_OBJECT).text).toBe("Updated");
    expect(result[0]?.id).toBe(TEXT_OBJECT.id);
  });

  it("removes an object on object.delete", () => {
    const initial = applyCanonicalOperation([], {
      ...BASE_ENVELOPE,
      opType: "object.create",
      payload: STROKE_OBJECT,
    });

    const result = applyCanonicalOperation(initial, {
      ...BASE_ENVELOPE,
      serverSeq: 2,
      clientSeq: 2,
      opType: "object.delete",
      payload: { id: STROKE_OBJECT.id },
    });

    expect(result).toHaveLength(0);
  });

  it("updates zIndex on object.reorder", () => {
    const initial = applyCanonicalOperation([], {
      ...BASE_ENVELOPE,
      opType: "object.create",
      payload: STROKE_OBJECT,
    });

    const result = applyCanonicalOperation(initial, {
      ...BASE_ENVELOPE,
      serverSeq: 2,
      clientSeq: 2,
      opType: "object.reorder",
      payload: { id: STROKE_OBJECT.id, zIndex: 99 },
    });

    expect(result[0]?.zIndex).toBe(99);
  });

  it("object.update is a no-op for unknown ids", () => {
    const result = applyCanonicalOperation([STROKE_OBJECT], {
      ...BASE_ENVELOPE,
      opType: "object.update",
      payload: {
        id: "00000000-0000-0000-0000-000000000000",
        patch: { zIndex: 5 },
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.zIndex).toBe(0);
  });
});
