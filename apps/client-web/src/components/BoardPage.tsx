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
import { type RemotePresence, mergePresence } from "../lib/presence";
import {
  getBoardShareCode,
  getBoardToken,
  getClientId,
  getDisplayName,
} from "../lib/session";
import { BoardCanvas } from "./BoardCanvas";
import { type Tool, Toolbar } from "./Toolbar";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

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
  const socketRef = useRef<WebSocket | null>(null);
  const clientSeqRef = useRef(0);
  const strokeRef = useRef<Point[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);

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

  function pointerToPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1600;
    const y = ((event.clientY - rect.top) / rect.height) * 900;
    return { x, y, pressure: event.pressure || 0.5 };
  }

  function nextObjectBase(now: string) {
    return {
      id: crypto.randomUUID(),
      createdBy: displayName,
      createdAt: now,
      updatedAt: now,
      zIndex: objects.length,
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

  function sendObjectCreate(object: BoardObject) {
    if (!socketRef.current) {
      return;
    }

    setObjects((current) =>
      [...current.filter((item) => item.id !== object.id), object].sort(
        (left, right) => left.zIndex - right.zIndex,
      ),
    );

    clientSeqRef.current += 1;
    socketRef.current.send(
      JSON.stringify({
        type: "client.op",
        boardId,
        clientId,
        clientSeq: clientSeqRef.current,
        opId: crypto.randomUUID(),
        opType: "object.create",
        payload: object,
        sentAt: new Date().toISOString(),
      }),
    );
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (role === "view") {
      return;
    }

    const point = pointerToPoint(event);

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
    const point = pointerToPoint(event);
    sendPresence(
      point,
      tool === "laser" ? "presence.laser" : "presence.cursor",
    );

    if (strokeRef.current.length === 0 || role === "view") {
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
      const [start, end] = strokeRef.current;
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
    if (!canvasRef.current || objects.length === 0) {
      return;
    }

    await exportSvgToPng(canvasRef.current, `dexdraw-${boardId}.png`);
  }

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
          onToolChange={setTool}
          onExportPng={handleExportPng}
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </section>
    </main>
  );
}
