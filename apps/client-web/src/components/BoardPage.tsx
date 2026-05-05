import { type Point, normalizeStroke } from "@dexdraw/shared-core";
import type {
  BoardObject,
  Role,
  ServerOpEnvelope,
} from "@dexdraw/shared-protocol";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "react-router-dom";
import { applyCanonicalOperation } from "../lib/boardState";
import { exportSvgToPng } from "../lib/export";
import { hitTestObjects } from "../lib/hitTest";
import { type RemotePresence, mergePresence } from "../lib/presence";
import {
  getBoardShareCode,
  getBoardToken,
  getClientId,
  getDisplayName,
} from "../lib/session";
import { BoardCanvas } from "./BoardCanvas";
import { InlineEditor } from "./InlineEditor";
import { type Tool, Toolbar } from "./Toolbar";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

type UndoEntry =
  | { kind: "create"; object: BoardObject }
  | {
      kind: "update";
      id: string;
      prev: Partial<BoardObject>;
      next: Partial<BoardObject>;
    }
  | { kind: "delete"; object: BoardObject };

export function BoardPage() {
  const { boardId = "" } = useParams();
  const clientId = useMemo(() => getClientId(), []);
  const token = boardId ? getBoardToken(boardId) : null;
  const shareCode = boardId ? getBoardShareCode(boardId) : null;
  const displayName = getDisplayName();
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [role, setRole] = useState<Role>("view");
  const [error, setError] = useState<string | null>(null);
  const [remotePresence, setRemotePresence] = useState<RemotePresence[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const clientSeqRef = useRef(0);
  const strokeRef = useRef<Point[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const objectsRef = useRef<BoardObject[]>([]);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const redoStackRef = useRef<UndoEntry[]>([]);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    if (!boardId || !token) {
      setStatus("disconnected");
      setError(
        "Missing board token. Create or join the board from the home screen.",
      );
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(
      `${protocol}//${window.location.host}/ws/boards/${boardId}?token=${encodeURIComponent(token)}`,
    );
    socketRef.current = socket;
    setStatus("connecting");
    setError(null);

    socket.addEventListener("open", () => {
      setStatus("connected");
    });

    socket.addEventListener("close", () => {
      setStatus("disconnected");
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));

      if (message.type === "server.welcome") {
        setRole(message.role);
        setObjects(message.snapshot);
        return;
      }

      if (message.type === "server.op") {
        setObjects((current) =>
          applyCanonicalOperation(current, message as ServerOpEnvelope),
        );
        return;
      }

      if (
        message.type === "presence.cursor" ||
        message.type === "presence.laser"
      ) {
        setRemotePresence((current) =>
          mergePresence(current, message as RemotePresence),
        );
        return;
      }

      if (message.type === "server.error") {
        setError(message.message);
      }
    });

    return () => {
      socket.close();
    };
  }, [boardId, token]);

  function pointerToSvgPoint(event: ReactPointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1600,
      y: ((event.clientY - rect.top) / rect.height) * 900,
      pressure: event.pressure || 0.5,
    };
  }

  function nextObjectBase(now: string) {
    return {
      id: crypto.randomUUID(),
      createdBy: displayName,
      createdAt: now,
      updatedAt: now,
      zIndex: objectsRef.current.length,
    };
  }

  function sendPresence(
    point: Point,
    presenceType: "presence.cursor" | "presence.laser",
  ) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    socketRef.current.send(
      JSON.stringify({
        type: presenceType,
        boardId,
        clientId,
        x: point.x,
        y: point.y,
        sentAt: new Date().toISOString(),
        displayName,
      }),
    );
  }

  function pushUndo(entry: UndoEntry) {
    undoStackRef.current.push(entry);
    redoStackRef.current = [];
    setUndoCount(undoStackRef.current.length);
    setRedoCount(0);
  }

  function sendRaw(
    opType: string,
    payload: unknown,
    skipUndoRecord?: boolean,
  ): void {
    if (!socketRef.current) return;
    clientSeqRef.current += 1;
    socketRef.current.send(
      JSON.stringify({
        type: "client.op",
        boardId,
        clientId,
        clientSeq: clientSeqRef.current,
        opId: crypto.randomUUID(),
        opType,
        payload,
        sentAt: new Date().toISOString(),
      }),
    );
    void skipUndoRecord;
  }

  function sendObjectCreate(object: BoardObject) {
    setObjects((current) =>
      [...current.filter((item) => item.id !== object.id), object].sort(
        (left, right) => left.zIndex - right.zIndex,
      ),
    );
    sendRaw("object.create", object);
    pushUndo({ kind: "create", object });
  }

  function sendObjectUpdate(id: string, patch: Partial<BoardObject>) {
    const previous = objectsRef.current.find((o) => o.id === id);
    if (!previous) return;

    const prevFields: Partial<BoardObject> = {};
    for (const key of Object.keys(patch) as Array<keyof BoardObject>) {
      (prevFields as Record<string, unknown>)[key] = previous[key];
    }

    setObjects((current) =>
      applyCanonicalOperation(current, {
        type: "server.op",
        boardId,
        serverSeq: -1,
        clientId,
        clientSeq: -1,
        opId: crypto.randomUUID(),
        opType: "object.update",
        payload: { id, patch },
        createdAt: new Date().toISOString(),
      }),
    );
    sendRaw("object.update", { id, patch });
    pushUndo({ kind: "update", id, prev: prevFields, next: patch });
  }

  function sendObjectDelete(id: string) {
    const object = objectsRef.current.find((o) => o.id === id);
    if (!object) return;

    setObjects((current) => current.filter((o) => o.id !== id));
    if (selectedObjectId === id) setSelectedObjectId(null);
    sendRaw("object.delete", { id });
    pushUndo({ kind: "delete", object });
  }

  function handleUndo() {
    const entry = undoStackRef.current.pop();
    if (!entry) return;

    if (entry.kind === "create") {
      setObjects((current) => current.filter((o) => o.id !== entry.object.id));
      sendRaw("object.delete", { id: entry.object.id }, true);
      redoStackRef.current.push(entry);
    } else if (entry.kind === "update") {
      setObjects((current) =>
        applyCanonicalOperation(current, {
          type: "server.op",
          boardId,
          serverSeq: -1,
          clientId,
          clientSeq: -1,
          opId: crypto.randomUUID(),
          opType: "object.update",
          payload: { id: entry.id, patch: entry.prev },
          createdAt: new Date().toISOString(),
        }),
      );
      sendRaw("object.update", { id: entry.id, patch: entry.prev }, true);
      redoStackRef.current.push(entry);
    } else if (entry.kind === "delete") {
      setObjects((current) =>
        [...current, entry.object].sort((a, b) => a.zIndex - b.zIndex),
      );
      sendRaw("object.create", entry.object, true);
      redoStackRef.current.push(entry);
    }

    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }

  function handleRedo() {
    const entry = redoStackRef.current.pop();
    if (!entry) return;

    if (entry.kind === "create") {
      setObjects((current) =>
        [...current.filter((o) => o.id !== entry.object.id), entry.object].sort(
          (a, b) => a.zIndex - b.zIndex,
        ),
      );
      sendRaw("object.create", entry.object, true);
      undoStackRef.current.push(entry);
    } else if (entry.kind === "update") {
      setObjects((current) =>
        applyCanonicalOperation(current, {
          type: "server.op",
          boardId,
          serverSeq: -1,
          clientId,
          clientSeq: -1,
          opId: crypto.randomUUID(),
          opType: "object.update",
          payload: { id: entry.id, patch: entry.next },
          createdAt: new Date().toISOString(),
        }),
      );
      sendRaw("object.update", { id: entry.id, patch: entry.next }, true);
      undoStackRef.current.push(entry);
    } else if (entry.kind === "delete") {
      setObjects((current) => current.filter((o) => o.id !== entry.object.id));
      sendRaw("object.delete", { id: entry.object.id }, true);
      undoStackRef.current.push(entry);
    }

    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: sendObjectDelete/handleUndo/handleRedo are recreated but always close over up-to-date state; the key state they depend on (selectedObjectId, role) is already listed
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (editingObjectId) return;
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedObjectId &&
        role !== "view"
      ) {
        e.preventDefault();
        sendObjectDelete(selectedObjectId);
        return;
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (
        (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingObjectId, selectedObjectId, role]);

  function handleObjectPointerDown(
    id: string,
    event: ReactPointerEvent<SVGElement>,
  ) {
    if (tool === "select") {
      setSelectedObjectId(id);
    }
    // For other tools, let the canvas-level handler decide (event already stopped)
    void event;
  }

  function handleObjectDoubleClick(id: string) {
    const object = objectsRef.current.find((o) => o.id === id);
    if (!object) return;
    if (object.type === "text" || object.type === "note") {
      setEditingObjectId(id);
      setSelectedObjectId(null);
    }
  }

  function handleInlineCommit(id: string, newText: string) {
    setEditingObjectId(null);
    const object = objectsRef.current.find((o) => o.id === id);
    if (!object) return;
    if (
      (object.type === "text" || object.type === "note") &&
      newText !== object.text
    ) {
      sendObjectUpdate(id, { text: newText } as Partial<BoardObject>);
    }
  }

  function handleInlineCancel() {
    setEditingObjectId(null);
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (role === "view") return;
    if (editingObjectId) return;

    const point = pointerToSvgPoint(event);

    if (tool === "select") {
      const hit = hitTestObjects(objectsRef.current, point.x, point.y);
      setSelectedObjectId(hit?.id ?? null);
      return;
    }

    if (tool === "text" || tool === "note") {
      const now = new Date().toISOString();
      const object: BoardObject =
        tool === "text"
          ? {
              ...nextObjectBase(now),
              type: "text",
              x: point.x,
              y: point.y,
              text: "Text",
              style: {
                color: "#111827",
                fontSize: 24,
              },
            }
          : {
              ...nextObjectBase(now),
              type: "note",
              x: point.x,
              y: point.y,
              width: 180,
              height: 110,
              text: "Note",
            };
      sendObjectCreate(object);
      return;
    }

    if (tool === "rectangle" || tool === "ellipse") {
      shapeStartRef.current = point;
      strokeRef.current = [point, point];
      setCurrentStroke([point, point]);
      return;
    }

    const nextStroke = [point];
    strokeRef.current = nextStroke;
    setCurrentStroke(nextStroke);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const point = pointerToSvgPoint(event);
    sendPresence(
      point,
      tool === "laser" ? "presence.laser" : "presence.cursor",
    );

    if (
      strokeRef.current.length === 0 ||
      role === "view" ||
      tool === "select"
    ) {
      return;
    }

    if (tool === "rectangle" || tool === "ellipse") {
      const anchor = shapeStartRef.current ?? point;
      const nextStroke = [anchor, point];
      strokeRef.current = nextStroke;
      setCurrentStroke(nextStroke);
      return;
    }

    const nextStroke = [...strokeRef.current, point];
    strokeRef.current = nextStroke;
    setCurrentStroke(nextStroke);
  }

  function handlePointerUp() {
    if (strokeRef.current.length < 2 || role === "view" || !socketRef.current) {
      shapeStartRef.current = null;
      strokeRef.current = [];
      setCurrentStroke([]);
      return;
    }

    if (tool === "rectangle" || tool === "ellipse") {
      const start = strokeRef.current[0];
      const end = strokeRef.current[1];
      if (!start || !end) {
        shapeStartRef.current = null;
        strokeRef.current = [];
        setCurrentStroke([]);
        return;
      }
      const now = new Date().toISOString();
      if (tool === "rectangle") {
        const object: BoardObject = {
          ...nextObjectBase(now),
          type: "rectangle",
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
          style: {
            strokeColor: "#111827",
            fillColor: "rgba(249,115,22,0.12)",
          },
        };
        if (object.width === 0 || object.height === 0) {
          shapeStartRef.current = null;
          strokeRef.current = [];
          setCurrentStroke([]);
          return;
        }
        sendObjectCreate(object);
      } else {
        const object: BoardObject = {
          ...nextObjectBase(now),
          type: "ellipse",
          cx: (start.x + end.x) / 2,
          cy: (start.y + end.y) / 2,
          rx: Math.abs(end.x - start.x) / 2,
          ry: Math.abs(end.y - start.y) / 2,
          style: {
            strokeColor: "#111827",
            fillColor: "rgba(15,118,110,0.14)",
          },
        };
        if (object.rx === 0 || object.ry === 0) {
          shapeStartRef.current = null;
          strokeRef.current = [];
          setCurrentStroke([]);
          return;
        }
        sendObjectCreate(object);
      }
      shapeStartRef.current = null;
      strokeRef.current = [];
      setCurrentStroke([]);
      return;
    }

    if (tool === "laser") {
      shapeStartRef.current = null;
      strokeRef.current = [];
      setCurrentStroke([]);
      return;
    }

    const normalized = normalizeStroke(strokeRef.current);
    if (normalized.length < 2) {
      shapeStartRef.current = null;
      strokeRef.current = [];
      setCurrentStroke([]);
      return;
    }

    const now = new Date().toISOString();
    const object: BoardObject = {
      ...nextObjectBase(now),
      type: "stroke",
      points: normalized,
      style: {
        color: "#111827",
        width: 3,
      },
    };

    sendObjectCreate(object);
    shapeStartRef.current = null;
    strokeRef.current = [];
    setCurrentStroke([]);
  }

  async function handleExportPng() {
    if (!canvasRef.current || objects.length === 0) return;
    await exportSvgToPng(canvasRef.current, `dexdraw-${boardId}.png`);
  }

  const editingObject =
    editingObjectId !== null
      ? objects.find(
          (o) =>
            o.id === editingObjectId &&
            (o.type === "text" || o.type === "note"),
        )
      : null;

  return (
    <main className="board-shell">
      <header className="board-topbar">
        <div className="meta-group">
          <strong>DexDraw vNext</strong>
          <span className="meta-line" data-testid="board-id">
            {boardId}
          </span>
          <span className="meta-line">
            Share code:{" "}
            <strong data-testid="share-code">{shareCode ?? "Unknown"}</strong>
          </span>
        </div>

        <Toolbar
          activeTool={tool}
          canDraw={role !== "view"}
          roleLabel={role}
          undoCount={undoCount}
          redoCount={redoCount}
          onToolChange={setTool}
          onExportPng={handleExportPng}
          onUndo={handleUndo}
          onRedo={handleRedo}
          exportDisabled={objects.length === 0}
        />

        <div className="meta-group">
          <span className="status-pill" data-status={status}>
            Status: {status}
          </span>
        </div>
      </header>

      {error ? <div className="board-error">{error}</div> : null}

      <section className="board-stage">
        <BoardCanvas
          ref={canvasRef}
          objects={objects}
          currentStroke={currentStroke}
          remotePresence={remotePresence}
          selectedObjectId={selectedObjectId}
          editingObjectId={editingObjectId}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onObjectPointerDown={handleObjectPointerDown}
          onObjectDoubleClick={handleObjectDoubleClick}
        />
        {editingObject && canvasRef.current ? (
          <InlineEditor
            object={
              editingObject as Extract<
                typeof editingObject,
                { type: "text" | "note" }
              >
            }
            canvasEl={canvasRef.current}
            onCommit={handleInlineCommit}
            onCancel={handleInlineCancel}
          />
        ) : null}
      </section>
    </main>
  );
}
