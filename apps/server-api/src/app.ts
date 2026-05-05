import {
  BoardCreateRequestSchema,
  type BoardObject,
  type ClientOpEnvelope,
  ClientOpEnvelopeSchema,
  JoinBoardRequestSchema,
  PresenceMessageSchema,
  type Role,
  RoleSchema,
  ServerErrorSchema,
  ServerWelcomeSchema,
  SnapshotResponseSchema,
  TEMPLATES,
  getTemplate,
} from "@dexdraw/shared-protocol";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import type { WebSocket } from "@fastify/websocket";
import Fastify from "fastify";
import { canPerformDurableOp } from "./auth/roles";
import { createBoardToken, verifyBoardToken } from "./auth/token";
import { type DexDrawStore, createStore } from "./db/store";

const MAX_MESSAGE_BYTES = 64 * 1024;
const RATE_LIMIT_WINDOW_MS = 1_000;
const RATE_LIMIT_MAX_MESSAGES = 60;

type BuildAppOptions = {
  dataDir?: string;
  tokenSecret?: string;
  publicClientOrigin?: string;
};

type ConnectionContext = {
  boardId: string;
  role: Role;
  clientId: string;
  socket: WebSocket;
  recentMessages: number[];
};

function createServerError(
  code:
    | "invalid_payload"
    | "unauthorized"
    | "forbidden"
    | "oversized_payload"
    | "rate_limited",
  message: string,
  recoverable = true,
  ref?: string,
) {
  return ServerErrorSchema.parse({
    type: "server.error",
    code,
    message,
    recoverable,
    ref,
  });
}

function sendJson(socket: WebSocket, payload: unknown) {
  socket.send(JSON.stringify(payload));
}

function snapshotFromOps(ops: Array<{ opType: string; payload: unknown }>) {
  const checkpointSlot = new Map<string, number>();
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.opType === "checkpoint.create") {
      checkpointSlot.set((op.payload as { id: string }).id, i);
    }
  }

  function replaySlice(limit: number): Map<string, BoardObject> {
    const objs = new Map<string, BoardObject>();
    for (let i = 0; i < limit; i++) {
      const op = ops[i];
      if (op.opType === "object.create") {
        objs.set((op.payload as BoardObject).id, op.payload as BoardObject);
      } else if (op.opType === "object.update") {
        const { id, patch } = op.payload as {
          id: string;
          patch: Partial<BoardObject>;
        };
        const prev = objs.get(id);
        if (prev) objs.set(id, { ...prev, ...patch } as BoardObject);
      } else if (op.opType === "object.delete") {
        objs.delete((op.payload as { id: string }).id);
      } else if (op.opType === "object.reorder") {
        const { id, zIndex } = op.payload as { id: string; zIndex: number };
        const prev = objs.get(id);
        if (prev) objs.set(id, { ...prev, zIndex } as BoardObject);
      } else if (op.opType === "checkpoint.restore") {
        const cpIdx = checkpointSlot.get((op.payload as { id: string }).id);
        if (cpIdx !== undefined) {
          objs.clear();
          for (const [k, v] of replaySlice(cpIdx)) {
            objs.set(k, v);
          }
        }
      }
      // checkpoint.create: no-op for board state
    }
    return objs;
  }

  const objects = replaySlice(ops.length);
  return [...objects.values()].sort((a, b) => a.zIndex - b.zIndex);
}

function exceededRateLimit(context: ConnectionContext) {
  const now = Date.now();
  context.recentMessages = context.recentMessages.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  context.recentMessages.push(now);
  return context.recentMessages.length > RATE_LIMIT_MAX_MESSAGES;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const tokenSecret =
    options.tokenSecret ??
    process.env.TOKEN_SECRET ??
    "dev-only-secret-change-me";

  if (
    (process.env.NODE_ENV ?? "development") === "production" &&
    tokenSecret === "dev-only-secret-change-me"
  ) {
    throw new Error(
      "Refusing to start with the default production token secret.",
    );
  }

  const app = Fastify({ logger: false });
  const store = await createStore(options.dataDir);
  const rooms = new Map<string, Set<ConnectionContext>>();

  await app.register(cors, {
    origin: options.publicClientOrigin ?? true,
  });
  await app.register(websocket);

  app.get("/health", async () => ({ ok: true, service: "dexdraw-vnext" }));

  app.get("/api/templates", async () => ({
    templates: TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
    })),
  }));

  app.post("/api/boards", async (request, reply) => {
    const payload = BoardCreateRequestSchema.parse(request.body);
    const board = await store.createBoard({
      name: payload.name,
      templateId: payload.templateId,
      displayName: payload.displayName,
      template: getTemplate(payload.templateId),
    });

    const ownerToken = await createBoardToken(tokenSecret, {
      boardId: board.boardId,
      role: "owner",
      displayName: payload.displayName,
    });

    return reply.send({
      boardId: board.boardId,
      shareCode: board.shareCode,
      ownerToken,
      boardUrl: `/boards/${board.boardId}`,
      name: board.name,
      templateId: board.templateId,
    });
  });

  app.post("/api/boards/:boardId/join", async (request, reply) => {
    const params = request.params as { boardId: string };
    const payload = JoinBoardRequestSchema.parse(request.body);
    const role = payload.requestedRole ?? "edit";

    const board = await store.getBoard(params.boardId);
    if (!board || board.shareCode !== payload.shareCode) {
      return reply
        .status(403)
        .send(createServerError("unauthorized", "Share code rejected.", false));
    }

    const token = await createBoardToken(tokenSecret, {
      boardId: params.boardId,
      role,
      displayName: payload.displayName,
    });

    return reply.send({
      boardId: params.boardId,
      token,
      role,
      boardUrl: `/boards/${params.boardId}`,
    });
  });

  app.get("/api/boards/:boardId/snapshot", async (request, reply) => {
    const params = request.params as { boardId: string };
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;

    if (!token) {
      return reply
        .status(401)
        .send(createServerError("unauthorized", "Missing token.", false));
    }

    const verified = await verifyBoardToken(tokenSecret, token).catch(
      () => null,
    );
    if (!verified || verified.boardId !== params.boardId) {
      return reply
        .status(403)
        .send(createServerError("unauthorized", "Invalid token.", false));
    }

    const ops = await store.getOps(params.boardId);
    return reply.send(
      SnapshotResponseSchema.parse({
        boardId: params.boardId,
        serverSeq: ops.at(-1)?.serverSeq ?? 0,
        objects: snapshotFromOps(ops),
      }),
    );
  });

  app.get("/api/boards/:boardId/checkpoints", async (request, reply) => {
    const params = request.params as { boardId: string };
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;

    if (!token) {
      return reply
        .status(401)
        .send(createServerError("unauthorized", "Missing token.", false));
    }

    const verified = await verifyBoardToken(tokenSecret, token).catch(
      () => null,
    );
    if (!verified || verified.boardId !== params.boardId) {
      return reply
        .status(403)
        .send(createServerError("unauthorized", "Invalid token.", false));
    }

    const ops = await store.getOps(params.boardId);
    const checkpoints = ops
      .filter((op) => op.opType === "checkpoint.create")
      .map((op) => {
        const payload = op.payload as { id: string; name: string };
        return {
          id: payload.id,
          name: payload.name,
          serverSeq: op.serverSeq,
          createdAt: op.createdAt,
        };
      });

    return reply.send({ checkpoints });
  });

  app.get(
    "/ws/boards/:boardId",
    { websocket: true },
    async (socket, request) => {
      const params = request.params as { boardId: string };
      const token = (request.query as { token?: string }).token;

      if (!token) {
        socket.close(4001, "Missing token");
        return;
      }

      const verified = await verifyBoardToken(tokenSecret, token).catch(
        () => null,
      );
      if (!verified || verified.boardId !== params.boardId) {
        socket.close(4003, "Unauthorized");
        return;
      }

      const context: ConnectionContext = {
        boardId: params.boardId,
        role: verified.role,
        clientId: crypto.randomUUID(),
        socket,
        recentMessages: [],
      };

      const room = rooms.get(params.boardId) ?? new Set<ConnectionContext>();
      room.add(context);
      rooms.set(params.boardId, room);

      const initialOps = await store.getOps(params.boardId);
      sendJson(
        socket,
        ServerWelcomeSchema.parse({
          type: "server.welcome",
          boardId: params.boardId,
          role: verified.role,
          serverSeq: initialOps.at(-1)?.serverSeq ?? 0,
          snapshot: snapshotFromOps(initialOps),
        }),
      );

      socket.on("message", async (raw: string | Buffer) => {
        const size = typeof raw === "string" ? raw.length : raw.byteLength;
        if (size > MAX_MESSAGE_BYTES) {
          sendJson(
            socket,
            createServerError("oversized_payload", "Message too large."),
          );
          return;
        }

        if (exceededRateLimit(context)) {
          sendJson(
            socket,
            createServerError("rate_limited", "Too many messages."),
          );
          return;
        }

        let message: unknown;
        try {
          message = JSON.parse(String(raw));
        } catch {
          sendJson(
            socket,
            createServerError("invalid_payload", "Invalid JSON."),
          );
          return;
        }

        const presenceParse = PresenceMessageSchema.safeParse(message);
        if (presenceParse.success) {
          for (const peer of room) {
            if (peer !== context) {
              sendJson(peer.socket, presenceParse.data);
            }
          }
          return;
        }

        const opParse = ClientOpEnvelopeSchema.safeParse(message);
        if (!opParse.success) {
          sendJson(
            socket,
            createServerError("invalid_payload", "Operation rejected."),
          );
          return;
        }

        const op = opParse.data;
        if (op.boardId !== context.boardId) {
          sendJson(
            socket,
            createServerError(
              "unauthorized",
              "Board mismatch.",
              false,
              op.opId,
            ),
          );
          return;
        }

        if (!canPerformDurableOp(context.role, op.opType, op.payload)) {
          sendJson(
            socket,
            createServerError(
              "forbidden",
              "Role cannot mutate board.",
              false,
              op.opId,
            ),
          );
          return;
        }

        const canonical = await store.appendOperation(op);
        for (const peer of room) {
          sendJson(peer.socket, canonical);
        }

        if (canonical.opType === "checkpoint.restore") {
          const allOps = await store.getOps(canonical.boardId);
          const resetMsg = {
            type: "server.snapshot_reset" as const,
            boardId: canonical.boardId,
            serverSeq: canonical.serverSeq,
            snapshot: snapshotFromOps(allOps),
          };
          for (const peer of room) {
            sendJson(peer.socket, resetMsg);
          }
        }
      });

      socket.on("close", () => {
        room.delete(context);
        if (room.size === 0) {
          rooms.delete(params.boardId);
        }
      });
    },
  );

  app.addHook("onClose", async () => {
    await store.close();
  });

  return { app, store };
}
