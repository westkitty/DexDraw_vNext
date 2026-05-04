import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type {
  BoardObject,
  ClientOpEnvelope,
  ServerOpEnvelope,
} from "@dexdraw/shared-protocol";
import { PGlite } from "@electric-sql/pglite";
import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { boards, operations } from "./schema";

type Template = {
  id: string;
  name: string;
  description: string;
  objects: BoardObject[];
};

export type DexDrawStore = Awaited<ReturnType<typeof createStore>>;

function createShareCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function ensureSchema(client: PGlite) {
  await client.exec(`
    create table if not exists boards (
      id text primary key,
      name text not null,
      template_id text not null,
      share_code text not null,
      created_at text not null
    );

    create table if not exists operations (
      id integer primary key generated always as identity,
      board_id text not null,
      server_seq integer not null,
      client_id text not null,
      client_seq integer not null,
      op_id text not null,
      op_type text not null,
      payload jsonb not null,
      created_at text not null
    );

    create unique index if not exists board_seq_unique on operations(board_id, server_seq);
    create unique index if not exists board_op_unique on operations(board_id, op_id);
  `);
}

export async function createStore(
  dataDir = join(process.cwd(), "apps/server-api/.dexdraw-data"),
) {
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  await ensureSchema(client);
  const db = drizzle(client);

  return {
    async createBoard(input: {
      name: string;
      templateId: string;
      displayName: string;
      template: Template;
    }) {
      const boardId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const shareCode = createShareCode();

      await db.insert(boards).values({
        id: boardId,
        name: input.name,
        templateId: input.templateId,
        shareCode,
        createdAt,
      });

      let serverSeq = 0;
      for (const object of input.template.objects) {
        serverSeq += 1;
        await db.insert(operations).values({
          boardId,
          serverSeq,
          clientId: "system",
          clientSeq: serverSeq,
          opId: crypto.randomUUID(),
          opType: "object.create",
          payload: object,
          createdAt,
        });
      }

      return {
        boardId,
        shareCode,
        name: input.name,
        templateId: input.templateId,
      };
    },

    async getBoard(boardId: string) {
      const result = await db
        .select()
        .from(boards)
        .where(eq(boards.id, boardId))
        .limit(1);
      return result[0];
    },

    async getOps(boardId: string) {
      return db
        .select()
        .from(operations)
        .where(eq(operations.boardId, boardId))
        .orderBy(asc(operations.serverSeq));
    },

    async appendOperation(op: ClientOpEnvelope): Promise<ServerOpEnvelope> {
      const existing = await db
        .select()
        .from(operations)
        .where(eq(operations.opId, op.opId))
        .limit(1);

      if (existing[0]) {
        return {
          type: "server.op",
          boardId: existing[0].boardId,
          serverSeq: existing[0].serverSeq,
          clientId: existing[0].clientId,
          clientSeq: existing[0].clientSeq,
          opId: existing[0].opId,
          opType: existing[0].opType as ClientOpEnvelope["opType"],
          payload: existing[0].payload,
          createdAt: existing[0].createdAt,
        };
      }

      const latest = await db
        .select({ serverSeq: operations.serverSeq })
        .from(operations)
        .where(eq(operations.boardId, op.boardId))
        .orderBy(desc(operations.serverSeq))
        .limit(1);

      const serverSeq = (latest[0]?.serverSeq ?? 0) + 1;
      const createdAt = new Date().toISOString();

      await db.insert(operations).values({
        boardId: op.boardId,
        serverSeq,
        clientId: op.clientId,
        clientSeq: op.clientSeq,
        opId: op.opId,
        opType: op.opType,
        payload: op.payload,
        createdAt,
      });

      return {
        type: "server.op",
        boardId: op.boardId,
        serverSeq,
        clientId: op.clientId,
        clientSeq: op.clientSeq,
        opId: op.opId,
        opType: op.opType,
        payload: op.payload,
        createdAt,
      };
    },

    async close() {
      await client.close();
    },
  };
}
