import type { CheckpointSummary } from "@dexdraw/shared-protocol";
import type { ReactNode } from "react";
import type { ArrangeAction } from "../lib/objectTransforms";

export type Tool =
  | "select"
  | "pen"
  | "rectangle"
  | "ellipse"
  | "text"
  | "note"
  | "laser";

type ToolbarProps = {
  activeTool: Tool;
  canDraw: boolean;
  roleLabel: string;
  undoCount: number;
  redoCount: number;
  selectedCount: number;
  checkpoints: CheckpointSummary[];
  selectedCheckpointId: string | null;
  onToolChange: (tool: Tool) => void;
  onExportPng: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onArrange: (action: ArrangeAction) => void;
  onSaveCheckpoint: () => void;
  onSelectCheckpoint: (id: string) => void;
  onRestoreCheckpoint: () => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
  onOpenHelp: () => void;
  exportDisabled: boolean;
  renderPanel?: (
    id: string,
    className: string,
    label: string,
    children: ReactNode,
  ) => ReactNode;
};

const tools: Array<{ id: Tool; label: string }> = [
  { id: "select", label: "Select" },
  { id: "pen", label: "Pen" },
  { id: "rectangle", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "text", label: "Text" },
  { id: "note", label: "Note" },
  { id: "laser", label: "Laser" },
];

export function Toolbar({
  activeTool,
  canDraw,
  roleLabel,
  undoCount,
  redoCount,
  selectedCount,
  checkpoints,
  selectedCheckpointId,
  onToolChange,
  onExportPng,
  onUndo,
  onRedo,
  onDuplicate,
  onArrange,
  onSaveCheckpoint,
  onSelectCheckpoint,
  onRestoreCheckpoint,
  onExportMarkdown,
  onExportPdf,
  onOpenHelp,
  exportDisabled,
  renderPanel,
}: ToolbarProps) {
  const hasSelection = selectedCount > 0;
  const panel =
    renderPanel ??
    ((id: string, className: string, label: string, children: ReactNode) => (
      <div key={id} className={className} aria-label={label}>
        {children}
      </div>
    ));

  return (
    <>
      {panel(
        "tools",
        "toolbar toolbar--tools",
        "Board drawing tools",
        <div className="toolbar-group">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className="tool-button"
              type="button"
              data-active={activeTool === tool.id}
              aria-pressed={activeTool === tool.id}
              disabled={tool.id !== "select" && !canDraw}
              onClick={() => onToolChange(tool.id)}
            >
              {tool.label}
            </button>
          ))}
        </div>,
      )}

      {panel(
        "edit",
        "toolbar toolbar--edit",
        "Board edit controls",
        <>
          <div className="toolbar-group">
            <button
              className="secondary-button"
              type="button"
              onClick={onUndo}
              disabled={undoCount === 0}
              aria-label="Undo"
              title="Undo (⌘Z)"
            >
              Undo
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onRedo}
              disabled={redoCount === 0}
              aria-label="Redo"
              title="Redo (⌘⇧Z)"
            >
              Redo
            </button>
          </div>

          <div className="toolbar-group">
            <button
              className="secondary-button"
              type="button"
              data-testid="duplicate-button"
              onClick={onDuplicate}
              disabled={!hasSelection || !canDraw}
              title="Duplicate selection (⌘D)"
            >
              Duplicate
            </button>

            <button
              className="secondary-button"
              type="button"
              data-testid="arrange-front"
              onClick={() => onArrange("front")}
              disabled={!hasSelection || !canDraw}
              aria-label="Bring to front"
              title="Bring to front (⌘⇧])"
            >
              Front
            </button>
            <button
              className="secondary-button"
              type="button"
              data-testid="arrange-forward"
              onClick={() => onArrange("forward")}
              disabled={!hasSelection || !canDraw}
              aria-label="Bring forward"
              title="Bring forward (⌘])"
            >
              Forward
            </button>
            <button
              className="secondary-button"
              type="button"
              data-testid="arrange-backward"
              onClick={() => onArrange("backward")}
              disabled={!hasSelection || !canDraw}
              aria-label="Send backward"
              title="Send backward (⌘[)"
            >
              Backward
            </button>
            <button
              className="secondary-button"
              type="button"
              data-testid="arrange-back"
              onClick={() => onArrange("back")}
              disabled={!hasSelection || !canDraw}
              aria-label="Send to back"
              title="Send to back (⌘⇧[)"
            >
              Back
            </button>

            {hasSelection ? (
              <span data-testid="selection-count" aria-live="polite">
                {selectedCount} selected
              </span>
            ) : null}
          </div>
        </>,
      )}

      {panel(
        "checkpoints",
        "toolbar toolbar--checkpoints",
        "Board checkpoint controls",
        <div className="toolbar-group">
          <button
            className="secondary-button"
            type="button"
            onClick={onSaveCheckpoint}
            disabled={!canDraw}
          >
            Save Checkpoint
          </button>

          {checkpoints.length > 0 ? (
            <select
              data-testid="checkpoint-select"
              value={selectedCheckpointId ?? ""}
              onChange={(e) => onSelectCheckpoint(e.target.value)}
            >
              {checkpoints.map((cp) => {
                const date = new Date(cp.createdAt);
                const ts = date.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} — {ts}
                  </option>
                );
              })}
            </select>
          ) : null}

          <button
            className="secondary-button"
            type="button"
            data-testid="restore-button"
            onClick={onRestoreCheckpoint}
            disabled={!selectedCheckpointId || !canDraw}
          >
            Restore
          </button>
        </div>,
      )}

      {panel(
        "role",
        "toolbar toolbar--role",
        "Board role and help controls",
        <div className="toolbar-group">
          <span className="status-pill">Role: {roleLabel}</span>
          <button
            className="help-trigger"
            type="button"
            aria-label="Tools FAQ"
            onClick={onOpenHelp}
          >
            FAQ
          </button>
        </div>,
      )}

      {panel(
        "exports",
        "toolbar toolbar--exports",
        "Board export controls",
        <div className="toolbar-group">
          <button
            className="secondary-button"
            type="button"
            onClick={onExportPng}
            disabled={exportDisabled}
          >
            Export PNG
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={onExportMarkdown}
            disabled={exportDisabled}
          >
            Export Markdown
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={onExportPdf}
            disabled={exportDisabled}
          >
            Export PDF
          </button>
        </div>,
      )}
    </>
  );
}
