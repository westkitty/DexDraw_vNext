import { describe, expect, it } from "vitest";
import {
  BoardCreateRequestSchema,
  BoardObjectSchema,
  ClientOpEnvelopeSchema,
  JoinBoardRequestSchema,
  RoleSchema,
  ServerErrorSchema,
  StrokeObjectSchema,
} from "../index";

describe("shared-protocol", () => {
  it("accepts valid stroke objects", () => {
    const result = StrokeObjectSchema.parse({
      id: "3ec3281a-fd71-4dfe-935f-445aa7c7f8f4",
      type: "stroke",
      points: [
        { x: 1, y: 2, pressure: 0.5 },
        { x: 4, y: 5, pressure: 0.6 },
      ],
      style: {
        color: "#111111",
        width: 2,
      },
      createdBy: "user-1",
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z",
      zIndex: 0,
    });

    expect(result.type).toBe("stroke");
  });

  it("accepts multiple board object types", () => {
    expect(
      BoardObjectSchema.parse({
        id: "02013d9d-a64c-4a39-b36b-3f10e257b70c",
        type: "rectangle",
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        style: {
          strokeColor: "#000000",
        },
        createdBy: "user-2",
        createdAt: "2026-05-04T00:00:00.000Z",
        updatedAt: "2026-05-04T00:00:00.000Z",
        zIndex: 1,
      }).type,
    ).toBe("rectangle");
  });

  it("rejects object.create envelopes with invalid payloads", () => {
    const result = ClientOpEnvelopeSchema.safeParse({
      type: "client.op",
      boardId: "acb40b6e-8690-42a1-bc9c-7891c6f73e88",
      clientId: "9c1a5a66-e9b2-430f-a694-b526fe8f3a18",
      clientSeq: 1,
      opId: "c1e8e211-cdf7-4544-a34c-e10d55e42c84",
      opType: "object.create",
      payload: {
        id: "not-a-uuid",
        type: "stroke",
      },
      sentAt: "2026-05-04T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("accepts board creation and join payloads", () => {
    expect(
      BoardCreateRequestSchema.parse({
        name: "Planning Session",
        templateId: "blank",
        displayName: "Owner",
      }).name,
    ).toBe("Planning Session");

    expect(
      JoinBoardRequestSchema.parse({
        displayName: "Guest",
        shareCode: "ABC123",
      }).shareCode,
    ).toBe("ABC123");
  });

  it("exports role and error schemas", () => {
    expect(RoleSchema.parse("view")).toBe("view");

    expect(
      ServerErrorSchema.parse({
        type: "server.error",
        code: "invalid_payload",
        message: "Operation rejected.",
        recoverable: true,
        ref: "abc",
      }).type,
    ).toBe("server.error");
  });
});
