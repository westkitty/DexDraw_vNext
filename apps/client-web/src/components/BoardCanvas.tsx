import { type Point, pointsToSvgPath } from "@dexdraw/shared-core";
import type { BoardObject } from "@dexdraw/shared-protocol";
import { forwardRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { MarqueeRect } from "../lib/marquee";
import { type ResizeHandle, getBoundsForObject } from "../lib/resize";

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
  showResizeHandles?: boolean;
  marquee?: MarqueeRect | null;
  activeTool?: string;
  onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onObjectPointerDown?: (
    id: string,
    event: ReactPointerEvent<SVGElement>,
  ) => void;
  onObjectDoubleClick?: (id: string) => void;
  onResizeHandlePointerDown?: (
    handle: ResizeHandle,
    event: ReactPointerEvent<SVGCircleElement>,
  ) => void;
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

const HANDLE_SIZE = 6;

function ResizeHandles({
  object,
  onHandlePointerDown,
}: {
  object: BoardObject;
  onHandlePointerDown: (
    handle: ResizeHandle,
    event: ReactPointerEvent<SVGCircleElement>,
  ) => void;
}) {
  const bounds = getBoundsForObject(object);
  if (!bounds) return null;

  const corners: Array<{ handle: ResizeHandle; cx: number; cy: number }> = [
    { handle: "nw", cx: bounds.x, cy: bounds.y },
    { handle: "ne", cx: bounds.x + bounds.width, cy: bounds.y },
    { handle: "sw", cx: bounds.x, cy: bounds.y + bounds.height },
    { handle: "se", cx: bounds.x + bounds.width, cy: bounds.y + bounds.height },
  ];

  return (
    <>
      {corners.map(({ handle, cx, cy }) => (
        <circle
          key={handle}
          data-testid={`resize-handle-${handle}`}
          cx={cx}
          cy={cy}
          r={HANDLE_SIZE}
          fill="#f97316"
          stroke="white"
          strokeWidth={2}
          style={{ cursor: `${handle}-resize`, pointerEvents: "all" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onHandlePointerDown(handle, e);
          }}
        />
      ))}
    </>
  );
}

export const BoardCanvas = forwardRef<SVGSVGElement, BoardCanvasProps>(
  function BoardCanvas(
    {
      objects,
      currentStroke,
      remotePresence,
      selectedObjectIds,
      editingObjectId,
      showResizeHandles,
      marquee,
      activeTool,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onObjectPointerDown,
      onObjectDoubleClick,
      onResizeHandlePointerDown,
    },
    ref,
  ) {
    function makeObjectHandlers(id: string) {
      return {
        onPointerDown: (e: ReactPointerEvent<SVGElement>) => {
          // Only capture (stopPropagation) in select mode so that drawing tools
          // can start a shape even when the pointer-down lands on an existing object.
          if (activeTool === "select") {
            e.stopPropagation();
            if (onObjectPointerDown) {
              onObjectPointerDown(id, e);
            }
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

        {showResizeHandles &&
          selectedObjectIds.length === 1 &&
          onResizeHandlePointerDown &&
          (() => {
            const obj = objects.find((o) => o.id === selectedObjectIds[0]);
            return obj ? (
              <ResizeHandles
                key={`resize-${obj.id}`}
                object={obj}
                onHandlePointerDown={onResizeHandlePointerDown}
              />
            ) : null;
          })()}

        {marquee && marquee.width > 0 && marquee.height > 0 ? (
          <rect
            data-testid="marquee-selection"
            x={marquee.x}
            y={marquee.y}
            width={marquee.width}
            height={marquee.height}
            fill="rgba(59,130,246,0.08)"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        ) : null}

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
              <rect
                x={presence.x + 22}
                y={presence.y - 18}
                width={Math.max(52, presence.displayName.length * 9)}
                height={22}
                rx={11}
                fill="#ef4444"
                pointerEvents="none"
              />
              <text
                data-testid="remote-laser-label"
                x={presence.x + 32}
                y={presence.y - 3}
                fill="#fff"
                fontSize={13}
                pointerEvents="none"
              >
                {presence.displayName}
              </text>
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
                data-testid="remote-cursor-label"
                x={presence.x + 22}
                y={presence.y - 2}
                fill="#fff8ef"
                fontSize={14}
                pointerEvents="none"
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
