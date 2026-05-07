import { type Point, normalizeStroke } from "@dexdraw/shared-core";
import type {
  BoardObject,
  CheckpointSummary,
  OpsSinceResponse,
  Role,
  ServerOpEnvelope,
} from "@dexdraw/shared-protocol";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "react-router-dom";
import { applyCanonicalOperation } from "../lib/boardState";
import { exportMarkdown, exportSvgToPng, exportToPdf } from "../lib/export";
import { hitTestObjects } from "../lib/hitTest";
import {
  MARQUEE_THRESHOLD,
  type MarqueeRect,
  normalizeRect,
  objectIntersectsMarquee,
} from "../lib/marquee";
import {
  type ArrangeAction,
  computeArrange,
  duplicateObject,
} from "../lib/objectTransforms";
import { type RemotePresence, mergePresence } from "../lib/presence";
import {
  type ResizableBounds,
  type ResizeHandle,
  applyResize,
  getBoundsForObject,
  patchFromBounds,
} from "../lib/resize";
import {
  getBoardShareCode,
  getBoardToken,
  getClientId,
  getDisplayName,
} from "../lib/session";
import { BoardCanvas } from "./BoardCanvas";
import { InlineEditor } from "./InlineEditor";
import { PresencePanel } from "./PresencePanel";
import { type Tool, Toolbar } from "./Toolbar";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

type UndoEntry =
  | { kind: "create"; objects: BoardObject[] }
  | {
      kind: "update";
      updates: Array<{
        id: string;
        prev: Partial<BoardObject>;
        next: Partial<BoardObject>;
      }>;
    }
  | { kind: "delete"; objects: BoardObject[] };

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
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [checkpoints, setCheckpoints] = useState<CheckpointSummary[]>([]);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<
    string | null
  >(null);

  const socketRef = useRef<WebSocket | null>(null);
  const clientSeqRef = useRef(0);
  const pendingSeqsRef = useRef<Set<number>>(new Set());
  const serverSeqRef = useRef(0);
  const strokeRef = useRef<Point[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const objectsRef = useRef<BoardObject[]>([]);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const redoStackRef = useRef<UndoEntry[]>([]);
  const reconnectTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<Point | null>(null);
  const dragInitialObjectsRef = useRef<BoardObject[]>([]);

  const isMarqueeingRef = useRef(false);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const marqueeShiftRef = useRef(false);
  const marqueeRectRef = useRef<MarqueeRect | null>(null);

  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<ResizeHandle | null>(null);
  const resizeInitialBoundsRef = useRef<ResizableBounds | null>(null);
  const resizeInitialObjectRef = useRef<BoardObject | null>(null);
  const resizeStartPosRef = useRef<Point | null>(null);
  const resizeCurrentBoundsRef = useRef<ResizableBounds | null>(null);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  // Auto-select the first checkpoint when one becomes available.
  useEffect(() => {
    if (checkpoints.length > 0 && !selectedCheckpointId) {
      setSelectedCheckpointId(checkpoints[0].id);
    }
  }, [checkpoints, selectedCheckpointId]);

  // Remove stale selected IDs whenever the object list changes (snapshot reset,
  // checkpoint restore, remote delete, reconnect replay).
  useEffect(() => {
    const ids = new Set(objects.map((o) => o.id));
    setSelectedObjectIds((prev) => {
      const next = prev.filter((id) => ids.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [objects]);

  function moveObject(
    object: BoardObject,
    dx: number,
    dy: number,
  ): BoardObject {
    if (object.type === "stroke") {
      return {
        ...object,
        points: object.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
      };
    }
    if (
      object.type === "rectangle" ||
      object.type === "text" ||
      object.type === "note"
    ) {
      return {
        ...object,
        x: object.x + dx,
        y: object.y + dy,
      };
    }
    if (object.type === "ellipse") {
      return {
        ...object,
        cx: object.cx + dx,
        cy: object.cy + dy,
      };
    }
    return object;
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: clientId is a stable UUID generated once at mount; it never changes so omitting it from deps is correct
  useEffect(() => {
    if (!boardId || !token) {
      setStatus("disconnected");
      setError(
        "Missing board token. Create or join the board from the home screen.",
      );
      return;
    }

    let cancelled = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const loadCheckpoints = async () => {
      const resp = await fetch(`/api/boards/${boardId}/checkpoints`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      setCheckpoints(data.checkpoints ?? []);
    };

    const replayMissedOps = async (
      since: number,
      fallbackSnapshot: BoardObject[],
    ) => {
      const resp = await fetch(`/api/boards/${boardId}/ops?since=${since}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setObjects(fallbackSnapshot);
        return;
      }

      const data = (await resp.json()) as OpsSinceResponse;
      if (data.ops.some((op) => op.opType === "checkpoint.restore")) {
        setObjects(fallbackSnapshot);
        setSelectedObjectIds([]);
        return;
      }

      setObjects((current) =>
        data.ops.reduce((acc, op) => applyCanonicalOperation(acc, op), current),
      );
    };

    const scheduleReconnect = () => {
      if (
        cancelled ||
        reconnectTimerRef.current !== null ||
        !window.navigator.onLine
      ) {
        return;
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        void connect();
      }, 1_000);
    };

    const connect = async () => {
      if (cancelled) return;

      const existing = socketRef.current;
      if (
        existing &&
        (existing.readyState === WebSocket.OPEN ||
          existing.readyState === WebSocket.CONNECTING)
      ) {
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
        clearReconnectTimer();
        setStatus("connected");
      });

      socket.addEventListener("close", () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        setStatus("disconnected");
        scheduleReconnect();
      });

      socket.addEventListener("error", () => {
        setStatus("disconnected");
      });

      socket.addEventListener("message", async (event) => {
        const message = JSON.parse(String(event.data));

        if (message.type === "server.welcome") {
          const previousSeq = serverSeqRef.current;
          setRole(message.role);
          serverSeqRef.current = message.serverSeq;
          // Clear stale pending seqs from before the disconnect; any ops that
          // weren't echoed are now reflected in the server state we're receiving.
          pendingSeqsRef.current.clear();
          if (
            previousSeq > 0 &&
            previousSeq < message.serverSeq &&
            objectsRef.current.length > 0
          ) {
            await replayMissedOps(previousSeq, message.snapshot);
          } else {
            setObjects(message.snapshot);
          }
          await loadCheckpoints();
          return;
        }

        if (message.type === "server.snapshot_reset") {
          serverSeqRef.current = message.serverSeq;
          pendingSeqsRef.current.clear();
          setObjects(message.snapshot);
          undoStackRef.current = [];
          redoStackRef.current = [];
          setUndoCount(0);
          setRedoCount(0);
          setSelectedObjectIds([]);
          setEditingObjectId(null);
          isMarqueeingRef.current = false;
          marqueeRectRef.current = null;
          setMarquee(null);
          isDraggingRef.current = false;
          dragStartPosRef.current = null;
          dragInitialObjectsRef.current = [];
          isResizingRef.current = false;
          return;
        }

        if (message.type === "server.op") {
          serverSeqRef.current = Math.max(
            serverSeqRef.current,
            message.serverSeq,
          );
          // Skip self-echoes: ops we sent ourselves were already applied
          // optimistically — re-applying them would override local undo/redo.
          const isSelfEcho =
            message.clientId === clientId &&
            pendingSeqsRef.current.has(message.clientSeq);
          if (isSelfEcho) {
            pendingSeqsRef.current.delete(message.clientSeq);
          }
          if (message.opType === "checkpoint.create") {
            const payload = message.payload as { id: string; name: string };
            setCheckpoints((prev) => [
              ...prev,
              {
                id: payload.id,
                name: payload.name,
                serverSeq: message.serverSeq,
                createdAt: message.createdAt,
              },
            ]);
          } else if (!isSelfEcho) {
            setObjects((current) =>
              applyCanonicalOperation(current, message as ServerOpEnvelope),
            );
          }
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
    };

    const handleOffline = () => {
      setStatus("disconnected");
      clearReconnectTimer();
      const active = socketRef.current;
      socketRef.current = null;
      if (
        active &&
        (active.readyState === WebSocket.OPEN ||
          active.readyState === WebSocket.CONNECTING)
      ) {
        active.close();
      }
    };

    const handleOnline = () => {
      if (cancelled) return;
      if (socketRef.current?.readyState === WebSocket.OPEN) return;
      clearReconnectTimer();
      void connect();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    void connect();

    return () => {
      cancelled = true;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
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
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    clientSeqRef.current += 1;
    const seq = clientSeqRef.current;
    pendingSeqsRef.current.add(seq);
    socketRef.current.send(
      JSON.stringify({
        type: "client.op",
        boardId,
        clientId,
        clientSeq: seq,
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
    pushUndo({ kind: "create", objects: [object] });
  }

  function sendObjectUpdate(
    id: string,
    patch: Partial<BoardObject>,
    overridePrev?: Partial<BoardObject>,
  ) {
    const previous = objectsRef.current.find((o) => o.id === id);
    if (!previous) return;

    const prevFields: Partial<BoardObject> = overridePrev ?? {};
    if (!overridePrev) {
      for (const key of Object.keys(patch) as Array<keyof BoardObject>) {
        (prevFields as Record<string, unknown>)[key] = previous[key];
      }
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
    pushUndo({
      kind: "update",
      updates: [{ id, prev: prevFields, next: patch }],
    });
  }

  function sendObjectDelete(id: string) {
    const object = objectsRef.current.find((o) => o.id === id);
    if (!object) return;

    setObjects((current) => current.filter((o) => o.id !== id));
    if (selectedObjectIds.includes(id)) {
      setSelectedObjectIds((prev) => prev.filter((oid) => oid !== id));
    }
    sendRaw("object.delete", { id });
    pushUndo({ kind: "delete", objects: [object] });
  }

  function handleUndo() {
    const entry = undoStackRef.current.pop();
    if (!entry) return;

    if (entry.kind === "create") {
      for (const object of entry.objects) {
        setObjects((current) => current.filter((o) => o.id !== object.id));
        sendRaw("object.delete", { id: object.id }, true);
      }
      redoStackRef.current.push(entry);
    } else if (entry.kind === "update") {
      for (const update of entry.updates) {
        setObjects((current) =>
          applyCanonicalOperation(current, {
            type: "server.op",
            boardId,
            serverSeq: -1,
            clientId,
            clientSeq: -1,
            opId: crypto.randomUUID(),
            opType: "object.update",
            payload: { id: update.id, patch: update.prev },
            createdAt: new Date().toISOString(),
          }),
        );
        sendRaw("object.update", { id: update.id, patch: update.prev }, true);
      }
      redoStackRef.current.push(entry);
    } else if (entry.kind === "delete") {
      for (const object of entry.objects) {
        setObjects((current) =>
          [...current, object].sort((a, b) => a.zIndex - b.zIndex),
        );
        sendRaw("object.create", object, true);
      }
      redoStackRef.current.push(entry);
    }

    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }

  function handleRedo() {
    const entry = redoStackRef.current.pop();
    if (!entry) return;

    if (entry.kind === "create") {
      for (const object of entry.objects) {
        setObjects((current) =>
          [...current.filter((o) => o.id !== object.id), object].sort(
            (a, b) => a.zIndex - b.zIndex,
          ),
        );
        sendRaw("object.create", object, true);
      }
      undoStackRef.current.push(entry);
    } else if (entry.kind === "update") {
      for (const update of entry.updates) {
        setObjects((current) =>
          applyCanonicalOperation(current, {
            type: "server.op",
            boardId,
            serverSeq: -1,
            clientId,
            clientSeq: -1,
            opId: crypto.randomUUID(),
            opType: "object.update",
            payload: { id: update.id, patch: update.next },
            createdAt: new Date().toISOString(),
          }),
        );
        sendRaw("object.update", { id: update.id, patch: update.next }, true);
      }
      undoStackRef.current.push(entry);
    } else if (entry.kind === "delete") {
      for (const object of entry.objects) {
        setObjects((current) => current.filter((o) => o.id !== object.id));
        sendRaw("object.delete", { id: object.id }, true);
      }
      undoStackRef.current.push(entry);
    }

    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: sendObjectDelete/handleUndo/handleRedo/handleNudge/handleDuplicate are recreated but always close over up-to-date state; the key state they depend on (selectedObjectIds, role, editingObjectId) is already listed
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (editingObjectId) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedObjectIds([]);
        if (isMarqueeingRef.current) {
          isMarqueeingRef.current = false;
          marqueeStartRef.current = null;
          marqueeRectRef.current = null;
          setMarquee(null);
        }
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          dragStartPosRef.current = null;
          dragInitialObjectsRef.current = [];
        }
        if (isResizingRef.current) {
          isResizingRef.current = false;
          resizeHandleRef.current = null;
          resizeInitialBoundsRef.current = null;
          resizeInitialObjectRef.current = null;
          resizeStartPosRef.current = null;
          resizeCurrentBoundsRef.current = null;
        }
        return;
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedObjectIds.length > 0 &&
        role !== "view"
      ) {
        e.preventDefault();
        const toDelete = objectsRef.current.filter((o) =>
          selectedObjectIds.includes(o.id),
        );
        for (const object of toDelete) {
          setObjects((current) => current.filter((o) => o.id !== object.id));
          sendRaw("object.delete", { id: object.id });
        }
        setSelectedObjectIds([]);
        pushUndo({ kind: "delete", objects: toDelete });
        return;
      }
      if (
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") &&
        selectedObjectIds.length > 0 &&
        role !== "view"
      ) {
        e.preventDefault();
        const amount = e.shiftKey ? 32 : 8;
        const dx =
          e.key === "ArrowLeft" ? -amount : e.key === "ArrowRight" ? amount : 0;
        const dy =
          e.key === "ArrowUp" ? -amount : e.key === "ArrowDown" ? amount : 0;
        handleNudge(dx, dy);
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
  }, [editingObjectId, selectedObjectIds, role]);

  function handleObjectPointerDown(
    id: string,
    event: ReactPointerEvent<SVGElement>,
  ) {
    if (tool !== "select" || role === "view" || editingObjectId) return;

    const svg = canvasRef.current;
    if (!svg) return;

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svgPoint.matrixTransform(matrix.inverse());

    const isShift = event.shiftKey;
    const nextSelected = isShift
      ? selectedObjectIds.includes(id)
        ? selectedObjectIds.filter((oid) => oid !== id)
        : [...selectedObjectIds, id]
      : selectedObjectIds.includes(id)
        ? selectedObjectIds
        : [id];

    setSelectedObjectIds(nextSelected);

    isDraggingRef.current = true;
    dragStartPosRef.current = { x: point.x, y: point.y };
    dragInitialObjectsRef.current = objectsRef.current.filter((object) =>
      nextSelected.includes(object.id),
    );
  }

  function handleObjectDoubleClick(id: string) {
    const object = objectsRef.current.find((o) => o.id === id);
    if (!object) return;
    if (object.type === "text" || object.type === "note") {
      setEditingObjectId(id);
      setSelectedObjectIds([]);
    }
  }

  function handleResizeHandlePointerDown(
    handle: ResizeHandle,
    event: ReactPointerEvent<SVGCircleElement>,
  ) {
    if (role === "view") return;
    const id = selectedObjectIds[0];
    if (!id) return;
    const object = objectsRef.current.find((o) => o.id === id);
    if (!object) return;
    const bounds = getBoundsForObject(object);
    if (!bounds) return;

    const svg = canvasRef.current;
    if (!svg) return;
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const pt = svgPoint.matrixTransform(matrix.inverse());

    isResizingRef.current = true;
    resizeHandleRef.current = handle;
    resizeInitialBoundsRef.current = bounds;
    resizeInitialObjectRef.current = object;
    resizeStartPosRef.current = { x: pt.x, y: pt.y };
    resizeCurrentBoundsRef.current = bounds;
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

  function handleArrange(action: ArrangeAction) {
    if (selectedObjectIds.length === 0 || role === "view") return;
    const changes = computeArrange(
      objectsRef.current,
      selectedObjectIds,
      action,
    );
    if (changes.length === 0) return;

    setObjects((current) =>
      current
        .map((o) => {
          const ch = changes.find((c) => c.id === o.id);
          return ch ? { ...o, zIndex: ch.nextZIndex } : o;
        })
        .sort((a, b) => a.zIndex - b.zIndex),
    );
    for (const ch of changes) {
      sendRaw("object.update", { id: ch.id, patch: { zIndex: ch.nextZIndex } });
    }
    pushUndo({
      kind: "update",
      updates: changes.map((ch) => ({
        id: ch.id,
        prev: { zIndex: ch.prevZIndex } as Partial<BoardObject>,
        next: { zIndex: ch.nextZIndex } as Partial<BoardObject>,
      })),
    });
  }

  function handleDuplicate() {
    if (selectedObjectIds.length === 0 || role === "view") return;
    const toClone = objectsRef.current.filter((o) =>
      selectedObjectIds.includes(o.id),
    );
    if (toClone.length === 0) return;

    const maxZ =
      objectsRef.current.length > 0
        ? Math.max(...objectsRef.current.map((o) => o.zIndex))
        : -1;
    const now = new Date().toISOString();

    const duplicates = toClone.map((o, i) =>
      duplicateObject(o, crypto.randomUUID(), maxZ + 1 + i, now, displayName),
    );

    setObjects((current) =>
      [...current, ...duplicates].sort((a, b) => a.zIndex - b.zIndex),
    );
    for (const dup of duplicates) {
      sendRaw("object.create", dup);
    }
    pushUndo({ kind: "create", objects: duplicates });
    setSelectedObjectIds(duplicates.map((d) => d.id));
  }

  function handleNudge(dx: number, dy: number) {
    if (selectedObjectIds.length === 0 || role === "view") return;
    const toMove = objectsRef.current.filter((o) =>
      selectedObjectIds.includes(o.id),
    );
    if (toMove.length === 0) return;

    const updates: Array<{
      id: string;
      prev: Partial<BoardObject>;
      next: Partial<BoardObject>;
    }> = [];

    setObjects((current) =>
      current.map((o) => {
        if (!selectedObjectIds.includes(o.id)) return o;
        return moveObject(o, dx, dy);
      }),
    );

    for (const obj of toMove) {
      const moved = moveObject(obj, dx, dy);
      // biome-ignore lint/suspicious/noExplicitAny: patch spans discriminated union fields
      const patch: any = {};
      // biome-ignore lint/suspicious/noExplicitAny: prev spans discriminated union fields
      const prev: any = {};

      if (obj.type === "stroke" && moved.type === "stroke") {
        patch.points = moved.points;
        prev.points = obj.points;
      } else if (
        (obj.type === "rectangle" ||
          obj.type === "text" ||
          obj.type === "note") &&
        (moved.type === "rectangle" ||
          moved.type === "text" ||
          moved.type === "note")
      ) {
        patch.x = moved.x;
        patch.y = moved.y;
        prev.x = obj.x;
        prev.y = obj.y;
      } else if (obj.type === "ellipse" && moved.type === "ellipse") {
        patch.cx = moved.cx;
        patch.cy = moved.cy;
        prev.cx = obj.cx;
        prev.cy = obj.cy;
      }

      sendRaw("object.update", { id: obj.id, patch });
      updates.push({ id: obj.id, prev, next: patch });
    }

    if (updates.length > 0) {
      pushUndo({ kind: "update", updates });
    }
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (role === "view") return;
    if (editingObjectId) return;

    const point = pointerToSvgPoint(event);

    // For click-to-place tools (text, note): prevent creating a duplicate when
    // the pointer-down lands on an existing object of the SAME type (e.g.
    // double-clicking a note to edit would otherwise create two extra notes).
    // Clicking on a DIFFERENT type of object is still allowed so that text/
    // note labels can be placed on top of shapes.
    if (tool === "text" || tool === "note") {
      const sameTypeTestId = tool === "text" ? "text-object" : "note-object";
      if (
        (event.target as Element).closest(`[data-testid="${sameTypeTestId}"]`)
      ) {
        return;
      }
    }

    if (tool === "select") {
      const hit = hitTestObjects(objectsRef.current, point.x, point.y);
      const isShift = event.shiftKey;

      if (hit) {
        let nextSelected: string[];
        if (isShift) {
          nextSelected = selectedObjectIds.includes(hit.id)
            ? selectedObjectIds.filter((id) => id !== hit.id)
            : [...selectedObjectIds, hit.id];
        } else {
          nextSelected = selectedObjectIds.includes(hit.id)
            ? selectedObjectIds
            : [hit.id];
        }
        setSelectedObjectIds(nextSelected);

        isDraggingRef.current = true;
        dragStartPosRef.current = point;
        dragInitialObjectsRef.current = objectsRef.current.filter((o) =>
          nextSelected.includes(o.id),
        );
      } else {
        isMarqueeingRef.current = true;
        marqueeStartRef.current = { x: point.x, y: point.y };
        marqueeShiftRef.current = isShift;
      }
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
      isResizingRef.current &&
      resizeHandleRef.current &&
      resizeInitialBoundsRef.current &&
      resizeInitialObjectRef.current &&
      resizeStartPosRef.current
    ) {
      const dx = point.x - resizeStartPosRef.current.x;
      const dy = point.y - resizeStartPosRef.current.y;
      const newBounds = applyResize(
        resizeInitialBoundsRef.current,
        resizeHandleRef.current,
        dx,
        dy,
      );
      resizeCurrentBoundsRef.current = newBounds;
      const id = resizeInitialObjectRef.current.id;
      // biome-ignore lint/suspicious/noExplicitAny: resize patch spans discriminated union fields
      const patch: any = patchFromBounds(
        resizeInitialObjectRef.current,
        newBounds,
      );
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
      return;
    }

    if (isMarqueeingRef.current && marqueeStartRef.current) {
      const rect = normalizeRect(
        marqueeStartRef.current.x,
        marqueeStartRef.current.y,
        point.x,
        point.y,
      );
      marqueeRectRef.current = rect;
      setMarquee(rect);
      return;
    }

    if (
      isDraggingRef.current &&
      dragInitialObjectsRef.current.length > 0 &&
      dragStartPosRef.current
    ) {
      const dx = point.x - dragStartPosRef.current.x;
      const dy = point.y - dragStartPosRef.current.y;

      const movedIds = new Set(dragInitialObjectsRef.current.map((o) => o.id));
      const movedObjects = dragInitialObjectsRef.current.map((o) =>
        moveObject(o, dx, dy),
      );

      setObjects((current) =>
        current.map((o) => {
          if (movedIds.has(o.id)) {
            return movedObjects.find((mo) => mo.id === o.id) ?? o;
          }
          return o;
        }),
      );
      return;
    }

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
    if (isMarqueeingRef.current) {
      const rect = marqueeRectRef.current;
      const isShift = marqueeShiftRef.current;
      if (
        rect &&
        (rect.width >= MARQUEE_THRESHOLD || rect.height >= MARQUEE_THRESHOLD)
      ) {
        const intersecting = objectsRef.current
          .filter((o) => objectIntersectsMarquee(o, rect))
          .map((o) => o.id);
        if (isShift) {
          setSelectedObjectIds((prev) => [
            ...new Set([...prev, ...intersecting]),
          ]);
        } else {
          setSelectedObjectIds(intersecting);
        }
      } else {
        if (!isShift) setSelectedObjectIds([]);
      }
      setMarquee(null);
      marqueeRectRef.current = null;
      isMarqueeingRef.current = false;
      marqueeStartRef.current = null;
      return;
    }

    if (
      isResizingRef.current &&
      resizeInitialBoundsRef.current &&
      resizeInitialObjectRef.current
    ) {
      const currentBounds = resizeCurrentBoundsRef.current;
      const initialBounds = resizeInitialBoundsRef.current;
      const initialObject = resizeInitialObjectRef.current;

      if (currentBounds) {
        // biome-ignore lint/suspicious/noExplicitAny: resize patch spans discriminated union fields
        const patch: any = patchFromBounds(initialObject, currentBounds);
        // biome-ignore lint/suspicious/noExplicitAny: resize prev spans discriminated union fields
        const prev: any = patchFromBounds(initialObject, initialBounds);
        if (JSON.stringify(patch) !== JSON.stringify(prev)) {
          sendRaw("object.update", { id: initialObject.id, patch });
          pushUndo({
            kind: "update",
            updates: [{ id: initialObject.id, prev, next: patch }],
          });
        }
      }

      isResizingRef.current = false;
      resizeHandleRef.current = null;
      resizeInitialBoundsRef.current = null;
      resizeInitialObjectRef.current = null;
      resizeStartPosRef.current = null;
      resizeCurrentBoundsRef.current = null;
      return;
    }

    if (
      isDraggingRef.current &&
      dragInitialObjectsRef.current.length > 0 &&
      dragStartPosRef.current
    ) {
      const updates: Array<{
        id: string;
        prev: Partial<BoardObject>;
        next: Partial<BoardObject>;
      }> = [];

      for (const initial of dragInitialObjectsRef.current) {
        const final = objectsRef.current.find((o) => o.id === initial.id);
        if (!final) continue;

        // biome-ignore lint/suspicious/noExplicitAny: patch assignments are tricky with discriminated unions
        const patch: any = {};
        // biome-ignore lint/suspicious/noExplicitAny: prev assignments are tricky with discriminated unions
        const prev: any = {};
        let moved = false;

        if (final.type === "stroke" && initial.type === "stroke") {
          patch.points = final.points;
          prev.points = initial.points;
          moved =
            final.points[0].x !== initial.points[0].x ||
            final.points[0].y !== initial.points[0].y;
        } else if (
          (final.type === "rectangle" ||
            final.type === "text" ||
            final.type === "note") &&
          (initial.type === "rectangle" ||
            initial.type === "text" ||
            initial.type === "note")
        ) {
          patch.x = final.x;
          patch.y = final.y;
          prev.x = initial.x;
          prev.y = initial.y;
          moved = final.x !== initial.x || final.y !== initial.y;
        } else if (final.type === "ellipse" && initial.type === "ellipse") {
          patch.cx = final.cx;
          patch.cy = final.cy;
          prev.cx = initial.cx;
          prev.cy = initial.cy;
          moved = final.cx !== initial.cx || final.cy !== initial.cy;
        }

        if (moved) {
          sendRaw("object.update", { id: final.id, patch });
          updates.push({ id: final.id, prev, next: patch });
        }
      }

      if (updates.length > 0) {
        pushUndo({ kind: "update", updates });
      }

      isDraggingRef.current = false;
      dragStartPosRef.current = null;
      dragInitialObjectsRef.current = [];
      return;
    }

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
    await exportSvgToPng(canvasRef.current, `dexdraw-${boardId}.png`, objects, {
      cropToContent: true,
      padding: 32,
    });
  }

  function handleExportMarkdown() {
    if (objects.length === 0) return;
    exportMarkdown(objects, `dexdraw-${boardId}.md`);
  }

  function handleExportPdf() {
    if (!canvasRef.current || objects.length === 0) return;
    exportToPdf(canvasRef.current, `dexdraw-${boardId}.pdf`);
  }

  function handleSaveCheckpoint() {
    const name = window.prompt("Checkpoint name:");
    if (!name) return;
    sendRaw("checkpoint.create", {
      id: crypto.randomUUID(),
      name,
    });
  }

  function handleRestoreCheckpoint() {
    if (!selectedCheckpointId) return;
    setSelectedObjectIds([]);
    setEditingObjectId(null);
    sendRaw("checkpoint.restore", { id: selectedCheckpointId });
  }

  const editingObject =
    editingObjectId !== null
      ? objects.find(
          (o) =>
            o.id === editingObjectId &&
            (o.type === "text" || o.type === "note"),
        )
      : null;

  const showResizeHandles =
    tool === "select" &&
    selectedObjectIds.length === 1 &&
    !editingObjectId &&
    role !== "view";

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
          selectedCount={selectedObjectIds.length}
          checkpoints={checkpoints}
          selectedCheckpointId={selectedCheckpointId}
          onToolChange={setTool}
          onExportPng={handleExportPng}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDuplicate={handleDuplicate}
          onArrange={handleArrange}
          onSaveCheckpoint={handleSaveCheckpoint}
          onSelectCheckpoint={setSelectedCheckpointId}
          onRestoreCheckpoint={handleRestoreCheckpoint}
          onExportMarkdown={handleExportMarkdown}
          onExportPdf={handleExportPdf}
          exportDisabled={objects.length === 0}
        />

        <div className="meta-group">
          <span className="status-pill" data-status={status}>
            Status: {status}
          </span>
          <PresencePanel
            localDisplayName={displayName}
            remotePresence={remotePresence}
          />
        </div>
      </header>

      {error ? <div className="board-error">{error}</div> : null}

      <section className="board-stage">
        <BoardCanvas
          ref={canvasRef}
          objects={objects}
          currentStroke={currentStroke}
          remotePresence={remotePresence}
          selectedObjectIds={selectedObjectIds}
          editingObjectId={editingObjectId}
          showResizeHandles={showResizeHandles}
          marquee={marquee}
          activeTool={tool}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onObjectPointerDown={handleObjectPointerDown}
          onObjectDoubleClick={handleObjectDoubleClick}
          onResizeHandlePointerDown={handleResizeHandlePointerDown}
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
