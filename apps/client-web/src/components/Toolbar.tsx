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

const tools: Array<{ id: Tool; label: string; hint: string; shortcut: string }> = [
  {
    id: "select",
    label: "Select",
    hint: "Move, resize, edit, and multi-select existing objects.",
    shortcut: "Esc clears selection",
  },
  {
    id: "pen",
    label: "Pen",
    hint: "Draw freehand strokes directly on the canvas.",
    shortcut: "Drag to draw",
  },
  {
    id: "rectangle",
    label: "Rectangle",
    hint: "Drag from one corner to create a rectangle.",
    shortcut: "Drag to size",
  },
  {
    id: "ellipse",
    label: "Ellipse",
    hint: "Drag from center bounds to create an ellipse.",
    shortcut: "Drag to size",
  },
  {
    id: "text",
    label: "Text",
    hint: "Place a text object, then double-click later to edit it.",
    shortcut: "Double-click edits",
  },
  {
    id: "note",
    label: "Note",
    hint: "Place a sticky note for structured thoughts.",
    shortcut: "Double-click edits",
  },
  {
    id: "laser",
    label: "Laser",
    hint: "Point temporarily for collaborators without creating objects.",
    shortcut: "Hold and move",
  },
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
  const activeToolConfig = tools.find((item) => item.id === activeTool) ?? tools[0];
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
        <>
          <div className="toolbar-context" aria-live="polite">
            <span className="toolbar-context-label">Active tool</span>
            <strong>{activeToolConfig.label}</strong>
            <small>{activeToolConfig.hint}</small>
            <small className="toolbar-shortcut">{activeToolConfig.shortcut}</small>
          </div>
          <div className="toolbar-group toolbar-group--tools" role="toolbar" aria-label="Drawing tools">
            {tools.map((tool) => (
              <button
                key={tool.id}
                className="tool-button"
                type="button"
                data-active={activeTool === tool.id}
                aria-pressed={activeTool === tool.id}
                aria-label={`${tool.label}: ${tool.hint}`}
                disabled={tool.id !== "select" && !canDraw}
                title={`${tool.label} — ${tool.hint}`}
                onClick={() => onToolChange(tool.id)}
              >
                <span>{tool.label}</span>
              </button>
            ))}
          </div>
          {!canDraw ? (
            <p className="toolbar-note" role="note">
              View-only access. Drawing tools are locked for this session.
            </p>
          ) : null}
        </>,
      )}

      {panel(
        "edit",
        "toolbar toolbar--edit",
        "Board edit controls",
        <>
          <div className="toolbar-context">
            <span className="toolbar-context-label">Selection</span>
            <strong>{hasSelection ? `${selectedCount} selected` : "Nothing selected"}</strong>
            <small>
              {hasSelection
                ? "Use edit controls, keyboard nudges, or arrange buttons."
                : "Switch to Select and click an object to edit it."}
            </small>
          </div>

          <div className="toolbar-group" role="toolbar" aria-label="Undo and redo controls">
            <button
              className="secondary-button"
              type="button"
              onClick={onUndo}
              disabled={undoCount === 0}
              aria-label={`Undo. ${undoCount} undo steps available.`}
              title="Undo (⌘Z / Ctrl+Z)"
            >
              Undo <span className="button-count">{undoCount}</span>
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onRedo}
              disabled={redoCount === 0}
              aria-label={`Redo. ${redoCount} redo steps available.`}
              title="Redo (⌘⇧Z / Ctrl+Shift+Z)"
            >
              Redo <span className="button-count">{redoCount}</span>
            </button>
          </div>

          <div className="toolbar-group" role="toolbar" aria-label="Selection arrange controls">
            <button
              className="secondary-button"
              type="button"
              data-testid="duplicate-button"
              onClick={onDuplicate}
              disabled={!hasSelection || !canDraw}
              title="Duplicate selection (⌘D / Ctrl+D)"
            >
              Duplicate
            </button>

            <button
              className="secondary-button"
              type="button"
              data-testid="arrange-front"
              onClick={() => onArrange("front")}
              disabled={!hasSelection || !canDraw}
              aria-label="Bring selected objects to front"
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
              aria-label="Bring selected objects forward"
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
              aria-label="Send selected objects backward"
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
              aria-label="Send selected objects to back"
              title="Send to back (⌘⇧[)"
            >
              Back
            </button>
          </div>
        </>,
      )}

      {panel(
        "checkpoints",
        "toolbar toolbar--checkpoints",
        "Board checkpoint controls",
        <>
          <div className="toolbar-context">
            <span className="toolbar-context-label">Checkpoints</span>
            <strong>{checkpoints.length}</strong>
            <small>Save before risky edits. Restore rewinds the board.</small>
          </div>
          <div className="toolbar-group">
            <button
              className="secondary-button"
              type="button"
              onClick={onSaveCheckpoint}
              disabled={!canDraw}
              title="Save the current board state as a checkpoint"
            >
              Save Checkpoint
            </button>

            {checkpoints.length > 0 ? (
              <select
                data-testid="checkpoint-select"
                aria-label="Choose checkpoint to restore"
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
            ) : (
              <span className="empty-inline">No checkpoints yet</span>
            )}

            <button
              className="secondary-button danger-action"
              type="button"
              data-testid="restore-button"
              onClick={onRestoreCheckpoint}
              disabled={!selectedCheckpointId || !canDraw}
              title="Restore the selected checkpoint after confirmation"
            >
              Restore
            </button>
          </div>
        </>,
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
        <>
          <div className="toolbar-context">
            <span className="toolbar-context-label">Export</span>
            <strong>{exportDisabled ? "Waiting for content" : "Ready"}</strong>
            <small>
              {exportDisabled
                ? "Add at least one board object before exporting."
                : "Choose the format that matches the handoff."}
            </small>
          </div>
          <div className="toolbar-group">
            <button
              className="secondary-button"
              type="button"
              onClick={onExportPng}
              disabled={exportDisabled}
            >
              PNG
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onExportMarkdown}
              disabled={exportDisabled}
            >
              Markdown
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onExportPdf}
              disabled={exportDisabled}
            >
              PDF
            </button>
          </div>
        </>,
      )}
    </>
  );
}
