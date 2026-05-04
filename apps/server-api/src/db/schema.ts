import {
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const boards = pgTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  templateId: text("template_id").notNull(),
  shareCode: text("share_code").notNull(),
  createdAt: text("created_at").notNull(),
});

export const operations = pgTable(
  "operations",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    boardId: text("board_id").notNull(),
    serverSeq: integer("server_seq").notNull(),
    clientId: text("client_id").notNull(),
    clientSeq: integer("client_seq").notNull(),
    opId: text("op_id").notNull(),
    opType: text("op_type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    boardSeqUnique: uniqueIndex("board_seq_unique").on(
      table.boardId,
      table.serverSeq,
    ),
    boardOpUnique: uniqueIndex("board_op_unique").on(table.boardId, table.opId),
  }),
);
