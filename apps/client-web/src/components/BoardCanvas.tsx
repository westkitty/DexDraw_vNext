import { type Point, pointsToSvgPath } from "@dexdraw/shared-core";
import type { BoardObject } from "@dexdraw/shared-protocol";
import { forwardRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type PresenceState = {
  clientId: string;
  x: number;
  y: number;
  type: "presence.cursor" | "presence.laser";
  displayName: string;
};

type BoardCanvasProps = {
  objects: BoardObject[];
  currentStroke: Point[];
  remotePresence: PresenceState[];
  selectedObjectIds: string[];
  editingObjectId?: string | null;
  onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onObjectPointerDown?: (
    id: string,
    event: ReactPointerEvent<SVGElement>,
  ) => void;
  onObjectDoubleClick?: (id: string) => void;
};

function pointsToPolyline(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

const PADDING = 6;

function SelectionRing({ object }: { object: BoardObject }) {
  const style = {
    stroke: "#f97316",
    fill: "none",
    strokeWidth: 2,
    strokeDasharray: "6 3",
    pointerEvents: "none" as const,
  };

  if (object.type === "stroke") {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of object.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return (
      <rect
        x={minX - PADDING}
        y={minY - PADDING}
        width={maxX - minX + PADDING * 2}
        height={maxY - minY + PADDING * 2}
        rx={4}
        {...style}
      />
    );
  }

  if (object.type === "rectangle" || object.type === "note") {
    return (
      <rect
        x={object.x - PADDING}
        y={object.y - PADDING}
        width={object.width + PADDING * 2}
        height={object.height + PADDING * 2}
        rx={4}
        {...style}
      />
    );
  }

  if (object.type === "ellipse") {
    return (
      <ellipse
        cx={object.cx}
        cy={object.cy}
        rx={object.rx + PADDING}
        ry={object.ry + PADDING}
        {...style}
      />
    );
  }

  if (object.type === "text") {
    const fontSize = object.style.fontSize ?? 18;
    const width = object.text.length * fontSize * 0.6;
    return (
      <rect
        x={object.x - PADDING}
        y={object.y - fontSize - PADDING}
        width={width + PADDING * 2}
        height={fontSize + PADDING * 2}
        rx={4}
        {...style}
      />
    );
  }

  return null;
}

export const BoardCanvas = forwardRef<SVGSVGElement, BoardCanvasProps>(
  function BoardCanvas(
    {
      objects,
      currentStroke,
      remotePresence,
      selectedObjectIds,
      editingObjectId,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onObjectPointerDown,
      onObjectDoubleClick,
    },
    ref,
  ) {
    function makeObjectHandlers(id: string) {
      return {
        onPointerDown: (e: ReactPointerEvent<SVGElement>) => {
          if (onObjectPointerDown) {
            e.stopPropagation();
            onObjectPointerDown(id, e);
          }
        },
        onDoubleClick: () => {
          if (onObjectDoubleClick) {
            onObjectDoubleClick(id);
          }
        },
      };
    }

    return (
      <svg
        ref={ref}
        className="canvas"
        data-testid="board-canvas"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        role="img"
        aria-label="Collaborative drawing canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <title>Collaborative drawing canvas</title>
        {objects.map((object) => {
          const handlers = makeObjectHandlers(object.id);

          if (object.type === "stroke") {
            return (
              <path
                key={object.id}
                data-testid="stroke-object"
                d={pointsToSvgPath(object.points)}
                fill="none"
                stroke={object.style.color}
                strokeWidth={object.style.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ cursor: "pointer" }}
                {...handlers}
              />
            );
          }

          if (object.type === "rectangle") {
            return (
              <rect
                key={object.id}
                data-testid="rectangle-object"
                x={object.x}
                y={object.y}
                width={object.width}
                height={object.height}
                fill={object.style.fillColor ?? "transparent"}
                stroke={object.style.strokeColor ?? "#111827"}
                strokeWidth={2}
                style={{ cursor: "pointer" }}
                {...handlers}
              />
            );
          }

          if (object.type === "ellipse") {
            return (
              <ellipse
                key={object.id}
                data-testid="ellipse-object"
                cx={object.cx}
                cy={object.cy}
                rx={object.rx}
                ry={object.ry}
                fill={object.style.fillColor ?? "transparent"}
                stroke={object.style.strokeColor ?? "#111827"}
                strokeWidth={2}
                style={{ cursor: "pointer" }}
                {...handlers}
              />
            );
          }

          if (object.type === "text") {
            return (
              <text
                key={object.id}
                data-testid="text-object"
                x={object.x}
                y={object.y}
                fill={object.style.color ?? "#111827"}
                fontSize={object.style.fontSize ?? 18}
                style={{ cursor: "pointer" }}
                {...handlers}
              >
                {editingObjectId === object.id ? null : object.text}
              </text>
            );
          }

          return (
            <g
              key={object.id}
              data-testid="note-object"
              style={{ cursor: "pointer" }}
              {...handlers}
            >
              <rect
                x={object.x}
                y={object.y}
                width={object.width}
                height={object.height}
                fill="#fde68a"
                stroke="#d97706"
                strokeWidth={2}
                rx={8}
              />
              <text
                x={object.x + 12}
                y={object.y + 28}
                fill="#111827"
                fontSize={18}
              >
                {editingObjectId === object.id ? null : object.text}
              </text>
            </g>
          );
        })}

        {currentStroke.length > 1 ? (
          <polyline
            points={pointsToPolyline(currentStroke)}
            fill="none"
            stroke="#111827"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        ) : null}

        {objects
          .filter((o) => selectedObjectIds.includes(o.id))
          .map((o) => (
            <SelectionRing key={`sel-${o.id}`} object={o} />
          ))}

        {remotePresence.map((presence) =>
          presence.type === "presence.laser" ? (
            <g key={presence.clientId} data-testid="remote-laser">
              <circle
                cx={presence.x}
                cy={presence.y}
                r={18}
                fill="rgba(239,68,68,0.2)"
                stroke="#ef4444"
                strokeWidth={3}
              />
            </g>
          ) : (
            <g key={presence.clientId} data-testid="remote-cursor">
              <circle cx={presence.x} cy={presence.y} r={8} fill="#0f766e" />
              <rect
                x={presence.x + 12}
                y={presence.y - 18}
                width={Math.max(52, presence.displayName.length * 9)}
                height={24}
                rx={12}
                fill="#0f766e"
              />
              <text
                x={presence.x + 22}
                y={presence.y - 2}
                fill="#fff8ef"
                fontSize={14}
              >
                {presence.displayName}
              </text>
            </g>
          ),
        )}
      </svg>
    );
  },
);
