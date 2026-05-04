export type Tool = "pen" | "rectangle" | "ellipse" | "text" | "note" | "laser";

type ToolbarProps = {
  activeTool: Tool;
  canDraw: boolean;
  roleLabel: string;
  onToolChange: (tool: Tool) => void;
  onExportPng: () => void;
  exportDisabled: boolean;
};

const tools: Array<{ id: Tool; label: string }> = [
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
  onToolChange,
  onExportPng,
  exportDisabled,
}: ToolbarProps) {
  return (
    <div className="toolbar" aria-label="Board toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className="tool-button"
          type="button"
          data-active={activeTool === tool.id}
          aria-pressed={activeTool === tool.id}
          disabled={!canDraw}
          onClick={() => onToolChange(tool.id)}
        >
          {tool.label}
        </button>
      ))}
      <span className="status-pill">Role: {roleLabel}</span>
      <button
        className="secondary-button"
        type="button"
        onClick={onExportPng}
        disabled={exportDisabled}
      >
        Export PNG
      </button>
    </div>
  );
}
