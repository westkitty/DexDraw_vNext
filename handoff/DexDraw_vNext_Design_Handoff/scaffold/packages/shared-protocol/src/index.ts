import { z } from "zod";

export const RoleSchema = z.enum(["owner", "edit", "comment", "view"]);
export type Role = z.infer<typeof RoleSchema>;

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  pressure: z.number().optional()
});

export const StrokeObjectSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("stroke"),
  points: z.array(PointSchema).min(1),
  style: z.record(z.string(), z.unknown()).default({}),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  zIndex: z.number().int()
});

export const BoardObjectSchema = z.discriminatedUnion("type", [StrokeObjectSchema]);

export const ClientOpEnvelopeSchema = z.object({
  type: z.literal("client.op"),
  boardId: z.string().uuid(),
  clientId: z.string().uuid(),
  clientSeq: z.number().int().positive(),
  opId: z.string().uuid(),
  opType: z.enum(["object.create", "object.update", "object.delete", "object.reorder", "checkpoint.create", "checkpoint.restore"]),
  payload: z.unknown(),
  sentAt: z.string()
});

export type ClientOpEnvelope = z.infer<typeof ClientOpEnvelopeSchema>;
