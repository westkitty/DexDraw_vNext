type ConnectionStatus = "connecting" | "connected" | "disconnected";

const STATUS_ICON: Record<ConnectionStatus, string> = {
  connected: "●",
  connecting: "◌",
  disconnected: "○",
};

type Props = {
  connection: ConnectionStatus;
  participants: number;
  objectCount: number;
  selectedCount: number;
  checkpointCount: number;
  undoCount: number;
  redoCount: number;
};

export function MetricsStrip({
  connection,
  participants,
  objectCount,
  selectedCount,
  checkpointCount,
  undoCount,
  redoCount,
}: Props) {
  return (
    <div className="metrics-strip" data-testid="metrics-strip">
      <span
        className="metric"
        data-testid="metric-connection"
        data-status={connection}
      >
        {STATUS_ICON[connection]} {connection}
      </span>
      <span className="metric" data-testid="metric-participants">
        {participants} {participants === 1 ? "participant" : "participants"}
      </span>
      <span className="metric" data-testid="metric-objects">
        {objectCount} {objectCount === 1 ? "object" : "objects"}
      </span>
      <span className="metric" data-testid="metric-selected">
        {selectedCount} selected
      </span>
      <span className="metric" data-testid="metric-checkpoints">
        {checkpointCount} {checkpointCount === 1 ? "checkpoint" : "checkpoints"}
      </span>
      <span
        className="metric"
        data-testid="metric-undo"
        data-available={undoCount > 0}
      >
        undo ×{undoCount}
      </span>
      <span
        className="metric"
        data-testid="metric-redo"
        data-available={redoCount > 0}
      >
        redo ×{redoCount}
      </span>
    </div>
  );
}
