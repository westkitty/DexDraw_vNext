import type { CheckpointSummary } from "@dexdraw/shared-protocol";
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
  exportDisabled: boolean;
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
  exportDisabled,
}: ToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="toolbar" aria-label="Board toolbar">
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

      <button
        className="secondary-button"
        type="button"
        onClick={onUndo}
        disabled={undoCount === 0}
        aria-label="Undo"
      >
        Undo
      </button>
      <button
        className="secondary-button"
        type="button"
        onClick={onRedo}
        disabled={redoCount === 0}
        aria-label="Redo"
      >
        Redo
      </button>

      <button
        className="secondary-button"
        type="button"
        data-testid="duplicate-button"
        onClick={onDuplicate}
        disabled={!hasSelection || !canDraw}
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
      >
        Back
      </button>

      {hasSelection ? (
        <span data-testid="selection-count" aria-live="polite">
          {selectedCount} selected
        </span>
      ) : null}

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
          {checkpoints.map((cp) => (
            <option key={cp.id} value={cp.id}>
              {cp.name}
            </option>
          ))}
        </select>
      ) : null}

      <button
        className="secondary-button"
        type="button"
        onClick={onRestoreCheckpoint}
        disabled={!selectedCheckpointId || !canDraw}
      >
        Restore
      </button>

      <span className="status-pill">Role: {roleLabel}</span>
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
    </div>
  );
}
