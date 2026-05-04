import { z } from "zod";

export const RoleSchema = z.enum(["owner", "edit", "comment", "view"]);
export type Role = z.infer<typeof RoleSchema>;

export const DurableOpTypeSchema = z.enum([
  "object.create",
  "object.update",
  "object.delete",
  "object.reorder",
  "checkpoint.create",
  "checkpoint.restore",
]);
export type DurableOpType = z.infer<typeof DurableOpTypeSchema>;

export const EphemeralMessageTypeSchema = z.enum([
  "presence.cursor",
  "presence.laser",
  "presence.selection",
  "client.ping",
]);

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  pressure: z.number().min(0).max(1).optional(),
});
export type Point = z.infer<typeof PointSchema>;

const IsoDateSchema = z.string().datetime({ offset: true });

export const ObjectStyleSchema = z.object({
  color: z.string().optional(),
  strokeColor: z.string().optional(),
  fillColor: z.string().optional(),
  width: z.number().positive().optional(),
  fontSize: z.number().positive().optional(),
});

const BaseBoardObjectSchema = z.object({
  id: z.string().uuid(),
  createdBy: z.string(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  zIndex: z.number().int(),
});

export const StrokeObjectSchema = BaseBoardObjectSchema.extend({
  type: z.literal("stroke"),
  points: z.array(PointSchema).min(2),
  style: ObjectStyleSchema.extend({
    color: z.string(),
    width: z.number().positive(),
  }),
});

export const RectangleObjectSchema = BaseBoardObjectSchema.extend({
  type: z.literal("rectangle"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  style: ObjectStyleSchema,
});

export const EllipseObjectSchema = BaseBoardObjectSchema.extend({
  type: z.literal("ellipse"),
  cx: z.number(),
  cy: z.number(),
  rx: z.number().nonnegative(),
  ry: z.number().nonnegative(),
  style: ObjectStyleSchema,
});

export const TextObjectSchema = BaseBoardObjectSchema.extend({
  type: z.literal("text"),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  style: ObjectStyleSchema.extend({
    color: z.string().optional(),
    fontSize: z.number().positive().optional(),
  }),
});

export const NoteObjectSchema = BaseBoardObjectSchema.extend({
  type: z.literal("note"),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  text: z.string(),
});

export const BoardObjectSchema = z.discriminatedUnion("type", [
  StrokeObjectSchema,
  RectangleObjectSchema,
  EllipseObjectSchema,
  TextObjectSchema,
  NoteObjectSchema,
]);
export type BoardObject = z.infer<typeof BoardObjectSchema>;

export const CreateObjectPayloadSchema = BoardObjectSchema;

export const UpdateObjectPayloadSchema = z.object({
  id: z.string().uuid(),
  patch: z.record(z.string(), z.unknown()),
});

export const DeleteObjectPayloadSchema = z.object({
  id: z.string().uuid(),
});

export const ReorderObjectPayloadSchema = z.object({
  id: z.string().uuid(),
  zIndex: z.number().int(),
});

export const CheckpointCreatePayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

export const CheckpointRestorePayloadSchema = z.object({
  id: z.string().uuid(),
});

export const ClientOpEnvelopeSchema = z
  .object({
    type: z.literal("client.op"),
    boardId: z.string().uuid(),
    clientId: z.string().uuid(),
    clientSeq: z.number().int().positive(),
    opId: z.string().uuid(),
    opType: DurableOpTypeSchema,
    payload: z.unknown(),
    sentAt: IsoDateSchema,
  })
  .superRefine((value, ctx) => {
    const payloadSchema =
      value.opType === "object.create"
        ? CreateObjectPayloadSchema
        : value.opType === "object.update"
          ? UpdateObjectPayloadSchema
          : value.opType === "object.delete"
            ? DeleteObjectPayloadSchema
            : value.opType === "object.reorder"
              ? ReorderObjectPayloadSchema
              : value.opType === "checkpoint.create"
                ? CheckpointCreatePayloadSchema
                : CheckpointRestorePayloadSchema;

    const parsed = payloadSchema.safeParse(value.payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payload", ...issue.path],
          message: issue.message,
        });
      }
    }
  });
export type ClientOpEnvelope = z.infer<typeof ClientOpEnvelopeSchema>;

export const ServerOpEnvelopeSchema = z.object({
  type: z.literal("server.op"),
  boardId: z.string().uuid(),
  serverSeq: z.number().int().positive(),
  clientId: z.string().uuid(),
  clientSeq: z.number().int().positive(),
  opId: z.string().uuid(),
  opType: DurableOpTypeSchema,
  payload: z.unknown(),
  createdAt: IsoDateSchema,
});
export type ServerOpEnvelope = z.infer<typeof ServerOpEnvelopeSchema>;

export const PresenceMessageSchema = z.object({
  type: z.enum(["presence.cursor", "presence.laser"]),
  boardId: z.string().uuid(),
  clientId: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  sentAt: IsoDateSchema,
  displayName: z.string().min(1).max(80),
});

export const ServerWelcomeSchema = z.object({
  type: z.literal("server.welcome"),
  boardId: z.string().uuid(),
  role: RoleSchema,
  serverSeq: z.number().int().nonnegative(),
  snapshot: z.array(BoardObjectSchema),
});

export const ServerErrorSchema = z.object({
  type: z.literal("server.error"),
  code: z.enum([
    "invalid_payload",
    "unauthorized",
    "forbidden",
    "oversized_payload",
    "rate_limited",
  ]),
  message: z.string(),
  recoverable: z.boolean(),
  ref: z.string().optional(),
});

export const BoardCreateRequestSchema = z.object({
  name: z.string().min(1).max(120),
  templateId: z.string().default("blank"),
  displayName: z.string().min(1).max(80),
});

export const BoardCreateResponseSchema = z.object({
  boardId: z.string().uuid(),
  shareCode: z.string(),
  ownerToken: z.string(),
  boardUrl: z.string(),
  name: z.string(),
  templateId: z.string(),
});

export const JoinBoardRequestSchema = z.object({
  displayName: z.string().min(1).max(80),
  shareCode: z.string().min(4).max(16),
  requestedRole: z.enum(["edit", "view"]).optional(),
});

export const JoinBoardResponseSchema = z.object({
  boardId: z.string().uuid(),
  token: z.string(),
  role: RoleSchema,
  boardUrl: z.string(),
});

export const SnapshotResponseSchema = z.object({
  boardId: z.string().uuid(),
  serverSeq: z.number().int().nonnegative(),
  objects: z.array(BoardObjectSchema),
});

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  objects: z.array(BoardObjectSchema),
});

const templateTimestamp = "2026-05-04T00:00:00.000Z";

export const TEMPLATES = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from an empty board.",
    objects: [],
  },
  {
    id: "meeting-grid",
    name: "Meeting Grid",
    description: "Simple lanes for agenda, decisions, and actions.",
    objects: [
      {
        id: "1b4ba4ee-dc18-40bc-afeb-4cfadf08f755",
        type: "rectangle",
        x: 40,
        y: 60,
        width: 260,
        height: 180,
        style: { strokeColor: "#1f2937", fillColor: "#f9fafb" },
        createdBy: "system",
        createdAt: templateTimestamp,
        updatedAt: templateTimestamp,
        zIndex: 0,
      },
      {
        id: "6dc0809f-8475-4612-9003-fc1c6257f7c7",
        type: "text",
        x: 64,
        y: 100,
        text: "Agenda",
        style: { color: "#111827", fontSize: 24 },
        createdBy: "system",
        createdAt: templateTimestamp,
        updatedAt: templateTimestamp,
        zIndex: 1,
      },
    ],
  },
] satisfies z.infer<typeof TemplateSchema>[];

export function getTemplate(templateId: string) {
  return (
    TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0]
  );
}
